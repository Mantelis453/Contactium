import { supabase } from './supabase'

const getToneGuidelines = (tone) => {
  const tones = {
    casual: {
      description: 'friendly and conversational',
      examples: 'Use contractions (I\'m, we\'re), casual phrases (Hey, Quick question), and a warm, approachable voice',
      avoid: 'Overly formal language, complex jargon, or stiff corporate speak'
    },
    professional: {
      description: 'balanced and respectful',
      examples: 'Use clear, direct language. Professional but not stiff. Respectful but warm',
      avoid: 'Too casual (slang, emojis) or too formal (archaic phrases, excessive formality)'
    },
    formal: {
      description: 'traditional and polished',
      examples: 'Use complete sentences, proper titles, and traditional business language',
      avoid: 'Casual language, contractions, or informal expressions'
    }
  }
  return tones[tone] || tones.professional
}

const getLengthGuidelines = (length) => {
  const lengths = {
    short: { words: '100-150', sentences: '4-6', paragraphs: '2-3' },
    medium: { words: '150-200', sentences: '6-8', paragraphs: '3-4' },
    long: { words: '200-250', sentences: '8-10', paragraphs: '4-5' }
  }
  return lengths[length] || lengths.medium
}

const getPersonalizationGuidelines = (level) => {
  const levels = {
    low: 'Use the company name and basic industry reference. Keep the message general.',
    medium: 'Reference the company name, industry context, and make educated assumptions about their challenges. Show you understand their sector.',
    high: 'Deeply personalize by mentioning specific aspects of their business, industry trends, potential pain points, and company-specific details. Make it clear this email was written specifically for them.'
  }
  return levels[level] || levels.medium
}

