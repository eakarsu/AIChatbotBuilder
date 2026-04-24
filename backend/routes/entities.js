const router = require('express').Router();
const pool = require('../db');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT e.*, c.name as chatbot_name FROM entities e LEFT JOIN chatbots c ON e.chatbot_id = c.id ORDER BY e.created_at DESC');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT e.*, c.name as chatbot_name FROM entities e LEFT JOIN chatbots c ON e.chatbot_id = c.id WHERE e.id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const { chatbot_id, name, type, values, description } = req.body;
    const result = await pool.query(
      'INSERT INTO entities (chatbot_id, name, type, values, description) VALUES ($1,$2,$3,$4,$5) RETURNING *',
      [chatbot_id, name, type, JSON.stringify(values || []), description]
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { chatbot_id, name, type, values, description, status } = req.body;
    const result = await pool.query(
      'UPDATE entities SET chatbot_id=$1, name=$2, type=$3, values=$4, description=$5, status=$6 WHERE id=$7 RETURNING *',
      [chatbot_id, name, type, JSON.stringify(values || []), description, status, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    await pool.query('DELETE FROM entities WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
