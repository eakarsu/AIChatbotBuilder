import React, { useState, useEffect } from 'react';
import api from '../api';
import DetailModal from '../components/DetailModal';
import FormModal from '../components/FormModal';

export default function Entities() {
  const [items, setItems] = useState([]);
  const [chatbots, setChatbots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ chatbot_id: '', name: '', type: 'list', values: '', description: '', status: 'active' });

  const load = () => { setLoading(true); api.getAll('entities').then(data => { setItems(data); setLoading(false); }).catch(() => setLoading(false)); };
  useEffect(() => { load(); api.getAll('chatbots').then(setChatbots).catch(() => {}); }, []);

  const handleSubmit = async () => {
    const values = form.values.split('\n').filter(Boolean);
    const data = { ...form, values };
    if (editing) await api.update('entities', editing.id, data);
    else await api.create('entities', data);
    setShowForm(false); setEditing(null); load();
  };

  const handleEdit = (item) => {
    setForm({ chatbot_id: item.chatbot_id, name: item.name, type: item.type || 'list', values: (item.values || []).join('\n'), description: item.description || '', status: item.status });
    setEditing(item); setSelected(null); setShowForm(true);
  };

  const handleDelete = async (item) => { if (!confirm('Delete?')) return; await api.remove('entities', item.id); setSelected(null); load(); };
  const filtered = items.filter(i => i.name.toLowerCase().includes(search.toLowerCase()));
  const typeColors = { list: '#4F46E5', regex: '#D97706', datetime: '#0891B2', number: '#059669', classifier: '#8B5CF6' };

  return (
    <div>
      <div className="page-header">
        <div><h2>Entities</h2><p>Define entity types and values for extraction</p></div>
        <button className="btn btn-primary" onClick={() => { setForm({ chatbot_id: chatbots[0]?.id || '', name: '', type: 'list', values: '', description: '', status: 'active' }); setEditing(null); setShowForm(true); }}>
          <i className="fa-solid fa-plus"></i> New Entity
        </button>
      </div>

      <div className="toolbar">
        <div className="search-bar"><i className="fa-solid fa-search"></i><input placeholder="Search entities..." value={search} onChange={e => setSearch(e.target.value)} /></div>
      </div>

      {loading ? <div className="loading"><div className="spinner"></div> Loading...</div> : (
        <div className="card-grid">
          {filtered.map(item => (
            <div key={item.id} className="card card-clickable" onClick={() => setSelected(item)}>
              <div className="card-header">
                <div className="card-icon" style={{ background: typeColors[item.type] || '#4F46E5' }}><i className="fa-solid fa-tags"></i></div>
                <span className={`badge badge-${item.status === 'active' ? 'active' : 'inactive'}`}>{item.status}</span>
              </div>
              <div className="card-title">{item.name}</div>
              <div className="card-subtitle">{item.description}</div>
              <div className="card-meta">
                <span><i className="fa-solid fa-tag"></i> {item.type}</span>
                <span><i className="fa-solid fa-list"></i> {(item.values || []).length} values</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {selected && (
        <DetailModal title={`Entity: ${selected.name}`} onClose={() => setSelected(null)} onEdit={() => handleEdit(selected)} onDelete={() => handleDelete(selected)}>
          <div className="detail-grid">
            <div className="detail-section"><h4>Type</h4><span className="tag" style={{ background: typeColors[selected.type] + '20', color: typeColors[selected.type] }}>{selected.type}</span></div>
            <div className="detail-section"><h4>Status</h4><span className={`badge badge-${selected.status === 'active' ? 'active' : 'inactive'}`}>{selected.status}</span></div>
            <div className="detail-section"><h4>Chatbot</h4><div className="detail-value">{selected.chatbot_name || '-'}</div></div>
          </div>
          <div className="detail-section"><h4>Description</h4><div className="detail-value">{selected.description}</div></div>
          <div className="detail-section">
            <h4>Values</h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {(selected.values || []).map((v, i) => <span key={i} className="tag">{v}</span>)}
            </div>
          </div>
        </DetailModal>
      )}

      {showForm && (
        <FormModal title={editing ? 'Edit Entity' : 'New Entity'} onClose={() => { setShowForm(false); setEditing(null); }} onSubmit={handleSubmit}>
          <div className="form-group"><label>Chatbot</label><select className="form-select" value={form.chatbot_id} onChange={e => setForm({ ...form, chatbot_id: e.target.value })}><option value="">Select...</option>{chatbots.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}</select></div>
          <div className="form-group"><label>Name</label><input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required /></div>
          <div className="form-group"><label>Description</label><input className="form-input" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
          <div className="form-group"><label>Type</label><select className="form-select" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}><option value="list">List</option><option value="regex">Regex</option><option value="datetime">DateTime</option><option value="number">Number</option><option value="classifier">Classifier</option></select></div>
          <div className="form-group"><label>Values (one per line)</label><textarea className="form-textarea" value={form.values} onChange={e => setForm({ ...form, values: e.target.value })} placeholder="value1&#10;value2&#10;value3" /></div>
          <div className="form-group"><label>Status</label><select className="form-select" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}><option value="active">Active</option><option value="inactive">Inactive</option></select></div>
        </FormModal>
      )}
    </div>
  );
}
