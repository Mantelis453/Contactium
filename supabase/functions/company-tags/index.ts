import { corsHeaders } from '../_shared/cors.ts'
import { createSupabaseClient } from '../_shared/supabase.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const supabase = createSupabaseClient()
  const url = new URL(req.url)
  const method = req.method

  try {
    // GET - Fetch all tags or search tags
    if (method === 'GET') {
      const category = url.searchParams.get('category')
      const search = url.searchParams.get('search')
      const limit = parseInt(url.searchParams.get('limit') || '100')

      let query = supabase
        .from('company_tags')
        .select('*')
        .order('usage_count', { ascending: false })
        .limit(limit)

      if (category) {
        query = query.eq('category', category)
      }

      if (search) {
        query = query.ilike('name', `%${search}%`)
      }

      const { data, error } = await query

      if (error) throw error

      return new Response(
        JSON.stringify({ tags: data || [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // POST - Create new tag
    if (method === 'POST') {
      const { name, category, color, description } = await req.json()

      if (!name) {
        return new Response(
          JSON.stringify({ error: 'Tag name is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const { data, error } = await supabase
        .from('company_tags')
        .insert({
          name,
          category: category || 'custom',
          color: color || '#6366f1',
          description: description || ''
        })
        .select()
        .single()

      if (error) {
        // Check if tag already exists
        if (error.code === '23505') {
          return new Response(
            JSON.stringify({ error: 'Tag already exists' }),
            { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
        throw error
      }

      return new Response(
        JSON.stringify({ tag: data }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // PUT - Update company tags
    if (method === 'PUT') {
      const { companyId, tags } = await req.json()

      if (!companyId) {
        return new Response(
          JSON.stringify({ error: 'Company ID is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      if (!Array.isArray(tags)) {
        return new Response(
          JSON.stringify({ error: 'Tags must be an array' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Update company tags
      const { data, error } = await supabase
        .from('companies')
        .update({ tags })
        .eq('id', companyId)
        .select()
        .single()

      if (error) throw error

      return new Response(
        JSON.stringify({ company: data }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // DELETE - Delete a tag
    if (method === 'DELETE') {
      const tagId = url.searchParams.get('id')

      if (!tagId) {
        return new Response(
          JSON.stringify({ error: 'Tag ID is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const { error } = await supabase
        .from('company_tags')
        .delete()
        .eq('id', tagId)

      if (error) throw error

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in company-tags function:', error)

    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
