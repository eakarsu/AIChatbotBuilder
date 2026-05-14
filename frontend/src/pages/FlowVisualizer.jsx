import React, { useState, useEffect } from 'react';
import api from '../api';

const SAMPLE_LOGS = [
  { conversation_id: 1, path: ['start', 'greeting', 'q_intent', 'product_info', 'resolved'] },
  { conversation_id: 2, path: ['start', 'greeting', 'q_intent', 'product_info', 'q_pricing', 'abandoned'] },
  { conversation_id: 3, path: ['start', 'greeting', 'q_intent', 'support_redirect', 'resolved'] },
];

export default function FlowVisualizer() {
  const [chatbots, setChatbots] = useState([]);
  const [selectedBot, setSelectedBot] = useState('');
  const [logsText, setLogsText] = useState(JSON.stringify(SAMPLE_LOGS, null, 2));
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => { api.getAll('chatbots').then(setChatbots).catch(() => {}); }, []);

  const loadFromConversations = async () => {
    if (!selectedBot) {
      setError('Pick a chatbot first');
      return;
    }
    try {
      const convs = await api.getAll('conversations').catch(() => []);
      const filtered = (convs || []).filter(c => String(c.chatbot_id) === String(selectedBot)).slice(0, 50);
      const logs = filtered.map(c => ({
        conversation_id: c.id,
        channel: c.channel,
        status: c.status,
        path: ['start', c.status === 'resolved' ? 'resolved' : 'in_progress'],
      }));
      setLogsText(JSON.stringify(logs, null, 2));
    } catch (err) {
      setError(err.message);
    }
  };

  const analyze = async () => {
    setError(''); setAnalysis(null); setLoading(true);
    try {
      const conversation_logs = JSON.parse(logsText);
      const data = await api.aiFlowVisualizer({ conversation_logs });
      setAnalysis(data.analysis);
    } catch (err) { setError(err.message); }
    setLoading(false);
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Flow Visualizer</h2>
          <p>Map user paths, identify drop-off points, suggest improvements</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <select className="form-select" style={{ width: 220 }} value={selectedBot} onChange={e => setSelectedBot(e.target.value)}>
            <option value="">Select chatbot...</option>
            {chatbots.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
          <button className="btn btn-secondary btn-sm" onClick={loadFromConversations}>
            <i className="fa-solid fa-download"></i> Load from Conversations
          </button>
        </div>
      </div>

      {error && <div className="alert alert-danger" style={{ marginBottom: 12 }}>{error}</div>}

      <div className="card" style={{ marginBottom: 16 }}>
        <label className="form-label">Conversation Logs (JSON)</label>
        <textarea
          className="form-input"
          rows={10}
          style={{ fontFamily: 'monospace', fontSize: 12 }}
          value={logsText}
          onChange={e => setLogsText(e.target.value)}
        />
        <button className="btn btn-primary" onClick={analyze} disabled={loading} style={{ marginTop: 12 }}>
          {loading ? <><span className="spinner" style={{ width: 14, height: 14 }} /> Analyzing...</> : <><i className="fa-solid fa-diagram-project"></i> Analyze Flow</>}
        </button>
      </div>

      {analysis && (
        <div className="analytics-grid">
          <div className="card">
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>
              <i className="fa-solid fa-route"></i> Path Map
            </h3>
            <pre style={{ background: 'var(--bg-light, #f5f5f5)', padding: 12, borderRadius: 6, fontSize: 12, overflow: 'auto', maxHeight: 300 }}>
              {JSON.stringify(analysis.path_map || analysis.raw || {}, null, 2)}
            </pre>
          </div>
          <div className="card">
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12, color: '#DC2626' }}>
              <i className="fa-solid fa-triangle-exclamation"></i> Drop-off Nodes
            </h3>
            <ul>
              {(analysis.drop_off_nodes || []).map((d, i) => (
                <li key={i} style={{ padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
                  {typeof d === 'string' ? d : JSON.stringify(d)}
                </li>
              ))}
              {(!analysis.drop_off_nodes || analysis.drop_off_nodes.length === 0) && <li>No drop-offs detected</li>}
            </ul>
          </div>
          <div className="card">
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12, color: '#D97706' }}>
              <i className="fa-solid fa-warning"></i> Bottlenecks
            </h3>
            <ul>
              {(analysis.bottlenecks || []).map((b, i) => (
                <li key={i} style={{ padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
                  {typeof b === 'string' ? b : JSON.stringify(b)}
                </li>
              ))}
            </ul>
          </div>
          <div className="card">
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12, color: '#10B981' }}>
              <i className="fa-solid fa-lightbulb"></i> Suggestions
            </h3>
            <ul>
              {(analysis.suggestions || []).map((s, i) => (
                <li key={i} style={{ padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
                  {typeof s === 'string' ? s : JSON.stringify(s)}
                </li>
              ))}
            </ul>
          </div>
          {analysis.path_stats && (
            <div className="card" style={{ gridColumn: '1 / -1' }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Path Statistics</h3>
              <pre style={{ background: 'var(--bg-light, #f5f5f5)', padding: 12, borderRadius: 6, fontSize: 12, overflow: 'auto' }}>
                {JSON.stringify(analysis.path_stats, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
