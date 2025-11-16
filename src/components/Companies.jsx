import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import SearchableSelect from './SearchableSelect'
import API_URL from '../config/api'
import '../styles/Companies.css'

export default function Companies() {
  const [companies, setCompanies] = useState([])
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [scrapingCompanyId, setScrapingCompanyId] = useState(null)
  const [expandedCompany, setExpandedCompany] = useState(null)

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

  // Tags
  const [availableTags, setAvailableTags] = useState([])
  const [editingTags, setEditingTags] = useState(null)
  const [newTagInput, setNewTagInput] = useState('')

  // Debounce search query - wait 500ms after user stops typing
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery)
    }, 500)

    return () => clearTimeout(timer)
  }, [searchQuery])

  useEffect(() => {
    loadAvailableTags()
  }, [])

  useEffect(() => {
    setOffset(0)
    setCompanies([])
    loadCompanies(true)
    loadActivities()
  }, [activityFilter, minEmployees, maxEmployees, minRating, maxRating, debouncedSearch, selectedTags])

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
        offset: currentOffset.toString(),
        limit: limit.toString()
      })

      const response = await fetch(`${API_URL}/companies?${params}`)
      const data = await response.json()

      if (response.ok) {
        if (reset) {
          setCompanies(data.companies || [])
        } else {
          setCompanies(prev => [...prev, ...(data.companies || [])])
        }
        setTotal(data.total || 0)
        setHasMore(data.hasMore || false)
        setOffset(currentOffset + limit)
      } else {
        console.error('Error loading companies:', data.error)
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
      const response = await fetch(`${API_URL}/companies-activities`)
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
      </div>

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
                      <button
                        onClick={() => scrapeCompanyWebsite(company)}
                        disabled={scrapingCompanyId === company.id}
                        className="scrape-btn"
                        title={company.website ? "Scrape website for emails and generate AI tags" : "Generate AI tags from company info"}
                      >
                        {scrapingCompanyId === company.id ? '⏳' : (company.website ? '🔍' : '🏷️')} {company.website ? 'Scrape' : 'Tag'}
                      </button>
                      {company.last_scraped_at && (
                        <div className="scraped-info">
                          Last scraped: {new Date(company.last_scraped_at).toLocaleDateString()}
                        </div>
                      )}
                    </td>
                  </tr>
                  {expandedCompany === company.id && (
                    <tr className="expanded-content">
                      <td colSpan="8">
                        <div className="company-details">
                          <div className="detail-section">
                            <h4>Business Summary</h4>
                            <p>{company.business_summary || 'No summary available. Click "Scrape" to generate.'}</p>
                          </div>
                          {company.extracted_emails && company.extracted_emails.length > 0 && (
                            <div className="detail-section">
                              <h4>All Extracted Emails ({company.extracted_emails.length})</h4>
                              <div className="email-list">
                                {company.extracted_emails.map((email, idx) => (
                                  <a key={idx} href={`mailto:${email}`} className="email-link">
                                    {email}
                                  </a>
                                ))}
                              </div>
                            </div>
                          )}
                          <div className="detail-section">
                            <h4>Additional Information</h4>
                            <p><strong>Address:</strong> {company.address || 'Not available'}</p>
                            <p><strong>Employees:</strong> {company.employees || 'Not available'}</p>
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
    </div>
  )
}
