import React, { useState } from 'react';

export default function ConfigExportPDF() {
  const [chatbotId, setChatbotId] = useState('');
  const [data, setData] = useState(null);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  const run = async () => {
    setLoading(true); setErr('');
    try {
      const token = localStorage.getItem('token');
      const r = await fetch(`/api/custom-views/config-export-pdf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ chatbot_id: chatbotId ? Number(chatbotId) : undefined }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'Failed');
      setData(j);
    } catch (e) { setErr(e.message); } finally { setLoading(false); }
  };

  const download = () => {
    if (!data) return;
    const a = document.createElement('a');
    a.href = data.data_url;
    a.download = data.filename || 'chatbot_config.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div style={{ padding: 16, background: 'var(--surface)', borderRadius: 12, boxShadow: 'var(--shadow)' }}>
      <h3 style={{ marginBottom: 12 }}>
        <i className="fa-solid fa-file-pdf" /> Chatbot Config Export (PDF)
      </h3>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <input
          value={chatbotId}
          onChange={e => setChatbotId(e.target.value)}
          placeholder="chatbot_id (optional, latest if blank)"
          style={{ flex: 1, padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 8 }}
        />
        <button
          onClick={run}
          disabled={loading}
          style={{ padding: '8px 14px', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer' }}
        >
          {loading ? 'Building…' : 'Generate'}
        </button>
        {data && (
          <button
            onClick={download}
            style={{ padding: '8px 14px', background: 'var(--success, #16a34a)', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer' }}
          >
            <i className="fa-solid fa-download" /> Download
          </button>
        )}
      </div>
      {err && <div style={{ color: 'var(--danger)', marginBottom: 8 }}>{err}</div>}
      {data && (
        <>
          <div style={{ fontSize: 13, marginBottom: 8 }}>
            <strong>{data.chatbot_name}</strong> — flows: {data.counts?.flows}, intents: {data.counts?.intents}, webhooks: {data.counts?.webhooks}
          </div>
          <pre
            style={{
              background: '#0f172a',
              color: '#e2e8f0',
              padding: 12,
              borderRadius: 8,
              maxHeight: 220,
              overflow: 'auto',
              fontSize: 11,
              lineHeight: 1.4,
            }}
          >{data.text}</pre>
          <div style={{ fontSize: 13, marginTop: 8 }}>
            <div><strong>Summary:</strong> {data.doc?.summary}</div>
            {!!(data.doc?.risks || []).length && (
              <div>
                <strong>Risks:</strong>
                <ul style={{ marginLeft: 18 }}>
                  {data.doc.risks.map((r, i) => <li key={i}>{r}</li>)}
                </ul>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
