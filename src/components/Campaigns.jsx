import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { useSubscription } from '../contexts/SubscriptionContext'
import { sendCampaign } from '../lib/campaignSender'
import UpgradePrompt from './UpgradePrompt'
import '../styles/Campaigns.css'

export default function Campaigns() {
  const { user } = useAuth()
  const { currentPlan, canCreateCampaign } = useSubscription()
  const navigate = useNavigate()
  const [campaigns, setCampaigns] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [sendingCampaignId, setSendingCampaignId] = useState(null)

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

      if (error) throw error
      setCampaigns(data || [])
    } catch (error) {
      console.error('Error loading campaigns:', error)
    } finally {
      setLoading(false)
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

  const filteredCampaigns = campaigns.filter(campaign => {
    const matchesStatus = filterStatus === 'all' || campaign.status === filterStatus
    const matchesSearch =
      campaign.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      campaign.category?.toLowerCase().includes(searchQuery.toLowerCase())

    return matchesStatus && matchesSearch
  })

  const formatDate = (dateString) => {
    if (!dateString) return 'Not scheduled'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-state">Loading campaigns...</div>
      </div>
    )
  }

  const atCampaignLimit = !canCreateCampaign(campaigns.length)

  return (
    <div className="page-container">
      <h2 className="page-title">All Campaigns</h2>

      <div className="plan-status">
        <span>{campaigns.length} of {currentPlan?.campaignLimit} campaigns used</span>
      </div>

      {atCampaignLimit && (
        <UpgradePrompt
          title="Campaign Limit Reached"
          message={`You've reached the maximum of ${currentPlan?.campaignLimit} campaign(s) for your ${currentPlan?.name} plan.`}
          feature="Create up to 5 campaigns with Starter plan or 20 campaigns with Professional plan!"
        />
      )}

      <div className="filter-bar">
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="filter-select">
          <option value="all">All Statuses</option>
          <option value="running">Running</option>
          <option value="completed">Completed</option>
          <option value="not-started">Not Started</option>
          <option value="paused">Paused</option>
        </select>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search campaigns..."
          className="search-input"
        />
      </div>

      {filteredCampaigns.length === 0 ? (
        <div className="empty-state">
          <p>No campaigns found. {searchQuery || filterStatus !== 'all' ? 'Try adjusting your filters.' : 'Create your first campaign!'}</p>
        </div>
      ) : (
        <div className="campaigns-grid">
          {filteredCampaigns.map((campaign) => {
            const expirationInfo = checkCampaignExpiration(campaign.created_at)
            return (
              <div key={campaign.id} className="campaign-card">
                <div
                  className="campaign-header"
                  onClick={() => navigate(`/campaigns/${campaign.id}`)}
                  style={{ cursor: 'pointer' }}
                >
                  <h3>{campaign.name}</h3>
                  <span className={`status-badge ${campaign.status}`}>{campaign.status}</span>
                </div>
                <div
                  className="campaign-body"
                  onClick={() => navigate(`/campaigns/${campaign.id}`)}
                  style={{ cursor: 'pointer' }}
                >
                  <p><strong>Category:</strong> {campaign.category || 'General'}</p>
                  <p><strong>Send Date:</strong> {formatDate(campaign.send_date)}</p>
                  <p><strong>Emails Sent:</strong> {campaign.emails_sent || 0}</p>
                  {campaign.emails_opened > 0 && <p><strong>Opened:</strong> {campaign.emails_opened}</p>}
                  {campaign.emails_replied > 0 && <p><strong>Replied:</strong> {campaign.emails_replied}</p>}
                  {campaign.description && (
                    <p className="campaign-description">{campaign.description}</p>
                  )}

                  {/* Expiration Warning */}
                  {expirationInfo.isExpired ? (
                    <div style={{
                      marginTop: '0.5rem',
                      padding: '0.5rem',
                      backgroundColor: '#fee',
                      border: '1px solid #dc3545',
                      borderRadius: '4px',
                      fontSize: '0.85rem',
                      color: '#721c24'
                    }}>
                      ⚠️ Expired - will be auto-deleted
                    </div>
                  ) : expirationInfo.daysRemaining <= 7 && (
                    <div style={{
                      marginTop: '0.5rem',
                      padding: '0.5rem',
                      backgroundColor: '#fff3cd',
                      border: '1px solid #ffc107',
                      borderRadius: '4px',
                      fontSize: '0.85rem',
                      color: '#856404'
                    }}>
                      ⏳ Expires in {expirationInfo.daysRemaining} {expirationInfo.daysRemaining === 1 ? 'day' : 'days'}
                    </div>
                  )}
                </div>
                <div className="campaign-footer">
                  {!expirationInfo.isExpired && (campaign.status === 'not-started' || campaign.status === 'failed') && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleSendCampaign(campaign.id, campaign.name)
                      }}
                      className="primary-btn"
                      disabled={sendingCampaignId === campaign.id}
                    >
                      {sendingCampaignId === campaign.id ? 'Sending...' : 'Send Now'}
                    </button>
                  )}
                  {campaign.status === 'running' && (
                    <span className="sending-indicator">Sending...</span>
                  )}
                  {expirationInfo.isExpired && (
                    <span style={{ fontSize: '0.9rem', color: '#6c757d' }}>
                      Campaign expired
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
