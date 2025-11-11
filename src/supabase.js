import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://fyoiswejujtnaosweouu.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ5b2lzd2VqdWp0bmFvc3dlb3V1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIxMTI3NDgsImV4cCI6MjA3NzY4ODc0OH0.ZKr_HtYpRVhXjDxJsfVC-wcUiV3Mxj3q7fe2zeR-TM8'  // Your anon/public key

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
