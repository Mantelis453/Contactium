import { useState, useEffect } from 'react'
import SearchableSelect from './SearchableSelect'
import API_URL from '../config/api'
import '../styles/Companies.css'

export default function Companies() {
  const [companies, setCompanies] = useState([])
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)

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

  // Quick filter categories for Lithuanian businesses
  const quickFilters = [
    { label: 'Maitinimo įstaigos', search: 'maitinimo' },
    { label: 'Reklamos agentūros', search: 'reklamos' },
    { label: 'IT įmonės', search: 'informacijos technologij' },
    { label: 'Statybos įmonės', search: 'statybos' },
    { label: 'Transporto įmonės', search: 'transporto' },
    { label: 'Prekybos įmonės', search: 'prekyb' }
  ]

  // Debounce search query - wait 500ms after user stops typing
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery)
    }, 500)

    return () => clearTimeout(timer)
  }, [searchQuery])

  useEffect(() => {
    setOffset(0)
    setCompanies([])
    loadCompanies(true)
    loadActivities()
  }, [activityFilter, minEmployees, maxEmployees, minRating, maxRating, debouncedSearch])

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

  const clearFilters = () => {
    setSearchQuery('')
    setActivityFilter('all')
    setMinEmployees('')
    setMaxEmployees('')
    setMinRating('')
    setMaxRating('')
  }

  const applyQuickFilter = (searchTerm) => {
    setSearchQuery(searchTerm)
    // Clear other filters when applying quick filter
    setActivityFilter('all')
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

        <div className="quick-filters">
          {quickFilters.map((filter, index) => (
            <button
              key={index}
              onClick={() => applyQuickFilter(filter.search)}
              className={`quick-filter-btn ${searchQuery === filter.search ? 'active' : ''}`}
              title={`Filter by ${filter.label}`}
            >
              {filter.label}
            </button>
          ))}
        </div>

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
                <th>Company Name</th>
                <th>Code</th>
                <th>Activity</th>
                <th>Employees</th>
                <th>Rating</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Address</th>
              </tr>
            </thead>
            <tbody>
              {companies.map((company) => (
                <tr key={company.id}>
                  <td><strong>{company.company_name}</strong></td>
                  <td>{company.company_code || '-'}</td>
                  <td>
                    {company.activity ? (
                      <span className="activity-badge">{company.activity}</span>
                    ) : '-'}
                  </td>
                  <td>{company.employees || '-'}</td>
                  <td>{company.scorist_rating !== null && company.scorist_rating !== undefined ? company.scorist_rating : '-'}</td>
                  <td>
                    {company.email ? (
                      <a href={`mailto:${company.email}`} className="email-link">
                        {company.email}
                      </a>
                    ) : '-'}
                  </td>
                  <td>{company.phone || '-'}</td>
                  <td className="address-cell">{company.address || '-'}</td>
                </tr>
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
