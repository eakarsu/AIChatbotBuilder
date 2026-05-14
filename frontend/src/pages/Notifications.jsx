import React, { useState, useEffect } from 'react';

const API_BASE = '/api';

function getHeaders() {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { ...getHeaders(), ...options.headers },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export default function Notifications() {
  const [items, setItems] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ user_id: '', title: '', message: '', type: 'info' });

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await request('/notifications');
      setItems(Array.isArray(data) ? data : data.items || []);
      try {
        const c = await request('/notifications/unread-count');
        setUnreadCount(c.count || c.unread || 0);
      } catch (_) {}
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleSubmit = async () => {
    try {
      await request('/notifications', { method: 'POST', body: JSON.stringify(form) });
      setShowForm(false);
      setForm({ user_id: '', title: '', message: '', type: 'info' });
      load();
    } catch (e) {
      setError(e.message);
    }
  };

  const handleMarkRead = async (id) => {
    try {
      await request(`/notifications/${id}/read`, { method: 'PUT' });
      load();
    } catch (e) { setError(e.message); }
  };

  const handleMarkAllRead = async () => {
    try {
      await request('/notifications/mark-all-read', { method: 'POST' });
      load();
    } catch (e) { setError(e.message); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete?')) return;
    try {
      await request(`/notifications/${id}`, { method: 'DELETE' });
      load();
    } catch (e) { setError(e.message); }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Notifications</h2>
          <p>Inbox and alert center ({unreadCount} unread)</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn" onClick={handleMarkAllRead}>
            <i className="fa-solid fa-check-double"></i> Mark all read
          </button>
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>
            <i className="fa-solid fa-plus"></i> New Notification
          </button>
        </div>
      </div>

      {error && <div className="card" style={{ background: '#FEE2E2', color: '#991B1B', marginBottom: '12px' }}>{error}</div>}

      {loading ? (
        <div className="loading"><div className="spinner"></div> Loading...</div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Message</th>
                <th>Type</th>
                <th>Status</th>
                <th>Created</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.map(n => (
                <tr key={n.id}>
                  <td><strong>{n.title}</strong></td>
                  <td style={{ maxWidth: '400px' }}>{n.message}</td>
                  <td><span className="badge badge-info">{n.type || 'info'}</span></td>
                  <td>
                    <span className={`badge badge-${n.read || n.is_read ? 'inactive' : 'active'}`}>
                      {n.read || n.is_read ? 'read' : 'unread'}
                    </span>
                  </td>
                  <td>{n.created_at ? new Date(n.created_at).toLocaleString() : '-'}</td>
                  <td>
                    {!(n.read || n.is_read) && (
                      <button className="btn btn-sm" onClick={() => handleMarkRead(n.id)}>
                        <i className="fa-solid fa-check"></i>
                      </button>
                    )}
                    <button className="btn btn-sm" onClick={() => handleDelete(n.id)}>
                      <i className="fa-solid fa-trash"></i>
                    </button>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-light)' }}>No notifications</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>New Notification</h3>
              <button className="btn-icon" onClick={() => setShowForm(false)}><i className="fa-solid fa-xmark"></i></button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>User ID (optional)</label>
                <input className="form-input" value={form.user_id} onChange={e => setForm({ ...form, user_id: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Title</label>
                <input className="form-input" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Message</label>
                <textarea className="form-textarea" value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Type</label>
                <select className="form-select" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                  <option value="info">Info</option>
                  <option value="success">Success</option>
                  <option value="warning">Warning</option>
                  <option value="error">Error</option>
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn" onClick={() => setShowForm(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSubmit}>Create</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
