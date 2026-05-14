import React, { useState } from 'react';
import api from '../api';

const TABS = [
  { id: 'mine', label: 'Mine Intents', icon: 'fa-solid fa-magnifying-glass-chart' },
  { id: 'sentiment', label: 'Sentiment Escalation', icon: 'fa-solid fa-triangle-exclamation' },
];

export default function AIBacklog() {
  const [tab, setTab] = useState('mine');

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>AI Tools (Conversation Mining)</h2>
          <p>Mine intents from logs and detect when escalation is warranted.</p>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 16, padding: 0 }}>
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border)' }}>
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`btn ${tab === t.id ? 'btn-primary' : 'btn-secondary'}`}
              style={{
                borderRadius: 0,
                background: tab === t.id ? 'var(--primary)' : 'transparent',
                color: tab === t.id ? 'white' : 'var(--text)',
                border: 'none',
                padding: '12px 18px',
                cursor: 'pointer',
              }}
            >
              <i className={t.icon} style={{ marginRight: 6 }}></i>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {tab === 'mine' && <MineIntentsTab />}
      {tab === 'sentiment' && <SentimentTab />}
    </div>
  );
}

function MineIntentsTab() {
  const [logs, setLogs] = useState('How do I reset my password?\nI need to update billing\nWhere is my order?');
  const [maxIntents, setMaxIntents] = useState(10);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const run = async () => {
    setError(''); setResult(null); setLoading(true);
    try {
      const arr = logs.split(/\n+/).map(s => s.trim()).filter(Boolean);
      const data = await api.aiMineIntents({ logs: arr, max_intents: Number(maxIntents) || 10 });
      setResult(data);
    } catch (err) {
      setError(err.message || 'Request failed');
    }
    setLoading(false);
  };

  return (
    <div className="card">
      {error && <div className="alert alert-danger" style={{ marginBottom: 12 }}>{error}</div>}
      <div className="form-group">
        <label className="form-label">Conversation Snippets (one per line)</label>
        <textarea
          className="form-input"
          rows={8}
          value={logs}
          onChange={e => setLogs(e.target.value)}
          placeholder="Paste raw user messages, one per line..."
        />
      </div>
      <div className="form-group">
        <label className="form-label">Max intents to propose</label>
        <input
          type="number"
          className="form-input"
          min={1}
          max={30}
          value={maxIntents}
          onChange={e => setMaxIntents(e.target.value)}
          style={{ width: 120 }}
        />
      </div>
      <button className="btn btn-primary" onClick={run} disabled={loading || !logs.trim()}>
        {loading ? 'Mining...' : <><i className="fa-solid fa-bolt"></i> Mine Intents</>}
      </button>

      {result && (
        <div style={{ marginTop: 16 }}>
          {result.notes && (
            <div className="alert alert-info" style={{ marginBottom: 12 }}>
              <strong>Notes:</strong> {result.notes}
            </div>
          )}
          {(result.intents || []).map((it, i) => (
            <div key={i} style={{ padding: 12, borderBottom: '1px solid var(--border)' }}>
              <div style={{ fontWeight: 600 }}>{it.name}</div>
              <div style={{ fontSize: 13, color: '#666', marginBottom: 6 }}>{it.description}</div>
              {Array.isArray(it.example_utterances) && it.example_utterances.length > 0 && (
                <div style={{ fontSize: 12 }}>
                  <em>Examples:</em>{' '}
                  {it.example_utterances.slice(0, 3).map((e, k) => (
                    <span key={k} className="tag" style={{ marginRight: 4 }}>{e}</span>
                  ))}
                </div>
              )}
              {Array.isArray(it.suggested_entities) && it.suggested_entities.length > 0 && (
                <div style={{ fontSize: 12, marginTop: 4 }}>
                  <em>Entities:</em>{' '}
                  {it.suggested_entities.map((e, k) => (
                    <span key={k} className="tag" style={{ background: '#10B981', color: 'white', marginRight: 4 }}>{e}</span>
                  ))}
                </div>
              )}
            </div>
          ))}
          {result.raw && (
            <pre style={{ background: '#f6f8fa', padding: 12, borderRadius: 6, fontSize: 12, overflow: 'auto' }}>
              {result.raw}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}

function SentimentTab() {
  const [message, setMessage] = useState('This is the third time I am asking and nothing has been done. I want a refund right now.');
  const [history, setHistory] = useState('');
  const [threshold, setThreshold] = useState(-0.4);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const run = async () => {
    setError(''); setResult(null); setLoading(true);
    try {
      const conversation_history = history
        .split(/\n+/)
        .map(s => s.trim())
        .filter(Boolean)
        .map(line => {
          const [role, ...rest] = line.split(':');
          return { role: (role || 'user').trim(), content: rest.join(':').trim() };
        });
      const data = await api.aiSentimentEscalation({
        message,
        conversation_history,
        threshold: Number(threshold),
      });
      setResult(data);
    } catch (err) {
      setError(err.message || 'Request failed');
    }
    setLoading(false);
  };

  const colorFor = (s) => {
    if (s === 'very_negative') return '#dc2626';
    if (s === 'negative') return '#f97316';
    if (s === 'neutral') return '#6b7280';
    if (s === 'positive') return '#10B981';
    return '#999';
  };

  return (
    <div className="card">
      {error && <div className="alert alert-danger" style={{ marginBottom: 12 }}>{error}</div>}
      <div className="form-group">
        <label className="form-label">User Message</label>
        <textarea
          className="form-input"
          rows={3}
          value={message}
          onChange={e => setMessage(e.target.value)}
        />
      </div>
      <div className="form-group">
        <label className="form-label">Recent History (optional, "role: text" per line)</label>
        <textarea
          className="form-input"
          rows={3}
          value={history}
          onChange={e => setHistory(e.target.value)}
          placeholder="user: where is my order?&#10;assistant: it is in transit"
        />
      </div>
      <div className="form-group">
        <label className="form-label">Escalation threshold (sentiment_score &lt;= threshold)</label>
        <input
          type="number"
          step="0.1"
          min="-1"
          max="0"
          className="form-input"
          style={{ width: 120 }}
          value={threshold}
          onChange={e => setThreshold(e.target.value)}
        />
      </div>
      <button className="btn btn-primary" onClick={run} disabled={loading || !message.trim()}>
        {loading ? 'Analyzing...' : <><i className="fa-solid fa-gauge-high"></i> Analyze Sentiment</>}
      </button>

      {result && (
        <div style={{ marginTop: 16 }}>
          <div className="card" style={{ background: result.escalate ? '#fee2e2' : '#ecfdf5' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <span className="tag" style={{ background: colorFor(result.sentiment), color: 'white' }}>
                {result.sentiment} ({result.sentiment_score ?? 'n/a'})
              </span>
              <span className="tag" style={{ background: result.escalate ? '#dc2626' : '#10B981', color: 'white' }}>
                {result.escalate ? 'ESCALATE' : 'NO ESCALATION'}
              </span>
              <span className="tag">Priority: {result.recommended_priority}</span>
              <span style={{ fontSize: 12, color: '#666' }}>threshold {result.threshold_applied}</span>
            </div>
            {result.reason && <div style={{ marginTop: 8 }}><strong>Reason:</strong> {result.reason}</div>}
            {result.suggested_handoff_message && (
              <div style={{ marginTop: 8 }}>
                <strong>Suggested handoff:</strong>
                <div style={{ background: 'white', padding: 8, borderRadius: 4, marginTop: 4 }}>
                  {result.suggested_handoff_message}
                </div>
              </div>
            )}
          </div>
          {result.raw && (
            <pre style={{ background: '#f6f8fa', padding: 12, borderRadius: 6, fontSize: 12, overflow: 'auto', marginTop: 12 }}>
              {result.raw}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}
