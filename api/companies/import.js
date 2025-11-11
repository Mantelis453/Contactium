import { supabase } from '../_lib/supabase.js'

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { companies } = req.body

    if (!companies || !Array.isArray(companies)) {
      return res.status(400).json({ error: 'Companies array is required' })
    }

    // Prepare companies for insertion
    const companiesData = companies.map(company => ({
      company_code: company.company_code || null,
      company_name: company.company_name,
      company_code_verify: company.company_code_verify || null,
      address: company.address || null,
      scorist_rating: company.scorist_rating ? parseFloat(company.scorist_rating) : null,
      phone: company.phone || null,
      website: company.website || null,
      email: company.email || null,
      registration_address: company.registration_address || null,
      employees: company.employees ? parseInt(company.employees) : null,
      sodra_debt_days: company.sodra_debt_days ? parseInt(company.sodra_debt_days) : null,
      sodra_debt: company.sodra_debt || null,
      vmi_debt: company.vmi_debt || null,
      vehicles: company.vehicles ? parseInt(company.vehicles) : null,
      financial_reports: company.financial_reports || null,
      activity: company.activity || null
    }))

    const { data, error } = await supabase
      .from('companies')
      .insert(companiesData)
      .select()

    if (error) throw error

    res.json({
      success: true,
      message: `Successfully imported ${data.length} companies`,
      imported: data.length
    })
  } catch (error) {
    console.error('Error importing companies:', error)
    res.status(500).json({ error: error.message })
  }
}
