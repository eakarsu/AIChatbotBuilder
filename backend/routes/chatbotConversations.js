/**
 * Chatbot-scoped conversation routes.
 * GET /api/chatbots/:id/conversations  - List conversations for this chatbot (paginated)
 */
const router = require('express').Router();
const pool = require('../db');
const auth = require('../middleware/auth');

// ─── GET /:id/conversations - List conversations for a chatbot ────────────────
router.get('/:id/conversations', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 20, status, channel } = req.query;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const offset = (pageNum - 1) * limitNum;

    // Build dynamic filters
    const params = [id];
    let whereExtra = '';
    let paramIdx = 2;

    if (status) {
      params.push(status);
      whereExtra += ` AND conv.status = $${paramIdx++}`;
    }
    if (channel) {
      params.push(channel);
      whereExtra += ` AND conv.channel = $${paramIdx++}`;
    }

    const totalResult = await pool.query(
      `SELECT COUNT(*) FROM conversations conv WHERE conv.chatbot_id = $1 ${whereExtra}`,
      params
    );
    const total = parseInt(totalResult.rows[0].count);

    params.push(limitNum);
    params.push(offset);

    const result = await pool.query(
      `SELECT conv.*
       FROM conversations conv
       WHERE conv.chatbot_id = $1 ${whereExtra}
       ORDER BY conv.updated_at DESC
       LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`,
      params
    );

    res.json({
      chatbot_id: id,
      conversations: result.rows,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        total_pages: Math.ceil(total / limitNum),
      },
    });
  } catch (err) {
    console.error('chatbot conversations error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
