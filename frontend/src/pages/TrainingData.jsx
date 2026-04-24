import React, { useState, useEffect } from 'react';
import api from '../api';
import DetailModal from '../components/DetailModal';
import FormModal from '../components/FormModal';
import AIOutput from '../components/AIOutput';

export default function TrainingData() {
  const [items, setItems] = useState([]);
  const [chatbots, setChatbots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState('');
  const [genIntent, setGenIntent] = useState('');
  const [genCount, setGenCount] = useState(10);
  const [aiResult, setAiResult] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [form, setForm] = useState({ chatbot_id: '', input_text: '', expected_intent: '', verified: false });

  const load = () => { setLoading(true); api.getAll('training-data').then(data => { setItems(data); setLoading(false); }).catch(() => setLoading(false)); };
  useEffect(() => { load(); api.getAll('chatbots').then(setChatbots).catch(() => {}); }, []);

  const handleSubmit = async () => {
    if (editing) await api.update('training-data', editing.id, form);
    else await api.create('training-data', form);
    setShowForm(false); setEditing(null); load();
  };

  const handleEdit = (item) => {
    setForm({ chatbot_id: item.chatbot_id, input_text: item.input_text, expected_intent: item.expected_intent || '', verified: item.verified });
    setEditing(item); setSelected(null); setShowForm(true);
  };

  const handleDelete = async (item) => { if (!confirm('Delete?')) return; await api.remove('training-data', item.id); setSelected(null); load(); };

  const generateTraining = async () => {
    if (!genIntent.trim()) return;
    setAiLoading(true);
    try { const data = await api.aiGenerateTrainingData({ intent: genIntent, count: genCount }); setAiResult(data); }
    catch (err) { setAiResult({ training_data: 'Error: ' + err.message }); }
    setAiLoading(false);
  };

  const filtered = items.filter(i => i.input_text.toLowerCase().includes(search.toLowerCase()) || (i.expected_intent || '').toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <div className="page-header">
        <div><h2>Training Data</h2><p>Manage training examples for NLU models</p></div>
        <button className="btn btn-primary" onClick={() => { setForm({ chatbot_id: chatbots[0]?.id || '', input_text: '', expected_intent: '', verified: false }); setEditing(null); setShowForm(true); }}>
          <i className="fa-solid fa-plus"></i> New Training Example
        </button>
      </div>

      <div className="toolbar">
        <div className="search-bar"><i className="fa-solid fa-search"></i><input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} /></div>
        <div className="toolbar-actions" style={{ display: 'flex', gap: '8px' }}>
          <input className="form-input" style={{ width: '160px', padding: '8px 12px' }} placeholder="Intent name..." value={genIntent} onChange={e => setGenIntent(e.target.value)} />
          <input className="form-input" style={{ width: '60px', padding: '8px 12px' }} type="number" min="1" max="20" value={genCount} onChange={e => setGenCount(parseInt(e.target.value) || 10)} />
          <button className="btn btn-primary btn-sm" onClick={generateTraining} disabled={aiLoading}>{aiLoading ? 'Generating...' : <><i className="fa-solid fa-sparkles"></i> AI Generate</>}</button>
        </div>
      </div>

      {aiResult && <AIOutput content={aiResult.training_data} model={aiResult.model} usage={aiResult.usage} title="Generated Training Data" />}

      {loading ? <div className="loading"><div className="spinner"></div> Loading...</div> : (
        <div className="table-container" style={{ marginTop: aiResult ? '20px' : '0' }}>
          <table className="data-table">
            <thead><tr><th>Input Text</th><th>Chatbot</th><th>Expected Intent</th><th>Verified</th><th>Created</th></tr></thead>
            <tbody>
              {filtered.map(item => (
                <tr key={item.id} onClick={() => setSelected(item)}>
                  <td style={{ maxWidth: '400px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.input_text}</td>
                  <td>{item.chatbot_name || '-'}</td>
                  <td><span className="tag">{item.expected_intent}</span></td>
                  <td>{item.verified ? <span className="badge badge-success"><i className="fa-solid fa-check"></i> Yes</span> : <span className="badge badge-warning">No</span>}</td>
                  <td>{new Date(item.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selected && (
        <DetailModal title="Training Example" onClose={() => setSelected(null)} onEdit={() => handleEdit(selected)} onDelete={() => handleDelete(selected)}>
          <div className="detail-section"><h4>Input Text</h4><div className="detail-value" style={{ background: '#F8FAFC', padding: '12px', borderRadius: '8px' }}>{selected.input_text}</div></div>
          <div className="detail-grid">
            <div className="detail-section"><h4>Expected Intent</h4><span className="tag">{selected.expected_intent}</span></div>
            <div className="detail-section"><h4>Verified</h4><span className={`badge badge-${selected.verified ? 'success' : 'warning'}`}>{selected.verified ? 'Verified' : 'Unverified'}</span></div>
            <div className="detail-section"><h4>Chatbot</h4><div className="detail-value">{selected.chatbot_name || '-'}</div></div>
          </div>
        </DetailModal>
      )}

      {showForm && (
        <FormModal title={editing ? 'Edit Training Example' : 'New Training Example'} onClose={() => { setShowForm(false); setEditing(null); }} onSubmit={handleSubmit}>
          <div className="form-group"><label>Chatbot</label><select className="form-select" value={form.chatbot_id} onChange={e => setForm({ ...form, chatbot_id: e.target.value })}><option value="">Select...</option>{chatbots.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}</select></div>
          <div className="form-group"><label>Input Text</label><textarea className="form-textarea" value={form.input_text} onChange={e => setForm({ ...form, input_text: e.target.value })} required placeholder="What the user would say..." /></div>
          <div className="form-group"><label>Expected Intent</label><input className="form-input" value={form.expected_intent} onChange={e => setForm({ ...form, expected_intent: e.target.value })} placeholder="e.g. greeting, order_status" /></div>
          <div className="form-group"><label className="checkbox-label"><input type="checkbox" checked={form.verified} onChange={e => setForm({ ...form, verified: e.target.checked })} /> Verified</label></div>
        </FormModal>
      )}
    </div>
  );
}
