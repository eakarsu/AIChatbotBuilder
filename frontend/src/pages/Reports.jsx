import React, { useState, useEffect } from 'react';

const API_BASE = '/api';

function getHeaders() {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function request(path) {
  const res = await fetch(`${API_BASE}${path}`, { headers: getHeaders() });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export default function Reports() {
  const [summary, setSummary] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [s, a] = await Promise.all([
        request('/reports/summary'),
        request('/reports/analytics.json').catch(() => null),
      ]);
      setSummary(s);
      setAnalytics(a);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const downloadCsv = () => {
    const token = localStorage.getItem('token');
    fetch(`${API_BASE}/reports/conversations.csv`, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      .then(r => r.blob())
      .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'conversations.csv';
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      })
      .catch(e => setError(e.message));
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Reports</h2>
          <p>Resource counts, analytics, and CSV exports</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn" onClick={load}><i className="fa-solid fa-rotate"></i> Refresh</button>
          <button className="btn btn-primary" onClick={downloadCsv}>
            <i className="fa-solid fa-file-csv"></i> Export Conversations CSV
          </button>
        </div>
      </div>

      {error && <div className="card" style={{ background: '#FEE2E2', color: '#991B1B', marginBottom: '12px' }}>{error}</div>}

      {loading ? (
        <div className="loading"><div className="spinner"></div> Loading...</div>
      ) : (
        <>
          <div className="dashboard-cards">
            {summary && Object.entries(summary).map(([key, value]) => (
              <div className="stat-card" key={key}>
                <div className="stat-icon" style={{ background: '#4F46E5' }}><i className="fa-solid fa-chart-simple"></i></div>
                <div className="stat-value">{typeof value === 'number' ? value : '-'}</div>
                <div className="stat-label">{key.replace(/_/g, ' ')}</div>
              </div>
            ))}
          </div>

          {analytics && (
            <div className="card" style={{ marginTop: '16px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px' }}>Analytics Payload</h3>
              <pre style={{ background: '#F8FAFC', padding: '12px', borderRadius: '8px', overflow: 'auto', fontSize: '12px' }}>
                {JSON.stringify(analytics, null, 2)}
              </pre>
            </div>
          )}
        </>
      )}
    </div>
  );
}
