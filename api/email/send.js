import { getUserSettings } from '../_lib/supabase.js'
import { createTransporter, sendEmail } from '../_lib/emailService.js'
import { checkUsageLimit, incrementEmailCount } from '../_lib/stripeService.js'

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
    const { userId, to, subject, text, html } = req.body

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' })
    }

    if (!to || !subject || (!text && !html)) {
      return res.status(400).json({ error: 'Missing required email fields: to, subject, and text or html' })
    }

    // Check usage limits
    const usageLimitCheck = await checkUsageLimit(userId)
    if (!usageLimitCheck.canSend) {
      return res.status(403).json({
        error: 'Monthly email limit reached',
        limit: usageLimitCheck.emailLimit,
        sent: usageLimitCheck.emailsSent,
        tier: usageLimitCheck.tier
      })
    }

    const settings = await getUserSettings(userId)

    const transporter = createTransporter({
      smtp_host: settings.smtp_host,
      smtp_port: settings.smtp_port,
      smtp_username: settings.smtp_username,
      smtp_password: settings.smtp_password,
      smtp_secure: settings.smtp_secure,
    })

    const result = await sendEmail(
      transporter,
      { to, subject, text, html },
      { sender_name: settings.sender_name, sender_email: settings.sender_email }
    )

    // Increment email counter on successful send
    if (result.success) {
      await incrementEmailCount(userId, 1)
    }

    res.json(result)
  } catch (error) {
    console.error('Error sending email:', error)
    res.status(500).json({ error: error.message })
  }
}
