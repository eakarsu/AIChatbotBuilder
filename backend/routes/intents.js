const router = require('express').Router();
const pool = require('../db');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT i.*, c.name as chatbot_name FROM intents i LEFT JOIN chatbots c ON i.chatbot_id = c.id ORDER BY i.created_at DESC');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT i.*, c.name as chatbot_name FROM intents i LEFT JOIN chatbots c ON i.chatbot_id = c.id WHERE i.id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

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

router.delete('/:id', auth, async (req, res) => {
  try {
    await pool.query('DELETE FROM intents WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
