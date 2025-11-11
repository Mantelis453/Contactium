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
    // Fetch all companies with activities (remove default limit)
    let allData = []
    let start = 0
    const batchSize = 1000

    while (true) {
      const { data, error } = await supabase
        .from('companies')
        .select('activity')
        .not('activity', 'is', null)
        .range(start, start + batchSize - 1)

      if (error) throw error

      if (!data || data.length === 0) break

      allData = allData.concat(data)

      if (data.length < batchSize) break

      start += batchSize
    }

    // Get unique activities
    const activities = [...new Set(allData.map(d => d.activity))].filter(Boolean).sort()

    res.json({ activities })
  } catch (error) {
    console.error('Error fetching activities:', error)
    res.status(500).json({ error: error.message })
  }
}
