import { corsHeaders } from '../_shared/cors.ts'
import { createSupabaseClient } from '../_shared/supabase.ts'
import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2024-11-20.acacia',
  httpClient: Stripe.createFetchHttpClient(),
})

// Prevent event loop errors
globalThis.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled rejection:', event.reason)
  event.preventDefault()
})

const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')

// Price ID to tier mapping
const PRICE_TIER_MAP: Record<string, string> = {
  [Deno.env.get('STRIPE_STARTER_PRICE_ID') || '']: 'starter',
  [Deno.env.get('STRIPE_PRO_PRICE_ID') || '']: 'professional',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const signature = req.headers.get('stripe-signature')

  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET not configured')
    return new Response('Webhook secret not configured', { status: 500 })
  }

  try {
    const body = await req.text()

    let event: Stripe.Event

    // Verify webhook signature in production
    if (signature) {
      try {
        event = await stripe.webhooks.constructEventAsync(
          body,
          signature,
          webhookSecret,
          undefined,
          Stripe.createSubtleCryptoProvider()
        )
      } catch (err) {
        console.error('Webhook signature verification failed:', err.message)
        return new Response(`Webhook Error: ${err.message}`, { status: 400 })
      }
    } else {
      // For testing without signature
      event = JSON.parse(body)
    }

    console.log('[Webhook] Event received:', event.type)

    const supabase = createSupabaseClient()

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        console.log('[Webhook] Checkout completed:', session.id)

        // Get customer email
        const customer = await stripe.customers.retrieve(session.customer as string) as Stripe.Customer
        const email = customer.email

        if (!email) {
          console.error('[Webhook] No email found for customer')
          break
        }

        // Find user by email
        const { data: { users }, error: userError } = await supabase.auth.admin.listUsers()

        if (userError) {
          console.error('[Webhook] Error listing users:', userError)
          break
        }

        const user = users.find(u => u.email === email)
        if (!user) {
          console.error('[Webhook] User not found for email:', email)
          break
        }

        console.log('[Webhook] Found user:', user.id)

        // Get current user settings to check for existing subscription
        const { data: existingSettings } = await supabase
          .from('user_settings')
          .select('stripe_subscription_id')
          .eq('user_id', user.id)
          .single()

        // If user has a different subscription, cancel it in Stripe
        if (existingSettings?.stripe_subscription_id && existingSettings.stripe_subscription_id !== session.subscription) {
          try {
            console.log('[Webhook] Canceling old subscription:', existingSettings.stripe_subscription_id)
            await stripe.subscriptions.cancel(existingSettings.stripe_subscription_id)
          } catch (error) {
            console.error('[Webhook] Error canceling old subscription:', error)
          }
        }

        // Get subscription details
        let subscriptionId: string | null = null
        let priceId: string | null = null
        let currentPeriodEnd: number | null = null

        if (session.subscription) {
          subscriptionId = session.subscription as string
          const subscription = await stripe.subscriptions.retrieve(subscriptionId)
          priceId = subscription.items.data[0]?.price.id
          currentPeriodEnd = subscription.current_period_end
        } else if (session.line_items) {
          const lineItems = await stripe.checkout.sessions.listLineItems(session.id)
          priceId = lineItems.data[0]?.price?.id
        }

        // Determine tier from price ID
        const tier = priceId && PRICE_TIER_MAP[priceId] ? PRICE_TIER_MAP[priceId] : 'free'

        console.log('[Webhook] Updating subscription:', { userId: user.id, tier, priceId })

        // Update user_settings table
        const { error: updateError } = await supabase
          .from('user_settings')
          .upsert({
            user_id: user.id,
            stripe_customer_id: session.customer as string,
            stripe_subscription_id: subscriptionId,
            subscription_tier: tier,
            subscription_status: 'active',
            subscription_end_date: currentPeriodEnd
              ? new Date(currentPeriodEnd * 1000).toISOString()
              : null,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'user_id'
          })

        if (updateError) {
          console.error('[Webhook] Error updating subscription:', updateError)
        } else {
          console.log('[Webhook] Successfully updated subscription for user:', user.id)
        }

        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        console.log('[Webhook] Subscription updated:', subscription.id)

        // Find user by customer ID
        const { data: settings, error: settingsError } = await supabase
          .from('user_settings')
          .select('user_id')
          .eq('stripe_customer_id', subscription.customer as string)
          .single()

        if (settingsError || !settings) {
          console.error('[Webhook] Settings not found for customer:', subscription.customer)
          break
        }

        // Get price ID and determine tier
        const priceId = subscription.items.data[0]?.price.id
        const tier = priceId && PRICE_TIER_MAP[priceId] ? PRICE_TIER_MAP[priceId] : 'free'

        // Map Stripe status to our status
        let status = 'active'
        if (subscription.status === 'canceled' || subscription.status === 'incomplete_expired') {
          status = 'canceled'
        } else if (subscription.status === 'past_due') {
          status = 'past_due'
        }

        console.log('[Webhook] Updating subscription:', { tier, status })

        const { error: updateError } = await supabase
          .from('user_settings')
          .update({
            subscription_tier: tier,
            subscription_status: status,
            subscription_end_date: new Date(subscription.current_period_end * 1000).toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('user_id', settings.user_id)

        if (updateError) {
          console.error('[Webhook] Error updating subscription:', updateError)
        } else {
          console.log('[Webhook] Successfully updated subscription')
        }

        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        console.log('[Webhook] Subscription deleted:', subscription.id)

        // Find user by customer ID
        const { data: settings, error: settingsError } = await supabase
          .from('user_settings')
          .select('user_id')
          .eq('stripe_customer_id', subscription.customer as string)
          .single()

        if (settingsError || !settings) {
          console.error('[Webhook] Settings not found for customer:', subscription.customer)
          break
        }

        // Revert to free tier
        const { error: updateError } = await supabase
          .from('user_settings')
          .update({
            subscription_tier: 'free',
            subscription_status: 'canceled',
            subscription_end_date: null,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', settings.user_id)

        if (updateError) {
          console.error('[Webhook] Error updating subscription:', updateError)
        } else {
          console.log('[Webhook] Successfully reverted to free tier')
        }

        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        console.log('[Webhook] Payment succeeded for invoice:', invoice.id)
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        console.log('[Webhook] Payment failed for invoice:', invoice.id)

        // Find user by customer ID
        const { data: settings } = await supabase
          .from('user_settings')
          .select('user_id')
          .eq('stripe_customer_id', invoice.customer as string)
          .single()

        if (settings) {
          await supabase
            .from('user_settings')
            .update({
              subscription_status: 'past_due',
              updated_at: new Date().toISOString()
            })
            .eq('user_id', settings.user_id)
        }

        break
      }

      default:
        console.log('[Webhook] Unhandled event type:', event.type)
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (err) {
    console.error('[Webhook] Error:', err)
    console.error('[Webhook] Error message:', err.message)
    console.error('[Webhook] Error stack:', err.stack)
    return new Response(
      JSON.stringify({ error: err.message, details: err.stack }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
