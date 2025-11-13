import { corsHeaders } from '../_shared/cors.ts'
import { createSupabaseClient } from '../_shared/supabase.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const supabase = createSupabaseClient()

  try {
    const url = new URL(req.url)
    const activity = url.searchParams.get('activity')
    const minEmployees = url.searchParams.get('minEmployees')
    const maxEmployees = url.searchParams.get('maxEmployees')
    const minRating = url.searchParams.get('minRating')
    const maxRating = url.searchParams.get('maxRating')
    const search = url.searchParams.get('search')
    const offset = parseInt(url.searchParams.get('offset') || '0')
    const limit = parseInt(url.searchParams.get('limit') || '100')

    let query = supabase
      .from('companies')
      .select('*', { count: 'exact' })
      .not('email', 'is', null)
      .neq('email', '')
      .not('email', 'ilike', '%neviešinama%')
      .order('created_at', { ascending: false })

    // Apply filters
    if (activity && activity !== 'all') {
      query = query.eq('activity', activity)
    }

    if (minEmployees) {
      query = query.gte('employees', parseInt(minEmployees))
    }

    if (maxEmployees) {
      query = query.lte('employees', parseInt(maxEmployees))
    }

    if (minRating) {
      query = query.gte('scorist_rating', parseFloat(minRating))
    }

    if (maxRating) {
      query = query.lte('scorist_rating', parseFloat(maxRating))
    }

    if (search) {
      query = query.or(`company_name.ilike.%${search}%,company_code.ilike.%${search}%,email.ilike.%${search}%`)
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    const { data, error, count } = await query

    if (error) throw error

    return new Response(
      JSON.stringify({
        companies: data || [],
        total: count || 0,
        offset,
        limit,
        hasMore: count ? count > offset + limit : false
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error fetching companies:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
