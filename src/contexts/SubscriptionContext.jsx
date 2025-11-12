import { createContext, useContext, useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'

const SubscriptionContext = createContext()

// Plan limits configuration
const PLAN_LIMITS = {
  free: {
    name: 'Free',
    emailLimit: 10,
    contactLimit: 25,
    campaignLimit: 1,
    color: '#64748b',
    bgColor: '#f1f5f9'
  },
  starter: {
    name: 'Starter',
    emailLimit: 500,
    contactLimit: 1000,
    campaignLimit: 5,
    color: '#3b82f6',
    bgColor: '#eff6ff'
  },
  professional: {
    name: 'Professional',
    emailLimit: 2500,
    contactLimit: 10000,
    campaignLimit: 20,
    color: '#8b5cf6',
    bgColor: '#f5f3ff'
  }
}

export function SubscriptionProvider({ children }) {
  const { user } = useAuth()
  const [subscription, setSubscription] = useState(null)
  const [usage, setUsage] = useState(null)
  const [loading, setLoading] = useState(true)

  const loadSubscriptionData = async () => {
    if (!user?.id) {
      setLoading(false)
      return
    }

    try {
      console.log('[SubscriptionContext] Loading subscription for user:', user.id)

      // Query user_settings table for subscription data
      const { data: settings, error } = await supabase
        .from('user_settings')
        .select('subscription_tier, subscription_status, stripe_customer_id, stripe_subscription_id, subscription_end_date, emails_sent_this_month, last_reset_date')
        .eq('user_id', user.id)
        .maybeSingle()

      if (error && error.code !== 'PGRST116') {
        console.error('[SubscriptionContext] Error loading settings:', error)
        throw error
      }

      if (!settings) {
        // User has no settings yet, create default free tier
        console.log('[SubscriptionContext] No settings found, creating free tier defaults')

        const { error: insertError } = await supabase
          .from('user_settings')
          .insert({
            user_id: user.id,
            subscription_tier: 'free',
            subscription_status: 'active',
            emails_sent_this_month: 0,
            last_reset_date: new Date().toISOString()
          })

        if (insertError) {
          console.error('[SubscriptionContext] Error creating settings:', insertError)
        }

        setSubscription({
          tier: 'free',
          status: 'active',
          email_limit: PLAN_LIMITS.free.emailLimit,
          contact_limit: PLAN_LIMITS.free.contactLimit,
          campaign_limit: PLAN_LIMITS.free.campaignLimit
        })

        setUsage({
          canSend: true,
          emailsSent: 0,
          emailLimit: PLAN_LIMITS.free.emailLimit,
          remaining: PLAN_LIMITS.free.emailLimit
        })

        setLoading(false)
        return
      }

      const tier = settings.subscription_tier || 'free'
      const planLimits = PLAN_LIMITS[tier]

      console.log('[SubscriptionContext] Subscription loaded:', {
        tier,
        status: settings.subscription_status
      })

      setSubscription({
        tier,
        status: settings.subscription_status || 'active',
        subscription_id: settings.stripe_subscription_id,
        customer_id: settings.stripe_customer_id,
        email_limit: planLimits.emailLimit,
        contact_limit: planLimits.contactLimit,
        campaign_limit: planLimits.campaignLimit,
        current_period_end: settings.subscription_end_date
      })

      // Calculate usage
      const emailsSent = settings.emails_sent_this_month || 0
      const emailLimit = planLimits.emailLimit
      const remaining = Math.max(0, emailLimit - emailsSent)

      setUsage({
        canSend: remaining > 0,
        emailsSent,
        emailLimit,
        remaining
      })

    } catch (error) {
      console.error('[SubscriptionContext] Error loading subscription data:', error)
      // Default to free plan on error
      setSubscription({
        tier: 'free',
        status: 'active',
        email_limit: PLAN_LIMITS.free.emailLimit,
        contact_limit: PLAN_LIMITS.free.contactLimit,
        campaign_limit: PLAN_LIMITS.free.campaignLimit
      })
      setUsage({
        canSend: true,
        emailsSent: 0,
        emailLimit: PLAN_LIMITS.free.emailLimit,
        remaining: PLAN_LIMITS.free.emailLimit
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user?.id) {
      loadSubscriptionData()
    } else {
      setLoading(false)
    }
  }, [user])

  // Get current plan info
  const getCurrentPlan = () => {
    const tier = subscription?.tier || 'free'
    return PLAN_LIMITS[tier]
  }

  // Check if user can create a new campaign
  const canCreateCampaign = (currentCampaignCount) => {
    const plan = getCurrentPlan()
    return currentCampaignCount < plan.campaignLimit
  }

  // Check if user can add more contacts
  const canAddContacts = (currentContactCount, contactsToAdd = 1) => {
    const plan = getCurrentPlan()
    return (currentContactCount + contactsToAdd) <= plan.contactLimit
  }

  // Check if user can send emails
  const canSendEmails = () => {
    return usage?.canSend || false
  }

  // Get remaining email quota
  const getRemainingEmails = () => {
    return usage?.remaining || 0
  }

  // Get email usage percentage
  const getEmailUsagePercentage = () => {
    if (!usage?.emailLimit) return 0
    return (usage.emailsSent / usage.emailLimit) * 100
  }

  // Refresh subscription data (call after upgrade/downgrade)
  const refreshSubscription = async () => {
    console.log('[SubscriptionContext] Refreshing subscription data')
    setLoading(true)
    await loadSubscriptionData()
  }

  // Get total campaign count for current user
  const getCampaignCount = async () => {
    if (!user?.id) return 0

    try {
      const { count, error } = await supabase
        .from('campaigns')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)

      if (error) {
        console.error('Error getting campaign count:', error)
        return 0
      }

      return count || 0
    } catch (error) {
      console.error('Error getting campaign count:', error)
      return 0
    }
  }

  const value = {
    subscription,
    usage,
    loading,
    currentPlan: getCurrentPlan(),
    canCreateCampaign,
    canAddContacts,
    canSendEmails,
    getRemainingEmails,
    getEmailUsagePercentage,
    refreshSubscription,
    getCampaignCount,
    PLAN_LIMITS
  }

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  )
}

export function useSubscription() {
  const context = useContext(SubscriptionContext)
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider')
  }
  return context
}
