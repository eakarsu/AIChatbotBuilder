const router = require('express').Router();
const pool = require('../db');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT f.*, c.name as chatbot_name FROM forms f LEFT JOIN chatbots c ON f.chatbot_id = c.id ORDER BY f.created_at DESC');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT f.*, c.name as chatbot_name FROM forms f LEFT JOIN chatbots c ON f.chatbot_id = c.id WHERE f.id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const { chatbot_id, name, description, fields, status } = req.body;
    const result = await pool.query(
      'INSERT INTO forms (chatbot_id, name, description, fields, status) VALUES ($1,$2,$3,$4,$5) RETURNING *',
      [chatbot_id, name, description, JSON.stringify(fields || []), status || 'active']
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { chatbot_id, name, description, fields, status, submissions_count } = req.body;
    const result = await pool.query(
      'UPDATE forms SET chatbot_id=$1, name=$2, description=$3, fields=$4, status=$5, submissions_count=$6 WHERE id=$7 RETURNING *',
      [chatbot_id, name, description, JSON.stringify(fields || []), status, submissions_count, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    await pool.query('DELETE FROM forms WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
