const router = require('express').Router();
const pool = require('../db');
const auth = require('../middleware/auth');

// ─── GET / - List all intents ─────────────────────────────────────────────────
router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT i.*, c.name as chatbot_name FROM intents i LEFT JOIN chatbots c ON i.chatbot_id = c.id ORDER BY i.created_at DESC');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── GET /low-confidence - Intents with avg accuracy < 70% ───────────────────
router.get('/low-confidence', auth, async (req, res) => {
  try {
    // Get intents that have feedback and average accuracy below 70%
    const result = await pool.query(`
      SELECT
        i.*,
        c.name as chatbot_name,
        COUNT(f.id) as total_feedback,
        COUNT(f.id) FILTER (WHERE f.was_correct = true) as correct_count,
        ROUND(
          (COUNT(f.id) FILTER (WHERE f.was_correct = true)::decimal /
          NULLIF(COUNT(f.id), 0)) * 100, 2
        ) as accuracy_pct
      FROM intents i
      LEFT JOIN chatbots c ON i.chatbot_id = c.id
      LEFT JOIN intent_feedback f ON f.intent_id = i.id
      GROUP BY i.id, c.name
      HAVING
        COUNT(f.id) > 0
        AND (
          COUNT(f.id) FILTER (WHERE f.was_correct = true)::decimal /
          NULLIF(COUNT(f.id), 0)
        ) < 0.70
      ORDER BY accuracy_pct ASC
    `);
    res.json({
      low_confidence_intents: result.rows,
      count: result.rows.length,
      threshold: '70%',
    });
  } catch (err) {
    // If intent_feedback table doesn't exist yet, return empty
    if (err.message.includes('relation "intent_feedback" does not exist')) {
      return res.json({ low_confidence_intents: [], count: 0, threshold: '70%', note: 'No feedback data yet.' });
    }
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /:id - Get single intent ─────────────────────────────────────────────
router.get('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT i.*, c.name as chatbot_name FROM intents i LEFT JOIN chatbots c ON i.chatbot_id = c.id WHERE i.id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── POST / - Create intent ───────────────────────────────────────────────────
router.post('/', auth, async (req, res) => {
  try {
    const { chatbot_id, name, description, examples, confidence_threshold } = req.body;
    const result = await pool.query(
      'INSERT INTO intents (chatbot_id, name, description, examples, confidence_threshold) VALUES ($1,$2,$3,$4,$5) RETURNING *',
      [chatbot_id, name, description, JSON.stringify(examples || []), confidence_threshold || 0.7]
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── PUT /:id - Update intent ─────────────────────────────────────────────────
router.put('/:id', auth, async (req, res) => {
  try {
    const { chatbot_id, name, description, examples, confidence_threshold, status } = req.body;
    const result = await pool.query(
      'UPDATE intents SET chatbot_id=$1, name=$2, description=$3, examples=$4, confidence_threshold=$5, status=$6 WHERE id=$7 RETURNING *',
      [chatbot_id, name, description, JSON.stringify(examples || []), confidence_threshold, status, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── DELETE /:id - Delete intent ──────────────────────────────────────────────
router.delete('/:id', auth, async (req, res) => {
  try {
    await pool.query('DELETE FROM intents WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── POST /:id/feedback - Track intent accuracy ───────────────────────────────
router.post('/:id/feedback', auth, async (req, res) => {
  try {
    const { was_correct, user_message, matched_response } = req.body;

    if (was_correct === undefined || was_correct === null) {
      return res.status(400).json({ error: 'was_correct (boolean) is required.' });
    }

    // Ensure the intent exists
    const intentCheck = await pool.query('SELECT id, name FROM intents WHERE id = $1', [req.params.id]);
    if (intentCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Intent not found.' });
    }

    // Create the intent_feedback table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS intent_feedback (
        id SERIAL PRIMARY KEY,
        intent_id INTEGER NOT NULL,
        was_correct BOOLEAN NOT NULL,
        user_message TEXT,
        matched_response TEXT,
        submitted_by INTEGER,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    const result = await pool.query(
      `INSERT INTO intent_feedback (intent_id, was_correct, user_message, matched_response, submitted_by, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW()) RETURNING *`,
      [req.params.id, was_correct, user_message || null, matched_response || null, req.user?.id || null]
    );

    // Get updated accuracy stats for this intent
    const stats = await pool.query(`
      SELECT
        COUNT(*) as total_feedback,
        COUNT(*) FILTER (WHERE was_correct = true) as correct_count,
        ROUND(
          (COUNT(*) FILTER (WHERE was_correct = true)::decimal / NULLIF(COUNT(*), 0)) * 100, 2
        ) as accuracy_pct
      FROM intent_feedback WHERE intent_id = $1
    `, [req.params.id]);

    res.status(201).json({
      feedback: result.rows[0],
      intent: intentCheck.rows[0],
      accuracy_stats: stats.rows[0],
    });
  } catch (err) {
    console.error('intent feedback error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
