import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY

export const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function getUserSettings(userId) {
  console.log('Fetching settings for user ID:', userId)

  const { data, error } = await supabase
    .from('user_settings')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  console.log('Query result - data:', data, 'error:', error)

  if (error) {
    console.error('Database error:', error)
    throw new Error('Failed to load user settings: ' + error.message)
  }

  if (!data) {
    console.error('No settings found for user:', userId)
    throw new Error('User settings not found. Please configure your email settings in the Settings page first.')
  }

  console.log('Settings found:', {
    ...data,
    smtp_password: data.smtp_password ? '***' : null
  })

  return data
}
