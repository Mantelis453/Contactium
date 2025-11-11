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
    const { activity, minEmployees, maxEmployees, minRating, maxRating, search } = req.query

    // Fetch all companies in batches to overcome 1000 row limit
    let allData = []
    let start = 0
    const batchSize = 1000

    while (true) {
      let query = supabase
        .from('companies')
        .select('*')
        .order('created_at', { ascending: false })
        .range(start, start + batchSize - 1)

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

      const { data, error } = await query

      if (error) throw error

      if (!data || data.length === 0) break

      allData = allData.concat(data)

      if (data.length < batchSize) break

      start += batchSize
    }

    res.json({ companies: allData, total: allData.length })
  } catch (error) {
    console.error('Error fetching companies:', error)
    res.status(500).json({ error: error.message })
  }
}
