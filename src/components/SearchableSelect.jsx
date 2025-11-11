import { useState, useRef, useEffect } from 'react'
import '../styles/SearchableSelect.css'

export default function SearchableSelect({ options, value, onChange, placeholder = 'Search...' }) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const containerRef = useRef(null)

  // Ensure options is an array
  const safeOptions = Array.isArray(options) ? options : []

  const filteredOptions = safeOptions.filter(option =>
    option && option.toLowerCase().includes(searchTerm.toLowerCase())
  )

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelect = (option) => {
    onChange(option)
    setIsOpen(false)
    setSearchTerm('')
  }

  const handleClear = () => {
    onChange('')
    setSearchTerm('')
  }

  return (
    <div className="searchable-select" ref={containerRef}>
      <div className="searchable-select-input-wrapper">
        <input
          type="text"
          className="searchable-select-input"
          placeholder={value || placeholder}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={() => setIsOpen(true)}
        />
        {value && (
          <button
            type="button"
            className="searchable-select-clear"
            onClick={handleClear}
          >
            ×
          </button>
        )}
      </div>

      {isOpen && (
        <div className="searchable-select-dropdown">
          <div className="searchable-select-options">
            <div
              className="searchable-select-option"
              onClick={() => handleSelect('')}
            >
              <em>All Activities</em>
            </div>
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option, index) => (
                <div
                  key={index}
                  className={`searchable-select-option ${value === option ? 'selected' : ''}`}
                  onClick={() => handleSelect(option)}
                >
                  {option}
                </div>
              ))
            ) : (
              <div className="searchable-select-no-results">
                No activities found
              </div>
            )}
          </div>
          <div className="searchable-select-footer">
            {filteredOptions.length} of {safeOptions.length} activities
          </div>
        </div>
      )}
    </div>
  )
}
