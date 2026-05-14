/**
 * AI backlog endpoints (apply pass 4).
 *
 * Adds the previously-deferred mechanical AI features:
 *   POST /api/ai/mine-intents           - propose intents/entities from conversation log batch.
 *   POST /api/ai/sentiment-escalation   - score sentiment, return escalation recommendation.
 *
 * Both reuse the shared `callOpenRouter`, `parseAIJson`, `saveAIResult`, and `aiLimiter`.
 * Returns HTTP 503 when OPENROUTER_API_KEY is missing.
 */

const router = require('express').Router();
const pool = require('../db');
const auth = require('../middleware/auth');
const { aiLimiter } = require('../middleware/rateLimiter');
const { callOpenRouter, parseAIJson, saveAIResult, DEFAULT_MODEL } = require('../lib/aiHelpers');

router.use(aiLimiter);

function noKey(res) {
  return res.status(503).json({
    error: 'AI service unavailable',
    detail: 'OPENROUTER_API_KEY is not configured. Set it in the environment to enable this endpoint.',
  });
}

// ─── Mine intents from conversation logs ─────────────────────────────────────
router.post('/mine-intents', auth, async (req, res) => {
  if (!process.env.OPENROUTER_API_KEY) return noKey(res);
  try {
    const { logs, max_intents } = req.body || {};
    let conversationText = '';
    if (Array.isArray(logs) && logs.length) {
      conversationText = logs
        .slice(0, 200)
        .map((l, i) => `[${i + 1}] ${typeof l === 'string' ? l : (l.message || l.content || JSON.stringify(l))}`)
        .join('\n');
    } else {
      try {
        const r = await pool.query(
          "SELECT content FROM conversations ORDER BY id DESC LIMIT 200"
        );
        conversationText = r.rows.map((row, i) => `[${i + 1}] ${row.content || ''}`).join('\n');
      } catch (_) { /* table absent — leave blank */ }
    }
    if (!conversationText) conversationText = '(no conversation history available)';

    const limit = Math.max(1, Math.min(parseInt(max_intents, 10) || 10, 30));

    const data = await callOpenRouter(
      'You are an NLU specialist. From raw chat logs, propose new intents and entities the bot should support.',
      `Analyze these conversation snippets and propose up to ${limit} new intents that are not yet trivially handled. ` +
      `Return ONLY JSON of the form ` +
      `{"intents":[{"name":"snake_case_name","description":"...","example_utterances":["...","..."],"suggested_entities":["..."]}],` +
      `"notes":"high-level observations"}.\n\nConversations:\n${conversationText}`
    );
    const rawText = data.choices?.[0]?.message?.content || '';
    const parsed = parseAIJson(rawText);
    const output = {
      intents: parsed?.intents || [],
      notes: parsed?.notes || '',
      raw: parsed ? undefined : rawText,
      model: data.model,
      usage: data.usage,
    };

    await saveAIResult(pool, {
      user_id: req.user?.id,
      feature: 'mine-intents',
      input: { logs_count: Array.isArray(logs) ? logs.length : 0, max_intents: limit },
      output,
      raw_text: rawText,
      model: data.model || DEFAULT_MODEL,
    });

    res.json(output);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Sentiment-triggered escalation analysis ─────────────────────────────────
router.post('/sentiment-escalation', auth, async (req, res) => {
  if (!process.env.OPENROUTER_API_KEY) return noKey(res);
  try {
    const { message, conversation_history, threshold } = req.body || {};
    if (!message) return res.status(400).json({ error: 'message is required' });

    const histText = Array.isArray(conversation_history) && conversation_history.length
      ? conversation_history
          .slice(-10)
          .map(m => `${m.role || 'user'}: ${m.content || ''}`)
          .join('\n')
      : '';

    const data = await callOpenRouter(
      'You are a customer-support sentiment analyst. Identify negative sentiment, anger, frustration, or churn risk and recommend escalation.',
      `Analyze the latest user message and decide whether human escalation is warranted.\n` +
      `Return ONLY JSON of the form ` +
      `{"sentiment":"positive|neutral|negative|very_negative","sentiment_score":-1.0..1.0,` +
      `"escalate":true|false,"reason":"...","recommended_priority":"low|medium|high|urgent",` +
      `"suggested_handoff_message":"..."}\n\n` +
      `Recent history:\n${histText || '(none)'}\n\nLatest user message: "${message}"`
    );
    const rawText = data.choices?.[0]?.message?.content || '';
    const parsed = parseAIJson(rawText) || {};

    // Apply explicit threshold logic on top of model output.
    const t = typeof threshold === 'number' ? threshold : -0.4;
    const score = typeof parsed.sentiment_score === 'number' ? parsed.sentiment_score : null;
    const thresholdEscalate = score !== null && score <= t;

    const output = {
      sentiment: parsed.sentiment || 'unknown',
      sentiment_score: score,
      escalate: !!(parsed.escalate || thresholdEscalate),
      threshold_applied: t,
      reason: parsed.reason || '',
      recommended_priority: parsed.recommended_priority || (thresholdEscalate ? 'high' : 'low'),
      suggested_handoff_message: parsed.suggested_handoff_message || '',
      raw: parsed && Object.keys(parsed).length ? undefined : rawText,
      model: data.model,
      usage: data.usage,
    };

    await saveAIResult(pool, {
      user_id: req.user?.id,
      feature: 'sentiment-escalation',
      input: { message, threshold: t },
      output,
      raw_text: rawText,
      model: data.model || DEFAULT_MODEL,
    });

    res.json(output);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
