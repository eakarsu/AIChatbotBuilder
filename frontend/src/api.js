const API_BASE = '/api';

function getHeaders() {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { ...getHeaders(), ...options.headers },
  });
  if (res.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/';
    return;
  }
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

const api = {
  // Auth
  login: (email, password) => request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  register: (name, email, password) => request('/auth/register', { method: 'POST', body: JSON.stringify({ name, email, password }) }),

  // Generic CRUD
  getAll: (resource) => request(`/${resource}`),
  getOne: (resource, id) => request(`/${resource}/${id}`),
  create: (resource, data) => request(`/${resource}`, { method: 'POST', body: JSON.stringify(data) }),
  update: (resource, id, data) => request(`/${resource}/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  remove: (resource, id) => request(`/${resource}/${id}`, { method: 'DELETE' }),

  // Analytics
  getAnalyticsSummary: () => request('/analytics/summary'),

  // AI
  aiChat: (data) => request('/ai/chat', { method: 'POST', body: JSON.stringify(data) }),
  aiGenerateFlow: (data) => request('/ai/generate-flow', { method: 'POST', body: JSON.stringify(data) }),
  aiAnalyzeConversation: (data) => request('/ai/analyze-conversation', { method: 'POST', body: JSON.stringify(data) }),
  aiSuggestIntents: (data) => request('/ai/suggest-intents', { method: 'POST', body: JSON.stringify(data) }),
  aiGenerateTrainingData: (data) => request('/ai/generate-training-data', { method: 'POST', body: JSON.stringify(data) }),
  aiImproveResponse: (data) => request('/ai/improve-response', { method: 'POST', body: JSON.stringify(data) }),
  aiKbQuery: (data) => request('/ai/kb-query', { method: 'POST', body: JSON.stringify(data) }),

  // New AI endpoints
  aiFlowVisualizer: (data) => request('/ai/flow-visualizer', { method: 'POST', body: JSON.stringify(data) }),
  aiContextVariables: (data) => request('/ai/context-variables', { method: 'POST', body: JSON.stringify(data) }),
  aiKbRelevance: (data) => request('/ai/kb-relevance', { method: 'POST', body: JSON.stringify(data) }),
  aiToneAnalyzer: (data) => request('/ai/tone-analyzer', { method: 'POST', body: JSON.stringify(data) }),
  aiEscalationDetector: (data) => request('/ai/escalation-detector', { method: 'POST', body: JSON.stringify(data) }),

  // Apply pass 4 backlog AI endpoints
  aiMineIntents: (data) => request('/ai/mine-intents', { method: 'POST', body: JSON.stringify(data) }),
  aiSentimentEscalation: (data) => request('/ai/sentiment-escalation', { method: 'POST', body: JSON.stringify(data) }),

  // A/B Tests
  abTestList: () => request('/ab-tests'),
  abTestGet: (id) => request(`/ab-tests/${id}`),
  abTestCreate: (data) => request('/ab-tests', { method: 'POST', body: JSON.stringify(data) }),
  abTestUpdate: (id, data) => request(`/ab-tests/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  abTestDelete: (id) => request(`/ab-tests/${id}`, { method: 'DELETE' }),
  abTestResults: (id) => request(`/ab-tests/${id}/results`),
  abTestRecord: (id, data) => request(`/ab-tests/${id}/record`, { method: 'POST', body: JSON.stringify(data) }),

  // Conversation messages
  addMessage: (convId, data) => request(`/conversations/${convId}/messages`, { method: 'POST', body: JSON.stringify(data) }),

  // AI Results history (paginated)
  aiResultsList: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/ai-results${qs ? `?${qs}` : ''}`);
  },
  aiResultDetail: (id) => request(`/ai-results/${id}`),
  aiResultDelete: (id) => request(`/ai-results/${id}`, { method: 'DELETE' }),
};

export default api;
