const router = require('express').Router();
const pool = require('../db');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT w.*, c.name as chatbot_name FROM webhooks w LEFT JOIN chatbots c ON w.chatbot_id = c.id ORDER BY w.created_at DESC');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT w.*, c.name as chatbot_name FROM webhooks w LEFT JOIN chatbots c ON w.chatbot_id = c.id WHERE w.id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const { chatbot_id, name, url, method, headers, events, status } = req.body;
    const result = await pool.query(
      'INSERT INTO webhooks (chatbot_id, name, url, method, headers, events, status) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *',
      [chatbot_id, name, url, method || 'POST', JSON.stringify(headers || {}), JSON.stringify(events || []), status || 'active']
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { chatbot_id, name, url, method, headers, events, status } = req.body;
    const result = await pool.query(
      'UPDATE webhooks SET chatbot_id=$1, name=$2, url=$3, method=$4, headers=$5, events=$6, status=$7 WHERE id=$8 RETURNING *',
      [chatbot_id, name, url, method, JSON.stringify(headers || {}), JSON.stringify(events || []), status, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    await pool.query('DELETE FROM webhooks WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
