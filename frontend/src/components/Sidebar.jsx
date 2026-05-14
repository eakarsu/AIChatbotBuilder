import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const navItems = [
  { section: 'Main' },
  { path: '/', icon: 'fa-solid fa-grid-2', label: 'Dashboard' },
  { path: '/chatbots', icon: 'fa-solid fa-robot', label: 'Chatbots' },
  { path: '/flow-builder', icon: 'fa-solid fa-diagram-project', label: 'Flow Builder' },
  { path: '/ai-chat', icon: 'fa-solid fa-brain', label: 'AI Chat' },
  { path: '/flow-visualizer', icon: 'fa-solid fa-route', label: 'Flow Visualizer' },
  { path: '/context-variables', icon: 'fa-solid fa-database', label: 'Context Variables' },
  { path: '/kb-relevance', icon: 'fa-solid fa-magnifying-glass', label: 'KB Relevance' },
  { path: '/ai-results', icon: 'fa-solid fa-clock-rotate-left', label: 'AI Results History' },
  { path: '/ai-tools-mining', icon: 'fa-solid fa-magnifying-glass-chart', label: 'Mining & Sentiment' },
  { section: 'Content' },
  { path: '/knowledge-base', icon: 'fa-solid fa-book', label: 'Knowledge Base' },
  { path: '/templates', icon: 'fa-solid fa-clone', label: 'Templates' },
  { path: '/responses', icon: 'fa-solid fa-reply', label: 'Responses' },
  { section: 'NLU' },
  { path: '/intents', icon: 'fa-solid fa-bullseye', label: 'Intents' },
  { path: '/entities', icon: 'fa-solid fa-tags', label: 'Entities' },
  { path: '/training-data', icon: 'fa-solid fa-graduation-cap', label: 'Training Data' },
  { section: 'Content' },
  { path: '/quick-replies', icon: 'fa-solid fa-reply-all', label: 'Quick Replies' },
  { path: '/media', icon: 'fa-solid fa-photo-film', label: 'Media Library' },
  { path: '/tags', icon: 'fa-solid fa-tag', label: 'Tags' },
  { section: 'Operations' },
  { path: '/conversations', icon: 'fa-solid fa-comments', label: 'Conversations' },
  { path: '/contacts', icon: 'fa-solid fa-address-book', label: 'Contacts' },
  { path: '/channels', icon: 'fa-solid fa-tower-broadcast', label: 'Channels' },
  { path: '/broadcasts', icon: 'fa-solid fa-bullhorn', label: 'Broadcasts' },
  { path: '/analytics', icon: 'fa-solid fa-chart-line', label: 'Analytics' },
  { path: '/reports', icon: 'fa-solid fa-file-lines', label: 'Reports' },
  { path: '/notifications', icon: 'fa-solid fa-bell', label: 'Notifications' },
  { path: '/webhooks', icon: 'fa-solid fa-bolt', label: 'Webhooks' },
  { path: '/forms', icon: 'fa-solid fa-rectangle-list', label: 'Forms' },
  { path: '/deployments', icon: 'fa-solid fa-rocket', label: 'Deployments' },
  { section: 'System' },
  { path: '/settings', icon: 'fa-solid fa-gear', label: 'Settings' },
  { path: '/users', icon: 'fa-solid fa-users', label: 'Users' },
  { path: '/api-keys', icon: 'fa-solid fa-key', label: 'API Keys' },
  { path: '/audit-logs', icon: 'fa-solid fa-clipboard-list', label: 'Audit Logs' },
  { path: '/plugins', icon: 'fa-solid fa-plug', label: 'Plugins' },
];

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h1><i className="fa-solid fa-robot"></i> <span>AI Chatbot Builder</span></h1>
      </div>
      <nav className="sidebar-nav">
        {navItems.map((item, i) =>
          item.section ? (
            <div key={i} className="nav-section">{item.section}</div>
          ) : (
            <button
              key={item.path}
              className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
              onClick={() => navigate(item.path)}
            >
              <i className={item.icon}></i>
              <span>{item.label}</span>
            </button>
          )
        )}
      </nav>
      <div className="sidebar-footer">
        <div className="user-info">
          <div className="user-avatar">{(user.name || 'U')[0]}</div>
          <div>
            <div className="user-name">{user.name || 'User'}</div>
            <div className="user-email">{user.email || ''}</div>
          </div>
        </div>
        <button className="logout-btn" onClick={handleLogout}>
          <i className="fa-solid fa-right-from-bracket"></i> Sign Out
        </button>
      </div>
    </aside>
  );
}
