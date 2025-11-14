import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { useSubscription } from '../contexts/SubscriptionContext'
import '../styles/ContactListDetail.css'

export default function ContactListDetail() {
  const { listId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { subscription } = useSubscription()
  const [list, setList] = useState(null)
  const [contacts, setContacts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false)
  const [newContact, setNewContact] = useState({ email: '', name: '', company: '', notes: '' })
  const [adding, setAdding] = useState(false)

  // Check if user has access to contact lists (Starter or Professional plan)
  const hasAccess = subscription?.tier === 'starter' || subscription?.tier === 'professional'

  useEffect(() => {
    if (user?.id) {
      loadListAndContacts()
    }
  }, [listId, user])

  const loadListAndContacts = async () => {
    try {
      setLoading(true)

      // Load list details
      const { data: listData, error: listError } = await supabase
        .from('contact_lists')
        .select('*')
        .eq('id', listId)
        .eq('user_id', user.id)
        .single()

      if (listError) throw listError
      setList(listData)

      // Load contacts
      const { data: contactsData, error: contactsError } = await supabase
        .from('contacts')
        .select('*')
        .eq('list_id', listId)
        .order('created_at', { ascending: false })

      if (contactsError) throw contactsError
      setContacts(contactsData || [])
    } catch (error) {
      console.error('Error loading data:', error)
      alert('Failed to load contact list')
      navigate('/contact-lists')
    } finally {
      setLoading(false)
    }
  }

  const handleAddContactClick = () => {
    if (!hasAccess) {
      setShowUpgradePrompt(true)
      return
    }
    setShowAddModal(true)
  }

  const addContact = async () => {
    if (!hasAccess) {
      alert('Please upgrade to Starter or Professional plan to add contacts')
      return
    }

    if (!newContact.email.trim()) {
      alert('Please enter an email address')
      return
    }

    // Basic email validation
    if (!newContact.email.includes('@')) {
      alert('Please enter a valid email address')
      return
    }

    try {
      setAdding(true)
      const { error } = await supabase
        .from('contacts')
        .insert({
          list_id: listId,
          email: newContact.email.trim(),
          name: newContact.name.trim(),
          company: newContact.company.trim(),
          notes: newContact.notes.trim()
        })

      if (error) throw error

      setShowAddModal(false)
      setNewContact({ email: '', name: '', company: '', notes: '' })
      loadListAndContacts()
    } catch (error) {
      console.error('Error adding contact:', error)
      alert('Failed to add contact')
    } finally {
      setAdding(false)
    }
  }

  const deleteContact = async (contactId, contactEmail) => {
    if (!confirm(`Are you sure you want to delete ${contactEmail}?`)) {
      return
    }

    try {
      const { error } = await supabase
        .from('contacts')
        .delete()
        .eq('id', contactId)

      if (error) throw error

      loadListAndContacts()
    } catch (error) {
      console.error('Error deleting contact:', error)
      alert('Failed to delete contact')
    }
  }

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-state">Loading contacts...</div>
      </div>
    )
  }

  if (!list) {
    return (
      <div className="page-container">
        <div className="empty-state">
          <p>Contact list not found</p>
        </div>
      </div>
    )
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <button onClick={() => navigate('/contact-lists')} className="back-btn">
            ← Back to Lists
          </button>
          <h2 className="page-title">{list.name}</h2>
          {list.description && <p className="list-subtitle">{list.description}</p>}
        </div>
        <button onClick={handleAddContactClick} className="primary-btn">
          {hasAccess ? '+ Add Contact' : '🔒 Upgrade to Add Contacts'}
        </button>
      </div>

      <div className="contacts-stats">
        <span className="stat-item">
          Total Contacts: <strong>{contacts.length}</strong>
        </span>
      </div>

      {contacts.length === 0 ? (
        <div className="empty-state">
          <p>No contacts in this list yet. Add your first contact to get started!</p>
        </div>
      ) : (
        <div className="contacts-table-container">
          <table className="contacts-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Company</th>
                <th>Notes</th>
                <th>Added</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {contacts.map((contact) => (
                <tr key={contact.id}>
                  <td>{contact.name || '-'}</td>
                  <td>
                    <a href={`mailto:${contact.email}`} className="email-link">
                      {contact.email}
                    </a>
                  </td>
                  <td>{contact.company || '-'}</td>
                  <td className="notes-cell">{contact.notes || '-'}</td>
                  <td>{new Date(contact.created_at).toLocaleDateString()}</td>
                  <td>
                    <button
                      onClick={() => deleteContact(contact.id, contact.email)}
                      className="delete-btn-small"
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

      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add New Contact</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="modal-close"
              >
                ×
              </button>
            </div>

            <div className="modal-body">
              <div className="form-group">
                <label>Email Address *</label>
                <input
                  type="email"
                  value={newContact.email}
                  onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
                  placeholder="contact@example.com"
                  className="form-input"
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label>Name</label>
                <input
                  type="text"
                  value={newContact.name}
                  onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                  placeholder="John Doe"
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label>Company</label>
                <input
                  type="text"
                  value={newContact.company}
                  onChange={(e) => setNewContact({ ...newContact, company: e.target.value })}
                  placeholder="Company Name"
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label>Notes</label>
                <textarea
                  value={newContact.notes}
                  onChange={(e) => setNewContact({ ...newContact, notes: e.target.value })}
                  rows="3"
                  placeholder="Additional notes about this contact..."
                  className="form-textarea"
                />
              </div>
            </div>

            <div className="modal-footer">
              <button
                onClick={() => setShowAddModal(false)}
                className="secondary-btn"
              >
                Cancel
              </button>
              <button
                onClick={addContact}
                disabled={adding}
                className="primary-btn"
              >
                {adding ? 'Adding...' : 'Add Contact'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showUpgradePrompt && (
        <div className="modal-overlay" onClick={() => setShowUpgradePrompt(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>🚀 Upgrade Required</h3>
              <button
                onClick={() => setShowUpgradePrompt(false)}
                className="modal-close"
              >
                ×
              </button>
            </div>

            <div className="modal-body">
              <p style={{ marginBottom: '1rem', fontSize: '15px', color: '#64748b' }}>
                Contact Lists is a premium feature available on Starter and Professional plans.
              </p>
              <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', marginBottom: '1rem' }}>
                <p style={{ margin: '0 0 12px 0', fontWeight: '600', color: '#1e293b' }}>
                  With Contact Lists you can:
                </p>
                <ul style={{ margin: 0, paddingLeft: '20px', color: '#475569' }}>
                  <li>Organize your contacts into custom lists</li>
                  <li>Create targeted email campaigns</li>
                  <li>Import and manage contacts easily</li>
                  <li>Track engagement per list</li>
                </ul>
              </div>
            </div>

            <div className="modal-footer">
              <button
                onClick={() => setShowUpgradePrompt(false)}
                className="secondary-btn"
              >
                Maybe Later
              </button>
              <button
                onClick={() => navigate('/settings')}
                className="primary-btn"
              >
                View Plans & Pricing
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
