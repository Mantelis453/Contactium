import { supabase } from './supabase'
import { sendBatchEmails } from './emailApi'
import { generatePersonalizedEmail } from './aiService'

/**
 * Send a campaign's emails to all recipients
 * @param {string} campaignId - The campaign ID
 * @param {string} userId - The user ID
 * @returns {Promise<Object>} Results of sending
 */
export async function sendCampaign(campaignId, userId) {
  try {
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
    const { error: updateError } = await supabase
      .from('campaigns')
      .update({
        status: 'running',
        updated_at: new Date().toISOString()
      })
      .eq('id', campaignId)

    if (updateError) {
      console.error('Error updating campaign to running:', updateError)
      // Continue anyway - this is not critical
    }

    // 4. Get all pending recipients (supports both companies and contacts)
    const { data: recipients, error: recipientsError } = await supabase
      .from('campaign_recipients')
      .select(`
        id,
        company_id,
        contact_id,
        recipient_email,
        recipient_name,
        status
      `)
      .eq('campaign_id', campaignId)
      .eq('status', 'pending')

    if (recipientsError) throw recipientsError

    console.log(`Found ${recipients.length} recipients to send to`)

    if (recipients.length === 0) {
      // No pending recipients, mark as completed
      await supabase
        .from('campaigns')
        .update({
          status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('id', campaignId)

      return {
        success: true,
        total: 0,
        sent: 0,
        failed: 0,
        message: 'No pending recipients found'
      }
    }

    // 4b. Fetch company details for company-based recipients (if any)
    const companyIds = recipients.filter(r => r.company_id).map(r => r.company_id)
    let companiesMap = new Map()

    if (companyIds.length > 0) {
      const { data: companies, error: companiesError } = await supabase
        .from('companies')
        .select('id, company_name, email, activity, employees, address')
        .in('id', companyIds)

      if (companiesError) {
        console.error('Error fetching companies:', companiesError)
      } else {
        companies.forEach(c => companiesMap.set(c.id, c))
      }
    }

    // Enrich recipients with company data or use contact data
    const enrichedRecipients = recipients.map(recipient => {
      if (recipient.company_id) {
        // Company-based recipient
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
        // Contact-based recipient - create a company-like object for compatibility
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

    // 5. Generate personalized emails for each recipient
    console.log('Generating personalized emails...')
    const emailsToSend = []
    const failedGenerations = []

    for (const recipient of enrichedRecipients) {
      try {
        // Generate personalized email using AI
        const personalizedEmail = await generatePersonalizedEmail({
          description: campaign.description,
          category: campaign.category,
          company: recipient.companies,
          senderName: campaign.sender_name,
          senderCompany: campaign.sender_company,
          senderTitle: campaign.sender_title,
          valueProposition: campaign.value_proposition,
          callToAction: campaign.call_to_action
        })

        emailsToSend.push({
          recipientId: recipient.id,
          to: recipient.companies.email,
          subject: personalizedEmail.subject,
          html: personalizedEmail.body.replace(/\n/g, '<br>'), // Convert newlines to HTML
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

    // 6. Send emails in batch using the email API
    console.log('Sending emails...')
    let sendResults = { successful: 0, failed: 0, results: [] }

    if (emailsToSend.length > 0) {
      try {
        sendResults = await sendBatchEmails(
          userId,
          emailsToSend.map(email => ({
            to: email.to,
            subject: email.subject,
            html: email.html
          }))
        )
        console.log('Email API results:', sendResults)
      } catch (error) {
        console.error('Error sending batch emails:', error)
        throw new Error(`Failed to send emails: ${error.message}`)
      }
    }

    // 7. Update recipient statuses based on send results
    console.log('Updating recipient statuses...')
    for (let i = 0; i < emailsToSend.length; i++) {
      const email = emailsToSend[i]
      const result = sendResults.results[i]

      console.log(`Updating recipient ${email.recipientId}:`, result?.success ? 'sent' : 'failed')

      if (result && result.success) {
        // Email sent successfully
        const { data: updateData, error: updateErr } = await supabase
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
          .select()

        if (updateErr) {
          console.error('Error updating recipient to sent:', updateErr)
          console.error('Recipient ID:', email.recipientId)
          console.error('Update data:', { status: 'sent', sent_at: new Date().toISOString() })
        } else {
          console.log(`✓ Successfully updated recipient ${email.recipientId} to sent`)
          console.log('Updated data:', updateData)
        }
      } else {
        // Email failed to send
        const { data: updateData, error: updateErr } = await supabase
          .from('campaign_recipients')
          .update({
            status: 'failed'
          })
          .eq('id', email.recipientId)
          .select()

        if (updateErr) {
          console.error('Error updating recipient to failed:', updateErr)
          console.error('Recipient ID:', email.recipientId)
        } else {
          console.log(`✓ Successfully updated recipient ${email.recipientId} to failed`)
          console.log('Error reason:', result?.error || 'Unknown error')
          console.log('Updated data:', updateData)
        }
      }
    }

    // 8. Mark failed generations
    for (const failed of failedGenerations) {
      console.log(`Email generation failed for ${failed.companyName}:`, failed.error)
      const { error: updateErr } = await supabase
        .from('campaign_recipients')
        .update({
          status: 'failed'
        })
        .eq('id', failed.recipientId)

      if (updateErr) {
        console.error('Error updating failed generation recipient:', updateErr)
      }
    }

    // 9. Update campaign status to completed and update email counts
    const { error: completeError } = await supabase
      .from('campaigns')
      .update({
        status: 'completed',
        emails_sent: sendResults.successful,
        updated_at: new Date().toISOString()
      })
      .eq('id', campaignId)

    if (completeError) {
      console.error('Error updating campaign to completed:', completeError)
      // Continue anyway - emails were sent
    }

    console.log('Campaign sending completed!')

    return {
      success: true,
      total: enrichedRecipients.length,
      sent: sendResults.successful,
      failed: sendResults.failed + failedGenerations.length,
      message: `Successfully sent ${sendResults.successful} emails, ${sendResults.failed + failedGenerations.length} failed`
    }

  } catch (error) {
    console.error('Error in sendCampaign:', error)

    // Update campaign status to failed
    await supabase
      .from('campaigns')
      .update({
        status: 'failed',
        updated_at: new Date().toISOString()
      })
      .eq('id', campaignId)
      .then(() => {}, () => {}) // Ignore errors on this update

    throw error
  }
}
