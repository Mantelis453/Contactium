import { corsHeaders } from '../_shared/cors.ts'
import { createSupabaseClient } from '../_shared/supabase.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const supabase = createSupabaseClient()

  try {
    // Use a more efficient query to get ALL distinct activities
    // This groups by activity and only returns unique values
    const { data, error } = await supabase
      .rpc('get_distinct_activities')

    if (error) {
      // Fallback: fetch all companies in batches and get unique activities
      console.warn('RPC not available, using fallback method')
      const activities = new Set<string>()
      let offset = 0
      const batchSize = 1000
      let hasMore = true

      while (hasMore) {
        const { data: batch, error: batchError } = await supabase
          .from('companies')
          .select('activity')
          .not('activity', 'is', null)
          .range(offset, offset + batchSize - 1)

        if (batchError) throw batchError

        if (batch && batch.length > 0) {
          batch.forEach(item => {
            if (item.activity) activities.add(item.activity)
          })
          offset += batchSize
          hasMore = batch.length === batchSize
        } else {
          hasMore = false
        }
      }

      const sortedActivities = Array.from(activities).sort()
      return new Response(
        JSON.stringify({ activities: sortedActivities }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // RPC returns array of distinct activities
    const activities = (data || []).map((item: any) => item.activity).filter(Boolean).sort()

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
