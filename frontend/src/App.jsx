import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Chatbots from './pages/Chatbots';
import FlowBuilder from './pages/FlowBuilder';
import KnowledgeBase from './pages/KnowledgeBase';
import Conversations from './pages/Conversations';
import Templates from './pages/Templates';
import Channels from './pages/Channels';
import Analytics from './pages/Analytics';
import AIChat from './pages/AIChat';
import Intents from './pages/Intents';
import Entities from './pages/Entities';
import TrainingData from './pages/TrainingData';
import Responses from './pages/Responses';
import Webhooks from './pages/Webhooks';
import Settings from './pages/Settings';
import Users from './pages/Users';
import Contacts from './pages/Contacts';
import ApiKeys from './pages/ApiKeys';
import AuditLogs from './pages/AuditLogs';
import Deployments from './pages/Deployments';
import QuickReplies from './pages/QuickReplies';
import MediaLibrary from './pages/MediaLibrary';
import Tags from './pages/Tags';
import Broadcasts from './pages/Broadcasts';
import Forms from './pages/Forms';
import Plugins from './pages/Plugins';

function ProtectedRoute({ children }) {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/login" />;
  return children;
}

function AppLayout({ children }) {
  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">{children}</main>
    </div>
  );
}

export default function App() {
  const [, setAuth] = useState(!!localStorage.getItem('token'));

  useEffect(() => {
    const handler = () => setAuth(!!localStorage.getItem('token'));
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login onLogin={() => setAuth(true)} />} />
        <Route path="/" element={<ProtectedRoute><AppLayout><Dashboard /></AppLayout></ProtectedRoute>} />
        <Route path="/chatbots" element={<ProtectedRoute><AppLayout><Chatbots /></AppLayout></ProtectedRoute>} />
        <Route path="/flow-builder" element={<ProtectedRoute><AppLayout><FlowBuilder /></AppLayout></ProtectedRoute>} />
        <Route path="/flow-builder/:id" element={<ProtectedRoute><AppLayout><FlowBuilder /></AppLayout></ProtectedRoute>} />
        <Route path="/knowledge-base" element={<ProtectedRoute><AppLayout><KnowledgeBase /></AppLayout></ProtectedRoute>} />
        <Route path="/conversations" element={<ProtectedRoute><AppLayout><Conversations /></AppLayout></ProtectedRoute>} />
        <Route path="/templates" element={<ProtectedRoute><AppLayout><Templates /></AppLayout></ProtectedRoute>} />
        <Route path="/channels" element={<ProtectedRoute><AppLayout><Channels /></AppLayout></ProtectedRoute>} />
        <Route path="/analytics" element={<ProtectedRoute><AppLayout><Analytics /></AppLayout></ProtectedRoute>} />
        <Route path="/ai-chat" element={<ProtectedRoute><AppLayout><AIChat /></AppLayout></ProtectedRoute>} />
        <Route path="/intents" element={<ProtectedRoute><AppLayout><Intents /></AppLayout></ProtectedRoute>} />
        <Route path="/entities" element={<ProtectedRoute><AppLayout><Entities /></AppLayout></ProtectedRoute>} />
        <Route path="/training-data" element={<ProtectedRoute><AppLayout><TrainingData /></AppLayout></ProtectedRoute>} />
        <Route path="/responses" element={<ProtectedRoute><AppLayout><Responses /></AppLayout></ProtectedRoute>} />
        <Route path="/webhooks" element={<ProtectedRoute><AppLayout><Webhooks /></AppLayout></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><AppLayout><Settings /></AppLayout></ProtectedRoute>} />
        <Route path="/users" element={<ProtectedRoute><AppLayout><Users /></AppLayout></ProtectedRoute>} />
        <Route path="/contacts" element={<ProtectedRoute><AppLayout><Contacts /></AppLayout></ProtectedRoute>} />
        <Route path="/api-keys" element={<ProtectedRoute><AppLayout><ApiKeys /></AppLayout></ProtectedRoute>} />
        <Route path="/audit-logs" element={<ProtectedRoute><AppLayout><AuditLogs /></AppLayout></ProtectedRoute>} />
        <Route path="/deployments" element={<ProtectedRoute><AppLayout><Deployments /></AppLayout></ProtectedRoute>} />
        <Route path="/quick-replies" element={<ProtectedRoute><AppLayout><QuickReplies /></AppLayout></ProtectedRoute>} />
        <Route path="/media" element={<ProtectedRoute><AppLayout><MediaLibrary /></AppLayout></ProtectedRoute>} />
        <Route path="/tags" element={<ProtectedRoute><AppLayout><Tags /></AppLayout></ProtectedRoute>} />
        <Route path="/broadcasts" element={<ProtectedRoute><AppLayout><Broadcasts /></AppLayout></ProtectedRoute>} />
        <Route path="/forms" element={<ProtectedRoute><AppLayout><Forms /></AppLayout></ProtectedRoute>} />
        <Route path="/plugins" element={<ProtectedRoute><AppLayout><Plugins /></AppLayout></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  );
}
