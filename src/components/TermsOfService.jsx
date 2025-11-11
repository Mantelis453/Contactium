import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import '../styles/PolicyPages.css'

export default function TermsOfService() {
  const navigate = useNavigate()
  const [language, setLanguage] = useState('en')

  const content = {
    en: {
      title: 'Terms of Service',
      lastUpdated: 'Last updated: January 2025',
      sections: [
        {
          heading: '1. Acceptance of Terms',
          content: 'By accessing and using Contactium, you accept and agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our service.'
        },
        {
          heading: '2. Description of Service',
          content: 'Contactium provides an AI-powered cold email automation platform that allows users to:\n\n• Generate personalized email content using AI\n• Manage email campaigns\n• Send emails through their own SMTP servers\n• Access company database for Lithuanian companies\n• Track campaign performance'
        },
        {
          heading: '3. User Accounts',
          content: 'You must create an account to use Contactium. You are responsible for:\n\n• Maintaining the confidentiality of your account credentials\n• All activities that occur under your account\n• Notifying us immediately of any unauthorized use\n• Providing accurate and complete information'
        },
        {
          heading: '4. Acceptable Use',
          content: 'You agree NOT to use Contactium to:\n\n• Send spam or unsolicited emails\n• Violate any laws or regulations (including GDPR, CAN-SPAM, etc.)\n• Harass, abuse, or harm others\n• Collect or store personal data without consent\n• Impersonate others or misrepresent your identity\n• Distribute malware or malicious content\n• Interfere with the service or other users'
        },
        {
          heading: '5. SMTP and Email Sending',
          content: 'You are responsible for:\n\n• Providing your own SMTP server credentials\n• Complying with your email provider\'s terms of service\n• Ensuring you have permission to contact recipients\n• Following anti-spam laws and best practices\n• Managing bounces, unsubscribes, and complaints\n\nWe are not responsible for deliverability issues or account suspensions by your email provider.'
        },
        {
          heading: '6. AI-Generated Content',
          content: 'Our AI services generate email content based on your input. You are responsible for:\n\n• Reviewing and approving all AI-generated content before sending\n• Ensuring content accuracy and appropriateness\n• Any legal issues arising from sent content\n\nWe do not guarantee the quality or accuracy of AI-generated content.'
        },
        {
          heading: '7. Pricing and Payment',
          content: 'Subscription fees are charged based on your selected plan:\n\n• Free: Limited usage for testing\n• Starter: €29/month (€23/month billed yearly)\n• Professional: €79/month (€63/month billed yearly)\n\nAll fees are non-refundable. We reserve the right to change pricing with 30 days notice.'
        },
        {
          heading: '8. Cancellation and Termination',
          content: 'You may cancel your subscription at any time. Upon cancellation:\n\n• You retain access until the end of your billing period\n• No refunds for partial months\n• Your data will be retained for 30 days, then permanently deleted\n\nWe may terminate your account if you violate these terms.'
        },
        {
          heading: '9. Intellectual Property',
          content: 'Contactium and its content are protected by intellectual property laws. You may not:\n\n• Copy, modify, or distribute our software\n• Reverse engineer our platform\n• Use our trademarks without permission\n\nYou retain ownership of your data and email content.'
        },
        {
          heading: '10. Data and Privacy',
          content: 'Your use of Contactium is subject to our Privacy Policy. We collect and process data as described in that policy. You are responsible for complying with GDPR and other data protection laws when using our service.'
        },
        {
          heading: '11. Disclaimers',
          content: 'Contactium is provided "AS IS" without warranties of any kind. We do not guarantee:\n\n• Uninterrupted or error-free service\n• Email deliverability\n• AI content accuracy\n• Service availability\n\nUse at your own risk.'
        },
        {
          heading: '12. Limitation of Liability',
          content: 'To the maximum extent permitted by law, Contactium shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of profits, data, or business opportunities.'
        },
        {
          heading: '13. Indemnification',
          content: 'You agree to indemnify and hold Contactium harmless from any claims, damages, or expenses arising from your use of the service or violation of these terms.'
        },
        {
          heading: '14. Changes to Terms',
          content: 'We may modify these Terms of Service at any time. Continued use of the service after changes constitutes acceptance of the new terms.'
        },
        {
          heading: '15. Governing Law',
          content: 'These terms are governed by the laws of Lithuania. Any disputes shall be resolved in the courts of Vilnius, Lithuania.'
        },
        {
          heading: '16. Contact',
          content: 'For questions about these Terms of Service, contact us at:\n\nEmail: legal@contactium.com\nContactium\nVilnius, Lithuania'
        }
      ]
    },
    lt: {
      title: 'Paslaugų Teikimo Sąlygos',
      lastUpdated: 'Paskutinį kartą atnaujinta: 2025 m. sausis',
      sections: [
        {
          heading: '1. Sąlygų Priėmimas',
          content: 'Naudodamiesi Contactium, jūs sutinkate su šiomis Paslaugų teikimo sąlygomis. Jei nesutinkate su šiomis sąlygomis, nenaudokite mūsų paslaugos.'
        },
        {
          heading: '2. Paslaugos Aprašymas',
          content: 'Contactium teikia AI pagalbos šaltų el. laiškų automatizavimo platformą, leidžiančią vartotojams:\n\n• Generuoti personalizuotą el. laiškų turinį naudojant AI\n• Valdyti el. laiškų kampanijas\n• Siųsti el. laiškus per savo SMTP serverius\n• Prieiti prie Lietuvos įmonių duomenų bazės\n• Stebėti kampanijų rezultatus'
        },
        {
          heading: '3. Vartotojo Paskyros',
          content: 'Turite sukurti paskyrą, kad galėtumėte naudotis Contactium. Esate atsakingi už:\n\n• Savo paskyros prisijungimo duomenų konfidencialumo išsaugojimą\n• Visą veiklą, vykdomą per jūsų paskyrą\n• Nedelsdami pranešti mums apie neteisėtą naudojimą\n• Tikslios ir išsamios informacijos pateikimą'
        },
        {
          heading: '4. Priimtinas Naudojimas',
          content: 'Sutinkate NENAUDOTI Contactium:\n\n• Šlamšto ar nepageidaujamų el. laiškų siuntimui\n• Įstatymų ar reglamentų (įskaitant BDAR, CAN-SPAM ir kt.) pažeidimui\n• Kitų priekabiavimui, įžeidinėjimui ar žalojimui\n• Asmeninių duomenų rinkimui ar saugojimui be sutikimo\n• Kitų apsimetinėjimui ar klaidingam tapatybės atstovavimui\n• Kenkėjiškų programų ar turinio platinimui\n• Paslaugos ar kitų vartotojų trikdymui'
        },
        {
          heading: '5. SMTP ir El. Laiškų Siuntimas',
          content: 'Esate atsakingi už:\n\n• Savo SMTP serverio prisijungimo duomenų pateikimą\n• Jūsų el. pašto teikėjo paslaugų teikimo sąlygų laikymąsi\n• Užtikrinimą, kad turite leidimą susisiekti su gavėjais\n• Šlamšto prevencijos įstatymų ir geriausios praktikos laikymąsi\n• Atmetimų, atsisakymų ir skundų valdymą\n\nMes neatsakome už pristatymo problemas ar paskyros sustabdymą jūsų el. pašto teikėjo.'
        },
        {
          heading: '6. AI Sugeneruotas Turinys',
          content: 'Mūsų AI paslaugos generuoja el. laiškų turinį pagal jūsų įvestį. Esate atsakingi už:\n\n• Viso AI sugeneruoto turinio peržiūrą ir patvirtinimą prieš siunčiant\n• Turinio tikslumo ir tinkamumo užtikrinimą\n• Bet kokias teisines problemas, kylas iš išsiųsto turinio\n\nMes negarantuojame AI sugeneruoto turinio kokybės ar tikslumo.'
        },
        {
          heading: '7. Kainodara ir Mokėjimas',
          content: 'Prenumeratos mokesčiai imami pagal jūsų pasirinktą planą:\n\n• Nemokamas: Ribotas naudojimas testavimui\n• Pradedantysis: €29/mėn (€23/mėn mokant metams)\n• Profesionalus: €79/mėn (€63/mėn mokant metams)\n\nVisi mokesčiai negrąžinami. Pasiliekame teisę keisti kainas pranešę prieš 30 dienų.'
        },
        {
          heading: '8. Atšaukimas ir Nutraukimas',
          content: 'Galite atšaukti prenumeratą bet kada. Atšaukus:\n\n• Išlaikote prieigą iki atsiskaitymo laikotarpio pabaigos\n• Negrąžinami pinigai už dalinius mėnesius\n• Jūsų duomenys bus saugomi 30 dienų, tada visam laikui ištrinti\n\nGalime nutraukti jūsų paskyrą, jei pažeisite šias sąlygas.'
        },
        {
          heading: '9. Intelektinė Nuosavybė',
          content: 'Contactium ir jo turinys yra saugomi intelektinės nuosavybės įstatymų. Negalite:\n\n• Kopijuoti, modifikuoti ar platinti mūsų programinės įrangos\n• Atvirkštinės inžinerijos mūsų platformos\n• Naudoti mūsų prekių ženklų be leidimo\n\nIšlaikote nuosavybę savo duomenims ir el. laiškų turiniui.'
        },
        {
          heading: '10. Duomenys ir Privatumas',
          content: 'Jūsų Contactium naudojimas yra priklausomas nuo mūsų Privatumo politikos. Renkame ir apdorojame duomenis kaip aprašyta toje politikoje. Esate atsakingi už BDAR ir kitų duomenų apsaugos įstatymų laikymąsi naudodami mūsų paslaugą.'
        },
        {
          heading: '11. Atsakomybės Atsisakymai',
          content: 'Contactium teikiama "KAIP YRA" be jokių garantijų. Mes negarantuojame:\n\n• Nepertraukiamos ar klaidų nesančios paslaugos\n• El. laiškų pristatymo\n• AI turinio tikslumo\n• Paslaugos prieinamumo\n\nNaudokite savo rizika.'
        },
        {
          heading: '12. Atsakomybės Ribojimas',
          content: 'Maksimaliu įstatymų leistinu mastu, Contactium nebus atsakingas už jokias netiesiogines, atsitiktines, specialias, pasekminius ar baudžiamuosius nuostolius, įskaitant pelno, duomenų ar verslo galimybių praradimą.'
        },
        {
          heading: '13. Atlyginimas',
          content: 'Sutinkate atlyginti ir apsaugoti Contactium nuo bet kokių pretenzijų, nuostolių ar išlaidų, kylas iš jūsų paslaugos naudojimo ar šių sąlygų pažeidimo.'
        },
        {
          heading: '14. Sąlygų Pakeitimai',
          content: 'Galime keisti šias Paslaugų teikimo sąlygas bet kada. Tęsiant paslaugos naudojimą po pakeitimų reiškia naujų sąlygų priėmimą.'
        },
        {
          heading: '15. Taikytina Teisė',
          content: 'Šios sąlygos yra reglamentuojamos Lietuvos įstatymų. Bet kokie ginčai bus sprendžiami Vilniaus, Lietuvos teismuose.'
        },
        {
          heading: '16. Kontaktai',
          content: 'Klausimams dėl šių Paslaugų teikimo sąlygų, susisiekite su mumis:\n\nEl. paštas: legal@contactium.com\nContactium\nVilnius, Lietuva'
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
