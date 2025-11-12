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
    console.log('[Session] Request body:', { ...req.body, userId: req.body.userId ? '***' : undefined })

    // Verify environment variables
    const requiredEnvVars = [
      'VITE_SUPABASE_URL',
      'SUPABASE_SERVICE_KEY',
      'STRIPE_SECRET_KEY',
      'VITE_APP_URL'
    ]
    const missingEnvVars = requiredEnvVars.filter(v => !process.env[v])
    if (missingEnvVars.length > 0) {
      console.error('[Session] Missing environment variables:', missingEnvVars)
      return res.status(500).json({
        error: 'Server configuration error',
        details: `Missing environment variables: ${missingEnvVars.join(', ')}`
      })
    }

    const { type, userId, tier, successUrl, cancelUrl, returnUrl } = req.body

    if (!type) {
      return res.status(400).json({ error: 'Session type is required (checkout or portal)' })
    }

    if (type === 'checkout') {
      // Create Stripe Checkout Session
      if (!userId || !tier) {
        console.error('[Session] Missing userId or tier:', { userId: !!userId, tier: !!tier })
        return res.status(400).json({
          error: 'Missing required fields for checkout: userId, tier'
        })
      }

      // Verify tier-specific price ID
      const priceIdEnvVar = tier === 'starter' ? 'STRIPE_STARTER_PRICE_ID' : 'STRIPE_PRO_PRICE_ID'
      if (!process.env[priceIdEnvVar]) {
        console.error(`[Session] Missing ${priceIdEnvVar}`)
        return res.status(500).json({
          error: 'Server configuration error',
          details: `Missing ${priceIdEnvVar} environment variable`
        })
      }

      console.log('[Session] Fetching user from Supabase auth...')

      // Get user email from Supabase auth
      const { data: { user }, error: userError } = await supabase.auth.admin.getUserById(userId)

      if (userError) {
        console.error('[Session] Supabase auth error:', userError)
        return res.status(500).json({
          error: 'Failed to fetch user data',
          details: userError.message
        })
      }

      if (!user) {
        console.error('[Session] User not found:', userId)
        return res.status(400).json({ error: 'User not found' })
      }

      console.log('[Session] User found, email:', user.email ? '***@***' : 'missing')

      if (!user.email) {
        console.error('[Session] User has no email address')
        return res.status(400).json({ error: 'User email not found' })
      }

      console.log('[Session] Creating checkout session...')
      const session = await createCheckoutSession(userId, tier, user.email)
      console.log('[Session] Checkout session created successfully')

      return res.json({ url: session.url })
    }

    if (type === 'portal') {
      // Create Stripe Customer Portal Session
      if (!userId) {
        console.error('[Session] Missing userId for portal')
        return res.status(400).json({
          error: 'Missing required fields for portal: userId'
        })
      }

      console.log('[Session] Creating portal session...')
      const session = await createPortalSession(userId)
      console.log('[Session] Portal session created successfully')

      return res.json({ url: session.url })
    }

    return res.status(400).json({ error: 'Invalid session type. Must be "checkout" or "portal"' })
  } catch (error) {
    console.error('[Session] Error:', error)
    console.error('[Session] Error stack:', error.stack)
    res.status(500).json({
      error: error.message || 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    })
  }
}
