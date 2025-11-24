import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    const userId = url.searchParams.get('userId')

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'User ID required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Check if user is admin
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

    // Get stats
    const { count: userCount, error: userCountError } = await supabase
      .from('subscriptions')
      .select('*', { count: 'exact', head: true })

    if (userCountError) {
      console.error('Error counting users:', userCountError)
    }

    const { count: campaignCount } = await supabase
      .from('campaigns')
      .select('*', { count: 'exact', head: true })

    const { data: emailData } = await supabase
      .from('campaigns')
      .select('emails_sent')

    const totalEmails = emailData?.reduce((sum: number, c: any) => sum + (c.emails_sent || 0), 0) || 0

    const { count: openTickets } = await supabase
      .from('support_messages')
      .select('*', { count: 'exact', head: true })
      .in('status', ['open', 'in_progress'])

    return new Response(
      JSON.stringify({
        totalUsers: userCount || 0,
        totalCampaigns: campaignCount || 0,
        totalEmails,
        openTickets: openTickets || 0
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
