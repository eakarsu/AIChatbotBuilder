import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const fillCredentials = () => {
    setEmail('admin@chatbot.ai');
    setPassword('password123');
    setError('');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await api.login(email, password);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      onLogin();
      navigate('/');
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="logo"><i className="fa-solid fa-robot" style={{ color: '#4F46E5' }}></i></div>
        <h1>AI Chatbot Builder</h1>
        <p className="subtitle">Build intelligent chatbots with drag-and-drop simplicity</p>

        {error && <div className="error-msg"><i className="fa-solid fa-circle-exclamation"></i> {error}</div>}

        <button type="button" className="fill-btn" onClick={fillCredentials}>
          <i className="fa-solid fa-wand-magic-sparkles"></i> Fill Demo Credentials
        </button>

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label>Email</label>
            <input className="form-input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Enter your email" required />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input className="form-input" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter your password" required />
          </div>
          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
