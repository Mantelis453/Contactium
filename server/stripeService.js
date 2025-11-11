import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

// Lazy-load Stripe to ensure environment variables are loaded first
let stripe = null
const getStripe = () => {
  if (!stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY is not set in environment variables')
    }
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
  }
  return stripe
}

// Lazy-load Supabase to ensure environment variables are loaded first
let supabase = null
const getSupabase = () => {
  if (!supabase) {
    if (!process.env.VITE_SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
      throw new Error('Supabase environment variables are not set')
    }
    supabase = createClient(
      process.env.VITE_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    )
  }
  return supabase
}

// Pricing configuration - lazy loaded to ensure env vars are available
const getPricing = () => ({
  free: {
    tier: 'free',
    emailLimit: 10,
    contactLimit: 25,
    campaignLimit: 1
  },
  starter: {
    tier: 'starter',
    priceId: process.env.STRIPE_STARTER_PRICE_ID,
    emailLimit: 500,
    contactLimit: 1000,
    campaignLimit: 5
  },
  professional: {
    tier: 'professional',
    priceId: process.env.STRIPE_PRO_PRICE_ID,
    emailLimit: 2500,
    contactLimit: 10000,
    campaignLimit: 20
  }
})

// Create a checkout session for subscription
export async function createCheckoutSession(userId, tier, email) {
  try {
    if (!getPricing()[tier] || tier === 'free') {
      throw new Error('Invalid subscription tier')
    }

    // Get or create Stripe customer
    const { data: userSettings } = await getSupabase()
      .from('user_settings')
      .select('stripe_customer_id')
      .eq('user_id', userId)
      .single()

    let customerId = userSettings?.stripe_customer_id

    if (!customerId) {
      const customer = await getStripe().customers.create({
        email,
        metadata: { userId }
      })
      customerId = customer.id

      // Save customer ID to database
      await getSupabase()
        .from('user_settings')
        .upsert({
          user_id: userId,
          stripe_customer_id: customerId
        })
    }

    // Create checkout session
    const session = await getStripe().checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: getPricing()[tier].priceId,
          quantity: 1
        }
      ],
      success_url: `${process.env.VITE_APP_URL}/settings?success=true`,
      cancel_url: `${process.env.VITE_APP_URL}/settings?canceled=true`,
      metadata: {
        userId,
        tier
      }
    })

    return { sessionId: session.id, url: session.url }
  } catch (error) {
    console.error('Error creating checkout session:', error)
    throw error
  }
}

// Create customer portal session for managing subscription
export async function createPortalSession(userId) {
  try {
    const { data: userSettings } = await getSupabase()
      .from('user_settings')
      .select('stripe_customer_id')
      .eq('user_id', userId)
      .single()

    if (!userSettings?.stripe_customer_id) {
      throw new Error('No Stripe customer found')
    }

    const session = await getStripe().billingPortal.sessions.create({
      customer: userSettings.stripe_customer_id,
      return_url: `${process.env.VITE_APP_URL}/settings`
    })

    return { url: session.url }
  } catch (error) {
    console.error('Error creating portal session:', error)
    throw error
  }
}

// Handle webhook events from Stripe
export async function handleWebhook(body, signature) {
  try {
    const event = getStripe().webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    )

    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutComplete(event.data.object)
        break

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionUpdate(event.data.object)
        break

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object)
        break

      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object)
        break

      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object)
        break

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return { received: true }
  } catch (error) {
    console.error('Webhook error:', error)
    throw error
  }
}

// Handle successful checkout
async function handleCheckoutComplete(session) {
  const userId = session.metadata.userId
  const tier = session.metadata.tier
  const customerId = session.customer
  const subscriptionId = session.subscription

  await getSupabase()
    .from('user_settings')
    .upsert({
      user_id: userId,
      subscription_tier: tier,
      subscription_status: 'active',
      stripe_customer_id: customerId,
      stripe_subscription_id: subscriptionId,
      emails_sent_this_month: 0,
      last_reset_date: new Date().toISOString()
    })

  console.log(`Subscription activated for user ${userId}: ${tier}`)
}

// Handle subscription updates
async function handleSubscriptionUpdate(subscription) {
  const customerId = subscription.customer

  const { data: userSettings } = await getSupabase()
    .from('user_settings')
    .select('user_id')
    .eq('stripe_customer_id', customerId)
    .single()

  if (!userSettings) return

  const tier = subscription.items.data[0].price.id === getPricing().starter.priceId
    ? 'starter'
    : 'professional'

  await getSupabase()
    .from('user_settings')
    .update({
      subscription_tier: tier,
      subscription_status: subscription.status,
      stripe_subscription_id: subscription.id,
      subscription_end_date: new Date(subscription.current_period_end * 1000).toISOString()
    })
    .eq('user_id', userSettings.user_id)

  console.log(`Subscription updated for user ${userSettings.user_id}`)
}

