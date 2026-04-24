const express = require('express');
const cors = require('cors');
require('dotenv').config({ path: '../.env' });

const app = express();
const PORT = process.env.BACKEND_PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/chatbots', require('./routes/chatbots'));
app.use('/api/flows', require('./routes/flows'));
app.use('/api/knowledge-bases', require('./routes/knowledgeBase'));
app.use('/api/conversations', require('./routes/conversations'));
app.use('/api/templates', require('./routes/templates'));
app.use('/api/channels', require('./routes/channels'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/intents', require('./routes/intents'));
app.use('/api/entities', require('./routes/entities'));
app.use('/api/training-data', require('./routes/trainingData'));
app.use('/api/responses', require('./routes/responses'));
app.use('/api/webhooks', require('./routes/webhooks'));
app.use('/api/settings', require('./routes/settings'));
app.use('/api/users', require('./routes/users'));
app.use('/api/contacts', require('./routes/contacts'));
app.use('/api/api-keys', require('./routes/apiKeys'));
app.use('/api/audit-logs', require('./routes/auditLogs'));
app.use('/api/deployments', require('./routes/deployments'));
app.use('/api/quick-replies', require('./routes/quickReplies'));
app.use('/api/media', require('./routes/media'));
app.use('/api/tags', require('./routes/tags'));
app.use('/api/broadcasts', require('./routes/broadcasts'));
app.use('/api/forms', require('./routes/forms'));
app.use('/api/plugins', require('./routes/plugins'));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`  Backend running on http://localhost:${PORT}`);
});
