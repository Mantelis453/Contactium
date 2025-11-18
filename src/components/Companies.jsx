import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { useSubscription } from '../contexts/SubscriptionContext'
import SearchableSelect from './SearchableSelect'
import API_URL from '../config/api'
import '../styles/Companies.css'

export default function Companies() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { subscription, loading: subscriptionLoading } = useSubscription()
  const [companies, setCompanies] = useState([])
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [scrapingCompanyId, setScrapingCompanyId] = useState(null)
  const [expandedCompany, setExpandedCompany] = useState(null)
  const [batchProcessing, setBatchProcessing] = useState(false)
  const [batchProgress, setBatchProgress] = useState(null)
  const [deepScrapingCompanyId, setDeepScrapingCompanyId] = useState(null)

  // Selection state
  const [selectedCompanies, setSelectedCompanies] = useState(new Set())
  const [selectedCompanyData, setSelectedCompanyData] = useState(new Map()) // Store full company objects
  const [contactLists, setContactLists] = useState([])
  const [showAddToListModal, setShowAddToListModal] = useState(false)
  const [selectedListId, setSelectedListId] = useState('')
  const [addingToList, setAddingToList] = useState(false)

  // Pagination
  const [offset, setOffset] = useState(0)
  const [total, setTotal] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const limit = 100

  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [activityFilter, setActivityFilter] = useState('all')
  const [minEmployees, setMinEmployees] = useState('')
  const [maxEmployees, setMaxEmployees] = useState('')
  const [minRating, setMinRating] = useState('')
  const [maxRating, setMaxRating] = useState('')
  const [selectedTags, setSelectedTags] = useState([])
  const [websiteFilter, setWebsiteFilter] = useState('all') // all, with, without

  // Tags
  const [availableTags, setAvailableTags] = useState([])
  const [editingTags, setEditingTags] = useState(null)
  const [newTagInput, setNewTagInput] = useState('')

  // Check if user has access to Companies page (Starter or Professional plan)
  const hasAccess = subscription?.tier === 'starter' || subscription?.tier === 'professional'

  // Debounce search query - wait 500ms after user stops typing
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery)
    }, 500)

    return () => clearTimeout(timer)
  }, [searchQuery])

  useEffect(() => {
    loadAvailableTags()
    if (user?.id && hasAccess) {
      loadContactLists()
    }
  }, [user, hasAccess])

  useEffect(() => {
    setOffset(0)
    setCompanies([])
    loadCompanies(true)
    loadActivities()
  }, [activityFilter, minEmployees, maxEmployees, minRating, maxRating, debouncedSearch, selectedTags, websiteFilter])

  const loadCompanies = async (reset = false) => {
    try {
      const currentOffset = reset ? 0 : offset
      if (reset) {
        setLoading(true)
      } else {
        setLoadingMore(true)
      }

      const params = new URLSearchParams({
        ...(activityFilter !== 'all' && { activity: activityFilter }),
        ...(minEmployees && { minEmployees }),
        ...(maxEmployees && { maxEmployees }),
        ...(minRating && { minRating }),
        ...(maxRating && { maxRating }),
        ...(debouncedSearch && { search: debouncedSearch }),
        ...(websiteFilter !== 'all' && { website: websiteFilter }),
        ...(selectedTags.length > 0 && { tags: selectedTags.join(',') }),
        offset: currentOffset.toString(),
        limit: limit.toString()
      })

      // Get auth session and anon key for Supabase Edge Function auth
      const { data: { session } } = await supabase.auth.getSession()
      const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

      const response = await fetch(`${API_URL}/companies?${params}`, {
        headers: {
          'Authorization': `Bearer ${session?.access_token || anonKey}`,
          'apikey': anonKey
        }
      })
      const responseData = await response.json()

      if (response.ok) {
        if (reset) {
          setCompanies(responseData.companies || [])
        } else {
          setCompanies(prev => [...prev, ...(responseData.companies || [])])
        }
        setTotal(responseData.total || 0)
        setHasMore(responseData.hasMore || false)
        setOffset(currentOffset + limit)
      } else {
        console.error('Error loading companies:', responseData.error)
      }
    } catch (error) {
      console.error('Error loading companies:', error)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  const loadMore = () => {
    if (!loadingMore && hasMore) {
      loadCompanies(false)
    }
  }

  const loadActivities = async () => {
    try {
      // Get auth session and anon key for Supabase Edge Function auth
      const { data: { session } } = await supabase.auth.getSession()
      const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

      const response = await fetch(`${API_URL}/companies-activities`, {
        headers: {
          'Authorization': `Bearer ${session?.access_token || anonKey}`,
          'apikey': anonKey
        }
      })
      const data = await response.json()

      if (response.ok) {
        setActivities(data.activities || [])
      }
    } catch (error) {
      console.error('Error loading activities:', error)
    }
  }

  const loadAvailableTags = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('company-tags')
      if (!error && data?.tags) {
        setAvailableTags(data.tags)
      }
    } catch (error) {
      console.error('Error loading tags:', error)
    }
  }

  const scrapeCompanyWebsite = async (company) => {
    try {
      setScrapingCompanyId(company.id)

      // Get user's Gemini API key from settings
      const { data: settings } = await supabase
        .from('user_settings')
        .select('gemini_api_key')
        .single()

      if (!settings?.gemini_api_key) {
        alert('Please add your Gemini API key in Settings first')
        setScrapingCompanyId(null)
        return
      }

      const hasWebsite = company.website && company.website.trim() !== ''

      const { data, error } = await supabase.functions.invoke('scrape-company', {
        body: {
          companyId: company.id,
          website: hasWebsite ? company.website : null,
          companyName: company.company_name || company.name,
          geminiApiKey: settings.gemini_api_key
        }
      })

      if (error) throw error

      if (data.success) {
        // Update company in local state
        setCompanies(prev => prev.map(c =>
          c.id === company.id ? { ...c, ...data.data.company } : c
        ))

        const resultMessage = hasWebsite
          ? `Scraping successful!\n- Emails found: ${data.data.emails_found}\n- Total emails: ${data.data.total_emails}\n- Tags: ${data.data.tags.join(', ')}`
          : `Tagging successful!\n- Tags added: ${data.data.tags.join(', ')}`

        alert(resultMessage)
        setExpandedCompany(company.id) // Expand to show results
      }
    } catch (error) {
      console.error('Error processing company:', error)
      alert('Failed to process company: ' + error.message)
    } finally {
      setScrapingCompanyId(null)
    }
  }

  const deepScrapeCompany = async (company) => {
    if (!company.website || company.website.trim() === '') {
      alert('Website URL is required for deep scraping')
      return
    }

    if (!confirm(`Deep scrape will:\n- Scrape multiple pages (About, Team, Contact, etc.)\n- Extract all emails, phone numbers, and addresses\n- Find key personnel and social media links\n- Detect technologies and services\n\nThis may take 1-2 minutes. Continue?`)) {
      return
    }

    try {
      setDeepScrapingCompanyId(company.id)

      // Get user's Gemini API key from settings
      const { data: settings } = await supabase
        .from('user_settings')
        .select('gemini_api_key')
        .single()

      if (!settings?.gemini_api_key) {
        alert('Please add your Gemini API key in Settings first')
        setDeepScrapingCompanyId(null)
        return
      }

      const { data, error } = await supabase.functions.invoke('deep-scrape-company', {
        body: {
          companyId: company.id,
          website: company.website,
          companyName: company.company_name || company.name,
          geminiApiKey: settings.gemini_api_key
        }
      })

      if (error) {
        console.error('Supabase function error:', error)
        throw error
      }

      // Check if the response indicates failure
      if (data && !data.success) {
        throw new Error(data.error || 'Deep scraping failed')
      }

      if (data && data.success) {
        // Update company in local state
        setCompanies(prev => prev.map(c =>
          c.id === company.id ? { ...c, ...data.data.company } : c
        ))

        const details = data.data
        const resultMessage = `Deep scraping complete! 🎉

📄 Pages scraped: ${details.pagesScraped}
📧 Emails found: ${details.emailsFound} verified (${details.emailsInvalid || 0} invalid)
   Total: ${details.totalEmails} unique emails
📞 Phone numbers: ${details.phonesFound}
👥 Key personnel: ${details.keyPersonnel}
💼 Services: ${details.services}
🔧 Technologies: ${details.technologies}
📱 Social media: ${details.socialMedia}
${details.emailPattern ? `📧 Email pattern: ${details.emailPattern}` : ''}
${details.foundedYear ? `📅 Founded: ${details.foundedYear}` : ''}
${details.employeeCount ? `👔 Employees: ~${details.employeeCount}` : ''}`

        alert(resultMessage)
        setExpandedCompany(company.id) // Expand to show results
      } else {
        throw new Error('Unexpected response from deep scrape function')
      }
    } catch (error) {
      console.error('Error deep scraping company:', error)
      const errorMessage = error.message || 'Unknown error occurred'
      alert('Failed to deep scrape company:\n\n' + errorMessage)
    } finally {
      setDeepScrapingCompanyId(null)
    }
  }

  const updateCompanyTags = async (companyId, tags) => {
    try {
      const { error } = await supabase.functions.invoke('company-tags', {
        method: 'PUT',
        body: { companyId, tags }
      })

      if (error) throw error

      // Update local state
      setCompanies(prev => prev.map(c =>
        c.id === companyId ? { ...c, tags } : c
      ))
      setEditingTags(null)
    } catch (error) {
      console.error('Error updating tags:', error)
      alert('Failed to update tags')
    }
  }

  const addTagToCompany = (company, tag) => {
    const currentTags = company.tags || []
    if (!currentTags.includes(tag)) {
      updateCompanyTags(company.id, [...currentTags, tag])
    }
  }

  const removeTagFromCompany = (company, tagToRemove) => {
    const currentTags = company.tags || []
    updateCompanyTags(company.id, currentTags.filter(t => t !== tagToRemove))
  }

  // Check if website value indicates "no website"
  const hasValidWebsite = (website) => {
    if (!website || website.trim() === '') return false

    const websiteLower = website.toLowerCase().trim()

    // Exact matches for short placeholders
    const exactMatches = ['n/a', 'na', 'no', '-', 'nėra', 'nera']
    if (exactMatches.includes(websiteLower)) return false

    // Check if the website contains Lithuanian "no website" indicators
    const containsIndicators = ['neturime', 'none', 'no website', 'www.neturime']
    if (containsIndicators.some(indicator => websiteLower.includes(indicator))) return false

    // Must contain a dot (valid domain)
    if (!websiteLower.includes('.')) return false

    return true
  }

  const batchTagAllCompanies = async () => {
    if (!confirm('This will process all companies without tags and add AI-generated tags. This may take several minutes. Continue?')) {
      return
    }

    try {
      setBatchProcessing(true)
      setBatchProgress('Starting batch processing...')

      // Get user's Gemini API key from settings
      const { data: settings } = await supabase
        .from('user_settings')
        .select('gemini_api_key')
        .single()

      if (!settings?.gemini_api_key) {
        alert('Please add your Gemini API key in Settings first')
        setBatchProcessing(false)
        return
      }

      setBatchProgress('Processing companies... This may take a few minutes.')

      const { data, error } = await supabase.functions.invoke('batch-tag-companies', {
        body: {
          geminiApiKey: settings.gemini_api_key,
          limit: 100, // Process 100 companies at a time
          tagOnly: false // Process all companies (with or without websites)
        }
      })

      if (error) throw error

      if (data.success) {
        setBatchProgress(`Complete! Processed ${data.processed} companies: ${data.successCount} successful, ${data.failCount} failed`)

        // Refresh companies list
        await fetchCompanies()

        alert(`Batch tagging complete!\n\nProcessed: ${data.processed} companies\nSuccessful: ${data.successCount}\nFailed: ${data.failCount}`)
      }
    } catch (error) {
      console.error('Error in batch processing:', error)
      alert('Failed to batch process companies: ' + error.message)
    } finally {
      setBatchProcessing(false)
      setTimeout(() => setBatchProgress(null), 5000) // Clear progress after 5 seconds
    }
  }

  const toggleTagFilter = (tag) => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    )
  }

  const clearFilters = () => {
    setSearchQuery('')
    setActivityFilter('all')
    setMinEmployees('')
    setMaxEmployees('')
    setMinRating('')
    setMaxRating('')
    setSelectedTags([])
    setWebsiteFilter('all')
  }

  const loadContactLists = async () => {
    try {
      const { data, error } = await supabase
        .from('contact_lists')
        .select('id, name')
        .eq('user_id', user.id)
        .order('name')

      if (error) throw error
      setContactLists(data || [])
    } catch (error) {
      console.error('Error loading contact lists:', error)
    }
  }

  const toggleCompanySelection = (companyId) => {
    const newSelection = new Set(selectedCompanies)
    const newData = new Map(selectedCompanyData)

    if (newSelection.has(companyId)) {
      newSelection.delete(companyId)
      newData.delete(companyId)
    } else {
      newSelection.add(companyId)
      // Store the company data
      const company = companies.find(c => c.id === companyId)
      if (company) {
        newData.set(companyId, company)
      }
    }
    setSelectedCompanies(newSelection)
    setSelectedCompanyData(newData)
  }

  const toggleSelectAll = () => {
    if (selectedCompanies.size === companies.length) {
      setSelectedCompanies(new Set())
      setSelectedCompanyData(new Map())
    } else {
      setSelectedCompanies(new Set(companies.map(c => c.id)))
      // Store all company data
      const dataMap = new Map()
      companies.forEach(c => dataMap.set(c.id, c))
      setSelectedCompanyData(dataMap)
    }
  }

  const selectAllFiltered = async () => {
    if (!confirm(`This will select all ${total} companies that match your current filters. Continue?`)) {
      return
    }

    try {
      setLoading(true)

      const params = new URLSearchParams({
        ...(activityFilter !== 'all' && { activity: activityFilter }),
        ...(minEmployees && { minEmployees }),
        ...(maxEmployees && { maxEmployees }),
        ...(minRating && { minRating }),
        ...(maxRating && { maxRating }),
        ...(debouncedSearch && { search: debouncedSearch }),
        ...(websiteFilter !== 'all' && { website: websiteFilter }),
        ...(selectedTags.length > 0 && { tags: selectedTags.join(',') }),
        offset: '0',
        limit: total.toString() // Get all companies
      })

      // Get auth session and anon key for Supabase Edge Function auth
      const { data: { session } } = await supabase.auth.getSession()
      const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

      const response = await fetch(`${API_URL}/companies?${params}`, {
        headers: {
          'Authorization': `Bearer ${session?.access_token || anonKey}`,
          'apikey': anonKey
        }
      })
      const responseData = await response.json()

      if (response.ok) {
        const allCompanies = responseData.companies
        const allCompanyIds = allCompanies.map(c => c.id)

        // Store both IDs and full company data
        setSelectedCompanies(new Set(allCompanyIds))
        const dataMap = new Map()
        allCompanies.forEach(c => dataMap.set(c.id, c))
        setSelectedCompanyData(dataMap)

        alert(`Selected ${allCompanyIds.length} companies`)
      } else {
        console.error('Error loading all companies:', responseData.error)
        alert('Failed to load all companies')
      }
    } catch (error) {
      console.error('Error selecting all filtered companies:', error)
      alert('Failed to select all companies')
    } finally {
      setLoading(false)
    }
  }

  const handleAddToList = () => {
    if (selectedCompanies.size === 0) {
      alert('Please select at least one company')
      return
    }
    setShowAddToListModal(true)
  }

  const addCompaniesToList = async () => {
    if (!selectedListId) {
      alert('Please select a contact list')
      return
    }

    try {
      setAddingToList(true)

      // Get all selected company IDs
      const selectedIds = Array.from(selectedCompanies)
      console.log(`Processing ${selectedIds.length} selected companies...`)

      // Use stored company data from selectedCompanyData Map
      const selectedCompanyObjects = selectedIds
        .map(id => selectedCompanyData.get(id))
        .filter(company => company) // Filter out any undefined values

      console.log(`Found ${selectedCompanyObjects.length} companies with data`)

      // Prepare contacts from selected companies
      const contacts = selectedCompanyObjects.map(company => ({
        list_id: selectedListId,
        email: company.email || (company.extracted_emails && company.extracted_emails[0]) || '',
        name: company.company_name,
        company: company.company_name,
        notes: `Phone: ${company.phone || 'N/A'}\nWebsite: ${company.website || 'N/A'}`
      })).filter(contact => contact.email) // Only add companies with emails

      if (contacts.length === 0) {
        alert('None of the selected companies have email addresses')
        setAddingToList(false)
        return
      }

      // Insert in batches of 1000 to avoid payload limits
      console.log(`Preparing to insert ${contacts.length} contacts...`)
      const batchSize = 1000
      let totalAdded = 0
      const totalInsertBatches = Math.ceil(contacts.length / batchSize)

      for (let i = 0; i < contacts.length; i += batchSize) {
        const batchNum = Math.floor(i / batchSize) + 1
        console.log(`Inserting batch ${batchNum}/${totalInsertBatches}...`)

        const batch = contacts.slice(i, i + batchSize)
        const { error } = await supabase
          .from('contacts')
          .insert(batch)

        if (error) {
          console.error('Insert error:', error)
          throw new Error(`Failed to insert contacts: ${error.message}`)
        }
        totalAdded += batch.length
      }

      console.log(`Successfully added ${totalAdded} contacts`)
      alert(`Successfully added ${totalAdded} companies to the contact list!`)
      setShowAddToListModal(false)
      setSelectedCompanies(new Set())
      setSelectedCompanyData(new Map())
      setSelectedListId('')
    } catch (error) {
      console.error('Error adding companies to list:', error)
      alert('Failed to add companies to list: ' + error.message)
    } finally {
      setAddingToList(false)
    }
  }

  if (subscriptionLoading) {
    return (
      <div className="page-container">
        <div className="loading-state">Loading...</div>
      </div>
    )
  }

  if (!hasAccess) {
    return (
      <div className="page-container">
        <div className="upgrade-prompt">
          <h2>📊 Companies Feature</h2>
          <p>Access to the Companies database is available on the Starter and Professional plans.</p>
          <p>Upgrade your plan to:</p>
          <ul>
            <li>✓ Access database of companies</li>
            <li>✓ Scrape company websites for emails</li>
            <li>✓ Add companies to contact lists</li>
            <li>✓ Deep scrape for detailed company information</li>
          </ul>
          <button onClick={() => navigate('/subscription')} className="primary-btn">
            Upgrade to Starter Plan
          </button>
        </div>
      </div>
    )
  }

  if (loading && companies.length === 0) {
    return (
      <div className="page-container">
        <div className="loading-state">Loading companies...</div>
      </div>
    )
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h2 className="page-title">Companies</h2>
        <div className="header-actions">
          {selectedCompanies.size > 0 && (
            <button
              onClick={handleAddToList}
              className="primary-btn"
              title="Add selected companies to a contact list"
            >
              📋 Add {selectedCompanies.size} to List
            </button>
          )}
          {total > 100 && (
            <button
              onClick={selectAllFiltered}
              className="secondary-btn"
              title={`Select all ${total} companies matching current filters`}
            >
              ✓ Select All {total}
            </button>
          )}
          <button
            onClick={batchTagAllCompanies}
            disabled={batchProcessing}
            className="batch-tag-btn"
            title="Automatically tag all companies without tags using AI"
          >
            {batchProcessing ? '⏳ Processing...' : '🚀 Batch Tag All'}
          </button>
        </div>
      </div>

      {batchProgress && (
        <div className="batch-progress-alert">
          {batchProgress}
        </div>
      )}

      <div className="filters-section">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by name, code, or email..."
          className="search-input"
        />

        <SearchableSelect
          options={activities}
          value={activityFilter === 'all' ? '' : activityFilter}
          onChange={(value) => setActivityFilter(value || 'all')}
          placeholder="Search activities..."
        />

        <select
          value={websiteFilter}
          onChange={(e) => setWebsiteFilter(e.target.value)}
          className="filter-select"
        >
          <option value="all">All Companies</option>
          <option value="with">With Website</option>
          <option value="without">Without Website</option>
        </select>

        <input
          type="number"
          value={minEmployees}
          onChange={(e) => setMinEmployees(e.target.value)}
          placeholder="Min employees"
          className="filter-input"
        />

        <input
          type="number"
          value={maxEmployees}
          onChange={(e) => setMaxEmployees(e.target.value)}
          placeholder="Max employees"
          className="filter-input"
        />

        <input
          type="number"
          value={minRating}
          onChange={(e) => setMinRating(e.target.value)}
          placeholder="Min rating"
          className="filter-input"
          step="0.1"
        />

        <input
          type="number"
          value={maxRating}
          onChange={(e) => setMaxRating(e.target.value)}
          placeholder="Max rating"
          className="filter-input"
          step="0.1"
        />

        <button onClick={clearFilters} className="secondary-btn">
          Clear Filters
        </button>
      </div>

      {/* Tag Filters */}
      {availableTags.length > 0 && (
        <div className="tags-filter-section">
          <h4>Filter by Tags:</h4>
          <div className="tag-filters">
            {availableTags.slice(0, 15).map(tag => (
              <button
                key={tag.id}
                onClick={() => toggleTagFilter(tag.name)}
                className={`tag-filter-btn ${selectedTags.includes(tag.name) ? 'active' : ''}`}
                style={{
                  borderColor: selectedTags.includes(tag.name) ? tag.color : '#e2e8f0',
                  backgroundColor: selectedTags.includes(tag.name) ? tag.color + '20' : 'transparent'
                }}
              >
                {tag.name} ({tag.usage_count})
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="companies-stats">
        <span className="stat-item">
          Showing {companies.length} of {total} companies
        </span>
      </div>

      {companies.length === 0 ? (
        <div className="empty-state">
          <p>No companies found. {searchQuery || activityFilter !== 'all' || minEmployees || maxEmployees ? 'Try adjusting your filters.' : 'No companies available.'}</p>
        </div>
      ) : (
        <div className="companies-table-container">
          <table className="companies-table">
            <thead>
              <tr>
                <th>
                  <input
                    type="checkbox"
                    checked={companies.length > 0 && selectedCompanies.size === companies.length}
                    onChange={toggleSelectAll}
                    title="Select all companies"
                  />
                </th>
                <th></th>
                <th>Company Name</th>
                <th>Code</th>
                <th>Activity</th>
                <th>Tags</th>
                <th>Emails</th>
                <th>Phone</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {companies.map((company) => (
                <>
                  <tr key={company.id} className={expandedCompany === company.id ? 'expanded-row' : ''}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedCompanies.has(company.id)}
                        onChange={() => toggleCompanySelection(company.id)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </td>
                    <td>
                      <button
                        onClick={() => setExpandedCompany(expandedCompany === company.id ? null : company.id)}
                        className="expand-btn"
                      >
                        {expandedCompany === company.id ? '▼' : '▶'}
                      </button>
                    </td>
                    <td>
                      <strong>{company.company_name}</strong>
                      {company.website && (
                        <div>
                          <a href={company.website} target="_blank" rel="noopener noreferrer" className="website-link">
                            🔗 {company.website}
                          </a>
                        </div>
                      )}
                    </td>
                    <td>{company.company_code || '-'}</td>
                    <td>
                      {company.activity ? (
                        <span className="activity-badge">{company.activity}</span>
                      ) : '-'}
                    </td>
                    <td>
                      <div className="company-tags">
                        {company.tags && company.tags.length > 0 ? (
                          company.tags.map(tag => (
                            <span key={tag} className="tag-badge">
                              {tag}
                              <button
                                onClick={() => removeTagFromCompany(company, tag)}
                                className="tag-remove-btn"
                              >
                                ×
                              </button>
                            </span>
                          ))
                        ) : (
                          <span className="no-tags">No tags</span>
                        )}
                        <button
                          onClick={() => setEditingTags(editingTags === company.id ? null : company.id)}
                          className="add-tag-btn"
                          title="Add tags"
                        >
                          +
                        </button>
                      </div>
                      {editingTags === company.id && (
                        <div className="tag-selector">
                          {availableTags.map(tag => (
                            <button
                              key={tag.id}
                              onClick={() => addTagToCompany(company, tag.name)}
                              className="tag-option"
                              disabled={company.tags?.includes(tag.name)}
                              style={{ borderColor: tag.color }}
                            >
                              {tag.name}
                            </button>
                          ))}
                        </div>
                      )}
                    </td>
                    <td>
                      {company.extracted_emails && company.extracted_emails.length > 0 ? (
                        <div className="extracted-emails">
                          {company.extracted_emails.slice(0, 2).map((email, idx) => (
                            <a key={idx} href={`mailto:${email}`} className="email-link">
                              {email}
                            </a>
                          ))}
                          {company.extracted_emails.length > 2 && (
                            <span className="more-emails">+{company.extracted_emails.length - 2} more</span>
                          )}
                        </div>
                      ) : company.email ? (
                        <a href={`mailto:${company.email}`} className="email-link">
                          {company.email}
                        </a>
                      ) : '-'}
                    </td>
                    <td>{company.phone || '-'}</td>
                    <td>
                      <div className="scrape-buttons">
                        <button
                          onClick={() => scrapeCompanyWebsite(company)}
                          disabled={scrapingCompanyId === company.id || deepScrapingCompanyId === company.id}
                          className="scrape-btn"
                          title={hasValidWebsite(company.website) ? "Quick scrape: homepage only" : "Generate AI tags from company info"}
                        >
                          {scrapingCompanyId === company.id ? '⏳' : (hasValidWebsite(company.website) ? '🔍' : '🏷️')} {hasValidWebsite(company.website) ? 'Quick' : 'Tag'}
                        </button>
                        {hasValidWebsite(company.website) && (
                          <button
                            onClick={() => deepScrapeCompany(company)}
                            disabled={deepScrapingCompanyId === company.id || scrapingCompanyId === company.id}
                            className="deep-scrape-btn"
                            title="Deep scrape: multiple pages, emails, personnel, social media"
                          >
                            {deepScrapingCompanyId === company.id ? '⏳' : '🔬'} Deep
                          </button>
                        )}
                      </div>
                      {company.last_scraped_at && (
                        <div className="scraped-info">
                          Quick: {new Date(company.last_scraped_at).toLocaleDateString()}
                        </div>
                      )}
                      {company.deep_scraped_at && (
                        <div className="scraped-info">
                          Deep: {new Date(company.deep_scraped_at).toLocaleDateString()} ({company.deep_scrape_pages_found} pages)
                        </div>
                      )}
                    </td>
                  </tr>
                  {expandedCompany === company.id && (
                    <tr className="expanded-content">
                      <td colSpan="9">
                        <div className="company-details">
                          <div className="detail-section">
                            <h4>Business Summary</h4>
                            <p>{company.business_summary || 'No summary available. Click "Scrape" to generate.'}</p>
                          </div>

                          {company.extracted_emails && company.extracted_emails.length > 0 && (
                            <div className="detail-section">
                              <h4>All Extracted Emails ({company.extracted_emails.length})</h4>
                              {company.email_pattern && (
                                <p className="email-pattern">Pattern detected: <strong>{company.email_pattern}</strong></p>
                              )}
                              <div className="email-list">
                                {company.extracted_emails.map((email, idx) => (
                                  <a key={idx} href={`mailto:${email}`} className="email-link">
                                    {email}
                                  </a>
                                ))}
                              </div>
                            </div>
                          )}

                          {company.key_personnel && Array.isArray(company.key_personnel) && company.key_personnel.length > 0 && (
                            <div className="detail-section">
                              <h4>Key Personnel ({company.key_personnel.length})</h4>
                              <div className="personnel-list">
                                {company.key_personnel.map((person, idx) => (
                                  <div key={idx} className="personnel-item">
                                    <strong>{person.name}</strong> - {person.title}
                                    {person.email && (
                                      <a href={`mailto:${person.email}`} className="email-link"> {person.email}</a>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {company.phone_numbers && company.phone_numbers.length > 0 && (
                            <div className="detail-section">
                              <h4>Phone Numbers ({company.phone_numbers.length})</h4>
                              <div className="phone-list">
                                {company.phone_numbers.map((phone, idx) => (
                                  <a key={idx} href={`tel:${phone}`} className="phone-link">
                                    {phone}
                                  </a>
                                ))}
                              </div>
                            </div>
                          )}

                          {company.social_media && Object.keys(company.social_media).length > 0 && (
                            <div className="detail-section">
                              <h4>Social Media</h4>
                              <div className="social-links">
                                {company.social_media.linkedin && (
                                  <a href={company.social_media.linkedin} target="_blank" rel="noopener noreferrer" className="social-link linkedin">
                                    LinkedIn
                                  </a>
                                )}
                                {company.social_media.twitter && (
                                  <a href={company.social_media.twitter} target="_blank" rel="noopener noreferrer" className="social-link twitter">
                                    Twitter
                                  </a>
                                )}
                                {company.social_media.facebook && (
                                  <a href={company.social_media.facebook} target="_blank" rel="noopener noreferrer" className="social-link facebook">
                                    Facebook
                                  </a>
                                )}
                                {company.social_media.instagram && (
                                  <a href={company.social_media.instagram} target="_blank" rel="noopener noreferrer" className="social-link instagram">
                                    Instagram
                                  </a>
                                )}
                                {company.social_media.youtube && (
                                  <a href={company.social_media.youtube} target="_blank" rel="noopener noreferrer" className="social-link youtube">
                                    YouTube
                                  </a>
                                )}
                              </div>
                            </div>
                          )}

                          {company.services && company.services.length > 0 && (
                            <div className="detail-section">
                              <h4>Services/Products</h4>
                              <div className="tag-list">
                                {company.services.map((service, idx) => (
                                  <span key={idx} className="service-tag">{service}</span>
                                ))}
                              </div>
                            </div>
                          )}

                          {company.technologies && company.technologies.length > 0 && (
                            <div className="detail-section">
                              <h4>Technologies Detected</h4>
                              <div className="tag-list">
                                {company.technologies.map((tech, idx) => (
                                  <span key={idx} className="tech-tag">{tech}</span>
                                ))}
                              </div>
                            </div>
                          )}

                          {company.certifications && company.certifications.length > 0 && (
                            <div className="detail-section">
                              <h4>Certifications & Awards</h4>
                              <div className="tag-list">
                                {company.certifications.map((cert, idx) => (
                                  <span key={idx} className="cert-tag">{cert}</span>
                                ))}
                              </div>
                            </div>
                          )}

                          <div className="detail-section">
                            <h4>Additional Information</h4>
                            {company.founded_year && <p><strong>Founded:</strong> {company.founded_year}</p>}
                            {company.employee_count && <p><strong>Employees:</strong> ~{company.employee_count}</p>}
                            <p><strong>Address:</strong> {company.address || 'Not available'}</p>
                            <p><strong>Original Employees:</strong> {company.employees || 'Not available'}</p>
                            <p><strong>Rating:</strong> {company.scorist_rating || 'Not available'}</p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>

          {hasMore && (
            <div className="load-more-section">
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className="primary-btn load-more-btn"
              >
                {loadingMore ? 'Loading...' : `Load More (${total - companies.length} remaining)`}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Add to Contact List Modal */}
      {showAddToListModal && (
        <div className="modal-overlay" onClick={() => setShowAddToListModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Add Companies to Contact List</h3>
            <p>Select a contact list to add {selectedCompanies.size} selected companies:</p>

            {contactLists.length === 0 ? (
              <div className="empty-state">
                <p>You don't have any contact lists yet.</p>
                <button onClick={() => navigate('/contact-lists')} className="primary-btn">
                  Create Contact List
                </button>
              </div>
            ) : (
              <>
                <select
                  value={selectedListId}
                  onChange={(e) => setSelectedListId(e.target.value)}
                  className="modal-select"
                >
                  <option value="">Select a list...</option>
                  {contactLists.map(list => (
                    <option key={list.id} value={list.id}>{list.name}</option>
                  ))}
                </select>

                <div className="modal-actions">
                  <button onClick={() => setShowAddToListModal(false)} className="secondary-btn">
                    Cancel
                  </button>
                  <button
                    onClick={addCompaniesToList}
                    disabled={!selectedListId || addingToList}
                    className="primary-btn"
                  >
                    {addingToList ? 'Adding...' : 'Add to List'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
