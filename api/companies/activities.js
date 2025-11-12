import { supabase } from '../_lib/supabase.js'

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Use a more efficient query - just get distinct activities
    // This is much faster than fetching all companies
    const { data, error } = await supabase
      .rpc('get_distinct_activities')
      .limit(1000)

    if (error) {
      // If RPC function doesn't exist, fall back to simpler query with limit
      console.warn('RPC function not available, using fallback query')
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('companies')
        .select('activity')
        .not('activity', 'is', null)
        .limit(1000)

      if (fallbackError) throw fallbackError

      const activities = [...new Set(fallbackData.map(d => d.activity))].filter(Boolean).sort()
      return res.json({ activities })
    }

    // RPC returns array of distinct activities
    const activities = (data || []).filter(Boolean).sort()
    res.json({ activities })
  } catch (error) {
    console.error('Error fetching activities:', error)
    res.status(500).json({ error: error.message })
  }
}
