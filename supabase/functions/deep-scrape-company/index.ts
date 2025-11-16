import { corsHeaders } from '../_shared/cors.ts'
import { createSupabaseClient } from '../_shared/supabase.ts'

// Extract emails from HTML
function extractEmails(html: string): string[] {
  const emailRegex = /[\w.-]+@[\w.-]+\.\w+/g
  const emails = html.match(emailRegex) || []

  const filtered = emails.filter(email => {
    const lower = email.toLowerCase()
    if (lower.includes('example.com')) return false
    if (lower.includes('yoursite.')) return false
    if (lower.includes('yourdomain.')) return false
    if (lower.includes('sentry.io')) return false
    if (lower.includes('googletagmanager')) return false
    if (lower.endsWith('.png')) return false
    if (lower.endsWith('.jpg')) return false
    if (lower.endsWith('.gif')) return false
    if (lower.endsWith('.svg')) return false
    if (lower.endsWith('.css')) return false
    if (lower.endsWith('.js')) return false

    // Basic email format validation
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailPattern.test(email)) return false

    // Must have valid TLD (at least 2 characters)
    const parts = email.split('.')
    if (parts.length < 2 || parts[parts.length - 1].length < 2) return false

    return true
  })

  return [...new Set(filtered)]
}

// Verify if email domain has valid MX records
async function verifyEmailDomain(email: string): Promise<{ valid: boolean; reason?: string }> {
  try {
    const domain = email.split('@')[1]
    if (!domain) return { valid: false, reason: 'Invalid email format' }

    // Try to resolve DNS for the domain
    try {
      // Use DNS-over-HTTPS (Cloudflare)
      const response = await fetch(`https://cloudflare-dns.com/dns-query?name=${domain}&type=MX`, {
        headers: {
          'Accept': 'application/dns-json'
        }
      })

      if (!response.ok) {
        return { valid: false, reason: 'DNS lookup failed' }
      }

      const data = await response.json()

      // Check if domain has MX records
      if (data.Answer && data.Answer.length > 0) {
        const mxRecords = data.Answer.filter((record: any) => record.type === 15) // MX records are type 15
        if (mxRecords.length > 0) {
          return { valid: true }
        }
      }

      // Try A record as fallback (some domains use A records for mail)
      const aResponse = await fetch(`https://cloudflare-dns.com/dns-query?name=${domain}&type=A`, {
        headers: {
          'Accept': 'application/dns-json'
        }
      })

      if (aResponse.ok) {
        const aData = await aResponse.json()
        if (aData.Answer && aData.Answer.length > 0) {
          return { valid: true, reason: 'Domain exists (no MX, has A record)' }
        }
      }

      return { valid: false, reason: 'No MX or A records found' }
    } catch (dnsError) {
      console.log(`DNS lookup error for ${domain}:`, dnsError.message)
      return { valid: false, reason: 'Domain does not exist' }
    }
  } catch (error) {
    console.log(`Email verification error:`, error.message)
    return { valid: false, reason: 'Verification failed' }
  }
}

// Verify multiple emails in batch
async function verifyEmails(emails: string[]): Promise<{ verified: string[]; unverified: string[] }> {
  const verified: string[] = []
  const unverified: string[] = []
  const domainCache = new Map<string, boolean>()

  console.log(`Verifying ${emails.length} email addresses...`)

  for (const email of emails) {
    const domain = email.split('@')[1]

    // Check cache first
    if (domainCache.has(domain)) {
      if (domainCache.get(domain)) {
        verified.push(email)
      } else {
        unverified.push(email)
      }
      continue
    }

    // Verify domain
    const result = await verifyEmailDomain(email)
    domainCache.set(domain, result.valid)

    if (result.valid) {
      verified.push(email)
      console.log(`✓ Valid: ${email}`)
    } else {
      unverified.push(email)
      console.log(`✗ Invalid: ${email} (${result.reason})`)
    }

    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 100))
  }

  console.log(`Verification complete: ${verified.length} valid, ${unverified.length} invalid`)

  return { verified, unverified }
}

