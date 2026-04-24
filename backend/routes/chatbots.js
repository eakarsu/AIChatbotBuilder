const router = require('express').Router();
const pool = require('../db');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM chatbots ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM chatbots WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const { name, description, status, language, welcome_message } = req.body;
    const result = await pool.query(
      'INSERT INTO chatbots (user_id, name, description, status, language, welcome_message) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
      [req.user.id, name, description, status || 'draft', language || 'en', welcome_message || 'Hello! How can I help you today?']
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { name, description, status, language, welcome_message } = req.body;
    const result = await pool.query(
      'UPDATE chatbots SET name=$1, description=$2, status=$3, language=$4, welcome_message=$5, updated_at=NOW() WHERE id=$6 RETURNING *',
      [name, description, status, language, welcome_message, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    await pool.query('DELETE FROM chatbots WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
