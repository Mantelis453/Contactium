import { corsHeaders } from '../_shared/cors.ts'
import { createSupabaseClient } from '../_shared/supabase.ts'

// Extract emails from HTML content
function extractEmails(html: string): string[] {
  const emailRegex = /[\w.-]+@[\w.-]+\.\w+/g
  const emails = html.match(emailRegex) || []

  // Filter out common false positives and duplicates
  const filtered = emails.filter(email => {
    const lower = email.toLowerCase()
    // Remove common image/script emails
    if (lower.includes('example.com')) return false
    if (lower.includes('yoursite.')) return false
    if (lower.includes('yourdomain.')) return false
    if (lower.includes('sentry.io')) return false
    if (lower.includes('googletagmanager')) return false
    if (lower.endsWith('.png')) return false
    if (lower.endsWith('.jpg')) return false
    if (lower.endsWith('.gif')) return false
    return true
  })

  // Return unique emails
  return [...new Set(filtered)]
}

// Extract text content from HTML
function extractTextContent(html: string): string {
  // Remove script and style elements
  let text = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ')
  text = text.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ')

  // Remove HTML tags
  text = text.replace(/<[^>]+>/g, ' ')

  // Decode HTML entities
  text = text.replace(/&nbsp;/g, ' ')
  text = text.replace(/&amp;/g, '&')
  text = text.replace(/&lt;/g, '<')
  text = text.replace(/&gt;/g, '>')
  text = text.replace(/&quot;/g, '"')

  // Clean up whitespace
  text = text.replace(/\s+/g, ' ').trim()

  // Limit to first 5000 characters for AI processing
  return text.substring(0, 5000)
}

// Generate business summary using Gemini AI
async function generateBusinessSummary(
  companyName: string,
  websiteText: string,
  geminiApiKey: string
): Promise<string> {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `You are a business analyst. Create a concise, professional summary of this company based on their website content. Focus on: what they do, who they serve, key products/services, and their unique value proposition. Keep the summary under 150 words.

Company: ${companyName}

Website Content:
${websiteText}

Create a professional business summary:`
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 300,
          }
        })
      }
    )

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.statusText}`)
    }

    const data = await response.json()
    return data.candidates?.[0]?.content?.parts?.[0]?.text || 'Unable to generate summary'
  } catch (error) {
    console.error('Error generating summary:', error)
    return 'Summary generation failed'
  }
}

// Auto-generate tags based on content using Gemini
async function generateTags(
  companyName: string,
  websiteText: string,
  businessSummary: string,
  geminiApiKey: string
): Promise<string[]> {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `You are a business categorization expert. Generate 3-7 relevant tags for this company based on their business summary.

Use tags like: B2B, B2C, SaaS, E-commerce, FinTech, HealthTech, EdTech, AI/ML, Blockchain, Cloud, Startup, Enterprise, Remote-first, Hiring, Funded, High-growth, Manufacturing, Consulting, Agency, etc.

Company: ${companyName}
Summary: ${businessSummary}