// Extract phone numbers
function extractPhoneNumbers(html: string): string[] {
  const phones: string[] = []

  // Lithuanian international format: +370 xxx xxx xxx or +370-xxx-xxx-xxx
  const lithuanianIntl = html.match(/\+370[-.\s]?\d{1,3}[-.\s]?\d{2,3}[-.\s]?\d{2,4}/g)
  if (lithuanianIntl) phones.push(...lithuanianIntl)

  // Lithuanian domestic format: 0 xxx xxx xxx or 8 xxx xxx xxx
  const lithuanianDomestic = html.match(/\b[08][-.\s]?\d{1,3}[-.\s]?\d{2,3}[-.\s]?\d{2,4}\b/g)
  if (lithuanianDomestic) phones.push(...lithuanianDomestic)

  // Generic international format: +XX XXX XXX XXX
  const international = html.match(/\+\d{1,3}[-.\s]?\d{2,4}[-.\s]?\d{2,4}[-.\s]?\d{2,4}/g)
  if (international) phones.push(...international)

  // Generic format with parentheses: (XXX) XXX-XXXX
  const withParens = html.match(/\(\d{2,4}\)[-.\s]?\d{2,4}[-.\s]?\d{2,4}/g)
  if (withParens) phones.push(...withParens)

  // Filter to only keep valid-looking phone numbers
  const filtered = phones.filter(phone => {
    const digitsOnly = phone.replace(/\D/g, '')
    const digitCount = digitsOnly.length

    // Valid phone numbers: 7-15 digits
    if (digitCount < 7 || digitCount > 15) return false

    // Lithuanian numbers should start with +370, 8, or 0
    if (phone.startsWith('+370') || phone.startsWith('8') || phone.startsWith('0')) {
      return digitCount >= 8 && digitCount <= 11
    }

    // Other international numbers
    if (phone.startsWith('+')) {
      return digitCount >= 10 && digitCount <= 15
    }

    return digitCount >= 7
  })

  // Clean up and deduplicate
  const cleaned = filtered.map(phone => {
    // Normalize spacing
    let clean = phone.trim()
    // Convert 8xxx to +370xxx for Lithuanian numbers
    if (clean.startsWith('8') && clean.replace(/\D/g, '').length === 9) {
      clean = '+370' + clean.substring(1)
    }
    return clean
  })

  return [...new Set(cleaned)]
}

// Extract social media links
function extractSocialMedia(html: string): any {
  const social: any = {}

  // LinkedIn
  const linkedinMatch = html.match(/linkedin\.com\/(company|in)\/([a-zA-Z0-9-]+)/i)
  if (linkedinMatch) social.linkedin = `https://linkedin.com/${linkedinMatch[1]}/${linkedinMatch[2]}`

  // Twitter/X
  const twitterMatch = html.match(/(twitter\.com|x\.com)\/([a-zA-Z0-9_]+)/i)
  if (twitterMatch) social.twitter = `https://twitter.com/${twitterMatch[2]}`

  // Facebook
  const facebookMatch = html.match(/facebook\.com\/([a-zA-Z0-9.]+)/i)
  if (facebookMatch) social.facebook = `https://facebook.com/${facebookMatch[1]}`

  // Instagram
  const instagramMatch = html.match(/instagram\.com\/([a-zA-Z0-9_.]+)/i)
  if (instagramMatch) social.instagram = `https://instagram.com/${instagramMatch[1]}`

  // YouTube
  const youtubeMatch = html.match(/youtube\.com\/(channel|c|user|@)\/([a-zA-Z0-9_-]+)/i)
  if (youtubeMatch) social.youtube = `https://youtube.com/${youtubeMatch[1]}/${youtubeMatch[2]}`

  return social
}

// Detect technologies from HTML
function detectTechnologies(html: string): string[] {
  const technologies: string[] = []

  // CMS Detection
  if (html.includes('wp-content') || html.includes('wordpress')) technologies.push('WordPress')
  if (html.includes('shopify')) technologies.push('Shopify')
  if (html.includes('wix.com')) technologies.push('Wix')
  if (html.includes('squarespace')) technologies.push('Squarespace')
  if (html.includes('webflow')) technologies.push('Webflow')

  // Analytics
  if (html.includes('google-analytics') || html.includes('gtag')) technologies.push('Google Analytics')
  if (html.includes('facebook-pixel')) technologies.push('Facebook Pixel')
  if (html.includes('hotjar')) technologies.push('Hotjar')

  // Marketing
  if (html.includes('hubspot')) technologies.push('HubSpot')
  if (html.includes('mailchimp')) technologies.push('Mailchimp')
  if (html.includes('intercom')) technologies.push('Intercom')

  // E-commerce
  if (html.includes('stripe')) technologies.push('Stripe')
  if (html.includes('paypal')) technologies.push('PayPal')

  // Frameworks
  if (html.includes('react')) technologies.push('React')
  if (html.includes('vue')) technologies.push('Vue.js')
  if (html.includes('angular')) technologies.push('Angular')
  if (html.includes('next')) technologies.push('Next.js')

  return [...new Set(technologies)]
}

