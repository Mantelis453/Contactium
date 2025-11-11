import { getUserSettings } from '../_lib/supabase.js'
import { testConnection } from '../_lib/emailService.js'

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
    const { userId } = req.body

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' })
    }

    const settings = await getUserSettings(userId)

    const result = await testConnection({
      smtp_host: settings.smtp_host,
      smtp_port: settings.smtp_port,
      smtp_username: settings.smtp_username,
      smtp_password: settings.smtp_password,
      smtp_secure: settings.smtp_secure,
    })

    res.json(result)
  } catch (error) {
    console.error('Error testing SMTP connection:', error)
    res.status(500).json({ error: error.message })
  }
}
