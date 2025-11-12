import { corsHeaders } from '../_shared/cors.ts'
import { getSubscriptionInfo, checkUsageLimit } from '../_shared/stripe.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    const userId = url.searchParams.get('userId')
    const type = url.searchParams.get('type')

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'User ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!type) {
      return new Response(
        JSON.stringify({ error: 'Type is required (subscription or usage)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (type === 'subscription') {
      const info = await getSubscriptionInfo(userId)
      return new Response(
        JSON.stringify(info),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (type === 'usage') {
      const usage = await checkUsageLimit(userId)
      return new Response(
        JSON.stringify(usage),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Invalid type. Must be "subscription" or "usage"' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error getting stripe data:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
