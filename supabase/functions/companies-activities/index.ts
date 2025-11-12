import { corsHeaders } from '../_shared/cors.ts'
import { createSupabaseClient } from '../_shared/supabase.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const supabase = createSupabaseClient()

  try {
    const { data, error } = await supabase
      .from('companies')
      .select('activity')
      .not('activity', 'is', null)
      .limit(1000)

    if (error) throw error

    const activities = [...new Set(data.map(d => d.activity))].filter(Boolean).sort()

    return new Response(
      JSON.stringify({ activities }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error fetching activities:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
