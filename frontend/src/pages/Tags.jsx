import React, { useState, useEffect } from 'react';
import api from '../api';
import DetailModal from '../components/DetailModal';
import FormModal from '../components/FormModal';

export default function Tags() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ name: '', color: '#4F46E5', category: 'general', description: '' });

  const load = () => { setLoading(true); api.getAll('tags').then(data => { setItems(data); setLoading(false); }).catch(() => setLoading(false)); };
  useEffect(() => { load(); }, []);

  const handleSubmit = async () => {
    if (editing) await api.update('tags', editing.id, form);
    else await api.create('tags', form);
    setShowForm(false); setEditing(null); load();
  };

  const handleEdit = (item) => {
    setForm({ name: item.name, color: item.color, category: item.category || 'general', description: item.description || '' });
    setEditing(item); setSelected(null); setShowForm(true);
  };

  const handleDelete = async (item) => { if (!confirm('Delete this tag?')) return; await api.remove('tags', item.id); setSelected(null); load(); };
  const filtered = items.filter(i => i.name.toLowerCase().includes(search.toLowerCase()));
  const categories = [...new Set(items.map(i => i.category).filter(Boolean))];

  return (
    <div>
      <div className="page-header">
        <div><h2>Tags</h2><p>Organize and label resources with tags</p></div>
        <button className="btn btn-primary" onClick={() => { setForm({ name: '', color: '#4F46E5', category: 'general', description: '' }); setEditing(null); setShowForm(true); }}>
          <i className="fa-solid fa-plus"></i> New Tag
        </button>
      </div>

      <div className="toolbar">
        <div className="search-bar"><i className="fa-solid fa-search"></i><input placeholder="Search tags..." value={search} onChange={e => setSearch(e.target.value)} /></div>
        <span style={{ color: 'var(--text-light)', fontSize: '13px' }}>{filtered.length} tags</span>
      </div>

      {loading ? <div className="loading"><div className="spinner"></div> Loading...</div> : (
        <div>
          {categories.map(cat => {
            const catItems = filtered.filter(i => i.category === cat);
            if (catItems.length === 0) return null;
            return (
              <div key={cat} style={{ marginBottom: '24px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' }}>{cat}</h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                  {catItems.map(item => (
                    <div key={item.id} className="card card-clickable" style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', gap: '12px', minWidth: '200px' }} onClick={() => setSelected(item)}>
                      <div style={{ width: 16, height: 16, borderRadius: '50%', background: item.color, flexShrink: 0 }}></div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '14px' }}>{item.name}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-light)' }}>{item.usage_count} uses</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selected && (
        <DetailModal title={`Tag: ${selected.name}`} onClose={() => setSelected(null)} onEdit={() => handleEdit(selected)} onDelete={() => handleDelete(selected)}>
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <div style={{ width: 60, height: 60, borderRadius: '50%', background: selected.color, margin: '0 auto 12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className="fa-solid fa-tag" style={{ color: 'white', fontSize: '24px' }}></i>
            </div>
            <h3 style={{ fontSize: '20px' }}>{selected.name}</h3>
          </div>
          <div className="detail-grid">
            <div className="detail-section"><h4>Color</h4><div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><div style={{ width: 20, height: 20, borderRadius: '4px', background: selected.color }}></div> {selected.color}</div></div>
            <div className="detail-section"><h4>Category</h4><span className="tag">{selected.category}</span></div>
            <div className="detail-section"><h4>Usage Count</h4><div className="detail-value" style={{ fontWeight: 700, color: 'var(--primary)' }}>{selected.usage_count}</div></div>
            <div className="detail-section"><h4>Created</h4><div className="detail-value">{new Date(selected.created_at).toLocaleString()}</div></div>
          </div>
          <div className="detail-section"><h4>Description</h4><div className="detail-value">{selected.description || 'No description'}</div></div>
        </DetailModal>
      )}

      {showForm && (
        <FormModal title={editing ? 'Edit Tag' : 'New Tag'} onClose={() => { setShowForm(false); setEditing(null); }} onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group"><label>Name</label><input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required /></div>
            <div className="form-group"><label>Color</label><div style={{ display: 'flex', gap: '8px' }}><input type="color" value={form.color} onChange={e => setForm({ ...form, color: e.target.value })} style={{ width: '44px', height: '38px', border: '1px solid var(--border)', borderRadius: '6px', cursor: 'pointer' }} /><input className="form-input" value={form.color} onChange={e => setForm({ ...form, color: e.target.value })} /></div></div>
          </div>
          <div className="form-group"><label>Category</label><input className="form-input" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} placeholder="e.g. customer, priority, workflow" /></div>
          <div className="form-group"><label>Description</label><textarea className="form-textarea" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
        </FormModal>
      )}
    </div>
  );
}
