import React, { useEffect, useState } from 'react';
import api from '../api';

const FEATURE_OPTIONS = [
  '', 'chat', 'generate-flow', 'analyze-conversation', 'suggest-intents',
  'generate-training-data', 'improve-response', 'kb-query',
  'flow-visualizer', 'context-variables', 'kb-relevance', 'tone-analyzer', 'escalation-detector',
];

export default function AIResults() {
  const [results, setResults] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, total_pages: 0 });
  const [feature, setFeature] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(null);

  const load = async (page = 1) => {
    setLoading(true);
    setError('');
    try {
      const params = { page, limit: 20 };
      if (feature) params.feature = feature;
      const res = await api.aiResultsList(params);
      setResults(res.data || []);
      setPagination(res.pagination || { page: 1, limit: 20, total: 0, total_pages: 0 });
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  };

  useEffect(() => { load(1); /* eslint-disable-next-line */ }, [feature]);

  const handleDelete = async (id) => {
    if (!confirm('Delete this AI result?')) return;
    await api.aiResultDelete(id);
    load(pagination.page);
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1><i className="fa-solid fa-clock-rotate-left"></i> AI Results History</h1>
        <p>Persisted AI outputs (JSONB) for auditing & re-use.</p>
      </div>

      <div className="filters" style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <select value={feature} onChange={(e) => setFeature(e.target.value)}>
          {FEATURE_OPTIONS.map(f => <option key={f} value={f}>{f || 'All features'}</option>)}
        </select>
        <button onClick={() => load(pagination.page)} disabled={loading}>
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <table className="data-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Feature</th>
            <th>Model</th>
            <th>Created</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {results.length === 0 && (
            <tr><td colSpan="5" style={{ textAlign: 'center', padding: 24 }}>No AI results yet.</td></tr>
          )}
          {results.map(r => (
            <tr key={r.id}>
              <td>{r.id}</td>
              <td><span className="badge">{r.feature}</span></td>
              <td style={{ fontSize: 12 }}>{r.model}</td>
              <td>{new Date(r.created_at).toLocaleString()}</td>
              <td>
                <button onClick={() => setSelected(r)}>View</button>
                <button onClick={() => handleDelete(r.id)} className="danger">Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="pagination" style={{ display: 'flex', gap: 8, marginTop: 16, alignItems: 'center' }}>
        <button disabled={pagination.page <= 1} onClick={() => load(pagination.page - 1)}>Prev</button>
        <span>Page {pagination.page} of {pagination.total_pages || 1} ({pagination.total} total)</span>
        <button disabled={pagination.page >= pagination.total_pages} onClick={() => load(pagination.page + 1)}>Next</button>
      </div>

      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 800, width: '90%', maxHeight: '85vh', overflow: 'auto' }}>
            <div className="modal-header">
              <h2>Result #{selected.id} - {selected.feature}</h2>
              <button onClick={() => setSelected(null)}>X</button>
            </div>
            <div className="modal-body">
              <h3>Input</h3>
              <pre style={{ background: '#f5f5f5', padding: 12, borderRadius: 4, overflow: 'auto' }}>
                {JSON.stringify(selected.input, null, 2)}
              </pre>
              <h3>Output</h3>
              <pre style={{ background: '#f5f5f5', padding: 12, borderRadius: 4, overflow: 'auto' }}>
                {JSON.stringify(selected.output, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
