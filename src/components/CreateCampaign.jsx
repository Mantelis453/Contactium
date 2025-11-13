import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { sendCampaign } from '../lib/campaignSender'
import SearchableSelect from './SearchableSelect'
import API_URL from '../config/api'
import '../styles/CreateCampaign.css'

export default function CreateCampaign() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [currentStep, setCurrentStep] = useState(1)
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

  const totalSteps = 5

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
    if (formData.selectedCompanies.length === 0) {
      alert('Please select at least one company first')
      return
    }

    setGeneratingEmail(true)
    setReferenceEmail(null)
    setEmailApproved(false)

    try {
      const firstCompany = companies.find(c => c.id === formData.selectedCompanies[0])

      if (!firstCompany) {
        throw new Error('Could not find reference company')
      }

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
    setLoading(true)
    try {
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
          sender_name: formData.senderName,
          sender_company: formData.senderCompany,
          sender_title: formData.senderTitle,
          value_proposition: formData.valueProposition,
          call_to_action: formData.callToAction
        })
        .select()
        .single()

      if (campaignError) throw campaignError

      const recipients = formData.selectedCompanies.map(companyId => ({
        campaign_id: campaign.id,
        company_id: companyId,
        personalized_email: null,
        status: 'pending'
      }))

      const { error: recipientsError } = await supabase
        .from('campaign_recipients')
        .insert(recipients)

      if (recipientsError) throw recipientsError

      if (!formData.sendDate) {
        try {
          const sendResult = await sendCampaign(campaign.id, user.id)
          alert(`Campaign sent immediately! ${sendResult.sent} emails sent successfully, ${sendResult.failed} failed.`)
          navigate('/')
        } catch (sendError) {
          console.error('Error sending campaign:', sendError)
          alert(`Campaign was created but failed to send: ${sendError.message}. You can try sending it manually from the Campaigns page.`)
          navigate('/')
        }
      } else {
        alert(`Campaign scheduled successfully for ${new Date(formData.sendDate).toLocaleString()}!`)
        navigate('/')
      }
    } catch (error) {
      console.error('Error creating campaign:', error)
      alert('Failed to create campaign: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const validateStep = (step) => {
    switch (step) {
      case 1:
        if (!formData.name || !formData.category || !formData.description) {
          alert('Please fill in all required fields')
          return false
        }
        return true
      case 2:
        if (!formData.senderName || !formData.senderCompany || !formData.senderTitle || !formData.valueProposition || !formData.callToAction) {
          alert('Please fill in all sender information fields')
          return false
        }
        return true
      case 3:
        if (formData.selectedCompanies.length === 0) {
          alert('Please select at least one company')
          return false
        }
        return true
      case 4:
        if (!referenceEmail) {
          alert('Please generate an email preview first')
          return false
        }
        if (!emailApproved) {
          alert('Please approve the email template before continuing')
          return false
        }
        return true
      default:
        return true
    }
  }

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, totalSteps))
    }
  }

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1))
  }

  const renderProgressBar = () => (
    <div className="progress-container">
      <div className="progress-steps">
        {[1, 2, 3, 4, 5].map((step) => (
          <div key={step} className="progress-step-wrapper">
            <div className={`progress-step ${currentStep >= step ? 'active' : ''} ${currentStep > step ? 'completed' : ''}`}>
              {currentStep > step ? '✓' : step}
            </div>
            {step < 5 && <div className={`progress-line ${currentStep > step ? 'completed' : ''}`} />}
          </div>
        ))}
      </div>
      <div className="progress-labels">
        <span className={currentStep === 1 ? 'active-label' : ''}>Details</span>
        <span className={currentStep === 2 ? 'active-label' : ''}>Your Info</span>
        <span className={currentStep === 3 ? 'active-label' : ''}>Audience</span>
        <span className={currentStep === 4 ? 'active-label' : ''}>Preview</span>
        <span className={currentStep === 5 ? 'active-label' : ''}>Review</span>
      </div>
    </div>
  )

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="step-content">
            <h3>Campaign Details</h3>
            <p className="step-description">Let's start with the basics of your campaign</p>

            <div className="form-group">
              <label>Campaign Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="e.g., Q1 2025 Tech Startups Outreach"
                className="form-input"
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
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label>Campaign Description *</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows="5"
                placeholder="Describe your campaign offering, target audience, and key value propositions..."
                className="form-textarea"
              />
              <small>This will help AI generate personalized emails</small>
            </div>

            <div className="form-group">
              <label>Send Date (Optional)</label>
              <input
                type="datetime-local"
                name="sendDate"
                value={formData.sendDate}
                onChange={handleInputChange}
                className="form-input"
              />
              <small>Leave empty to send immediately after approval</small>
            </div>
          </div>
        )

      case 2:
        return (
          <div className="step-content">
            <h3>Your Information</h3>
            <p className="step-description">Tell us about yourself to personalize the outreach</p>

            <div className="form-group">
              <label>Your Name *</label>
              <input
                type="text"
                name="senderName"
                value={formData.senderName}
                onChange={handleInputChange}
                placeholder="e.g., John Smith"
                className="form-input"
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
                className="form-input"
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
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label>Value Proposition *</label>
              <textarea
                name="valueProposition"
                value={formData.valueProposition}
                onChange={handleInputChange}
                rows="4"
                placeholder="What value do you offer? e.g., We help companies reduce operational costs by 30% through AI automation"
                className="form-textarea"
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
                className="form-input"
              />
            </div>
          </div>
        )

      case 3:
        return (
          <div className="step-content">
            <h3>Target Audience</h3>
            <p className="step-description">Select Lithuanian companies to target</p>

            <div className="filter-grid">
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
                  className="form-input"
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
                  className="form-input"
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
                  className="form-input"
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
                  className="form-input"
                />
              </div>
            </div>

            <button onClick={loadCompanies} className="primary-btn" disabled={loadingCompanies}>
              {loadingCompanies ? 'Loading...' : 'Find Companies'}
            </button>

            {companies.length > 0 && (
              <div className="companies-section">
                <div className="companies-header">
                  <h4>Found {companies.length} companies</h4>
                  <button onClick={selectAllCompanies} className="secondary-btn">
                    Select All
                  </button>
                </div>

                <div className="companies-list">
                  {companies.map((company) => (
                    <div key={company.id} className="company-item">
                      <input
                        type="checkbox"
                        id={`company-${company.id}`}
                        checked={formData.selectedCompanies.includes(company.id)}
                        onChange={() => toggleCompanySelection(company.id)}
                      />
                      <label htmlFor={`company-${company.id}`}>
                        <strong>{company.company_name}</strong>
                        {company.email && <span className="company-email"> • {company.email}</span>}
                        {company.activity && <div className="company-meta">{company.activity}</div>}
                        {company.employees && <span className="company-meta">{company.employees} employees</span>}
                      </label>
                    </div>
                  ))}
                </div>

                <div className="selection-summary">
                  Selected: <strong>{formData.selectedCompanies.length}</strong> companies
                </div>
              </div>
            )}
          </div>
        )

      case 4:
        return (
          <div className="step-content">
            <h3>Email Preview</h3>
            <p className="step-description">Generate and review a sample email before sending</p>

            <div className="preview-info">
              <p>Generate a reference email using one of your selected companies. Unique personalized emails will be created for each recipient when you send the campaign.</p>
            </div>

            <button
              onClick={generateReferenceEmail}
              className="primary-btn"
              disabled={generatingEmail}
            >
              {generatingEmail ? 'Generating...' : referenceEmail ? 'Regenerate Preview' : 'Generate Email Preview'}
            </button>

            {referenceEmail && (
              <div className="email-preview-card">
                <div className="preview-badge">
                  Sample for: <strong>{referenceEmail.companyName}</strong>
                </div>

                <div className="email-content">
                  <div className="email-subject">
                    <label>Subject:</label>
                    <div>{referenceEmail.subject}</div>
                  </div>

                  <div className="email-body">
                    <label>Body:</label>
                    <div className="email-text">{referenceEmail.body}</div>
                  </div>
                </div>

                <div className="preview-note">
                  Each of the {formData.selectedCompanies.length} selected companies will receive a unique, personalized version.
                </div>

                {!emailApproved && (
                  <button
                    onClick={() => setEmailApproved(true)}
                    className="approve-btn"
                  >
                    Approve Template ✓
                  </button>
                )}

                {emailApproved && (
                  <div className="approved-badge">
                    ✓ Template Approved
                  </div>
                )}
              </div>
            )}
          </div>
        )

      case 5:
        return (
          <div className="step-content">
            <h3>Review & Send</h3>
            <p className="step-description">Review your campaign before sending</p>

            <div className="review-card">
              <div className="review-section">
                <h4>Campaign Details</h4>
                <div className="review-item">
                  <span>Name:</span>
                  <strong>{formData.name}</strong>
                </div>
                <div className="review-item">
                  <span>Category:</span>
                  <strong>{formData.category}</strong>
                </div>
                <div className="review-item">
                  <span>Send Date:</span>
                  <strong>{formData.sendDate ? new Date(formData.sendDate).toLocaleString() : 'Immediately'}</strong>
                </div>
              </div>

              <div className="review-section">
                <h4>Sender Information</h4>
                <div className="review-item">
                  <span>From:</span>
                  <strong>{formData.senderName}, {formData.senderTitle}</strong>
                </div>
                <div className="review-item">
                  <span>Company:</span>
                  <strong>{formData.senderCompany}</strong>
                </div>
              </div>

              <div className="review-section">
                <h4>Recipients</h4>
                <div className="review-item">
                  <span>Total Companies:</span>
                  <strong>{formData.selectedCompanies.length}</strong>
                </div>
              </div>

              <div className="review-section">
                <h4>Email Template</h4>
                <div className="review-item">
                  <span>Subject:</span>
                  <strong>{referenceEmail?.subject}</strong>
                </div>
                <div className="email-snippet">
                  {referenceEmail?.body.substring(0, 150)}...
                </div>
              </div>
            </div>

            <div className="final-note">
              {formData.sendDate ?
                `This campaign will be sent on ${new Date(formData.sendDate).toLocaleString()}` :
                'This campaign will be sent immediately after you click "Send Campaign"'
              }
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="page-container">
      <div className="wizard-header">
        <h2 className="page-title">Create New Campaign</h2>
        <div className="step-indicator">Step {currentStep} of {totalSteps}</div>
      </div>

      {renderProgressBar()}

      <div className="wizard-content">
        {renderStep()}
      </div>

      <div className="wizard-navigation">
        <button
          onClick={() => navigate('/')}
          className="cancel-btn"
        >
          Cancel
        </button>

        <div className="nav-buttons">
          {currentStep > 1 && (
            <button
              onClick={prevStep}
              className="secondary-btn"
            >
              ← Previous
            </button>
          )}

          {currentStep < totalSteps && (
            <button
              onClick={nextStep}
              className="primary-btn"
            >
              Next →
            </button>
          )}

          {currentStep === totalSteps && (
            <button
              onClick={saveCampaign}
              className="primary-btn send-btn"
              disabled={loading}
            >
              {loading ? 'Sending...' : formData.sendDate ? 'Schedule Campaign' : 'Send Campaign'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
