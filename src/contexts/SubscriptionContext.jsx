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
    if (!user?.id) return

    try {
      // Query Stripe data directly using the wrapper
      const { data: subData, error: subError } = await supabase
        .rpc('get_my_subscription')
        .maybeSingle()

      if (subError) {
        console.error('Error loading subscription:', subError)
        setSubscription({ tier: 'free' })
      } else if (subData) {
        console.log('Subscription loaded:', subData)
        setSubscription({
          tier: subData.tier || 'free',
          status: subData.status,
          subscription_id: subData.subscription_id,
          email_limit: subData.email_limit,
          contact_limit: subData.contact_limit,
          campaign_limit: subData.campaign_limit,
          current_period_end: subData.current_period_end
        })
      } else {
        // No subscription found, user is on free plan
        setSubscription({ tier: 'free' })
      }

      // TODO: Add usage tracking if needed
      setUsage({ canSend: true, remaining: subData?.email_limit || 10 })
    } catch (error) {
      console.error('Error loading subscription data:', error)
      // Default to free plan on error
      setSubscription({ tier: 'free' })
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