Return ONLY a JSON array of tag strings, nothing else. Example: ["B2B", "SaaS", "AI/ML"]`
            }]
          }],
          generationConfig: {
            temperature: 0.5,
            maxOutputTokens: 100,
          }
        })
      }
    )

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.statusText}`)
    }

    const data = await response.json()
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text || '[]'

    // Parse JSON array from response
    try {
      // Clean up the response - remove markdown code blocks if present
      const cleanContent = content.replace(/```json\n?|\n?```/g, '').trim()
      const tags = JSON.parse(cleanContent)
      return Array.isArray(tags) ? tags.slice(0, 7) : []
    } catch {
      // Fallback: extract tags from text
      const matches = content.match(/["']([^"']+)["']/g)
      if (matches) {
        return matches.map(m => m.replace(/["']/g, '')).slice(0, 7)
      }
      return []
    }
  } catch (error) {
    console.error('Error generating tags:', error)
    return []
  }
}

// Main scraping function
async function scrapeWebsite(url: string): Promise<{
  html: string
  emails: string[]
  textContent: string
  error?: string
}> {
  try {
    // Ensure URL has protocol
    if (!url.startsWith('http')) {
      url = 'https://' + url
    }

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Contactium Bot/1.0 (Business Intelligence Crawler)'
      },
      redirect: 'follow'
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const html = await response.text()
    const emails = extractEmails(html)
    const textContent = extractTextContent(html)

    return { html, emails, textContent }
  } catch (error) {
    return {
      html: '',
      emails: [],
      textContent: '',
      error: error.message
    }
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const supabase = createSupabaseClient()

  try {
    const { companyId, website, companyName, geminiApiKey } = await req.json()

    if (!companyId) {
      return new Response(
        JSON.stringify({ error: 'Company ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get company data including activity, email, and existing extracted_emails
    const { data: companyData, error: companyError } = await supabase
      .from('companies')
      .select('activity, email, extracted_emails, industry, location')
      .eq('id', companyId)
      .single()

    if (companyError) {
      console.error('Error fetching company:', companyError)
    }

    // Update status to in_progress
    await supabase
      .from('companies')
      .update({ scraping_status: 'in_progress' })
      .eq('id', companyId)

    // Initialize default values
    let scrapeResult = { html: '', emails: [], textContent: '', error: undefined }
    let businessSummary = 'No summary available'
    let tags: string[] = []

    // Scrape the website if URL is provided
    if (website) {
      console.log(`Scraping website: ${website}`)
      scrapeResult = await scrapeWebsite(website)

      if (scrapeResult.error) {
        console.warn(`Website scraping failed: ${scrapeResult.error}. Proceeding with tagging only.`)
      }
    } else {
      console.log('No website provided. Proceeding with tagging only.')
    }

    // Add company activity as a tag if it exists (Lithuanian business activity)
    if (companyData?.activity) {
      tags.push(companyData.activity)
      console.log(`Added activity tag: ${companyData.activity}`)
    }

    // Generate AI summary and tags if API key provided
    if (geminiApiKey) {
      if (scrapeResult.textContent) {
        // Generate from website content
        console.log('Generating AI summary with Gemini 2.0 Flash...')
        businessSummary = await generateBusinessSummary(
          companyName || 'this company',
          scrapeResult.textContent,
          geminiApiKey
        )

        console.log('Generating tags with Gemini 2.0 Flash...')
        const aiTags = await generateTags(
          companyName || 'this company',
          scrapeResult.textContent,
          businessSummary,
          geminiApiKey
        )

        // Merge AI tags with activity tag, removing duplicates
        tags = [...new Set([...tags, ...aiTags])]
      } else if (companyData?.activity || companyData?.industry) {
        // Generate tags from company metadata when no website available
        console.log('Generating tags from company metadata with Gemini 2.0 Flash...')
        const companyInfo = `Company: ${companyName || 'Unknown'}\nActivity: ${companyData?.activity || 'N/A'}\nIndustry: ${companyData?.industry || 'N/A'}\nLocation: ${companyData?.location || 'N/A'}`

        const aiTags = await generateTags(
          companyName || 'this company',
          companyInfo,
          `Company in ${companyData?.industry || companyData?.activity || 'general business'}`,
          geminiApiKey
        )

        // Merge AI tags with activity tag, removing duplicates
        tags = [...new Set([...tags, ...aiTags])]
      }
    }

    // Merge emails: existing email + existing extracted_emails + new scraped emails
    const allEmails: string[] = []

    // Add existing email if it exists
    if (companyData?.email) {
      allEmails.push(companyData.email)
    }

    // Add existing extracted_emails if they exist
    if (companyData?.extracted_emails && Array.isArray(companyData.extracted_emails)) {
      allEmails.push(...companyData.extracted_emails)
    }

    // Add newly scraped emails
    if (scrapeResult.emails && scrapeResult.emails.length > 0) {
      allEmails.push(...scrapeResult.emails)
    }

    // Remove duplicates and keep unique emails only
    const uniqueEmails = [...new Set(allEmails)]

    console.log(`Total unique emails: ${uniqueEmails.length} (existing: ${companyData?.extracted_emails?.length || 0}, new: ${scrapeResult.emails.length})`)

    // Update company with scraped data (preserving original email field)
    const { data: updatedCompany, error: updateError } = await supabase
      .from('companies')
      .update({
        extracted_emails: uniqueEmails,
        business_summary: businessSummary,
        tags: tags,
        scraping_status: 'completed',
        scraping_error: null,
        last_scraped_at: new Date().toISOString()
      })
      .eq('id', companyId)
      .select()
      .single()

    if (updateError) throw updateError

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          company: updatedCompany,
          extracted_emails: uniqueEmails,
          business_summary: businessSummary,
          tags: tags,
          emails_found: scrapeResult.emails.length,
          total_emails: uniqueEmails.length
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in scrape-company function:', error)

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
