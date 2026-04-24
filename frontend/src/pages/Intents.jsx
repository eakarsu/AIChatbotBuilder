import React, { useState, useEffect } from 'react';
import api from '../api';
import DetailModal from '../components/DetailModal';
import FormModal from '../components/FormModal';
import AIOutput from '../components/AIOutput';

export default function Intents() {
  const [items, setItems] = useState([]);
  const [chatbots, setChatbots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState('');
  const [testText, setTestText] = useState('');
  const [aiResult, setAiResult] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [form, setForm] = useState({ chatbot_id: '', name: '', description: '', examples: '', confidence_threshold: 0.7, status: 'active' });

  const load = () => { setLoading(true); api.getAll('intents').then(data => { setItems(data); setLoading(false); }).catch(() => setLoading(false)); };
  useEffect(() => { load(); api.getAll('chatbots').then(setChatbots).catch(() => {}); }, []);

  const handleSubmit = async () => {
    const examples = form.examples.split('\n').filter(Boolean);
    const data = { ...form, examples };
    if (editing) await api.update('intents', editing.id, data);
    else await api.create('intents', data);
    setShowForm(false); setEditing(null); load();
  };

  const handleEdit = (item) => {
    setForm({ chatbot_id: item.chatbot_id, name: item.name, description: item.description || '', examples: (item.examples || []).join('\n'), confidence_threshold: item.confidence_threshold, status: item.status });
    setEditing(item); setSelected(null); setShowForm(true);
  };

  const handleDelete = async (item) => { if (!confirm('Delete?')) return; await api.remove('intents', item.id); setSelected(null); load(); };

  const suggestIntents = async () => {
    if (!testText.trim()) return;
    setAiLoading(true);
    try { const data = await api.aiSuggestIntents({ text: testText }); setAiResult(data); }
    catch (err) { setAiResult({ suggestion: 'Error: ' + err.message }); }
    setAiLoading(false);
  };

  const filtered = items.filter(i => i.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <div className="page-header">
        <div><h2>Intents</h2><p>Manage conversation intents for NLU</p></div>
        <button className="btn btn-primary" onClick={() => { setForm({ chatbot_id: chatbots[0]?.id || '', name: '', description: '', examples: '', confidence_threshold: 0.7, status: 'active' }); setEditing(null); setShowForm(true); }}>
          <i className="fa-solid fa-plus"></i> New Intent
        </button>
      </div>

      <div className="toolbar">
        <div className="search-bar"><i className="fa-solid fa-search"></i><input placeholder="Search intents..." value={search} onChange={e => setSearch(e.target.value)} /></div>
        <div className="toolbar-actions" style={{ display: 'flex', gap: '8px' }}>
          <input className="form-input" style={{ width: '300px', padding: '8px 12px' }} placeholder="Test text for intent detection..." value={testText} onChange={e => setTestText(e.target.value)} onKeyDown={e => e.key === 'Enter' && suggestIntents()} />
          <button className="btn btn-primary btn-sm" onClick={suggestIntents} disabled={aiLoading}>{aiLoading ? 'Analyzing...' : <><i className="fa-solid fa-sparkles"></i> Detect Intent</>}</button>
        </div>
      </div>

      {aiResult && <AIOutput content={aiResult.suggestion} model={aiResult.model} usage={aiResult.usage} title="Intent Detection Result" />}

      {loading ? <div className="loading"><div className="spinner"></div> Loading...</div> : (
        <div className="table-container" style={{ marginTop: aiResult ? '20px' : '0' }}>
          <table className="data-table">
            <thead><tr><th>Intent</th><th>Chatbot</th><th>Examples</th><th>Threshold</th><th>Status</th></tr></thead>
            <tbody>
              {filtered.map(item => (
                <tr key={item.id} onClick={() => setSelected(item)}>
                  <td><strong>{item.name}</strong><br/><small style={{color:'var(--text-light)'}}>{item.description}</small></td>
                  <td>{item.chatbot_name || '-'}</td>
                  <td>{(item.examples || []).length} examples</td>
                  <td>{(item.confidence_threshold * 100).toFixed(0)}%</td>
                  <td><span className={`badge badge-${item.status === 'active' ? 'active' : 'inactive'}`}>{item.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selected && (
        <DetailModal title={`Intent: ${selected.name}`} onClose={() => setSelected(null)} onEdit={() => handleEdit(selected)} onDelete={() => handleDelete(selected)}>
          <div className="detail-grid">
            <div className="detail-section"><h4>Chatbot</h4><div className="detail-value">{selected.chatbot_name || '-'}</div></div>
            <div className="detail-section"><h4>Threshold</h4><div className="detail-value">{(selected.confidence_threshold * 100).toFixed(0)}%</div></div>
            <div className="detail-section"><h4>Status</h4><span className={`badge badge-${selected.status === 'active' ? 'active' : 'inactive'}`}>{selected.status}</span></div>
          </div>
          <div className="detail-section"><h4>Description</h4><div className="detail-value">{selected.description || 'No description'}</div></div>
          <div className="detail-section">
            <h4>Training Examples</h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {(selected.examples || []).map((ex, i) => <span key={i} className="tag">{ex}</span>)}
            </div>
          </div>
        </DetailModal>
      )}

      {showForm && (
        <FormModal title={editing ? 'Edit Intent' : 'New Intent'} onClose={() => { setShowForm(false); setEditing(null); }} onSubmit={handleSubmit}>
          <div className="form-group"><label>Chatbot</label><select className="form-select" value={form.chatbot_id} onChange={e => setForm({ ...form, chatbot_id: e.target.value })}><option value="">Select...</option>{chatbots.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}</select></div>
          <div className="form-group"><label>Name</label><input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required /></div>
          <div className="form-group"><label>Description</label><input className="form-input" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
          <div className="form-group"><label>Examples (one per line)</label><textarea className="form-textarea" value={form.examples} onChange={e => setForm({ ...form, examples: e.target.value })} placeholder="hello&#10;hi there&#10;good morning" /></div>
          <div className="form-row">
            <div className="form-group"><label>Confidence Threshold</label><input className="form-input" type="number" step="0.05" min="0" max="1" value={form.confidence_threshold} onChange={e => setForm({ ...form, confidence_threshold: parseFloat(e.target.value) })} /></div>
            <div className="form-group"><label>Status</label><select className="form-select" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}><option value="active">Active</option><option value="inactive">Inactive</option></select></div>
          </div>
        </FormModal>
      )}
    </div>
  );
}
