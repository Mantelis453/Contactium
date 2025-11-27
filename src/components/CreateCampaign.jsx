import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { sendCampaign } from '../lib/campaignSender'
import { useLanguage } from '../contexts/LanguageContext'
import '../styles/CreateCampaign.css'

export default function CreateCampaign() {
  const { t } = useLanguage()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [generatingEmail, setGeneratingEmail] = useState(false)

  // Contact Lists
  const [contactLists, setContactLists] = useState([])
  const [selectedListId, setSelectedListId] = useState('')
  const [listContacts, setListContacts] = useState([])
  const [selectedContacts, setSelectedContacts] = useState([])
  const [loadingLists, setLoadingLists] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    category: '',
    description: '',
    sendDate: '',
    senderName: '',
    senderCompany: '',
    senderTitle: '',
    valueProposition: '',
    callToAction: ''
  })

  const [referenceEmail, setReferenceEmail] = useState(null)
  const [emailApproved, setEmailApproved] = useState(false)
  const [emailMode, setEmailMode] = useState('ai') // 'ai' or 'manual'
  const [manualEmail, setManualEmail] = useState({ subject: '', body: '' })

  const totalSteps = 5

  useEffect(() => {
    if (user?.id) {
      loadContactLists()
    }
  }, [user])

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const loadContactLists = async () => {
    setLoadingLists(true)
    try {
      const { data, error } = await supabase
        .from('contact_lists')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setContactLists(data || [])
    } catch (error) {
      console.error('Error loading contact lists:', error)
      alert('Failed to load contact lists. Make sure you have run the database migration.')
    } finally {
      setLoadingLists(false)
    }
  }

  const loadListContacts = async (listId) => {
    try {
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('list_id', listId)
        .order('created_at', { ascending: false })

      if (error) throw error
      setListContacts(data || [])
    } catch (error) {
      console.error('Error loading contacts:', error)
      alert('Failed to load contacts from list')
    }
  }

  const toggleContactSelection = (contactId) => {
    setSelectedContacts(prev =>
      prev.includes(contactId)
        ? prev.filter(id => id !== contactId)
        : [...prev, contactId]
    )
  }

  const generateReferenceEmail = async () => {
    if (selectedContacts.length === 0) {
      alert('Please select at least one contact first')
      return
    }

    if (selectedContacts.length > 100) {
      alert('Maximum 100 contacts allowed per campaign. Please reduce your selection.')
      return
    }

    setGeneratingEmail(true)
    setReferenceEmail(null)
    setEmailApproved(false)

    try {
      const { generatePersonalizedEmail } = await import('../lib/aiService')

      const firstContact = listContacts.find(c => c.id === selectedContacts[0])

      if (!firstContact) {
        throw new Error('Could not find reference contact')
      }

      // Create a company-like object from contact data
      const contactAsCompany = {
        company_name: firstContact.company || firstContact.name || 'Contact',
        email: firstContact.email,
        activity: '',
        employees: null
      }

      const email = await generatePersonalizedEmail({
        description: formData.description,
        category: formData.category,
        company: contactAsCompany,
        senderName: formData.senderName,
        senderCompany: formData.senderCompany,
        senderTitle: formData.senderTitle,
        valueProposition: formData.valueProposition,
        callToAction: formData.callToAction
      })

      setReferenceEmail({
        ...email,
        companyName: firstContact.name || firstContact.email
      })
    } catch (error) {
      console.error('Error generating reference email:', error)
      alert(error.message || 'Failed to generate email. Check your settings and API key.')
    } finally {
      setGeneratingEmail(false)
    }
  }

  const saveCampaign = async () => {
    if (selectedContacts.length > 100) {
      alert('Maximum 100 contacts allowed per campaign. Please reduce your selection.')
      return
    }

    setLoading(true)
    try {
      console.log('Creating campaign...', { formData, selectedContacts: selectedContacts.length })

      const emailData = emailMode === 'manual' ? manualEmail : referenceEmail
      console.log('Email data:', emailData)

      const { data: campaign, error: campaignError } = await supabase
        .from('campaigns')
        .insert({
          user_id: user.id,
          name: formData.name,
          category: formData.category,
          description: formData.description,
          email_subject: emailData.subject,
          email_body: emailData.body,
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

      if (campaignError) {
        console.error('Campaign creation error:', campaignError)
        throw campaignError
      }

      console.log('Campaign created:', campaign)

      // Create recipients from selected contacts
      const recipients = selectedContacts.map(contactId => {
        const contact = listContacts.find(c => c.id === contactId)
        return {
          campaign_id: campaign.id,
          contact_id: contactId,
          recipient_email: contact.email,
          recipient_name: contact.name || contact.email,
          personalized_email: null,
          status: 'pending'
        }
      })

      console.log('Creating recipients:', recipients.length)

      const { error: recipientsError} = await supabase
        .from('campaign_recipients')
        .insert(recipients)

      if (recipientsError) {
        console.error('Recipients creation error:', recipientsError)
        throw recipientsError
      }

      console.log('Recipients created successfully')

      if (!formData.sendDate) {
        // Redirect to campaign details to watch live progress
        console.log('Redirecting to campaign details:', campaign.id)
        alert(`Campaign created! Redirecting to campaign details where you can start sending and watch live progress.`)
        navigate(`/campaigns/${campaign.id}`)
      } else {
        console.log('Redirecting to campaigns list')
        alert(`Campaign scheduled successfully for ${new Date(formData.sendDate).toLocaleString()}!`)
        navigate('/campaigns')
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
        if (selectedContacts.length === 0) {
          alert('Please select at least one contact from your contact list')
          return false
        }
        return true
      case 4:
        if (emailMode === 'ai') {
          if (!referenceEmail) {
            alert('Please generate an email preview first')
            return false
          }
          if (!emailApproved) {
            alert('Please approve the email template before continuing')
            return false
          }
        } else {
          if (!manualEmail.subject || !manualEmail.body) {
            alert('Please fill in both email subject and body')
            return false
          }
          if (!emailApproved) {
            alert('Please approve your email before continuing')
            return false
          }
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
            <h3>{t('createCampaign.campaignDetails')}</h3>
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
            <h3>Select Recipients</h3>
            <p className="step-description">Choose contacts from your contact lists to send this campaign to</p>

            {loadingLists ? (
              <div className="loading-state">Loading your contact lists...</div>
            ) : contactLists.length === 0 ? (
              <div className="empty-state">
                <p>You don't have any contact lists yet. Create a contact list first to use campaigns.</p>
                <button
                  onClick={() => navigate('/contact-lists')}
                  className="primary-btn"
                >
                  Create Your First Contact List
                </button>
              </div>
            ) : (
              <>
                <div className="form-group">
                  <label>Select a Contact List</label>
                  <select
                    value={selectedListId}
                    onChange={(e) => {
                      setSelectedListId(e.target.value)
                      setSelectedContacts([])
                      if (e.target.value) {
                        loadListContacts(e.target.value)
                      } else {
                        setListContacts([])
                      }
                    }}
                    className="form-input"
                  >
                    <option value="">Choose a list...</option>
                    {contactLists.map((list) => (
                      <option key={list.id} value={list.id}>
                        {list.name}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedListId && listContacts.length > 0 && (
                  <div className="companies-section">
                    <div className="companies-header">
                      <h4>Contacts in this list ({listContacts.length})</h4>
                      <button
                        onClick={() => setSelectedContacts(listContacts.map(c => c.id))}
                        className="secondary-btn"
                      >
                        Select All
                      </button>
                    </div>

                    <div className="companies-list">
                      {listContacts.map((contact) => (
                        <div key={contact.id} className="company-item">
                          <input
                            type="checkbox"
                            id={`contact-${contact.id}`}
                            checked={selectedContacts.includes(contact.id)}
                            onChange={() => toggleContactSelection(contact.id)}
                          />
                          <label htmlFor={`contact-${contact.id}`}>
                            <strong>{contact.name || contact.email}</strong>
                            {contact.name && <span className="company-email"> • {contact.email}</span>}
                            {contact.company && <div className="company-meta">{contact.company}</div>}
                            {contact.notes && <div className="company-meta">{contact.notes}</div>}
                          </label>
                        </div>
                      ))}
                    </div>

                    <div className="selection-summary">
                      Selected: <strong>{selectedContacts.length}</strong> contacts
                    </div>
                  </div>
                )}

                {selectedListId && listContacts.length === 0 && (
                  <div className="empty-state">
                    <p>This contact list is empty. Add contacts to this list first.</p>
                  </div>
                )}
              </>
            )}
          </div>
        )

      case 4:
        return (
          <div className="step-content">
            <h3>Email Content</h3>
            <p className="step-description">Choose how you want to create your email</p>

            <div className="email-mode-toggle">
              <button
                className={`mode-btn ${emailMode === 'ai' ? 'active' : ''}`}
                onClick={() => {
                  setEmailMode('ai')
                  setEmailApproved(false)
                }}
              >
                AI Generated
              </button>
              <button
                className={`mode-btn ${emailMode === 'manual' ? 'active' : ''}`}
                onClick={() => {
                  setEmailMode('manual')
                  setEmailApproved(false)
                }}
              >
                Write Manually
              </button>
            </div>

            {emailMode === 'ai' ? (
              <>
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
                      Each of the {selectedContacts.length} selected contacts will receive a unique, personalized version.
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
              </>
            ) : (
              <>
                <div className="preview-info">
                  <p>Write your email manually. This email will be sent to all {selectedContacts.length} selected contacts.</p>
                </div>

                <div className="manual-email-form">
                  <div className="form-group">
                    <label>Email Subject *</label>
                    <input
                      type="text"
                      value={manualEmail.subject}
                      onChange={(e) => setManualEmail({ ...manualEmail, subject: e.target.value })}
                      placeholder="Enter email subject..."
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label>Email Body *</label>
                    <textarea
                      value={manualEmail.body}
                      onChange={(e) => setManualEmail({ ...manualEmail, body: e.target.value })}
                      rows="12"
                      placeholder="Write your email content here..."
                      className="form-textarea"
                    />
                    <small>Tip: You can use placeholders like {'{company_name}'} for personalization</small>
                  </div>

                  {manualEmail.subject && manualEmail.body && (
                    <div className="email-preview-card">
                      <div className="preview-badge">
                        Email Preview
                      </div>

                      <div className="email-content">
                        <div className="email-subject">
                          <label>Subject:</label>
                          <div>{manualEmail.subject}</div>
                        </div>

                        <div className="email-body">
                          <label>Body:</label>
                          <div className="email-text">{manualEmail.body}</div>
                        </div>
                      </div>

                      {!emailApproved && (
                        <button
                          onClick={() => setEmailApproved(true)}
                          className="approve-btn"
                        >
                          Approve Email ✓
                        </button>
                      )}

                      {emailApproved && (
                        <div className="approved-badge">
                          ✓ Email Approved
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </>
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
                <h4>{t('createCampaign.campaignDetails')}</h4>
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
                <h4>{t('dashboard.recipients')}</h4>
                <div className="review-item">
                  <span>Source:</span>
                  <strong>Contact List</strong>
                </div>
                <div className="review-item">
                  <span>Total Recipients:</span>
                  <strong>{selectedContacts.length}</strong>
                </div>
              </div>

              <div className="review-section">
                <h4>Email Template</h4>
                <div className="review-item">
                  <span>Mode:</span>
                  <strong>{emailMode === 'ai' ? 'AI Generated' : 'Manual'}</strong>
                </div>
                <div className="review-item">
                  <span>Subject:</span>
                  <strong>{emailMode === 'manual' ? manualEmail.subject : referenceEmail?.subject}</strong>
                </div>
                <div className="email-snippet">
                  {emailMode === 'manual' ?
                    manualEmail.body.substring(0, 150) :
                    referenceEmail?.body.substring(0, 150)
                  }...
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
        <h2 className="page-title">{t('createCampaign.title')}</h2>
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
        >{t('common.cancel')}</button>

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
              {loading ? t('dashboard.sending') : formData.sendDate ? 'Schedule Campaign' : 'Send Campaign'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
