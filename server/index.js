import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import { createTransporter, sendEmail, sendBatchEmails, testConnection } from './emailService.js'
import {
  createCheckoutSession,
  createPortalSession,
  handleWebhook,
  checkUsageLimit,
  incrementEmailCount,
  getSubscriptionInfo
} from './stripeService.js'

dotenv.config({ path: '.env.local' })

const app = express()
const PORT = process.env.PORT || 3001

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Middleware
app.use(cors())

// Stripe webhook needs raw body for signature verification
app.post('/api/stripe/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const signature = req.headers['stripe-signature']

  try {
    await handleWebhook(req.body, signature)
    res.json({ received: true })
  } catch (error) {
    console.error('Webhook error:', error)
    res.status(400).json({ error: error.message })
  }
})

// Regular JSON parsing for other routes
app.use(express.json())

// Helper function to get user settings
async function getUserSettings(userId) {
  console.log('Fetching settings for user ID:', userId)

  const { data, error } = await supabase
    .from('user_settings')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  console.log('Query result - data:', data, 'error:', error)

  if (error) {
    console.error('Database error:', error)
    throw new Error('Failed to load user settings: ' + error.message)
  }

  if (!data) {
    console.error('No settings found for user:', userId)
    throw new Error('User settings not found. Please configure your email settings in the Settings page first.')
  }

  console.log('Settings found:', {
    ...data,
    smtp_password: data.smtp_password ? '***' : null
  })

  return data
}

// Test SMTP connection
app.post('/api/email/test', async (req, res) => {
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
})

// Send a single email
app.post('/api/email/send', async (req, res) => {
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
})

// Send batch emails
app.post('/api/email/send-batch', async (req, res) => {
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
})

// Stripe: Create checkout session
// Stripe: Combined session endpoint (checkout + portal)
app.post('/api/stripe/session', async (req, res) => {
  try {
    const { type, userId, tier, successUrl, cancelUrl, returnUrl } = req.body

    if (!type) {
      return res.status(400).json({ error: 'Session type is required (checkout or portal)' })
    }

    if (type === 'checkout') {
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
})

// Stripe: Create checkout session (legacy endpoint, kept for backwards compatibility)
app.post('/api/stripe/create-checkout-session', async (req, res) => {
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
})

// Stripe: Create customer portal session (legacy endpoint, kept for backwards compatibility)
app.post('/api/stripe/create-portal-session', async (req, res) => {
  try {
    const { userId } = req.body

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' })
    }

    const session = await createPortalSession(userId)
    res.json(session)
  } catch (error) {
    console.error('Error creating portal session:', error)
    res.status(500).json({ error: error.message })
  }
})

// Stripe: Combined data endpoint (subscription + usage)
app.get('/api/stripe/data', async (req, res) => {
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
})

// Stripe: Get subscription info (legacy endpoint, kept for backwards compatibility)
app.get('/api/stripe/subscription/:userId', async (req, res) => {
  try {
    const { userId } = req.params

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' })
    }

    const info = await getSubscriptionInfo(userId)
    res.json(info)
  } catch (error) {
    console.error('Error getting subscription info:', error)
    res.status(500).json({ error: error.message })
  }
})

// Stripe: Check usage limits (legacy endpoint, kept for backwards compatibility)
app.get('/api/stripe/usage/:userId', async (req, res) => {
  try {
    const { userId } = req.params

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' })
    }

    const usage = await checkUsageLimit(userId)
    res.json(usage)
  } catch (error) {
    console.error('Error checking usage:', error)
    res.status(500).json({ error: error.message })
  }
})

// TESTING ONLY: Manually upgrade subscription (remove in production)
app.post('/api/stripe/test-upgrade', async (req, res) => {
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
})

// ========== COMPANIES ENDPOINTS ==========

// Get all companies with filtering
app.get('/api/companies', async (req, res) => {
  try {
    const { activity, minEmployees, maxEmployees, minRating, maxRating, search } = req.query

    let query = supabase
      .from('companies')
      .select('*')
      .order('created_at', { ascending: false })

    // Apply filters
    if (activity && activity !== 'all') {
      query = query.eq('activity', activity)
    }

    if (minEmployees) {
      query = query.gte('employees', parseInt(minEmployees))
    }

    if (maxEmployees) {
      query = query.lte('employees', parseInt(maxEmployees))
    }

    if (minRating) {
      query = query.gte('scorist_rating', parseFloat(minRating))
    }

    if (maxRating) {
      query = query.lte('scorist_rating', parseFloat(maxRating))
    }

    if (search) {
      query = query.or(`company_name.ilike.%${search}%,company_code.ilike.%${search}%,email.ilike.%${search}%`)
    }

    const { data, error, count } = await query

    if (error) throw error

    res.json({ companies: data || [], total: count })
  } catch (error) {
    console.error('Error fetching companies:', error)
    res.status(500).json({ error: error.message })
  }
})

// Import companies from CSV data
app.post('/api/companies/import', async (req, res) => {
  try {
    const { companies } = req.body

    if (!companies || !Array.isArray(companies)) {
      return res.status(400).json({ error: 'Companies array is required' })
    }

    // Prepare companies for insertion
    const companiesData = companies.map(company => ({
      company_code: company.company_code || null,
      company_name: company.company_name,
      company_code_verify: company.company_code_verify || null,
      address: company.address || null,
      scorist_rating: company.scorist_rating ? parseFloat(company.scorist_rating) : null,
      phone: company.phone || null,
      website: company.website || null,
      email: company.email || null,
      registration_address: company.registration_address || null,
      employees: company.employees ? parseInt(company.employees) : null,
      sodra_debt_days: company.sodra_debt_days ? parseInt(company.sodra_debt_days) : null,
      sodra_debt: company.sodra_debt || null,
      vmi_debt: company.vmi_debt || null,
      vehicles: company.vehicles ? parseInt(company.vehicles) : null,
      financial_reports: company.financial_reports || null,
      activity: company.activity || null
    }))

    const { data, error } = await supabase
      .from('companies')
      .insert(companiesData)
      .select()

    if (error) throw error

    res.json({
      success: true,
      message: `Successfully imported ${data.length} companies`,
      imported: data.length
    })
  } catch (error) {
    console.error('Error importing companies:', error)
    res.status(500).json({ error: error.message })
  }
})

// Delete a company
app.delete('/api/companies/:id', async (req, res) => {
  try {
    const { id } = req.params

    const { error } = await supabase
      .from('companies')
      .delete()
      .eq('id', id)

    if (error) throw error

    res.json({ success: true, message: 'Company deleted successfully' })
  } catch (error) {
    console.error('Error deleting company:', error)
    res.status(500).json({ error: error.message })
  }
})

// Get unique activities for filter dropdown
app.get('/api/companies/activities', async (req, res) => {
  try {
    // Use a simpler query with limit to avoid timeouts
    // This should be fast enough for most use cases
    const { data, error } = await supabase
      .from('companies')
      .select('activity')
      .not('activity', 'is', null)
      .limit(1000)

    if (error) throw error

    // Get unique activities
    const activities = [...new Set(data.map(d => d.activity))].filter(Boolean).sort()

    res.json({ activities })
  } catch (error) {
    console.error('Error fetching activities:', error)
    res.status(500).json({ error: error.message })
  }
})

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Email API server is running' })
})

app.listen(PORT, () => {
  console.log(`Email API server running on http://localhost:${PORT}`)
})
