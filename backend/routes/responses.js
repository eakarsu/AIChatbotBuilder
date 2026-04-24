const router = require('express').Router();
const pool = require('../db');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT r.*, c.name as chatbot_name FROM responses r LEFT JOIN chatbots c ON r.chatbot_id = c.id ORDER BY r.created_at DESC');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT r.*, c.name as chatbot_name FROM responses r LEFT JOIN chatbots c ON r.chatbot_id = c.id WHERE r.id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const { chatbot_id, name, intent, content, type, variations } = req.body;
    const result = await pool.query(
      'INSERT INTO responses (chatbot_id, name, intent, content, type, variations) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
      [chatbot_id, name, intent, content, type || 'text', JSON.stringify(variations || [])]
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { chatbot_id, name, intent, content, type, variations, status } = req.body;
    const result = await pool.query(
      'UPDATE responses SET chatbot_id=$1, name=$2, intent=$3, content=$4, type=$5, variations=$6, status=$7 WHERE id=$8 RETURNING *',
      [chatbot_id, name, intent, content, type, JSON.stringify(variations || []), status, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    await pool.query('DELETE FROM responses WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
