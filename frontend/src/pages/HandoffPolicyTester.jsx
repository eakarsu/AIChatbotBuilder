import React, { useState } from 'react';
import api from '../api';

const starter = JSON.stringify({
  thresholds: { sentiment: -0.65, intent_confidence: 0.6, wait_seconds: 120 },
  turns: [
    { user: 'I was charged twice and nobody answered yesterday.', sentiment: -0.7, intent_confidence: 0.54, wait_seconds: 85 },
    { user: 'Cancel my account if this is not fixed today.', sentiment: -0.9, intent_confidence: 0.46, wait_seconds: 140 }
  ]
}, null, 2);

export default function HandoffPolicyTester() {
  const [payload, setPayload] = useState(starter);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const run = async () => {
    setError('');
    try {
      setResult(await api.handoffPolicyTest(JSON.parse(payload)));
    } catch (err) {
      setError(err.message || 'Handoff test failed');
    }
  };

  return (
    <div className="page">
      <div className="page-header"><h1>Handoff Policy Tester</h1><p>Test when a bot should hand a conversation to a human queue based on sentiment, confidence, and wait time.</p></div>
      <div className="dashboard-grid">
        <section className="card">
          <textarea className="form-control" rows={18} value={payload} onChange={(event) => setPayload(event.target.value)} />
          <button className="btn btn-primary" onClick={run}>Test Policy</button>
          {error && <p className="error">{error}</p>}
        </section>
        <section className="card">
          {!result ? <p className="text-muted">Policy decisions appear here.</p> : (
            <>
              <div className="stats-row">
                <div className="stat"><span>Handoff</span><strong>{result.shouldHandoff ? 'Yes' : 'No'}</strong></div>
                <div className="stat"><span>First Turn</span><strong>{result.firstHandoffTurn || '-'}</strong></div>
              </div>
              {result.decisions.map((decision) => (
                <div className="list-item" key={decision.turn}>
                  <div><strong>Turn {decision.turn}</strong> · {decision.recommendedQueue}</div>
                  <p>{decision.user}</p>
                  <small>{decision.reasons.length ? decision.reasons.join(', ') : 'no trigger'}</small>
                </div>
              ))}
            </>
          )}
        </section>
      </div>
    </div>
  );
}
