/**
 * New AI endpoints for AIChatbotBuilder.
 * All routes are protected by auth middleware and the aiLimiter.
 * Results persisted to ai_results JSONB.
 */
const router = require('express').Router();
const pool = require('../db');
const auth = require('../middleware/auth');
const { aiLimiter } = require('../middleware/rateLimiter');
const { callOpenRouter, parseAIJson, saveAIResult, DEFAULT_MODEL } = require('../lib/aiHelpers');

// Apply rate limiting to all routes in this file
router.use(auth, aiLimiter);

async function persist(req, feature, input, output, rawText, model) {
  await saveAIResult(pool, {
    user_id: req.user?.id,
    feature,
    input,
    output,
    raw_text: rawText,
    model: model || DEFAULT_MODEL,
  });
}

// ─── POST /api/ai/flow-visualizer ──────────────────────────────────────────────
router.post('/flow-visualizer', async (req, res) => {
  try {
    const { conversation_logs } = req.body;
    if (!conversation_logs || !Array.isArray(conversation_logs)) {
      return res.status(400).json({ error: 'conversation_logs array is required.' });
    }

    const logsText = JSON.stringify(conversation_logs, null, 2);
    const data = await callOpenRouter(
      'You are a conversation flow analytics expert. Analyze conversation paths and identify optimization opportunities. Return structured JSON.',
      `Analyze these conversation logs and provide:\n1. User path map (common paths through the conversation)\n2. Drop-off nodes (where users abandon the conversation)\n3. Bottlenecks or confusion points\n4. Suggested flow improvements\n5. Most and least used paths\n\nReturn as JSON with keys: path_map, drop_off_nodes, bottlenecks, suggestions, path_stats\n\nConversation Logs:\n${logsText}`
    );

    const rawContent = data.choices?.[0]?.message?.content || '{}';
    const analysis = parseAIJson(rawContent) || { raw: rawContent };
    const output = { analysis, model: data.model, usage: data.usage };

    await persist(req, 'flow-visualizer', { conversation_logs_count: conversation_logs.length }, output, rawContent, data.model);
    res.json(output);
  } catch (err) {
    console.error('flow-visualizer error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/ai/context-variables ───────────────────────────────────────────
router.post('/context-variables', async (req, res) => {
  try {
    const { conversation, variables_config } = req.body;
    if (!conversation) {
      return res.status(400).json({ error: 'conversation is required.' });
    }

    const configText = variables_config ? JSON.stringify(variables_config) : 'name, email, issue, phone, location';
    const convText = typeof conversation === 'string' ? conversation : JSON.stringify(conversation);

    const data = await callOpenRouter(
      'You are a context extraction expert. Extract specific variables from conversations accurately.',
      `Extract the following context variables from this conversation: ${configText}\n\nConversation:\n${convText}\n\nReturn a JSON object with each variable as a key and the extracted value (or null if not found). Include a "confidence" field (0-1) for each extraction.`
    );

    const rawContent = data.choices?.[0]?.message?.content || '{}';
    const extracted = parseAIJson(rawContent) || { raw: rawContent };
    const output = { extracted_variables: extracted, model: data.model, usage: data.usage };

    await persist(req, 'context-variables', { variables_config }, output, rawContent, data.model);
    res.json(output);
  } catch (err) {
    console.error('context-variables error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/ai/kb-relevance ─────────────────────────────────────────────────
router.post('/kb-relevance', async (req, res) => {
  try {
    const { query, kb_articles } = req.body;
    if (!query || !Array.isArray(kb_articles) || kb_articles.length === 0) {
      return res.status(400).json({ error: 'query and kb_articles array are required.' });
    }

    const articlesText = kb_articles.map((a, i) => `Article ${i + 1} (id: ${a.id || i + 1}):\nTitle: ${a.title || 'Untitled'}\nContent: ${a.content || ''}`).join('\n\n---\n\n');

    const data = await callOpenRouter(
      'You are a knowledge base relevance expert. Rank articles by how well they answer a user query.',
      `Given the user query: "${query}"\n\nRank the following knowledge base articles by relevance. Return the top 3 most relevant articles as JSON array with fields: id, title, relevance_score (0-1), reason.\n\nArticles:\n${articlesText}`
    );

    const rawContent = data.choices?.[0]?.message?.content || '[]';
    const ranked = parseAIJson(rawContent) || [];
    const top = Array.isArray(ranked) ? ranked.slice(0, 3) : [{ raw: rawContent }];
    const output = { top_articles: top, model: data.model, usage: data.usage };

    await persist(req, 'kb-relevance', { query, articles_count: kb_articles.length }, output, rawContent, data.model);
    res.json(output);
  } catch (err) {
    console.error('kb-relevance error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/ai/tone-analyzer ────────────────────────────────────────────────
router.post('/tone-analyzer', async (req, res) => {
  try {
    const { response_text } = req.body;
    if (!response_text) {
      return res.status(400).json({ error: 'response_text is required.' });
    }

    const data = await callOpenRouter(
      'You are a communication tone analysis expert. Analyze chatbot responses and suggest tone improvements.',
      `Analyze the tone of this chatbot response:\n\n"${response_text}"\n\nProvide:\n1. Primary tone classification (e.g., friendly, formal, empathetic, robotic, apologetic)\n2. Sentiment (positive/neutral/negative)\n3. Formality level (1-5)\n4. Empathy score (1-5)\n5. Clarity score (1-5)\n6. Suggested adjustments to improve tone\n7. An improved version of the response\n\nReturn as JSON with keys: tone, sentiment, formality, empathy, clarity, suggestions, improved_response`
    );

    const rawContent = data.choices?.[0]?.message?.content || '{}';
    const analysis = parseAIJson(rawContent) || { raw: rawContent };
    const output = { tone_analysis: analysis, model: data.model, usage: data.usage };

    await persist(req, 'tone-analyzer', { response_text }, output, rawContent, data.model);
    res.json(output);
  } catch (err) {
    console.error('tone-analyzer error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/ai/escalation-detector ─────────────────────────────────────────
router.post('/escalation-detector', async (req, res) => {
  try {
    const { conversation_history } = req.body;
    if (!conversation_history || !Array.isArray(conversation_history)) {
      return res.status(400).json({ error: 'conversation_history array is required.' });
    }

    const historyText = conversation_history.map(m => `${m.role || 'user'}: ${m.content}`).join('\n');

    const data = await callOpenRouter(
      'You are an escalation detection expert. Identify when conversations need human intervention based on frustration signals.',
      `Analyze this conversation for escalation signals and user frustration:\n\n${historyText}\n\nDetermine:\n1. escalation_needed (boolean)\n2. frustration_level (1-5, where 5 is extreme)\n3. escalation_triggers (list of detected triggers)\n4. sentiment_trend (improving/stable/deteriorating)\n5. context_summary (brief summary for human agent handoff)\n6. recommended_action (what the bot should do next)\n\nReturn as JSON.`
    );

    const rawContent = data.choices?.[0]?.message?.content || '{}';
    const result = parseAIJson(rawContent) || {};

    const output = {
      escalation_needed: result.escalation_needed || false,
      frustration_level: result.frustration_level || 1,
      escalation_triggers: result.escalation_triggers || [],
      sentiment_trend: result.sentiment_trend || 'stable',
      context_summary: result.context_summary || '',
      recommended_action: result.recommended_action || '',
      model: data.model,
      usage: data.usage,
    };

    await persist(req, 'escalation-detector', { messages_count: conversation_history.length }, output, rawContent, data.model);
    res.json(output);
  } catch (err) {
    console.error('escalation-detector error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
