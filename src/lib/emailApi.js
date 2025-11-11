const API_URL = import.meta.env.VITE_EMAIL_API_URL || 'http://localhost:3001'

/**
 * Test SMTP connection
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Test result
 */
export async function testSmtpConnection(userId) {
  try {
    const response = await fetch(`${API_URL}/api/email/test`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId }),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || 'Failed to test SMTP connection')
    }

    return data
  } catch (error) {
    console.error('Error testing SMTP connection:', error)
    throw error
  }
}

/**
 * Send a single email
 * @param {string} userId - User ID
 * @param {Object} emailData - Email data (to, subject, text, html)
 * @returns {Promise<Object>} Send result
 */
export async function sendEmail(userId, emailData) {
  try {
    const response = await fetch(`${API_URL}/api/email/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        ...emailData,
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || 'Failed to send email')
    }

    return data
  } catch (error) {
    console.error('Error sending email:', error)
    throw error
  }
}

/**
 * Send multiple emails in batch
 * @param {string} userId - User ID
 * @param {Array} emails - Array of email data objects
 * @returns {Promise<Object>} Batch send results
 */
export async function sendBatchEmails(userId, emails) {
  try {
    const response = await fetch(`${API_URL}/api/email/send-batch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        emails,
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || 'Failed to send batch emails')
    }

    return data
  } catch (error) {
    console.error('Error sending batch emails:', error)
    throw error
  }
}
