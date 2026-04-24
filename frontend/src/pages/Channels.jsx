import React, { useState, useEffect } from 'react';
import api from '../api';
import DetailModal from '../components/DetailModal';
import FormModal from '../components/FormModal';

export default function Channels() {
  const [items, setItems] = useState([]);
  const [chatbots, setChatbots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ chatbot_id: '', type: 'web', name: '', status: 'inactive' });

  const load = () => { setLoading(true); api.getAll('channels').then(data => { setItems(data); setLoading(false); }).catch(() => setLoading(false)); };
  useEffect(() => { load(); api.getAll('chatbots').then(setChatbots).catch(() => {}); }, []);

  const handleSubmit = async () => {
    if (editing) await api.update('channels', editing.id, form);
    else await api.create('channels', form);
    setShowForm(false); setEditing(null); load();
  };

  const handleEdit = (item) => { setForm({ chatbot_id: item.chatbot_id, type: item.type, name: item.name, status: item.status }); setEditing(item); setSelected(null); setShowForm(true); };
  const handleDelete = async (item) => { if (!confirm('Delete?')) return; await api.remove('channels', item.id); setSelected(null); load(); };

  const filtered = items.filter(i => i.name.toLowerCase().includes(search.toLowerCase()));
  const typeIcon = { web: 'fa-globe', whatsapp: 'fa-brands fa-whatsapp', slack: 'fa-brands fa-slack' };
  const typeColor = { web: '#4F46E5', whatsapp: '#25D366', slack: '#4A154B' };

  return (
    <div>
      <div className="page-header">
        <div><h2>Channels</h2><p>Deploy chatbots across web, WhatsApp, and Slack</p></div>
        <button className="btn btn-primary" onClick={() => { setForm({ chatbot_id: chatbots[0]?.id || '', type: 'web', name: '', status: 'inactive' }); setEditing(null); setShowForm(true); }}>
          <i className="fa-solid fa-plus"></i> New Channel
        </button>
      </div>

      <div className="toolbar">
        <div className="search-bar"><i className="fa-solid fa-search"></i><input placeholder="Search channels..." value={search} onChange={e => setSearch(e.target.value)} /></div>
      </div>

      {loading ? <div className="loading"><div className="spinner"></div> Loading...</div> : (
        <div className="card-grid">
          {filtered.map(item => (
            <div key={item.id} className="card card-clickable" onClick={() => setSelected(item)}>
              <div className="card-header">
                <div className="channel-icon" style={{ background: typeColor[item.type] || '#4F46E5' }}>
                  <i className={`fa-solid ${typeIcon[item.type] || 'fa-globe'}`}></i>
                </div>
                <span className={`badge badge-${item.status === 'active' ? 'active' : 'inactive'}`}>{item.status}</span>
              </div>
              <div className="card-title">{item.name}</div>
              <div className="card-subtitle">{item.chatbot_name || 'Unassigned'}</div>
              <div className="card-meta">
                <span><i className="fa-solid fa-paper-plane"></i> {item.messages_sent?.toLocaleString()} sent</span>
                <span><i className="fa-solid fa-tower-broadcast"></i> {item.type}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {selected && (
        <DetailModal title={selected.name} onClose={() => setSelected(null)} onEdit={() => handleEdit(selected)} onDelete={() => handleDelete(selected)}>
          <div className="detail-grid">
            <div className="detail-section"><h4>Type</h4><div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><div className="channel-icon" style={{ background: typeColor[selected.type], width: 32, height: 32, fontSize: 14 }}><i className={`fa-solid ${typeIcon[selected.type]}`}></i></div> {selected.type}</div></div>
            <div className="detail-section"><h4>Status</h4><span className={`badge badge-${selected.status === 'active' ? 'active' : 'inactive'}`}>{selected.status}</span></div>
            <div className="detail-section"><h4>Chatbot</h4><div className="detail-value">{selected.chatbot_name || '-'}</div></div>
            <div className="detail-section"><h4>Messages Sent</h4><div className="detail-value">{selected.messages_sent?.toLocaleString()}</div></div>
          </div>
          <div className="detail-section"><h4>Configuration</h4><pre style={{ background: '#F1F5F9', padding: '12px', borderRadius: '8px', fontSize: '13px', overflow: 'auto' }}>{JSON.stringify(selected.config, null, 2)}</pre></div>
        </DetailModal>
      )}

      {showForm && (
        <FormModal title={editing ? 'Edit Channel' : 'New Channel'} onClose={() => { setShowForm(false); setEditing(null); }} onSubmit={handleSubmit}>
          <div className="form-group"><label>Chatbot</label><select className="form-select" value={form.chatbot_id} onChange={e => setForm({ ...form, chatbot_id: e.target.value })}><option value="">Select...</option>{chatbots.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}</select></div>
          <div className="form-group"><label>Name</label><input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required /></div>
          <div className="form-row">
            <div className="form-group"><label>Type</label><select className="form-select" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}><option value="web">Web</option><option value="whatsapp">WhatsApp</option><option value="slack">Slack</option></select></div>
            <div className="form-group"><label>Status</label><select className="form-select" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}><option value="inactive">Inactive</option><option value="active">Active</option></select></div>
          </div>
        </FormModal>
      )}
    </div>
  );
}
