import React, { useState, useEffect } from 'react';
import api from '../api';
import DetailModal from '../components/DetailModal';
import FormModal from '../components/FormModal';

export default function Contacts() {
  const [items, setItems] = useState([]);
  const [chatbots, setChatbots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ chatbot_id: '', name: '', email: '', phone: '', channel: 'web', tags: '', status: 'active' });

  const load = () => { setLoading(true); api.getAll('contacts').then(data => { setItems(data); setLoading(false); }).catch(() => setLoading(false)); };
  useEffect(() => { load(); api.getAll('chatbots').then(setChatbots).catch(() => {}); }, []);

  const handleSubmit = async () => {
    const tags = form.tags.split(',').map(t => t.trim()).filter(Boolean);
    const data = { ...form, tags };
    if (editing) await api.update('contacts', editing.id, data);
    else await api.create('contacts', data);
    setShowForm(false); setEditing(null); load();
  };

  const handleEdit = (item) => {
    setForm({ chatbot_id: item.chatbot_id, name: item.name, email: item.email || '', phone: item.phone || '', channel: item.channel, tags: (item.tags || []).join(', '), status: item.status });
    setEditing(item); setSelected(null); setShowForm(true);
  };

  const handleDelete = async (item) => { if (!confirm('Delete this contact?')) return; await api.remove('contacts', item.id); setSelected(null); load(); };
  const filtered = items.filter(i => i.name.toLowerCase().includes(search.toLowerCase()) || (i.email || '').toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <div className="page-header">
        <div><h2>Contacts</h2><p>Manage leads and customer contacts</p></div>
        <button className="btn btn-primary" onClick={() => { setForm({ chatbot_id: chatbots[0]?.id || '', name: '', email: '', phone: '', channel: 'web', tags: '', status: 'active' }); setEditing(null); setShowForm(true); }}>
          <i className="fa-solid fa-plus"></i> New Contact
        </button>
      </div>

      <div className="toolbar">
        <div className="search-bar"><i className="fa-solid fa-search"></i><input placeholder="Search contacts..." value={search} onChange={e => setSearch(e.target.value)} /></div>
        <span style={{ color: 'var(--text-light)', fontSize: '13px' }}>{filtered.length} contacts</span>
      </div>

      {loading ? <div className="loading"><div className="spinner"></div> Loading...</div> : (
        <div className="table-container">
          <table className="data-table">
            <thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Channel</th><th>Tags</th><th>Conversations</th><th>Status</th></tr></thead>
            <tbody>
              {filtered.map(item => (
                <tr key={item.id} onClick={() => setSelected(item)}>
                  <td><strong>{item.name}</strong></td>
                  <td>{item.email}</td>
                  <td>{item.phone}</td>
                  <td><span className="tag">{item.channel}</span></td>
                  <td>{(item.tags || []).map((t, i) => <span key={i} className="tag" style={{ marginRight: 4 }}>{t}</span>)}</td>
                  <td>{item.conversations_count}</td>
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
            <div className="detail-section"><h4>Email</h4><div className="detail-value">{selected.email || '-'}</div></div>
            <div className="detail-section"><h4>Phone</h4><div className="detail-value">{selected.phone || '-'}</div></div>
            <div className="detail-section"><h4>Channel</h4><span className="tag">{selected.channel}</span></div>
            <div className="detail-section"><h4>Status</h4><span className={`badge badge-${selected.status === 'active' ? 'active' : 'inactive'}`}>{selected.status}</span></div>
            <div className="detail-section"><h4>Conversations</h4><div className="detail-value">{selected.conversations_count}</div></div>
            <div className="detail-section"><h4>Last Seen</h4><div className="detail-value">{new Date(selected.last_seen).toLocaleString()}</div></div>
          </div>
          <div className="detail-section"><h4>Tags</h4><div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>{(selected.tags || []).map((t, i) => <span key={i} className="tag">{t}</span>)}</div></div>
          <div className="detail-section"><h4>Chatbot</h4><div className="detail-value">{selected.chatbot_name || '-'}</div></div>
        </DetailModal>
      )}

      {showForm && (
        <FormModal title={editing ? 'Edit Contact' : 'New Contact'} onClose={() => { setShowForm(false); setEditing(null); }} onSubmit={handleSubmit}>
          <div className="form-group"><label>Chatbot</label><select className="form-select" value={form.chatbot_id} onChange={e => setForm({ ...form, chatbot_id: e.target.value })}><option value="">Select...</option>{chatbots.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}</select></div>
          <div className="form-row">
            <div className="form-group"><label>Name</label><input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required /></div>
            <div className="form-group"><label>Email</label><input className="form-input" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label>Phone</label><input className="form-input" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
            <div className="form-group"><label>Channel</label><select className="form-select" value={form.channel} onChange={e => setForm({ ...form, channel: e.target.value })}><option value="web">Web</option><option value="whatsapp">WhatsApp</option><option value="slack">Slack</option></select></div>
          </div>
          <div className="form-group"><label>Tags (comma separated)</label><input className="form-input" value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} placeholder="vip, enterprise, lead" /></div>
          <div className="form-group"><label>Status</label><select className="form-select" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}><option value="active">Active</option><option value="inactive">Inactive</option></select></div>
        </FormModal>
      )}
    </div>
  );
}
