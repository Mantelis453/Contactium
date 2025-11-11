import { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useSubscription as useSubscriptionContext } from '../contexts/SubscriptionContext'
import '../styles/Subscription.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

export default function Subscription() {
  const { user } = useAuth()
  const { refreshSubscription } = useSubscriptionContext()
  const [loading, setLoading] = useState(true)
  const [subscription, setSubscription] = useState(null)
  const [usage, setUsage] = useState(null)
  const [checkingOut, setCheckingOut] = useState(false)

  useEffect(() => {
    if (user?.id) {
      loadSubscriptionData()

      // Check if user just returned from successful checkout
      const params = new URLSearchParams(window.location.search)
      if (params.get('success') === 'true') {
        // Refresh subscription context after successful upgrade
        setTimeout(() => {
          refreshSubscription()
        }, 2000) // Give Stripe webhook time to process
      }
    }
  }, [user])

  const loadSubscriptionData = async () => {
    try {
      setLoading(true)

      // Load subscription info and usage in parallel
      const [subscriptionRes, usageRes] = await Promise.all([
        fetch(`${API_URL}/api/stripe/data?userId=${user.id}&type=subscription`),
        fetch(`${API_URL}/api/stripe/data?userId=${user.id}&type=usage`)
      ])

      if (subscriptionRes.ok) {
        const subData = await subscriptionRes.json()
        setSubscription(subData)
      }

      if (usageRes.ok) {
        const usageData = await usageRes.json()
        setUsage(usageData)
      }
    } catch (error) {
      console.error('Error loading subscription data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpgrade = async (tier) => {
    try {
      setCheckingOut(true)

      const response = await fetch(`${API_URL}/api/stripe/session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type: 'checkout',
          userId: user.id,
          tier,
          successUrl: `${window.location.origin}/settings?success=true`,
          cancelUrl: `${window.location.origin}/settings`
        })
      })

      if (!response.ok) {
        throw new Error('Failed to create checkout session')
      }

      const { url } = await response.json()
      window.location.href = url
    } catch (error) {
      console.error('Error creating checkout session:', error)
      alert('Failed to start checkout. Please try again.')
    } finally {
      setCheckingOut(false)
    }
  }

  const handleManageSubscription = async () => {
    try {
      setCheckingOut(true)

      const response = await fetch(`${API_URL}/api/stripe/session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type: 'portal',
          userId: user.id,
          returnUrl: `${window.location.origin}/settings`
        })
      })

      if (!response.ok) {
        throw new Error('Failed to create portal session')
      }

      const { url } = await response.json()
      window.location.href = url
    } catch (error) {
      console.error('Error creating portal session:', error)
      alert('Failed to open subscription management. Please try again.')
    } finally {
      setCheckingOut(false)
    }
  }

  if (loading) {
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
  const emailsSent = usage?.emailsSent || 0
  const emailLimit = usage?.emailLimit || 10
  const remaining = usage?.remaining || 0
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
