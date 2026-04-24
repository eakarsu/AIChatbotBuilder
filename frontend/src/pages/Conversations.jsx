import React, { useState, useEffect } from 'react';
import api from '../api';
import DetailModal from '../components/DetailModal';
import FormModal from '../components/FormModal';
import AIOutput from '../components/AIOutput';

export default function Conversations() {
  const [items, setItems] = useState([]);
  const [chatbots, setChatbots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState('');
  const [aiResult, setAiResult] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [form, setForm] = useState({ chatbot_id: '', channel: 'web', visitor_name: '', visitor_email: '', status: 'active' });

  const load = () => { setLoading(true); api.getAll('conversations').then(data => { setItems(data); setLoading(false); }).catch(() => setLoading(false)); };
  useEffect(() => { load(); api.getAll('chatbots').then(setChatbots).catch(() => {}); }, []);

  const handleSelect = async (item) => {
    const detail = await api.getOne('conversations', item.id);
    setSelected(detail);
  };

  const handleSubmit = async () => {
    if (editing) await api.update('conversations', editing.id, form);
    else await api.create('conversations', form);
    setShowForm(false); setEditing(null); load();
  };

  const handleEdit = (item) => {
    setForm({ chatbot_id: item.chatbot_id, channel: item.channel, visitor_name: item.visitor_name || '', visitor_email: item.visitor_email || '', status: item.status });
    setEditing(item); setSelected(null); setShowForm(true);
  };

  const handleDelete = async (item) => { if (!confirm('Delete?')) return; await api.remove('conversations', item.id); setSelected(null); load(); };

  const analyzeConversation = async () => {
    if (!selected?.id) return;
    setAiLoading(true);
    try {
      const data = await api.aiAnalyzeConversation({ conversation_id: selected.id });
      setAiResult(data);
    } catch (err) { setAiResult({ analysis: 'Error: ' + err.message }); }
    setAiLoading(false);
  };

  const filtered = items.filter(i => (i.visitor_name || '').toLowerCase().includes(search.toLowerCase()) || (i.visitor_email || '').toLowerCase().includes(search.toLowerCase()));
  const channelIcon = { web: 'fa-globe', whatsapp: 'fa-brands fa-whatsapp', slack: 'fa-brands fa-slack' };

  return (
    <div>
      <div className="page-header">
        <div><h2>Conversations</h2><p>View and manage chat sessions</p></div>
        <button className="btn btn-primary" onClick={() => { setForm({ chatbot_id: chatbots[0]?.id || '', channel: 'web', visitor_name: '', visitor_email: '', status: 'active' }); setEditing(null); setShowForm(true); }}>
          <i className="fa-solid fa-plus"></i> New Conversation
        </button>
      </div>

      <div className="toolbar">
        <div className="search-bar"><i className="fa-solid fa-search"></i><input placeholder="Search visitors..." value={search} onChange={e => setSearch(e.target.value)} /></div>
      </div>

      {loading ? <div className="loading"><div className="spinner"></div> Loading...</div> : (
        <div className="table-container">
          <table className="data-table">
            <thead><tr><th>Visitor</th><th>Chatbot</th><th>Channel</th><th>Messages</th><th>Satisfaction</th><th>Status</th><th>Date</th></tr></thead>
            <tbody>
              {filtered.map(item => (
                <tr key={item.id} onClick={() => handleSelect(item)}>
                  <td><strong>{item.visitor_name || 'Anonymous'}</strong><br/><small style={{color:'var(--text-light)'}}>{item.visitor_email}</small></td>
                  <td>{item.chatbot_name || '-'}</td>
                  <td><i className={`fa-solid ${channelIcon[item.channel] || 'fa-globe'}`}></i> {item.channel}</td>
                  <td>{item.messages_count}</td>
                  <td>{item.satisfaction_score ? `${(item.satisfaction_score * 100).toFixed(0)}%` : '-'}</td>
                  <td><span className={`badge badge-${item.status === 'active' ? 'active' : 'closed'}`}>{item.status}</span></td>
                  <td>{new Date(item.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selected && (
        <DetailModal title={`Conversation with ${selected.visitor_name || 'Anonymous'}`} onClose={() => { setSelected(null); setAiResult(null); }} onEdit={() => handleEdit(selected)} onDelete={() => handleDelete(selected)}>
          <div className="detail-grid">
            <div className="detail-section"><h4>Channel</h4><div className="detail-value"><i className={`fa-solid ${channelIcon[selected.channel] || 'fa-globe'}`}></i> {selected.channel}</div></div>
            <div className="detail-section"><h4>Status</h4><span className={`badge badge-${selected.status === 'active' ? 'active' : 'closed'}`}>{selected.status}</span></div>
            <div className="detail-section"><h4>Email</h4><div className="detail-value">{selected.visitor_email || '-'}</div></div>
            <div className="detail-section"><h4>Satisfaction</h4><div className="detail-value">{selected.satisfaction_score ? `${(selected.satisfaction_score * 100).toFixed(0)}%` : 'Not rated'}</div></div>
          </div>
          <div className="detail-section">
            <h4>Messages ({selected.messages?.length || 0})</h4>
            <div style={{ maxHeight: '300px', overflowY: 'auto', background: '#F8FAFC', borderRadius: '8px', padding: '16px' }}>
              {(selected.messages || []).map(msg => (
                <div key={msg.id} className={`chat-message ${msg.role}`} style={{ marginBottom: '12px' }}>
                  <div className="msg-avatar" style={{ background: msg.role === 'user' ? '#4F46E5' : '#10B981' }}>
                    <i className={`fa-solid ${msg.role === 'user' ? 'fa-user' : 'fa-robot'}`}></i>
                  </div>
                  <div className="msg-content">{msg.content}</div>
                </div>
              ))}
              {(!selected.messages || selected.messages.length === 0) && <p style={{ color: 'var(--text-light)', textAlign: 'center' }}>No messages</p>}
            </div>
          </div>
          <button className="btn btn-primary btn-sm" style={{ marginTop: '12px' }} onClick={analyzeConversation} disabled={aiLoading}>
            {aiLoading ? 'Analyzing...' : <><i className="fa-solid fa-sparkles"></i> AI Analyze Conversation</>}
          </button>
          {aiResult && <AIOutput content={aiResult.analysis} model={aiResult.model} usage={aiResult.usage} title="Conversation Analysis" />}
        </DetailModal>
      )}

      {showForm && (
        <FormModal title={editing ? 'Edit Conversation' : 'New Conversation'} onClose={() => { setShowForm(false); setEditing(null); }} onSubmit={handleSubmit}>
          <div className="form-group"><label>Chatbot</label><select className="form-select" value={form.chatbot_id} onChange={e => setForm({ ...form, chatbot_id: e.target.value })}><option value="">Select...</option>{chatbots.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}</select></div>
          <div className="form-row">
            <div className="form-group"><label>Visitor Name</label><input className="form-input" value={form.visitor_name} onChange={e => setForm({ ...form, visitor_name: e.target.value })} /></div>
            <div className="form-group"><label>Visitor Email</label><input className="form-input" type="email" value={form.visitor_email} onChange={e => setForm({ ...form, visitor_email: e.target.value })} /></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label>Channel</label><select className="form-select" value={form.channel} onChange={e => setForm({ ...form, channel: e.target.value })}><option value="web">Web</option><option value="whatsapp">WhatsApp</option><option value="slack">Slack</option></select></div>
            <div className="form-group"><label>Status</label><select className="form-select" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}><option value="active">Active</option><option value="closed">Closed</option></select></div>
          </div>
        </FormModal>
      )}
    </div>
  );
}
