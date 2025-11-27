import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { useSubscription } from '../contexts/SubscriptionContext'
import { useLanguage } from '../contexts/LanguageContext'
import '../styles/ContactLists.css'

export default function ContactLists() {
  const { t } = useLanguage()
  const { user } = useAuth()
  const navigate = useNavigate()
  const { subscription } = useSubscription()
  const [lists, setLists] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false)
  const [newList, setNewList] = useState({ name: '', description: '' })
  const [creating, setCreating] = useState(false)

  // Check if user is on free tier
  const isFree = subscription?.tier === 'free'

  // Check if user has created a list this month
  const hasCreatedListThisMonth = () => {
    if (!isFree) return false

    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()

    return lists.some(list => {
      const listDate = new Date(list.created_at)
      return listDate.getMonth() === currentMonth && listDate.getFullYear() === currentYear
    })
  }

  const canCreateList = !isFree || !hasCreatedListThisMonth()

  useEffect(() => {
    if (user?.id) {
      loadLists()
    }
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

      if (error) {
        // Check if it's a table not found error
        if (error.code === 'PGRST204' || error.message?.includes('does not exist')) {
          alert('Contact Lists feature not set up yet. Please run the database migration script from db/contact_lists_schema.sql in your Supabase SQL Editor.')
          navigate('/')
          return
        }
        throw error
      }

      // Format the data to include contact count
      const formattedLists = data.map(list => ({
        ...list,
        contactCount: list.contacts[0]?.count || 0
      }))

      setLists(formattedLists)
    } catch (error) {
      console.error('Error loading lists:', error)
      alert('Failed to load contact lists. Please check the console for details.')
    } finally {
      setLoading(false)
    }
  }

  const handleNewListClick = () => {
    if (!canCreateList) {
      setShowUpgradePrompt(true)
      return
    }
    setShowCreateModal(true)
  }

  const createList = async () => {
    if (!canCreateList) {
      alert('Free tier users can only create 1 contact list per month. Please upgrade to create unlimited lists.')
      return
    }

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
        <h2 className="page-title">{t('contactLists.title')}</h2>
        <button
          onClick={handleNewListClick}
          className="primary-btn"
          title={!canCreateList ? 'Free tier: 1 list per month. Upgrade for unlimited lists.' : ''}
        >
          {canCreateList ? '+ New List' : '🔒 Upgrade for More Lists'}
        </button>
      </div>

      {isFree && hasCreatedListThisMonth() && (
        <div className="info-banner" style={{
          background: '#fff3cd',
          border: '1px solid #ffc107',
          borderRadius: '8px',
          padding: '12px 16px',
          marginBottom: '24px',
          color: '#856404'
        }}>
          📋 Free tier: You've created your contact list for this month. Upgrade to Starter or Professional for unlimited contact lists.
        </div>
      )}

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
                  >{t('dashboard.view')}</button>
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
                  <span className="stat-label">{t('contactLists.contacts')}</span>
                </div>
                <div className="stat">
                  <span className="stat-value">
                    {new Date(list.created_at).toLocaleDateString()}
                  </span>
                  <span className="stat-label">{t('campaigns.createdAt')}</span>
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
              >{t('common.cancel')}</button>
              <button
                onClick={createList}
                disabled={creating}
                className="primary-btn"
              >
                {creating ? {t('createCampaign.creating')} : 'Create List'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showUpgradePrompt && (
        <div className="modal-overlay" onClick={() => setShowUpgradePrompt(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>🚀 Contact List Limit Reached</h3>
              <button
                onClick={() => setShowUpgradePrompt(false)}
                className="modal-close"
              >
                ×
              </button>
            </div>

            <div className="modal-body">
              <p style={{ marginBottom: '1rem', fontSize: '15px', color: '#64748b' }}>
                Free tier users can create <strong>1 contact list per month</strong>.
              </p>
              <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', marginBottom: '1rem' }}>
                <p style={{ margin: '0 0 12px 0', fontWeight: '600', color: '#1e293b' }}>
                  Upgrade to get:
                </p>
                <ul style={{ margin: 0, paddingLeft: '20px', color: '#475569' }}>
                  <li>Unlimited contact lists</li>
                  <li>Access to Companies database</li>
                  <li>Bulk import from Companies page</li>
                  <li>Up to 500 emails/month (Starter) or 2,500/month (Professional)</li>
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
                onClick={() => navigate('/subscription')}
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
