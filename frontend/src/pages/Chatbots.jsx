import React, { useState, useEffect } from 'react';
import api from '../api';
import DetailModal from '../components/DetailModal';
import FormModal from '../components/FormModal';

export default function Chatbots() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ name: '', description: '', status: 'draft', language: 'en', welcome_message: 'Hello! How can I help you today?' });

  const load = () => {
    setLoading(true);
    api.getAll('chatbots').then(data => { setItems(data); setLoading(false); }).catch(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    if (editing) {
      await api.update('chatbots', editing.id, form);
    } else {
      await api.create('chatbots', form);
    }
    setShowForm(false);
    setEditing(null);
    setForm({ name: '', description: '', status: 'draft', language: 'en', welcome_message: 'Hello! How can I help you today?' });
    load();
  };

  const handleEdit = (item) => {
    setForm({ name: item.name, description: item.description || '', status: item.status, language: item.language, welcome_message: item.welcome_message || '' });
    setEditing(item);
    setSelected(null);
    setShowForm(true);
  };

  const handleDelete = async (item) => {
    if (!confirm('Delete this chatbot?')) return;
    await api.remove('chatbots', item.id);
    setSelected(null);
    load();
  };

  const filtered = items.filter(i => i.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <div className="page-header">
        <div><h2>Chatbots</h2><p>Create and manage your AI chatbots</p></div>
        <button className="btn btn-primary" onClick={() => { setForm({ name: '', description: '', status: 'draft', language: 'en', welcome_message: 'Hello! How can I help you today?' }); setEditing(null); setShowForm(true); }}>
          <i className="fa-solid fa-plus"></i> New Chatbot
        </button>
      </div>

      <div className="toolbar">
        <div className="search-bar">
          <i className="fa-solid fa-search"></i>
          <input placeholder="Search chatbots..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="toolbar-actions">
          <span style={{ color: 'var(--text-light)', fontSize: '13px' }}>{filtered.length} chatbots</span>
        </div>
      </div>

      {loading ? <div className="loading"><div className="spinner"></div> Loading...</div> : (
        <div className="card-grid">
          {filtered.map(item => (
            <div key={item.id} className="card card-clickable" onClick={() => setSelected(item)}>
              <div className="card-header">
                <div className="card-icon" style={{ background: '#4F46E5' }}><i className="fa-solid fa-robot"></i></div>
                <span className={`badge badge-${item.status === 'active' ? 'active' : 'draft'}`}>{item.status}</span>
              </div>
              <div className="card-title">{item.name}</div>
              <div className="card-subtitle">{item.description}</div>
              <div className="card-meta">
                <span><i className="fa-solid fa-globe"></i> {item.language}</span>
                <span><i className="fa-solid fa-clock"></i> {new Date(item.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {filtered.length === 0 && !loading && (
        <div className="empty-state">
          <i className="fa-solid fa-robot"></i>
          <h3>No chatbots found</h3>
          <p>Create your first chatbot to get started</p>
        </div>
      )}

      {selected && (
        <DetailModal title={selected.name} onClose={() => setSelected(null)} onEdit={() => handleEdit(selected)} onDelete={() => handleDelete(selected)}>
          <div className="detail-grid">
            <div className="detail-section"><h4>Status</h4><span className={`badge badge-${selected.status === 'active' ? 'active' : 'draft'}`}>{selected.status}</span></div>
            <div className="detail-section"><h4>Language</h4><div className="detail-value">{selected.language}</div></div>
            <div className="detail-section"><h4>Created</h4><div className="detail-value">{new Date(selected.created_at).toLocaleString()}</div></div>
            <div className="detail-section"><h4>Updated</h4><div className="detail-value">{new Date(selected.updated_at).toLocaleString()}</div></div>
          </div>
          <div className="detail-section"><h4>Description</h4><div className="detail-value">{selected.description || 'No description'}</div></div>
          <div className="detail-section"><h4>Welcome Message</h4><div className="detail-value">{selected.welcome_message || 'Default greeting'}</div></div>
        </DetailModal>
      )}

      {showForm && (
        <FormModal title={editing ? 'Edit Chatbot' : 'New Chatbot'} onClose={() => { setShowForm(false); setEditing(null); }} onSubmit={handleCreate}>
          <div className="form-group"><label>Name</label><input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required /></div>
          <div className="form-group"><label>Description</label><textarea className="form-textarea" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
          <div className="form-row">
            <div className="form-group"><label>Status</label><select className="form-select" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}><option value="draft">Draft</option><option value="active">Active</option></select></div>
            <div className="form-group"><label>Language</label><select className="form-select" value={form.language} onChange={e => setForm({ ...form, language: e.target.value })}><option value="en">English</option><option value="es">Spanish</option><option value="fr">French</option><option value="de">German</option></select></div>
          </div>
          <div className="form-group"><label>Welcome Message</label><textarea className="form-textarea" value={form.welcome_message} onChange={e => setForm({ ...form, welcome_message: e.target.value })} /></div>
        </FormModal>
      )}
    </div>
  );
}
