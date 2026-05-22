import React, { useState } from 'react';

export default function IntentEditor() {
  const [name, setName] = useState('book_appointment');
  const [examples, setExamples] = useState('schedule a meeting\nbook a slot\nset up a call');
  const [responseText, setResponseText] = useState("Sure—what time works for you?");
  const [suggestions, setSuggestions] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const run = async () => {
    setLoading(true); setErr(''); setSuggestions(null);
    try {
      const token = localStorage.getItem('token');
      const r = await fetch('/api/custom-views/intent-edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name,
          examples: examples.split('\n').map(s => s.trim()).filter(Boolean),
          response_text: responseText,
        }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'Failed');
      setSuggestions(j.suggestions);
    } catch (e) { setErr(e.message); } finally { setLoading(false); }
  };

  return (
    <div style={{ padding: 16, background: 'var(--surface)', borderRadius: 12, boxShadow: 'var(--shadow)' }}>
      <h3 style={{ marginBottom: 12 }}><i className="fa-solid fa-bullseye" /> Intent Editor</h3>
      <div style={{ display: 'grid', gap: 8 }}>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="intent name"
               style={{ padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 8 }} />
        <textarea value={examples} onChange={e => setExamples(e.target.value)} rows={4} placeholder="one example utterance per line"
                  style={{ padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 8, fontFamily: 'inherit' }} />
        <textarea value={responseText} onChange={e => setResponseText(e.target.value)} rows={2} placeholder="response text"
                  style={{ padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 8, fontFamily: 'inherit' }} />
        <button onClick={run} disabled={loading}
                style={{ padding: '8px 14px', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer' }}>
          {loading ? 'Synthesizing…' : 'Suggest Improvements'}
        </button>
      </div>
      {err && <div style={{ color: 'var(--danger)', marginTop: 10 }}>{err}</div>}
      {suggestions && (
        <div style={{ marginTop: 14, fontSize: 13, background: '#f8fafc', padding: 12, borderRadius: 8 }}>
          <div><strong>Suggested name:</strong> {suggestions.suggested_name}</div>
          <div><strong>Confidence:</strong> {(suggestions.confidence * 100).toFixed(0)}%</div>
          <div style={{ marginTop: 6 }}><strong>Additional examples:</strong>
            <ul style={{ marginLeft: 18 }}>
              {(suggestions.additional_examples || []).map((s, i) => <li key={i}>{s}</li>)}
            </ul>
          </div>
          <div style={{ marginTop: 6 }}><strong>Improved response:</strong>
            <div style={{ background: '#fff', padding: 8, borderRadius: 6, marginTop: 4, border: '1px solid var(--border)' }}>
              {suggestions.improved_response}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
