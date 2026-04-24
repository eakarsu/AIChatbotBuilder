import React, { useState, useEffect } from 'react';
import api from '../api';
import DetailModal from '../components/DetailModal';

const actionIcons = { create: 'fa-plus', update: 'fa-pen', delete: 'fa-trash', login: 'fa-right-to-bracket', deploy: 'fa-rocket', export: 'fa-download' };
const actionColors = { create: '#10B981', update: '#3B82F6', delete: '#EF4444', login: '#8B5CF6', deploy: '#F59E0B', export: '#0891B2' };

export default function AuditLogs() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState('');
  const [filterAction, setFilterAction] = useState('');

  const load = () => { setLoading(true); api.getAll('audit-logs').then(data => { setItems(data); setLoading(false); }).catch(() => setLoading(false)); };
  useEffect(() => { load(); }, []);

  const handleDelete = async (item) => { if (!confirm('Delete this log entry?')) return; await api.remove('audit-logs', item.id); setSelected(null); load(); };

  const actions = [...new Set(items.map(i => i.action))];
  const filtered = items.filter(i => {
    const matchSearch = (i.resource_name || '').toLowerCase().includes(search.toLowerCase()) || (i.actor_name || '').toLowerCase().includes(search.toLowerCase());
    const matchAction = !filterAction || i.action === filterAction;
    return matchSearch && matchAction;
  });

  return (
    <div>
      <div className="page-header">
        <div><h2>Audit Logs</h2><p>Track all actions and changes in the system</p></div>
      </div>

      <div className="toolbar">
        <div className="search-bar"><i className="fa-solid fa-search"></i><input placeholder="Search logs..." value={search} onChange={e => setSearch(e.target.value)} /></div>
        <div className="toolbar-actions">
          <select className="form-select" style={{ width: '140px', padding: '8px 12px' }} value={filterAction} onChange={e => setFilterAction(e.target.value)}>
            <option value="">All Actions</option>
            {actions.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
          <span style={{ color: 'var(--text-light)', fontSize: '13px' }}>{filtered.length} entries</span>
        </div>
      </div>

      {loading ? <div className="loading"><div className="spinner"></div> Loading...</div> : (
        <div className="table-container">
          <table className="data-table">
            <thead><tr><th>Action</th><th>Resource</th><th>User</th><th>IP Address</th><th>Timestamp</th></tr></thead>
            <tbody>
              {filtered.map(item => (
                <tr key={item.id} onClick={() => setSelected(item)}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: 28, height: 28, borderRadius: '6px', background: actionColors[item.action] || '#6B7280', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>
                        <i className={`fa-solid ${actionIcons[item.action] || 'fa-circle'}`}></i>
                      </div>
                      <span style={{ fontWeight: 600, textTransform: 'capitalize' }}>{item.action}</span>
                    </div>
                  </td>
                  <td><span className="tag">{item.resource_type}</span> {item.resource_name}</td>
                  <td>{item.actor_name || '-'}</td>
                  <td style={{ fontFamily: 'monospace', fontSize: '13px' }}>{item.ip_address}</td>
                  <td>{new Date(item.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selected && (
        <DetailModal title="Audit Log Entry" onClose={() => setSelected(null)} onDelete={() => handleDelete(selected)} onEdit={null}>
          <div className="detail-grid">
            <div className="detail-section"><h4>Action</h4><div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><div style={{ width: 28, height: 28, borderRadius: '6px', background: actionColors[selected.action] || '#6B7280', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}><i className={`fa-solid ${actionIcons[selected.action] || 'fa-circle'}`}></i></div><span style={{ fontWeight: 600, textTransform: 'capitalize' }}>{selected.action}</span></div></div>
            <div className="detail-section"><h4>Resource Type</h4><span className="tag">{selected.resource_type}</span></div>
            <div className="detail-section"><h4>Resource</h4><div className="detail-value">{selected.resource_name || '-'} {selected.resource_id ? `(#${selected.resource_id})` : ''}</div></div>
            <div className="detail-section"><h4>User</h4><div className="detail-value">{selected.actor_name || selected.user_name || '-'}</div></div>
            <div className="detail-section"><h4>IP Address</h4><div className="detail-value" style={{ fontFamily: 'monospace' }}>{selected.ip_address || '-'}</div></div>
            <div className="detail-section"><h4>Timestamp</h4><div className="detail-value">{new Date(selected.created_at).toLocaleString()}</div></div>
          </div>
          <div className="detail-section"><h4>Details</h4><pre style={{ background: '#1E293B', color: '#E2E8F0', padding: '16px', borderRadius: '8px', fontSize: '13px', overflow: 'auto' }}>{JSON.stringify(selected.details, null, 2)}</pre></div>
        </DetailModal>
      )}
    </div>
  );
}
