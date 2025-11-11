import { generatePersonalizedEmail } from './aiService'

export async function generateBatchEmails({
  companies,
  campaignData,
  onProgress
}) {
  const results = []
  const total = companies.length

  for (let i = 0; i < companies.length; i++) {
    const company = companies[i]

    try {
      // Update progress
      if (onProgress) {
        onProgress({ current: i + 1, total, companyName: company.name })
      }

      // Generate personalized email for this company
      const email = await generatePersonalizedEmail({
        description: campaignData.description,
        category: campaignData.category,
        company: company,
        senderName: campaignData.senderName,
        senderCompany: campaignData.senderCompany,
        senderTitle: campaignData.senderTitle,
        valueProposition: campaignData.valueProposition,
        callToAction: campaignData.callToAction
      })

      results.push({
        companyId: company.id,
        companyName: company.name,
        subject: email.subject,
        body: email.body,
        success: true
      })

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500))
    } catch (error) {
      console.error(`Failed to generate email for ${company.name}:`, error)
      results.push({
        companyId: company.id,
        companyName: company.name,
        error: error.message,
        success: false
      })
    }
  }

  return results
}
