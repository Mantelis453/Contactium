import { corsHeaders } from '../_shared/cors.ts'
import { createSupabaseClient } from '../_shared/supabase.ts'
import { createPromotionCode, validateCoupon } from '../_shared/stripe.ts'

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { action, userId, ...params } = await req.json()

    console.log('[Admin Coupons] Request:', { action, userId: userId ? '***' : undefined })

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'User ID required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify admin access
    const supabase = createSupabaseClient()
    const { data: adminCheck } = await supabase
      .from('admin_users')
      .select('role')
      .eq('user_id', userId)
      .single()

    if (!adminCheck) {
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Handle different actions
    switch (action) {
      case 'create': {
        const { code, percentOff, amountOff, duration, durationInMonths, maxRedemptions, expiresAt } = params

        if (!code) {
          return new Response(
            JSON.stringify({ error: 'Coupon code is required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        if (!percentOff && !amountOff) {
          return new Response(
            JSON.stringify({ error: 'Either percentOff or amountOff is required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        const result = await createPromotionCode({
          code,
          percentOff,
          amountOff,
          duration: duration || 'once',
          durationInMonths,
          maxRedemptions,
          expiresAt
        })

        return new Response(
          JSON.stringify({
            success: true,
            message: `Coupon code "${code}" created successfully`,
            data: result
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'validate': {
        const { code } = params

        if (!code) {
          return new Response(
            JSON.stringify({ error: 'Coupon code is required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        const coupon = await validateCoupon(code)

        if (!coupon) {
          return new Response(
            JSON.stringify({
              valid: false,
              message: 'Invalid or expired coupon code'
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        return new Response(
          JSON.stringify({
            valid: true,
            message: 'Coupon is valid',
            data: {
              code,
              percentOff: coupon.coupon.percent_off,
              amountOff: coupon.coupon.amount_off,
              duration: coupon.coupon.duration,
              maxRedemptions: coupon.max_redemptions,
              timesRedeemed: coupon.times_redeemed
            }
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'list': {
        // Get redemption history from database
        const { data: redemptions, error } = await supabase
          .from('coupon_redemptions')
          .select('*')
          .order('redeemed_at', { ascending: false })
          .limit(100)

        if (error) {
          console.error('Error fetching redemptions:', error)
          return new Response(
            JSON.stringify({ error: 'Failed to fetch coupon redemptions' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        return new Response(
          JSON.stringify({
            success: true,
            data: redemptions || []
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action. Must be "create", "validate", or "list"' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
  } catch (error) {
    console.error('[Admin Coupons] Error:', error)
    return new Response(
      JSON.stringify({
        error: error.message || 'Internal server error'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
