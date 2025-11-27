import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { useSubscription } from '../contexts/SubscriptionContext'
import { sendCampaign } from '../lib/campaignSender'
import { useLanguage } from '../contexts/LanguageContext'
import '../styles/Dashboard.css'

export default function Dashboard() {
  const { t } = useLanguage()
  const { user } = useAuth()
  const { currentPlan, canCreateCampaign } = useSubscription()
  const navigate = useNavigate()
  const [campaigns, setCampaigns] = useState([])
  const [loading, setLoading] = useState(true)
  const [sendingCampaignId, setSendingCampaignId] = useState(null)
  const [stats, setStats] = useState({
    total: 0,
    running: 0,
    completed: 0,
    totalEmailsSent: 0
  })

  useEffect(() => {
    if (user?.id) {
      loadCampaigns()
    }
  }, [user])

  const loadCampaigns = async () => {
    if (!user?.id) return

    try {
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5)

      if (error) throw error

      setCampaigns(data || [])

      // Calculate stats
      const total = data?.length || 0
      const running = data?.filter(c => c.status === 'running').length || 0
      const completed = data?.filter(c => c.status === 'completed').length || 0
      const totalEmailsSent = data?.reduce((sum, c) => sum + (c.emails_sent || 0), 0) || 0

      setStats({ total, running, completed, totalEmailsSent })
    } catch (error) {
      console.error('Error loading campaigns:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateCampaign = async (e) => {
    e.preventDefault()

    // Get total campaign count (not just the 5 shown)
    const { count } = await supabase
      .from('campaigns')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)

    if (!canCreateCampaign(count)) {
      alert(`Campaign limit reached! You have ${count} of ${currentPlan?.campaignLimit} campaigns. Upgrade your plan to create more campaigns.`)
      navigate('/settings')
    } else {
      navigate('/create')
    }
  }

  const handleSendCampaign = async (campaignId, campaignName) => {
    if (!confirm(`Are you sure you want to send "${campaignName}" now? This will generate and send personalized emails to all recipients.`)) return

    setSendingCampaignId(campaignId)
    try {
      const result = await sendCampaign(campaignId, user.id)
      alert(`Campaign sent successfully! ${result.sent} emails sent, ${result.failed} failed.`)
      loadCampaigns()
    } catch (error) {
      console.error('Error sending campaign:', error)
      alert(`Failed to send campaign: ${error.message}`)
    } finally {
      setSendingCampaignId(null)
    }
  }

  const checkCampaignExpiration = (createdAt) => {
    const createdDate = new Date(createdAt)
    const now = new Date()
    const daysSinceCreation = Math.floor((now - createdDate) / (1000 * 60 * 60 * 24))
    return {
      isExpired: daysSinceCreation >= 30,
      daysRemaining: 30 - daysSinceCreation,
      daysSinceCreation
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'Not scheduled'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-state">{t('common.loading')}</div>
      </div>
    )
  }

  return (
    <div className="page-container">
      <div className="dashboard-header">
        <div className="header-content">
          <div>
            <h2 className="page-title">{t('dashboard.title')}</h2>
            <p className="dashboard-subtitle">Monitor and manage your email campaigns</p>
          </div>
          <button onClick={handleCreateCampaign} className="primary-btn create-campaign-btn">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>{t('createCampaign.createCampaign')}</button>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon stat-icon-default">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          </div>
          <div className="stat-content">
            <div className="stat-label">{t('dashboard.totalCampaigns')}</div>
            <div className="stat-value">{stats.total}</div>
            <div className="stat-change">
              <Link to="/campaigns" className="stat-link">View all →</Link>
            </div>
          </div>
        </div>

        <div className="stat-card stat-card-success">
          <div className="stat-icon stat-icon-success">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
          <div className="stat-content">
            <div className="stat-label">{t('dashboard.completedCampaigns')}</div>
            <div className="stat-value">{stats.completed}</div>
            <div className="stat-change">
              {stats.total > 0 && (
                <span className="stat-percentage">{Math.round((stats.completed / stats.total) * 100)}% success rate</span>
              )}
            </div>
          </div>
        </div>

        <div className="stat-card stat-card-info">
          <div className="stat-icon stat-icon-info">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
          <div className="stat-content">
            <div className="stat-label">Active Campaigns</div>
            <div className="stat-value">{stats.running}</div>
            <div className="stat-change">
              {stats.running > 0 ? (
                <span className="stat-status stat-status-active">In progress</span>
              ) : (
                <span className="stat-status">No active campaigns</span>
              )}
            </div>
          </div>
        </div>

        <div className="stat-card stat-card-primary">
          <div className="stat-icon stat-icon-primary">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
              <polyline points="22,6 12,13 2,6" />
            </svg>
          </div>
          <div className="stat-content">
            <div className="stat-label">Total Emails Sent</div>
            <div className="stat-value">{stats.totalEmailsSent.toLocaleString()}</div>
            <div className="stat-change">
              {stats.totalEmailsSent > 0 && (
                <span className="stat-percentage">Across all campaigns</span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="dashboard-content">
        <div className="campaigns-section">
          <div className="section-header">
            <h3>{t('dashboard.recentCampaigns')}</h3>
            <Link to="/campaigns" className="view-all-link">
              View all campaigns →
            </Link>
          </div>

          {campaigns.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
              </div>
              <h4>{t('dashboard.noCampaigns')}</h4>
              <p>Create your first campaign to start sending personalized emails to your contacts.</p>
              <button onClick={handleCreateCampaign} className="primary-btn">
                Create Your First Campaign
              </button>
            </div>
          ) : (
            <div className="campaigns-list">
              {campaigns.map((campaign) => {
                const expirationInfo = checkCampaignExpiration(campaign.created_at)
                return (
                  <div
                    key={campaign.id}
                    className="campaign-card"
                    onClick={() => navigate(`/campaigns/${campaign.id}`)}
                  >
                    <div className="campaign-card-header">
                      <div className="campaign-info">
                        <h4 className="campaign-name">{campaign.name}</h4>
                        <div className="campaign-meta">
                          <span className="category-badge">{campaign.category || 'General'}</span>
                          <span className="campaign-date">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                              <line x1="16" y1="2" x2="16" y2="6" />
                              <line x1="8" y1="2" x2="8" y2="6" />
                              <line x1="3" y1="10" x2="21" y2="10" />
                            </svg>
                            {formatDate(campaign.created_at)}
                          </span>
                        </div>
                      </div>
                      <span className={`status-badge status-${campaign.status}`}>
                        {campaign.status === 'not-started' ? 'Ready' : campaign.status}
                      </span>
                    </div>

                    <div className="campaign-card-stats">
                      <div className="campaign-stat">
                        <div className="campaign-stat-value">{campaign.emails_sent || 0}</div>
                        <div className="campaign-stat-label">{t('dashboard.emailsSent')}</div>
                      </div>
                      <div className="campaign-stat-divider" />
                      <div className="campaign-stat">
                        <div className="campaign-stat-value">
                          {campaign.emails_sent > 0
                            ? `${Math.round((campaign.emails_sent / (campaign.total_recipients || campaign.emails_sent)) * 100)}%`
                            : '0%'
                          }
                        </div>
                        <div className="campaign-stat-label">Completion</div>
                      </div>
                    </div>

                    {expirationInfo.isExpired && (
                      <div className="campaign-alert campaign-alert-danger">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 2L2 20h20L12 2zm0 5l7 13H5l7-13z" />
                          <path d="M11 10h2v5h-2zm0 6h2v2h-2z" />
                        </svg>
                        Campaign expired
                      </div>
                    )}

                    {!expirationInfo.isExpired && expirationInfo.daysRemaining <= 7 && (
                      <div className="campaign-alert campaign-alert-warning">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="10" />
                          <polyline points="12 6 12 12 16 14" />
                        </svg>
                        Expires in {expirationInfo.daysRemaining} days
                      </div>
                    )}

                    <div className="campaign-card-actions" onClick={(e) => e.stopPropagation()}>
                      {!expirationInfo.isExpired && (campaign.status === 'not-started' || campaign.status === 'failed') && (
                        <button
                          onClick={() => handleSendCampaign(campaign.id, campaign.name)}
                          className="campaign-action-btn campaign-action-primary"
                          disabled={sendingCampaignId === campaign.id}
                        >
                          {sendingCampaignId === campaign.id ? (
                            <>
                              <svg className="spinner" width="16" height="16" viewBox="0 0 24 24">
                                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" opacity="0.25" />
                                <path d="M12 2a10 10 0 0110 10" stroke="currentColor" strokeWidth="4" fill="none" />
                              </svg>{t('dashboard.sending')}</>
                          ) : (
                            <>
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="22" y1="2" x2="11" y2="13" />
                                <polygon points="22 2 15 22 11 13 2 9 22 2" />
                              </svg>
                              Send Now
                            </>
                          )}
                        </button>
                      )}
                      <button
                        onClick={() => navigate(`/campaigns/${campaign.id}`)}
                        className="campaign-action-btn campaign-action-secondary"
                      >
                        View Details →
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
