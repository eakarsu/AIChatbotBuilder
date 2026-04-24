import React, { useState, useEffect } from 'react';
import api from '../api';
import DetailModal from '../components/DetailModal';
import FormModal from '../components/FormModal';

const statusColors = { deployed: '#10B981', pending: '#F59E0B', failed: '#EF4444', 'rolled-back': '#6B7280' };
const envColors = { production: '#EF4444', staging: '#F59E0B', development: '#3B82F6' };

export default function Deployments() {
  const [items, setItems] = useState([]);
  const [chatbots, setChatbots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ chatbot_id: '', version: '', environment: 'staging', changes: '', status: 'pending' });

  const load = () => { setLoading(true); api.getAll('deployments').then(data => { setItems(data); setLoading(false); }).catch(() => setLoading(false)); };
  useEffect(() => { load(); api.getAll('chatbots').then(setChatbots).catch(() => {}); }, []);

  const handleSubmit = async () => {
    if (editing) await api.update('deployments', editing.id, form);
    else await api.create('deployments', form);
    setShowForm(false); setEditing(null); load();
  };

  const handleEdit = (item) => {
    setForm({ chatbot_id: item.chatbot_id, version: item.version, environment: item.environment, changes: item.changes || '', status: item.status });
    setEditing(item); setSelected(null); setShowForm(true);
  };

  const handleDelete = async (item) => { if (!confirm('Delete this deployment?')) return; await api.remove('deployments', item.id); setSelected(null); load(); };
  const filtered = items.filter(i => (i.chatbot_name || '').toLowerCase().includes(search.toLowerCase()) || i.version.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <div className="page-header">
        <div><h2>Deployments</h2><p>Manage chatbot versions and deployments</p></div>
        <button className="btn btn-primary" onClick={() => { setForm({ chatbot_id: chatbots[0]?.id || '', version: '', environment: 'staging', changes: '', status: 'pending' }); setEditing(null); setShowForm(true); }}>
          <i className="fa-solid fa-plus"></i> New Deployment
        </button>
      </div>

      <div className="toolbar">
        <div className="search-bar"><i className="fa-solid fa-search"></i><input placeholder="Search deployments..." value={search} onChange={e => setSearch(e.target.value)} /></div>
      </div>

      {loading ? <div className="loading"><div className="spinner"></div> Loading...</div> : (
        <div className="table-container">
          <table className="data-table">
            <thead><tr><th>Chatbot</th><th>Version</th><th>Environment</th><th>Status</th><th>Deployed By</th><th>Date</th></tr></thead>
            <tbody>
              {filtered.map(item => (
                <tr key={item.id} onClick={() => setSelected(item)}>
                  <td><strong>{item.chatbot_name || '-'}</strong></td>
                  <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>{item.version}</td>
                  <td><span className="badge" style={{ background: (envColors[item.environment] || '#6B7280') + '20', color: envColors[item.environment] || '#6B7280' }}>{item.environment}</span></td>
                  <td><span className="badge" style={{ background: (statusColors[item.status] || '#6B7280') + '20', color: statusColors[item.status] || '#6B7280' }}>{item.status}</span></td>
                  <td>{item.deployed_by_name || '-'}</td>
                  <td>{item.deployed_at ? new Date(item.deployed_at).toLocaleString() : 'Pending'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selected && (
        <DetailModal title={`${selected.chatbot_name} - ${selected.version}`} onClose={() => setSelected(null)} onEdit={() => handleEdit(selected)} onDelete={() => handleDelete(selected)}>
          <div className="detail-grid">
            <div className="detail-section"><h4>Version</h4><div className="detail-value" style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '18px' }}>{selected.version}</div></div>
            <div className="detail-section"><h4>Environment</h4><span className="badge" style={{ background: (envColors[selected.environment] || '#6B7280') + '20', color: envColors[selected.environment] }}>{selected.environment}</span></div>
            <div className="detail-section"><h4>Status</h4><span className="badge" style={{ background: (statusColors[selected.status] || '#6B7280') + '20', color: statusColors[selected.status] }}>{selected.status}</span></div>
            <div className="detail-section"><h4>Deployed By</h4><div className="detail-value">{selected.deployed_by_name || '-'}</div></div>
            <div className="detail-section"><h4>Deployed At</h4><div className="detail-value">{selected.deployed_at ? new Date(selected.deployed_at).toLocaleString() : 'Not deployed'}</div></div>
            <div className="detail-section"><h4>Rollback Version</h4><div className="detail-value">{selected.rollback_version || '-'}</div></div>
          </div>
          <div className="detail-section"><h4>Changes</h4><div className="detail-value" style={{ background: '#F8FAFC', padding: '12px', borderRadius: '8px' }}>{selected.changes || 'No description'}</div></div>
        </DetailModal>
      )}

      {showForm && (
        <FormModal title={editing ? 'Edit Deployment' : 'New Deployment'} onClose={() => { setShowForm(false); setEditing(null); }} onSubmit={handleSubmit}>
          <div className="form-group"><label>Chatbot</label><select className="form-select" value={form.chatbot_id} onChange={e => setForm({ ...form, chatbot_id: e.target.value })} required><option value="">Select...</option>{chatbots.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}</select></div>
          <div className="form-row">
            <div className="form-group"><label>Version</label><input className="form-input" value={form.version} onChange={e => setForm({ ...form, version: e.target.value })} required placeholder="e.g. v1.0.0" /></div>
            <div className="form-group"><label>Environment</label><select className="form-select" value={form.environment} onChange={e => setForm({ ...form, environment: e.target.value })}><option value="development">Development</option><option value="staging">Staging</option><option value="production">Production</option></select></div>
          </div>
          {editing && <div className="form-group"><label>Status</label><select className="form-select" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}><option value="pending">Pending</option><option value="deployed">Deployed</option><option value="failed">Failed</option><option value="rolled-back">Rolled Back</option></select></div>}
          <div className="form-group"><label>Changes</label><textarea className="form-textarea" value={form.changes} onChange={e => setForm({ ...form, changes: e.target.value })} placeholder="Describe what changed in this version..." /></div>
        </FormModal>
      )}
    </div>
  );
}
