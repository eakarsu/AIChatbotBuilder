import React, { useState, useEffect, useRef } from 'react';
import api from '../api';
import ReactMarkdown from 'react-markdown';

export default function AIChat() {
  const [chatbots, setChatbots] = useState([]);
  const [selectedBot, setSelectedBot] = useState('');
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEnd = useRef(null);

  useEffect(() => { api.getAll('chatbots').then(setChatbots).catch(() => {}); }, []);
  useEffect(() => { messagesEnd.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg = { role: 'user', content: input };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const history = newMessages.map(m => ({ role: m.role, content: m.content }));
      const data = await api.aiChat({ message: input, chatbot_id: selectedBot || undefined, conversation_history: history.slice(0, -1) });
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.response,
        model: data.model,
        usage: data.usage,
      }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Error: ' + err.message }]);
    }
    setLoading(false);
  };

  return (
    <div>
      <div className="page-header">
        <div><h2>AI Chat</h2><p>Test your chatbots with OpenRouter AI</p></div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <select className="form-select" style={{ width: '200px' }} value={selectedBot} onChange={e => setSelectedBot(e.target.value)}>
            <option value="">General AI Chat</option>
            {chatbots.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
          <button className="btn btn-secondary btn-sm" onClick={() => setMessages([])}>
            <i className="fa-solid fa-trash"></i> Clear
          </button>
        </div>
      </div>

      <div className="chat-container">
        <div className="chat-messages">
          {messages.length === 0 && (
            <div className="empty-state" style={{ padding: '40px' }}>
              <i className="fa-solid fa-brain" style={{ fontSize: '64px', color: 'var(--primary-light)', marginBottom: '20px' }}></i>
              <h3>Start a Conversation</h3>
              <p>Type a message below to chat with {selectedBot ? 'your chatbot' : 'AI'}. Powered by OpenRouter.</p>
            </div>
          )}
          {messages.map((msg, i) => (
            <div key={i}>
              <div className={`chat-message ${msg.role}`}>
                {msg.role === 'assistant' && (
                  <div className="msg-avatar" style={{ background: '#10B981' }}>
                    <i className="fa-solid fa-robot"></i>
                  </div>
                )}
                <div className="msg-content">
                  {msg.role === 'assistant' ? <ReactMarkdown>{msg.content}</ReactMarkdown> : msg.content}
                </div>
                {msg.role === 'user' && (
                  <div className="msg-avatar" style={{ background: '#4F46E5' }}>
                    <i className="fa-solid fa-user"></i>
                  </div>
                )}
              </div>
              {msg.role === 'assistant' && (msg.model || msg.usage) && (
                <div className="ai-output-meta" style={{ marginLeft: '48px', marginTop: '-8px', marginBottom: '12px', background: 'transparent', border: 'none', padding: '4px 0' }}>
                  {msg.model && <span><i className="fa-solid fa-microchip"></i> {msg.model}</span>}
                  {msg.usage?.total_tokens && <span><i className="fa-solid fa-calculator"></i> {msg.usage.total_tokens} tokens</span>}
                </div>
              )}
            </div>
          ))}
          {loading && (
            <div className="chat-message assistant">
              <div className="msg-avatar" style={{ background: '#10B981' }}><i className="fa-solid fa-robot"></i></div>
              <div className="msg-content" style={{ display: 'flex', gap: '4px' }}>
                <div className="spinner" style={{ width: 16, height: 16, margin: 0 }}></div>
                Thinking...
              </div>
            </div>
          )}
          <div ref={messagesEnd} />
        </div>

        <div className="chat-input-area">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendMessage()}
            placeholder="Type your message..."
            disabled={loading}
          />
          <button onClick={sendMessage} disabled={loading}>
            <i className="fa-solid fa-paper-plane"></i>
          </button>
        </div>
      </div>
    </div>
  );
}
