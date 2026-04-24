import React, { useState, useEffect } from 'react';
import api from '../api';
import DetailModal from '../components/DetailModal';
import FormModal from '../components/FormModal';

const statusColors = { sent: '#10B981', draft: '#6B7280', scheduled: '#3B82F6', failed: '#EF4444' };
const statusIcons = { sent: 'fa-check-circle', draft: 'fa-pencil', scheduled: 'fa-clock', failed: 'fa-xmark-circle' };

export default function Broadcasts() {
  const [items, setItems] = useState([]);
  const [chatbots, setChatbots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ chatbot_id: '', name: '', message: '', channel: 'web', status: 'draft' });

  const load = () => { setLoading(true); api.getAll('broadcasts').then(data => { setItems(data); setLoading(false); }).catch(() => setLoading(false)); };
  useEffect(() => { load(); api.getAll('chatbots').then(setChatbots).catch(() => {}); }, []);

  const handleSubmit = async () => {
    if (editing) await api.update('broadcasts', editing.id, form);
    else await api.create('broadcasts', form);
    setShowForm(false); setEditing(null); load();
  };

  const handleEdit = (item) => {
    setForm({ chatbot_id: item.chatbot_id, name: item.name, message: item.message, channel: item.channel, status: item.status });
    setEditing(item); setSelected(null); setShowForm(true);
  };

  const handleDelete = async (item) => { if (!confirm('Delete?')) return; await api.remove('broadcasts', item.id); setSelected(null); load(); };
  const filtered = items.filter(i => i.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <div className="page-header">
        <div><h2>Broadcasts</h2><p>Send mass messages to your audience</p></div>
        <button className="btn btn-primary" onClick={() => { setForm({ chatbot_id: chatbots[0]?.id || '', name: '', message: '', channel: 'web', status: 'draft' }); setEditing(null); setShowForm(true); }}>
          <i className="fa-solid fa-plus"></i> New Broadcast
        </button>
      </div>

      <div className="toolbar">
        <div className="search-bar"><i className="fa-solid fa-search"></i><input placeholder="Search broadcasts..." value={search} onChange={e => setSearch(e.target.value)} /></div>
      </div>

      {loading ? <div className="loading"><div className="spinner"></div> Loading...</div> : (
        <div className="table-container">
          <table className="data-table">
            <thead><tr><th>Name</th><th>Channel</th><th>Recipients</th><th>Delivered</th><th>Opened</th><th>Status</th><th>Date</th></tr></thead>
            <tbody>
              {filtered.map(item => (
                <tr key={item.id} onClick={() => setSelected(item)}>
                  <td><strong>{item.name}</strong><br/><small style={{ color: 'var(--text-light)', maxWidth: '300px', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.message}</small></td>
                  <td><span className="tag">{item.channel}</span></td>
                  <td>{item.recipients_count?.toLocaleString()}</td>
                  <td>{item.delivered_count?.toLocaleString()}{item.recipients_count > 0 && <small style={{ color: 'var(--text-light)' }}> ({Math.round(item.delivered_count / item.recipients_count * 100)}%)</small>}</td>
                  <td>{item.opened_count?.toLocaleString()}{item.delivered_count > 0 && <small style={{ color: 'var(--text-light)' }}> ({Math.round(item.opened_count / item.delivered_count * 100)}%)</small>}</td>
                  <td><span className="badge" style={{ background: (statusColors[item.status] || '#6B7280') + '20', color: statusColors[item.status] }}><i className={`fa-solid ${statusIcons[item.status] || 'fa-circle'}`} style={{ marginRight: 4 }}></i> {item.status}</span></td>
                  <td>{new Date(item.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selected && (
        <DetailModal title={selected.name} onClose={() => setSelected(null)} onEdit={() => handleEdit(selected)} onDelete={() => handleDelete(selected)}>
          <div className="detail-section"><h4>Message</h4><div className="detail-value" style={{ background: '#F8FAFC', padding: '16px', borderRadius: '8px', lineHeight: '1.6' }}>{selected.message}</div></div>
          <div className="detail-grid" style={{ marginTop: '16px' }}>
            <div className="detail-section"><h4>Status</h4><span className="badge" style={{ background: (statusColors[selected.status] || '#6B7280') + '20', color: statusColors[selected.status] }}>{selected.status}</span></div>
            <div className="detail-section"><h4>Channel</h4><span className="tag">{selected.channel}</span></div>
            <div className="detail-section"><h4>Recipients</h4><div className="detail-value" style={{ fontWeight: 700, fontSize: '18px' }}>{selected.recipients_count?.toLocaleString()}</div></div>
            <div className="detail-section"><h4>Delivered</h4><div className="detail-value" style={{ fontWeight: 700, fontSize: '18px', color: '#10B981' }}>{selected.delivered_count?.toLocaleString()}</div></div>
            <div className="detail-section"><h4>Opened</h4><div className="detail-value" style={{ fontWeight: 700, fontSize: '18px', color: '#3B82F6' }}>{selected.opened_count?.toLocaleString()}</div></div>
            <div className="detail-section"><h4>Chatbot</h4><div className="detail-value">{selected.chatbot_name || '-'}</div></div>
          </div>
          {selected.recipients_count > 0 && (
            <div style={{ marginTop: '16px' }}>
              <h4 style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-light)', textTransform: 'uppercase', marginBottom: '8px' }}>Delivery Funnel</h4>
              <div style={{ display: 'flex', gap: '4px', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${(selected.opened_count / selected.recipients_count) * 100}%`, background: '#3B82F6' }}></div>
                <div style={{ width: `${((selected.delivered_count - selected.opened_count) / selected.recipients_count) * 100}%`, background: '#10B981' }}></div>
                <div style={{ flex: 1, background: '#E2E8F0' }}></div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', fontSize: '11px', color: 'var(--text-light)' }}>
                <span>Opened: {Math.round(selected.opened_count / selected.recipients_count * 100)}%</span>
                <span>Delivered: {Math.round(selected.delivered_count / selected.recipients_count * 100)}%</span>
              </div>
            </div>
          )}
        </DetailModal>
      )}

      {showForm && (
        <FormModal title={editing ? 'Edit Broadcast' : 'New Broadcast'} onClose={() => { setShowForm(false); setEditing(null); }} onSubmit={handleSubmit}>
          <div className="form-group"><label>Chatbot</label><select className="form-select" value={form.chatbot_id} onChange={e => setForm({ ...form, chatbot_id: e.target.value })}><option value="">Select...</option>{chatbots.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}</select></div>
          <div className="form-group"><label>Campaign Name</label><input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required /></div>
          <div className="form-group"><label>Message</label><textarea className="form-textarea" style={{ minHeight: '120px' }} value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} required placeholder="Write your broadcast message..." /></div>
          <div className="form-row">
            <div className="form-group"><label>Channel</label><select className="form-select" value={form.channel} onChange={e => setForm({ ...form, channel: e.target.value })}><option value="web">Web</option><option value="whatsapp">WhatsApp</option><option value="slack">Slack</option></select></div>
            <div className="form-group"><label>Status</label><select className="form-select" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}><option value="draft">Draft</option><option value="scheduled">Scheduled</option><option value="sent">Sent</option></select></div>
          </div>
        </FormModal>
      )}
    </div>
  );
}
