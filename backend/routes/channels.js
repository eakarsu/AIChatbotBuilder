const router = require('express').Router();
const pool = require('../db');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT ch.*, c.name as chatbot_name FROM channels ch LEFT JOIN chatbots c ON ch.chatbot_id = c.id ORDER BY ch.created_at DESC');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT ch.*, c.name as chatbot_name FROM channels ch LEFT JOIN chatbots c ON ch.chatbot_id = c.id WHERE ch.id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const { chatbot_id, type, name, config, status } = req.body;
    const result = await pool.query(
      'INSERT INTO channels (chatbot_id, type, name, config, status) VALUES ($1,$2,$3,$4,$5) RETURNING *',
      [chatbot_id, type, name, JSON.stringify(config || {}), status || 'inactive']
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { chatbot_id, type, name, config, status } = req.body;
    const result = await pool.query(
      'UPDATE channels SET chatbot_id=$1, type=$2, name=$3, config=$4, status=$5 WHERE id=$6 RETURNING *',
      [chatbot_id, type, name, JSON.stringify(config || {}), status, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    await pool.query('DELETE FROM channels WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
