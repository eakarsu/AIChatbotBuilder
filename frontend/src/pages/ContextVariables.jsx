import React, { useState } from 'react';
import api from '../api';

export default function ContextVariables() {
  const [conversation, setConversation] = useState(
    'User: Hi, my name is Sarah. I need help with my order.\nBot: Hi Sarah! What seems to be the issue?\nUser: My phone is 555-1234, I never received my package.'
  );
  const [varsConfig, setVarsConfig] = useState('name, email, issue, phone, location');
  const [extracted, setExtracted] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const extract = async () => {
    setError(''); setExtracted(null); setLoading(true);
    try {
      const variables_config = varsConfig.split(',').map(v => v.trim()).filter(Boolean);
      const data = await api.aiContextVariables({ conversation, variables_config });
      setExtracted(data.extracted_variables);
    } catch (err) { setError(err.message); }
    setLoading(false);
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Context Variable Extractor</h2>
          <p>Extract user state (name, email, issue) from conversations for personalization</p>
        </div>
      </div>

      {error && <div className="alert alert-danger" style={{ marginBottom: 12 }}>{error}</div>}

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="form-group">
          <label className="form-label">Variables to Extract (comma-separated)</label>
          <input className="form-input" value={varsConfig} onChange={e => setVarsConfig(e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Conversation Text</label>
          <textarea className="form-input" rows={8} value={conversation} onChange={e => setConversation(e.target.value)} />
        </div>
        <button className="btn btn-primary" onClick={extract} disabled={loading || !conversation.trim()}>
          {loading ? 'Extracting...' : <><i className="fa-solid fa-wand-magic-sparkles"></i> Extract Variables</>}
        </button>
      </div>

      {extracted && (
        <div className="card">
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Extracted Variables</h3>
          <table className="table">
            <thead>
              <tr><th>Variable</th><th>Value</th><th>Confidence</th></tr>
            </thead>
            <tbody>
              {Object.entries(extracted).map(([k, v]) => {
                const isObj = v && typeof v === 'object' && !Array.isArray(v);
                const value = isObj ? (v.value ?? JSON.stringify(v)) : (v ?? '—');
                const confidence = isObj && v.confidence !== undefined ? v.confidence : null;
                return (
                  <tr key={k}>
                    <td><strong>{k}</strong></td>
                    <td>{value === null || value === undefined || value === '' ? <em style={{ color: '#999' }}>not found</em> : String(value)}</td>
                    <td>
                      {confidence !== null ? (
                        <span className="tag" style={{ background: confidence >= 0.7 ? '#10B981' : confidence >= 0.4 ? '#F59E0B' : '#DC2626', color: 'white' }}>
                          {(confidence * 100).toFixed(0)}%
                        </span>
                      ) : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div style={{ marginTop: 16, padding: 12, background: 'var(--bg-light, #f5f5f5)', borderRadius: 6, fontSize: 13 }}>
            <strong>Inject example:</strong> "Hi {'{name}'}, regarding your {'{issue}'}, I'll send updates to {'{email}'}."
          </div>
        </div>
      )}
    </div>
  );
}
