import React, { useState, useEffect } from 'react';

const empty = { intent: '', pattern: '', min_confidence: 0.7, action: 'respond_with_template:default', enabled: true };

export default function IntentTrainingRulesEditor() {
  const [data, setData] = useState(null);
  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState(null);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  const token = () => localStorage.getItem('token');
  const headers = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` });

  const load = async () => {
    setLoading(true); setErr('');
    try {
      const r = await fetch(`/api/custom-views/intent-training-rules`, { headers: headers() });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'Failed');
      setData(j);
    } catch (e) { setErr(e.message); } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const submit = async (e) => {
    e.preventDefault();
    setErr('');
    try {
      const url = editingId
        ? `/api/custom-views/intent-training-rules/${editingId}`
        : `/api/custom-views/intent-training-rules`;
      const method = editingId ? 'PUT' : 'POST';
      const r = await fetch(url, { method, headers: headers(), body: JSON.stringify(form) });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'Failed');
      setForm(empty); setEditingId(null);
      await load();
    } catch (e2) { setErr(e2.message); }
  };

  const edit = (rule) => {
    setEditingId(rule.id);
    setForm({
      intent: rule.intent,
      pattern: rule.pattern,
      min_confidence: rule.min_confidence,
      action: rule.action,
      enabled: rule.enabled,
    });
  };

  const remove = async (id) => {
    setErr('');
    try {
      const r = await fetch(`/api/custom-views/intent-training-rules/${id}`, { method: 'DELETE', headers: headers() });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'Failed');
      await load();
    } catch (e) { setErr(e.message); }
  };

  const inputStyle = { padding: '6px 8px', border: '1px solid var(--border)', borderRadius: 6, fontSize: 12 };

  return (
    <div style={{ padding: 16, background: 'var(--surface)', borderRadius: 12, boxShadow: 'var(--shadow)' }}>
      <h3 style={{ marginBottom: 12 }}>
        <i className="fa-solid fa-list-check" /> Intent Training Rules Editor
      </h3>

      <form onSubmit={submit} style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 90px 1.5fr auto', gap: 6, marginBottom: 10 }}>
        <input style={inputStyle} placeholder="intent"  value={form.intent}  onChange={e => setForm({ ...form, intent: e.target.value })} required />
        <input style={inputStyle} placeholder="pattern (regex)" value={form.pattern} onChange={e => setForm({ ...form, pattern: e.target.value })} required />
        <input style={inputStyle} type="number" step="0.05" min="0" max="1" value={form.min_confidence}
               onChange={e => setForm({ ...form, min_confidence: e.target.value })} />
        <input style={inputStyle} placeholder="action" value={form.action} onChange={e => setForm({ ...form, action: e.target.value })} />
        <button type="submit" style={{ padding: '6px 10px', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}>
          {editingId ? 'Update' : 'Add'}
        </button>
      </form>

      {err && <div style={{ color: 'var(--danger)', marginBottom: 8 }}>{err}</div>}

      <div style={{ maxHeight: 220, overflow: 'auto', border: '1px solid var(--border)', borderRadius: 6 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead style={{ background: '#f1f5f9' }}>
            <tr>
              <th style={{ padding: '6px 8px', textAlign: 'left' }}>ID</th>
              <th style={{ padding: '6px 8px', textAlign: 'left' }}>Intent</th>
              <th style={{ padding: '6px 8px', textAlign: 'left' }}>Pattern</th>
              <th style={{ padding: '6px 8px' }}>MinConf</th>
              <th style={{ padding: '6px 8px', textAlign: 'left' }}>Action</th>
              <th style={{ padding: '6px 8px' }}></th>
            </tr>
          </thead>
          <tbody>
            {(data?.rules || []).map(r => (
              <tr key={r.id} style={{ borderTop: '1px solid var(--border)' }}>
                <td style={{ padding: '6px 8px' }}>{r.id}</td>
                <td style={{ padding: '6px 8px', fontWeight: 600 }}>{r.intent}</td>
                <td style={{ padding: '6px 8px', fontFamily: 'monospace' }}>{r.pattern}</td>
                <td style={{ padding: '6px 8px', textAlign: 'center' }}>{Number(r.min_confidence).toFixed(2)}</td>
                <td style={{ padding: '6px 8px' }}>{r.action}</td>
                <td style={{ padding: '6px 8px', whiteSpace: 'nowrap' }}>
                  <button onClick={() => edit(r)} style={{ marginRight: 4, padding: '3px 8px', fontSize: 11, cursor: 'pointer' }}>Edit</button>
                  <button onClick={() => remove(r.id)} style={{ padding: '3px 8px', fontSize: 11, color: '#fff', background: 'var(--danger, #dc2626)', border: 'none', borderRadius: 4, cursor: 'pointer' }}>Del</button>
                </td>
              </tr>
            ))}
            {(!data?.rules?.length) && (
              <tr><td colSpan={6} style={{ padding: 16, textAlign: 'center', color: 'var(--text-light)' }}>
                {loading ? 'Loading…' : 'No rules yet'}
              </td></tr>
            )}
          </tbody>
        </table>
      </div>

      {data?.audit && (
        <div style={{ fontSize: 12, marginTop: 10, color: 'var(--text-light)' }}>
          Coverage: <strong>{data.audit.coverage_score}</strong>
          {data.audit._fallback && <span> (fallback)</span>}
        </div>
      )}
    </div>
  );
}
