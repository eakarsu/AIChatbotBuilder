import React, { useState, useEffect } from 'react';
import api from '../api';
import DetailModal from '../components/DetailModal';
import FormModal from '../components/FormModal';

export default function Webhooks() {
  const [items, setItems] = useState([]);
  const [chatbots, setChatbots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ chatbot_id: '', name: '', url: '', method: 'POST', events: '', status: 'active' });

  const load = () => { setLoading(true); api.getAll('webhooks').then(data => { setItems(data); setLoading(false); }).catch(() => setLoading(false)); };
  useEffect(() => { load(); api.getAll('chatbots').then(setChatbots).catch(() => {}); }, []);

  const handleSubmit = async () => {
    const events = form.events.split('\n').filter(Boolean);
    const data = { ...form, events };
    if (editing) await api.update('webhooks', editing.id, data);
    else await api.create('webhooks', data);
    setShowForm(false); setEditing(null); load();
  };

  const handleEdit = (item) => {
    setForm({ chatbot_id: item.chatbot_id, name: item.name, url: item.url, method: item.method, events: (item.events || []).join('\n'), status: item.status });
    setEditing(item); setSelected(null); setShowForm(true);
  };

  const handleDelete = async (item) => { if (!confirm('Delete?')) return; await api.remove('webhooks', item.id); setSelected(null); load(); };
  const filtered = items.filter(i => i.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <div className="page-header">
        <div><h2>Webhooks</h2><p>Manage external integrations and event triggers</p></div>
        <button className="btn btn-primary" onClick={() => { setForm({ chatbot_id: chatbots[0]?.id || '', name: '', url: '', method: 'POST', events: '', status: 'active' }); setEditing(null); setShowForm(true); }}>
          <i className="fa-solid fa-plus"></i> New Webhook
        </button>
      </div>

      <div className="toolbar">
        <div className="search-bar"><i className="fa-solid fa-search"></i><input placeholder="Search webhooks..." value={search} onChange={e => setSearch(e.target.value)} /></div>
      </div>

      {loading ? <div className="loading"><div className="spinner"></div> Loading...</div> : (
        <div className="table-container">
          <table className="data-table">
            <thead><tr><th>Name</th><th>URL</th><th>Chatbot</th><th>Method</th><th>Events</th><th>Status</th></tr></thead>
            <tbody>
              {filtered.map(item => (
                <tr key={item.id} onClick={() => setSelected(item)}>
                  <td><strong>{item.name}</strong></td>
                  <td style={{ maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.url}</td>
                  <td>{item.chatbot_name || '-'}</td>
                  <td><span className="badge badge-info">{item.method}</span></td>
                  <td>{(item.events || []).length} events</td>
                  <td><span className={`badge badge-${item.status === 'active' ? 'active' : 'inactive'}`}>{item.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selected && (
        <DetailModal title={selected.name} onClose={() => setSelected(null)} onEdit={() => handleEdit(selected)} onDelete={() => handleDelete(selected)}>
          <div className="detail-grid">
            <div className="detail-section"><h4>Method</h4><span className="badge badge-info">{selected.method}</span></div>
            <div className="detail-section"><h4>Status</h4><span className={`badge badge-${selected.status === 'active' ? 'active' : 'inactive'}`}>{selected.status}</span></div>
            <div className="detail-section"><h4>Chatbot</h4><div className="detail-value">{selected.chatbot_name || '-'}</div></div>
            <div className="detail-section"><h4>Last Triggered</h4><div className="detail-value">{selected.last_triggered ? new Date(selected.last_triggered).toLocaleString() : 'Never'}</div></div>
          </div>
          <div className="detail-section"><h4>URL</h4><div className="detail-value" style={{ background: '#F8FAFC', padding: '10px', borderRadius: '8px', fontFamily: 'monospace', fontSize: '13px', wordBreak: 'break-all' }}>{selected.url}</div></div>
          <div className="detail-section">
            <h4>Events</h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {(selected.events || []).map((e, i) => <span key={i} className="tag">{e}</span>)}
            </div>
          </div>
        </DetailModal>
      )}

      {showForm && (
        <FormModal title={editing ? 'Edit Webhook' : 'New Webhook'} onClose={() => { setShowForm(false); setEditing(null); }} onSubmit={handleSubmit}>
          <div className="form-group"><label>Chatbot</label><select className="form-select" value={form.chatbot_id} onChange={e => setForm({ ...form, chatbot_id: e.target.value })}><option value="">Select...</option>{chatbots.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}</select></div>
          <div className="form-group"><label>Name</label><input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required /></div>
          <div className="form-group"><label>URL</label><input className="form-input" value={form.url} onChange={e => setForm({ ...form, url: e.target.value })} required placeholder="https://..." /></div>
          <div className="form-row">
            <div className="form-group"><label>Method</label><select className="form-select" value={form.method} onChange={e => setForm({ ...form, method: e.target.value })}><option value="POST">POST</option><option value="GET">GET</option><option value="PUT">PUT</option></select></div>
            <div className="form-group"><label>Status</label><select className="form-select" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}><option value="active">Active</option><option value="inactive">Inactive</option></select></div>
          </div>
          <div className="form-group"><label>Events (one per line)</label><textarea className="form-textarea" value={form.events} onChange={e => setForm({ ...form, events: e.target.value })} placeholder="message_received&#10;session_start&#10;escalation" /></div>
        </FormModal>
      )}
    </div>
  );
}
