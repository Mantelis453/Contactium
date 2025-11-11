import { supabase } from '../_lib/supabase.js'

// TESTING ONLY: Manually upgrade subscription (remove in production)
export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { userId, tier } = req.body

    if (!userId || !tier) {
      return res.status(400).json({ error: 'Missing userId or tier' })
    }

    // Manually update subscription in database
    const { data, error } = await supabase
      .from('user_settings')
      .upsert({
        user_id: userId,
        subscription_tier: tier,
        subscription_status: 'active',
        emails_sent_this_month: 0,
        last_reset_date: new Date().toISOString()
      })
      .select()

    if (error) throw error

    res.json({ success: true, message: `Upgraded to ${tier}`, data })
  } catch (error) {
    console.error('Test upgrade error:', error)
    res.status(500).json({ error: error.message })
  }
}
