import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import '../styles/PolicyPages.css'

export default function CookiePolicy() {
  const navigate = useNavigate()
  const [language, setLanguage] = useState('en')

  const content = {
    en: {
      title: 'Cookie Policy',
      lastUpdated: 'Last updated: January 2025',
      sections: [
        {
          heading: '1. What Are Cookies',
          content: 'Cookies are small text files that are placed on your device when you visit a website. They help websites remember information about your visit, making your next visit easier and the site more useful to you.'
        },
        {
          heading: '2. How We Use Cookies',
          content: 'Contactium uses cookies to:\n\n• Keep you signed in to your account\n• Remember your preferences and settings\n• Understand how you use our service\n• Improve our platform performance\n• Provide security features\n• Analyze usage patterns and trends'
        },
        {
          heading: '3. Types of Cookies We Use',
          content: '**Strictly Necessary Cookies**\nThese cookies are essential for the website to function. They enable core functionality such as security, authentication, and accessibility.\n\n**Performance Cookies**\nThese cookies collect information about how you use our website, helping us improve performance and user experience.\n\n**Functional Cookies**\nThese cookies remember your preferences and settings, such as language selection and theme preferences.\n\n**Analytics Cookies**\nWe use analytics cookies to understand how visitors interact with our website, helping us improve our service.'
        },
        {
          heading: '4. Third-Party Cookies',
          content: 'We may use third-party services that set cookies on your device:\n\n• **Google Analytics**: For website analytics and usage tracking\n• **Supabase**: For authentication and database services\n• **Payment Processors**: For secure payment processing\n\nThese third parties have their own privacy policies and cookie practices.'
        },
        {
          heading: '5. Cookie Duration',
          content: '**Session Cookies**: Temporary cookies that expire when you close your browser\n\n**Persistent Cookies**: Remain on your device for a set period or until manually deleted. We use persistent cookies to remember your login and preferences.'
        },
        {
          heading: '6. Managing Cookies',
          content: 'You can control and manage cookies in several ways:\n\n**Browser Settings**\nMost browsers allow you to:\n• View cookies stored on your device\n• Delete cookies\n• Block cookies from specific websites\n• Block all cookies\n\n**Important**: Disabling cookies may affect the functionality of Contactium. Some features may not work properly without cookies.\n\n**Browser-Specific Instructions:**\n• Chrome: Settings > Privacy and Security > Cookies\n• Firefox: Settings > Privacy & Security > Cookies\n• Safari: Preferences > Privacy > Cookies\n• Edge: Settings > Cookies and Site Permissions'
        },
        {
          heading: '7. Do Not Track',
          content: 'Some browsers have a "Do Not Track" feature that signals websites you visit that you do not want to have your online activity tracked. Currently, there is no industry standard for how to respond to these signals, so we do not currently respond to Do Not Track signals.'
        },
        {
          heading: '8. Cookies and GDPR',
          content: 'Under GDPR, we require your consent for non-essential cookies. Essential cookies necessary for the website to function do not require consent.\n\nYou can withdraw your cookie consent at any time by adjusting your browser settings or contacting us.'
        },
        {
          heading: '9. Cookie List',
          content: 'The main cookies we use:\n\n• **auth_token**: Authentication and session management (Essential)\n• **user_preferences**: Language and settings (Functional)\n• **_ga, _gid**: Google Analytics (Analytics)\n• **supabase_auth**: Supabase authentication (Essential)\n\nCookie duration varies from session-based to up to 2 years.'
        },
        {
          heading: '10. Updates to This Policy',
          content: 'We may update this Cookie Policy to reflect changes in our practices or for legal, operational, or regulatory reasons. We will notify you of any material changes by updating the "Last updated" date.'
        },
        {
          heading: '11. Contact Us',
          content: 'If you have questions about our use of cookies, please contact us at:\n\nEmail: privacy@contactium.com\nContactium\nVilnius, Lithuania'
        }
      ]
    },
    lt: {
      title: 'Slapukų Politika',
      lastUpdated: 'Paskutinį kartą atnaujinta: 2025 m. sausis',
      sections: [
        {
          heading: '1. Kas Yra Slapukai',
          content: 'Slapukai yra maži tekstiniai failai, kurie patalpinami jūsų įrenginyje, kai apsilankote svetainėje. Jie padeda svetainėms atsiminti informaciją apie jūsų apsilankymą, palengvindami kitą apsilankymą ir padarydami svetainę naudingesnę jums.'
        },
        {
          heading: '2. Kaip Naudojame Slapukus',
          content: 'Contactium naudoja slapukus:\n\n• Išlaikyti jus prisijungusiais prie paskyros\n• Atsiminti jūsų nuostatas ir nustatymus\n• Suprasti, kaip naudojate mūsų paslaugą\n• Tobulinti mūsų platformos veikimą\n• Teikti saugumo funkcijas\n• Analizuoti naudojimo modelius ir tendencijas'
        },
        {
          heading: '3. Slapukų Tipai, Kuriuos Naudojame',
          content: '**Būtini Slapukai**\nŠie slapukai yra būtini svetainei funkcionuoti. Jie įgalina pagrindinę funkciją, tokią kaip saugumas, autentifikavimas ir prieinamumas.\n\n**Veiklos Slapukai**\nŠie slapukai renka informaciją apie tai, kaip naudojate mūsų svetainę, padėdami mums tobulinti veikimą ir vartotojo patirtį.\n\n**Funkciniai Slapukai**\nŠie slapukai atsimena jūsų nuostatas ir nustatymus, tokius kaip kalbos pasirinkimas ir temos nuostatos.\n\n**Analitikos Slapukai**\nNaudojame analitikos slapukus, kad suprastume, kaip lankytojai sąveikauja su mūsų svetaine, padėdami tobulinti mūsų paslaugą.'
        },
        {
          heading: '4. Trečiųjų Šalių Slapukai',
          content: 'Galime naudoti trečiųjų šalių paslaugas, kurios nustato slapukus jūsų įrenginyje:\n\n• **Google Analytics**: Svetainės analitikai ir naudojimo stebėjimui\n• **Supabase**: Autentifikavimui ir duomenų bazės paslaugoms\n• **Mokėjimo Procesoriai**: Saugiam mokėjimų apdorojimui\n\nŠios trečiosios šalys turi savo privatumo politikas ir slapukų praktikas.'
        },
        {
          heading: '5. Slapukų Trukmė',
          content: '**Sesijos Slapukai**: Laikini slapukai, kurie baigiasi, kai uždarote naršyklę\n\n**Pastovūs Slapukai**: Lieka jūsų įrenginyje nustatytą laiką arba kol rankiniu būdu ištrinami. Naudojame pastovius slapukus, kad atsimintume jūsų prisijungimą ir nuostatas.'
        },
        {
          heading: '6. Slapukų Valdymas',
          content: 'Galite kontroliuoti ir valdyti slapukus keliais būdais:\n\n**Naršyklės Nustatymai**\nDauguma naršyklių leidžia:\n• Peržiūrėti slapukus, saugomus jūsų įrenginyje\n• Ištrinti slapukus\n• Blokuoti slapukus iš konkrečių svetainių\n• Blokuoti visus slapukus\n\n**Svarbu**: Slapukų išjungimas gali paveikti Contactium funkcionalumą. Kai kurios funkcijos gali neveikti tinkamai be slapukų.\n\n**Naršyklės Specifinės Instrukcijos:**\n• Chrome: Nustatymai > Privatumas ir Saugumas > Slapukai\n• Firefox: Nustatymai > Privatumas ir Saugumas > Slapukai\n• Safari: Nuostatos > Privatumas > Slapukai\n• Edge: Nustatymai > Slapukai ir Svetainių Leidimai'
        },
        {
          heading: '7. Nestebėti',
          content: 'Kai kurios naršyklės turi "Nestebėti" funkciją, kuri signalizuoja svetainėms, kurias lankote, kad nenorite, jog jūsų internetinė veikla būtų stebima. Šiuo metu nėra pramonės standarto, kaip reaguoti į šiuos signalus, todėl mes šiuo metu nereaguojame į Nestebėti signalus.'
        },
        {
          heading: '8. Slapukai ir BDAR',
          content: 'Pagal BDAR, reikalaujame jūsų sutikimo nebūtiniems slapukams. Būtini slapukai, reikalingi svetainei funkcionuoti, nereikalauja sutikimo.\n\nGalite atšaukti savo slapukų sutikimą bet kada koreguodami naršyklės nustatymus arba susisiekdami su mumis.'
        },
        {
          heading: '9. Slapukų Sąrašas',
          content: 'Pagrindiniai slapukai, kuriuos naudojame:\n\n• **auth_token**: Autentifikavimas ir sesijos valdymas (Būtini)\n• **user_preferences**: Kalba ir nustatymai (Funkciniai)\n• **_ga, _gid**: Google Analytics (Analitikos)\n• **supabase_auth**: Supabase autentifikavimas (Būtini)\n\nSlapukų trukmė skiriasi nuo sesijos pagrindu iki 2 metų.'
        },
        {
          heading: '10. Šios Politikos Atnaujinimai',
          content: 'Galime atnaujinti šią Slapukų politiką, kad atspindėtume pokyčius mūsų praktikoje arba dėl teisinių, operacinių ar reguliavimo priežasčių. Pranešime jums apie bet kokius esminius pakeitimus atnaujindami "Paskutinį kartą atnaujinta" datą.'
        },
        {
          heading: '11. Susisiekite Su Mumis',
          content: 'Jei turite klausimų dėl mūsų slapukų naudojimo, susisiekite su mumis:\n\nEl. paštas: privacy@contactium.com\nContactium\nVilnius, Lietuva'
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
