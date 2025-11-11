import { supabase } from '../_lib/supabase.js'

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { activity, minEmployees, maxEmployees, minRating, maxRating, search, offset = 0, limit = 100 } = req.query

    const startOffset = parseInt(offset)
    const pageLimit = parseInt(limit)

    // Build the query
    let query = supabase
      .from('companies')
      .select('*', { count: 'exact' })
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
    query = query.range(startOffset, startOffset + pageLimit - 1)

    const { data, error, count } = await query

    if (error) throw error

    res.json({
      companies: data || [],
      total: count || 0,
      offset: startOffset,
      limit: pageLimit,
      hasMore: count > startOffset + pageLimit
    })
  } catch (error) {
    console.error('Error fetching companies:', error)
    res.status(500).json({ error: error.message })
  }
}
