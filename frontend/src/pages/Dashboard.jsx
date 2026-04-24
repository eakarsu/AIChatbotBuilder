import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

const features = [
  { path: '/chatbots', icon: 'fa-solid fa-robot', color: '#4F46E5', title: 'Chatbots', desc: 'Create and manage AI chatbots' },
  { path: '/flow-builder', icon: 'fa-solid fa-diagram-project', color: '#7C3AED', title: 'Flow Builder', desc: 'Drag-and-drop conversation flows' },
  { path: '/knowledge-base', icon: 'fa-solid fa-book', color: '#2563EB', title: 'Knowledge Base', desc: 'Manage documents and FAQs' },
  { path: '/conversations', icon: 'fa-solid fa-comments', color: '#0891B2', title: 'Conversations', desc: 'View and manage chat sessions' },
  { path: '/templates', icon: 'fa-solid fa-clone', color: '#059669', title: 'Templates', desc: 'Pre-built chatbot templates' },
  { path: '/channels', icon: 'fa-solid fa-tower-broadcast', color: '#D97706', title: 'Channels', desc: 'Web, WhatsApp, Slack deploy' },
  { path: '/analytics', icon: 'fa-solid fa-chart-line', color: '#DC2626', title: 'Analytics', desc: 'Performance metrics and insights' },
  { path: '/ai-chat', icon: 'fa-solid fa-brain', color: '#4F46E5', title: 'AI Chat', desc: 'Test AI with OpenRouter' },
  { path: '/intents', icon: 'fa-solid fa-bullseye', color: '#7C3AED', title: 'Intents', desc: 'Manage conversation intents' },
  { path: '/entities', icon: 'fa-solid fa-tags', color: '#2563EB', title: 'Entities', desc: 'Define entity types and values' },
  { path: '/training-data', icon: 'fa-solid fa-graduation-cap', color: '#0891B2', title: 'Training Data', desc: 'Training examples for NLU' },
  { path: '/responses', icon: 'fa-solid fa-reply', color: '#059669', title: 'Responses', desc: 'Bot response management' },
  { path: '/webhooks', icon: 'fa-solid fa-bolt', color: '#D97706', title: 'Webhooks', desc: 'External integrations' },
  { path: '/settings', icon: 'fa-solid fa-gear', color: '#6B7280', title: 'Settings', desc: 'App configuration' },
  { path: '/users', icon: 'fa-solid fa-users', color: '#4F46E5', title: 'Users', desc: 'Team management' },
  { path: '/contacts', icon: 'fa-solid fa-address-book', color: '#0891B2', title: 'Contacts', desc: 'Manage contacts and leads' },
  { path: '/api-keys', icon: 'fa-solid fa-key', color: '#D97706', title: 'API Keys', desc: 'Manage API access keys' },
  { path: '/audit-logs', icon: 'fa-solid fa-clipboard-list', color: '#6B7280', title: 'Audit Logs', desc: 'Track system activity' },
  { path: '/deployments', icon: 'fa-solid fa-rocket', color: '#7C3AED', title: 'Deployments', desc: 'Deploy and manage releases' },
  { path: '/quick-replies', icon: 'fa-solid fa-reply-all', color: '#059669', title: 'Quick Replies', desc: 'Pre-built message shortcuts' },
  { path: '/media', icon: 'fa-solid fa-photo-film', color: '#DC2626', title: 'Media Library', desc: 'Manage images and files' },
  { path: '/tags', icon: 'fa-solid fa-tag', color: '#4F46E5', title: 'Tags', desc: 'Label and organize resources' },
  { path: '/broadcasts', icon: 'fa-solid fa-bullhorn', color: '#2563EB', title: 'Broadcasts', desc: 'Send mass messages' },
  { path: '/forms', icon: 'fa-solid fa-rectangle-list', color: '#8B5CF6', title: 'Forms', desc: 'Data collection forms' },
  { path: '/plugins', icon: 'fa-solid fa-plug', color: '#EC4899', title: 'Plugins', desc: 'Third-party integrations' },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [counts, setCounts] = useState({});

  useEffect(() => {
    api.getAnalyticsSummary().then(setStats).catch(() => {});
    // Load counts for features
    const resources = ['chatbots', 'knowledge-bases', 'conversations', 'templates', 'channels', 'intents', 'entities', 'training-data', 'responses', 'webhooks', 'settings', 'users', 'contacts', 'api-keys', 'audit-logs', 'deployments', 'quick-replies', 'media', 'tags', 'broadcasts', 'forms', 'plugins'];
    resources.forEach(r => {
      api.getAll(r).then(data => setCounts(prev => ({ ...prev, [r]: data.length }))).catch(() => {});
    });
  }, []);

  const countMap = {
    '/chatbots': counts['chatbots'],
    '/knowledge-base': counts['knowledge-bases'],
    '/conversations': counts['conversations'],
    '/templates': counts['templates'],
    '/channels': counts['channels'],
    '/intents': counts['intents'],
    '/entities': counts['entities'],
    '/training-data': counts['training-data'],
    '/responses': counts['responses'],
    '/webhooks': counts['webhooks'],
    '/settings': counts['settings'],
    '/users': counts['users'],
    '/contacts': counts['contacts'],
    '/api-keys': counts['api-keys'],
    '/audit-logs': counts['audit-logs'],
    '/deployments': counts['deployments'],
    '/quick-replies': counts['quick-replies'],
    '/media': counts['media'],
    '/tags': counts['tags'],
    '/broadcasts': counts['broadcasts'],
    '/forms': counts['forms'],
    '/plugins': counts['plugins'],
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Dashboard</h2>
          <p>Welcome back! Here's an overview of your chatbot platform.</p>
        </div>
      </div>

      <div className="dashboard-cards">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#4F46E5' }}><i className="fa-solid fa-robot"></i></div>
          <div className="stat-value">{counts['chatbots'] || 0}</div>
          <div className="stat-label">Total Chatbots</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#059669' }}><i className="fa-solid fa-comments"></i></div>
          <div className="stat-value">{stats?.total_conversations || 0}</div>
          <div className="stat-label">Conversations</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#D97706' }}><i className="fa-solid fa-message"></i></div>
          <div className="stat-value">{stats?.total_messages || 0}</div>
          <div className="stat-label">Messages</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#DC2626' }}><i className="fa-solid fa-face-smile"></i></div>
          <div className="stat-value">{stats?.avg_satisfaction || '0.00'}</div>
          <div className="stat-label">Avg Satisfaction</div>
        </div>
      </div>

      <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '16px' }}>Features</h3>
      <div className="feature-cards">
        {features.map(f => (
          <div key={f.path} className="feature-card" onClick={() => navigate(f.path)}>
            <div className="fc-icon" style={{ background: f.color }}><i className={f.icon}></i></div>
            <div className="fc-title">{f.title}</div>
            <div className="fc-desc">{f.desc}</div>
            {countMap[f.path] !== undefined && (
              <div className="fc-count">{countMap[f.path]} items</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
