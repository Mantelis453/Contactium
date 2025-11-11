import nodemailer from 'nodemailer'

/**
 * Create a nodemailer transporter with user's SMTP settings
 * @param {Object} smtpConfig - SMTP configuration
 * @returns {Object} Nodemailer transporter
 */
export function createTransporter(smtpConfig) {
  const { smtp_host, smtp_port, smtp_username, smtp_password, smtp_secure } = smtpConfig

  if (!smtp_host || !smtp_port || !smtp_username || !smtp_password) {
    throw new Error('SMTP configuration is incomplete. Please configure your email settings.')
  }

  return nodemailer.createTransport({
    host: smtp_host,
    port: parseInt(smtp_port),
    secure: smtp_secure || smtp_port === '465', // true for 465, false for other ports
    auth: {
      user: smtp_username,
      pass: smtp_password,
    },
  })
}

/**
 * Send a single email
 * @param {Object} transporter - Nodemailer transporter
 * @param {Object} emailData - Email data (to, subject, text, html)
 * @param {Object} senderInfo - Sender information
 * @returns {Promise<Object>} Send result
 */
export async function sendEmail(transporter, emailData, senderInfo) {
  const { to, subject, text, html } = emailData
  const { sender_name, sender_email } = senderInfo

  if (!to || !subject || (!text && !html)) {
    throw new Error('Email data is incomplete. Required: to, subject, and text or html')
  }

  const mailOptions = {
    from: `"${sender_name}" <${sender_email}>`,
    to,
    subject,
    text,
    html,
  }

  try {
    const info = await transporter.sendMail(mailOptions)
    return {
      success: true,
      messageId: info.messageId,
      response: info.response,
    }
  } catch (error) {
    console.error('Error sending email:', error)
    throw error
  }
}

/**
 * Send multiple emails in batch
 * @param {Object} transporter - Nodemailer transporter
 * @param {Array} emails - Array of email data objects
 * @param {Object} senderInfo - Sender information
 * @returns {Promise<Array>} Array of send results
 */
export async function sendBatchEmails(transporter, emails, senderInfo) {
  const results = []

  for (const emailData of emails) {
    try {
      const result = await sendEmail(transporter, emailData, senderInfo)
      results.push({
        to: emailData.to,
        success: true,
        ...result,
      })
    } catch (error) {
      results.push({
        to: emailData.to,
        success: false,
        error: error.message,
      })
    }
  }

  return results
}

/**
 * Test SMTP connection
 * @param {Object} smtpConfig - SMTP configuration
 * @returns {Promise<boolean>} Connection test result
 */
export async function testConnection(smtpConfig) {
  const transporter = createTransporter(smtpConfig)

  try {
    await transporter.verify()
    return { success: true, message: 'SMTP connection successful' }
  } catch (error) {
    console.error('SMTP connection test failed:', error)
    return { success: false, message: error.message }
  }
}
