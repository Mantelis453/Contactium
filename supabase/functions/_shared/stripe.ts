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

export async function createCheckoutSession(userId: string, tier: string, email: string) {
  const supabase = createSupabaseClient()

  if (!pricing[tier as keyof typeof pricing] || tier === 'free') {
    throw new Error('Invalid subscription tier')
  }

  // Get or create Stripe customer
  const { data: userSettings } = await supabase
    .from('user_settings')
    .select('stripe_customer_id')
    .eq('user_id', userId)
    .single()

  let customerId = userSettings?.stripe_customer_id

  if (!customerId) {
    const customer = await stripe.customers.create({
      email,
      metadata: { userId }
    })
    customerId = customer.id

    // Save customer ID to database
    await supabase
      .from('user_settings')
      .upsert({
        user_id: userId,
        stripe_customer_id: customerId
      })
  }

  // Create checkout session
  const session = await stripe.checkout.sessions.create({
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
      tier
    }
  })

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

  const session = await stripe.billingPortal.sessions.create({
    customer: userSettings.stripe_customer_id,
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
