import { corsHeaders } from '../_shared/cors.ts'
import { createSupabaseClient } from '../_shared/supabase.ts'
import Stripe from 'stripe'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
})

const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const signature = req.headers.get('stripe-signature')

  if (!signature) {
    return new Response('No signature', { status: 400 })
  }

  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET not configured')
    return new Response('Webhook secret not configured', { status: 500 })
  }

  try {
    const body = await req.text()
    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret)

    console.log('Webhook event received:', event.type)

    const supabase = createSupabaseClient()

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        console.log('Checkout completed for customer:', session.customer)

        // Get customer email to find user
        const customer = await stripe.customers.retrieve(session.customer as string) as Stripe.Customer
        const email = customer.email

        if (!email) {
          console.error('No email found for customer')
          break
        }

        // Find user by email
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('id')
          .eq('email', email)
          .single()

        if (userError || !userData) {
          console.error('User not found for email:', email)
          break
        }

        // Determine tier from price ID
        const priceId = session.line_items?.data[0]?.price?.id || session.metadata?.priceId
        let tier = 'free'

        const starterPriceId = Deno.env.get('STRIPE_STARTER_PRICE_ID')
        const proPriceId = Deno.env.get('STRIPE_PRO_PRICE_ID')

        if (priceId === starterPriceId) {
          tier = 'starter'
        } else if (priceId === proPriceId) {
          tier = 'professional'
        }

        console.log('Updating user', userData.id, 'to tier:', tier)

        // Update user_subscriptions table
        const { error: updateError } = await supabase
          .from('user_subscriptions')
          .upsert({
            user_id: userData.id,
            stripe_customer_id: session.customer as string,
            stripe_subscription_id: session.subscription as string,
            tier: tier,
            status: 'active',
            current_period_end: session.subscription
              ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
              : null,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'user_id'
          })

        if (updateError) {
          console.error('Error updating subscription:', updateError)
        } else {
          console.log('Successfully updated subscription for user:', userData.id)
        }

        break
      }

      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        console.log('Subscription event:', event.type, subscription.id)

        // Find user by customer ID
        const { data: subData, error: subError } = await supabase
          .from('user_subscriptions')
          .select('user_id')
          .eq('stripe_customer_id', subscription.customer as string)
          .single()

        if (subError || !subData) {
          console.error('Subscription not found for customer:', subscription.customer)
          break
        }

        let status = 'active'
        if (subscription.status === 'canceled' || subscription.status === 'incomplete_expired') {
          status = 'canceled'
        } else if (subscription.status === 'past_due') {
          status = 'past_due'
        }

        // Determine tier from price ID
        const priceId = subscription.items.data[0]?.price.id
        let tier = 'free'

        const starterPriceId = Deno.env.get('STRIPE_STARTER_PRICE_ID')
        const proPriceId = Deno.env.get('STRIPE_PRO_PRICE_ID')

        if (priceId === starterPriceId) {
          tier = 'starter'
        } else if (priceId === proPriceId) {
          tier = 'professional'
        }

        // If subscription is canceled, revert to free
        if (event.type === 'customer.subscription.deleted') {
          tier = 'free'
          status = 'canceled'
        }

        console.log('Updating subscription to tier:', tier, 'status:', status)

        const { error: updateError } = await supabase
          .from('user_subscriptions')
          .update({
            tier: tier,
            status: status,
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('user_id', subData.user_id)

        if (updateError) {
          console.error('Error updating subscription:', updateError)
        } else {
          console.log('Successfully updated subscription')
        }

        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        console.log('Payment succeeded for invoice:', invoice.id)
        // Email usage is reset monthly, no action needed here
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        console.log('Payment failed for invoice:', invoice.id)

        // Find user by customer ID
        const { data: subData } = await supabase
          .from('user_subscriptions')
          .select('user_id')
          .eq('stripe_customer_id', invoice.customer as string)
          .single()

        if (subData) {
          await supabase
            .from('user_subscriptions')
            .update({
              status: 'past_due',
              updated_at: new Date().toISOString()
            })
            .eq('user_id', subData.user_id)
        }

        break
      }

      default:
        console.log('Unhandled event type:', event.type)
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (err) {
    console.error('Webhook error:', err)
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
