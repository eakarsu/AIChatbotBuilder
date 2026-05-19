const router = require('express').Router();
const pool = require('../db');
const auth = require('../middleware/auth');
const { chatbotLimiter } = require('../middleware/rateLimiter');

// ─── GET / - List all conversations (optionally scoped by chatbot_id) ────────
router.get('/', auth, async (req, res) => {
  try {
    const { chatbot_id, status, channel, page, limit } = req.query;

    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 50));
    const offset = (pageNum - 1) * limitNum;
    const usePagination = page !== undefined || limit !== undefined;

    const params = [];
    let whereClause = '';
    let paramIdx = 1;

    if (chatbot_id) {
      whereClause += ` AND conv.chatbot_id = $${paramIdx++}`;
      params.push(chatbot_id);
    }
    if (status) {
      whereClause += ` AND conv.status = $${paramIdx++}`;
      params.push(status);
    }
    if (channel) {
      whereClause += ` AND conv.channel = $${paramIdx++}`;
      params.push(channel);
    }

    const baseQuery = `SELECT conv.*, c.name as chatbot_name
                       FROM conversations conv
                       LEFT JOIN chatbots c ON conv.chatbot_id = c.id
                       WHERE 1=1 ${whereClause}`;

    if (usePagination) {
      const countResult = await pool.query(`SELECT COUNT(*) FROM conversations conv WHERE 1=1 ${whereClause}`, params);
      const total = parseInt(countResult.rows[0].count);

      params.push(limitNum, offset);
      const result = await pool.query(
        `${baseQuery} ORDER BY conv.updated_at DESC LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`,
        params
      );
      return res.json({
        conversations: result.rows,
        pagination: { page: pageNum, limit: limitNum, total, total_pages: Math.ceil(total / limitNum) },
      });
    }

    const result = await pool.query(`${baseQuery} ORDER BY conv.updated_at DESC`, params);
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── GET /:id - Get conversation with messages ────────────────────────────────
router.get('/:id', auth, async (req, res) => {
  try {
    const conv = await pool.query('SELECT conv.*, c.name as chatbot_name FROM conversations conv LEFT JOIN chatbots c ON conv.chatbot_id = c.id WHERE conv.id = $1', [req.params.id]);
    if (conv.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    const msgs = await pool.query('SELECT * FROM messages WHERE conversation_id = $1 ORDER BY created_at', [req.params.id]);
    res.json({ ...conv.rows[0], messages: msgs.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── GET /:id/messages - Paginated message history ───────────────────────────
router.get('/:id/messages', auth, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const offset = (pageNum - 1) * limitNum;

    const conv = await pool.query('SELECT id, chatbot_id FROM conversations WHERE id = $1', [req.params.id]);
    if (conv.rows.length === 0) return res.status(404).json({ error: 'Conversation not found' });

    const totalResult = await pool.query('SELECT COUNT(*) FROM messages WHERE conversation_id = $1', [req.params.id]);
    const total = parseInt(totalResult.rows[0].count);

    const msgs = await pool.query(
      'SELECT * FROM messages WHERE conversation_id = $1 ORDER BY created_at ASC LIMIT $2 OFFSET $3',
      [req.params.id, limitNum, offset]
    );

    res.json({
      conversation_id: req.params.id,
      messages: msgs.rows,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        total_pages: Math.ceil(total / limitNum),
      },
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── POST / - Create conversation ────────────────────────────────────────────
router.post('/', auth, chatbotLimiter, async (req, res) => {
  try {
    const { chatbot_id, channel, visitor_name, visitor_email } = req.body;
    const result = await pool.query(
      'INSERT INTO conversations (chatbot_id, channel, visitor_name, visitor_email) VALUES ($1,$2,$3,$4) RETURNING *',
      [chatbot_id, channel || 'web', visitor_name, visitor_email]
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── PUT /:id - Update conversation ──────────────────────────────────────────
router.put('/:id', auth, async (req, res) => {
  try {
    const { status, satisfaction_score, chatbot_id, channel, visitor_name, visitor_email } = req.body;
    const result = await pool.query(
      'UPDATE conversations SET chatbot_id=$1, channel=$2, visitor_name=$3, visitor_email=$4, status=$5, satisfaction_score=$6, updated_at=NOW() WHERE id=$7 RETURNING *',
      [chatbot_id, channel, visitor_name, visitor_email, status, satisfaction_score, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── DELETE /:id - Delete conversation ───────────────────────────────────────
router.delete('/:id', auth, async (req, res) => {
  try {
    await pool.query('DELETE FROM conversations WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── POST /:id/messages - Add message to conversation ────────────────────────
router.post('/:id/messages', auth, chatbotLimiter, async (req, res) => {
  try {
    const { role, content } = req.body;
    const result = await pool.query(
      'INSERT INTO messages (conversation_id, role, content) VALUES ($1,$2,$3) RETURNING *',
      [req.params.id, role, content]
    );
    await pool.query('UPDATE conversations SET messages_count = messages_count + 1, updated_at = NOW() WHERE id = $1', [req.params.id]);
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
