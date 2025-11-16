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

// Generate business summary using AI
async function generateBusinessSummary(
  companyName: string,
  websiteText: string,
  openaiApiKey: string
): Promise<string> {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a business analyst. Create concise, professional summaries of companies based on their website content. Focus on: what they do, who they serve, key products/services, and their unique value proposition. Keep summaries under 150 words.'
          },
          {
            role: 'user',
            content: `Analyze this website content for ${companyName} and create a professional business summary:\n\n${websiteText}`
          }
        ],
        temperature: 0.7,
        max_tokens: 300
      })
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`)
    }

    const data = await response.json()
    return data.choices[0]?.message?.content || 'Unable to generate summary'
  } catch (error) {
    console.error('Error generating summary:', error)
    return 'Summary generation failed'
  }
}

// Auto-generate tags based on content
async function generateTags(
  companyName: string,
  websiteText: string,
  businessSummary: string,
  openaiApiKey: string
): Promise<string[]> {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a business categorization expert. Generate 3-7 relevant tags for companies based on their business summary and website content. Use tags like: B2B, B2C, SaaS, E-commerce, FinTech, HealthTech, EdTech, AI/ML, Blockchain, Cloud, Startup, Enterprise, Remote-first, Hiring, Funded, High-growth, Manufacturing, Consulting, Agency, etc. Return ONLY a JSON array of tag strings, nothing else.`
          },
          {
            role: 'user',
            content: `Company: ${companyName}\nSummary: ${businessSummary}\n\nGenerate appropriate tags (JSON array only):`
          }
        ],
        temperature: 0.5,
        max_tokens: 100
      })
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`)
    }

    const data = await response.json()
    const content = data.choices[0]?.message?.content || '[]'

    // Parse JSON array from response
    try {
      const tags = JSON.parse(content)
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
    const { companyId, website, companyName, openaiApiKey } = await req.json()

    if (!companyId) {
      return new Response(
        JSON.stringify({ error: 'Company ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!website) {
      return new Response(
        JSON.stringify({ error: 'Website URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Update status to in_progress
    await supabase
      .from('companies')
      .update({ scraping_status: 'in_progress' })
      .eq('id', companyId)

    // Scrape the website
    console.log(`Scraping website: ${website}`)
    const scrapeResult = await scrapeWebsite(website)

    if (scrapeResult.error) {
      // Update with error status
      await supabase
        .from('companies')
        .update({
          scraping_status: 'failed',
          scraping_error: scrapeResult.error,
          last_scraped_at: new Date().toISOString()
        })
        .eq('id', companyId)

      return new Response(
        JSON.stringify({
          success: false,
          error: scrapeResult.error
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    let businessSummary = 'No summary available'
    let tags: string[] = []

    // Generate AI summary and tags if API key provided
    if (openaiApiKey && scrapeResult.textContent) {
      console.log('Generating AI summary...')
      businessSummary = await generateBusinessSummary(
        companyName || 'this company',
        scrapeResult.textContent,
        openaiApiKey
      )

      console.log('Generating tags...')
      tags = await generateTags(
        companyName || 'this company',
        scrapeResult.textContent,
        businessSummary,
        openaiApiKey
      )
    }

    // Update company with scraped data
    const { data: updatedCompany, error: updateError } = await supabase
      .from('companies')
      .update({
        extracted_emails: scrapeResult.emails,
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
          extracted_emails: scrapeResult.emails,
          business_summary: businessSummary,
          tags: tags,
          emails_found: scrapeResult.emails.length
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
