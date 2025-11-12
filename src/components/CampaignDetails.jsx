import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { sendCampaign } from '../lib/campaignSender'
import '../styles/CampaignDetails.css'

export default function CampaignDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [campaign, setCampaign] = useState(null)
  const [recipients, setRecipients] = useState([])
  const [loading, setLoading] = useState(true)
  const [sendingCampaign, setSendingCampaign] = useState(false)

  useEffect(() => {
    if (user?.id && id) {
      loadCampaignDetails()
    }
  }, [user, id])

  const loadCampaignDetails = async () => {
    try {
      // Load campaign
      const { data: campaignData, error: campaignError } = await supabase
        .from('campaigns')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single()

      if (campaignError) throw campaignError
      setCampaign(campaignData)

      // Load recipients with company details
      const { data: recipientsData, error: recipientsError } = await supabase
        .from('campaign_recipients')
        .select(`
          id,
          status,
          sent_at,
          personalized_email,
          companies (
            id,
            company_name,
            email,
            activity,
            employees,
            address
          )
        `)
        .eq('campaign_id', id)

      if (recipientsError) throw recipientsError
      setRecipients(recipientsData || [])
    } catch (error) {
      console.error('Error loading campaign details:', error)
      alert('Failed to load campaign details')
    } finally {
      setLoading(false)
    }
  }

  const handleSendCampaign = async () => {
    if (!confirm(`Are you sure you want to send "${campaign.name}" now?`)) return

    setSendingCampaign(true)
    try {
      const result = await sendCampaign(campaign.id, user.id)

      // Wait a moment for database to update
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Reload campaign details to show updated stats
      await loadCampaignDetails()

      alert(`Campaign sent! ${result.sent} emails sent, ${result.failed} failed.`)
    } catch (error) {
      console.error('Error sending campaign:', error)
      alert(`Failed to send campaign: ${error.message}`)
    } finally {
      setSendingCampaign(false)
    }
  }

  const checkCampaignExpiration = (createdAt) => {
    const createdDate = new Date(createdAt)
    const now = new Date()
    const daysSinceCreation = Math.floor((now - createdDate) / (1000 * 60 * 60 * 24))
    return daysSinceCreation >= 30
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'Not specified'
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusColor = (status) => {
    const colors = {
      'not-started': '#6c757d',
      'running': '#0d6efd',
      'completed': '#198754',
      'paused': '#ffc107',
      'failed': '#dc3545',
      'pending': '#6c757d',
      'sent': '#198754',
      'expired': '#dc3545'
    }
    return colors[status] || '#6c757d'
  }

  const stats = {
    total: recipients.length,
    sent: recipients.filter(r => r.status === 'sent').length,
    pending: recipients.filter(r => r.status === 'pending').length,
    failed: recipients.filter(r => r.status === 'failed').length
  }

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-state">Loading campaign details...</div>
      </div>
    )
  }

  if (!campaign) {
    return (
      <div className="page-container">
        <div className="empty-state">Campaign not found</div>
      </div>
    )
  }

  const isExpired = checkCampaignExpiration(campaign.created_at)
  const daysSinceCreation = Math.floor((new Date() - new Date(campaign.created_at)) / (1000 * 60 * 60 * 24))
  const daysRemaining = 30 - daysSinceCreation

  return (
    <div className="page-container">
      <div className="campaign-details-header">
        <button onClick={() => navigate('/campaigns')} className="back-btn">
          ← Back to Campaigns
        </button>
        <h2 className="page-title">{campaign.name}</h2>
      </div>

      {/* Expiration Warning */}
      {isExpired ? (
        <div className="warning-box" style={{ marginBottom: '1rem', backgroundColor: '#fee', borderColor: '#dc3545', color: '#721c24' }}>
          ⚠️ This campaign has expired and will be automatically deleted. Campaigns are kept for 30 days after creation.
        </div>
      ) : daysRemaining <= 7 && (
        <div className="info-box" style={{ marginBottom: '1rem', backgroundColor: '#fff3cd', borderColor: '#ffc107', color: '#856404' }}>
          ℹ️ This campaign will expire in {daysRemaining} {daysRemaining === 1 ? 'day' : 'days'}. Campaigns are automatically deleted 30 days after creation.
        </div>
      )}

      {/* Campaign Info */}
      <div className="details-section">
        <h3>Campaign Information</h3>
        <div className="info-grid">
          <div className="info-item">
            <label>Status</label>
            <span className={`status-badge ${campaign.status}`} style={{backgroundColor: getStatusColor(campaign.status)}}>
              {campaign.status}
            </span>
          </div>
          <div className="info-item">
            <label>Category</label>
            <span>{campaign.category || 'General'}</span>
          </div>
          <div className="info-item">
            <label>Created</label>
            <span>{formatDate(campaign.created_at)}</span>
          </div>
          <div className="info-item">
            <label>Send Date</label>
            <span>{formatDate(campaign.send_date)}</span>
          </div>
        </div>

        {campaign.description && (
          <div className="description-box">
            <label>Description</label>
            <p>{campaign.description}</p>
          </div>
        )}
      </div>

      {/* Email Template */}
      <div className="details-section">
        <h3>Email Template</h3>
        <div className="email-template-box">
          <div className="email-field">
            <label>Subject</label>
            <p>{campaign.email_subject}</p>
          </div>
          <div className="email-field">
            <label>Body</label>
            <p className="email-body">{campaign.email_body}</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="details-section">
        <h3>Campaign Statistics</h3>
        <div className="stats-row">
          <div className="stat-box">
            <div className="stat-value">{stats.total}</div>
            <div className="stat-label">Total Recipients</div>
          </div>
          <div className="stat-box success">
            <div className="stat-value">{stats.sent}</div>
            <div className="stat-label">Sent</div>
          </div>
          <div className="stat-box pending">
            <div className="stat-value">{stats.pending}</div>
            <div className="stat-label">Pending</div>
          </div>
          <div className="stat-box danger">
            <div className="stat-value">{stats.failed}</div>
            <div className="stat-label">Failed</div>
          </div>
        </div>
      </div>

      {/* Recipients List */}
      <div className="details-section">
        <h3>Recipients ({recipients.length})</h3>
        <div className="recipients-table">
          <table>
            <thead>
              <tr>
                <th>Company</th>
                <th>Email</th>
                <th>Activity</th>
                <th>Status</th>
                <th>Sent At</th>
              </tr>
            </thead>
            <tbody>
              {recipients.map((recipient) => (
                <tr key={recipient.id}>
                  <td><strong>{recipient.companies?.company_name}</strong></td>
                  <td>{recipient.companies?.email}</td>
                  <td>{recipient.companies?.activity || '-'}</td>
                  <td>
                    <span
                      className={`status-badge ${recipient.status}`}
                      style={{backgroundColor: getStatusColor(recipient.status)}}
                    >
                      {recipient.status}
                    </span>
                  </td>
                  <td>{recipient.sent_at ? formatDate(recipient.sent_at) : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Actions */}
      <div className="details-actions">
        {!isExpired && (campaign.status === 'not-started' || campaign.status === 'failed') && (
          <button
            onClick={handleSendCampaign}
            className="primary-btn"
            disabled={sendingCampaign}
          >
            {sendingCampaign ? 'Sending...' : 'Send Campaign Now'}
          </button>
        )}
        {isExpired && (
          <div className="info-box" style={{ textAlign: 'center', margin: '1rem 0' }}>
            This campaign has expired and cannot be sent. It will be automatically deleted soon.
          </div>
        )}
      </div>
    </div>
  )
}
