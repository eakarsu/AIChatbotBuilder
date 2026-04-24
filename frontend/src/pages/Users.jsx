import React, { useState, useEffect } from 'react';
import api from '../api';
import DetailModal from '../components/DetailModal';
import FormModal from '../components/FormModal';

export default function Users() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ name: '', email: '', role: 'user', password: 'password123' });

  const load = () => { setLoading(true); api.getAll('users').then(data => { setItems(data); setLoading(false); }).catch(() => setLoading(false)); };
  useEffect(() => { load(); }, []);

  const handleSubmit = async () => {
    if (editing) await api.update('users', editing.id, { name: form.name, email: form.email, role: form.role });
    else await api.create('users', form);
    setShowForm(false); setEditing(null); load();
  };

  const handleEdit = (item) => {
    setForm({ name: item.name, email: item.email, role: item.role, password: '' });
    setEditing(item); setSelected(null); setShowForm(true);
  };

  const handleDelete = async (item) => { if (!confirm('Delete this user?')) return; await api.remove('users', item.id); setSelected(null); load(); };

  const filtered = items.filter(i => i.name.toLowerCase().includes(search.toLowerCase()) || i.email.toLowerCase().includes(search.toLowerCase()));
  const roleColors = { admin: '#EF4444', editor: '#F59E0B', user: '#4F46E5' };

  return (
    <div>
      <div className="page-header">
        <div><h2>Users</h2><p>Manage team members and access control</p></div>
        <button className="btn btn-primary" onClick={() => { setForm({ name: '', email: '', role: 'user', password: 'password123' }); setEditing(null); setShowForm(true); }}>
          <i className="fa-solid fa-plus"></i> New User
        </button>
      </div>

      <div className="toolbar">
        <div className="search-bar"><i className="fa-solid fa-search"></i><input placeholder="Search users..." value={search} onChange={e => setSearch(e.target.value)} /></div>
        <div className="toolbar-actions">
          <span style={{ color: 'var(--text-light)', fontSize: '13px' }}>{filtered.length} users</span>
        </div>
      </div>

      {loading ? <div className="loading"><div className="spinner"></div> Loading...</div> : (
        <div className="card-grid">
          {filtered.map(item => (
            <div key={item.id} className="card card-clickable" onClick={() => setSelected(item)}>
              <div className="card-header">
                <div style={{ width: 48, height: 48, borderRadius: '50%', background: roleColors[item.role] || '#4F46E5', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: 700 }}>
                  {item.name.charAt(0).toUpperCase()}
                </div>
                <span className="badge" style={{ background: roleColors[item.role] + '20', color: roleColors[item.role] }}>{item.role}</span>
              </div>
              <div className="card-title">{item.name}</div>
              <div className="card-subtitle">{item.email}</div>
              <div className="card-meta">
                <span><i className="fa-solid fa-clock"></i> Joined {new Date(item.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {selected && (
        <DetailModal title={selected.name} onClose={() => setSelected(null)} onEdit={() => handleEdit(selected)} onDelete={() => handleDelete(selected)}>
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <div style={{ width: 80, height: 80, borderRadius: '50%', background: roleColors[selected.role] || '#4F46E5', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', fontWeight: 700, margin: '0 auto 12px' }}>
              {selected.name.charAt(0).toUpperCase()}
            </div>
            <h3 style={{ fontSize: '18px' }}>{selected.name}</h3>
            <p style={{ color: 'var(--text-light)' }}>{selected.email}</p>
          </div>
          <div className="detail-grid">
            <div className="detail-section"><h4>Role</h4><span className="badge" style={{ background: roleColors[selected.role] + '20', color: roleColors[selected.role] }}>{selected.role}</span></div>
            <div className="detail-section"><h4>Joined</h4><div className="detail-value">{new Date(selected.created_at).toLocaleString()}</div></div>
            <div className="detail-section"><h4>Last Updated</h4><div className="detail-value">{selected.updated_at ? new Date(selected.updated_at).toLocaleString() : '-'}</div></div>
          </div>
        </DetailModal>
      )}

      {showForm && (
        <FormModal title={editing ? 'Edit User' : 'New User'} onClose={() => { setShowForm(false); setEditing(null); }} onSubmit={handleSubmit}>
          <div className="form-group"><label>Name</label><input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required /></div>
          <div className="form-group"><label>Email</label><input className="form-input" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required /></div>
          <div className="form-group"><label>Role</label><select className="form-select" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}><option value="user">User</option><option value="editor">Editor</option><option value="admin">Admin</option></select></div>
          {!editing && <div className="form-group"><label>Password</label><input className="form-input" type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} /></div>}
        </FormModal>
      )}
    </div>
  );
}
