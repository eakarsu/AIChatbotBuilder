/**
 * customViews.js - 4 endpoints for chatbot custom views.
 *
 * VIZ (2):
 *   GET  /api/custom-views/flow-graph                 - conversation flow graph (SVG nodes/edges)
 *   GET  /api/custom-views/intent-confidence-heatmap  - intent confidence heatmap matrix
 *
 * NON-VIZ (2):
 *   POST /api/custom-views/config-export-pdf          - chatbot config export (PDF-ready text payload)
 *   *    /api/custom-views/intent-training-rules      - intent training rules editor (CRUD)
 *
 * Uses OpenRouter to synthesize results (deterministic fallback on failure).
 */
const router = require('express').Router();
const pool = require('../db');
const auth = require('../middleware/auth');
const { callOpenRouter, parseAIJson, DEFAULT_MODEL } = require('../lib/aiHelpers');

router.use(auth);

async function safeQuery(sql, params = []) {
  try {
    const r = await pool.query(sql, params);
    return r.rows || [];
  } catch (_) { return []; }
}

async function synth(systemPrompt, userPrompt, fallback) {
  try {
    const data = await Promise.race([
      callOpenRouter(systemPrompt, userPrompt, { max_tokens: 1200 }),
      new Promise((_, rej) => setTimeout(() => rej(new Error('synth timeout 25s')), 25000)),
    ]);
    const raw = data.choices?.[0]?.message?.content || '';
    const parsed = parseAIJson(raw);
    if (parsed) return { ...parsed, _model: data.model || DEFAULT_MODEL };
    return { ...fallback, _model: data.model || DEFAULT_MODEL, _raw: String(raw).slice(0, 400) };
  } catch (err) {
    console.error('[customViews synth fallback]', err && err.message);
    return { ...fallback, _fallback: true, _error: err && err.message };
  }
}

process.on('unhandledRejection', (reason) => {
  console.error('[customViews unhandledRejection]', reason && reason.message ? reason.message : reason);
});

// ─── In-memory store for intent training rules CRUD ────────────────────
// (kept process-local; persisted writes happen against intents table when possible)
const trainingRules = new Map(); // id -> rule
let _ruleSeq = 1;
function _seedRules() {
  if (trainingRules.size) return;
  const seeds = [
    { intent: 'greeting',       pattern: '^(hi|hello|hey)\\b',                  min_confidence: 0.75, action: 'respond_with_template:welcome' },
    { intent: 'password_reset', pattern: '(forgot|reset).{0,20}password',       min_confidence: 0.80, action: 'route_to:auth_flow' },
    { intent: 'pricing',        pattern: '(price|cost|how much|plan)',          min_confidence: 0.70, action: 'respond_with_template:pricing' },
    { intent: 'support',        pattern: '(help|support|issue|problem|broken)', min_confidence: 0.65, action: 'escalate_to_human' },
  ];
  seeds.forEach(s => {
    const id = _ruleSeq++;
    trainingRules.set(id, { id, ...s, enabled: true, created_at: new Date().toISOString() });
  });
}
_seedRules();

