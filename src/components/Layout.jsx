import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useSubscription } from '../contexts/SubscriptionContext'
import '../styles/Layout.css'

export default function Layout({ children }) {
  const { user, signOut } = useAuth()
  const { currentPlan, usage, loading, canCreateCampaign, getCampaignCount } = useSubscription()
  const location = useLocation()
  const navigate = useNavigate()

  const isActive = (path) => location.pathname === path

  const handleCreateClick = async (e) => {
    e.preventDefault()
    const campaignCount = await getCampaignCount()
    if (!canCreateCampaign(campaignCount)) {
      alert(`Campaign limit reached! You have ${campaignCount} of ${currentPlan?.campaignLimit} campaigns. Upgrade your plan to create more campaigns.`)
      navigate('/settings')
    } else {
      navigate('/create')
    }
  }

  const getUsageColor = () => {
    if (!usage) return '#10b981'
    const percentage = (usage.emailsSent / usage.emailLimit) * 100
    if (percentage >= 90) return '#ef4444'
    if (percentage >= 70) return '#f59e0b'
    return '#10b981'
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
              Dashboard
            </Link>
            <Link
              to="/campaigns"
              className={`nav-btn ${isActive('/campaigns') ? 'active' : ''}`}
            >
              Campaigns
            </Link>
            <a
              href="/create"
              onClick={handleCreateClick}
              className={`nav-btn ${isActive('/create') ? 'active' : ''}`}
            >
              Create
            </a>
            <Link
              to="/companies"
              className={`nav-btn ${isActive('/companies') ? 'active' : ''}`}
            >
              Companies
            </Link>
            <Link
              to="/settings"
              className={`nav-btn ${isActive('/settings') ? 'active' : ''}`}
            >
              Settings
            </Link>
            {!loading && currentPlan && (
              <Link to="/settings" className="plan-badge" style={{
                borderColor: currentPlan.color,
                backgroundColor: currentPlan.bgColor
              }}>
                <div className="plan-info">
                  <span className="plan-name" style={{ color: currentPlan.color }}>
                    {currentPlan.name} Plan
                  </span>
                  {usage && (
                    <span className="plan-usage" style={{ color: getUsageColor() }}>
                      {usage.emailsSent}/{usage.emailLimit}
                    </span>
                  )}
                </div>
              </Link>
            )}
            <span className="user-email">{user?.email}</span>
            <button onClick={signOut} className="signout-btn">
              Sign Out
            </button>
          </div>
        </div>
      </nav>
      <main className="main-content">
        {children}
      </main>
    </div>
  )
}
