const router = require('express').Router();
const pool = require('../db');
const auth = require('../middleware/auth');
const { aiLimiter, chatbotLimiter } = require('../middleware/rateLimiter');
const { callOpenRouter, parseAIJson, saveAIResult, DEFAULT_MODEL } = require('../lib/aiHelpers');

// ─── Response Validation Pipeline ────────────────────────────────────────────
const PROFANITY_PATTERNS = [
  /\b(fuck|shit|ass|bitch|cunt|bastard|damn|hell)\b/gi,
];
const PII_PATTERNS = [
  { label: 'email', pattern: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, replacement: '[EMAIL REDACTED]' },
  { label: 'phone', pattern: /(\+?\d[\d\s\-().]{7,}\d)/g, replacement: '[PHONE REDACTED]' },
  { label: 'ssn', pattern: /\b\d{3}[-\s]?\d{2}[-\s]?\d{4}\b/g, replacement: '[SSN REDACTED]' },
  { label: 'credit_card', pattern: /\b(?:\d[ -]?){13,16}\b/g, replacement: '[CC REDACTED]' },
];
const HARMFUL_KEYWORDS = ['kill yourself', 'commit suicide', 'self harm', 'bomb', 'attack', 'weapon instructions'];

function validateAndSanitizeResponse(text) {
  const flags = [];
  let sanitized = text;

  for (const pattern of PROFANITY_PATTERNS) {
    if (pattern.test(sanitized)) {
      flags.push('profanity');
      sanitized = sanitized.replace(pattern, '[FILTERED]');
    }
  }

  for (const { label, pattern, replacement } of PII_PATTERNS) {
    if (pattern.test(sanitized)) {
      flags.push(`pii:${label}`);
      sanitized = sanitized.replace(pattern, replacement);
    }
  }

  const lowerText = sanitized.toLowerCase();
  for (const keyword of HARMFUL_KEYWORDS) {
    if (lowerText.includes(keyword)) {
      flags.push('harmful_content');
      sanitized = 'I\'m sorry, I cannot assist with that request.';
      break;
    }
  }

  return { sanitized, flags, wasSanitized: flags.length > 0 };
}

function parseConfidenceFromSuggestion(text) {
  const match = text.match(/confidence[^:]*:\s*([0-9.]+)/i);
  if (match) return parseFloat(match[1]);
  const pctMatch = text.match(/([0-9]+(?:\.[0-9]+)?)%/);
  if (pctMatch) return parseFloat(pctMatch[1]) / 100;
  return null;
}

// Apply aiLimiter to all routes in this file
router.use(aiLimiter);

