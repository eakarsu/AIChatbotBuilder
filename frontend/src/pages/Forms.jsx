import React, { useState, useEffect } from 'react';
import api from '../api';
import DetailModal from '../components/DetailModal';
import FormModal from '../components/FormModal';

export default function Forms() {
  const [items, setItems] = useState([]);
  const [chatbots, setChatbots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ chatbot_id: '', name: '', description: '', fields: '[]', status: 'active' });

  const load = () => { setLoading(true); api.getAll('forms').then(data => { setItems(data); setLoading(false); }).catch(() => setLoading(false)); };
  useEffect(() => { load(); api.getAll('chatbots').then(setChatbots).catch(() => {}); }, []);

  const handleSubmit = async () => {
    let fields;
    try { fields = JSON.parse(form.fields); } catch { fields = []; }
    if (editing) await api.update('forms', editing.id, { ...form, fields });
    else await api.create('forms', { ...form, fields });
    setShowForm(false); setEditing(null); load();
  };

  const handleEdit = (item) => {
    setForm({ chatbot_id: item.chatbot_id, name: item.name, description: item.description || '', fields: JSON.stringify(item.fields || [], null, 2), status: item.status });
    setEditing(item); setSelected(null); setShowForm(true);
  };

  const handleDelete = async (item) => { if (!confirm('Delete?')) return; await api.remove('forms', item.id); setSelected(null); load(); };
  const filtered = items.filter(i => i.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <div className="page-header">
        <div><h2>Forms</h2><p>Create data collection forms for chatbots</p></div>
        <button className="btn btn-primary" onClick={() => { setForm({ chatbot_id: chatbots[0]?.id || '', name: '', description: '', fields: '[\n  {"name": "email", "type": "email", "required": true}\n]', status: 'active' }); setEditing(null); setShowForm(true); }}>
          <i className="fa-solid fa-plus"></i> New Form
        </button>
      </div>

      <div className="toolbar">
        <div className="search-bar"><i className="fa-solid fa-search"></i><input placeholder="Search forms..." value={search} onChange={e => setSearch(e.target.value)} /></div>
      </div>

      {loading ? <div className="loading"><div className="spinner"></div> Loading...</div> : (
        <div className="card-grid">
          {filtered.map(item => (
            <div key={item.id} className="card card-clickable" onClick={() => setSelected(item)}>
              <div className="card-header">
                <div className="card-icon" style={{ background: '#8B5CF6' }}><i className="fa-solid fa-rectangle-list"></i></div>
                <span className={`badge badge-${item.status === 'active' ? 'active' : 'inactive'}`}>{item.status}</span>
              </div>
              <div className="card-title">{item.name}</div>
              <div className="card-subtitle">{item.description}</div>
              <div className="card-meta">
                <span><i className="fa-solid fa-input-pipe"></i> {(item.fields || []).length} fields</span>
                <span><i className="fa-solid fa-paper-plane"></i> {item.submissions_count} submissions</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {selected && (
        <DetailModal title={selected.name} onClose={() => setSelected(null)} onEdit={() => handleEdit(selected)} onDelete={() => handleDelete(selected)}>
          <div className="detail-grid">
            <div className="detail-section"><h4>Status</h4><span className={`badge badge-${selected.status === 'active' ? 'active' : 'inactive'}`}>{selected.status}</span></div>
            <div className="detail-section"><h4>Submissions</h4><div className="detail-value" style={{ fontWeight: 700, fontSize: '18px', color: 'var(--primary)' }}>{selected.submissions_count}</div></div>
            <div className="detail-section"><h4>Fields</h4><div className="detail-value">{(selected.fields || []).length} fields</div></div>
            <div className="detail-section"><h4>Chatbot</h4><div className="detail-value">{selected.chatbot_name || '-'}</div></div>
          </div>
          <div className="detail-section"><h4>Description</h4><div className="detail-value">{selected.description || 'No description'}</div></div>
          <div className="detail-section">
            <h4>Form Fields</h4>
            <div style={{ background: '#F8FAFC', borderRadius: '8px', overflow: 'hidden' }}>
              {(selected.fields || []).map((field, i) => (
                <div key={i} style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontWeight: 600 }}>{field.name}</span>
                    {field.required && <span className="badge badge-danger" style={{ marginLeft: '8px', fontSize: '10px' }}>Required</span>}
                  </div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span className="tag">{field.type}</span>
                    {field.options && <small style={{ color: 'var(--text-light)' }}>{field.options.length} options</small>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </DetailModal>
      )}

      {showForm && (
        <FormModal title={editing ? 'Edit Form' : 'New Form'} onClose={() => { setShowForm(false); setEditing(null); }} onSubmit={handleSubmit}>
          <div className="form-group"><label>Chatbot</label><select className="form-select" value={form.chatbot_id} onChange={e => setForm({ ...form, chatbot_id: e.target.value })}><option value="">Select...</option>{chatbots.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}</select></div>
          <div className="form-group"><label>Name</label><input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required /></div>
          <div className="form-group"><label>Description</label><input className="form-input" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
          <div className="form-group"><label>Fields (JSON)</label><textarea className="form-textarea" style={{ minHeight: '160px', fontFamily: 'monospace', fontSize: '13px' }} value={form.fields} onChange={e => setForm({ ...form, fields: e.target.value })} /></div>
          <div className="form-group"><label>Status</label><select className="form-select" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}><option value="active">Active</option><option value="inactive">Inactive</option></select></div>
        </FormModal>
      )}
    </div>
  );
}
