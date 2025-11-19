import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { testSmtpConnection } from '../lib/emailApi'
import Subscription from './Subscription'
import '../styles/Settings.css'

export default function Settings() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [testingConnection, setTestingConnection] = useState(false)
  const [connectionTestResult, setConnectionTestResult] = useState(null)
  const [settings, setSettings] = useState({
    sender_name: '',
    sender_email: '',
    daily_limit: 100,
    ai_provider: 'openai',
    openai_api_key: '',
    gemini_api_key: '',
    email_language: 'English',
    email_tone: 'professional',
    email_length: 'medium',
    personalization_level: 'high',
    smtp_host: '',
    smtp_port: '587',
    smtp_user: '',
    smtp_pass: '',
    smtp_from_email: '',
    smtp_from_name: ''
  })

  useEffect(() => {
    if (user?.id) {
      loadSettings()
    }
  }, [user])

  const loadSettings = async () => {
    if (!user?.id) {
      console.log('User not loaded yet')
      return
    }

    try {
      console.log('Loading settings for user:', user.id)

      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()

      if (error && error.code !== 'PGRST116') {
        throw error
      }

      if (data) {
        setSettings({
          sender_name: data.sender_name ?? '',
          sender_email: data.sender_email ?? '',
          daily_limit: data.daily_limit ?? 100,
          ai_provider: data.ai_provider ?? 'openai',
          openai_api_key: data.openai_api_key ?? '',
          gemini_api_key: data.gemini_api_key ?? '',
          email_language: data.email_language ?? 'English',
          email_tone: data.email_tone ?? 'professional',
          email_length: data.email_length ?? 'medium',
          personalization_level: data.personalization_level ?? 'high',
          smtp_host: data.smtp_host ?? '',
          smtp_port: data.smtp_port ?? '587',
          smtp_user: data.smtp_user ?? '',
          smtp_pass: data.smtp_pass ?? '',
          smtp_from_email: data.smtp_from_email ?? '',
          smtp_from_name: data.smtp_from_name ?? ''
        })
      }
    } catch (error) {
      console.error('Error loading settings:', error)
    }
  }

  const handleChange = (e) => {
    setSettings({
      ...settings,
      [e.target.name]: e.target.value
    })
    setSaveSuccess(false)
    setConnectionTestResult(null)
  }

  const handleTestConnection = async () => {
    setTestingConnection(true)
    setConnectionTestResult(null)

    try {
      console.log('Testing connection for user:', user.id)
      console.log('Current settings:', {
        ...settings,
        smtp_pass: settings.smtp_pass ? '***' : null
      })

      const result = await testSmtpConnection(user.id)
      setConnectionTestResult(result)
    } catch (error) {
      console.error('Error testing connection:', error)
      setConnectionTestResult({
        success: false,
        message: error.message || 'Failed to test connection. Make sure you saved your settings first.'
      })
    } finally {
      setTestingConnection(false)
    }
  }

  const saveSettings = async () => {
    setLoading(true)
    setSaveSuccess(false)

    try {
      console.log('Saving settings for user:', user.id)

      const { data: existing, error: checkError } = await supabase
        .from('user_settings')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle()

      console.log('Existing settings:', existing)

      if (checkError) {
        console.error('Error checking existing settings:', checkError)
        throw checkError
      }

      if (existing) {
        // Update existing settings
        console.log('Updating existing settings')
        const { error } = await supabase
          .from('user_settings')
          .update({
            sender_name: settings.sender_name,
            sender_email: settings.sender_email,
            daily_limit: parseInt(settings.daily_limit),
            ai_provider: settings.ai_provider,
            openai_api_key: settings.openai_api_key,
            gemini_api_key: settings.gemini_api_key,
            email_language: settings.email_language,
            email_tone: settings.email_tone,
            email_length: settings.email_length,
            personalization_level: settings.personalization_level,
            smtp_host: settings.smtp_host,
            smtp_port: settings.smtp_port,
            smtp_user: settings.smtp_user,
            smtp_pass: settings.smtp_pass,
            smtp_from_email: settings.smtp_from_email,
            smtp_from_name: settings.smtp_from_name,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.id)

        if (error) {
          console.error('Update error:', error)
          throw error
        }
        console.log('Settings updated successfully')
      } else {
        // Insert new settings
        console.log('Inserting new settings')
        const { data: insertedData, error } = await supabase
          .from('user_settings')
          .insert({
            user_id: user.id,
            sender_name: settings.sender_name,
            sender_email: settings.sender_email,
            daily_limit: parseInt(settings.daily_limit),
            ai_provider: settings.ai_provider,
            openai_api_key: settings.openai_api_key,
            gemini_api_key: settings.gemini_api_key,
            email_language: settings.email_language,
            email_tone: settings.email_tone,
            email_length: settings.email_length,
            personalization_level: settings.personalization_level,
            smtp_host: settings.smtp_host,
            smtp_port: settings.smtp_port,
            smtp_user: settings.smtp_user,
            smtp_pass: settings.smtp_pass,
            smtp_from_email: settings.smtp_from_email,
            smtp_from_name: settings.smtp_from_name
          })

        if (error) {
          console.error('Insert error:', error)
          throw error
        }
        console.log('Settings inserted successfully:', insertedData)
      }

      console.log('Settings saved successfully')
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (error) {
      console.error('Error saving settings:', error)
      alert('Failed to save settings: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page-container">
      <h2 className="page-title">Settings</h2>
      <p className="settings-intro">Configure your email campaigns and AI settings. All changes are saved automatically when you click Save Settings.</p>

      <div className="settings-container">
        {/* Account Section */}
        <div className="settings-section">
          <div className="section-header">
            <h3>👤 Account</h3>
            <p className="section-description">Your account information</p>
          </div>
          <div className="form-group">
            <label>Email Address</label>
            <input type="email" value={user?.email} disabled />
            <p className="help-text">This is your login email</p>
          </div>
        </div>

        {/* Subscription & Billing */}
        <Subscription />

        {/* Sender Information */}
        <div className="settings-section highlighted">
          <div className="section-header">
            <h3>📧 Sender Information</h3>
            <p className="section-description">This information appears in your outgoing emails</p>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Your Name <span className="required">*</span></label>
              <input
                type="text"
                name="sender_name"
                value={settings.sender_name}
                onChange={handleChange}
                placeholder="John Smith"
              />
              <p className="help-text">How you'll sign your emails</p>
            </div>
            <div className="form-group">
              <label>Your Email <span className="required">*</span></label>
              <input
                type="email"
                name="sender_email"
                value={settings.sender_email}
                onChange={handleChange}
                placeholder="john@company.com"
              />
              <p className="help-text">Must match SMTP username below</p>
            </div>
          </div>
          <div className="form-group">
            <label>Daily Email Limit</label>
            <input
              type="number"
              name="daily_limit"
              value={settings.daily_limit}
              onChange={handleChange}
              min="1"
              max="1000"
            />
            <p className="help-text">💡 Recommended: 50-100 emails per day to avoid spam filters</p>
          </div>
        </div>

        {/* SMTP Configuration */}
        <div className="settings-section">
          <div className="section-header">
            <h3>🔧 Email Server (SMTP)</h3>
            <p className="section-description">Connect your email provider to send campaigns</p>
          </div>

          <div className="info-box">
            <strong>📌 Common Providers:</strong>
            <ul style={{marginTop: '0.5rem', marginBottom: 0}}>
              <li><strong>Gmail:</strong> smtp.gmail.com (Port: 587)</li>
              <li><strong>Outlook:</strong> smtp.office365.com (Port: 587)</li>
              <li><strong>SendGrid:</strong> smtp.sendgrid.net (Port: 587)</li>
            </ul>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>SMTP Host <span className="required">*</span></label>
              <input
                type="text"
                name="smtp_host"
                value={settings.smtp_host}
                onChange={handleChange}
                placeholder="smtp.gmail.com"
              />
            </div>
            <div className="form-group">
              <label>Port <span className="required">*</span></label>
              <select
                name="smtp_port"
                value={settings.smtp_port}
                onChange={handleChange}
              >
                <option value="587">587 (TLS) - Recommended</option>
                <option value="465">465 (SSL)</option>
                <option value="25">25 (Not recommended)</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Username <span className="required">*</span></label>
            <input
              type="text"
              name="smtp_user"
              value={settings.smtp_user}
              onChange={handleChange}
              placeholder="your-email@example.com"
            />
            <p className="help-text">Usually your full email address</p>
          </div>

          <div className="form-group">
            <label>Password <span className="required">*</span></label>
            <input
              type="password"
              name="smtp_pass"
              value={settings.smtp_pass}
              onChange={handleChange}
              placeholder="Your SMTP password"
            />
            <p className="help-text">
              🔐 For Gmail, create an <a href="https://support.google.com/accounts/answer/185833" target="_blank" rel="noopener noreferrer">App Password</a> instead of using your regular password
            </p>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>From Email</label>
              <input
                type="email"
                name="smtp_from_email"
                value={settings.smtp_from_email}
                onChange={handleChange}
                placeholder="Leave blank to use username"
              />
              <p className="help-text">Optional: Custom "From" email address</p>
            </div>
            <div className="form-group">
              <label>From Name</label>
              <input
                type="text"
                name="smtp_from_name"
                value={settings.smtp_from_name}
                onChange={handleChange}
                placeholder="Leave blank to use sender name"
              />
              <p className="help-text">Optional: Display name for sender</p>
            </div>
          </div>

          <div className="form-group">
            <div className="warning-box">
              ⚠️ Save your settings first, then test the connection
            </div>
            <button
              onClick={handleTestConnection}
              className="secondary-btn"
              disabled={testingConnection || !settings.smtp_host}
            >
              {testingConnection ? '🔄 Testing Connection...' : '🧪 Test SMTP Connection'}
            </button>
            {connectionTestResult && (
              <div className={connectionTestResult.success ? 'success-box' : 'error-box'} style={{marginTop: '0.5rem'}}>
                {connectionTestResult.success ? '✅ ' : '❌ '}
                {connectionTestResult.message}
              </div>
            )}
          </div>
        </div>

        {/* AI Configuration */}
        <div className="settings-section highlighted">
          <div className="section-header">
            <h3>🤖 AI Provider</h3>
            <p className="section-description">Choose which AI will write your emails</p>
          </div>

          <div className="form-group">
            <label>Select AI Provider <span className="required">*</span></label>
            <div className="radio-group">
              <label className="radio-option">
                <input
                  type="radio"
                  name="ai_provider"
                  value="openai"
                  checked={settings.ai_provider === 'openai'}
                  onChange={handleChange}
                />
                <div className="radio-content">
                  <strong>OpenAI GPT-4</strong>
                  <span className="radio-description">Best for English emails, highly creative</span>
                </div>
              </label>
              <label className="radio-option">
                <input
                  type="radio"
                  name="ai_provider"
                  value="gemini"
                  checked={settings.ai_provider === 'gemini'}
                  onChange={handleChange}
                />
                <div className="radio-content">
                  <strong>Google Gemini 2.5 Flash</strong>
                  <span className="radio-description">Fast, supports 60+ languages</span>
                </div>
              </label>
            </div>
          </div>

          {settings.ai_provider === 'openai' ? (
            <div className="form-group">
              <label>OpenAI API Key <span className="required">*</span></label>
              <input
                type="password"
                name="openai_api_key"
                value={settings.openai_api_key}
                onChange={handleChange}
                placeholder="sk-proj-..."
              />
              <p className="help-text">
                🔑 Get your key from <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer">OpenAI Platform</a>
              </p>
            </div>
          ) : (
            <div className="form-group">
              <label>Google Gemini API Key <span className="required">*</span></label>
              <input
                type="password"
                name="gemini_api_key"
                value={settings.gemini_api_key}
                onChange={handleChange}
                placeholder="AIza..."
              />
              <p className="help-text">
                🔑 Get your key from <a href="https://makersuite.google.com/app/apikey" target="_blank" rel="noopener noreferrer">Google AI Studio</a> (Free tier available)
              </p>
            </div>
          )}
        </div>

        {/* Email Generation Settings */}
        <div className="settings-section">
          <div className="section-header">
            <h3>✨ Email Style</h3>
            <p className="section-description">Control how AI writes your emails</p>
          </div>

          <div className="info-box">
            These settings apply to all campaigns. You can adjust them anytime to match your outreach style.
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Language 🌍</label>
              <select
                name="email_language"
                value={settings.email_language}
                onChange={handleChange}
              >
              <optgroup label="Most Popular">
                <option value="English">English</option>
                <option value="Spanish">Spanish (Español)</option>
                <option value="French">French (Français)</option>
                <option value="German">German (Deutsch)</option>
                <option value="Portuguese">Portuguese (Português)</option>
                <option value="Chinese (Simplified)">Chinese - Simplified (简体中文)</option>
                <option value="Japanese">Japanese (日本語)</option>
              </optgroup>
              <optgroup label="European Languages">
                <option value="Italian">Italian (Italiano)</option>
                <option value="Dutch">Dutch (Nederlands)</option>
                <option value="Polish">Polish (Polski)</option>
                <option value="Russian">Russian (Русский)</option>
                <option value="Swedish">Swedish (Svenska)</option>
                <option value="Norwegian">Norwegian (Norsk)</option>
                <option value="Danish">Danish (Dansk)</option>
                <option value="Finnish">Finnish (Suomi)</option>
                <option value="Greek">Greek (Ελληνικά)</option>
                <option value="Czech">Czech (Čeština)</option>
                <option value="Hungarian">Hungarian (Magyar)</option>
                <option value="Romanian">Romanian (Română)</option>
                <option value="Ukrainian">Ukrainian (Українська)</option>
                <option value="Bulgarian">Bulgarian (Български)</option>
                <option value="Croatian">Croatian (Hrvatski)</option>
                <option value="Serbian">Serbian (Српски)</option>
                <option value="Slovak">Slovak (Slovenčina)</option>
                <option value="Slovenian">Slovenian (Slovenščina)</option>
                <option value="Lithuanian">Lithuanian (Lietuvių)</option>
                <option value="Latvian">Latvian (Latviešu)</option>
                <option value="Estonian">Estonian (Eesti)</option>
                <option value="Icelandic">Icelandic (Íslenska)</option>
              </optgroup>
              <optgroup label="Asian Languages">
                <option value="Chinese (Traditional)">Chinese - Traditional (繁體中文)</option>
                <option value="Korean">Korean (한국어)</option>
                <option value="Hindi">Hindi (हिन्दी)</option>
                <option value="Bengali">Bengali (বাংলা)</option>
                <option value="Vietnamese">Vietnamese (Tiếng Việt)</option>
                <option value="Thai">Thai (ไทย)</option>
                <option value="Indonesian">Indonesian (Bahasa Indonesia)</option>
                <option value="Malay">Malay (Bahasa Melayu)</option>
                <option value="Filipino">Filipino (Tagalog)</option>
                <option value="Urdu">Urdu (اردو)</option>
                <option value="Tamil">Tamil (தமிழ்)</option>
                <option value="Telugu">Telugu (తెలుగు)</option>
                <option value="Marathi">Marathi (मराठी)</option>
                <option value="Gujarati">Gujarati (ગુજરાતી)</option>
                <option value="Kannada">Kannada (ಕನ್ನಡ)</option>
              </optgroup>
              <optgroup label="Middle Eastern Languages">
                <option value="Arabic">Arabic (العربية)</option>
                <option value="Hebrew">Hebrew (עברית)</option>
                <option value="Turkish">Turkish (Türkçe)</option>
                <option value="Persian">Persian (فارسی)</option>
              </optgroup>
              <optgroup label="African Languages">
                <option value="Swahili">Swahili (Kiswahili)</option>
                <option value="Amharic">Amharic (አማርኛ)</option>
                <option value="Zulu">Zulu (isiZulu)</option>
                <option value="Afrikaans">Afrikaans</option>
              </optgroup>
              <optgroup label="Other Languages">
                <option value="Catalan">Catalan (Català)</option>
                <option value="Basque">Basque (Euskara)</option>
                <option value="Galician">Galician (Galego)</option>
                <option value="Welsh">Welsh (Cymraeg)</option>
                <option value="Irish">Irish (Gaeilge)</option>
                <option value="Maltese">Maltese (Malti)</option>
              </optgroup>
              </select>
              <p className="help-text">60+ languages supported</p>
            </div>

            <div className="form-group">
              <label>Tone 💬</label>
              <select
                name="email_tone"
                value={settings.email_tone}
                onChange={handleChange}
              >
                <option value="casual">😊 Casual - Friendly & conversational</option>
                <option value="professional">💼 Professional - Balanced (Recommended)</option>
                <option value="formal">🎩 Formal - Traditional & polished</option>
              </select>
              <p className="help-text">How the email sounds</p>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Length 📏</label>
              <select
                name="email_length"
                value={settings.email_length}
                onChange={handleChange}
              >
                <option value="short">📧 Short (100-150 words)</option>
                <option value="medium">📄 Medium (150-200 words) - Recommended</option>
                <option value="long">📜 Long (200-250 words)</option>
              </select>
              <p className="help-text">Shorter = higher response rates</p>
            </div>

            <div className="form-group">
              <label>Personalization 🎯</label>
              <select
                name="personalization_level"
                value={settings.personalization_level}
                onChange={handleChange}
              >
                <option value="low">Basic - General message</option>
                <option value="medium">Medium - Industry context</option>
                <option value="high">High - Company-specific (Recommended)</option>
              </select>
              <p className="help-text">Higher = better response rates</p>
            </div>
          </div>
        </div>

        <div className="settings-actions">
          {saveSuccess && (
            <div className="success-message">Settings saved successfully!</div>
          )}
          <button onClick={saveSettings} className="primary-btn" disabled={loading}>
            {loading ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  )
}
