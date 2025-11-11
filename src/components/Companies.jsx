import { useState, useEffect } from 'react'
import SearchableSelect from './SearchableSelect'
import '../styles/Companies.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

export default function Companies() {
  const [companies, setCompanies] = useState([])
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)
  const [importing, setImporting] = useState(false)

  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [activityFilter, setActivityFilter] = useState('all')
  const [minEmployees, setMinEmployees] = useState('')
  const [maxEmployees, setMaxEmployees] = useState('')
  const [minRating, setMinRating] = useState('')
  const [maxRating, setMaxRating] = useState('')

  // CSV Upload
  const [csvFile, setCsvFile] = useState(null)

  useEffect(() => {
    loadCompanies()
    loadActivities()
  }, [activityFilter, minEmployees, maxEmployees, minRating, maxRating, searchQuery])

  const loadCompanies = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        ...(activityFilter !== 'all' && { activity: activityFilter }),
        ...(minEmployees && { minEmployees }),
        ...(maxEmployees && { maxEmployees }),
        ...(minRating && { minRating }),
        ...(maxRating && { maxRating }),
        ...(searchQuery && { search: searchQuery })
      })

      const response = await fetch(`${API_URL}/api/companies?${params}`)
      const data = await response.json()

      if (response.ok) {
        setCompanies(data.companies || [])
      } else {
        console.error('Error loading companies:', data.error)
      }
    } catch (error) {
      console.error('Error loading companies:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadActivities = async () => {
    try {
      console.log('Loading activities from:', `${API_URL}/api/companies/activities`)
      const response = await fetch(`${API_URL}/api/companies/activities`)
      const data = await response.json()

      console.log('Activities response:', response.ok, 'Activities count:', data.activities?.length)
      if (response.ok) {
        setActivities(data.activities || [])
      }
    } catch (error) {
      console.error('Error loading activities:', error)
    }
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file && file.type === 'text/csv') {
      setCsvFile(file)
    } else {
      alert('Please select a valid CSV file')
    }
  }

  const parseCSV = (text) => {
    const lines = text.split('\n')
    const headers = lines[0].split(',').map(h => h.trim())
    const companies = []

    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue

      const values = lines[i].split(',').map(v => v.trim())
      const company = {}

      headers.forEach((header, index) => {
        company[header] = values[index] || null
      })

      if (company.company_name) {
        companies.push(company)
      }
    }

    return companies
  }

  const handleUploadCSV = async () => {
    if (!csvFile) {
      alert('Please select a CSV file first')
      return
    }

    try {
      setImporting(true)
      const text = await csvFile.text()
      const companiesData = parseCSV(text)

      if (companiesData.length === 0) {
        alert('No valid companies found in CSV file')
        return
      }

      const response = await fetch(`${API_URL}/api/companies/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companies: companiesData
        })
      })

      const data = await response.json()

      if (response.ok) {
        alert(`Successfully imported ${data.imported} companies!`)
        setCsvFile(null)
        loadCompanies()
        loadActivities()
      } else {
        alert(`Error importing companies: ${data.error}`)
      }
    } catch (error) {
      console.error('Error uploading CSV:', error)
      alert('Error uploading CSV file')
    } finally {
      setImporting(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this company?')) return

    try {
      const response = await fetch(`${API_URL}/api/companies/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        loadCompanies()
      } else {
        const data = await response.json()
        alert(`Error deleting company: ${data.error}`)
      }
    } catch (error) {
      console.error('Error deleting company:', error)
      alert('Error deleting company')
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
        <div className="csv-upload-section">
          <input
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            id="csv-file-input"
            style={{ display: 'none' }}
          />
          <label htmlFor="csv-file-input" className="secondary-btn">
            Choose CSV File
          </label>
          {csvFile && <span className="file-name">{csvFile.name}</span>}
          {csvFile && (
            <button
              onClick={handleUploadCSV}
              disabled={importing}
              className="primary-btn"
            >
              {importing ? 'Importing...' : 'Import CSV'}
            </button>
          )}
        </div>
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

      <div className="companies-stats">
        <span className="stat-item">Total: {companies.length} companies</span>
      </div>

      {companies.length === 0 ? (
        <div className="empty-state">
          <p>No companies found. {searchQuery || activityFilter !== 'all' || minEmployees || maxEmployees ? 'Try adjusting your filters.' : 'Import a CSV file to get started!'}</p>
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
                <th>Actions</th>
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
                  <td>
                    <button
                      onClick={() => handleDelete(company.id)}
                      className="delete-btn"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
