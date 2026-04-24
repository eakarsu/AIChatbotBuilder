import React, { useState, useEffect } from 'react';
import api from '../api';

export default function Analytics() {
  const [summary, setSummary] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.getAnalyticsSummary(),
      api.getAll('analytics'),
    ]).then(([sum, evts]) => {
      setSummary(sum);
      setEvents(evts);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading"><div className="spinner"></div> Loading...</div>;

  const eventTypeCounts = {};
  events.forEach(e => { eventTypeCounts[e.event_type] = (eventTypeCounts[e.event_type] || 0) + 1; });

  return (
    <div>
      <div className="page-header">
        <div><h2>Analytics</h2><p>Performance metrics and insights for your chatbots</p></div>
      </div>

      <div className="dashboard-cards">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#4F46E5' }}><i className="fa-solid fa-comments"></i></div>
          <div className="stat-value">{summary?.total_conversations || 0}</div>
          <div className="stat-label">Total Conversations</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#10B981' }}><i className="fa-solid fa-comment-dots"></i></div>
          <div className="stat-value">{summary?.active_conversations || 0}</div>
          <div className="stat-label">Active Conversations</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#F59E0B' }}><i className="fa-solid fa-message"></i></div>
          <div className="stat-value">{summary?.total_messages || 0}</div>
          <div className="stat-label">Total Messages</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#EF4444' }}><i className="fa-solid fa-face-smile"></i></div>
          <div className="stat-value">{summary?.avg_satisfaction || '0'}</div>
          <div className="stat-label">Avg Satisfaction</div>
        </div>
      </div>

      <div className="analytics-grid">
        <div className="card">
          <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px' }}>Channel Distribution</h3>
          {(summary?.channel_stats || []).map(ch => (
            <div key={ch.channel} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div className={`channel-icon channel-${ch.channel}`} style={{ width: 32, height: 32, fontSize: 14 }}>
                  <i className={`fa-solid ${ch.channel === 'whatsapp' ? 'fa-brands fa-whatsapp' : ch.channel === 'slack' ? 'fa-brands fa-slack' : 'fa-globe'}`}></i>
                </div>
                <span style={{ fontWeight: 600, textTransform: 'capitalize' }}>{ch.channel}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '120px', height: '8px', background: 'var(--border)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: `${(ch.count / (summary?.total_conversations || 1)) * 100}%`, height: '100%', background: 'var(--primary)', borderRadius: '4px' }}></div>
                </div>
                <span style={{ fontWeight: 700, minWidth: '40px', textAlign: 'right' }}>{ch.count}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="card">
          <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px' }}>Top Chatbots</h3>
          {(summary?.top_bots || []).map((bot, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: 28, height: 28, borderRadius: '8px', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700 }}>{i + 1}</div>
                <span style={{ fontWeight: 600 }}>{bot.name}</span>
              </div>
              <span style={{ fontWeight: 700, color: 'var(--primary)' }}>{bot.conversations} convs</span>
            </div>
          ))}
        </div>

        <div className="card">
          <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px' }}>Event Types</h3>
          {Object.entries(eventTypeCounts).map(([type, count]) => (
            <div key={type} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
              <span className="tag">{type}</span>
              <span style={{ fontWeight: 700 }}>{count}</span>
            </div>
          ))}
        </div>

        <div className="card">
          <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px' }}>Recent Events</h3>
          <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
            {events.slice(0, 10).map(evt => (
              <div key={evt.id} style={{ padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="tag">{evt.event_type}</span>
                  <small style={{ color: 'var(--text-light)' }}>{evt.chatbot_name}</small>
                </div>
                <small style={{ color: 'var(--text-light)' }}>{evt.channel} - {new Date(evt.created_at).toLocaleString()}</small>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
