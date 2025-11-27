import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useSubscription } from '../contexts/SubscriptionContext'
import { useLanguage } from '../contexts/LanguageContext'
import SupportButton from './SupportButton'
import '../styles/Layout.css'

export default function Layout({ children }) {
  const { user, signOut } = useAuth()
  const { currentPlan, canCreateCampaign, getCampaignCount } = useSubscription()
  const { language, setLanguage, t } = useLanguage()
  const location = useLocation()
  const navigate = useNavigate()

  const isActive = (path) => location.pathname === path

  const handleCreateClick = async (e) => {
    e.preventDefault()
    const campaignCount = await getCampaignCount()
    if (!canCreateCampaign(campaignCount)) {
      alert(`${t('dashboard.campaignLimitReached')} ${campaignCount} ${t('dashboard.campaignLimitOf')} ${currentPlan?.campaignLimit} ${t('dashboard.campaignLimitUpgrade')}`)
      navigate('/settings')
    } else {
      navigate('/create')
    }
  }

  return (
    <div className="main-container">
      <nav className="navbar">
        <div className="nav-content">
          <h1 className="logo">Contactium</h1>
          <div className="nav-right">
            <Link
              to="/"
              className={`nav-btn ${isActive('/') ? 'active' : ''}`}
            >
              {t('nav.dashboard')}
            </Link>
            <Link
              to="/campaigns"
              className={`nav-btn ${isActive('/campaigns') ? 'active' : ''}`}
            >
              {t('nav.campaigns')}
            </Link>
            <a
              href="/create"
              onClick={handleCreateClick}
              className={`nav-btn ${isActive('/create') ? 'active' : ''}`}
            >
              {t('common.create')}
            </a>
            <Link
              to="/companies"
              className={`nav-btn ${isActive('/companies') ? 'active' : ''}`}
            >
              {t('nav.companies')}
            </Link>
            <Link
              to="/contact-lists"
              className={`nav-btn ${isActive('/contact-lists') || location.pathname.startsWith('/contact-lists/') ? 'active' : ''}`}
            >
              {t('nav.contacts')}
            </Link>
            <Link
              to="/settings"
              className={`nav-btn ${isActive('/settings') ? 'active' : ''}`}
            >
              {t('nav.settings')}
            </Link>
            <Link
              to="/help"
              className={`nav-btn ${isActive('/help') ? 'active' : ''}`}
            >
              {t('nav.help')}
            </Link>

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

            <span className="user-email">{user?.email}</span>
            <button onClick={signOut} className="signout-btn">
              {t('nav.signOut')}
            </button>
          </div>
        </div>
      </nav>
      <main className="main-content">
        {children}
      </main>
      <SupportButton />
    </div>
  )
}
