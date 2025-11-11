import { getUserSettings } from '../_lib/supabase.js'
import { createTransporter, sendBatchEmails } from '../_lib/emailService.js'
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
    const { userId, emails } = req.body

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' })
    }

    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return res.status(400).json({ error: 'Emails array is required and must not be empty' })
    }

    // Check usage limits
    const usageLimitCheck = await checkUsageLimit(userId)
    const emailsToSend = emails.length
    const remainingEmails = usageLimitCheck.remaining

    // Check if user can send all emails
    if (!usageLimitCheck.canSend) {
      return res.status(403).json({
        error: 'Monthly email limit reached',
        limit: usageLimitCheck.emailLimit,
        sent: usageLimitCheck.emailsSent,
        tier: usageLimitCheck.tier,
        remaining: 0
      })
    }

    // If trying to send more than remaining, limit the batch
    let emailsToProcess = emails
    let limitWarning = null

    if (emailsToSend > remainingEmails) {
      emailsToProcess = emails.slice(0, remainingEmails)
      limitWarning = `You have ${remainingEmails} emails remaining in your plan. Only ${remainingEmails} of ${emailsToSend} emails will be sent.`
    }

    const settings = await getUserSettings(userId)

    const transporter = createTransporter({
      smtp_host: settings.smtp_host,
      smtp_port: settings.smtp_port,
      smtp_username: settings.smtp_username,
      smtp_password: settings.smtp_password,
      smtp_secure: settings.smtp_secure,
    })

    const results = await sendBatchEmails(
      transporter,
      emailsToProcess,
      { sender_name: settings.sender_name, sender_email: settings.sender_email }
    )

    // Count successful sends and increment counter
    const successfulCount = results.filter((r) => r.success).length
    if (successfulCount > 0) {
      await incrementEmailCount(userId, successfulCount)
    }

    res.json({
      total: results.length,
      successful: successfulCount,
      failed: results.filter((r) => !r.success).length,
      results,
      limitWarning,
      skipped: emailsToSend - emailsToProcess.length
    })
  } catch (error) {
    console.error('Error sending batch emails:', error)
    res.status(500).json({ error: error.message })
  }
}
