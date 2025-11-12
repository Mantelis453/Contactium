import { createCheckoutSession, createPortalSession } from '../_lib/stripeService.js'
import { supabase } from '../_lib/supabase.js'

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
    const { type, userId, tier, successUrl, cancelUrl, returnUrl } = req.body

    if (!type) {
      return res.status(400).json({ error: 'Session type is required (checkout or portal)' })
    }

    if (type === 'checkout') {
      // Create Stripe Checkout Session
      if (!userId || !tier) {
        return res.status(400).json({
          error: 'Missing required fields for checkout: userId, tier'
        })
      }

      // Get user email from Supabase auth
      const { data: { user }, error: userError } = await supabase.auth.admin.getUserById(userId)

      if (userError || !user) {
        return res.status(400).json({ error: 'User not found' })
      }

      const session = await createCheckoutSession(userId, tier, user.email)
      return res.json({ url: session.url })
    }

    if (type === 'portal') {
      // Create Stripe Customer Portal Session
      if (!userId) {
        return res.status(400).json({
          error: 'Missing required fields for portal: userId'
        })
      }

      const session = await createPortalSession(userId)
      return res.json({ url: session.url })
    }

    return res.status(400).json({ error: 'Invalid session type. Must be "checkout" or "portal"' })
  } catch (error) {
    console.error('Session creation error:', error)
    res.status(500).json({ error: error.message })
  }
}
