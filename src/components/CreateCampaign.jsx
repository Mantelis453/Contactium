import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { generateBatchEmails } from '../lib/batchEmailGenerator'
import { sendCampaign } from '../lib/campaignSender'
import SearchableSelect from './SearchableSelect'
import API_URL from '../config/api'
import '../styles/CreateCampaign.css'

export default function CreateCampaign() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [companies, setCompanies] = useState([])
  const [loadingCompanies, setLoadingCompanies] = useState(false)
  const [generatingEmail, setGeneratingEmail] = useState(false)
  const [activities, setActivities] = useState([])

  const [formData, setFormData] = useState({
    name: '',
    category: '',
    description: '',
    sendDate: '',
    selectedCompanies: [],
    // Personalization fields
    senderName: '',
    senderCompany: '',
    senderTitle: '',
    valueProposition: '',
    callToAction: ''
  })

  const [referenceEmail, setReferenceEmail] = useState(null)

  const [filters, setFilters] = useState({
    minEmployees: '',
    maxEmployees: '',
    activity: '',
    minRating: '',
    maxRating: ''
  })

  const [emailApproved, setEmailApproved] = useState(false)

  useEffect(() => {
    loadActivities()
  }, [])

  const loadActivities = async () => {
    try {
      const response = await fetch(`${API_URL}/companies-activities`)
      const data = await response.json()
      if (response.ok) {
        setActivities(data.activities || [])
      }
    } catch (error) {
      console.error('Error loading activities:', error)
    }
  }

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleFilterChange = (e) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value
    })
  }

  const loadCompanies = async () => {
    setLoadingCompanies(true)
    try {
      let query = supabase.from('companies').select('*')

      if (filters.activity) {
        query = query.eq('activity', filters.activity)
      }
      if (filters.minEmployees) {
        query = query.gte('employees', parseInt(filters.minEmployees))
      }
      if (filters.maxEmployees) {
        query = query.lte('employees', parseInt(filters.maxEmployees))
      }
      if (filters.minRating) {
        query = query.gte('scorist_rating', parseFloat(filters.minRating))
      }
      if (filters.maxRating) {
        query = query.lte('scorist_rating', parseFloat(filters.maxRating))
      }

      const { data, error } = await query

      if (error) throw error
      setCompanies(data || [])
    } catch (error) {
      console.error('Error loading companies:', error)
      alert('Failed to load companies. Make sure you have added companies to your database.')
    } finally {
      setLoadingCompanies(false)
    }
  }

  const toggleCompanySelection = (companyId) => {
    setFormData(prev => ({
      ...prev,
      selectedCompanies: prev.selectedCompanies.includes(companyId)
        ? prev.selectedCompanies.filter(id => id !== companyId)
        : [...prev.selectedCompanies, companyId]
    }))
  }

  const selectAllCompanies = () => {
    setFormData(prev => ({
      ...prev,
      selectedCompanies: companies.map(c => c.id)
    }))
  }

  const generateReferenceEmail = async () => {
    // Validation
    if (!formData.description) {
      alert('Please provide a campaign description')
      return
    }
    if (!formData.senderName || !formData.senderCompany || !formData.senderTitle) {
      alert('Please fill in all sender information fields')
      return
    }
    if (!formData.valueProposition) {
      alert('Please provide a value proposition')
      return
    }
    if (!formData.callToAction) {
      alert('Please provide a call to action')
      return
    }
    if (formData.selectedCompanies.length === 0) {
      alert('Please select at least one company first')
      return
    }

    setGeneratingEmail(true)
    setReferenceEmail(null)
    setEmailApproved(false)

    try {
      // Get first selected company as reference
      const firstCompany = companies.find(c => c.id === formData.selectedCompanies[0])

      if (!firstCompany) {
        throw new Error('Could not find reference company')
      }

      // Generate one reference email using first company
      const { generatePersonalizedEmail } = await import('../lib/aiService')

      const email = await generatePersonalizedEmail({
        description: formData.description,
        category: formData.category,
        company: firstCompany,
        senderName: formData.senderName,
        senderCompany: formData.senderCompany,
        senderTitle: formData.senderTitle,
        valueProposition: formData.valueProposition,
        callToAction: formData.callToAction
      })

      setReferenceEmail({
        ...email,
        companyName: firstCompany.company_name
      })
    } catch (error) {
      console.error('Error generating reference email:', error)
      alert(error.message || 'Failed to generate email. Check your settings and API key.')
    } finally {
      setGeneratingEmail(false)
    }
  }

  const saveCampaign = async () => {
    if (!formData.name || !formData.category || !formData.description) {
      alert('Please fill in all required fields')
      return
    }

    if (!referenceEmail) {
      alert('Please generate a reference email first')
      return
    }

    if (!emailApproved) {
      alert('Please approve the email template before saving')
      return
    }

    setLoading(true)
    try {
      // Create campaign with reference email and personalization fields
      const { data: campaign, error: campaignError } = await supabase
        .from('campaigns')
        .insert({
          user_id: user.id,
          name: formData.name,
          category: formData.category,
          description: formData.description,
          email_subject: referenceEmail.subject,
          email_body: referenceEmail.body,
          send_date: formData.sendDate || null,
          status: 'not-started',
          // Personalization fields (will be used to generate emails when sending)
          sender_name: formData.senderName,
          sender_company: formData.senderCompany,
          sender_title: formData.senderTitle,
          value_proposition: formData.valueProposition,
          call_to_action: formData.callToAction
        })
        .select()
        .single()

      if (campaignError) throw campaignError

      // Create campaign recipients (emails will be generated when sending)
      const recipients = formData.selectedCompanies.map(companyId => ({
        campaign_id: campaign.id,
        company_id: companyId,
        personalized_email: null, // Will be generated when campaign is sent
        status: 'pending'
      }))

      const { error: recipientsError } = await supabase
        .from('campaign_recipients')
        .insert(recipients)

      if (recipientsError) throw recipientsError

      // If no send date is provided, send immediately
      if (!formData.sendDate) {
        try {
          console.log('No send date specified, sending campaign immediately...')
          const sendResult = await sendCampaign(campaign.id, user.id)
          alert(`Campaign sent immediately! ${sendResult.sent} emails sent successfully, ${sendResult.failed} failed.`)
          navigate('/')
        } catch (sendError) {
          console.error('Error sending campaign:', sendError)
          alert(`Campaign was created but failed to send: ${sendError.message}. You can try sending it manually from the Campaigns page.`)
          navigate('/')
        }
      } else {
        // Campaign is scheduled for future
        alert(`Campaign scheduled successfully for ${new Date(formData.sendDate).toLocaleString()}! Personalized emails will be generated when the campaign is sent.`)
        navigate('/')
      }
    } catch (error) {
      console.error('Error creating campaign:', error)
      alert('Failed to create campaign: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page-container">
      <h2 className="page-title">Create New Campaign</h2>

      <div className="create-form">
        {/* Campaign Details */}
        <div className="form-section">
          <h3>Campaign Details</h3>
          <div className="form-group">
            <label>Campaign Name *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="e.g., Q1 2025 Tech Startups Outreach"
            />
          </div>

          <div className="form-group">
            <label>Category *</label>
            <input
              type="text"
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              placeholder="e.g., Technology, Healthcare, Finance"
            />
          </div>

          <div className="form-group">
            <label>Send Date (Optional)</label>
            <input
              type="datetime-local"
              name="sendDate"
              value={formData.sendDate}
              onChange={handleInputChange}
            />
          </div>

          <div className="form-group">
            <label>Campaign Description *</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows="4"
              placeholder="Describe your campaign offering, target audience, and key value propositions..."
            />
          </div>
        </div>

        {/* Target Audience */}
        <div className="form-section">
          <h3>Target Audience (Lithuanian Companies)</h3>
          <div className="filter-controls">
            <div className="form-group">
              <label>Activity</label>
              <SearchableSelect
                options={activities}
                value={filters.activity}
                onChange={(value) => setFilters({ ...filters, activity: value })}
                placeholder="Search activities..."
              />
            </div>

            <div className="form-group">
              <label>Min Employees</label>
              <input
                type="number"
                name="minEmployees"
                value={filters.minEmployees}
                onChange={handleFilterChange}
                placeholder="e.g., 10"
              />
            </div>

            <div className="form-group">
              <label>Max Employees</label>
              <input
                type="number"
                name="maxEmployees"
                value={filters.maxEmployees}
                onChange={handleFilterChange}
                placeholder="e.g., 200"
              />
            </div>

            <div className="form-group">
              <label>Min Rating</label>
              <input
                type="number"
                name="minRating"
                value={filters.minRating}
                onChange={handleFilterChange}
                placeholder="e.g., 5.0"
                step="0.1"
              />
            </div>

            <div className="form-group">
              <label>Max Rating</label>
              <input
                type="number"
                name="maxRating"
                value={filters.maxRating}
                onChange={handleFilterChange}
                placeholder="e.g., 10.0"
                step="0.1"
              />
            </div>

            <button onClick={loadCompanies} className="primary-btn" disabled={loadingCompanies}>
              {loadingCompanies ? 'Loading...' : 'Load Companies'}
            </button>
          </div>

          {companies.length > 0 && (
            <div className="companies-list">
              <p><strong>Found {companies.length} companies</strong></p>
              <div className="companies-preview">
                {companies.slice(0, 10).map((company) => (
                  <div key={company.id} className="company-item">
                    <input
                      type="checkbox"
                      id={`company-${company.id}`}
                      checked={formData.selectedCompanies.includes(company.id)}
                      onChange={() => toggleCompanySelection(company.id)}
                    />
                    <label htmlFor={`company-${company.id}`}>
                      {company.company_name} - {company.email || 'No email'}
                      {company.activity && <span className="company-industry"> ({company.activity})</span>}
                      {company.employees && <span> - {company.employees} employees</span>}
                    </label>
                  </div>
                ))}
                {companies.length > 10 && (
                  <p className="more-companies">... and {companies.length - 10} more</p>
                )}
              </div>
              <button onClick={selectAllCompanies} className="secondary-btn">
                Select All ({companies.length})
              </button>
              <p className="selected-count">
                Selected: {formData.selectedCompanies.length} companies
              </p>
            </div>
          )}
        </div>

        {/* Personalization Fields */}
        <div className="form-section">
          <h3>Personalization Fields</h3>
          <p className="help-text">These fields will be used to personalize emails for each company</p>

          <div className="form-group">
            <label>Your Name *</label>
            <input
              type="text"
              name="senderName"
              value={formData.senderName}
              onChange={handleInputChange}
              placeholder="e.g., John Smith"
            />
          </div>

          <div className="form-group">
            <label>Your Company *</label>
            <input
              type="text"
              name="senderCompany"
              value={formData.senderCompany}
              onChange={handleInputChange}
              placeholder="e.g., Acme Solutions"
            />
          </div>

          <div className="form-group">
            <label>Your Title *</label>
            <input
              type="text"
              name="senderTitle"
              value={formData.senderTitle}
              onChange={handleInputChange}
              placeholder="e.g., Business Development Manager"
            />
          </div>

          <div className="form-group">
            <label>Value Proposition *</label>
            <textarea
              name="valueProposition"
              value={formData.valueProposition}
              onChange={handleInputChange}
              rows="3"
              placeholder="What value do you offer? e.g., We help companies reduce operational costs by 30% through AI automation"
            />
          </div>

          <div className="form-group">
            <label>Call to Action *</label>
            <input
              type="text"
              name="callToAction"
              value={formData.callToAction}
              onChange={handleInputChange}
              placeholder="e.g., Schedule a 15-minute demo call"
            />
          </div>
        </div>

        {/* AI Email Generation */}
        <div className="form-section">
          <h3>Generate Reference Email</h3>
          <p className="help-text">
            Generate one sample email to preview the AI template. Unique emails for each company will be created automatically when you send the campaign.
          </p>

          <button
            onClick={generateReferenceEmail}
            className="primary-btn"
            disabled={generatingEmail || formData.selectedCompanies.length === 0}
          >
            {generatingEmail ? 'Generating...' : 'Generate Email Preview'}
          </button>

          {referenceEmail && (
            <div className="email-preview">
              <div className="preview-header">
                <h4>Reference Email Preview</h4>
                <p className="help-text">
                  Sample generated using: <strong>{referenceEmail.companyName}</strong>
                </p>
                <p className="help-text">
                  Each of the {formData.selectedCompanies.length} selected companies will receive a personalized version when you send the campaign.
                </p>
              </div>

              <div className="email-sample">
                <div className="email-header">
                  <strong>Subject:</strong> {referenceEmail.subject}
                </div>
                <div className="email-body">{referenceEmail.body}</div>
              </div>

              <div className="email-actions">
                <button onClick={generateReferenceEmail} className="secondary-btn" disabled={generatingEmail}>
                  Regenerate Preview
                </button>
                <button
                  onClick={() => setEmailApproved(true)}
                  className="primary-btn"
                  disabled={emailApproved}
                >
                  {emailApproved ? 'Template Approved ✓' : 'Approve Template'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Form Actions */}
        <div className="form-actions">
          <button onClick={() => navigate('/')} className="secondary-btn">
            Cancel
          </button>
          <button
            onClick={saveCampaign}
            className="primary-btn"
            disabled={loading || !emailApproved || !referenceEmail}
          >
            {loading ? 'Saving...' : 'Save Campaign'}
          </button>
        </div>
      </div>
    </div>
  )
}