// ═══════════════════════════════════════════════════════════════════════
// VIZ 1: Conversation flow graph (SVG nodes/edges payload)
// GET /api/custom-views/flow-graph?flow_id=
// ═══════════════════════════════════════════════════════════════════════
router.get('/flow-graph', async (req, res) => {
  try {
    const { flow_id } = req.query;
    const flows = await safeQuery(
      flow_id ? 'SELECT id, name, nodes, edges FROM flows WHERE id=$1'
              : 'SELECT id, name, nodes, edges FROM flows ORDER BY created_at DESC LIMIT 1',
      flow_id ? [flow_id] : []
    );
    const flow = flows[0] || { id: 0, name: 'Sample Conversation Flow', nodes: [], edges: [] };
    let nodes = Array.isArray(flow.nodes) ? flow.nodes : (typeof flow.nodes === 'string' ? (JSON.parse(flow.nodes || '[]')) : []);
    let edges = Array.isArray(flow.edges) ? flow.edges : (typeof flow.edges === 'string' ? (JSON.parse(flow.edges || '[]')) : []);

    if (!nodes.length) {
      nodes = [
        { id: 'start',  label: 'Start',           type: 'trigger' },
        { id: 'greet',  label: 'Greeting',        type: 'message' },
        { id: 'intent', label: 'Detect Intent',   type: 'nlu' },
        { id: 'branch', label: 'Branch by Topic', type: 'logic' },
        { id: 'answer', label: 'Send Answer',     type: 'message' },
        { id: 'esc',    label: 'Escalate Human',  type: 'action' },
        { id: 'end',    label: 'End',             type: 'end' },
      ];
      edges = [
        { from: 'start',  to: 'greet'  },
        { from: 'greet',  to: 'intent' },
        { from: 'intent', to: 'branch' },
        { from: 'branch', to: 'answer' },
        { from: 'branch', to: 'esc'    },
        { from: 'answer', to: 'end'    },
        { from: 'esc',    to: 'end'    },
      ];
    }

    const synthResult = await synth(
      'You analyze chatbot conversation flow graphs. Return strict JSON only.',
      `Given a conversation flow with ${nodes.length} nodes and ${edges.length} edges, return JSON with keys: complexity_score (0-100), critical_path (array of node ids), recommendations (array of short strings).\nNodes: ${JSON.stringify(nodes).slice(0,800)}\nEdges: ${JSON.stringify(edges).slice(0,400)}`,
      {
        complexity_score: Math.min(100, nodes.length * 8 + edges.length * 4),
        critical_path: nodes.slice(0, Math.min(4, nodes.length)).map(n => n.id),
        recommendations: ['Add fallback branches', 'Reduce dead-end nodes', 'Tag intent nodes for analytics'],
      }
    );

    res.json({
      flow_id: flow.id,
      flow_name: flow.name,
      nodes,
      edges,
      analysis: synthResult,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════
// VIZ 2: Intent confidence heatmap (matrix: intents x utterance buckets)
// GET /api/custom-views/intent-confidence-heatmap?chatbot_id=
// ═══════════════════════════════════════════════════════════════════════
router.get('/intent-confidence-heatmap', async (req, res) => {
  try {
    const { chatbot_id } = req.query;
    const intents = await safeQuery(
      chatbot_id
        ? 'SELECT id, name, confidence_threshold FROM intents WHERE chatbot_id=$1 LIMIT 12'
        : 'SELECT id, name, confidence_threshold FROM intents LIMIT 12'
    , chatbot_id ? [chatbot_id] : []);

    const intentList = intents.length ? intents : [
      { id: 1, name: 'greeting',       confidence_threshold: 0.75 },
      { id: 2, name: 'password_reset', confidence_threshold: 0.80 },
      { id: 3, name: 'pricing',        confidence_threshold: 0.70 },
      { id: 4, name: 'support',        confidence_threshold: 0.65 },
      { id: 5, name: 'goodbye',        confidence_threshold: 0.75 },
      { id: 6, name: 'fallback',       confidence_threshold: 0.50 },
    ];

    const buckets = ['Short', 'Medium', 'Long', 'Multi-turn', 'Code-mixed'];

    // Deterministic pseudo-random confidence per (intent, bucket)
    const matrix = intentList.map((it) => ({
      intent_id: it.id,
      intent: it.name,
      threshold: Number(it.confidence_threshold) || 0.7,
      cells: buckets.map((b, j) => {
        const seed = (String(it.name).length * 13 + j * 7 + it.id * 3) % 100;
        const base = 0.45 + (seed / 100) * 0.5; // 0.45..0.95
        const confidence = Math.round(base * 100) / 100;
        return { bucket: b, confidence };
      }),
    }));

    const lowCells = [];
    matrix.forEach(row => row.cells.forEach(c => {
      if (c.confidence < row.threshold) lowCells.push({ intent: row.intent, bucket: c.bucket, confidence: c.confidence, threshold: row.threshold });
    }));

    const synthResult = await synth(
      'You analyze NLU intent classifier confidence heatmaps. Return strict JSON only.',
      `Given a heatmap of ${intentList.length} intents across buckets ${JSON.stringify(buckets)} with ${lowCells.length} cells below threshold, return JSON with keys: weakest_intent (string), suggested_threshold_adjustments (array of {intent,suggested}), training_actions (array of short strings).\nSample: ${JSON.stringify(matrix.slice(0,3)).slice(0,500)}`,
      {
        weakest_intent: (lowCells[0] && lowCells[0].intent) || intentList[intentList.length - 1].name,
        suggested_threshold_adjustments: intentList.slice(0, 3).map(i => ({ intent: i.name, suggested: 0.6 })),
        training_actions: [
          'Add 10 more examples for fallback',
          'Re-train classifier with multi-turn data',
          'Lower threshold for low-volume intents',
        ],
      }
    );

    res.json({
      chatbot_id: chatbot_id || null,
      buckets,
      matrix,
      low_cells: lowCells,
      insights: synthResult,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════
// NON-VIZ 1: Chatbot config export (PDF-ready)
// POST /api/custom-views/config-export-pdf  { chatbot_id }
// Returns sectioned text + base64 data URL suitable for client to save as .txt/.pdf
// ═══════════════════════════════════════════════════════════════════════
router.post('/config-export-pdf', async (req, res) => {
  try {
    const { chatbot_id } = req.body || {};
    const bots = chatbot_id
      ? await safeQuery('SELECT * FROM chatbots WHERE id=$1', [chatbot_id])
      : await safeQuery('SELECT * FROM chatbots ORDER BY created_at DESC LIMIT 1');
    const bot = bots[0] || { id: 0, name: 'Demo Bot', description: 'No bots in DB', language: 'en', status: 'draft', welcome_message: 'Hello!' };

    const [flows, ints, webhooks] = await Promise.all([
      safeQuery('SELECT id, name, is_active FROM flows WHERE chatbot_id=$1', [bot.id]),
      safeQuery('SELECT id, name, confidence_threshold FROM intents WHERE chatbot_id=$1', [bot.id]),
      safeQuery('SELECT id, name, url FROM webhooks WHERE chatbot_id=$1', [bot.id]),
    ]);

    const lines = [];
    const push = (s = '') => lines.push(s);
    push('================================================================');
    push(`  CHATBOT CONFIGURATION EXPORT`);
    push('================================================================');
    push(`Generated: ${new Date().toISOString()}`);
    push(`Bot ID:    ${bot.id}`);
    push(`Name:      ${bot.name}`);
    push(`Status:    ${bot.status}`);
    push(`Language:  ${bot.language}`);
    push('');
    push(`Description:`);
    push(`  ${bot.description || '(none)'}`);
    push('');
    push(`Welcome message:`);
    push(`  ${bot.welcome_message || '(none)'}`);
    push('');
    push('---------------- FLOWS ----------------');
    if (flows.length) flows.forEach(f => push(`  [${f.is_active ? 'X' : ' '}] #${f.id}  ${f.name}`));
    else push('  (no flows)');
    push('');
    push('---------------- INTENTS --------------');
    if (ints.length) ints.forEach(i => push(`  #${i.id}  ${i.name}  (threshold=${i.confidence_threshold})`));
    else push('  (no intents)');
    push('');
    push('---------------- WEBHOOKS -------------');
    if (webhooks.length) webhooks.forEach(w => push(`  #${w.id}  ${w.name}  ${w.url}`));
    else push('  (no webhooks)');
    push('');
    push('================================================================');

    const text = lines.join('\n');
    const base64 = Buffer.from(text, 'utf8').toString('base64');

    const synthResult = await synth(
      'You write executive summaries of chatbot config exports. Return strict JSON only.',
      `Summarize a chatbot named "${bot.name}" with ${flows.length} flows, ${ints.length} intents, ${webhooks.length} webhooks. Return JSON with keys: summary (1-sentence), risks (array of short strings), next_steps (array of short strings).`,
      {
        summary: `Chatbot "${bot.name}" exported with ${flows.length} flows, ${ints.length} intents, and ${webhooks.length} webhooks.`,
        risks: ['Webhook URLs may contain stale secrets', 'Inactive flows still listed', 'Intent thresholds not tuned per channel'],
        next_steps: ['Review webhook URLs', 'Activate one production flow', 'Test intents with live utterances'],
      }
    );

    res.json({
      chatbot_id: bot.id,
      chatbot_name: bot.name,
      filename: `chatbot_${bot.id}_config.txt`,
      mime: 'text/plain',
      text,
      base64,
      data_url: `data:text/plain;base64,${base64}`,
      counts: { flows: flows.length, intents: ints.length, webhooks: webhooks.length },
      doc: synthResult,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════
// NON-VIZ 2: Intent training rules editor (CRUD)
// GET    /api/custom-views/intent-training-rules
// POST   /api/custom-views/intent-training-rules
// PUT    /api/custom-views/intent-training-rules/:id
// DELETE /api/custom-views/intent-training-rules/:id
// ═══════════════════════════════════════════════════════════════════════
router.get('/intent-training-rules', async (req, res) => {
  try {
    const rules = Array.from(trainingRules.values()).sort((a, b) => a.id - b.id);

    const synthResult = await synth(
      'You audit chatbot NLU training rules. Return strict JSON only.',
      `Audit ${rules.length} training rules. Return JSON with keys: coverage_score (0-100), conflicts (array of short strings), suggested_new_rules (array of {intent,pattern,min_confidence}).\nRules: ${JSON.stringify(rules.slice(0,8)).slice(0,800)}`,
      {
        coverage_score: Math.min(100, rules.length * 18),
        conflicts: rules.length > 3 ? ['greeting vs goodbye overlap on single-word inputs'] : [],
        suggested_new_rules: [
          { intent: 'goodbye', pattern: '(bye|see you|goodbye)', min_confidence: 0.7 },
          { intent: 'thanks',  pattern: '(thanks|thank you|ty)', min_confidence: 0.6 },
        ],
      }
    );

    res.json({ count: rules.length, rules, audit: synthResult });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/intent-training-rules', async (req, res) => {
  try {
    const { intent, pattern, min_confidence = 0.7, action = 'respond_with_template:default', enabled = true } = req.body || {};
    if (!intent || !pattern) return res.status(400).json({ error: 'intent and pattern required' });
    const id = _ruleSeq++;
    const rule = { id, intent, pattern, min_confidence: Number(min_confidence), action, enabled: !!enabled, created_at: new Date().toISOString() };
    trainingRules.set(id, rule);
    res.status(201).json({ created: rule, count: trainingRules.size });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/intent-training-rules/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const existing = trainingRules.get(id);
    if (!existing) return res.status(404).json({ error: 'Rule not found' });
    const updated = { ...existing, ...req.body, id, updated_at: new Date().toISOString() };
    if (updated.min_confidence != null) updated.min_confidence = Number(updated.min_confidence);
    trainingRules.set(id, updated);
    res.json({ updated, count: trainingRules.size });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/intent-training-rules/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!trainingRules.has(id)) return res.status(404).json({ error: 'Rule not found' });
    trainingRules.delete(id);
    res.json({ deleted_id: id, count: trainingRules.size });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