const SYSTEM_PROMPT = `You are an elite B2B cold email copywriter with 10+ years of experience. Your emails consistently achieve 30%+ open rates and 8%+ response rates.

CORE PRINCIPLES:
1. CLARITY: Every sentence must be crystal clear. No ambiguity.
2. VALUE-FIRST: Lead with benefit to the recipient, not your offering
3. BREVITY: Respect the reader's time. Every word must earn its place.
4. PERSONALIZATION: Make the recipient feel this was written FOR them, not TO them
5. AUTHENTICITY: Sound human, not robotic. Real person to real person.
6. SPECIFICITY: Use concrete examples and specific benefits, not vague promises

COLD EMAIL BEST PRACTICES:
- Hook them in the first sentence with relevance to THEIR business
- Never start with "I hope this email finds you well" - it's cliché
- Avoid buzzwords and corporate jargon (synergy, leverage, paradigm shift, etc.)
- Use social proof when possible (results, clients, metrics)
- Make the CTA clear and low-friction (don't ask for too much commitment)
- Write in active voice, not passive
- Break text into short, scannable paragraphs (2-3 lines max)
- Use "you" and "your" more than "we" and "our"
- End with a specific, easy-to-answer question or simple next step

QUALITY STANDARDS:
✓ Perfect grammar and spelling (zero tolerance for errors)
✓ No placeholder text or [brackets]
✓ No generic templates - every email must feel unique
✓ Natural flow - reads like a person wrote it
✓ Proper punctuation and capitalization
✓ Consistent formatting throughout

═══════════════════════════════════════════════════════════════

📧 EXAMPLE EMAIL STRUCTURES TO FOLLOW

Study these examples carefully. Your emails should follow similar structures and quality:

EXAMPLE 1: PROBLEM-SOLUTION APPROACH (Professional Tone)
───────────────────────────────────────────────────────────────
SUBJECT: Quick question about TechCorp's data integration

Hi there,

I noticed TechCorp recently expanded into three new markets—congrats on the growth! With that kind of expansion, managing data across multiple platforms can get messy fast.

We help companies like DataFlow and CloudScale automate their data integration, cutting manual work by 60%. They were dealing with the same multi-platform challenges after rapid expansion.

Would it make sense to show you how we could streamline TechCorp's data workflows? It's a 15-minute call, no pressure.

Worth a quick chat?

Sarah Chen
───────────────────────────────────────────────────────────────

EXAMPLE 2: CURIOSITY + VALUE APPROACH (Casual Tone)
───────────────────────────────────────────────────────────────
SUBJECT: RetailHub's inventory challenges

Hey team at RetailHub,

Your recent growth in e-commerce has been impressive. From what I've seen, rapid scaling often brings inventory prediction challenges—stockouts during peak seasons, excess inventory collecting dust.

We've helped companies like ShopFast and MegaMart reduce stockouts by 40% while cutting excess inventory costs. The ROI usually shows up within the first quarter.

Would you be open to a quick 10-minute call to see if we could do something similar for RetailHub?

Let me know what your calendar looks like next week.

Mike Rodriguez
───────────────────────────────────────────────────────────────

EXAMPLE 3: SOCIAL PROOF APPROACH (Formal Tone)
───────────────────────────────────────────────────────────────
SUBJECT: Partnership opportunity for GlobalFinance

Good morning,

I am writing to explore a potential partnership between our organizations. We recently completed a successful engagement with FinanceFirst, where we reduced their compliance review time by 45% through automated document processing.

Given GlobalFinance's recent expansion into emerging markets, I believe our solutions could provide similar value in managing regulatory compliance across multiple jurisdictions. Our platform is currently used by eight of the top 20 financial institutions globally.

Would you be available for a brief call next week to discuss how this might benefit GlobalFinance? I can share specific case studies from the financial sector.

I look forward to your response.

David Thompson
───────────────────────────────────────────────────────────────

KEY PATTERNS IN THESE EXAMPLES:
✓ Subject line is specific and relevant (under 50 characters)
✓ Opening immediately mentions the company or something specific about them
✓ Clear problem or opportunity identified
✓ Social proof with concrete metrics
✓ Low-friction CTA (just a call, not a huge commitment)
✓ Natural, conversational language
✓ No buzzwords or corporate jargon
✓ Short paragraphs (2-3 lines maximum)
✓ Ends with a clear question or next step
✓ Professional but human tone

⚠️ CRITICAL: GREETING AND NAME HANDLING
Since you don't have individual contact names, use these approaches:

FOR PROFESSIONAL TONE:
- "Hi there,"
- "Hello,"
- "Good morning,"
- "Good afternoon,"

FOR CASUAL TONE:
- "Hey team at [CompanyName],"
- "Hi [CompanyName] team,"
- "Hello there,"

FOR FORMAL TONE:
- "Good morning,"
- "Dear team,"
- "Greetings,"

✗ NEVER USE: "Hi [Name]," or "Dear [Name]," or any placeholder brackets
✗ NEVER USE: "To whom it may concern" (too impersonal)

✓ ALWAYS: Use actual company names throughout the email body
✓ ALWAYS: Address them as "you" or "your team" after the greeting
✓ ALWAYS: Sign with the actual sender's name (no [Your Name] placeholder)

Your emails MUST follow these structural principles while being unique to each recipient.

═══════════════════════════════════════════════════════════════

You will receive specific parameters for each email. Follow them EXACTLY.`

