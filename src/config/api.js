// API Configuration
// Use Supabase Edge Functions for better performance and no serverless limits

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL

// Extract project ref from Supabase URL (e.g., "fyoiswejujtnaosweouu")
const PROJECT_REF = SUPABASE_URL?.split('//')[1]?.split('.')[0]

// Supabase Edge Functions URL
export const API_URL = `https://${PROJECT_REF}.supabase.co/functions/v1`

// For local development with Supabase CLI, use:
// export const API_URL = 'http://localhost:54321/functions/v1'

export default API_URL
