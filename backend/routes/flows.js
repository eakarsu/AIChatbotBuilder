const router = require('express').Router();
const pool = require('../db');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const { chatbot_id } = req.query;
    let q = 'SELECT f.*, c.name as chatbot_name FROM flows f LEFT JOIN chatbots c ON f.chatbot_id = c.id';
    const params = [];
    if (chatbot_id) { q += ' WHERE f.chatbot_id = $1'; params.push(chatbot_id); }
    q += ' ORDER BY f.created_at DESC';
    const result = await pool.query(q, params);
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT f.*, c.name as chatbot_name FROM flows f LEFT JOIN chatbots c ON f.chatbot_id = c.id WHERE f.id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const { chatbot_id, name, description, nodes, edges, is_active } = req.body;
    const result = await pool.query(
      'INSERT INTO flows (chatbot_id, name, description, nodes, edges, is_active) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
      [chatbot_id, name, description, JSON.stringify(nodes || []), JSON.stringify(edges || []), is_active || false]
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { name, description, nodes, edges, is_active, chatbot_id } = req.body;
    const result = await pool.query(
      'UPDATE flows SET chatbot_id=$1, name=$2, description=$3, nodes=$4, edges=$5, is_active=$6, updated_at=NOW() WHERE id=$7 RETURNING *',
      [chatbot_id, name, description, JSON.stringify(nodes || []), JSON.stringify(edges || []), is_active, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    await pool.query('DELETE FROM flows WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
