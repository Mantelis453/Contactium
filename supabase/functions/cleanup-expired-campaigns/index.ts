import { corsHeaders } from '../_shared/cors.ts'
import { createSupabaseClient } from '../_shared/supabase.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const supabase = createSupabaseClient()

  try {
    // Calculate the date 30 days ago
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    console.log('Cleaning up campaigns older than:', thirtyDaysAgo.toISOString())

    // Delete campaigns created more than 30 days ago
    const { data: deletedCampaigns, error } = await supabase
      .from('campaigns')
      .delete()
      .lt('created_at', thirtyDaysAgo.toISOString())
      .select('id, name, created_at')

    if (error) {
      console.error('Error deleting expired campaigns:', error)
      throw error
    }

    const deletedCount = deletedCampaigns?.length || 0
    console.log(`Successfully deleted ${deletedCount} expired campaigns`)

    if (deletedCount > 0) {
      console.log('Deleted campaigns:', deletedCampaigns)
    }

    return new Response(
      JSON.stringify({
        success: true,
        deletedCount,
        deletedCampaigns,
        message: `Deleted ${deletedCount} campaigns older than 30 days`
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )
  } catch (error) {
    console.error('Error in cleanup function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