// ─── Chat with AI ─────────────────────────────────────────────────────────────
router.post('/chat', auth, chatbotLimiter, async (req, res) => {
  try {
    const { message, chatbot_id, conversation_history } = req.body;

    let systemPrompt = 'You are a helpful AI chatbot assistant. Be concise and friendly.';
    if (chatbot_id) {
      const bot = await pool.query('SELECT * FROM chatbots WHERE id = $1', [chatbot_id]);
      if (bot.rows.length > 0) {
        systemPrompt = `You are "${bot.rows[0].name}" - ${bot.rows[0].description}. ${bot.rows[0].welcome_message || ''}`;
      }
      const kb = await pool.query('SELECT content FROM knowledge_bases WHERE chatbot_id = $1 AND status = $2', [chatbot_id, 'active']);
      if (kb.rows.length > 0) {
        const kbContent = kb.rows.map(r => r.content).filter(Boolean).join('\n\n');
        if (kbContent) systemPrompt += `\n\nKnowledge base context:\n${kbContent}`;
      }
    }

    const messages = conversation_history || [];
    messages.push({ role: 'user', content: message });

    const data = await callOpenRouter(systemPrompt, messages);
    const rawResponse = data.choices?.[0]?.message?.content || 'No response generated.';

    const { sanitized, flags, wasSanitized } = validateAndSanitizeResponse(rawResponse);

    const output = {
      response: sanitized,
      model: data.model,
      usage: data.usage,
      validation: { flags, was_sanitized: wasSanitized },
    };

    await saveAIResult(pool, {
      user_id: req.user?.id,
      feature: 'chat',
      input: { message, chatbot_id },
      output,
      raw_text: rawResponse,
      model: data.model || DEFAULT_MODEL,
    });

    res.json(output);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── Generate chatbot flow suggestion ────────────────────────────────────────
router.post('/generate-flow', auth, async (req, res) => {
  try {
    const { description } = req.body;
    const data = await callOpenRouter(
      'You are a chatbot flow design expert. Generate well-structured conversation flows in JSON format.',
      `Generate a chatbot conversation flow for: ${description}. Return a structured flow with nodes (start, message, condition, action, end) and edges connecting them. Format as JSON with "nodes" and "edges" arrays. Each node should have: id, type (start/message/condition/action/end), label, and text. Each edge should have: id, source, target, label.`
    );
    const rawText = data.choices?.[0]?.message?.content || 'No suggestion generated.';
    const parsed = parseAIJson(rawText);
    const output = {
      suggestion: rawText,
      flow: parsed,
      model: data.model,
      usage: data.usage,
    };

    await saveAIResult(pool, {
      user_id: req.user?.id,
      feature: 'generate-flow',
      input: { description },
      output,
      raw_text: rawText,
      model: data.model || DEFAULT_MODEL,
    });

    res.json(output);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── Analyze conversation ─────────────────────────────────────────────────────
router.post('/analyze-conversation', auth, async (req, res) => {
  try {
    const { conversation_id } = req.body;
    const msgs = await pool.query('SELECT role, content FROM messages WHERE conversation_id = $1 ORDER BY created_at', [conversation_id]);
    const conversationText = msgs.rows.map(m => `${m.role}: ${m.content}`).join('\n');

    const data = await callOpenRouter(
      'You are a conversation analytics expert. Provide detailed analysis of customer conversations.',
      `Analyze this conversation and provide:\n1. Summary\n2. Customer sentiment\n3. Key topics discussed\n4. Resolution status\n5. Suggestions for improvement\n\nConversation:\n${conversationText}`
    );
    const rawText = data.choices?.[0]?.message?.content || 'No analysis generated.';
    const output = {
      analysis: rawText,
      model: data.model,
      usage: data.usage,
    };

    await saveAIResult(pool, {
      user_id: req.user?.id,
      feature: 'analyze-conversation',
      input: { conversation_id },
      output,
      raw_text: rawText,
      model: data.model || DEFAULT_MODEL,
    });

    res.json(output);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── Suggest intents with confidence thresholding ─────────────────────────────
router.post('/suggest-intents', auth, async (req, res) => {
  try {
    const { text } = req.body;
    const data = await callOpenRouter(
      'You are an NLU (Natural Language Understanding) expert. Analyze messages and suggest intents and entities.',
      `Given this user message: "${text}", suggest the most likely intents and entities. Format your response with:\n1. Primary Intent\n2. Confidence Score (a decimal between 0 and 1)\n3. Detected Entities\n4. Alternative Intents\n5. Suggested Response`
    );

    const suggestionText = data.choices?.[0]?.message?.content || 'No suggestion generated.';
    const confidence = parseConfidenceFromSuggestion(suggestionText);

    const result = {
      suggestion: suggestionText,
      model: data.model,
      usage: data.usage,
      confidence,
    };

    if (confidence !== null && confidence < 0.6) {
      result.clarifying_question = 'I\'m not entirely sure I understood your request. Could you provide more details or rephrase what you\'re looking for?';
      result.low_confidence = true;
    }

    await saveAIResult(pool, {
      user_id: req.user?.id,
      feature: 'suggest-intents',
      input: { text },
      output: result,
      raw_text: suggestionText,
      model: data.model || DEFAULT_MODEL,
    });

    res.json(result);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── Generate training data ───────────────────────────────────────────────────
router.post('/generate-training-data', auth, async (req, res) => {
  try {
    const { intent, count } = req.body;
    const data = await callOpenRouter(
      'You are a training data generation expert for chatbots. Generate diverse, natural language examples.',
      `Generate ${count || 10} diverse training examples for the intent "${intent}". Each example should be a natural user message. Return as a numbered list.`
    );
    const rawText = data.choices?.[0]?.message?.content || 'No data generated.';
    const output = {
      training_data: rawText,
      model: data.model,
      usage: data.usage,
    };

    await saveAIResult(pool, {
      user_id: req.user?.id,
      feature: 'generate-training-data',
      input: { intent, count },
      output,
      raw_text: rawText,
      model: data.model || DEFAULT_MODEL,
    });

    res.json(output);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── Improve response ─────────────────────────────────────────────────────────
router.post('/improve-response', auth, async (req, res) => {
  try {
    const { current_response, intent } = req.body;
    const data = await callOpenRouter(
      'You are a chatbot response optimization expert. Improve responses to be more engaging and helpful.',
      `Improve this chatbot response for the intent "${intent}":\n\nCurrent response: "${current_response}"\n\nProvide:\n1. Improved version\n2. Three variations\n3. Tone analysis\n4. Suggestions for personalization`
    );
    const rawText = data.choices?.[0]?.message?.content || 'No improvement generated.';
    const output = {
      improvement: rawText,
      model: data.model,
      usage: data.usage,
    };

    await saveAIResult(pool, {
      user_id: req.user?.id,
      feature: 'improve-response',
      input: { current_response, intent },
      output,
      raw_text: rawText,
      model: data.model || DEFAULT_MODEL,
    });

    res.json(output);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── Knowledge base Q&A ───────────────────────────────────────────────────────
router.post('/kb-query', auth, async (req, res) => {
  try {
    const { question, chatbot_id } = req.body;
    let context = '';
    if (chatbot_id) {
      const kb = await pool.query('SELECT name, content FROM knowledge_bases WHERE chatbot_id = $1 AND status = $2', [chatbot_id, 'active']);
      context = kb.rows.map(r => `[${r.name}]: ${r.content}`).filter(r => r.includes(':')).join('\n\n');
    }
    const data = await callOpenRouter(
      'You are a knowledge base assistant. Answer questions based on the provided context.',
      `Based on the following knowledge base, answer: "${question}"\n\nKnowledge Base:\n${context || 'No knowledge base content available.'}`
    );
    const rawText = data.choices?.[0]?.message?.content || 'No answer generated.';
    const output = {
      answer: rawText,
      model: data.model,
      usage: data.usage,
    };

    await saveAIResult(pool, {
      user_id: req.user?.id,
      feature: 'kb-query',
      input: { question, chatbot_id },
      output,
      raw_text: rawText,
      model: data.model || DEFAULT_MODEL,
    });

    res.json(output);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
