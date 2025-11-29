import { createSupabaseClient } from './supabase.ts'

// Check if user has a valid paid subscription (Starter or Professional tier)
export async function checkPaidSubscription(userId: string): Promise<{
  hasAccess: boolean
  tier?: string
  error?: string
}> {
  try {
    const supabase = createSupabaseClient()

    const { data: subscription, error } = await supabase
      .rpc('get_my_subscription')
      .single()

    if (error) {
      console.error('Error checking subscription:', error)
      return {
        hasAccess: false,
        error: 'Failed to verify subscription status'
      }
    }

    // Check if user has active paid subscription
    const isPaid = subscription?.tier === 'starter' || subscription?.tier === 'professional'
    const isActive = subscription?.status === 'active' || subscription?.status === 'trialing'

    if (!isPaid || !isActive) {
      return {
        hasAccess: false,
        tier: subscription?.tier || 'free',
        error: 'AI features are only available for paid subscribers. Please upgrade your plan.'
      }
    }

    return {
      hasAccess: true,
      tier: subscription.tier
    }
  } catch (error) {
    console.error('Error in checkPaidSubscription:', error)
    return {
      hasAccess: false,
      error: 'Failed to verify subscription'
    }
  }
}
