import React, { useState, useEffect } from 'react';
import api from '../api';
import DetailModal from '../components/DetailModal';
import FormModal from '../components/FormModal';
import AIOutput from '../components/AIOutput';

export default function KnowledgeBase() {
  const [items, setItems] = useState([]);
  const [chatbots, setChatbots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState('');
  const [kbQuery, setKbQuery] = useState('');
  const [aiResult, setAiResult] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [form, setForm] = useState({ chatbot_id: '', name: '', description: '', type: 'document', content: '' });

  const load = () => { setLoading(true); api.getAll('knowledge-bases').then(data => { setItems(data); setLoading(false); }).catch(() => setLoading(false)); };
  useEffect(() => { load(); api.getAll('chatbots').then(setChatbots).catch(() => {}); }, []);

  const handleSubmit = async () => {
    if (editing) await api.update('knowledge-bases', editing.id, form);
    else await api.create('knowledge-bases', form);
    setShowForm(false); setEditing(null); load();
  };

  const handleEdit = (item) => {
    setForm({ chatbot_id: item.chatbot_id, name: item.name, description: item.description || '', type: item.type, content: item.content || '' });
    setEditing(item); setSelected(null); setShowForm(true);
  };

  const handleDelete = async (item) => { if (!confirm('Delete?')) return; await api.remove('knowledge-bases', item.id); setSelected(null); load(); };

  const handleKbQuery = async () => {
    if (!kbQuery.trim()) return;
    setAiLoading(true);
    try {
      const data = await api.aiKbQuery({ question: kbQuery, chatbot_id: selected?.chatbot_id });
      setAiResult(data);
    } catch (err) { setAiResult({ answer: 'Error: ' + err.message }); }
    setAiLoading(false);
  };

  const filtered = items.filter(i => i.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <div className="page-header">
        <div><h2>Knowledge Base</h2><p>Manage documents and FAQ content for your chatbots</p></div>
        <button className="btn btn-primary" onClick={() => { setForm({ chatbot_id: chatbots[0]?.id || '', name: '', description: '', type: 'document', content: '' }); setEditing(null); setShowForm(true); }}>
          <i className="fa-solid fa-plus"></i> New Document
        </button>
      </div>

      <div className="toolbar">
        <div className="search-bar"><i className="fa-solid fa-search"></i><input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} /></div>
      </div>

      {loading ? <div className="loading"><div className="spinner"></div> Loading...</div> : (
        <div className="table-container">
          <table className="data-table">
            <thead><tr><th>Name</th><th>Chatbot</th><th>Type</th><th>Status</th><th>Chunks</th><th>Created</th></tr></thead>
            <tbody>
              {filtered.map(item => (
                <tr key={item.id} onClick={() => setSelected(item)}>
                  <td><strong>{item.name}</strong><br/><small style={{color:'var(--text-light)'}}>{item.description}</small></td>
                  <td>{item.chatbot_name || '-'}</td>
                  <td><span className="tag">{item.type}</span></td>
                  <td><span className={`badge badge-${item.status === 'active' ? 'active' : 'inactive'}`}>{item.status}</span></td>
                  <td>{item.chunks_count}</td>
                  <td>{new Date(item.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selected && (
        <DetailModal title={selected.name} onClose={() => { setSelected(null); setAiResult(null); }} onEdit={() => handleEdit(selected)} onDelete={() => handleDelete(selected)}>
          <div className="detail-grid">
            <div className="detail-section"><h4>Type</h4><span className="tag">{selected.type}</span></div>
            <div className="detail-section"><h4>Status</h4><span className={`badge badge-${selected.status === 'active' ? 'active' : 'inactive'}`}>{selected.status}</span></div>
            <div className="detail-section"><h4>Chatbot</h4><div className="detail-value">{selected.chatbot_name || '-'}</div></div>
            <div className="detail-section"><h4>Chunks</h4><div className="detail-value">{selected.chunks_count}</div></div>
          </div>
          <div className="detail-section"><h4>Content</h4><div className="detail-value">{selected.content || 'No content'}</div></div>
          <div style={{ marginTop: '20px', display: 'flex', gap: '8px' }}>
            <input className="form-input" placeholder="Ask a question about this knowledge base..." value={kbQuery} onChange={e => setKbQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleKbQuery()} />
            <button className="btn btn-primary btn-sm" onClick={handleKbQuery} disabled={aiLoading}>{aiLoading ? 'Asking...' : 'Ask AI'}</button>
          </div>
          {aiResult && <AIOutput content={aiResult.answer} model={aiResult.model} usage={aiResult.usage} title="Knowledge Base Answer" />}
        </DetailModal>
      )}

      {showForm && (
        <FormModal title={editing ? 'Edit Document' : 'New Document'} onClose={() => { setShowForm(false); setEditing(null); }} onSubmit={handleSubmit}>
          <div className="form-group"><label>Chatbot</label><select className="form-select" value={form.chatbot_id} onChange={e => setForm({ ...form, chatbot_id: e.target.value })}><option value="">Select...</option>{chatbots.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}</select></div>
          <div className="form-group"><label>Name</label><input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required /></div>
          <div className="form-group"><label>Description</label><input className="form-input" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
          <div className="form-group"><label>Type</label><select className="form-select" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}><option value="document">Document</option><option value="faq">FAQ</option><option value="url">URL</option></select></div>
          <div className="form-group"><label>Content</label><textarea className="form-textarea" style={{ minHeight: '150px' }} value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} /></div>
        </FormModal>
      )}
    </div>
  );
}
