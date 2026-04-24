import React, { useState, useEffect } from 'react';
import api from '../api';
import DetailModal from '../components/DetailModal';
import FormModal from '../components/FormModal';

export default function QuickReplies() {
  const [items, setItems] = useState([]);
  const [chatbots, setChatbots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ chatbot_id: '', name: '', text: '', type: 'text', category: '', sort_order: 0, status: 'active' });

  const load = () => { setLoading(true); api.getAll('quick-replies').then(data => { setItems(data); setLoading(false); }).catch(() => setLoading(false)); };
  useEffect(() => { load(); api.getAll('chatbots').then(setChatbots).catch(() => {}); }, []);

  const handleSubmit = async () => {
    if (editing) await api.update('quick-replies', editing.id, form);
    else await api.create('quick-replies', form);
    setShowForm(false); setEditing(null); load();
  };

  const handleEdit = (item) => {
    setForm({ chatbot_id: item.chatbot_id, name: item.name, text: item.text, type: item.type, category: item.category || '', sort_order: item.sort_order || 0, status: item.status });
    setEditing(item); setSelected(null); setShowForm(true);
  };

  const handleDelete = async (item) => { if (!confirm('Delete?')) return; await api.remove('quick-replies', item.id); setSelected(null); load(); };
  const filtered = items.filter(i => i.name.toLowerCase().includes(search.toLowerCase()) || i.text.toLowerCase().includes(search.toLowerCase()));
  const catColors = { confirmation: '#10B981', escalation: '#EF4444', sales: '#F59E0B', orders: '#3B82F6', support: '#8B5CF6', billing: '#EC4899', general: '#6B7280', scheduling: '#0891B2', feedback: '#D97706', marketing: '#059669' };

  return (
    <div>
      <div className="page-header">
        <div><h2>Quick Replies</h2><p>Manage predefined reply buttons for chatbots</p></div>
        <button className="btn btn-primary" onClick={() => { setForm({ chatbot_id: chatbots[0]?.id || '', name: '', text: '', type: 'text', category: '', sort_order: 0, status: 'active' }); setEditing(null); setShowForm(true); }}>
          <i className="fa-solid fa-plus"></i> New Quick Reply
        </button>
      </div>

      <div className="toolbar">
        <div className="search-bar"><i className="fa-solid fa-search"></i><input placeholder="Search quick replies..." value={search} onChange={e => setSearch(e.target.value)} /></div>
      </div>

      {loading ? <div className="loading"><div className="spinner"></div> Loading...</div> : (
        <div className="card-grid">
          {filtered.map(item => (
            <div key={item.id} className="card card-clickable" onClick={() => setSelected(item)}>
              <div className="card-header">
                <div className="card-icon" style={{ background: catColors[item.category] || '#4F46E5' }}><i className="fa-solid fa-reply"></i></div>
                <span className={`badge badge-${item.status === 'active' ? 'active' : 'inactive'}`}>{item.status}</span>
              </div>
              <div className="card-title">{item.name}</div>
              <div className="card-subtitle" style={{ background: '#F8FAFC', padding: '8px 12px', borderRadius: '8px', marginTop: '8px', fontStyle: 'italic' }}>"{item.text}"</div>
              <div className="card-meta">
                <span><i className="fa-solid fa-folder"></i> {item.category}</span>
                <span><i className="fa-solid fa-sort"></i> Order: {item.sort_order}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {selected && (
        <DetailModal title={selected.name} onClose={() => setSelected(null)} onEdit={() => handleEdit(selected)} onDelete={() => handleDelete(selected)}>
          <div className="detail-section"><h4>Button Text</h4><div style={{ background: 'var(--primary)', color: 'white', display: 'inline-block', padding: '10px 20px', borderRadius: '20px', fontSize: '14px', fontWeight: 600 }}>{selected.text}</div></div>
          <div className="detail-grid" style={{ marginTop: '16px' }}>
            <div className="detail-section"><h4>Category</h4><span className="tag" style={{ background: (catColors[selected.category] || '#4F46E5') + '20', color: catColors[selected.category] || '#4F46E5' }}>{selected.category}</span></div>
            <div className="detail-section"><h4>Type</h4><div className="detail-value">{selected.type}</div></div>
            <div className="detail-section"><h4>Sort Order</h4><div className="detail-value">{selected.sort_order}</div></div>
            <div className="detail-section"><h4>Status</h4><span className={`badge badge-${selected.status === 'active' ? 'active' : 'inactive'}`}>{selected.status}</span></div>
            <div className="detail-section"><h4>Chatbot</h4><div className="detail-value">{selected.chatbot_name || '-'}</div></div>
          </div>
        </DetailModal>
      )}

      {showForm && (
        <FormModal title={editing ? 'Edit Quick Reply' : 'New Quick Reply'} onClose={() => { setShowForm(false); setEditing(null); }} onSubmit={handleSubmit}>
          <div className="form-group"><label>Chatbot</label><select className="form-select" value={form.chatbot_id} onChange={e => setForm({ ...form, chatbot_id: e.target.value })}><option value="">Select...</option>{chatbots.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}</select></div>
          <div className="form-group"><label>Button Label</label><input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required placeholder="e.g. Yes, No, Talk to Agent" /></div>
          <div className="form-group"><label>Message Text</label><textarea className="form-textarea" value={form.text} onChange={e => setForm({ ...form, text: e.target.value })} required placeholder="Text sent when user clicks this button" /></div>
          <div className="form-row">
            <div className="form-group"><label>Category</label><input className="form-input" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} placeholder="e.g. confirmation, sales" /></div>
            <div className="form-group"><label>Sort Order</label><input className="form-input" type="number" value={form.sort_order} onChange={e => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })} /></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label>Type</label><select className="form-select" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}><option value="text">Text</option><option value="url">URL</option><option value="postback">Postback</option></select></div>
            <div className="form-group"><label>Status</label><select className="form-select" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}><option value="active">Active</option><option value="inactive">Inactive</option></select></div>
          </div>
        </FormModal>
      )}
    </div>
  );
}
