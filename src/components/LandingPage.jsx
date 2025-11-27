import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import '../styles/LandingPage.css'

export default function LandingPage() {
  const navigate = useNavigate()
  const [billingCycle, setBillingCycle] = useState('monthly')
  const [language, setLanguage] = useState('en')

  const translations = {
    en: {
      // Header
      features: 'Features',
      pricing: 'Pricing',
      signIn: 'Sign In',
      getStarted: 'Get Started',

      // Hero
      heroTitle: 'AI-Powered Cold Email',
      heroTitleHighlight: 'That Actually Works',
      heroSubtitle: 'Generate personalized cold emails at scale with AI. Automate your outreach while maintaining a human touch. Get 30%+ open rates and 8%+ response rates.',
      seeHowItWorks: 'See How It Works',
      heroNote: '✨ No credit card required • Start in 2 minutes',

      // Database Callout
      nowAvailable: '🇱🇹 Now Available',
      databaseTitle: 'Built-in Company Database',
      databaseDescription: 'Access thousands of verified Lithuanian companies with contact information, industry data, and business details. No need to spend hours researching - we provide the data you need to start reaching out immediately.',
      comingSoon: 'Coming Soon:',
      europeanUnion: '🇪🇺 European Union',
      unitedStates: '🇺🇸 United States',

      // Features
      featuresTitle: 'Everything You Need for Cold Email Success',
      featuresSubtitle: 'Powerful features that help you scale your outreach without sacrificing quality',

      featureAiTitle: 'AI-Powered Emails',
      featureAiDesc: 'Generate perfectly crafted, personalized cold emails using Google Gemini 2.5 Flash in 60+ languages',

      featureDbTitle: 'Company Database',
      featureDbDesc: 'Access verified company information in Lithuania. Soon expanding to other European countries and the US',

      featurePersonalizationTitle: 'Smart Personalization',
      featurePersonalizationDesc: 'Automatically personalize each email based on company data, industry, and recipient context',

      featureBulkTitle: 'Bulk Campaigns',
      featureBulkDesc: 'Send hundreds of personalized emails at once while maintaining high deliverability rates',

      featureSmtpTitle: 'Your SMTP',
      featureSmtpDesc: 'Use your own email server (Gmail, Outlook, SendGrid) - full control over sending',

      featureCampaignTitle: 'Campaign Management',
      featureCampaignDesc: 'Track all your campaigns, recipients, and sending status in one beautiful dashboard',

      featureLanguageTitle: 'Multi-Language',
      featureLanguageDesc: 'Generate emails in 60+ languages with native-quality phrasing and cultural context',

      // Steps
      stepsTitle: 'How It Works',
      stepsSubtitle: 'Get started in 4 simple steps',

      step1Title: 'Connect Your Email',
      step1Desc: 'Add your SMTP credentials (Gmail, Outlook, or any provider)',

      step2Title: 'Import Companies',
      step2Desc: 'Upload your target companies with email addresses',

      step3Title: 'Create Campaign',
      step3Desc: 'Define your value proposition and let AI write personalized emails',

      step4Title: 'Send & Track',
      step4Desc: 'Send campaigns and monitor delivery status in real-time',

      // Stats
      statsTitle: 'Trusted by Companies Worldwide',
      statsSubtitle: 'Join businesses achieving exceptional results with AI-powered cold email',

      stat1Value: '30%+',
      stat1Label: 'Average Open Rate',
      stat1Desc: 'Better than industry average',

      stat2Value: '8%+',
      stat2Label: 'Response Rate',
      stat2Desc: 'Quality conversations started',

      stat3Value: '60+',
      stat3Label: 'Languages',
      stat3Desc: 'Native-quality translations',

      stat4Value: '99%',
      stat4Label: 'Deliverability',
      stat4Desc: 'Inbox, not spam folder',

      // Benefits
      benefitsTitle: 'Why Choose Contactium?',

      benefit1Title: 'Perfect Personalization',
      benefit1Desc: 'AI analyzes each company and writes unique emails that feel hand-crafted',

      benefit2Title: 'Your Infrastructure',
      benefit2Desc: 'Use your own email server - no sending limits, full control over deliverability',

      benefit3Title: 'Zero Learning Curve',
      benefit3Desc: 'Intuitive interface - create your first campaign in under 5 minutes',

      benefit4Title: 'Enterprise-Grade AI',
      benefit4Desc: 'Powered by Google Gemini 2.5 Flash for best-in-class email generation with advanced language understanding',

      // Pricing
      pricingTitle: 'Simple, Transparent Pricing',
      pricingSubtitle: 'Choose the plan that fits your needs. Scale as you grow. Special discount codes available!',
      monthly: 'Monthly',
      yearly: 'Yearly',
      saveBadge: 'Save 20%',
      perMonth: '/month',
      billedYearly: 'Billed',

      planFree: 'Free',
      planFreeDesc: 'Perfect for testing the platform',
      planFreeCta: 'Get Started Free',

      planStarter: 'Starter',
      planStarterDesc: 'For growing businesses scaling outreach',
      planStarterCta: 'Start Free Trial',

      planPro: 'Professional',
      planProDesc: 'For teams running multiple campaigns',
      planProCta: 'Start Free Trial',

      mostPopular: 'Most Popular',

      pricingFooterNote: 'All plans include: SSL encryption • GDPR compliant • Cancel anytime',
      customPlanTitle: 'Need a Custom Plan?',
      customPlanDesc: 'Get in touch for enterprise solutions with unlimited emails, dedicated support, white-label options, and custom integrations.',
      contactUs: 'Contact Us',

      // Plan Features
      feature1: '1 active campaign',
      feature2: '10 AI-generated emails/month',
      feature3: 'Up to 25 contacts',
      feature4: 'Google Gemini 2.5 Flash AI',
      feature5: '60+ languages',
      feature6: 'Your own SMTP server',
      feature7: 'Campaign dashboard',
      feature8: 'Scheduled sending',
      feature9: 'Email support',
      feature10: '5 active campaigns',
      feature11: '500 AI-generated emails/month',
      feature12: 'Up to 1,000 contacts',
      feature13: 'All tones & styles',
      feature14: 'Advanced personalization',
      feature15: 'Priority support',
      feature20: 'Coupon code discounts',
      feature16: '20 active campaigns',
      feature17: '2,500 AI-generated emails/month',
      feature18: 'Up to 10,000 contacts',
      feature19: 'Bulk operations',

      // CTA
      ctaTitle: 'Ready to Transform Your Outreach?',
      ctaSubtitle: 'Join hundreds of companies using AI to scale their cold email campaigns',
      startFreeToday: 'Start Free Today',
      ctaNote: 'No credit card required • 2-minute setup',

      // Footer
      footerTagline: 'AI-powered cold email automation',
      signUp: 'Sign Up',
      copyright: '© 2025 Contactium. All rights reserved.',
      privacyPolicy: 'Privacy Policy',
      termsOfService: 'Terms of Service',
      cookiePolicy: 'Cookie Policy',

      // Cards
      campaignPerformance: 'Campaign Performance',
      openRate: '32% Open Rate',
      fromLastWeek: '↑ 12% from last week',
      aiGenerated: 'AI Generated',
      emails: '250 Emails',
      inMinutes: 'in 2 minutes'
    },
    lt: {
      // Header
      features: 'Funkcijos',
      pricing: 'Kainos',
      signIn: 'Prisijungti',
      getStarted: 'Pradėti',

      // Hero
      heroTitle: 'AI Šaltų El. Laiškų Sistema',
      heroTitleHighlight: 'Kuri Tikrai Veikia',
      heroSubtitle: 'Generuokite personalizuotus šaltus el. laiškus su AI pagalba. Automatizuokite išsiuntimus išlaikydami žmogišką prisilietimą. Pasiekite 30%+ atidarymo ir 8%+ atsakymo rodiklius.',
      seeHowItWorks: 'Kaip Tai Veikia',
      heroNote: '✨ Kredito kortelė nereikalinga • Pradėkite per 2 minutes',

      // Database Callout
      nowAvailable: '🇱🇹 Jau Galima',
      databaseTitle: 'Įmonių Duomenų Bazė',
      databaseDescription: 'Prieiga prie tūkstančių patvirtintų Lietuvos įmonių su kontaktine informacija, pramonės duomenimis ir verslo detalėmis. Nereikia valandų tyrimams - mes pateikiame duomenis, kurių reikia pradėti bendrauti iš karto.',
      comingSoon: 'Netrukus:',
      europeanUnion: '🇪🇺 Europos Sąjunga',
      unitedStates: '🇺🇸 JAV',

      // Features
      featuresTitle: 'Viskas Ko Reikia Sėkmingam Šaltam El. Paštui',
      featuresSubtitle: 'Galingos funkcijos, padedančios plėsti jūsų išsiuntimus neprarandant kokybės',

      featureAiTitle: 'AI Generuojami Laiškai',
      featureAiDesc: 'Generuokite tobulai sukurtus, personalizuotus šaltus el. laiškus naudodami Google Gemini 2.5 Flash 60+ kalbomis',

      featureDbTitle: 'Įmonių Duomenų Bazė',
      featureDbDesc: 'Prieiga prie patvirtintų įmonių informacijos Lietuvoje. Netrukus plėsimės į kitas Europos šalis ir JAV',

      featurePersonalizationTitle: 'Protingas Personalizavimas',
      featurePersonalizationDesc: 'Automatiškai personalizuokite kiekvieną laišką pagal įmonės duomenis, pramonės šaką ir gavėjo kontekstą',

      featureBulkTitle: 'Masinės Kampanijos',
      featureBulkDesc: 'Siųskite šimtus personalizuotų el. laiškų vienu metu išlaikydami aukštą pristatymo rodiklį',

      featureSmtpTitle: 'Jūsų SMTP',
      featureSmtpDesc: 'Naudokite savo el. pašto serverį (Gmail, Outlook, SendGrid) - pilna kontrolė',

      featureCampaignTitle: 'Kampanijų Valdymas',
      featureCampaignDesc: 'Stebėkite visas kampanijas, gavėjus ir siuntimo būseną vienoje gražioje svetainėje',

      featureLanguageTitle: 'Daugiakalbis',
      featureLanguageDesc: 'Generuokite el. laiškus 60+ kalbų su natūralaus lygio frazavimu ir kultūriniu kontekstu',

      // Steps
      stepsTitle: 'Kaip Tai Veikia',
      stepsSubtitle: 'Pradėkite per 4 paprastus žingsnius',

      step1Title: 'Prijunkite El. Paštą',
      step1Desc: 'Pridėkite SMTP prisijungimo duomenis (Gmail, Outlook ar bet kuris kitas)',

      step2Title: 'Importuokite Įmones',
      step2Desc: 'Įkelkite tikslines įmones su el. pašto adresais',

      step3Title: 'Sukurkite Kampaniją',
      step3Desc: 'Apibrėžkite savo vertės pasiūlymą ir leiskite AI parašyti personalizuotus laiškus',

      step4Title: 'Siųsti ir Stebėti',
      step4Desc: 'Siųskite kampanijas ir stebėkite pristatymo būseną realiu laiku',

      // Stats
      statsTitle: 'Pasitiki Įmonės Visame Pasaulyje',
      statsSubtitle: 'Prisijunkite prie verslų pasiekiančių išskirtinių rezultatų su AI šaltais el. laiškais',

      stat1Value: '30%+',
      stat1Label: 'Vidutinis Atidarymo Rodiklis',
      stat1Desc: 'Geriau nei pramonės vidurkis',

      stat2Value: '8%+',
      stat2Label: 'Atsakymo Rodiklis',
      stat2Desc: 'Pradėti kokybiški pokalbiai',

      stat3Value: '60+',
      stat3Label: 'Kalbos',
      stat3Desc: 'Natūralaus lygio vertimai',

      stat4Value: '99%',
      stat4Label: 'Pristatymas',
      stat4Desc: 'Į pašto dėžutę, ne į šlamštą',

      // Benefits
      benefitsTitle: 'Kodėl Pasirinkti Contactium?',

      benefit1Title: 'Tobulas Personalizavimas',
      benefit1Desc: 'AI analizuoja kiekvieną įmonę ir rašo unikalius laiškus, kurie atrodo rankomis sukurti',

      benefit2Title: 'Jūsų Infrastruktūra',
      benefit2Desc: 'Naudokite savo el. pašto serverį - jokių siuntimo limitų, pilna pristatymo kontrolė',

      benefit3Title: 'Nereikia Mokytis',
      benefit3Desc: 'Intuityvi sąsaja - sukurkite pirmąją kampaniją per mažiau nei 5 minutes',

      benefit4Title: 'Įmonės Lygio AI',
      benefit4Desc: 'Naudoja Google Gemini 2.5 Flash geriausiai klasės el. laiškų generavimui su pažangia kalbos suvokimo technologija',

      // Pricing
      pricingTitle: 'Paprastos, Skaidrios Kainos',
      pricingSubtitle: 'Pasirinkite planą, kuris tinka jūsų poreikiams. Plėskitės augdami. Yra specialūs nuolaidų kodai!',
      monthly: 'Mėnesinis',
      yearly: 'Metinis',
      saveBadge: 'Sutaupykite 20%',
      perMonth: '/mėn',
      billedYearly: 'Apmokėjimas',

      planFree: 'Nemokamas',
      planFreeDesc: 'Puikiai tinka platformos testavimui',
      planFreeCta: 'Pradėti Nemokamai',

      planStarter: 'Pradedantysis',
      planStarterDesc: 'Augančiam verslui plečiant išsiuntimus',
      planStarterCta: 'Pradėti Nemokamą Bandomąjį',

      planPro: 'Profesionalus',
      planProDesc: 'Komandoms vykdančioms kelias kampanijas',
      planProCta: 'Pradėti Nemokamą Bandomąjį',

      mostPopular: 'Populiariausias',

      pricingFooterNote: 'Visi planai apima: SSL šifravimą • BDAR atitiktį • Atšaukti bet kada',
      customPlanTitle: 'Reikia Individualaus Plano?',
      customPlanDesc: 'Susisiekite dėl įmonės sprendimų su neribotais el. laiškais, skirta pagalba, baltos etiketės parinktimis ir individualiomis integracijomis.',
      contactUs: 'Susisiekti',

      // Plan Features
      feature1: '1 aktyvi kampanija',
      feature2: '10 AI sukurtų laiškų/mėn',
      feature3: 'Iki 25 kontaktų',
      feature4: 'Google Gemini 2.5 Flash AI',
      feature5: '60+ kalbų',
      feature6: 'Jūsų SMTP serveris',
      feature7: 'Kampanijų valdymas',
      feature8: 'Suplanuotas siuntimas',
      feature9: 'El. pašto pagalba',
      feature10: '5 aktyvios kampanijos',
      feature11: '500 AI sukurtų laiškų/mėn',
      feature12: 'Iki 1,000 kontaktų',
      feature13: 'Visi tonai ir stiliai',
      feature14: 'Pažangus personalizavimas',
      feature15: 'Pirmumo pagalba',
      feature20: 'Nuolaidų kodų sistema',
      feature16: '20 aktyvių kampanijų',
      feature17: '2,500 AI sukurtų laiškų/mėn',
      feature18: 'Iki 10,000 kontaktų',
      feature19: 'Masinės operacijos',

      // CTA
      ctaTitle: 'Pasiruošę Transformuoti Išsiuntimus?',
      ctaSubtitle: 'Prisijunkite prie šimtų įmonių naudojančių AI šaltų el. laiškų kampanijų plėtrai',
      startFreeToday: 'Pradėti Nemokamai Šiandien',
      ctaNote: 'Kredito kortelė nereikalinga • 2 minučių nustatymas',

      // Footer
      footerTagline: 'AI šaltų el. laiškų automatizavimas',
      signUp: 'Registruotis',
      copyright: '© 2025 Contactium. Visos teisės saugomos.',
      privacyPolicy: 'Privatumo Politika',
      termsOfService: 'Paslaugų Teikimo Sąlygos',
      cookiePolicy: 'Slapukų Politika',

      // Cards
      campaignPerformance: 'Kampanijos Rezultatai',
      openRate: '32% Atidarymo Rodiklis',
      fromLastWeek: '↑ 12% nuo praėjusios savaitės',
      aiGenerated: 'AI Sugeneruota',
      emails: '250 Laiškų',
      inMinutes: 'per 2 minutes'
    }
  }

  const t = translations[language]

  const pricingPlans = [
    {
      name: t.planFree,
      price: 0,
      yearlyPrice: 0,
      description: t.planFreeDesc,
      popular: false,
      features: [
        t.feature1,
        t.feature2,
        t.feature3,
        t.feature4,
        t.feature5,
        t.feature6,
        t.feature7,
        t.feature8,
        t.feature9,
        t.feature20
      ],
      cta: t.planFreeCta,
      highlighted: false
    },
    {
      name: t.planStarter,
      price: 29,
      yearlyPrice: 23,
      description: t.planStarterDesc,
      popular: true,
      features: [
        t.feature10,
        t.feature11,
        t.feature12,
        t.feature4,
        t.feature5,
        t.feature13,
        t.feature14,
        t.feature6,
        t.feature7,
        t.feature8,
        t.feature15
      ],
      cta: t.planStarterCta,
      highlighted: true
    },
    {
      name: t.planPro,
      price: 79,
      yearlyPrice: 63,
      description: t.planProDesc,
      popular: false,
      features: [
        t.feature16,
        t.feature17,
        t.feature18,
        t.feature4,
        t.feature5,
        t.feature13,
        t.feature14,
        t.feature6,
        t.feature7,
        t.feature8,
        t.feature19,
        t.feature15,
        t.feature20
      ],
      cta: t.planProCta,
      highlighted: false
    }
  ]

  return (
    <div className="landing-page">
      {/* Header */}
      <header className="landing-header">
        <div className="header-content">
          <div className="header-logo" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <span className="logo-icon">📧</span>
            <span className="logo-text">Contactium</span>
          </div>

          <nav className="header-nav">
            <button onClick={() => document.getElementById('features').scrollIntoView({ behavior: 'smooth' })} className="nav-link">
              {t.features}
            </button>
            <button onClick={() => document.getElementById('pricing').scrollIntoView({ behavior: 'smooth' })} className="nav-link">
              {t.pricing}
            </button>
          </nav>

          <div className="header-actions">
            <div className="language-switcher">
              <button
                onClick={() => setLanguage('en')}
                className={`lang-btn ${language === 'en' ? 'active' : ''}`}
              >
                EN
              </button>
              <button
                onClick={() => setLanguage('lt')}
                className={`lang-btn ${language === 'lt' ? 'active' : ''}`}
              >
                LT
              </button>
            </div>
            <button onClick={() => navigate('/auth')} className="header-btn-secondary">
              {t.signIn}
            </button>
            <button onClick={() => navigate('/auth')} className="header-btn-primary">
              {t.getStarted}
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">
            {t.heroTitle}<br />
            <span className="gradient-text">{t.heroTitleHighlight}</span>
          </h1>
          <p className="hero-subtitle">
            {t.heroSubtitle}
          </p>
          <div className="hero-buttons">
            <button onClick={() => navigate('/auth')} className="cta-primary">
              {t.getStarted}
            </button>
            <button onClick={() => document.getElementById('features').scrollIntoView({ behavior: 'smooth' })} className="cta-secondary">
              {t.seeHowItWorks}
            </button>
          </div>
          <p className="hero-note">{t.heroNote}</p>
        </div>
        <div className="hero-visual">
          <div className="floating-card card-1">
            <div className="card-header">
              <span className="card-dot"></span>
              <span className="card-dot"></span>
              <span className="card-dot"></span>
            </div>
            <div className="card-content">
              <p className="card-label">{t.campaignPerformance}</p>
              <p className="card-value">{t.openRate}</p>
              <p className="card-subtext">{t.fromLastWeek}</p>
            </div>
          </div>
          <div className="floating-card card-2">
            <div className="card-header">
              <span className="card-dot"></span>
              <span className="card-dot"></span>
              <span className="card-dot"></span>
            </div>
            <div className="card-content">
              <p className="card-label">{t.aiGenerated}</p>
              <p className="card-value">{t.emails}</p>
              <p className="card-subtext">{t.inMinutes}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Company Database Callout */}
      <section className="database-callout">
        <div className="callout-content">
          <div className="callout-badge">{t.nowAvailable}</div>
          <h2>{t.databaseTitle}</h2>
          <p className="callout-description">
            {t.databaseDescription}
          </p>
          <div className="callout-expansion">
            <span className="expansion-label">{t.comingSoon}</span>
            <div className="expansion-flags">
              <span className="flag-item">{t.europeanUnion}</span>
              <span className="flag-item">{t.unitedStates}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="features-section">
        <div className="section-header">
          <h2>{t.featuresTitle}</h2>
          <p>{t.featuresSubtitle}</p>
        </div>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">🤖</div>
            <h3>{t.featureAiTitle}</h3>
            <p>{t.featureAiDesc}</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🏢</div>
            <h3>{t.featureDbTitle}</h3>
            <p>{t.featureDbDesc}</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🎯</div>
            <h3>{t.featurePersonalizationTitle}</h3>
            <p>{t.featurePersonalizationDesc}</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📧</div>
            <h3>{t.featureBulkTitle}</h3>
            <p>{t.featureBulkDesc}</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🔧</div>
            <h3>{t.featureSmtpTitle}</h3>
            <p>{t.featureSmtpDesc}</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📊</div>
            <h3>{t.featureCampaignTitle}</h3>
            <p>{t.featureCampaignDesc}</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🌍</div>
            <h3>{t.featureLanguageTitle}</h3>
            <p>{t.featureLanguageDesc}</p>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="steps-section">
        <div className="section-header">
          <h2>{t.stepsTitle}</h2>
          <p>{t.stepsSubtitle}</p>
        </div>
        <div className="steps-container">
          <div className="step-card">
            <div className="step-number">1</div>
            <h3>{t.step1Title}</h3>
            <p>{t.step1Desc}</p>
            <div className="step-arrow">→</div>
          </div>
          <div className="step-card">
            <div className="step-number">2</div>
            <h3>{t.step2Title}</h3>
            <p>{t.step2Desc}</p>
            <div className="step-arrow">→</div>
          </div>
          <div className="step-card">
            <div className="step-number">3</div>
            <h3>{t.step3Title}</h3>
            <p>{t.step3Desc}</p>
            <div className="step-arrow">→</div>
          </div>
          <div className="step-card">
            <div className="step-number">4</div>
            <h3>{t.step4Title}</h3>
            <p>{t.step4Desc}</p>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats-section">
        <div className="stats-container">
          <div className="stats-header">
            <h2>{t.statsTitle}</h2>
            <p>{t.statsSubtitle}</p>
          </div>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">📈</div>
              <div className="stat-value">{t.stat1Value}</div>
              <div className="stat-label">{t.stat1Label}</div>
              <div className="stat-description">{t.stat1Desc}</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">💬</div>
              <div className="stat-value">{t.stat2Value}</div>
              <div className="stat-label">{t.stat2Label}</div>
              <div className="stat-description">{t.stat2Desc}</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">🌍</div>
              <div className="stat-value">{t.stat3Value}</div>
              <div className="stat-label">{t.stat3Label}</div>
              <div className="stat-description">{t.stat3Desc}</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">✉️</div>
              <div className="stat-value">{t.stat4Value}</div>
              <div className="stat-label">{t.stat4Label}</div>
              <div className="stat-description">{t.stat4Desc}</div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="benefits-section">
        <div className="benefits-content">
          <div className="benefits-text">
            <h2>{t.benefitsTitle}</h2>
            <div className="benefit-list">
              <div className="benefit-item">
                <span className="benefit-check">✓</span>
                <div>
                  <strong>{t.benefit1Title}</strong>
                  <p>{t.benefit1Desc}</p>
                </div>
              </div>
              <div className="benefit-item">
                <span className="benefit-check">✓</span>
                <div>
                  <strong>{t.benefit2Title}</strong>
                  <p>{t.benefit2Desc}</p>
                </div>
              </div>
              <div className="benefit-item">
                <span className="benefit-check">✓</span>
                <div>
                  <strong>{t.benefit3Title}</strong>
                  <p>{t.benefit3Desc}</p>
                </div>
              </div>
              <div className="benefit-item">
                <span className="benefit-check">✓</span>
                <div>
                  <strong>{t.benefit4Title}</strong>
                  <p>{t.benefit4Desc}</p>
                </div>
              </div>
            </div>
          </div>
          <div className="benefits-visual">
            <div className="code-preview">
              <div className="code-header">
                <span className="code-dot"></span>
                <span className="code-dot"></span>
                <span className="code-dot"></span>
                <span className="code-title">Generated Email</span>
              </div>
              <div className="code-body">
                <p className="code-line"><span className="code-label">To:</span> john@techcorp.com</p>
                <p className="code-line"><span className="code-label">Subject:</span> Quick question about TechCorp</p>
                <p className="code-line code-divider"></p>
                <p className="code-line">Hi there,</p>
                <p className="code-line"></p>
                <p className="code-line">I noticed TechCorp recently expanded...</p>
                <p className="code-line"></p>
                <p className="code-line ai-badge">✨ Generated by AI in 2s</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="pricing-section">
        <div className="section-header">
          <h2>{t.pricingTitle}</h2>
          <p>{t.pricingSubtitle}</p>
        </div>

        {/* Billing Toggle */}
        <div className="billing-toggle">
          <span className={billingCycle === 'monthly' ? 'active' : ''}>{t.monthly}</span>
          <button
            className="toggle-switch"
            onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')}
          >
            <span className={`toggle-slider ${billingCycle === 'yearly' ? 'yearly' : ''}`}></span>
          </button>
          <span className={billingCycle === 'yearly' ? 'active' : ''}>
            {t.yearly}
            <span className="save-badge">{t.saveBadge}</span>
          </span>
        </div>

        {/* Pricing Cards */}
        <div className="pricing-grid">
          {pricingPlans.map((plan, index) => (
            <div key={index} className={`pricing-card ${plan.highlighted ? 'highlighted' : ''}`}>
              {plan.popular && <div className="popular-badge">{t.mostPopular}</div>}
              <div className="pricing-header">
                <h3>{plan.name}</h3>
                <p className="pricing-description">{plan.description}</p>
                <div className="price-container">
                  <span className="currency">€</span>
                  <span className="price">
                    {billingCycle === 'monthly' ? plan.price : plan.yearlyPrice}
                  </span>
                  <span className="period">{t.perMonth}</span>
                </div>
                {billingCycle === 'yearly' && plan.price > 0 && (
                  <p className="billing-note">{t.billedYearly} €{plan.yearlyPrice * 12}/{language === 'en' ? 'year' : 'metai'}</p>
                )}
              </div>

              <ul className="features-list">
                {plan.features.map((feature, idx) => (
                  <li key={idx}>
                    <span className="check-icon">✓</span>
                    {feature}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => navigate('/auth')}
                className={`pricing-cta ${plan.highlighted ? 'primary' : 'secondary'}`}
              >
                {plan.cta}
              </button>
            </div>
          ))}
        </div>

        {/* Additional Info */}
        <div className="pricing-footer">
          <p>{t.pricingFooterNote}</p>
          <div className="enterprise-cta">
            <h3>{t.customPlanTitle}</h3>
            <p>{t.customPlanDesc}</p>
            <button onClick={() => navigate('/auth')} className="enterprise-btn">
              {t.contactUs}
            </button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <h2>{t.ctaTitle}</h2>
        <p>{t.ctaSubtitle}</p>
        <button onClick={() => navigate('/auth')} className="cta-primary large">
          {t.startFreeToday}
        </button>
        <p className="cta-note">{t.ctaNote}</p>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-content">
          <div className="footer-brand">
            <h3>Contactium</h3>
            <p>{t.footerTagline}</p>
          </div>
          <div className="footer-links">
            <button onClick={() => navigate('/auth')} className="footer-link">{t.signIn}</button>
            <button onClick={() => navigate('/auth')} className="footer-link">{t.signUp}</button>
          </div>
        </div>
        <div className="footer-bottom">
          <div className="footer-policies">
            <a href="/privacy" className="policy-link">{t.privacyPolicy}</a>
            <span className="policy-separator">•</span>
            <a href="/terms" className="policy-link">{t.termsOfService}</a>
            <span className="policy-separator">•</span>
            <a href="/cookies" className="policy-link">{t.cookiePolicy}</a>
          </div>
          <p className="copyright-text">{t.copyright}</p>
        </div>
      </footer>
    </div>
  )
}
