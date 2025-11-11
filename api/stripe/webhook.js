import { handleWebhook } from '../_lib/stripeService.js'

// IMPORTANT: Vercel requires bodyParser to be disabled for Stripe webhooks
export const config = {
  api: {
    bodyParser: false,
  },
}

// Helper to read raw body
async function getRawBody(req) {
  const chunks = []
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk)
  }
  return Buffer.concat(chunks)
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const signature = req.headers['stripe-signature']

  try {
    const rawBody = await getRawBody(req)

    await handleWebhook(rawBody, signature)
    res.json({ received: true })
  } catch (error) {
    console.error('Webhook error:', error)
    res.status(400).json({ error: error.message })
  }
}
