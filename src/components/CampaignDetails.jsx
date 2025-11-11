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
            name,
            email,
            industry,
            company_size,
            location
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
      alert(`Campaign sent! ${result.sent} emails sent, ${result.failed} failed.`)
      loadCampaignDetails()
    } catch (error) {
      console.error('Error sending campaign:', error)
      alert(`Failed to send campaign: ${error.message}`)
    } finally {
      setSendingCampaign(false)
    }
  }

  const handleDeleteCampaign = async () => {
    if (!confirm('Are you sure you want to delete this campaign?')) return

    try {
      const { error } = await supabase
        .from('campaigns')
        .delete()
        .eq('id', id)

      if (error) throw error
      alert('Campaign deleted successfully')
      navigate('/campaigns')
    } catch (error) {
      console.error('Error deleting campaign:', error)
      alert('Failed to delete campaign')
    }
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
      'sent': '#198754'
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

  return (
    <div className="page-container">
      <div className="campaign-details-header">
        <button onClick={() => navigate('/campaigns')} className="back-btn">
          ← Back to Campaigns
        </button>
        <h2 className="page-title">{campaign.name}</h2>
      </div>

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
                <th>Industry</th>
                <th>Status</th>
                <th>Sent At</th>
              </tr>
            </thead>
            <tbody>
              {recipients.map((recipient) => (
                <tr key={recipient.id}>
                  <td><strong>{recipient.companies?.name}</strong></td>
                  <td>{recipient.companies?.email}</td>
                  <td>{recipient.companies?.industry || '-'}</td>
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
        {(campaign.status === 'not-started' || campaign.status === 'failed') && (
          <button
            onClick={handleSendCampaign}
            className="primary-btn"
            disabled={sendingCampaign}
          >
            {sendingCampaign ? 'Sending...' : 'Send Campaign Now'}
          </button>
        )}
        <button onClick={handleDeleteCampaign} className="danger-btn">
          Delete Campaign
        </button>
      </div>
    </div>
  )
}
