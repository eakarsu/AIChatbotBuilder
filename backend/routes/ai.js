const router = require('express').Router();
const fetch = require('node-fetch');
const pool = require('../db');
const auth = require('../middleware/auth');

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

async function callOpenRouter(messages, systemPrompt) {
  const allMessages = [];
  if (systemPrompt) allMessages.push({ role: 'system', content: systemPrompt });
  allMessages.push(...messages);

  const response = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'http://localhost:3000',
      'X-Title': 'AI Chatbot Builder',
    },
    body: JSON.stringify({
      model: process.env.OPENROUTER_MODEL || 'anthropic/claude-haiku-4.5',
      messages: allMessages,
      max_tokens: 2000,
      temperature: 0.7,
    }),
  });

  const data = await response.json();
  return data;
}

// Chat with AI
router.post('/chat', auth, async (req, res) => {
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

    const data = await callOpenRouter(messages, systemPrompt);
    res.json({
      response: data.choices?.[0]?.message?.content || 'No response generated.',
      model: data.model,
      usage: data.usage,
      raw: data,
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Generate chatbot flow suggestion
router.post('/generate-flow', auth, async (req, res) => {
  try {
    const { description } = req.body;
    const data = await callOpenRouter(
      [{ role: 'user', content: `Generate a chatbot conversation flow for: ${description}. Return a structured flow with nodes (start, message, condition, action, end) and edges connecting them. Format as JSON with "nodes" and "edges" arrays. Each node should have: id, type (start/message/condition/action/end), label, and text. Each edge should have: id, source, target, label.` }],
      'You are a chatbot flow design expert. Generate well-structured conversation flows in JSON format.'
    );
    res.json({
      suggestion: data.choices?.[0]?.message?.content || 'No suggestion generated.',
      model: data.model,
      usage: data.usage,
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Analyze conversation
router.post('/analyze-conversation', auth, async (req, res) => {
  try {
    const { conversation_id } = req.body;
    const msgs = await pool.query('SELECT role, content FROM messages WHERE conversation_id = $1 ORDER BY created_at', [conversation_id]);
    const conversationText = msgs.rows.map(m => `${m.role}: ${m.content}`).join('\n');

    const data = await callOpenRouter(
      [{ role: 'user', content: `Analyze this conversation and provide:\n1. Summary\n2. Customer sentiment\n3. Key topics discussed\n4. Resolution status\n5. Suggestions for improvement\n\nConversation:\n${conversationText}` }],
      'You are a conversation analytics expert. Provide detailed analysis of customer conversations.'
    );
    res.json({
      analysis: data.choices?.[0]?.message?.content || 'No analysis generated.',
      model: data.model,
      usage: data.usage,
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Suggest intents from text
router.post('/suggest-intents', auth, async (req, res) => {
  try {
    const { text } = req.body;
    const data = await callOpenRouter(
      [{ role: 'user', content: `Given this user message: "${text}", suggest the most likely intents and entities. Format your response with:\n1. Primary Intent\n2. Confidence Score\n3. Detected Entities\n4. Alternative Intents\n5. Suggested Response` }],
      'You are an NLU (Natural Language Understanding) expert. Analyze messages and suggest intents and entities.'
    );
    res.json({
      suggestion: data.choices?.[0]?.message?.content || 'No suggestion generated.',
      model: data.model,
      usage: data.usage,
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Generate training data
router.post('/generate-training-data', auth, async (req, res) => {
  try {
    const { intent, count } = req.body;
    const data = await callOpenRouter(
      [{ role: 'user', content: `Generate ${count || 10} diverse training examples for the intent "${intent}". Each example should be a natural user message. Return as a numbered list.` }],
      'You are a training data generation expert for chatbots. Generate diverse, natural language examples.'
    );
    res.json({
      training_data: data.choices?.[0]?.message?.content || 'No data generated.',
      model: data.model,
      usage: data.usage,
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Improve response
router.post('/improve-response', auth, async (req, res) => {
  try {
    const { current_response, intent } = req.body;
    const data = await callOpenRouter(
      [{ role: 'user', content: `Improve this chatbot response for the intent "${intent}":\n\nCurrent response: "${current_response}"\n\nProvide:\n1. Improved version\n2. Three variations\n3. Tone analysis\n4. Suggestions for personalization` }],
      'You are a chatbot response optimization expert. Improve responses to be more engaging and helpful.'
    );
    res.json({
      improvement: data.choices?.[0]?.message?.content || 'No improvement generated.',
      model: data.model,
      usage: data.usage,
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Knowledge base Q&A
router.post('/kb-query', auth, async (req, res) => {
  try {
    const { question, chatbot_id } = req.body;
    let context = '';
    if (chatbot_id) {
      const kb = await pool.query('SELECT name, content FROM knowledge_bases WHERE chatbot_id = $1 AND status = $2', [chatbot_id, 'active']);
      context = kb.rows.map(r => `[${r.name}]: ${r.content}`).filter(r => r.includes(':')).join('\n\n');
    }
    const data = await callOpenRouter(
      [{ role: 'user', content: `Based on the following knowledge base, answer: "${question}"\n\nKnowledge Base:\n${context || 'No knowledge base content available.'}` }],
      'You are a knowledge base assistant. Answer questions based on the provided context.'
    );
    res.json({
      answer: data.choices?.[0]?.message?.content || 'No answer generated.',
      model: data.model,
      usage: data.usage,
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
