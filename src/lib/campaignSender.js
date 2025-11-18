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
    const { data, error } = await supabase.functions.invoke('send-campaign', {
      body: {
        campaignId,
        userId
      }
    })

    if (error) {
      console.error('Edge Function error:', error)
      throw new Error(error.message || 'Failed to send campaign')
    }

    if (!data.success) {
      throw new Error(data.error || 'Campaign sending failed')
    }

    console.log('Campaign send completed:', data)

    return {
      success: true,
      total: data.total,
      sent: data.sent,
      failed: data.failed,
      message: data.message
    }

  } catch (error) {
    console.error('Error in sendCampaign:', error)
    throw error
  }
}
