/**
 * A/B Testing for chatbot responses.
 * Allows creating tests with variant A and B responses,
 * randomly assigns users to variants, and tracks performance.
 */
const router = require('express').Router();
const pool = require('../db');
const auth = require('../middleware/auth');

// Ensure ab_tests table exists
async function ensureTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS ab_tests (
      id SERIAL PRIMARY KEY,
      chatbot_id INTEGER,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      intent_trigger VARCHAR(255),
      variant_a JSONB NOT NULL DEFAULT '{}',
      variant_b JSONB NOT NULL DEFAULT '{}',
      status VARCHAR(50) DEFAULT 'active',
      traffic_split_pct INTEGER DEFAULT 50,
      created_by INTEGER,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS ab_test_results (
      id SERIAL PRIMARY KEY,
      test_id INTEGER NOT NULL,
      variant CHAR(1) NOT NULL CHECK (variant IN ('A', 'B')),
      conversation_id INTEGER,
      resolved BOOLEAN DEFAULT FALSE,
      satisfaction_score NUMERIC(3,2),
      turns_to_resolution INTEGER,
      user_feedback TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);
}

// ─── GET / - List all A/B tests ───────────────────────────────────────────────
router.get('/', auth, async (req, res) => {
  try {
    await ensureTable();
    const result = await pool.query(`
      SELECT t.*, c.name as chatbot_name
      FROM ab_tests t
      LEFT JOIN chatbots c ON t.chatbot_id = c.id
      ORDER BY t.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── POST / - Create A/B test ─────────────────────────────────────────────────
router.post('/', auth, async (req, res) => {
  try {
    await ensureTable();
    const {
      chatbot_id,
      name,
      description,
      intent_trigger,
      variant_a,
      variant_b,
      traffic_split_pct,
    } = req.body;

    if (!name || !variant_a || !variant_b) {
      return res.status(400).json({ error: 'name, variant_a, and variant_b are required.' });
    }

    const split = parseInt(traffic_split_pct) || 50;
    if (split < 1 || split > 99) {
      return res.status(400).json({ error: 'traffic_split_pct must be between 1 and 99.' });
    }

    const result = await pool.query(`
      INSERT INTO ab_tests
        (chatbot_id, name, description, intent_trigger, variant_a, variant_b, traffic_split_pct, created_by, created_at, updated_at)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,NOW(),NOW())
      RETURNING *
    `, [
      chatbot_id || null,
      name,
      description || null,
      intent_trigger || null,
      JSON.stringify(variant_a),
      JSON.stringify(variant_b),
      split,
      req.user?.id || null,
    ]);

    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── GET /:id - Get single test ───────────────────────────────────────────────
router.get('/:id', auth, async (req, res) => {
  try {
    await ensureTable();
    const result = await pool.query(`
      SELECT t.*, c.name as chatbot_name
      FROM ab_tests t
      LEFT JOIN chatbots c ON t.chatbot_id = c.id
      WHERE t.id = $1
    `, [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'A/B test not found.' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── GET /:id/results - Compare resolution rate, user satisfaction ─────────────
router.get('/:id/results', auth, async (req, res) => {
  try {
    await ensureTable();

    const testResult = await pool.query('SELECT * FROM ab_tests WHERE id = $1', [req.params.id]);
    if (testResult.rows.length === 0) return res.status(404).json({ error: 'A/B test not found.' });
    const test = testResult.rows[0];

    const variantStats = await pool.query(`
      SELECT
        variant,
        COUNT(*) as total_interactions,
        COUNT(*) FILTER (WHERE resolved = true) as resolved_count,
        AVG(satisfaction_score) FILTER (WHERE satisfaction_score IS NOT NULL) as avg_satisfaction,
        AVG(turns_to_resolution) FILTER (WHERE turns_to_resolution IS NOT NULL) as avg_turns,
        ROUND(
          COUNT(*) FILTER (WHERE resolved = true)::decimal / NULLIF(COUNT(*), 0) * 100, 2
        ) as resolution_rate_pct
      FROM ab_test_results
      WHERE test_id = $1
      GROUP BY variant
    `, [req.params.id]);

    const statsMap = {};
    for (const row of variantStats.rows) {
      statsMap[row.variant] = row;
    }

    const variantA = statsMap['A'] || { total_interactions: 0, resolved_count: 0, resolution_rate_pct: 0 };
    const variantB = statsMap['B'] || { total_interactions: 0, resolved_count: 0, resolution_rate_pct: 0 };

    // Determine winner
    let winner = null;
    const rateA = parseFloat(variantA.resolution_rate_pct) || 0;
    const rateB = parseFloat(variantB.resolution_rate_pct) || 0;
    if (rateA > rateB + 5) winner = 'A';
    else if (rateB > rateA + 5) winner = 'B';
    else winner = 'inconclusive (< 5% difference)';

    res.json({
      test: { id: test.id, name: test.name, status: test.status, traffic_split_pct: test.traffic_split_pct },
      results: {
        variant_a: { ...variantA, config: test.variant_a },
        variant_b: { ...variantB, config: test.variant_b },
      },
      analysis: {
        winner,
        resolution_rate_diff_pct: (rateB - rateA).toFixed(2),
        recommendation: winner === 'A'
          ? 'Variant A shows better resolution rate. Consider deploying it.'
          : winner === 'B'
            ? 'Variant B shows better resolution rate. Consider deploying it.'
            : 'Not enough difference to determine a winner. Continue testing.',
      },
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── POST /:id/record - Record a test interaction result ──────────────────────
router.post('/:id/record', auth, async (req, res) => {
  try {
    await ensureTable();
    const { variant, conversation_id, resolved, satisfaction_score, turns_to_resolution, user_feedback } = req.body;

    if (!variant || !['A', 'B'].includes(variant)) {
      return res.status(400).json({ error: 'variant must be "A" or "B".' });
    }

    const result = await pool.query(`
      INSERT INTO ab_test_results (test_id, variant, conversation_id, resolved, satisfaction_score, turns_to_resolution, user_feedback)
      VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *
    `, [req.params.id, variant, conversation_id || null, resolved || false, satisfaction_score || null, turns_to_resolution || null, user_feedback || null]);

    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── PUT /:id - Update test ───────────────────────────────────────────────────
router.put('/:id', auth, async (req, res) => {
  try {
    await ensureTable();
    const { name, description, status, traffic_split_pct } = req.body;
    const result = await pool.query(`
      UPDATE ab_tests SET name=$1, description=$2, status=$3, traffic_split_pct=$4, updated_at=NOW()
      WHERE id=$5 RETURNING *
    `, [name, description, status, traffic_split_pct, req.params.id]);
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── DELETE /:id - Delete test ────────────────────────────────────────────────
router.delete('/:id', auth, async (req, res) => {
  try {
    await ensureTable();
    await pool.query('DELETE FROM ab_test_results WHERE test_id = $1', [req.params.id]);
    await pool.query('DELETE FROM ab_tests WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
