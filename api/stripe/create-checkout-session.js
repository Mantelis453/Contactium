import { createCheckoutSession } from '../_lib/stripeService.js'

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
    const { userId, tier, email } = req.body

    if (!userId || !tier || !email) {
      return res.status(400).json({ error: 'Missing required fields: userId, tier, email' })
    }

    const session = await createCheckoutSession(userId, tier, email)
    res.json(session)
  } catch (error) {
    console.error('Error creating checkout session:', error)
    res.status(500).json({ error: error.message })
  }
}