// Extract text content from HTML
function extractTextContent(html: string): string {
  let text = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ')
  text = text.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ')
  text = text.replace(/<[^>]+>/g, ' ')
  text = text.replace(/&nbsp;/g, ' ')
  text = text.replace(/&amp;/g, '&')
  text = text.replace(/&lt;/g, '<')
  text = text.replace(/&gt;/g, '>')
  text = text.replace(/&quot;/g, '"')
  text = text.replace(/\s+/g, ' ').trim()
  return text
}

// Scrape a single page
async function scrapePage(url: string): Promise<{ html: string; text: string; error?: string }> {
  try {
    if (!url.startsWith('http')) {
      url = 'https://' + url
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 15000) // 15 second timeout

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      },
      redirect: 'follow',
      signal: controller.signal
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    const html = await response.text()
    const text = extractTextContent(html)

    return { html, text }
  } catch (error) {
    console.log(`Failed to scrape ${url}: ${error.message}`)
    return { html: '', text: '', error: error.message }
  }
}

// Generate common page URLs to scrape
function generatePageUrls(baseUrl: string): string[] {
  const base = baseUrl.replace(/\/$/, '')
  return [
    base, // Homepage
    `${base}/about`,
    `${base}/about-us`,
    `${base}/company`,
    `${base}/team`,
    `${base}/people`,
    `${base}/leadership`,
    `${base}/contact`,
    `${base}/contact-us`,
    `${base}/careers`,
    `${base}/jobs`
  ]
}

// Use AI to extract key personnel
async function extractKeyPersonnel(
  companyName: string,
  allText: string,
  geminiApiKey: string
): Promise<any[]> {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `Extract key personnel from this company's website content. Look for executives, founders, directors.

Company: ${companyName}

Content:
${allText.substring(0, 8000)}

Return ONLY a JSON array of people with this format:
[{"name": "John Smith", "title": "CEO & Founder", "email": "john@company.com"}]

If no email found, omit the email field. Return empty array [] if no personnel found.`
            }]
          }],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 500,
          }
        })
      }
    )

    if (!response.ok) return []

    const data = await response.json()
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text || '[]'

    try {
      const cleanContent = content.replace(/```json\n?|\n?```/g, '').trim()
      const personnel = JSON.parse(cleanContent)
      return Array.isArray(personnel) ? personnel : []
    } catch {
      return []
    }
  } catch (error) {
    console.error('Error extracting personnel:', error)
    return []
  }
}

// Use AI to extract services/products
async function extractServices(
  companyName: string,
  allText: string,
  geminiApiKey: string
): Promise<string[]> {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `Extract the main services or products this company offers.

Company: ${companyName}

Content:
${allText.substring(0, 8000)}

Return ONLY a JSON array of services/products (3-8 items max):
["Service 1", "Service 2", "Service 3"]

Be concise. Return empty array [] if unclear.`
            }]
          }],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 200,
          }
        })
      }
    )

    if (!response.ok) return []

    const data = await response.json()
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text || '[]'

    try {
      const cleanContent = content.replace(/```json\n?|\n?```/g, '').trim()
      const services = JSON.parse(cleanContent)
      return Array.isArray(services) ? services.slice(0, 8) : []
    } catch {
      return []
    }
  } catch (error) {
    console.error('Error extracting services:', error)
    return []
  }
}

