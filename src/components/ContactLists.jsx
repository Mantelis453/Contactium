import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import '../styles/ContactLists.css'

export default function ContactLists() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [lists, setLists] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newList, setNewList] = useState({ name: '', description: '' })
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    loadLists()
  }, [user])

  const loadLists = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('contact_lists')
        .select(`
          *,
          contacts:contacts(count)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      // Format the data to include contact count
      const formattedLists = data.map(list => ({
        ...list,
        contactCount: list.contacts[0]?.count || 0
      }))

      setLists(formattedLists)
    } catch (error) {
      console.error('Error loading lists:', error)
      alert('Failed to load contact lists')
    } finally {
      setLoading(false)
    }
  }

  const createList = async () => {
    if (!newList.name.trim()) {
      alert('Please enter a list name')
      return
    }

    try {
      setCreating(true)
      const { data, error } = await supabase
        .from('contact_lists')
        .insert({
          user_id: user.id,
          name: newList.name,
          description: newList.description
        })
        .select()
        .single()

      if (error) throw error

      setShowCreateModal(false)
      setNewList({ name: '', description: '' })
      loadLists()
    } catch (error) {
      console.error('Error creating list:', error)
      alert('Failed to create list')
    } finally {
      setCreating(false)
    }
  }

  const deleteList = async (listId, listName) => {
    if (!confirm(`Are you sure you want to delete "${listName}"? This will also delete all contacts in this list.`)) {
      return
    }

    try {
      const { error } = await supabase
        .from('contact_lists')
        .delete()
        .eq('id', listId)

      if (error) throw error

      loadLists()
    } catch (error) {
      console.error('Error deleting list:', error)
      alert('Failed to delete list')
    }
  }

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-state">Loading contact lists...</div>
      </div>
    )
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h2 className="page-title">Contact Lists</h2>
        <button onClick={() => setShowCreateModal(true)} className="primary-btn">
          + New List
        </button>
      </div>

      {lists.length === 0 ? (
        <div className="empty-state">
          <p>No contact lists yet. Create your first list to get started!</p>
        </div>
      ) : (
        <div className="lists-grid">
          {lists.map((list) => (
            <div key={list.id} className="list-card">
              <div className="list-header">
                <h3>{list.name}</h3>
                <div className="list-actions">
                  <button
                    onClick={() => navigate(`/contact-lists/${list.id}`)}
                    className="view-btn"
                    title="View and manage contacts"
                  >
                    View
                  </button>
                  <button
                    onClick={() => deleteList(list.id, list.name)}
                    className="delete-btn-icon"
                    title="Delete list"
                  >
                    ×
                  </button>
                </div>
              </div>

              {list.description && (
                <p className="list-description">{list.description}</p>
              )}

              <div className="list-stats">
                <div className="stat">
                  <span className="stat-value">{list.contactCount}</span>
                  <span className="stat-label">Contacts</span>
                </div>
                <div className="stat">
                  <span className="stat-value">
                    {new Date(list.created_at).toLocaleDateString()}
                  </span>
                  <span className="stat-label">Created</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Create New Contact List</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="modal-close"
              >
                ×
              </button>
            </div>

            <div className="modal-body">
              <div className="form-group">
                <label>List Name *</label>
                <input
                  type="text"
                  value={newList.name}
                  onChange={(e) => setNewList({ ...newList, name: e.target.value })}
                  placeholder="e.g., Tech Startups, Potential Clients"
                  className="form-input"
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={newList.description}
                  onChange={(e) => setNewList({ ...newList, description: e.target.value })}
                  rows="3"
                  placeholder="Optional description of this contact list..."
                  className="form-textarea"
                />
              </div>
            </div>

            <div className="modal-footer">
              <button
                onClick={() => setShowCreateModal(false)}
                className="secondary-btn"
              >
                Cancel
              </button>
              <button
                onClick={createList}
                disabled={creating}
                className="primary-btn"
              >
                {creating ? 'Creating...' : 'Create List'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
