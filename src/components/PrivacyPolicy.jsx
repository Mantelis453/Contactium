import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import '../styles/PolicyPages.css'

export default function PrivacyPolicy() {
  const navigate = useNavigate()
  const [language, setLanguage] = useState('en')

  const content = {
    en: {
      title: 'Privacy Policy',
      lastUpdated: 'Last updated: January 2025',
      sections: [
        {
          heading: '1. Introduction',
          content: 'Contactium ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our cold email automation platform.'
        },
        {
          heading: '2. Information We Collect',
          content: 'We collect information that you provide directly to us, including:\n\n• Account information (name, email address, password)\n• SMTP credentials for email sending\n• Company contact lists and email addresses\n• Campaign data and email content\n• Payment information (processed securely through third-party providers)\n• Usage data and analytics'
        },
        {
          heading: '3. How We Use Your Information',
          content: 'We use the information we collect to:\n\n• Provide, maintain, and improve our services\n• Process your transactions and send related information\n• Generate AI-powered email content\n• Send administrative information, updates, and security alerts\n• Monitor and analyze usage patterns and trends\n• Detect and prevent fraud and abuse'
        },
        {
          heading: '4. Data Storage and Security',
          content: 'We implement appropriate technical and organizational measures to protect your personal data. Your SMTP credentials are encrypted, and we use industry-standard security protocols. However, no method of transmission over the Internet is 100% secure.'
        },
        {
          heading: '5. Data Sharing',
          content: 'We do not sell your personal information. We may share your information with:\n\n• Service providers who assist in our operations (e.g., OpenAI, Google for AI services)\n• Law enforcement when required by law\n• In connection with a business transfer or acquisition'
        },
        {
          heading: '6. Your Rights',
          content: 'Under GDPR, you have the right to:\n\n• Access your personal data\n• Correct inaccurate data\n• Request deletion of your data\n• Object to processing\n• Data portability\n• Withdraw consent\n\nTo exercise these rights, contact us at privacy@contactium.com'
        },
        {
          heading: '7. International Data Transfers',
          content: 'Your information may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place for such transfers.'
        },
        {
          heading: '8. Data Retention',
          content: 'We retain your personal data for as long as necessary to provide our services and comply with legal obligations. You can request deletion of your account at any time.'
        },
        {
          heading: '9. Children\'s Privacy',
          content: 'Our service is not intended for children under 16. We do not knowingly collect personal information from children.'
        },
        {
          heading: '10. Changes to This Policy',
          content: 'We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the "Last updated" date.'
        },
        {
          heading: '11. Contact Us',
          content: 'If you have questions about this Privacy Policy, please contact us at:\n\nEmail: privacy@contactium.com\nContactium\nVilnius, Lithuania'
        }
      ]
    },
    lt: {
      title: 'Privatumo Politika',
      lastUpdated: 'Paskutinį kartą atnaujinta: 2025 m. sausis',
      sections: [
        {
          heading: '1. Įvadas',
          content: 'Contactium ("mes", "mūsų") įsipareigoja saugoti jūsų privatumą. Ši Privatumo politika paaiškina, kaip mes renkame, naudojame, atskleidžiame ir saugome jūsų informaciją, kai naudojate mūsų šaltų el. laiškų automatizavimo platformą.'
        },
        {
          heading: '2. Informacija, Kurią Renkame',
          content: 'Mes renkame informaciją, kurią tiesiogiai mums pateikiate:\n\n• Paskyros informaciją (vardą, el. pašto adresą, slaptažodį)\n• SMTP prisijungimo duomenis el. laiškų siuntimui\n• Įmonių kontaktų sąrašus ir el. pašto adresus\n• Kampanijų duomenis ir el. laiškų turinį\n• Mokėjimo informaciją (apdorojamą saugiai per trečiųjų šalių teikėjus)\n• Naudojimo duomenis ir analitiką'
        },
        {
          heading: '3. Kaip Naudojame Jūsų Informaciją',
          content: 'Mes naudojame surinktą informaciją:\n\n• Teikti, prižiūrėti ir tobulinti mūsų paslaugas\n• Apdoroti jūsų operacijas ir siųsti susijusią informaciją\n• Generuoti AI pagalbos el. laiškų turinį\n• Siųsti administracinę informaciją, atnaujinimus ir saugumo įspėjimus\n• Stebėti ir analizuoti naudojimo modelius bei tendencijas\n• Aptikti ir užkirsti kelią sukčiavimui'
        },
        {
          heading: '4. Duomenų Saugojimas ir Saugumas',
          content: 'Mes taikome tinkamas technines ir organizacines priemones jūsų asmeniniams duomenims apsaugoti. Jūsų SMTP prisijungimo duomenys yra užšifruoti, ir mes naudojame pramonės standartų saugumo protokolus. Tačiau joks perdavimo internetu metodas nėra 100% saugus.'
        },
        {
          heading: '5. Duomenų Dalijimasis',
          content: 'Mes neparduodame jūsų asmeninės informacijos. Galime dalintis jūsų informacija su:\n\n• Paslaugų teikėjais, padedančiais mūsų operacijose (pvz., OpenAI, Google AI paslaugoms)\n• Teisėsaugos institucijomis, kai to reikalauja įstatymai\n• Verslo perdavimo ar įsigijimo atveju'
        },
        {
          heading: '6. Jūsų Teisės',
          content: 'Pagal BDAR, jūs turite teisę:\n\n• Prieiti prie savo asmeninių duomenų\n• Ištaisyti netikslių duomenų\n• Prašyti ištrinti savo duomenis\n• Nesutikti su apdorojimu\n• Duomenų perkeliamumu\n• Atšaukti sutikimą\n\nNorėdami pasinaudoti šiomis teisėmis, susisiekite su mumis privacy@contactium.com'
        },
        {
          heading: '7. Tarptautiniai Duomenų Perdavimai',
          content: 'Jūsų informacija gali būti perduota ir apdorota kitose šalyse nei jūsų. Mes užtikriname, kad tokiems perdavimams būtų taikomos tinkamos apsaugos priemonės.'
        },
        {
          heading: '8. Duomenų Saugojimas',
          content: 'Mes saugome jūsų asmeninius duomenis tiek, kiek būtina teikti mūsų paslaugas ir laikytis teisinių įsipareigojimų. Bet kada galite paprašyti ištrinti savo paskyrą.'
        },
        {
          heading: '9. Vaikų Privatumas',
          content: 'Mūsų paslauga nėra skirta vaikams iki 16 metų. Mes sąmoningai nerenkame asmeninės informacijos iš vaikų.'
        },
        {
          heading: '10. Politikos Pakeitimai',
          content: 'Galime kartkartėmis atnaujinti šią Privatumo politiką. Apie bet kokius pakeitimus pranešime paskelbdami naują politiką šiame puslapyje ir atnaujindami "Paskutinį kartą atnaujinta" datą.'
        },
        {
          heading: '11. Susisiekite Su Mumis',
          content: 'Jei turite klausimų dėl šios Privatumo politikos, susisiekite su mumis:\n\nEl. paštas: privacy@contactium.com\nContactium\nVilnius, Lietuva'
        }
      ]
    }
  }

  const t = content[language]

  return (
    <div className="policy-page">
      <header className="policy-header">
        <div className="policy-header-content">
          <div className="policy-logo" onClick={() => navigate('/')}>
            <span className="logo-icon">📧</span>
            <span className="logo-text">Contactium</span>
          </div>
          <div className="policy-header-actions">
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
            <button onClick={() => navigate('/')} className="back-btn">
              ← {language === 'en' ? 'Back to Home' : 'Atgal į Pradžią'}
            </button>
          </div>
        </div>
      </header>

      <div className="policy-content">
        <div className="policy-container">
          <h1>{t.title}</h1>
          <p className="last-updated">{t.lastUpdated}</p>

          {t.sections.map((section, index) => (
            <section key={index} className="policy-section">
              <h2>{section.heading}</h2>
              <p className="policy-text">{section.content}</p>
            </section>
          ))}
        </div>
      </div>

      <footer className="policy-footer">
        <p>© 2025 Contactium. {language === 'en' ? 'All rights reserved.' : 'Visos teisės saugomos.'}</p>
      </footer>
    </div>
  )
}
