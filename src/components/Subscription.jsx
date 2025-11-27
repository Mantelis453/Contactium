import { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useSubscription as useSubscriptionContext } from '../contexts/SubscriptionContext'
import { supabase } from '../supabase'
import API_URL from '../config/api'
import '../styles/Subscription.css'

export default function Subscription() {
  const { user } = useAuth()
  const { subscription, usage, loading: contextLoading, refreshSubscription } = useSubscriptionContext()
  const [checkingOut, setCheckingOut] = useState(false)
  const [billingInfo, setBillingInfo] = useState(null)
  const [loadingBilling, setLoadingBilling] = useState(false)
  const [couponCode, setCouponCode] = useState('')
  const [couponError, setCouponError] = useState('')

  useEffect(() => {
    // Check if user just returned from successful checkout or upgrade
    const params = new URLSearchParams(window.location.search)

    if (params.get('upgraded') === 'true') {
      console.log('[Subscription] Plan upgraded successfully')
      alert('Your subscription has been upgraded successfully! Your new plan is now active.')
      refreshSubscription()
      window.history.replaceState({}, '', window.location.pathname)
      return
    }

    if (params.get('success') === 'true') {
      console.log('[Subscription] Payment successful, starting polling for updates...')

      // Poll for subscription updates every 2 seconds for up to 30 seconds
      let attempts = 0
      const maxAttempts = 15

      const pollInterval = setInterval(async () => {
        attempts++
        console.log(`[Subscription] Poll attempt ${attempts}/${maxAttempts}`)

        await refreshSubscription()

        if (attempts >= maxAttempts) {
          clearInterval(pollInterval)
          console.log('[Subscription] Polling stopped - max attempts reached')
        }
      }, 2000)

      // Clear URL params after starting polling
      window.history.replaceState({}, '', window.location.pathname)

      return () => clearInterval(pollInterval)
    }
  }, [])

  useEffect(() => {
    // Load billing info for paid subscriptions
    if (subscription && subscription.tier !== 'free' && subscription.stripeSubscriptionId) {
      loadBillingInfo()
    }
  }, [subscription])

  const loadBillingInfo = async () => {
    try {
      setLoadingBilling(true)

      // Get the current session token for authentication
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('No active session')
      }

      const response = await fetch(`${API_URL}/stripe-data?userId=${user.id}&type=billing`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      const data = await response.json()

      if (response.ok && data) {
        setBillingInfo(data)
      }
    } catch (error) {
      console.error('Error loading billing info:', error)
    } finally {
      setLoadingBilling(false)
    }
  }

  const handleUpgrade = async (tier) => {
    try {
      setCheckingOut(true)
      setCouponError('')

      // Get the current session token for authentication
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('No active session')
      }

      console.log('[Subscription] Initiating checkout with:', {
        tier,
        couponCode: couponCode.trim() || 'none',
        hasCoupon: !!couponCode.trim()
      })

      const response = await fetch(`${API_URL}/stripe-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          type: 'checkout',
          userId: user.id,
          tier,
          couponCode: couponCode.trim() || undefined
        })
      })

      console.log('[Subscription] Checkout response:', {
        status: response.status,
        ok: response.ok
      })

      const data = await response.json()

      if (!response.ok) {
        // Show detailed error message from server
        const errorMsg = data.details || data.error || 'Failed to create checkout session'
        console.error('Checkout session error:', data)

        // Check if error is coupon-related
        if (errorMsg.toLowerCase().includes('coupon') || errorMsg.toLowerCase().includes('promotion')) {
          setCouponError(errorMsg)
          throw new Error(errorMsg)
        }

        throw new Error(errorMsg)
      }

      // Check if this was an instant upgrade (no checkout needed)
      if (data.upgraded) {
        alert('Your subscription has been upgraded successfully! Your new plan is now active.')
        await refreshSubscription()
        // Reload billing info
        if (tier !== 'free') {
          loadBillingInfo()
        }
      } else {
        // Redirect to Stripe checkout
        window.location.href = data.url
      }
    } catch (error) {
      console.error('Error creating checkout session:', error)
      alert(`Failed to start checkout: ${error.message}`)
    } finally {
      setCheckingOut(false)
    }
  }

  const handleManageSubscription = async () => {
    try {
      setCheckingOut(true)

      // Get the current session token for authentication
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('No active session')
      }

      const response = await fetch(`${API_URL}/stripe-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          type: 'portal',
          userId: user.id
        })
      })

      const data = await response.json()

      if (!response.ok) {
        // Show detailed error message from server
        const errorMsg = data.details || data.error || 'Failed to create portal session'
        console.error('Portal session error:', data)
        throw new Error(errorMsg)
      }

      window.location.href = data.url
    } catch (error) {
      console.error('Error creating portal session:', error)
      alert(`Failed to open subscription management: ${error.message}`)
    } finally {
      setCheckingOut(false)
    }
  }

  if (contextLoading) {
    return (
      <div className="settings-section">
        <div className="section-header">
          <h3>💳 Subscription & Billing</h3>
          <p className="section-description">Loading subscription information...</p>
        </div>
      </div>
    )
  }

  const tier = subscription?.tier || 'free'
  const status = subscription?.status || 'active'

  // Get limits from subscription or use defaults
  const emailLimit = subscription?.email_limit || 10
  const contactLimit = subscription?.contact_limit || 25
  const campaignLimit = subscription?.campaign_limit || 1

  // Usage data (to be implemented with actual tracking)
  const emailsSent = 0 // TODO: Track actual usage
  const remaining = emailLimit - emailsSent
  const usagePercentage = (emailsSent / emailLimit) * 100

  const tierInfo = {
    free: {
      name: 'Free Plan',
      icon: '🎯',
      color: '#94a3b8',
      features: ['10 AI emails/month', 'Up to 25 contacts', '1 active campaign']
    },
    starter: {
      name: 'Starter Plan',
      icon: '🚀',
      color: '#667eea',
      price: '€29/month',
      features: ['500 AI emails/month', 'Up to 1,000 contacts', '5 active campaigns']
    },
    professional: {
      name: 'Professional Plan',
      icon: '⚡',
      color: '#f59e0b',
      price: '€79/month',
      features: ['2,500 AI emails/month', 'Up to 10,000 contacts', '20 active campaigns']
    }
  }

  const currentTierInfo = tierInfo[tier]

  return (
    <div className="settings-section subscription-section">
      <div className="section-header">
        <h3>💳 Subscription & Billing</h3>
        <p className="section-description">Manage your subscription and view usage</p>
      </div>

      {/* Current Plan Card */}
      <div className="current-plan-card" style={{ borderColor: currentTierInfo.color }}>
        <div className="plan-header">
          <div className="plan-info">
            <span className="plan-icon">{currentTierInfo.icon}</span>
            <div>
              <h4>{currentTierInfo.name}</h4>
              {currentTierInfo.price && <p className="plan-price">{currentTierInfo.price}</p>}
              {tier === 'free' && <p className="plan-price">No credit card required</p>}
            </div>
          </div>
          {status === 'active' && tier !== 'free' && (
            <span className="status-badge status-active">Active</span>
          )}
          {status === 'past_due' && (
            <span className="status-badge status-warning">Payment Due</span>
          )}
          {status === 'canceled' && (
            <span className="status-badge status-inactive">Canceled</span>
          )}
        </div>

        <div className="plan-features">
          {currentTierInfo.features.map((feature, index) => (
            <div key={index} className="feature-item">
              <span className="check-icon">✓</span>
              {feature}
            </div>
          ))}
        </div>
      </div>

      {/* Usage Stats */}
      <div className="usage-stats">
        <h4>Monthly Email Usage</h4>
        <div className="usage-bar-container">
          <div className="usage-bar">
            <div
              className="usage-fill"
              style={{
                width: `${Math.min(usagePercentage, 100)}%`,
                backgroundColor: usagePercentage > 90 ? '#ef4444' : usagePercentage > 70 ? '#f59e0b' : '#10b981'
              }}
            />
          </div>
          <div className="usage-text">
            <span className="usage-numbers">
              <strong>{emailsSent}</strong> of <strong>{emailLimit}</strong> emails sent
            </span>
            <span className="usage-remaining">
              {remaining > 0 ? `${remaining} remaining` : 'Limit reached'}
            </span>
          </div>
        </div>
        {remaining === 0 && (
          <div className="warning-box" style={{ marginTop: '1rem' }}>
            ⚠️ You've reached your monthly email limit. Upgrade to send more emails.
          </div>
        )}
        {remaining > 0 && remaining <= 5 && tier === 'free' && (
          <div className="info-box" style={{ marginTop: '1rem' }}>
            💡 Running low on emails? Upgrade to continue your campaigns without interruption.
          </div>
        )}
      </div>

      {/* Billing Details for Paid Plans */}
      {tier !== 'free' && subscription?.stripeSubscriptionId && (
        <>
          {loadingBilling ? (
            <div className="billing-loading">
              <p>Loading billing information...</p>
            </div>
          ) : billingInfo && (
            <>
              {/* Billing Info */}
              <div className="billing-details">
                <h4>💳 Billing Information</h4>
                <div className="billing-info-grid">
                  {billingInfo.nextBillingDate && (
                    <div className="billing-item">
                      <span className="billing-label">Next Billing Date</span>
                      <span className="billing-value">
                        {new Date(billingInfo.nextBillingDate).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </span>
                    </div>
                  )}
                  {billingInfo.amount && (
                    <div className="billing-item">
                      <span className="billing-label">Amount</span>
                      <span className="billing-value">€{(billingInfo.amount / 100).toFixed(2)}</span>
                    </div>
                  )}
                  {billingInfo.paymentMethod && (
                    <div className="billing-item">
                      <span className="billing-label">Payment Method</span>
                      <span className="billing-value">
                        {billingInfo.paymentMethod.brand?.toUpperCase()} •••• {billingInfo.paymentMethod.last4}
                        <span className="card-expiry"> (Exp: {billingInfo.paymentMethod.exp_month}/{billingInfo.paymentMethod.exp_year})</span>
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Payment History */}
              {billingInfo.invoices && billingInfo.invoices.length > 0 && (
                <div className="payment-history">
                  <h4>📄 Recent Invoices</h4>
                  <div className="invoices-list">
                    {billingInfo.invoices.map((invoice) => (
                      <div key={invoice.id} className="invoice-item">
                        <div className="invoice-info">
                          <span className="invoice-date">
                            {new Date(invoice.created * 1000).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </span>
                          <span className="invoice-description">{invoice.description || 'Subscription'}</span>
                        </div>
                        <div className="invoice-actions">
                          <span className={`invoice-status ${invoice.status}`}>
                            {invoice.status === 'paid' && '✓ Paid'}
                            {invoice.status === 'open' && '⏳ Pending'}
                            {invoice.status === 'void' && '✗ Void'}
                            {invoice.status === 'uncollectible' && '⚠️ Failed'}
                          </span>
                          <span className="invoice-amount">€{(invoice.amount / 100).toFixed(2)}</span>
                          {invoice.invoice_pdf && (
                            <a
                              href={invoice.invoice_pdf}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="invoice-download"
                            >
                              ⬇ PDF
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* Coupon Code Section (for free tier users) */}
      {tier === 'free' && (
        <div className="coupon-section">
          <h4>🎟️ Have a Coupon Code?</h4>
          <div className="coupon-input-group">
            <input
              type="text"
              className="coupon-input"
              placeholder="Enter coupon code"
              value={couponCode}
              onChange={(e) => {
                setCouponCode(e.target.value.toUpperCase())
                setCouponError('')
              }}
              disabled={checkingOut}
            />
            {couponCode && (
              <button
                className="clear-coupon-btn"
                onClick={() => {
                  setCouponCode('')
                  setCouponError('')
                }}
                disabled={checkingOut}
              >
                ✕
              </button>
            )}
          </div>
          {couponError && (
            <div className="error-box" style={{ marginTop: '0.5rem' }}>
              ⚠️ {couponError}
            </div>
          )}
          {couponCode && !couponError && (
            <div className="info-box" style={{ marginTop: '0.5rem' }}>
              💡 Coupon code "{couponCode}" will be applied at checkout
            </div>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="subscription-actions">
        {tier === 'free' && (
          <>
            <button
              onClick={() => handleUpgrade('starter')}
              className="upgrade-btn starter-btn"
              disabled={checkingOut}
            >
              {checkingOut ? 'Loading...' : '🚀 Upgrade to Starter - €29/month'}
            </button>
            <button
              onClick={() => handleUpgrade('professional')}
              className="upgrade-btn pro-btn"
              disabled={checkingOut}
            >
              {checkingOut ? 'Loading...' : '⚡ Upgrade to Professional - €79/month'}
            </button>
          </>
        )}

        {tier === 'starter' && (
          <>
            <button
              onClick={() => handleUpgrade('professional')}
              className="upgrade-btn pro-btn"
              disabled={checkingOut}
            >
              {checkingOut ? 'Loading...' : '⚡ Upgrade to Professional - €79/month'}
            </button>
            <button
              onClick={handleManageSubscription}
              className="manage-btn"
              disabled={checkingOut}
            >
              Manage Subscription
            </button>
          </>
        )}

        {tier === 'professional' && (
          <button
            onClick={handleManageSubscription}
            className="manage-btn"
            disabled={checkingOut}
          >
            Manage Subscription
          </button>
        )}
      </div>

      {/* Subscription Notes */}
      {tier !== 'free' && (
        <div className="subscription-notes">
          <p><strong>Note:</strong> You can cancel or modify your subscription anytime through the customer portal. No long-term commitments required.</p>
          {subscription?.subscriptionEndDate && status === 'canceled' && (
            <p>Your subscription will remain active until {new Date(subscription.subscriptionEndDate).toLocaleDateString()}</p>
          )}
        </div>
      )}

      {tier === 'free' && (
        <div className="upgrade-benefits">
          <h4>Why Upgrade?</h4>
          <ul>
            <li>🎯 Send more emails and reach more prospects</li>
            <li>📊 Manage multiple campaigns simultaneously</li>
            <li>🤖 Unlimited AI-powered email generation</li>
            <li>📈 Scale your cold email outreach</li>
            <li>💬 Priority email support</li>
          </ul>
        </div>
      )}
    </div>
  )
}
