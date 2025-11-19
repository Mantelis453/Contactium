import { corsHeaders } from '../_shared/cors.ts'
import { createSupabaseClient } from '../_shared/supabase.ts'

// Note: You'll need to add these environment variables to Supabase
// SMTP_HOST - Your SMTP server (e.g., smtp.gmail.com)
// SMTP_PORT - SMTP port (e.g., 587 for TLS, 465 for SSL)
// SMTP_USER - Your email address
// SMTP_PASS - Your email password or app-specific password
// GEMINI_API_KEY - Your Gemini API key (or get from user_settings)

interface SendCampaignRequest {
  campaignId: string
  userId: string
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const supabase = createSupabaseClient()

  try {
    const { campaignId, userId }: SendCampaignRequest = await req.json()

    console.log('Starting to send campaign:', campaignId)

    // 1. Get campaign details
    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', campaignId)
      .eq('user_id', userId)
      .single()

    if (campaignError) throw campaignError
    if (!campaign) throw new Error('Campaign not found')

    console.log('Campaign loaded:', campaign.name)

    // 2. Check if campaign is already completed
    if (campaign.status === 'completed') {
      throw new Error('Campaign has already been sent')
    }

    // 3. Update campaign status to 'running'
    await supabase
      .from('campaigns')
      .update({
        status: 'running',
        updated_at: new Date().toISOString()
      })
      .eq('id', campaignId)

    // 4. Get all pending recipients (supports both companies and contacts)
    const { data: recipients, error: recipientsError } = await supabase
      .from('campaign_recipients')
      .select('id, company_id, contact_id, recipient_email, recipient_name, status')
      .eq('campaign_id', campaignId)
      .eq('status', 'pending')

    if (recipientsError) throw recipientsError

    console.log(`Found ${recipients.length} recipients to send to`)

    if (recipients.length === 0) {
      await supabase
        .from('campaigns')
        .update({
          status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('id', campaignId)

      return new Response(
        JSON.stringify({
          success: true,
          total: 0,
          sent: 0,
          failed: 0,
          message: 'No pending recipients found'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 4b. Fetch company details for company-based recipients (if any)
    const companyIds = recipients.filter(r => r.company_id).map(r => r.company_id)
    const companiesMap = new Map()

    if (companyIds.length > 0) {
      const { data: companies } = await supabase
        .from('companies')
        .select('id, company_name, email, activity, employees, address')
        .in('id', companyIds)

      if (companies) {
        companies.forEach(c => companiesMap.set(c.id, c))
      }
    }

    // Enrich recipients with company data or use contact data
    const enrichedRecipients = recipients.map(recipient => {
      if (recipient.company_id) {
        const company = companiesMap.get(recipient.company_id)
        return {
          ...recipient,
          companies: company || {
            id: recipient.company_id,
            company_name: 'Unknown Company',
            email: recipient.recipient_email || '',
            activity: null,
            employees: null,
            address: null
          }
        }
      } else {
        return {
          ...recipient,
          companies: {
            id: recipient.contact_id,
            company_name: recipient.recipient_name || recipient.recipient_email,
            email: recipient.recipient_email,
            activity: null,
            employees: null,
            address: null
          }
        }
      }
    })

    // 5. Get user's SMTP settings and Gemini API key
    const { data: userSettings, error: settingsError } = await supabase
      .from('user_settings')
      .select('gemini_api_key, smtp_host, smtp_port, smtp_user, smtp_pass, smtp_from_email, smtp_from_name')
      .eq('user_id', userId)
      .single()

    if (settingsError) {
      console.error('Error loading user settings:', settingsError)
      throw new Error(`Failed to load user settings: ${settingsError.message}. Please check your Settings page.`)
    }

    const geminiApiKey = userSettings?.gemini_api_key || Deno.env.get('GEMINI_API_KEY')

    if (!geminiApiKey) {
      throw new Error('Gemini API key not found. Please add it in Settings page.')
    }

    // Get SMTP settings from user settings or environment variables
    const smtpConfig = {
      host: userSettings?.smtp_host || Deno.env.get('SMTP_HOST'),
      port: userSettings?.smtp_port || Deno.env.get('SMTP_PORT') || '587',
      user: userSettings?.smtp_user || Deno.env.get('SMTP_USER'),
      pass: userSettings?.smtp_pass || Deno.env.get('SMTP_PASS'),
      fromEmail: userSettings?.smtp_from_email || userSettings?.smtp_user || Deno.env.get('SMTP_USER'),
      fromName: userSettings?.smtp_from_name || campaign.sender_name
    }

    console.log('SMTP config check:', {
      hasHost: !!smtpConfig.host,
      hasUser: !!smtpConfig.user,
      hasPass: !!smtpConfig.pass,
      host: smtpConfig.host,
      port: smtpConfig.port,
      user: smtpConfig.user ? smtpConfig.user.substring(0, 3) + '***' : null
    })

    if (!smtpConfig.host || !smtpConfig.user || !smtpConfig.pass) {
      const missing = []
      if (!smtpConfig.host) missing.push('SMTP Host')
      if (!smtpConfig.user) missing.push('SMTP Username')
      if (!smtpConfig.pass) missing.push('SMTP Password')
      throw new Error(`Missing SMTP configuration: ${missing.join(', ')}. Please configure SMTP settings in Settings page.`)
    }

    console.log('SMTP config loaded:', { host: smtpConfig.host, port: smtpConfig.port, user: smtpConfig.user })

    // 6. Generate personalized emails for each recipient
    console.log('Generating personalized emails...')
    const emailsToSend = []
    const failedGenerations = []

    for (let i = 0; i < enrichedRecipients.length; i++) {
      const recipient = enrichedRecipients[i]
      try {
        // Add delay between requests to avoid rate limiting (1 second delay)
        if (i > 0) {
          await new Promise(resolve => setTimeout(resolve, 1000))
        }

        // Generate personalized email using Gemini
        const personalizedEmail = await generatePersonalizedEmail({
          description: campaign.description,
          category: campaign.category,
          company: recipient.companies,
          senderName: campaign.sender_name,
          senderCompany: campaign.sender_company,
          senderTitle: campaign.sender_title,
          valueProposition: campaign.value_proposition,
          callToAction: campaign.call_to_action,
          geminiApiKey
        })

        emailsToSend.push({
          recipientId: recipient.id,
          to: recipient.companies.email,
          subject: personalizedEmail.subject,
          html: personalizedEmail.body.replace(/\n/g, '<br>'),
          text: personalizedEmail.body,
          companyName: recipient.companies.company_name
        })

        console.log(`✓ Generated email for ${recipient.companies.company_name} (${i + 1}/${enrichedRecipients.length})`)
      } catch (error) {
        console.error(`Failed to generate email for ${recipient.companies.company_name}:`, error)
        failedGenerations.push({
          recipientId: recipient.id,
          companyName: recipient.companies.company_name,
          error: error.message
        })
      }
    }

    console.log(`Generated ${emailsToSend.length} emails, ${failedGenerations.length} failed`)

    // 7. Send emails using SMTP with batch processing and real-time updates
    console.log('Sending emails via SMTP...')
    let sentCount = 0
    let failedCount = 0
    const BATCH_SIZE = 10 // Process 10 emails at a time for better progress tracking
    const UPDATE_INTERVAL = 5 // Update campaign stats every 5 emails

    for (let i = 0; i < emailsToSend.length; i++) {
      const email = emailsToSend[i]

      try {
        await sendEmailSMTP({
          from: {
            email: smtpConfig.fromEmail,
            name: smtpConfig.fromName
          },
          to: email.to,
          subject: email.subject,
          html: email.html,
          text: email.text,
          smtpConfig
        })

        // Email sent successfully - update immediately
        const { error: updateError } = await supabase
          .from('campaign_recipients')
          .update({
            status: 'sent',
            sent_at: new Date().toISOString(),
            personalized_email: {
              subject: email.subject,
              body: email.html
            }
          })
          .eq('id', email.recipientId)

        if (updateError) {
          console.error(`Failed to update recipient ${email.recipientId} to sent:`, updateError)
        }

        sentCount++
        console.log(`✓ Sent ${sentCount}/${emailsToSend.length} - ${email.companyName}`)

        // Update campaign progress every UPDATE_INTERVAL emails or on last email
        if (sentCount % UPDATE_INTERVAL === 0 || i === emailsToSend.length - 1) {
          await supabase
            .from('campaigns')
            .update({
              emails_sent: sentCount,
              updated_at: new Date().toISOString()
            })
            .eq('id', campaignId)
          console.log(`📊 Progress updated: ${sentCount} sent, ${failedCount} failed`)
        }

        // Small delay between sends to avoid overwhelming SMTP server (0.5 seconds)
        await new Promise(resolve => setTimeout(resolve, 500))
      } catch (error) {
        // Email failed to send - update immediately
        console.error(`✗ Failed to send email to ${email.companyName}:`, error.message)

        const { error: updateError } = await supabase
          .from('campaign_recipients')
          .update({ status: 'failed' })
          .eq('id', email.recipientId)

        if (updateError) {
          console.error(`Failed to update recipient ${email.recipientId} to failed:`, updateError)
        }

        failedCount++
        console.log(`❌ Failed ${failedCount}/${emailsToSend.length}`)

        // Update campaign progress for failures too
        if ((sentCount + failedCount) % UPDATE_INTERVAL === 0 || i === emailsToSend.length - 1) {
          await supabase
            .from('campaigns')
            .update({
              emails_sent: sentCount,
              updated_at: new Date().toISOString()
            })
            .eq('id', campaignId)
          console.log(`📊 Progress updated: ${sentCount} sent, ${failedCount} failed`)
        }

        // Shorter delay after failure (0.2 seconds) to continue quickly
        await new Promise(resolve => setTimeout(resolve, 200))
      }
    }

    // 8. Mark failed generations
    for (const failed of failedGenerations) {
      await supabase
        .from('campaign_recipients')
        .update({ status: 'failed' })
        .eq('id', failed.recipientId)
      failedCount++
    }

    // 9. Update campaign status to completed
    await supabase
      .from('campaigns')
      .update({
        status: 'completed',
        emails_sent: sentCount,
        updated_at: new Date().toISOString()
      })
      .eq('id', campaignId)

    console.log(`🎉 Campaign sending completed! Total: ${enrichedRecipients.length}, Sent: ${sentCount}, Failed: ${failedCount}`)

    return new Response(
      JSON.stringify({
        success: true,
        total: enrichedRecipients.length,
        sent: sentCount,
        failed: failedCount,
        message: `Successfully sent ${sentCount} emails, ${failedCount} failed`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('❌ Error in send-campaign:', error)

    // Try to update campaign status to failed (only if we have campaignId)
    try {
      const { campaignId: errorCampaignId } = await req.json()
      if (errorCampaignId) {
        await supabase
          .from('campaigns')
          .update({
            status: 'failed',
            updated_at: new Date().toISOString()
          })
          .eq('id', errorCampaignId)
      }
    } catch (updateError) {
      console.error('Failed to update campaign status to failed:', updateError)
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

// Helper function to send email via SMTP with timeout
async function sendEmailSMTP(params: {
  from: { email: string; name: string }
  to: string
  subject: string
  html: string
  text: string
  smtpConfig: any
}) {
  const { from, to, subject, html, text, smtpConfig } = params

  // Connect to SMTP server
  let conn: Deno.TcpConn | Deno.TlsConn

  // Timeout wrapper for async operations (30 seconds)
  const withTimeout = <T>(promise: Promise<T>, timeoutMs: number = 30000): Promise<T> => {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error(`Operation timed out after ${timeoutMs}ms`)), timeoutMs)
      )
    ])
  }

  try {
    // For port 465 (SSL), use TLS from the start
    if (smtpConfig.port === '465' || smtpConfig.port === 465) {
      conn = await withTimeout(
        Deno.connectTls({
          hostname: smtpConfig.host,
          port: parseInt(smtpConfig.port)
        }),
        10000 // 10 second timeout for connection
      )
    } else {
      // For port 587 (TLS), start with regular TCP
      conn = await withTimeout(
        Deno.connect({
          hostname: smtpConfig.host,
          port: parseInt(smtpConfig.port)
        }),
        10000 // 10 second timeout for connection
      )
    }

    // Helper function to read SMTP response with timeout
    const readResponse = async (): Promise<string> => {
      const buffer = new Uint8Array(4096)
      const n = await withTimeout(conn.read(buffer), 5000) // 5 second timeout
      if (!n) throw new Error('Connection closed')
      return new TextDecoder().decode(buffer.subarray(0, n))
    }

    // Helper function to send SMTP command with timeout
    const sendCommand = async (command: string): Promise<string> => {
      await withTimeout(conn.write(new TextEncoder().encode(command + '\r\n')), 5000)
      return await readResponse()
    }

    // SMTP conversation (reduced logging for bulk sends)
    let response = await readResponse() // Read initial greeting

    // EHLO
    response = await sendCommand(`EHLO ${smtpConfig.host}`)

    // STARTTLS (only for port 587)
    if (smtpConfig.port === '587' || smtpConfig.port === 587) {
      response = await sendCommand('STARTTLS')

      // Upgrade to TLS
      conn = await Deno.startTls(conn as Deno.TcpConn, {
        hostname: smtpConfig.host
      })

      // Send EHLO again after TLS
      response = await sendCommand(`EHLO ${smtpConfig.host}`)
    }

    // AUTH LOGIN
    response = await sendCommand('AUTH LOGIN')

    // Send username (base64)
    response = await sendCommand(btoa(smtpConfig.user))

    // Send password (base64)
    response = await sendCommand(btoa(smtpConfig.pass))

    if (!response.startsWith('235')) {
      throw new Error('SMTP authentication failed: ' + response)
    }

    // MAIL FROM
    response = await sendCommand(`MAIL FROM:<${from.email}>`)

    // RCPT TO
    response = await sendCommand(`RCPT TO:<${to}>`)

    // DATA
    response = await sendCommand('DATA')

    // Build email message
    const boundary = '----=_Part_' + Date.now()
    const message = [
      `From: ${from.name} <${from.email}>`,
      `To: ${to}`,
      `Subject: ${subject}`,
      `MIME-Version: 1.0`,
      `Content-Type: multipart/alternative; boundary="${boundary}"`,
      '',
      `--${boundary}`,
      `Content-Type: text/plain; charset=utf-8`,
      `Content-Transfer-Encoding: quoted-printable`,
      '',
      text,
      '',
      `--${boundary}`,
      `Content-Type: text/html; charset=utf-8`,
      `Content-Transfer-Encoding: quoted-printable`,
      '',
      html,
      '',
      `--${boundary}--`,
      '.'
    ].join('\r\n')

    // Send message
    await conn.write(new TextEncoder().encode(message + '\r\n'))
    response = await readResponse()

    if (!response.startsWith('250')) {
      throw new Error('Failed to send email: ' + response)
    }

    // QUIT
    await sendCommand('QUIT')

    conn.close()
  } catch (error) {
    if (conn) {
      try {
        conn.close()
      } catch (e) {
        // Ignore close errors
      }
    }
    throw new Error(`SMTP error: ${error.message}`)
  }
}

// Helper function to generate personalized email using Gemini with retry logic
async function generatePersonalizedEmail(params: {
  description: string
  category: string
  company: any
  senderName: string
  senderCompany: string
  senderTitle: string
  valueProposition: string
  callToAction: string
  geminiApiKey: string
}, retries = 3) {
  const prompt = `Generate a personalized business email based on these details:

Campaign Category: ${params.category}
Campaign Description: ${params.description}

Recipient Company: ${params.company.company_name}
Company Activity: ${params.company.activity || 'Unknown'}
Company Employees: ${params.company.employees || 'Unknown'}

Sender Name: ${params.senderName}
Sender Company: ${params.senderCompany}
Sender Title: ${params.senderTitle}
Value Proposition: ${params.valueProposition}
Call to Action: ${params.callToAction}

Generate a professional email in Lithuanian language with:
- Subject line (without "Subject:" prefix)
- Email body that is personalized for the recipient company
- Include the sender's name at the end

Format your response EXACTLY like this (with these exact labels):
SUBJECT: [subject line here]
BODY: [email body here]

${params.senderName}`

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${params.geminiApiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.7,
              topK: 40,
              topP: 0.95,
              maxOutputTokens: 1024
            }
          })
        }
      )

      if (!response.ok) {
        const errorText = await response.text()

        // If rate limited, wait and retry
        if (response.status === 429 && attempt < retries - 1) {
          const waitTime = Math.pow(2, attempt) * 2000 // Exponential backoff: 2s, 4s, 8s
          console.log(`Rate limited, waiting ${waitTime}ms before retry ${attempt + 1}/${retries}`)
          await new Promise(resolve => setTimeout(resolve, waitTime))
          continue
        }

        throw new Error(`Gemini API error: ${response.statusText} - ${errorText}`)
      }

      const data = await response.json()
      const text = data.candidates[0].content.parts[0].text

      // Parse SUBJECT and BODY from response
      const subjectMatch = text.match(/SUBJECT:\s*(.+?)(?:\n|$)/i)
      const bodyMatch = text.match(/BODY:\s*([\s\S]+)/i)

      return {
        subject: subjectMatch ? subjectMatch[1].trim() : 'Business Inquiry',
        body: bodyMatch ? bodyMatch[1].trim() : text
      }
    } catch (error) {
      if (attempt === retries - 1) {
        throw error
      }
      // Wait before retrying on other errors
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
  }

  throw new Error('Failed to generate email after retries')
}
