const router = require('express').Router();
const pool = require('../db');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT qr.*, c.name as chatbot_name FROM quick_replies qr LEFT JOIN chatbots c ON qr.chatbot_id = c.id ORDER BY qr.sort_order ASC');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT qr.*, c.name as chatbot_name FROM quick_replies qr LEFT JOIN chatbots c ON qr.chatbot_id = c.id WHERE qr.id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const { chatbot_id, name, text, type, payload, category, sort_order } = req.body;
    const result = await pool.query(
      'INSERT INTO quick_replies (chatbot_id, name, text, type, payload, category, sort_order) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *',
      [chatbot_id, name, text, type || 'text', JSON.stringify(payload || {}), category, sort_order || 0]
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { chatbot_id, name, text, type, payload, category, sort_order, status } = req.body;
    const result = await pool.query(
      'UPDATE quick_replies SET chatbot_id=$1, name=$2, text=$3, type=$4, payload=$5, category=$6, sort_order=$7, status=$8 WHERE id=$9 RETURNING *',
      [chatbot_id, name, text, type, JSON.stringify(payload || {}), category, sort_order, status, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    await pool.query('DELETE FROM quick_replies WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
