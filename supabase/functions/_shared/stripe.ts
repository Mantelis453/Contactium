import Stripe from 'stripe'
import { createSupabaseClient } from './supabase.ts'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2023-10-16',
})

const pricing = {
  free: {
    tier: 'free',
    emailLimit: 10,
    contactLimit: 25,
    campaignLimit: 1
  },
  starter: {
    tier: 'starter',
    priceId: Deno.env.get('STRIPE_STARTER_PRICE_ID')!,
    emailLimit: 500,
    contactLimit: 1000,
    campaignLimit: 5
  },
  professional: {
    tier: 'professional',
    priceId: Deno.env.get('STRIPE_PRO_PRICE_ID')!,
    emailLimit: 2500,
    contactLimit: 10000,
    campaignLimit: 20
  }
}

export async function createCheckoutSession(userId: string, tier: string, email: string, couponCode?: string) {
  const supabase = createSupabaseClient()

  if (!pricing[tier as keyof typeof pricing] || tier === 'free') {
    throw new Error('Invalid subscription tier')
  }

  // Validate coupon code if provided
  let validCoupon = null
  if (couponCode) {
    validCoupon = await validateCoupon(couponCode)
    if (!validCoupon) {
      throw new Error('Invalid or expired coupon code')
    }
  }

  // Get or create Stripe customer
  const { data: userSettings } = await supabase
    .from('user_settings')
    .select('stripe_customer_id, stripe_subscription_id, subscription_tier')
    .eq('user_id', userId)
    .single()

  let customerId = userSettings?.stripe_customer_id
  let needsNewCustomer = false

  // Check if customer ID exists and is valid in Stripe
  if (customerId) {
    try {
      // Try to retrieve the customer to verify it exists in current mode
      await stripe.customers.retrieve(customerId)
    } catch (error) {
      // Customer doesn't exist (e.g., test mode ID in live mode)
      console.log(`[Checkout] Customer ${customerId} not found in current Stripe mode, creating new customer`)
      needsNewCustomer = true
    }
  } else {
    needsNewCustomer = true
  }

  if (needsNewCustomer) {
    const customer = await stripe.customers.create({
      email,
      metadata: { userId }
    })
    customerId = customer.id

    // Save new customer ID to database
    await supabase
      .from('user_settings')
      .upsert({
        user_id: userId,
        stripe_customer_id: customerId
      })
  }

  // Check for existing active subscription
  if (userSettings?.stripe_subscription_id) {
    try {
      const existingSubscription = await stripe.subscriptions.retrieve(userSettings.stripe_subscription_id)

      // If subscription is active or trialing, we need to handle the upgrade/change
      if (existingSubscription.status === 'active' || existingSubscription.status === 'trialing') {
        const currentPriceId = existingSubscription.items.data[0]?.price.id
        const newPriceId = pricing[tier as keyof typeof pricing].priceId

        // If trying to subscribe to the same plan, return error
        if (currentPriceId === newPriceId) {
          throw new Error('You are already subscribed to this plan')
        }

        // Update the existing subscription instead of creating a new one
        console.log('[Checkout] Updating existing subscription from', currentPriceId, 'to', newPriceId)

        const updatedSubscription = await stripe.subscriptions.update(existingSubscription.id, {
          items: [{
            id: existingSubscription.items.data[0].id,
            price: newPriceId
          }],
          proration_behavior: 'always_invoice', // Charge/credit immediately for the change
          billing_cycle_anchor: 'unchanged' // Keep the same billing date
        })

        // Update database immediately
        await supabase
          .from('user_settings')
          .update({
            subscription_tier: tier,
            subscription_status: 'active',
            subscription_end_date: new Date(updatedSubscription.current_period_end * 1000).toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId)

        // Return success - no need for checkout
        return {
          sessionId: null,
          url: `${Deno.env.get('APP_URL')}/settings?upgraded=true`,
          upgraded: true
        }
      } else {
        // If subscription is canceled, past_due, or incomplete, cancel it properly
        console.log('[Checkout] Canceling previous subscription with status:', existingSubscription.status)
        await stripe.subscriptions.cancel(existingSubscription.id)
      }
    } catch (error) {
      // If subscription doesn't exist or can't be retrieved, continue with new checkout
      console.log('[Checkout] Could not retrieve existing subscription:', error.message)
    }
  }

  // Create checkout session for new subscription
  const sessionParams: Stripe.Checkout.SessionCreateParams = {
    customer: customerId,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [
      {
        price: pricing[tier as keyof typeof pricing].priceId,
        quantity: 1
      }
    ],
    success_url: `${Deno.env.get('APP_URL')}/settings?success=true`,
    cancel_url: `${Deno.env.get('APP_URL')}/settings?canceled=true`,
    metadata: {
      userId,
      tier,
      couponCode: couponCode || ''
    },
    subscription_data: {
      metadata: {
        userId,
        tier
      }
    }
  }

  // Add discount if valid coupon provided
  if (validCoupon) {
    sessionParams.discounts = [{ promotion_code: validCoupon.id }]
  }

  const session = await stripe.checkout.sessions.create(sessionParams)

  // Track coupon usage in database if applied
  if (validCoupon && couponCode) {
    try {
      await supabase.from('coupon_redemptions').insert({
        user_id: userId,
        coupon_code: couponCode,
        stripe_coupon_id: validCoupon.coupon.id,
        discount_amount: validCoupon.coupon.amount_off ? validCoupon.coupon.amount_off / 100 : null,
        discount_percent: validCoupon.coupon.percent_off || null
      })
    } catch (error) {
      console.error('Failed to track coupon usage:', error)
      // Don't fail the checkout if tracking fails
    }
  }

  return { sessionId: session.id, url: session.url }
}

export async function createPortalSession(userId: string) {
  const supabase = createSupabaseClient()

  const { data: userSettings } = await supabase
    .from('user_settings')
    .select('stripe_customer_id')
    .eq('user_id', userId)
    .single()

  if (!userSettings?.stripe_customer_id) {
    throw new Error('No Stripe customer found')
  }

  let customerId = userSettings.stripe_customer_id

  // Verify customer exists in Stripe (handles test mode to live mode migration)
  try {
    await stripe.customers.retrieve(customerId)
  } catch (error) {
    throw new Error('Stripe customer not found in current mode. Please complete a new checkout to update your account.')
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${Deno.env.get('APP_URL')}/settings`
  })

  return { url: session.url }
}

export async function getSubscriptionInfo(userId: string) {
  const supabase = createSupabaseClient()

  const { data: userSettings } = await supabase
    .from('user_settings')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (!userSettings) {
    return {
      tier: 'free',
      status: 'active',
      limits: pricing.free
    }
  }

  const tier = userSettings.subscription_tier || 'free'

  return {
    tier,
    status: userSettings.subscription_status || 'active',
    limits: pricing[tier as keyof typeof pricing],
    emailsSent: userSettings.emails_sent_this_month || 0,
    subscriptionEndDate: userSettings.subscription_end_date,
    stripeCustomerId: userSettings.stripe_customer_id,
    stripeSubscriptionId: userSettings.stripe_subscription_id
  }
}

export async function checkUsageLimit(userId: string) {
  const supabase = createSupabaseClient()

  const { data: userSettings } = await supabase
    .from('user_settings')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (!userSettings) {
    // New user, set free tier defaults
    await supabase.from('user_settings').insert({
      user_id: userId,
      subscription_tier: 'free',
      subscription_status: 'active',
      emails_sent_this_month: 0,
      last_reset_date: new Date().toISOString()
    })

    return {
      canSend: true,
      tier: 'free',
      emailsSent: 0,
      emailLimit: pricing.free.emailLimit,
      remaining: pricing.free.emailLimit
    }
  }

  const tier = userSettings.subscription_tier || 'free'
  const limits = pricing[tier as keyof typeof pricing]

  // Check if we need to reset monthly counter
  const lastResetDate = new Date(userSettings.last_reset_date || 0)
  const now = new Date()

  if (now.getMonth() !== lastResetDate.getMonth() || now.getFullYear() !== lastResetDate.getFullYear()) {
    await supabase
      .from('user_settings')
      .update({
        emails_sent_this_month: 0,
        last_reset_date: now.toISOString()
      })
      .eq('user_id', userId)

    userSettings.emails_sent_this_month = 0
  }

  const emailsSent = userSettings.emails_sent_this_month || 0
  const canSend = emailsSent < limits.emailLimit

  return {
    canSend,
    tier,
    emailsSent,
    emailLimit: limits.emailLimit,
    remaining: limits.emailLimit - emailsSent,
    status: userSettings.subscription_status
  }
}

export async function incrementEmailCount(userId: string, count = 1) {
  const supabase = createSupabaseClient()

  const { data: userSettings } = await supabase
    .from('user_settings')
    .select('emails_sent_this_month')
    .eq('user_id', userId)
    .single()

  const currentCount = userSettings?.emails_sent_this_month || 0

  await supabase
    .from('user_settings')
    .update({
      emails_sent_this_month: currentCount + count
    })
    .eq('user_id', userId)

  return { success: true }
}

export async function getBillingInfo(userId: string) {
  const supabase = createSupabaseClient()

  const { data: userSettings } = await supabase
    .from('user_settings')
    .select('stripe_customer_id, stripe_subscription_id')
    .eq('user_id', userId)
    .single()

  if (!userSettings?.stripe_customer_id || !userSettings?.stripe_subscription_id) {
    return null
  }

  try {
    // Get subscription details
    const subscription = await stripe.subscriptions.retrieve(userSettings.stripe_subscription_id, {
      expand: ['default_payment_method']
    })

    // Get payment method
    let paymentMethod = null
    if (subscription.default_payment_method && typeof subscription.default_payment_method === 'object') {
      const pm = subscription.default_payment_method as Stripe.PaymentMethod
      if (pm.card) {
        paymentMethod = {
          brand: pm.card.brand,
          last4: pm.card.last4,
          exp_month: pm.card.exp_month,
          exp_year: pm.card.exp_year
        }
      }
    }

    // Get upcoming invoice (next billing date and amount)
    let nextBillingDate = null
    let amount = null
    try {
      const upcomingInvoice = await stripe.invoices.retrieveUpcoming({
        customer: userSettings.stripe_customer_id
      })
      nextBillingDate = upcomingInvoice.next_payment_attempt ? new Date(upcomingInvoice.next_payment_attempt * 1000).toISOString() : null
      amount = upcomingInvoice.amount_due
    } catch (err) {
      console.log('No upcoming invoice found:', err)
    }

    // Get recent invoices (last 5)
    const invoicesList = await stripe.invoices.list({
      customer: userSettings.stripe_customer_id,
      limit: 5
    })

    const invoices = invoicesList.data.map(invoice => ({
      id: invoice.id,
      amount: invoice.amount_paid,
      status: invoice.status,
      created: invoice.created,
      invoice_pdf: invoice.invoice_pdf,
      description: invoice.lines.data[0]?.description || 'Subscription'
    }))

    return {
      nextBillingDate,
      amount,
      paymentMethod,
      invoices
    }
  } catch (error) {
    console.error('Error fetching billing info:', error)
    throw error
  }
}

// Validate a coupon code with Stripe
export async function validateCoupon(couponCode: string) {
  try {
    // Try to retrieve as a promotion code first
    const promotionCodes = await stripe.promotionCodes.list({
      code: couponCode,
      active: true,
      limit: 1
    })

    if (promotionCodes.data.length > 0) {
      const promoCode = promotionCodes.data[0]

      // Check if promotion code is valid
      if (promoCode.active && (!promoCode.expires_at || promoCode.expires_at > Date.now() / 1000)) {
        // Expand coupon details
        const fullPromoCode = await stripe.promotionCodes.retrieve(promoCode.id, {
          expand: ['coupon']
        })
        return fullPromoCode
      }
    }

    // If not found as promotion code, try as direct coupon
    try {
      const coupon = await stripe.coupons.retrieve(couponCode)
      if (coupon.valid) {
        return { id: coupon.id, coupon }
      }
    } catch (err) {
      // Coupon not found, that's ok
    }

    return null
  } catch (error) {
    console.error('Error validating coupon:', error)
    return null
  }
}

// Create a new promotion code (for admin use)
export async function createPromotionCode(params: {
  couponId?: string
  code: string
  percentOff?: number
  amountOff?: number
  duration?: 'once' | 'repeating' | 'forever'
  durationInMonths?: number
  maxRedemptions?: number
  expiresAt?: number
}) {
  try {
    let couponId = params.couponId

    // Create coupon if not provided
    if (!couponId) {
      const couponParams: Stripe.CouponCreateParams = {
        duration: params.duration || 'once',
        name: params.code
      }

      if (params.percentOff) {
        couponParams.percent_off = params.percentOff
      } else if (params.amountOff) {
        couponParams.amount_off = params.amountOff
        couponParams.currency = 'usd'
      } else {
        throw new Error('Either percentOff or amountOff is required')
      }

      if (params.duration === 'repeating' && params.durationInMonths) {
        couponParams.duration_in_months = params.durationInMonths
      }

      const coupon = await stripe.coupons.create(couponParams)
      couponId = coupon.id
    }

    // Create promotion code
    const promoCodeParams: Stripe.PromotionCodeCreateParams = {
      coupon: couponId,
      code: params.code,
      active: true
    }

    if (params.maxRedemptions) {
      promoCodeParams.max_redemptions = params.maxRedemptions
    }

    if (params.expiresAt) {
      promoCodeParams.expires_at = params.expiresAt
    }

    const promotionCode = await stripe.promotionCodes.create(promoCodeParams)

    return {
      success: true,
      promotionCode,
      couponId
    }
  } catch (error) {
    console.error('Error creating promotion code:', error)
    throw error
  }
}

// List all promotion codes from Stripe
export async function listPromotionCodes(limit = 100) {
  try {
    const promotionCodes = await stripe.promotionCodes.list({
      limit,
      expand: ['data.coupon']
    })

    return promotionCodes.data.map(promo => ({
      id: promo.id,
      code: promo.code,
      active: promo.active,
      couponId: promo.coupon.id,
      percentOff: (promo.coupon as any).percent_off,
      amountOff: (promo.coupon as any).amount_off,
      duration: (promo.coupon as any).duration,
      maxRedemptions: promo.max_redemptions,
      timesRedeemed: promo.times_redeemed,
      expiresAt: promo.expires_at,
      created: promo.created
    }))
  } catch (error) {
    console.error('Error listing promotion codes:', error)
    throw error
  }
}