const createEmailPrompt = (params) => {
  const {
    category,
    description,
    companyName,
    companyIndustry,
    senderName,
    senderCompany,
    senderTitle,
    valueProposition,
    callToAction,
    language,
    tone,
    length,
    personalization
  } = params

  const toneGuide = getToneGuidelines(tone)
  const lengthGuide = getLengthGuidelines(length)
  const personalizationGuide = getPersonalizationGuidelines(personalization)

  return `Create a B2B cold email with the following specifications:

═══════════════════════════════════════════════════════════════

📋 TARGET INFORMATION
Company Name: ${companyName}
Industry: ${companyIndustry || 'Not specified'}

👤 SENDER INFORMATION
Name: ${senderName}
Company: ${senderCompany}
Title: ${senderTitle}

🎯 CAMPAIGN SPECIFICATIONS
Category: ${category}
Campaign Description: ${description}
Value Proposition: ${valueProposition}
Call-to-Action: ${callToAction}

═══════════════════════════════════════════════════════════════

✍️ WRITING REQUIREMENTS

LANGUAGE: ${language}
- Write the ENTIRE email in ${language}
- Use native phrasing and idioms appropriate for ${language}
- Ensure culturally appropriate tone for ${language} speakers

TONE: ${tone.toUpperCase()} (${toneGuide.description})
- ${toneGuide.examples}
- AVOID: ${toneGuide.avoid}

LENGTH: ${length.toUpperCase()}
- Target: ${lengthGuide.words} words
- Structure: ${lengthGuide.paragraphs} paragraphs
- Sentences: ${lengthGuide.sentences} total

PERSONALIZATION LEVEL: ${personalization.toUpperCase()}
- ${personalizationGuide}

═══════════════════════════════════════════════════════════════

📐 STRICT FORMATTING RULES

SUBJECT LINE:
- Maximum 50 characters (including spaces)
- Must be specific to ${companyName}
- Include curiosity or value hook
- NO clickbait or deceptive tactics
- NO all caps or excessive punctuation
- DO include company name or industry reference when relevant

EMAIL BODY STRUCTURE:
1. GREETING
   - ${tone === 'professional' ? 'Use: "Hi there," or "Hello," or "Good morning,"' : ''}
   - ${tone === 'casual' ? 'Use: "Hey team at ' + companyName + '," or "Hi there,"' : ''}
   - ${tone === 'formal' ? 'Use: "Good morning," or "Dear team," or "Greetings,"' : ''}
   - ✗ NEVER use "[Name]" or any placeholder brackets
   - ✗ NEVER use "To whom it may concern"

2. OPENING (1 sentence)
   - Immediately relevant to ${companyName}
   - No generic pleasantries
   - Hook their attention with specificity

3. CONTEXT (1-2 sentences)
   - Why you're reaching out
   - Brief credibility builder (${senderCompany})
   - Industry or company-specific insight

4. VALUE PROPOSITION (2-3 sentences)
   - Clear benefit to THEM
   - Specific, not vague
   - Include "${valueProposition}" naturally
   - Use concrete examples or metrics if possible

5. CALL-TO-ACTION (1-2 sentences)
   - Include: ${callToAction}
   - Make it specific and easy
   - Low commitment ask
   - Include a question or clear next step

6. CLOSING (1 sentence)
   - Brief and friendly
   - Sign with just: ${senderName}
   - NO company signature blocks
   - NO logos, images, or HTML formatting

═══════════════════════════════════════════════════════════════

⚠️ CRITICAL REQUIREMENTS - MANDATORY

✓ Write in ${language} language ONLY
✓ Zero spelling or grammar errors
✓ NO placeholder text like [Name] or [Company Name] - ALWAYS use actual values: ${companyName} and ${senderName}
✓ Use proper greetings based on tone (see examples above) - NEVER "[Name]"
✓ No generic templates - make it unique to ${companyName}
✓ Sound natural and conversational
✓ Mention ${companyName} at least once in the body
✓ Reference ${companyIndustry} industry context where relevant
✓ Keep paragraphs short (2-3 lines maximum)
✓ Use proper spacing and line breaks
✓ End with a specific question or clear next step
✓ Sign with ${senderName} - no placeholder, no brackets
✓ The entire email must feel personally written for this specific recipient

✗ ABSOLUTELY NO "[Name]" or "[Your Name]" or any placeholder brackets
✗ NO buzzwords or corporate jargon
✗ NO clichés ("hope this email finds you well", "touching base", etc.)
✗ NO "To whom it may concern"
✗ NO ALL CAPS or excessive punctuation!!!
✗ NO attachments mentioned
✗ NO multiple CTAs (only one clear ask)
✗ NO passive voice
✗ NO obvious templates

═══════════════════════════════════════════════════════════════

OUTPUT FORMAT (CRITICAL):

Provide your response in EXACTLY this format:

SUBJECT: [your subject line here - max 50 chars]
BODY: [your email body here]

⚠️ FORMATTING RULES:
✓ Write "SUBJECT:" on one line, then the subject text
✓ Write "BODY:" on the next line, then start the email greeting immediately
✓ DO NOT repeat the subject line in the body section
✓ DO NOT include "SUBJECT:" anywhere in the body text
✓ The body should start directly with the greeting (Hi there, Hello, Good morning, etc.)
✓ Do NOT include any other text, explanations, or commentary
✓ Do NOT include HTML formatting, markdown, or special characters
✓ Write as plain text only

EXAMPLE OUTPUT:
SUBJECT: Quick question about TechCorp
BODY: Hi there,

I noticed TechCorp recently expanded...

(Notice: No subject repetition, body starts with greeting)`
}

async function generateWithOpenAI(apiKey, prompt) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: SYSTEM_PROMPT
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.5, // Lower for more consistent output
      max_tokens: 800, // Increased for longer emails
      top_p: 0.9,
      frequency_penalty: 0.3, // Reduce repetition
      presence_penalty: 0.2 // Encourage topic diversity
    })
  })

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.error?.message || 'Failed to generate email with OpenAI')
  }

  const data = await response.json()
  return data.choices[0].message.content
}

