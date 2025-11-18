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
  const [refreshInterval, setRefreshInterval] = useState(null)

  useEffect(() => {
    if (user?.id && id) {
      loadCampaignDetails()
    }
  }, [user, id])

  // Poll for updates when campaign is running
  useEffect(() => {
    if (campaign?.status === 'running') {
      // Refresh every 2 seconds while campaign is running
      const interval = setInterval(() => {
        loadCampaignDetails()
      }, 2000)
      setRefreshInterval(interval)
      return () => clearInterval(interval)
    } else if (refreshInterval) {
      clearInterval(refreshInterval)
      setRefreshInterval(null)
    }
  }, [campaign?.status])

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

      // Load recipients (supports both companies and contacts)
      const { data: recipientsData, error: recipientsError } = await supabase
        .from('campaign_recipients')
        .select(`
          id,
          status,
          sent_at,
          personalized_email,
          company_id,
          contact_id,
          recipient_email,
          recipient_name
        `)
        .eq('campaign_id', id)

      if (recipientsError) throw recipientsError

      // Fetch company details for company-based recipients
      const companyIds = recipientsData.filter(r => r.company_id).map(r => r.company_id)
      let companiesMap = new Map()

      if (companyIds.length > 0) {
        const { data: companies } = await supabase
          .from('companies')
          .select('id, company_name, email, activity, employees, address')
          .in('id', companyIds)

        if (companies) {
          companies.forEach(c => companiesMap.set(c.id, c))
        }
      }

      // Enrich recipients with company data or use contact data
      const enrichedRecipients = recipientsData.map(recipient => {
        if (recipient.company_id) {
          return {
            ...recipient,
            companies: companiesMap.get(recipient.company_id) || {
              company_name: 'Unknown',
              email: recipient.recipient_email || '',
              activity: null,
              employees: null,
              address: null
            }
          }
        } else {
          // Contact-based recipient
          return {
            ...recipient,
            companies: {
              company_name: recipient.recipient_name || recipient.recipient_email,
              email: recipient.recipient_email,
              activity: null,
              employees: null,
              address: null
            }
          }
        }
      })

      setRecipients(enrichedRecipients || [])
    } catch (error) {
      console.error('Error loading campaign details:', error)
      alert('Failed to load campaign details')
    } finally {
      setLoading(false)
    }
  }

  const handleSendCampaign = async () => {
    const confirmMessage = `Are you sure you want to send "${campaign.name}" now?\n\nNote: The campaign will continue sending in the background even if you close this page or navigate away. You can return to this page anytime to check the progress.`

    if (!confirm(confirmMessage)) return

    setSendingCampaign(true)
    try {
      // Start sending in background - don't wait for completion
      sendCampaign(campaign.id, user.id)
        .then(result => {
          console.log('Campaign send completed:', result)
          // Final reload after completion
          loadCampaignDetails()
          // Only alert if still on the page
          if (document.visibilityState === 'visible') {
            alert(`Campaign sent! ${result.sent} emails sent, ${result.failed} failed.`)
          }
        })
        .catch(error => {
          console.error('Error sending campaign:', error)
          loadCampaignDetails()
          // Only alert if still on the page
          if (document.visibilityState === 'visible') {
            alert(`Failed to send campaign: ${error.message}`)
          }
        })
        .finally(() => {
          setSendingCampaign(false)
        })

      // Immediately reload to show "running" status
      await new Promise(resolve => setTimeout(resolve, 500))
      await loadCampaignDetails()
    } catch (error) {
      console.error('Error starting campaign:', error)
      alert(`Failed to start campaign: ${error.message}`)
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

      {/* Running Campaign Info */}
      {campaign.status === 'running' && (
        <div className="info-box" style={{ marginBottom: '1rem', backgroundColor: '#d1ecf1', borderColor: '#0c5460', color: '#0c5460' }}>
          🚀 Campaign is currently sending emails in the background. You can safely close this page or navigate away - the campaign will continue sending. Return to this page anytime to check the progress.
        </div>
      )}

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
        <h3>Campaign Statistics {campaign.status === 'running' && '(Updating live...)'}</h3>

        {/* Progress Bar for Running Campaigns */}
        {campaign.status === 'running' && stats.total > 0 && (
          <div style={{ marginBottom: '1rem' }}>
            <div style={{
              width: '100%',
              height: '30px',
              backgroundColor: '#e9ecef',
              borderRadius: '5px',
              overflow: 'hidden',
              position: 'relative'
            }}>
              <div style={{
                width: `${(stats.sent / stats.total) * 100}%`,
                height: '100%',
                backgroundColor: '#198754',
                transition: 'width 0.3s ease',
                float: 'left'
              }}></div>
              <div style={{
                width: `${(stats.failed / stats.total) * 100}%`,
                height: '100%',
                backgroundColor: '#dc3545',
                transition: 'width 0.3s ease',
                float: 'left'
              }}></div>
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                fontWeight: 'bold',
                fontSize: '14px',
                color: '#000',
                textShadow: '0 0 3px #fff'
              }}>
                {stats.sent + stats.failed} / {stats.total} processed
              </div>
            </div>
          </div>
        )}

        <div className="stats-row">
          <div className="stat-box">
            <div className="stat-value">{stats.total}</div>
            <div className="stat-label">Total Recipients</div>
          </div>
          <div className="stat-box success">
            <div className="stat-value">{stats.sent}</div>
            <div className="stat-label">✓ Sent</div>
          </div>
          <div className="stat-box pending">
            <div className="stat-value">{stats.pending}</div>
            <div className="stat-label">⏳ Pending</div>
          </div>
          <div className="stat-box danger">
            <div className="stat-value">{stats.failed}</div>
            <div className="stat-label">✗ Failed</div>
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