// Handle subscription cancellation
async function handleSubscriptionDeleted(subscription) {
  const customerId = subscription.customer

  const { data: userSettings } = await getSupabase()
    .from('user_settings')
    .select('user_id')
    .eq('stripe_customer_id', customerId)
    .single()

  if (!userSettings) return

  await getSupabase()
    .from('user_settings')
    .update({
      subscription_tier: 'free',
      subscription_status: 'canceled',
      subscription_end_date: new Date(subscription.ended_at * 1000).toISOString()
    })
    .eq('user_id', userSettings.user_id)

  console.log(`Subscription canceled for user ${userSettings.user_id}`)
}

// Handle successful payment
async function handlePaymentSucceeded(invoice) {
  const customerId = invoice.customer

  const { data: userSettings } = await getSupabase()
    .from('user_settings')
    .select('user_id')
    .eq('stripe_customer_id', customerId)
    .single()

  if (!userSettings) return

  // Reset monthly email counter on successful payment
  const lastResetDate = new Date(userSettings.last_reset_date || 0)
  const now = new Date()

  if (now.getMonth() !== lastResetDate.getMonth() || now.getFullYear() !== lastResetDate.getFullYear()) {
    await getSupabase()
      .from('user_settings')
      .update({
        emails_sent_this_month: 0,
        last_reset_date: now.toISOString()
      })
      .eq('user_id', userSettings.user_id)
  }

  console.log(`Payment succeeded for user ${userSettings.user_id}`)
}

// Handle failed payment
async function handlePaymentFailed(invoice) {
  const customerId = invoice.customer

  const { data: userSettings } = await getSupabase()
    .from('user_settings')
    .select('user_id')
    .eq('stripe_customer_id', customerId)
    .single()

  if (!userSettings) return

  await getSupabase()
    .from('user_settings')
    .update({
      subscription_status: 'past_due'
    })
    .eq('user_id', userSettings.user_id)

  console.log(`Payment failed for user ${userSettings.user_id}`)
}

// Check if user can send emails based on their subscription
export async function checkUsageLimit(userId) {
  try {
    const { data: userSettings } = await getSupabase()
      .from('user_settings')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (!userSettings) {
      // New user, set free tier defaults
      await getSupabase().from('user_settings').insert({
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
        emailLimit: getPricing().free.emailLimit,
        remaining: getPricing().free.emailLimit
      }
    }

    const tier = userSettings.subscription_tier || 'free'
    const limits = getPricing()[tier]

    // Check if we need to reset monthly counter
    const lastResetDate = new Date(userSettings.last_reset_date || 0)
    const now = new Date()

    if (now.getMonth() !== lastResetDate.getMonth() || now.getFullYear() !== lastResetDate.getFullYear()) {
      await getSupabase()
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
  } catch (error) {
    console.error('Error checking usage limit:', error)
    throw error
  }
}

// Increment email counter
export async function incrementEmailCount(userId, count = 1) {
  try {
    const { data: userSettings } = await getSupabase()
      .from('user_settings')
      .select('emails_sent_this_month')
      .eq('user_id', userId)
      .single()

    const currentCount = userSettings?.emails_sent_this_month || 0

    await getSupabase()
      .from('user_settings')
      .update({
        emails_sent_this_month: currentCount + count
      })
      .eq('user_id', userId)

    return { success: true }
  } catch (error) {
    console.error('Error incrementing email count:', error)
    throw error
  }
}

// Get subscription info for user
export async function getSubscriptionInfo(userId) {
  try {
    const { data: userSettings } = await getSupabase()
      .from('user_settings')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (!userSettings) {
      return {
        tier: 'free',
        status: 'active',
        limits: getPricing().free
      }
    }

    const tier = userSettings.subscription_tier || 'free'

    return {
      tier,
      status: userSettings.subscription_status || 'active',
      limits: getPricing()[tier],
      emailsSent: userSettings.emails_sent_this_month || 0,
      subscriptionEndDate: userSettings.subscription_end_date,
      stripeCustomerId: userSettings.stripe_customer_id,
      stripeSubscriptionId: userSettings.stripe_subscription_id
    }
  } catch (error) {
    console.error('Error getting subscription info:', error)
    throw error
  }
}