async function generateWithGemini(apiKey, prompt) {
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [{
        parts: [{
          text: `${SYSTEM_PROMPT}\n\n${prompt}`
        }]
      }],
      generationConfig: {
        temperature: 0.5, // Lower for consistency
        maxOutputTokens: 2048,
        topP: 0.9,
        topK: 40,
        thinkingConfig: {
          thinkingBudget: 300 // More thinking for better quality
        }
      }
    })
  })

  if (!response.ok) {
    const errorData = await response.json()
    console.error('Gemini API error:', errorData)
    throw new Error(errorData.error?.message || 'Failed to generate email with Gemini')
  }

  const data = await response.json()
  console.log('Gemini response:', JSON.stringify(data, null, 2))

  // Check if response has the expected structure
  if (!data.candidates || !data.candidates[0]) {
    console.error('Unexpected Gemini response structure:', data)
    throw new Error('Invalid response from Gemini API')
  }

  if (!data.candidates[0].content || !data.candidates[0].content.parts || !data.candidates[0].content.parts[0]) {
    console.error('Missing content in Gemini response:', data.candidates[0])
    throw new Error('No content generated by Gemini')
  }

  return data.candidates[0].content.parts[0].text
}

function parseEmailResponse(content) {
  // Parse the response
  const subjectMatch = content.match(/SUBJECT:\s*(.+?)(?:\n|$)/i)
  const bodyMatch = content.match(/BODY:\s*([\s\S]+)/i)

  const subject = subjectMatch ? subjectMatch[1].trim() : 'Partnership Opportunity'
  let body = bodyMatch ? bodyMatch[1].trim() : content

  // Remove any accidental subject repetition at the start of the body
  if (subject && body) {
    // Remove if body starts with "SUBJECT: ..."
    const subjectRepeatPattern = new RegExp(`^SUBJECT:\\s*${subject.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*`, 'i')
    body = body.replace(subjectRepeatPattern, '').trim()

    // Also remove if just the subject text appears at the very start
    const justSubjectPattern = new RegExp(`^${subject.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*(?:\n|$)`, 'i')
    body = body.replace(justSubjectPattern, '').trim()
  }

  return { subject, body }
}

export async function generatePersonalizedEmail({
  description,
  category,
  company,
  senderName,
  senderCompany,
  senderTitle,
  valueProposition,
  callToAction
}) {
  try {
    // Get user's AI settings
    const { data: { user } } = await supabase.auth.getUser()

    const { data: settings, error: settingsError } = await supabase
      .from('user_settings')
      .select('ai_provider, openai_api_key, gemini_api_key, email_language, email_tone, email_length, personalization_level')
      .eq('user_id', user.id)
      .single()

    // PGRST116 means no rows found - user hasn't configured settings yet
    if (settingsError && settingsError.code !== 'PGRST116') {
      throw new Error('Failed to load AI settings')
    }

    // Check if user has configured settings at all
    if (!settings) {
      throw new Error('Please configure your AI settings in Settings page')
    }

    const provider = settings.ai_provider || 'openai'
    const prompt = createEmailPrompt({
      category,
      description,
      companyName: company.company_name,
      companyIndustry: company.activity,
      senderName,
      senderCompany,
      senderTitle,
      valueProposition,
      callToAction,
      language: settings.email_language || 'English',
      tone: settings.email_tone || 'professional',
      length: settings.email_length || 'medium',
      personalization: settings.personalization_level || 'high'
    })

    let content

    if (provider === 'gemini') {
      if (!settings.gemini_api_key || settings.gemini_api_key.trim() === '') {
        throw new Error('Please add your Google Gemini API key in Settings')
      }
      content = await generateWithGemini(settings.gemini_api_key, prompt)
    } else {
      // Default to OpenAI
      if (!settings.openai_api_key || settings.openai_api_key.trim() === '') {
        throw new Error('Please add your OpenAI API key in Settings')
      }
      content = await generateWithOpenAI(settings.openai_api_key, prompt)
    }

    return parseEmailResponse(content)
  } catch (error) {
    console.error('Error generating AI email:', error)
    // Re-throw the error so the component can handle it
    throw error
  }
}
