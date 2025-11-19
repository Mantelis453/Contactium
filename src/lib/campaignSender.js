import { supabase } from './supabase'

/**
 * Send a campaign's emails to all recipients
 * Calls Supabase Edge Function to handle sending server-side
 * @param {string} campaignId - The campaign ID
 * @param {string} userId - The user ID
 * @returns {Promise<Object>} Results of sending
 */
export async function sendCampaign(campaignId, userId) {
  try {
    console.log('Starting campaign send via Supabase Edge Function:', campaignId)

    // Call Supabase Edge Function to handle campaign sending server-side
    const response = await supabase.functions.invoke('send-campaign', {
      body: {
        campaignId,
        userId
      }
    })

    console.log('Full response:', response)

    const { data, error } = response

    if (error) {
      console.error('Edge Function error:', error)
      console.error('Error details:', JSON.stringify(error, null, 2))

      // Try to extract error message from response context
      let errorMessage = error.message || 'Failed to send campaign'

      // If there's context with more details, use it
      if (error.context) {
        try {
          const contextData = typeof error.context === 'string' ? JSON.parse(error.context) : error.context
          console.error('Error context:', contextData)
          if (contextData.error) {
            errorMessage = contextData.error
          }
        } catch (e) {
          console.error('Failed to parse error context:', e)
        }
      }

      console.error('📛 Detailed error:', errorMessage)
      throw new Error(errorMessage)
    }

    // Check if data exists and has the expected structure
    if (!data) {
      console.error('❌ No response data from Edge Function')
      throw new Error('No response data from Edge Function')
    }

    console.log('Response data:', data)

    if (data.success === false) {
      console.error('❌ Campaign failed:', data.error)
      throw new Error(data.error || 'Campaign sending failed')
    }

    console.log('✅ Campaign send completed:', data)

    return {
      success: true,
      total: data.total,
      sent: data.sent,
      failed: data.failed,
      message: data.message
    }

  } catch (error) {
    console.error('❌ Error in sendCampaign:', error)
    throw error
  }
}
