import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { useSubscription } from '../contexts/SubscriptionContext'
import { sendCampaign } from '../lib/campaignSender'
import '../styles/Dashboard.css'

export default function Dashboard() {
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

  const deleteCampaign = async (id) => {
    if (!confirm('Are you sure you want to delete this campaign?')) return

    try {
      const { error} = await supabase
        .from('campaigns')
        .delete()
        .eq('id', id)

      if (error) throw error
      loadCampaigns()
    } catch (error) {
      console.error('Error deleting campaign:', error)
      alert('Failed to delete campaign')
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
        <div className="loading-state">Loading...</div>
      </div>
    )
  }

  return (
    <div className="page-container">
      <h2 className="page-title">Dashboard</h2>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-label">Total Campaigns</div>
          </div>
          <div className="stat-value">{stats.total}</div>
        </div>
        <div className="stat-card stat-card-success">
          <div className="stat-header">
            <div className="stat-label">Completed</div>
          </div>
          <div className="stat-value">{stats.completed}</div>
        </div>
        <div className="stat-card stat-card-info">
          <div className="stat-header">
            <div className="stat-label">Running</div>
          </div>
          <div className="stat-value">{stats.running}</div>
        </div>
        <div className="stat-card stat-card-primary">
          <div className="stat-header">
            <div className="stat-label">Emails Sent</div>
          </div>
          <div className="stat-value">{stats.totalEmailsSent}</div>
        </div>
      </div>

      <div className="campaigns-section">
        <h3>Recent Campaigns</h3>
        {campaigns.length === 0 ? (
          <div className="empty-state">
            <p>No campaigns yet. Create your first campaign to get started!</p>
            <a href="/create" onClick={handleCreateCampaign} className="primary-btn">Create Campaign</a>
          </div>
        ) : (
          <div className="campaigns-table">
            <table>
              <thead>
                <tr>
                  <th>Campaign Name</th>
                  <th>Category</th>
                  <th>Emails Sent</th>
                  <th>Send Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map((campaign) => (
                  <tr
                    key={campaign.id}
                    onClick={() => navigate(`/campaigns/${campaign.id}`)}
                    style={{ cursor: 'pointer' }}
                  >
                    <td><strong>{campaign.name}</strong></td>
                    <td><span className="category-badge">{campaign.category || 'General'}</span></td>
                    <td>{campaign.emails_sent || 0}</td>
                    <td>{formatDate(campaign.send_date)}</td>
                    <td>
                      <span className={`status-badge ${campaign.status}`}>
                        {campaign.status}
                      </span>
                    </td>
                    <td onClick={(e) => e.stopPropagation()}>
                      {(campaign.status === 'not-started' || campaign.status === 'failed') && (
                        <button
                          onClick={() => handleSendCampaign(campaign.id, campaign.name)}
                          className="action-btn primary"
                          disabled={sendingCampaignId === campaign.id}
                          style={{marginRight: '0.5rem'}}
                        >
                          {sendingCampaignId === campaign.id ? 'Sending...' : 'Send'}
                        </button>
                      )}
                      <button onClick={() => deleteCampaign(campaign.id)} className="action-btn danger">
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
