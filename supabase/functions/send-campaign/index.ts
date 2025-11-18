import { corsHeaders } from '../_shared/cors.ts'
import { createSupabaseClient } from '../_shared/supabase.ts'

// Note: You'll need to add these environment variables to Supabase
// RESEND_API_KEY - Your Resend API key
// GEMINI_API_KEY - Your Gemini API key (or get from user_settings)
// APP_URL - Your app URL

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

    // 5. Get user's Gemini API key from settings
    const { data: userSettings } = await supabase
      .from('user_settings')
      .select('gemini_api_key')
      .eq('user_id', userId)
      .single()

    const geminiApiKey = userSettings?.gemini_api_key || Deno.env.get('GEMINI_API_KEY')

    if (!geminiApiKey) {
      throw new Error('Gemini API key not found. Please add it in Settings.')
    }

    // 6. Generate personalized emails for each recipient
    console.log('Generating personalized emails...')
    const emailsToSend = []
    const failedGenerations = []

    for (const recipient of enrichedRecipients) {
      try {
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
          companyName: recipient.companies.company_name
        })
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

    // 7. Send emails using Resend API
    console.log('Sending emails...')
    let sentCount = 0
    let failedCount = 0

    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    if (!resendApiKey) {
      console.error('RESEND_API_KEY not set in environment variables')
      throw new Error('RESEND_API_KEY environment variable not set. Please add it in Supabase Edge Functions settings.')
    }
    console.log('Resend API key found, proceeding with email sending...')

    for (const email of emailsToSend) {
      try {
        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            from: 'onboarding@resend.dev', // Update with your verified domain
            to: email.to,
            subject: email.subject,
            html: email.html
          })
        })

        if (response.ok) {
          // Email sent successfully
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
          console.log(`✓ Sent email to ${email.companyName}`)
        } else {
          const errorText = await response.text()
          console.error(`Resend API error for ${email.companyName}:`, response.status, errorText)
          throw new Error(`Resend API error: ${response.statusText} - ${errorText}`)
        }
      } catch (error) {
        // Email failed to send
        console.error(`✗ Failed to send email to ${email.companyName}:`, error.message)

        const { error: updateError } = await supabase
          .from('campaign_recipients')
          .update({ status: 'failed' })
          .eq('id', email.recipientId)

        if (updateError) {
          console.error(`Failed to update recipient ${email.recipientId} to failed:`, updateError)
        }

        failedCount++
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

    console.log('Campaign sending completed!')

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
    console.error('Error in send-campaign:', error)

    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

// Helper function to generate personalized email using Gemini
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
}) {
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
    throw new Error(`Gemini API error: ${response.statusText}`)
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
}
