import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { useLanguage } from '../contexts/LanguageContext'
import '../styles/SupportButton.css'

export default function SupportButton({ variant = 'floating' }) {
  const { t } = useLanguage()
  const { user } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [priority, setPriority] = useState('normal')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!subject.trim() || !message.trim()) return

    setSending(true)
    try {
      const { error } = await supabase
        .from('support_messages')
        .insert({
          user_id: user?.id,
          user_email: user?.email,
          subject: subject.trim(),
          message: message.trim(),
          priority,
          status: 'open'
        })

      if (error) throw error

      setSent(true)
      setTimeout(() => {
        setIsOpen(false)
        setSent(false)
        setSubject('')
        setMessage('')
        setPriority('normal')
      }, 2000)
    } catch (error) {
      console.error('Error sending support message:', error)
      alert('Failed to send message. Please try again.')
    } finally {
      setSending(false)
    }
  }

  if (variant === 'inline') {
    return (
      <button
        className="support-btn-inline"
        onClick={() => setIsOpen(true)}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
        Contact Support

        {isOpen && (
          <div className="support-modal-overlay" onClick={(e) => e.stopPropagation()}>
            <div className="support-modal" onClick={(e) => e.stopPropagation()}>
              <div className="support-modal-header">
                <h3>Contact Support</h3>
                <button className="support-close-btn" onClick={() => setIsOpen(false)}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>

              {sent ? (
                <div className="support-success">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                  <h4>Message Sent!</h4>
                  <p>We'll get back to you within 24-48 hours.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="support-form">
                  <div className="support-field">
                    <label>Subject</label>
                    <input
                      type="text"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="Brief description of your issue"
                      required
                    />
                  </div>

                  <div className="support-field">
                    <label>Priority</label>
                    <select value={priority} onChange={(e) => setPriority(e.target.value)}>
                      <option value="low">Low</option>
                      <option value="normal">Normal</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>

                  <div className="support-field">
                    <label>Message</label>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Describe your issue in detail..."
                      rows={5}
                      required
                    />
                  </div>

                  <div className="support-actions">
                    <button type="button" className="secondary-btn" onClick={() => setIsOpen(false)}>{t('common.cancel')}</button>
                    <button type="submit" className="primary-btn" disabled={sending}>
                      {sending ? t('dashboard.sending') : 'Send Message'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </button>
    )
  }

  return (
    <>
      <button
        className="support-btn-floating"
        onClick={() => setIsOpen(true)}
        title="Contact Support"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      </button>

      {isOpen && (
        <div className="support-modal-overlay" onClick={() => setIsOpen(false)}>
          <div className="support-modal" onClick={(e) => e.stopPropagation()}>
            <div className="support-modal-header">
              <h3>Contact Support</h3>
              <button className="support-close-btn" onClick={() => setIsOpen(false)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {sent ? (
              <div className="support-success">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
                <h4>Message Sent!</h4>
                <p>We'll get back to you within 24-48 hours.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="support-form">
                <div className="support-field">
                  <label>Subject</label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Brief description of your issue"
                    required
                  />
                </div>

                <div className="support-field">
                  <label>Priority</label>
                  <select value={priority} onChange={(e) => setPriority(e.target.value)}>
                    <option value="low">Low</option>
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                <div className="support-field">
                  <label>Message</label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Describe your issue in detail..."
                    rows={5}
                    required
                  />
                </div>

                <div className="support-actions">
                  <button type="button" className="secondary-btn" onClick={() => setIsOpen(false)}>{t('common.cancel')}</button>
                  <button type="submit" className="primary-btn" disabled={sending}>
                    {sending ? t('dashboard.sending') : 'Send Message'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  )
}
