import React, { useState, useEffect } from 'react';
import api from '../api';
import DetailModal from '../components/DetailModal';
import FormModal from '../components/FormModal';

export default function ApiKeys() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState('');
  const [newKey, setNewKey] = useState(null);
  const [form, setForm] = useState({ name: '', permissions: 'read', expires_at: '', status: 'active' });

  const load = () => { setLoading(true); api.getAll('api-keys').then(data => { setItems(data); setLoading(false); }).catch(() => setLoading(false)); };
  useEffect(() => { load(); }, []);

  const handleSubmit = async () => {
    const permissions = form.permissions.split(',').map(p => p.trim());
    if (editing) {
      await api.update('api-keys', editing.id, { ...form, permissions });
    } else {
      const result = await api.create('api-keys', { ...form, permissions, expires_at: form.expires_at || null });
      if (result.full_key) setNewKey(result.full_key);
    }
    setShowForm(false); setEditing(null); load();
  };

  const handleEdit = (item) => {
    setForm({ name: item.name, permissions: (item.permissions || []).join(', '), expires_at: item.expires_at ? item.expires_at.split('T')[0] : '', status: item.status });
    setEditing(item); setSelected(null); setShowForm(true);
  };

  const handleDelete = async (item) => { if (!confirm('Revoke this API key?')) return; await api.remove('api-keys', item.id); setSelected(null); load(); };
  const filtered = items.filter(i => i.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <div className="page-header">
        <div><h2>API Keys</h2><p>Manage API keys for external integrations</p></div>
        <button className="btn btn-primary" onClick={() => { setForm({ name: '', permissions: 'read', expires_at: '', status: 'active' }); setEditing(null); setNewKey(null); setShowForm(true); }}>
          <i className="fa-solid fa-plus"></i> Generate Key
        </button>
      </div>

      {newKey && (
        <div style={{ background: '#D1FAE5', border: '1px solid #10B981', borderRadius: 'var(--radius)', padding: '16px 20px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <strong style={{ color: '#065F46' }}>New API Key Generated</strong>
            <div style={{ fontFamily: 'monospace', fontSize: '13px', marginTop: '4px', color: '#065F46', wordBreak: 'break-all' }}>{newKey}</div>
            <small style={{ color: '#065F46' }}>Copy this key now - it won't be shown again!</small>
          </div>
          <button className="btn btn-sm btn-success" onClick={() => { navigator.clipboard.writeText(newKey); }}><i className="fa-solid fa-copy"></i> Copy</button>
        </div>
      )}

      <div className="toolbar">
        <div className="search-bar"><i className="fa-solid fa-search"></i><input placeholder="Search API keys..." value={search} onChange={e => setSearch(e.target.value)} /></div>
      </div>

      {loading ? <div className="loading"><div className="spinner"></div> Loading...</div> : (
        <div className="table-container">
          <table className="data-table">
            <thead><tr><th>Name</th><th>Key</th><th>Permissions</th><th>Owner</th><th>Last Used</th><th>Status</th></tr></thead>
            <tbody>
              {filtered.map(item => (
                <tr key={item.id} onClick={() => setSelected(item)}>
                  <td><strong>{item.name}</strong></td>
                  <td style={{ fontFamily: 'monospace', fontSize: '13px' }}>{item.key_prefix}</td>
                  <td>{(item.permissions || []).map((p, i) => <span key={i} className="tag" style={{ marginRight: 4 }}>{p}</span>)}</td>
                  <td>{item.user_name || '-'}</td>
                  <td>{item.last_used ? new Date(item.last_used).toLocaleDateString() : 'Never'}</td>
                  <td><span className={`badge badge-${item.status === 'active' ? 'active' : 'danger'}`}>{item.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selected && (
        <DetailModal title={selected.name} onClose={() => setSelected(null)} onEdit={() => handleEdit(selected)} onDelete={() => handleDelete(selected)}>
          <div className="detail-grid">
            <div className="detail-section"><h4>Key Prefix</h4><div className="detail-value" style={{ fontFamily: 'monospace' }}>{selected.key_prefix}</div></div>
            <div className="detail-section"><h4>Status</h4><span className={`badge badge-${selected.status === 'active' ? 'active' : 'danger'}`}>{selected.status}</span></div>
            <div className="detail-section"><h4>Owner</h4><div className="detail-value">{selected.user_name || '-'}</div></div>
            <div className="detail-section"><h4>Expires</h4><div className="detail-value">{selected.expires_at ? new Date(selected.expires_at).toLocaleDateString() : 'Never'}</div></div>
            <div className="detail-section"><h4>Last Used</h4><div className="detail-value">{selected.last_used ? new Date(selected.last_used).toLocaleString() : 'Never'}</div></div>
            <div className="detail-section"><h4>Created</h4><div className="detail-value">{new Date(selected.created_at).toLocaleString()}</div></div>
          </div>
          <div className="detail-section"><h4>Permissions</h4><div style={{ display: 'flex', gap: '6px' }}>{(selected.permissions || []).map((p, i) => <span key={i} className="tag">{p}</span>)}</div></div>
        </DetailModal>
      )}

      {showForm && (
        <FormModal title={editing ? 'Edit API Key' : 'Generate API Key'} onClose={() => { setShowForm(false); setEditing(null); }} onSubmit={handleSubmit} submitLabel={editing ? 'Save' : 'Generate'}>
          <div className="form-group"><label>Name</label><input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required placeholder="e.g. Production Web App" /></div>
          <div className="form-group"><label>Permissions (comma separated)</label><input className="form-input" value={form.permissions} onChange={e => setForm({ ...form, permissions: e.target.value })} placeholder="read, write, admin" /></div>
          <div className="form-row">
            <div className="form-group"><label>Expires At</label><input className="form-input" type="date" value={form.expires_at} onChange={e => setForm({ ...form, expires_at: e.target.value })} /></div>
            {editing && <div className="form-group"><label>Status</label><select className="form-select" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}><option value="active">Active</option><option value="revoked">Revoked</option></select></div>}
          </div>
        </FormModal>
      )}
    </div>
  );
}
