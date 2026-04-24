import React, { useState, useEffect } from 'react';
import api from '../api';
import DetailModal from '../components/DetailModal';
import FormModal from '../components/FormModal';

export default function Plugins() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('');
  const [form, setForm] = useState({ name: '', description: '', icon: 'fa-solid fa-plug', category: '', version: '1.0.0', author: '', status: 'inactive' });

  const load = () => { setLoading(true); api.getAll('plugins').then(data => { setItems(data); setLoading(false); }).catch(() => setLoading(false)); };
  useEffect(() => { load(); }, []);

  const handleSubmit = async () => {
    if (editing) await api.update('plugins', editing.id, form);
    else await api.create('plugins', form);
    setShowForm(false); setEditing(null); load();
  };

  const handleEdit = (item) => {
    setForm({ name: item.name, description: item.description || '', icon: item.icon || 'fa-solid fa-plug', category: item.category || '', version: item.version, author: item.author || '', status: item.status });
    setEditing(item); setSelected(null); setShowForm(true);
  };

  const handleDelete = async (item) => { if (!confirm('Remove this plugin?')) return; await api.remove('plugins', item.id); setSelected(null); load(); };

  const toggleStatus = async (item) => {
    const newStatus = item.status === 'active' ? 'inactive' : 'active';
    await api.update('plugins', item.id, { ...item, status: newStatus });
    load();
    if (selected?.id === item.id) setSelected({ ...selected, status: newStatus });
  };

  const categories = [...new Set(items.map(i => i.category).filter(Boolean))];
  const filtered = items.filter(i => {
    const matchSearch = i.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = !filterCat || i.category === filterCat;
    return matchSearch && matchCat;
  });

  const catColors = { messaging: '#4F46E5', crm: '#059669', payments: '#D97706', analytics: '#3B82F6', support: '#8B5CF6', marketing: '#EC4899', automation: '#F59E0B', productivity: '#0891B2', scheduling: '#10B981', 'project-management': '#6366F1', ecommerce: '#F97316' };

  return (
    <div>
      <div className="page-header">
        <div><h2>Plugins</h2><p>Extend your chatbot with third-party integrations</p></div>
        <button className="btn btn-primary" onClick={() => { setForm({ name: '', description: '', icon: 'fa-solid fa-plug', category: '', version: '1.0.0', author: '', status: 'inactive' }); setEditing(null); setShowForm(true); }}>
          <i className="fa-solid fa-plus"></i> Add Plugin
        </button>
      </div>

      <div className="toolbar">
        <div className="search-bar"><i className="fa-solid fa-search"></i><input placeholder="Search plugins..." value={search} onChange={e => setSearch(e.target.value)} /></div>
        <div className="toolbar-actions">
          <select className="form-select" style={{ width: '160px', padding: '8px 12px' }} value={filterCat} onChange={e => setFilterCat(e.target.value)}>
            <option value="">All Categories</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {loading ? <div className="loading"><div className="spinner"></div> Loading...</div> : (
        <div className="card-grid">
          {filtered.map(item => (
            <div key={item.id} className="card card-clickable" onClick={() => setSelected(item)}>
              <div className="card-header">
                <div className="card-icon" style={{ background: catColors[item.category] || '#4F46E5' }}>
                  <i className={item.icon || 'fa-solid fa-plug'}></i>
                </div>
                <span className={`badge badge-${item.status === 'active' ? 'active' : 'inactive'}`}>{item.status}</span>
              </div>
              <div className="card-title">{item.name}</div>
              <div className="card-subtitle">{item.description}</div>
              <div className="card-meta">
                <span><i className="fa-solid fa-code-branch"></i> v{item.version}</span>
                <span><i className="fa-solid fa-user"></i> {item.author}</span>
              </div>
              <button
                className={`btn btn-sm ${item.status === 'active' ? 'btn-secondary' : 'btn-primary'}`}
                style={{ marginTop: '12px', width: '100%' }}
                onClick={(e) => { e.stopPropagation(); toggleStatus(item); }}
              >
                {item.status === 'active' ? 'Disable' : 'Enable'}
              </button>
            </div>
          ))}
        </div>
      )}

      {selected && (
        <DetailModal title={selected.name} onClose={() => setSelected(null)} onEdit={() => handleEdit(selected)} onDelete={() => handleDelete(selected)}>
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <div style={{ width: 64, height: 64, borderRadius: '16px', background: catColors[selected.category] || '#4F46E5', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', margin: '0 auto 12px' }}>
              <i className={selected.icon || 'fa-solid fa-plug'}></i>
            </div>
          </div>
          <div className="detail-grid">
            <div className="detail-section"><h4>Version</h4><div className="detail-value" style={{ fontFamily: 'monospace' }}>v{selected.version}</div></div>
            <div className="detail-section"><h4>Status</h4><span className={`badge badge-${selected.status === 'active' ? 'active' : 'inactive'}`}>{selected.status}</span></div>
            <div className="detail-section"><h4>Category</h4><span className="tag" style={{ background: (catColors[selected.category] || '#4F46E5') + '20', color: catColors[selected.category] || '#4F46E5' }}>{selected.category}</span></div>
            <div className="detail-section"><h4>Author</h4><div className="detail-value">{selected.author}</div></div>
            <div className="detail-section"><h4>Installed</h4><div className="detail-value">{new Date(selected.installed_at).toLocaleString()}</div></div>
          </div>
          <div className="detail-section"><h4>Description</h4><div className="detail-value">{selected.description}</div></div>
          <button
            className={`btn ${selected.status === 'active' ? 'btn-secondary' : 'btn-success'}`}
            style={{ marginTop: '12px', width: '100%' }}
            onClick={() => toggleStatus(selected)}
          >
            {selected.status === 'active' ? 'Disable Plugin' : 'Enable Plugin'}
          </button>
        </DetailModal>
      )}

      {showForm && (
        <FormModal title={editing ? 'Edit Plugin' : 'Add Plugin'} onClose={() => { setShowForm(false); setEditing(null); }} onSubmit={handleSubmit}>
          <div className="form-group"><label>Name</label><input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required /></div>
          <div className="form-group"><label>Description</label><textarea className="form-textarea" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
          <div className="form-row">
            <div className="form-group"><label>Category</label><input className="form-input" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} placeholder="e.g. messaging, crm" /></div>
            <div className="form-group"><label>Version</label><input className="form-input" value={form.version} onChange={e => setForm({ ...form, version: e.target.value })} /></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label>Author</label><input className="form-input" value={form.author} onChange={e => setForm({ ...form, author: e.target.value })} /></div>
            <div className="form-group"><label>Icon (Font Awesome class)</label><input className="form-input" value={form.icon} onChange={e => setForm({ ...form, icon: e.target.value })} /></div>
          </div>
          <div className="form-group"><label>Status</label><select className="form-select" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}><option value="inactive">Inactive</option><option value="active">Active</option></select></div>
        </FormModal>
      )}
    </div>
  );
}
