import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import '../styles/Admin.css'

export default function Admin() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('support')

  // Support messages state
  const [supportMessages, setSupportMessages] = useState([])
  const [selectedMessage, setSelectedMessage] = useState(null)
  const [messageFilter, setMessageFilter] = useState('all')

  // Users state
  const [users, setUsers] = useState([])
  const [userSearch, setUserSearch] = useState('')

  // Stats
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalCampaigns: 0,
    totalEmails: 0,
    openTickets: 0
  })

  useEffect(() => {
    if (user?.id) {
      checkAdminAccess()
    }
  }, [user])

  useEffect(() => {
    if (isAdmin) {
      loadStats()
      loadSupportMessages()
      loadUsers()
    }
  }, [isAdmin, messageFilter])

  const checkAdminAccess = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_users')
        .select('role')
        .eq('user_id', user.id)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking admin access:', error)
      }

      setIsAdmin(!!data)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-stats?userId=${user.id}`,
        {
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      )
      const statsData = await response.json()

      if (response.ok) {
        setStats(statsData)
      } else {
        console.error('Error loading stats:', statsData.error)
      }
    } catch (error) {
      console.error('Error loading stats:', error)
    }
  }

  const loadSupportMessages = async () => {
    try {
      let query = supabase
        .from('support_messages')
        .select('*')
        .order('created_at', { ascending: false })

      if (messageFilter !== 'all') {
        query = query.eq('status', messageFilter)
      }

      const { data, error } = await query

      if (error) throw error
      setSupportMessages(data || [])
    } catch (error) {
      console.error('Error loading support messages:', error)
    }
  }

  const loadUsers = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-users?userId=${user.id}`,
        {
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      )
      const data = await response.json()

      if (response.ok) {
        setUsers(data.users || [])
      } else {
        console.error('Error loading users:', data.error)
        setUsers([])
      }
    } catch (error) {
      console.error('Error loading users:', error)
      setUsers([])
    }
  }

  const updateMessageStatus = async (messageId, newStatus) => {
    try {
      const { error } = await supabase
        .from('support_messages')
        .update({
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', messageId)

      if (error) throw error

      loadSupportMessages()
      loadStats()

      if (selectedMessage?.id === messageId) {
        setSelectedMessage({ ...selectedMessage, status: newStatus })
      }
    } catch (error) {
      console.error('Error updating message:', error)
      alert('Failed to update message status')
    }
  }

  const updateMessagePriority = async (messageId, newPriority) => {
    try {
      const { error } = await supabase
        .from('support_messages')
        .update({
          priority: newPriority,
          updated_at: new Date().toISOString()
        })
        .eq('id', messageId)

      if (error) throw error

      loadSupportMessages()

      if (selectedMessage?.id === messageId) {
        setSelectedMessage({ ...selectedMessage, priority: newPriority })
      }
    } catch (error) {
      console.error('Error updating priority:', error)
      alert('Failed to update priority')
    }
  }

  const saveAdminNotes = async (messageId, notes) => {
    try {
      const { error } = await supabase
        .from('support_messages')
        .update({
          admin_notes: notes,
          updated_at: new Date().toISOString()
        })
        .eq('id', messageId)

      if (error) throw error
      alert('Notes saved!')
    } catch (error) {
      console.error('Error saving notes:', error)
      alert('Failed to save notes')
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusColor = (status) => {
    const colors = {
      open: '#f59e0b',
      in_progress: '#3b82f6',
      resolved: '#10b981',
      closed: '#6b7280'
    }
    return colors[status] || '#6b7280'
  }

  const getPriorityColor = (priority) => {
    const colors = {
      low: '#6b7280',
      normal: '#3b82f6',
      high: '#f59e0b',
      urgent: '#ef4444'
    }
    return colors[priority] || '#3b82f6'
  }

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-state">Checking admin access...</div>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="page-container">
        <div className="admin-denied">
          <h2>Access Denied</h2>
          <p>You don't have permission to access the admin panel.</p>
          <button onClick={() => navigate('/')} className="primary-btn">
            Go to Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="page-container admin-page">
      <div className="admin-header">
        <div>
          <h2 className="page-title">Admin Panel</h2>
          <p className="admin-subtitle">Manage users, support tickets, and system settings</p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="admin-stats">
        <div className="admin-stat-card">
          <div className="admin-stat-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <div className="admin-stat-content">
            <div className="admin-stat-value">{stats.totalUsers}</div>
            <div className="admin-stat-label">Total Users</div>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-icon admin-stat-icon-primary">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
              <polyline points="22,6 12,13 2,6" />
            </svg>
          </div>
          <div className="admin-stat-content">
            <div className="admin-stat-value">{stats.totalCampaigns}</div>
            <div className="admin-stat-label">Total Campaigns</div>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-icon admin-stat-icon-success">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
          </div>
          <div className="admin-stat-content">
            <div className="admin-stat-value">{stats.totalEmails.toLocaleString()}</div>
            <div className="admin-stat-label">Emails Sent</div>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-icon admin-stat-icon-warning">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <div className="admin-stat-content">
            <div className="admin-stat-value">{stats.openTickets}</div>
            <div className="admin-stat-label">Open Tickets</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="admin-tabs">
        <button
          className={`admin-tab ${activeTab === 'support' ? 'active' : ''}`}
          onClick={() => setActiveTab('support')}
        >
          Support Messages
        </button>
        <button
          className={`admin-tab ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          Users
        </button>
      </div>

      {/* Support Messages Tab */}
      {activeTab === 'support' && (
        <div className="admin-content">
          <div className="admin-section">
            <div className="admin-section-header">
              <h3>Support Messages</h3>
              <div className="admin-filters">
                <select
                  value={messageFilter}
                  onChange={(e) => setMessageFilter(e.target.value)}
                  className="admin-filter-select"
                >
                  <option value="all">All Messages</option>
                  <option value="open">Open</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
            </div>

            <div className="admin-messages-layout">
              {/* Messages List */}
              <div className="admin-messages-list">
                {supportMessages.length === 0 ? (
                  <div className="admin-empty">
                    <p>No support messages found</p>
                  </div>
                ) : (
                  supportMessages.map((message) => (
                    <div
                      key={message.id}
                      className={`admin-message-item ${selectedMessage?.id === message.id ? 'selected' : ''}`}
                      onClick={() => setSelectedMessage(message)}
                    >
                      <div className="admin-message-header">
                        <span
                          className="admin-priority-badge"
                          style={{ backgroundColor: getPriorityColor(message.priority) }}
                        >
                          {message.priority}
                        </span>
                        <span
                          className="admin-status-badge"
                          style={{ backgroundColor: getStatusColor(message.status) }}
                        >
                          {message.status.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="admin-message-subject">{message.subject}</div>
                      <div className="admin-message-meta">
                        <span>{message.user_email}</span>
                        <span>{formatDate(message.created_at)}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Message Detail */}
              <div className="admin-message-detail">
                {selectedMessage ? (
                  <>
                    <div className="admin-detail-header">
                      <h4>{selectedMessage.subject}</h4>
                      <div className="admin-detail-meta">
                        <span>From: {selectedMessage.user_email}</span>
                        <span>Created: {formatDate(selectedMessage.created_at)}</span>
                      </div>
                    </div>

                    <div className="admin-detail-controls">
                      <div className="admin-control-group">
                        <label>Status:</label>
                        <select
                          value={selectedMessage.status}
                          onChange={(e) => updateMessageStatus(selectedMessage.id, e.target.value)}
                        >
                          <option value="open">Open</option>
                          <option value="in_progress">In Progress</option>
                          <option value="resolved">Resolved</option>
                          <option value="closed">Closed</option>
                        </select>
                      </div>
                      <div className="admin-control-group">
                        <label>Priority:</label>
                        <select
                          value={selectedMessage.priority}
                          onChange={(e) => updateMessagePriority(selectedMessage.id, e.target.value)}
                        >
                          <option value="low">Low</option>
                          <option value="normal">Normal</option>
                          <option value="high">High</option>
                          <option value="urgent">Urgent</option>
                        </select>
                      </div>
                    </div>

                    <div className="admin-detail-body">
                      <h5>Message:</h5>
                      <div className="admin-message-content">
                        {selectedMessage.message}
                      </div>
                    </div>

                    <div className="admin-detail-notes">
                      <h5>Admin Notes:</h5>
                      <textarea
                        defaultValue={selectedMessage.admin_notes || ''}
                        placeholder="Add notes about this ticket..."
                        onBlur={(e) => saveAdminNotes(selectedMessage.id, e.target.value)}
                      />
                    </div>
                  </>
                ) : (
                  <div className="admin-empty">
                    <p>Select a message to view details</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="admin-content">
          <div className="admin-section">
            <div className="admin-section-header">
              <h3>Users</h3>
              <div className="admin-filters">
                <input
                  type="text"
                  placeholder="Search users..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="admin-search-input"
                />
              </div>
            </div>

            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>User ID</th>
                    <th>Plan</th>
                    <th>Status</th>
                    <th>Emails Used</th>
                    <th>Period End</th>
                  </tr>
                </thead>
                <tbody>
                  {users
                    .filter(u => !userSearch || u.user_id?.includes(userSearch))
                    .map((userData) => (
                      <tr key={userData.user_id}>
                        <td>
                          <code>{userData.user_id?.substring(0, 8)}...</code>
                        </td>
                        <td>
                          <span className={`admin-plan-badge admin-plan-${userData.tier}`}>
                            {userData.tier}
                          </span>
                        </td>
                        <td>
                          <span className={`admin-status-dot ${userData.status === 'active' ? 'active' : ''}`}>
                            {userData.status}
                          </span>
                        </td>
                        <td>{userData.email_count_this_month || 0}</td>
                        <td>{formatDate(userData.current_period_end)}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
