const router = require('express').Router();
const pool = require('../db');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT co.*, c.name as chatbot_name FROM contacts co LEFT JOIN chatbots c ON co.chatbot_id = c.id ORDER BY co.last_seen DESC');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT co.*, c.name as chatbot_name FROM contacts co LEFT JOIN chatbots c ON co.chatbot_id = c.id WHERE co.id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const { chatbot_id, name, email, phone, channel, tags, custom_fields } = req.body;
    const result = await pool.query(
      'INSERT INTO contacts (chatbot_id, name, email, phone, channel, tags, custom_fields) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *',
      [chatbot_id, name, email, phone, channel || 'web', JSON.stringify(tags || []), JSON.stringify(custom_fields || {})]
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { chatbot_id, name, email, phone, channel, tags, custom_fields, status } = req.body;
    const result = await pool.query(
      'UPDATE contacts SET chatbot_id=$1, name=$2, email=$3, phone=$4, channel=$5, tags=$6, custom_fields=$7, status=$8 WHERE id=$9 RETURNING *',
      [chatbot_id, name, email, phone, channel, JSON.stringify(tags || []), JSON.stringify(custom_fields || {}), status, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    await pool.query('DELETE FROM contacts WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
