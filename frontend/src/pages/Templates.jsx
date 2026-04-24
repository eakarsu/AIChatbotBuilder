import React, { useState, useEffect } from 'react';
import api from '../api';
import DetailModal from '../components/DetailModal';
import FormModal from '../components/FormModal';

export default function Templates() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ name: '', description: '', category: '', popularity: 0 });

  const load = () => { setLoading(true); api.getAll('templates').then(data => { setItems(data); setLoading(false); }).catch(() => setLoading(false)); };
  useEffect(() => { load(); }, []);

  const handleSubmit = async () => {
    if (editing) await api.update('templates', editing.id, form);
    else await api.create('templates', form);
    setShowForm(false); setEditing(null); load();
  };

  const handleEdit = (item) => { setForm({ name: item.name, description: item.description || '', category: item.category || '', popularity: item.popularity || 0 }); setEditing(item); setSelected(null); setShowForm(true); };
  const handleDelete = async (item) => { if (!confirm('Delete?')) return; await api.remove('templates', item.id); setSelected(null); load(); };

  const filtered = items.filter(i => i.name.toLowerCase().includes(search.toLowerCase()));
  const categoryColors = { support: '#4F46E5', ecommerce: '#059669', marketing: '#D97706', general: '#6B7280', scheduling: '#0891B2', surveys: '#8B5CF6', hr: '#EC4899', realestate: '#14B8A6', food: '#F97316', travel: '#3B82F6', finance: '#10B981', education: '#6366F1', healthcare: '#EF4444', insurance: '#8B5CF6', events: '#F59E0B' };

  return (
    <div>
      <div className="page-header">
        <div><h2>Templates</h2><p>Pre-built chatbot templates to get started quickly</p></div>
        <button className="btn btn-primary" onClick={() => { setForm({ name: '', description: '', category: '', popularity: 0 }); setEditing(null); setShowForm(true); }}>
          <i className="fa-solid fa-plus"></i> New Template
        </button>
      </div>

      <div className="toolbar">
        <div className="search-bar"><i className="fa-solid fa-search"></i><input placeholder="Search templates..." value={search} onChange={e => setSearch(e.target.value)} /></div>
      </div>

      {loading ? <div className="loading"><div className="spinner"></div> Loading...</div> : (
        <div className="card-grid">
          {filtered.map(item => (
            <div key={item.id} className="card card-clickable" onClick={() => setSelected(item)}>
              <div className="card-header">
                <div className="card-icon" style={{ background: categoryColors[item.category] || '#4F46E5' }}><i className="fa-solid fa-clone"></i></div>
                <span className="tag">{item.category}</span>
              </div>
              <div className="card-title">{item.name}</div>
              <div className="card-subtitle">{item.description}</div>
              <div className="card-meta">
                <span><i className="fa-solid fa-fire"></i> {item.popularity} uses</span>
                <span><i className="fa-solid fa-clock"></i> {new Date(item.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {selected && (
        <DetailModal title={selected.name} onClose={() => setSelected(null)} onEdit={() => handleEdit(selected)} onDelete={() => handleDelete(selected)}>
          <div className="detail-grid">
            <div className="detail-section"><h4>Category</h4><span className="tag">{selected.category}</span></div>
            <div className="detail-section"><h4>Popularity</h4><div className="detail-value">{selected.popularity} uses</div></div>
            <div className="detail-section"><h4>Created</h4><div className="detail-value">{new Date(selected.created_at).toLocaleString()}</div></div>
          </div>
          <div className="detail-section"><h4>Description</h4><div className="detail-value">{selected.description}</div></div>
        </DetailModal>
      )}

      {showForm && (
        <FormModal title={editing ? 'Edit Template' : 'New Template'} onClose={() => { setShowForm(false); setEditing(null); }} onSubmit={handleSubmit}>
          <div className="form-group"><label>Name</label><input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required /></div>
          <div className="form-group"><label>Description</label><textarea className="form-textarea" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
          <div className="form-row">
            <div className="form-group"><label>Category</label><input className="form-input" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} placeholder="e.g. support, ecommerce" /></div>
            <div className="form-group"><label>Popularity</label><input className="form-input" type="number" value={form.popularity} onChange={e => setForm({ ...form, popularity: parseInt(e.target.value) || 0 })} /></div>
          </div>
        </FormModal>
      )}
    </div>
  );
}
