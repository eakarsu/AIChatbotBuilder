import React, { useState, useEffect } from 'react';
import api from '../api';

export default function FlowJsonExport() {
  const [flows, setFlows] = useState([]);
  const [flowId, setFlowId] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    api.getAll('flows').then(setFlows).catch(() => setFlows([]));
  }, []);

  const doExport = async () => {
    if (!flowId) { setErr('Pick a flow first'); return; }
    setLoading(true); setErr('');
    try {
      const token = localStorage.getItem('token');
      const r = await fetch('/api/custom-views/flow-export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ flow_id: flowId, format: 'json' }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'Failed');
      setResult(j);
    } catch (e) { setErr(e.message); } finally { setLoading(false); }
  };

  const copy = () => {
    if (!result) return;
    navigator.clipboard.writeText(JSON.stringify(result.export, null, 2));
    setCopied(true); setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div style={{ padding: 16, background: 'var(--surface)', borderRadius: 12, boxShadow: 'var(--shadow)' }}>
      <h3 style={{ marginBottom: 12 }}><i className="fa-solid fa-file-export" /> Flow JSON Export</h3>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <select value={flowId} onChange={e => setFlowId(e.target.value)}
                style={{ flex: 1, padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 8 }}>
          <option value="">— select flow —</option>
          {flows.map(f => <option key={f.id} value={f.id}>{f.name} (id={f.id})</option>)}
        </select>
        <button onClick={doExport} disabled={loading}
                style={{ padding: '8px 14px', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer' }}>
          {loading ? 'Exporting…' : 'Export'}
        </button>
      </div>
      {err && <div style={{ color: 'var(--danger)', marginBottom: 8 }}>{err}</div>}
      {result && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <small style={{ color: 'var(--text-light)' }}>{result.doc?.summary}</small>
            <button onClick={copy} style={{ padding: '4px 10px', background: 'var(--secondary)', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}>
              {copied ? 'Copied!' : 'Copy JSON'}
            </button>
          </div>
          <pre style={{ background: '#0f172a', color: '#e2e8f0', padding: 12, borderRadius: 8, fontSize: 11, maxHeight: 240, overflow: 'auto' }}>
            {JSON.stringify(result.export, null, 2)}
          </pre>
          <div style={{ marginTop: 10, fontSize: 13 }}>
            <strong>Risks:</strong>
            <ul style={{ marginLeft: 18 }}>{(result.doc?.risks || []).map((r, i) => <li key={i}>{r}</li>)}</ul>
            <div><strong>Import:</strong> {result.doc?.import_instructions}</div>
          </div>
        </>
      )}
    </div>
  );
}
