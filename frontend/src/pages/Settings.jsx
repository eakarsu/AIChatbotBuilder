import React, { useState, useEffect } from 'react';
import api from '../api';
import DetailModal from '../components/DetailModal';
import FormModal from '../components/FormModal';

export default function Settings() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ key: '', value: '', category: '' });

  const load = () => { setLoading(true); api.getAll('settings').then(data => { setItems(data); setLoading(false); }).catch(() => setLoading(false)); };
  useEffect(() => { load(); }, []);

  const handleSubmit = async () => {
    let parsedValue;
    try { parsedValue = JSON.parse(form.value); } catch { parsedValue = form.value; }
    const data = { key: form.key, value: parsedValue, category: form.category };
    if (editing) await api.update('settings', editing.id, data);
    else await api.create('settings', data);
    setShowForm(false); setEditing(null); load();
  };

  const handleEdit = (item) => {
    setForm({ key: item.key, value: JSON.stringify(item.value, null, 2), category: item.category || '' });
    setEditing(item); setSelected(null); setShowForm(true);
  };

  const handleDelete = async (item) => { if (!confirm('Delete this setting?')) return; await api.remove('settings', item.id); setSelected(null); load(); };

  const categories = [...new Set(items.map(i => i.category).filter(Boolean))];
  const grouped = categories.map(cat => ({ category: cat, items: items.filter(i => i.category === cat) }));

  const categoryIcons = { appearance: 'fa-palette', notifications: 'fa-bell', general: 'fa-sliders', security: 'fa-shield', privacy: 'fa-lock', ai: 'fa-brain', widget: 'fa-window-maximize', chatbot: 'fa-robot', scheduling: 'fa-calendar', system: 'fa-server', integrations: 'fa-plug', analytics: 'fa-chart-bar' };

  return (
    <div>
      <div className="page-header">
        <div><h2>Settings</h2><p>Configure your application preferences</p></div>
        <button className="btn btn-primary" onClick={() => { setForm({ key: '', value: '{}', category: '' }); setEditing(null); setShowForm(true); }}>
          <i className="fa-solid fa-plus"></i> New Setting
        </button>
      </div>

      {loading ? <div className="loading"><div className="spinner"></div> Loading...</div> : (
        <div className="analytics-grid">
          {grouped.map(group => (
            <div key={group.category} className="card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <div style={{ width: 36, height: 36, borderRadius: '10px', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <i className={`fa-solid ${categoryIcons[group.category] || 'fa-gear'}`}></i>
                </div>
                <h3 style={{ fontSize: '16px', fontWeight: 700, textTransform: 'capitalize' }}>{group.category}</h3>
              </div>
              {group.items.map(item => (
                <div key={item.id} style={{ padding: '10px 0', borderBottom: '1px solid var(--border)', cursor: 'pointer' }} onClick={() => setSelected(item)}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 600, fontSize: '14px' }}>{item.key}</span>
                    <span className="tag" style={{ fontSize: '11px' }}>{typeof item.value === 'object' ? `${Object.keys(item.value).length} props` : String(item.value)}</span>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {selected && (
        <DetailModal title={`Setting: ${selected.key}`} onClose={() => setSelected(null)} onEdit={() => handleEdit(selected)} onDelete={() => handleDelete(selected)}>
          <div className="detail-grid">
            <div className="detail-section"><h4>Key</h4><div className="detail-value">{selected.key}</div></div>
            <div className="detail-section"><h4>Category</h4><span className="tag">{selected.category}</span></div>
            <div className="detail-section"><h4>Updated</h4><div className="detail-value">{new Date(selected.updated_at).toLocaleString()}</div></div>
          </div>
          <div className="detail-section">
            <h4>Value</h4>
            <pre style={{ background: '#1E293B', color: '#E2E8F0', padding: '16px', borderRadius: '8px', fontSize: '13px', overflow: 'auto' }}>
              {JSON.stringify(selected.value, null, 2)}
            </pre>
          </div>
        </DetailModal>
      )}

      {showForm && (
        <FormModal title={editing ? 'Edit Setting' : 'New Setting'} onClose={() => { setShowForm(false); setEditing(null); }} onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group"><label>Key</label><input className="form-input" value={form.key} onChange={e => setForm({ ...form, key: e.target.value })} required /></div>
            <div className="form-group"><label>Category</label><input className="form-input" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} placeholder="e.g. general, security" /></div>
          </div>
          <div className="form-group"><label>Value (JSON)</label><textarea className="form-textarea" style={{ minHeight: '150px', fontFamily: 'monospace' }} value={form.value} onChange={e => setForm({ ...form, value: e.target.value })} /></div>
        </FormModal>
      )}
    </div>
  );
}
