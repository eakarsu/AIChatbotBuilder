/**
 * Reporting & export subsystem (audit gap: missing reporting).
 *
 *   GET /api/reports/summary                - high-level counts across major tables
 *   GET /api/reports/conversations.csv      - CSV export of conversations
 *   GET /api/reports/analytics.json         - dashboard payload (aggregated)
 *
 * Each route is defensive: if the underlying table is missing, it returns an
 * empty payload rather than failing.
 */

const router = require('express').Router();
const pool = require('../db');
const auth = require('../middleware/auth');

async function safeCount(table) {
  try {
    const r = await pool.query(`SELECT COUNT(*)::int AS c FROM ${table}`);
    return r.rows[0].c;
  } catch (_) { return 0; }
}

function toCsvCell(v) {
  if (v === null || v === undefined) return '';
  const s = String(v).replace(/"/g, '""');
  return /[",\n]/.test(s) ? `"${s}"` : s;
}

router.get('/summary', auth, async (req, res) => {
  try {
    const [chatbots, conversations, intents, contacts, knowledge_bases, webhooks] = await Promise.all([
      safeCount('chatbots'),
      safeCount('conversations'),
      safeCount('intents'),
      safeCount('contacts'),
      safeCount('knowledge_bases'),
      safeCount('webhooks')
    ]);
    res.json({ chatbots, conversations, intents, contacts, knowledge_bases, webhooks });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/conversations.csv', auth, async (req, res) => {
  try {
    let rows = [];
    try {
      const r = await pool.query('SELECT * FROM conversations ORDER BY created_at DESC LIMIT 5000');
      rows = r.rows;
    } catch (_) { rows = []; }
    const headers = rows.length ? Object.keys(rows[0]) : ['id', 'created_at'];
    const lines = [headers.join(',')];
    for (const row of rows) {
      lines.push(headers.map(h => toCsvCell(row[h])).join(','));
    }
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="conversations.csv"');
    res.send(lines.join('\n'));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/analytics.json', auth, async (req, res) => {
  try {
    const summary = await Promise.all([
      safeCount('chatbots'),
      safeCount('conversations'),
      safeCount('intents'),
      safeCount('webhooks')
    ]);
    res.json({
      generated_at: new Date().toISOString(),
      chatbots: summary[0],
      conversations: summary[1],
      intents: summary[2],
      webhooks: summary[3]
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
