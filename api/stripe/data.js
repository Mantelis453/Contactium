import { getSubscriptionInfo, checkUsageLimit } from '../_lib/stripeService.js'

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
    const { userId, type } = req.query

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' })
    }

    if (!type) {
      return res.status(400).json({ error: 'Type is required (subscription or usage)' })
    }

    if (type === 'subscription') {
      const info = await getSubscriptionInfo(userId)
      return res.json(info)
    }

    if (type === 'usage') {
      const usage = await checkUsageLimit(userId)
      return res.json(usage)
    }

    return res.status(400).json({ error: 'Invalid type. Must be "subscription" or "usage"' })
  } catch (error) {
    console.error('Error getting stripe data:', error)
    res.status(500).json({ error: error.message })
  }
}
