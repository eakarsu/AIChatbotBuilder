import React, { useState, useEffect } from 'react';

export default function ConversationFunnel() {
  const [data, setData] = useState(null);
  const [chatbotId, setChatbotId] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const load = async () => {
    setLoading(true); setErr('');
    try {
      const token = localStorage.getItem('token');
      const qs = chatbotId ? `?chatbot_id=${encodeURIComponent(chatbotId)}` : '';
      const r = await fetch(`/api/custom-views/conversation-funnel${qs}`, { headers: { Authorization: `Bearer ${token}` } });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'Failed');
      setData(j);
    } catch (e) { setErr(e.message); } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const stages = data?.stages || [];
  const max = Math.max(1, ...stages.map(s => s.count));
  const colors = ['#4F46E5', '#6366F1', '#818CF8', '#A78BFA', '#10B981'];

  return (
    <div style={{ padding: 16, background: 'var(--surface)', borderRadius: 12, boxShadow: 'var(--shadow)' }}>
      <h3 style={{ marginBottom: 12 }}><i className="fa-solid fa-filter" /> Conversation Funnel</h3>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <input value={chatbotId} onChange={e => setChatbotId(e.target.value)} placeholder="chatbot_id (optional)"
               style={{ flex: 1, padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 8 }} />
        <button onClick={load} disabled={loading}
                style={{ padding: '8px 14px', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer' }}>
          {loading ? 'Loading…' : 'Refresh'}
        </button>
      </div>
      {err && <div style={{ color: 'var(--danger)', marginBottom: 8 }}>{err}</div>}
      {data && (
        <>
          <div style={{ fontSize: 13, color: 'var(--text-light)', marginBottom: 10 }}>
            Total conversations: <strong>{data.total_conversations}</strong>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center' }}>
            {stages.map((s, i) => {
              const widthPct = (s.count / max) * 100;
              return (
                <div key={i} style={{ width: `${widthPct}%`, background: colors[i % colors.length], color: '#fff',
                                      padding: '10px 12px', borderRadius: 8, textAlign: 'center', fontSize: 13, fontWeight: 600 }}>
                  {s.label}: {s.count}
                </div>
              );
            })}
          </div>
          <div style={{ marginTop: 14, fontSize: 13 }}>
            <div><strong>Biggest drop-off:</strong> {data.insights?.biggest_dropoff}</div>
            <div><strong>Conversion:</strong> {((data.insights?.conversion_rate || 0) * 100).toFixed(1)}%</div>
            <div><strong>Suggestions:</strong>
              <ul style={{ marginLeft: 18 }}>
                {(data.insights?.suggestions || []).map((s, i) => <li key={i}>{s}</li>)}
              </ul>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
