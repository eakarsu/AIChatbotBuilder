import React, { useState, useEffect } from 'react';

export default function FlowNodeGraph() {
  const [data, setData] = useState(null);
  const [flowId, setFlowId] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true); setErr('');
    try {
      const token = localStorage.getItem('token');
      const qs = flowId ? `?flow_id=${encodeURIComponent(flowId)}` : '';
      const r = await fetch(`/api/custom-views/flow-graph${qs}`, { headers: { Authorization: `Bearer ${token}` } });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'Failed');
      setData(j);
    } catch (e) { setErr(e.message); } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const W = 560, H = 260;
  const nodes = data?.nodes || [];
  const edges = data?.edges || [];
  const positions = {};
  nodes.forEach((n, i) => {
    const cols = Math.max(1, Math.ceil(Math.sqrt(nodes.length)));
    const r = Math.floor(i / cols), c = i % cols;
    positions[n.id] = { x: 70 + c * ((W - 140) / Math.max(1, cols - 1 || 1)), y: 50 + r * 70 };
  });

  return (
    <div style={{ padding: 16, background: 'var(--surface)', borderRadius: 12, boxShadow: 'var(--shadow)' }}>
      <h3 style={{ marginBottom: 12 }}><i className="fa-solid fa-diagram-project" /> Flow Node Graph</h3>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <input value={flowId} onChange={e => setFlowId(e.target.value)} placeholder="flow_id (optional)"
               style={{ flex: 1, padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 8 }} />
        <button onClick={load} disabled={loading}
                style={{ padding: '8px 14px', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer' }}>
          {loading ? 'Loading…' : 'Refresh'}
        </button>
      </div>
      {err && <div style={{ color: 'var(--danger)', marginBottom: 8 }}>{err}</div>}
      {data && (
        <>
          <div style={{ fontSize: 13, color: 'var(--text-light)', marginBottom: 6 }}>
            <strong>{data.flow_name}</strong> — {nodes.length} nodes, {edges.length} edges
          </div>
          <svg width={W} height={H} style={{ border: '1px solid var(--border)', borderRadius: 8, background: '#fafbff' }}>
            {edges.map((e, i) => {
              const a = positions[e.from], b = positions[e.to];
              if (!a || !b) return null;
              return <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#818CF8" strokeWidth="2" markerEnd="url(#arr)" />;
            })}
            <defs>
              <marker id="arr" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#818CF8" />
              </marker>
            </defs>
            {nodes.map(n => {
              const p = positions[n.id]; if (!p) return null;
              return (
                <g key={n.id}>
                  <circle cx={p.x} cy={p.y} r="22" fill="#4F46E5" />
                  <text x={p.x} y={p.y + 4} textAnchor="middle" fill="#fff" fontSize="10">{(n.label || n.id).slice(0, 6)}</text>
                </g>
              );
            })}
          </svg>
          <div style={{ marginTop: 12, fontSize: 13 }}>
            <div><strong>Complexity:</strong> {data.analysis?.complexity_score}</div>
            <div><strong>Critical path:</strong> {(data.analysis?.critical_path || []).join(' → ')}</div>
            <div><strong>Recommendations:</strong>
              <ul style={{ marginLeft: 18 }}>
                {(data.analysis?.recommendations || []).map((r, i) => <li key={i}>{r}</li>)}
              </ul>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
