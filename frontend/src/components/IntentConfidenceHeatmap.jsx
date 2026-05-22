import React, { useState, useEffect } from 'react';

export default function IntentConfidenceHeatmap() {
  const [data, setData] = useState(null);
  const [chatbotId, setChatbotId] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true); setErr('');
    try {
      const token = localStorage.getItem('token');
      const qs = chatbotId ? `?chatbot_id=${encodeURIComponent(chatbotId)}` : '';
      const r = await fetch(`/api/custom-views/intent-confidence-heatmap${qs}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'Failed');
      setData(j);
    } catch (e) { setErr(e.message); } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const colorFor = (v) => {
    // 0 -> red, 1 -> green
    const clamped = Math.max(0, Math.min(1, v));
    const r = Math.round(255 * (1 - clamped));
    const g = Math.round(180 * clamped + 40);
    return `rgb(${r}, ${g}, 80)`;
  };

  const buckets = data?.buckets || [];
  const matrix = data?.matrix || [];

  return (
    <div style={{ padding: 16, background: 'var(--surface)', borderRadius: 12, boxShadow: 'var(--shadow)' }}>
      <h3 style={{ marginBottom: 12 }}>
        <i className="fa-solid fa-fire" /> Intent Confidence Heatmap
      </h3>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <input
          value={chatbotId}
          onChange={e => setChatbotId(e.target.value)}
          placeholder="chatbot_id (optional)"
          style={{ flex: 1, padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 8 }}
        />
        <button
          onClick={load}
          disabled={loading}
          style={{ padding: '8px 14px', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer' }}
        >
          {loading ? 'Loading…' : 'Refresh'}
        </button>
      </div>
      {err && <div style={{ color: 'var(--danger)', marginBottom: 8 }}>{err}</div>}
      {data && (
        <>
          <div style={{ overflowX: 'auto', marginBottom: 12 }}>
            <table style={{ borderCollapse: 'separate', borderSpacing: 4, fontSize: 12 }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: '4px 6px', color: 'var(--text-light)' }}>Intent</th>
                  {buckets.map(b => (
                    <th key={b} style={{ padding: '4px 6px', color: 'var(--text-light)' }}>{b}</th>
                  ))}
                  <th style={{ padding: '4px 6px', color: 'var(--text-light)' }}>Thr</th>
                </tr>
              </thead>
              <tbody>
                {matrix.map(row => (
                  <tr key={row.intent_id}>
                    <td style={{ padding: '4px 6px', fontWeight: 600 }}>{row.intent}</td>
                    {row.cells.map(c => (
                      <td
                        key={c.bucket}
                        style={{
                          background: colorFor(c.confidence),
                          color: '#fff',
                          width: 60,
                          height: 28,
                          textAlign: 'center',
                          borderRadius: 4,
                          fontWeight: 600,
                        }}
                        title={`${row.intent} / ${c.bucket} = ${c.confidence}`}
                      >
                        {c.confidence.toFixed(2)}
                      </td>
                    ))}
                    <td style={{ padding: '4px 6px', color: 'var(--text-light)' }}>{row.threshold}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ fontSize: 13 }}>
            <div><strong>Weakest intent:</strong> {data.insights?.weakest_intent}</div>
            <div><strong>Low cells:</strong> {data.low_cells?.length || 0}</div>
            {!!(data.insights?.training_actions || []).length && (
              <div>
                <strong>Training actions:</strong>
                <ul style={{ marginLeft: 18 }}>
                  {data.insights.training_actions.map((t, i) => <li key={i}>{t}</li>)}
                </ul>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
