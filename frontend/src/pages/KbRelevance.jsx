import React, { useState, useEffect } from 'react';
import api from '../api';

export default function KbRelevance() {
  const [kbs, setKbs] = useState([]);
  const [query, setQuery] = useState('How do I reset my password?');
  const [selectedIds, setSelectedIds] = useState({});
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getAll('knowledge-bases').then(data => {
      setKbs(data);
      const sel = {};
      (data || []).forEach(k => { sel[k.id] = true; });
      setSelectedIds(sel);
    }).catch(() => {});
  }, []);

  const rank = async () => {
    setError(''); setResults(null); setLoading(true);
    try {
      const kb_articles = kbs
        .filter(k => selectedIds[k.id])
        .map(k => ({ id: k.id, title: k.name, content: k.content || k.description || '' }));
      if (kb_articles.length === 0) {
        setError('Select at least one article');
        setLoading(false);
        return;
      }
      const data = await api.aiKbRelevance({ query, kb_articles });
      setResults(data.top_articles);
    } catch (err) { setError(err.message); }
    setLoading(false);
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>KB Relevance Scorer</h2>
          <p>Rank knowledge base articles by relevance to a user query</p>
        </div>
      </div>

      {error && <div className="alert alert-danger" style={{ marginBottom: 12 }}>{error}</div>}

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="form-group">
          <label className="form-label">User Query</label>
          <input className="form-input" value={query} onChange={e => setQuery(e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Articles to Search ({Object.values(selectedIds).filter(Boolean).length} of {kbs.length} selected)</label>
          <div style={{ maxHeight: 200, overflow: 'auto', border: '1px solid var(--border)', borderRadius: 6, padding: 8 }}>
            {kbs.length === 0 && <em>No knowledge base articles. Add some on the Knowledge Base page.</em>}
            {kbs.map(k => (
              <label key={k.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={!!selectedIds[k.id]}
                  onChange={e => setSelectedIds(prev => ({ ...prev, [k.id]: e.target.checked }))}
                />
                <span>{k.name}</span>
                <span style={{ color: '#999', fontSize: 12 }}>({k.type || 'document'})</span>
              </label>
            ))}
          </div>
        </div>
        <button className="btn btn-primary" onClick={rank} disabled={loading || !query.trim()}>
          {loading ? 'Ranking...' : <><i className="fa-solid fa-ranking-star"></i> Rank Articles</>}
        </button>
      </div>

      {results && (
        <div className="card">
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Top {results.length} Most Relevant</h3>
          {results.map((r, i) => (
            <div key={i} style={{ padding: 12, borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: i === 0 ? '#FFD700' : i === 1 ? '#C0C0C0' : '#CD7F32', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
                  #{i + 1}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600 }}>{r.title}</div>
                  <div style={{ fontSize: 12, color: '#666' }}>{r.reason}</div>
                </div>
                <div className="tag" style={{ background: '#10B981', color: 'white' }}>
                  Score: {((r.relevance_score || 0) * 100).toFixed(0)}%
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
