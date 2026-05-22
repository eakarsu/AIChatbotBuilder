const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config({ path: '../.env' });

const app = express();
const PORT = process.env.BACKEND_PORT || 3001;

// Security headers
app.use(helmet({
  contentSecurityPolicy: false, // disabled in dev to allow API calls from Vite
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// CORS - configured from environment
const allowedOrigins = (process.env.CORS_ORIGINS || `http://localhost:${process.env.FRONTEND_PORT || 3000}`)
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/chatbots', require('./routes/chatbots'));
// Chatbot-scoped conversation endpoints: GET /api/chatbots/:id/conversations
app.use('/api/chatbots', require('./routes/chatbotConversations'));
app.use('/api/flows', require('./routes/flows'));
app.use('/api/knowledge-bases', require('./routes/knowledgeBase'));
app.use('/api/conversations', require('./routes/conversations'));
app.use('/api/templates', require('./routes/templates'));
app.use('/api/channels', require('./routes/channels'));
app.use('/api/analytics', require('./routes/analytics'));
// Core AI endpoints (chat, generate-flow, suggest-intents, etc.)
app.use('/api/ai', require('./routes/ai'));
// New AI endpoints (flow-visualizer, context-variables, kb-relevance, tone-analyzer, escalation-detector)
app.use('/api/ai', require('./routes/aiNew'));
// Apply pass 4 backlog AI endpoints (mine-intents, sentiment-escalation)
app.use('/api/ai', require('./routes/aiBacklog'));
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
// A/B Testing
app.use('/api/ab-tests', require('./routes/abTests'));
// AI Results history
app.use('/api/ai-results', require('./routes/aiResults'));
// Notifications subsystem (audit: missing notifications)
app.use('/api/notifications', require('./routes/notifications'));
// Reporting & export subsystem (audit: missing reporting)
app.use('/api/reports', require('./routes/reports'));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});


app.use('/api/omnichannel-router', require('./routes/omnichannelRouter')); // apply pass 6 — audit custom suggestion

app.use('/api/conversation-miner', require('./routes/conversationMiner')); // apply pass 6 — audit custom suggestion

app.use('/api/sentiment-escalation', require('./routes/sentimentEscalation')); // apply pass 6 — audit custom suggestion

app.use('/api/crm-integrations', require('./routes/crmIntegrations')); // apply pass 6 — audit custom suggestion
app.use('/api/custom-views', require('./routes/customViews'));
app.use('/api/handoff-policy', require('./routes/handoffPolicyTester'));
app.listen(PORT, () => {
  console.log(`  Backend running on http://localhost:${PORT}`);
  console.log(`  CORS allowed origins: ${allowedOrigins.join(', ')}`);
});


// === Batch 01 Gaps & Frontend Mounts ===
app.use('/api/gap-only-7-mounted-ai-endpoints-for-33-routes-feature-', require('./routes/gap_only_7_mounted_ai_endpoints_for_33_routes_feature_'));
app.use('/api/gap-no-ai-voice-ivr-channel-support', require('./routes/gap_no_ai_voice_ivr_channel_support'));
app.use('/api/gap-no-ai-multi-bot-orchestration-router-agent', require('./routes/gap_no_ai_multi_bot_orchestration_router_agent'));
app.use('/api/gap-no-ai-self-improving-flow-optimizer-based-on-outco', require('./routes/gap_no_ai_self_improving_flow_optimizer_based_on_outco'));
app.use('/api/gap-no-ai-conversation-quality-scoring', require('./routes/gap_no_ai_conversation_quality_scoring'));
app.use('/api/gap-no-live-chat-takeover-ui-for-human-agents-channels', require('./routes/gap_no_live_chat_takeover_ui_for_human_agents_channels'));
app.use('/api/gap-no-multi-language-flow-translation-tooling', require('./routes/gap_no_multi_language_flow_translation_tooling'));
app.use('/api/gap-no-conversation-design-version-control-branching', require('./routes/gap_no_conversation_design_version_control_branching'));
app.use('/api/gap-no-sdk-embed-code-generator', require('./routes/gap_no_sdk_embed_code_generator'));
app.use('/api/gap-no-marketplace-for-community-contributed-flows', require('./routes/gap_no_marketplace_for_community_contributed_flows'));
