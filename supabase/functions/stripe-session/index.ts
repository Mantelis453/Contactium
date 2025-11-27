import { corsHeaders } from '../_shared/cors.ts'
import { createSupabaseClient } from '../_shared/supabase.ts'
import { createCheckoutSession, createPortalSession } from '../_shared/stripe.ts'

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { type, userId, tier, couponCode } = await req.json()

    console.log('[Session] Request:', { type, userId: userId ? '***' : undefined, tier, couponCode: couponCode ? '***' : undefined })

    if (!type) {
      return new Response(
        JSON.stringify({ error: 'Session type is required (checkout or portal)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (type === 'checkout') {
      if (!userId || !tier) {
        console.error('[Session] Missing userId or tier:', { userId: !!userId, tier: !!tier })
        return new Response(
          JSON.stringify({
            error: 'Missing required fields for checkout: userId, tier'
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      console.log('[Session] Fetching user from Supabase auth...')

      // Get user email from Supabase auth
      const supabase = createSupabaseClient()
      const { data: { user }, error: userError } = await supabase.auth.admin.getUserById(userId)

      if (userError) {
        console.error('[Session] Supabase auth error:', userError)
        return new Response(
          JSON.stringify({
            error: 'Failed to fetch user data',
            details: userError.message
          }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      if (!user) {
        console.error('[Session] User not found:', userId)
        return new Response(
          JSON.stringify({ error: 'User not found' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      console.log('[Session] User found, email:', user.email ? '***@***' : 'missing')

      if (!user.email) {
        console.error('[Session] User has no email address')
        return new Response(
          JSON.stringify({ error: 'User email not found' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      console.log('[Session] Creating checkout session...')
      const session = await createCheckoutSession(userId, tier, user.email, couponCode)
      console.log('[Session] Checkout session created successfully')

      return new Response(
        JSON.stringify({ url: session.url, upgraded: session.upgraded }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (type === 'portal') {
      if (!userId) {
        console.error('[Session] Missing userId for portal')
        return new Response(
          JSON.stringify({
            error: 'Missing required fields for portal: userId'
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      console.log('[Session] Creating portal session...')
      const session = await createPortalSession(userId)
      console.log('[Session] Portal session created successfully')

      return new Response(
        JSON.stringify({ url: session.url }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Invalid session type. Must be "checkout" or "portal"' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('[Session] Error:', error)
    return new Response(
      JSON.stringify({
        error: error.message || 'Internal server error',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
