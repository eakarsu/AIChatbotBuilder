import React, { useState, useEffect } from 'react';
import api from '../api';
import DetailModal from '../components/DetailModal';
import FormModal from '../components/FormModal';
import AIOutput from '../components/AIOutput';

export default function Responses() {
  const [items, setItems] = useState([]);
  const [chatbots, setChatbots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState('');
  const [aiResult, setAiResult] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [form, setForm] = useState({ chatbot_id: '', name: '', intent: '', content: '', type: 'text', variations: '', status: 'active' });

  const load = () => { setLoading(true); api.getAll('responses').then(data => { setItems(data); setLoading(false); }).catch(() => setLoading(false)); };
  useEffect(() => { load(); api.getAll('chatbots').then(setChatbots).catch(() => {}); }, []);

  const handleSubmit = async () => {
    const variations = form.variations.split('\n').filter(Boolean);
    const data = { ...form, variations };
    if (editing) await api.update('responses', editing.id, data);
    else await api.create('responses', data);
    setShowForm(false); setEditing(null); load();
  };

  const handleEdit = (item) => {
    setForm({ chatbot_id: item.chatbot_id, name: item.name, intent: item.intent || '', content: item.content, type: item.type, variations: (item.variations || []).join('\n'), status: item.status });
    setEditing(item); setSelected(null); setShowForm(true);
  };

  const handleDelete = async (item) => { if (!confirm('Delete?')) return; await api.remove('responses', item.id); setSelected(null); load(); };

  const improveResponse = async () => {
    if (!selected) return;
    setAiLoading(true);
    try { const data = await api.aiImproveResponse({ current_response: selected.content, intent: selected.intent }); setAiResult(data); }
    catch (err) { setAiResult({ improvement: 'Error: ' + err.message }); }
    setAiLoading(false);
  };

  const filtered = items.filter(i => i.name.toLowerCase().includes(search.toLowerCase()) || (i.intent || '').toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <div className="page-header">
        <div><h2>Responses</h2><p>Manage bot response templates</p></div>
        <button className="btn btn-primary" onClick={() => { setForm({ chatbot_id: chatbots[0]?.id || '', name: '', intent: '', content: '', type: 'text', variations: '', status: 'active' }); setEditing(null); setShowForm(true); }}>
          <i className="fa-solid fa-plus"></i> New Response
        </button>
      </div>

      <div className="toolbar">
        <div className="search-bar"><i className="fa-solid fa-search"></i><input placeholder="Search responses..." value={search} onChange={e => setSearch(e.target.value)} /></div>
      </div>

      {loading ? <div className="loading"><div className="spinner"></div> Loading...</div> : (
        <div className="table-container">
          <table className="data-table">
            <thead><tr><th>Name</th><th>Intent</th><th>Chatbot</th><th>Type</th><th>Variations</th><th>Status</th></tr></thead>
            <tbody>
              {filtered.map(item => (
                <tr key={item.id} onClick={() => { setSelected(item); setAiResult(null); }}>
                  <td><strong>{item.name}</strong><br/><small style={{color:'var(--text-light)', maxWidth: '300px', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>{item.content}</small></td>
                  <td><span className="tag">{item.intent}</span></td>
                  <td>{item.chatbot_name || '-'}</td>
                  <td>{item.type}</td>
                  <td>{(item.variations || []).length}</td>
                  <td><span className={`badge badge-${item.status === 'active' ? 'active' : 'inactive'}`}>{item.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selected && (
        <DetailModal title={selected.name} onClose={() => { setSelected(null); setAiResult(null); }} onEdit={() => handleEdit(selected)} onDelete={() => handleDelete(selected)}>
          <div className="detail-grid">
            <div className="detail-section"><h4>Intent</h4><span className="tag">{selected.intent}</span></div>
            <div className="detail-section"><h4>Type</h4><div className="detail-value">{selected.type}</div></div>
            <div className="detail-section"><h4>Status</h4><span className={`badge badge-${selected.status === 'active' ? 'active' : 'inactive'}`}>{selected.status}</span></div>
            <div className="detail-section"><h4>Chatbot</h4><div className="detail-value">{selected.chatbot_name || '-'}</div></div>
          </div>
          <div className="detail-section"><h4>Response Content</h4><div className="detail-value" style={{ background: '#F8FAFC', padding: '12px', borderRadius: '8px' }}>{selected.content}</div></div>
          {(selected.variations || []).length > 0 && (
            <div className="detail-section">
              <h4>Variations</h4>
              {selected.variations.map((v, i) => <div key={i} className="detail-value" style={{ background: '#F8FAFC', padding: '8px 12px', borderRadius: '6px', marginBottom: '6px', fontSize: '13px' }}>{v}</div>)}
            </div>
          )}
          <button className="btn btn-primary btn-sm" style={{ marginTop: '12px' }} onClick={improveResponse} disabled={aiLoading}>
            {aiLoading ? 'Improving...' : <><i className="fa-solid fa-sparkles"></i> AI Improve Response</>}
          </button>
          {aiResult && <AIOutput content={aiResult.improvement} model={aiResult.model} usage={aiResult.usage} title="Improved Response" />}
        </DetailModal>
      )}

      {showForm && (
        <FormModal title={editing ? 'Edit Response' : 'New Response'} onClose={() => { setShowForm(false); setEditing(null); }} onSubmit={handleSubmit}>
          <div className="form-group"><label>Chatbot</label><select className="form-select" value={form.chatbot_id} onChange={e => setForm({ ...form, chatbot_id: e.target.value })}><option value="">Select...</option>{chatbots.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}</select></div>
          <div className="form-row">
            <div className="form-group"><label>Name</label><input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required /></div>
            <div className="form-group"><label>Intent</label><input className="form-input" value={form.intent} onChange={e => setForm({ ...form, intent: e.target.value })} /></div>
          </div>
          <div className="form-group"><label>Content</label><textarea className="form-textarea" value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} required /></div>
          <div className="form-group"><label>Variations (one per line)</label><textarea className="form-textarea" value={form.variations} onChange={e => setForm({ ...form, variations: e.target.value })} /></div>
          <div className="form-row">
            <div className="form-group"><label>Type</label><select className="form-select" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}><option value="text">Text</option><option value="rich">Rich</option><option value="button">Button</option></select></div>
            <div className="form-group"><label>Status</label><select className="form-select" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}><option value="active">Active</option><option value="inactive">Inactive</option></select></div>
          </div>
        </FormModal>
      )}
    </div>
  );
}
