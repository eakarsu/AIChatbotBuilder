const router = require('express').Router();
const pool = require('../db');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT b.*, c.name as chatbot_name FROM broadcasts b LEFT JOIN chatbots c ON b.chatbot_id = c.id ORDER BY b.created_at DESC');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT b.*, c.name as chatbot_name FROM broadcasts b LEFT JOIN chatbots c ON b.chatbot_id = c.id WHERE b.id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const { chatbot_id, name, message, channel, target_segment, scheduled_at, status } = req.body;
    const result = await pool.query(
      'INSERT INTO broadcasts (chatbot_id, name, message, channel, target_segment, scheduled_at, status) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *',
      [chatbot_id, name, message, channel || 'web', JSON.stringify(target_segment || {}), scheduled_at || null, status || 'draft']
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { chatbot_id, name, message, channel, target_segment, scheduled_at, status, recipients_count, delivered_count, opened_count } = req.body;
    const sent_at = status === 'sent' ? new Date() : null;
    const result = await pool.query(
      'UPDATE broadcasts SET chatbot_id=$1, name=$2, message=$3, channel=$4, target_segment=$5, scheduled_at=$6, status=$7, recipients_count=$8, delivered_count=$9, opened_count=$10, sent_at=$11 WHERE id=$12 RETURNING *',
      [chatbot_id, name, message, channel, JSON.stringify(target_segment || {}), scheduled_at, status, recipients_count || 0, delivered_count || 0, opened_count || 0, sent_at, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    await pool.query('DELETE FROM broadcasts WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
