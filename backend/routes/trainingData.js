const router = require('express').Router();
const pool = require('../db');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT td.*, c.name as chatbot_name FROM training_data td LEFT JOIN chatbots c ON td.chatbot_id = c.id ORDER BY td.created_at DESC');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT td.*, c.name as chatbot_name FROM training_data td LEFT JOIN chatbots c ON td.chatbot_id = c.id WHERE td.id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const { chatbot_id, input_text, expected_intent, expected_entities, verified } = req.body;
    const result = await pool.query(
      'INSERT INTO training_data (chatbot_id, input_text, expected_intent, expected_entities, verified) VALUES ($1,$2,$3,$4,$5) RETURNING *',
      [chatbot_id, input_text, expected_intent, JSON.stringify(expected_entities || []), verified || false]
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { chatbot_id, input_text, expected_intent, expected_entities, verified } = req.body;
    const result = await pool.query(
      'UPDATE training_data SET chatbot_id=$1, input_text=$2, expected_intent=$3, expected_entities=$4, verified=$5 WHERE id=$6 RETURNING *',
      [chatbot_id, input_text, expected_intent, JSON.stringify(expected_entities || []), verified, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    await pool.query('DELETE FROM training_data WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