// Use AI to extract company data
async function extractCompanyData(
  companyName: string,
  allText: string,
  geminiApiKey: string
): Promise<{ foundedYear?: number; employeeCount?: number; certifications: string[] }> {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `Extract company information from this website content.

Company: ${companyName}

Content:
${allText.substring(0, 8000)}

Return ONLY valid JSON with this exact format:
{
  "foundedYear": 2020,
  "employeeCount": 50,
  "certifications": ["ISO 9001", "Award Name"]
}

- foundedYear: year only (number), or null if not found
- employeeCount: approximate number, or null if not found
- certifications: array of certifications/awards/achievements, or empty array []

Return null for fields you can't find.`
            }]
          }],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 300,
          }
        })
      }
    )

    if (!response.ok) return { certifications: [] }

    const data = await response.json()
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}'

    try {
      const cleanContent = content.replace(/```json\n?|\n?```/g, '').trim()
      const parsed = JSON.parse(cleanContent)
      return {
        foundedYear: parsed.foundedYear || undefined,
        employeeCount: parsed.employeeCount || undefined,
        certifications: Array.isArray(parsed.certifications) ? parsed.certifications : []
      }
    } catch {
      return { certifications: [] }
    }
  } catch (error) {
    console.error('Error extracting company data:', error)
    return { certifications: [] }
  }
}

// Detect email pattern
function detectEmailPattern(emails: string[]): string | null {
  if (emails.length < 2) return null

  const patterns = new Map<string, number>()

  for (const email of emails) {
    const [localPart, domain] = email.split('@')
    if (!localPart || !domain) continue

    // Check for firstname.lastname pattern
    if (localPart.includes('.')) {
      patterns.set('firstname.lastname', (patterns.get('firstname.lastname') || 0) + 1)
    }
    // Check for firstnamelastname pattern
    else if (localPart.length > 5 && /^[a-z]+$/.test(localPart)) {
      patterns.set('firstnamelastname', (patterns.get('firstnamelastname') || 0) + 1)
    }
    // Check for firstname pattern
    else if (localPart.length > 2 && /^[a-z]+$/.test(localPart)) {
      patterns.set('firstname', (patterns.get('firstname') || 0) + 1)
    }
  }

  // Return most common pattern
  let maxCount = 0
  let commonPattern = null
  for (const [pattern, count] of patterns.entries()) {
    if (count > maxCount) {
      maxCount = count
      commonPattern = pattern
    }
  }

  return commonPattern
}

