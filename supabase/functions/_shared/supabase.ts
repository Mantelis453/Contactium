import { createClient } from '@supabase/supabase-js'

export const createSupabaseClient = () => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

  return createClient(supabaseUrl, supabaseServiceKey)
}
