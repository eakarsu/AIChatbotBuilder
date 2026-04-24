const router = require('express').Router();
const pool = require('../db');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT conv.*, c.name as chatbot_name FROM conversations conv LEFT JOIN chatbots c ON conv.chatbot_id = c.id ORDER BY conv.updated_at DESC');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const conv = await pool.query('SELECT conv.*, c.name as chatbot_name FROM conversations conv LEFT JOIN chatbots c ON conv.chatbot_id = c.id WHERE conv.id = $1', [req.params.id]);
    if (conv.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    const msgs = await pool.query('SELECT * FROM messages WHERE conversation_id = $1 ORDER BY created_at', [req.params.id]);
    res.json({ ...conv.rows[0], messages: msgs.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const { chatbot_id, channel, visitor_name, visitor_email } = req.body;
    const result = await pool.query(
      'INSERT INTO conversations (chatbot_id, channel, visitor_name, visitor_email) VALUES ($1,$2,$3,$4) RETURNING *',
      [chatbot_id, channel || 'web', visitor_name, visitor_email]
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

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

router.delete('/:id', auth, async (req, res) => {
  try {
    await pool.query('DELETE FROM conversations WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/:id/messages', auth, async (req, res) => {
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