// Generate common email addresses
function generateCommonEmails(domain: string): string[] {
  const common = ['info', 'contact', 'hello', 'sales', 'support', 'admin', 'office']
  return common.map(prefix => `${prefix}@${domain}`)
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

    if (!website) {
      return new Response(
        JSON.stringify({ error: 'Website URL is required for deep scraping' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!geminiApiKey) {
      return new Response(
        JSON.stringify({ error: 'Gemini API key is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Starting deep scrape for: ${companyName} (${website})`)

    // Check for "no website" indicators (Lithuanian and common placeholders)
    const noWebsiteIndicators = [
      'neturime',
      'nėra',
      'n/a',
      'na',
      'none',
      'no website',
      'no',
      '-',
      ''
    ]

    const websiteLower = website.toLowerCase().trim()
    if (noWebsiteIndicators.includes(websiteLower)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Company does not have a website (marked as "neturime" or similar). Deep scraping requires a valid website URL.'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate website URL format
    let cleanedWebsite = website.trim()

    // Add https:// if not present
    if (!cleanedWebsite.startsWith('http')) {
      cleanedWebsite = 'https://' + cleanedWebsite
    }

    // Check if URL has a valid domain extension
    try {
      const urlObj = new URL(cleanedWebsite)
      const hostname = urlObj.hostname

      // Check if hostname has at least one dot (e.g., example.com)
      if (!hostname.includes('.')) {
        throw new Error(`Invalid website URL: "${website}". Please provide a valid domain (e.g., company.com, company.lt)`)
      }

      // Check if it's a valid format (not just a slash or missing TLD)
      if (hostname.endsWith('.') || hostname.split('.').length < 2) {
        throw new Error(`Invalid website URL: "${website}". Please provide a complete domain (e.g., company.com)`)
      }
    } catch (error) {
      if (error.message.includes('Invalid website URL')) {
        throw error
      }
      throw new Error(`Invalid website URL format: "${website}". Please check the URL and try again.`)
    }

    // Update status
    await supabase
      .from('companies')
      .update({ scraping_status: 'in_progress' })
      .eq('id', companyId)

    // Generate URLs to scrape
    const urls = generatePageUrls(website)
    console.log(`Attempting to scrape ${urls.length} pages...`)

    // Try homepage first - this is critical
    const homepageResult = await scrapePage(urls[0])
    if (homepageResult.error || !homepageResult.html) {
      throw new Error(`Could not scrape homepage: ${homepageResult.error || 'No content returned'}`)
    }

    console.log(`✓ Successfully scraped homepage`)

    // Scrape remaining pages (optional - we'll continue even if these fail)
    const results = [homepageResult]
    for (let i = 1; i < urls.length; i++) {
      const url = urls[i]
      const result = await scrapePage(url)
      if (!result.error && result.html) {
        results.push(result)
        console.log(`✓ Scraped: ${url}`)
      } else {
        console.log(`✗ Failed: ${url} - ${result.error}`)
      }
      // Small delay to be respectful
      await new Promise(resolve => setTimeout(resolve, 500))
    }

    console.log(`Successfully scraped ${results.length} of ${urls.length} pages`)

    // Combine all HTML and text
    const allHtml = results.map(r => r.html).join('\n')
    const allText = results.map(r => r.text).join('\n')

    // Extract data from all pages
    const allEmails = extractEmails(allHtml)
    const allPhones = extractPhoneNumbers(allHtml)
    const socialMedia = extractSocialMedia(allHtml)
    const technologies = detectTechnologies(allHtml)

    // Get domain for email generation
    const domain = website.replace(/^https?:\/\//i, '').replace(/\/$/, '').split('/')[0]
    const commonEmails = generateCommonEmails(domain)

    // Merge all emails
    const uniqueEmails = [...new Set([...allEmails, ...commonEmails])]

    // Verify emails to filter out invalid ones
    console.log('Verifying email addresses...')
    const { verified: verifiedEmails, unverified: unverifiedEmails } = await verifyEmails(uniqueEmails)

    // Detect email pattern from verified emails
    const emailPattern = detectEmailPattern(verifiedEmails)

    console.log(`Found ${uniqueEmails.length} unique emails (${verifiedEmails.length} verified, ${unverifiedEmails.length} invalid), ${allPhones.length} phones`)

    // Use AI to extract structured data
    console.log('Extracting key personnel with AI...')
    const keyPersonnel = await extractKeyPersonnel(companyName, allText, geminiApiKey)

    console.log('Extracting services with AI...')
    const services = await extractServices(companyName, allText, geminiApiKey)

    console.log('Extracting company data with AI...')
    const companyData = await extractCompanyData(companyName, allText, geminiApiKey)

    // Merge emails with existing (only use verified emails)
    const { data: existingCompany } = await supabase
      .from('companies')
      .select('email, extracted_emails')
      .eq('id', companyId)
      .single()

    const finalEmails: string[] = []
    if (existingCompany?.email) finalEmails.push(existingCompany.email)
    if (existingCompany?.extracted_emails) finalEmails.push(...existingCompany.extracted_emails)
    finalEmails.push(...verifiedEmails) // Only add verified emails
    const finalUniqueEmails = [...new Set(finalEmails)]

    // Update company with all extracted data
    const { data: updatedCompany, error: updateError } = await supabase
      .from('companies')
      .update({
        extracted_emails: finalUniqueEmails,
        social_media: socialMedia,
        key_personnel: keyPersonnel,
        phone_numbers: allPhones,
        technologies: technologies,
        services: services,
        certifications: companyData.certifications,
        founded_year: companyData.foundedYear,
        employee_count: companyData.employeeCount,
        email_pattern: emailPattern,
        deep_scraped_at: new Date().toISOString(),
        deep_scrape_pages_found: results.length,
        scraping_status: 'completed',
        scraping_error: null,
        last_scraped_at: new Date().toISOString()
      })
      .eq('id', companyId)
      .select()
      .single()

    if (updateError) throw updateError

    console.log('Deep scrape completed successfully!')

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          company: updatedCompany,
          pagesScraped: results.length,
          emailsFound: verifiedEmails.length,
          emailsInvalid: unverifiedEmails.length,
          totalEmails: finalUniqueEmails.length,
          phonesFound: allPhones.length,
          keyPersonnel: keyPersonnel.length,
          services: services.length,
          technologies: technologies.length,
          socialMedia: Object.keys(socialMedia).length,
          emailPattern,
          foundedYear: companyData.foundedYear,
          employeeCount: companyData.employeeCount
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in deep-scrape-company:', error)

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
