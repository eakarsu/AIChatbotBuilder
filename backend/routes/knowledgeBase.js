const router = require('express').Router();
const pool = require('../db');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT kb.*, c.name as chatbot_name FROM knowledge_bases kb LEFT JOIN chatbots c ON kb.chatbot_id = c.id ORDER BY kb.created_at DESC');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT kb.*, c.name as chatbot_name FROM knowledge_bases kb LEFT JOIN chatbots c ON kb.chatbot_id = c.id WHERE kb.id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const { chatbot_id, name, description, type, content, file_url } = req.body;
    const result = await pool.query(
      'INSERT INTO knowledge_bases (chatbot_id, name, description, type, content, file_url) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
      [chatbot_id, name, description, type || 'document', content, file_url]
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { chatbot_id, name, description, type, content, file_url, status, chunks_count } = req.body;
    const result = await pool.query(
      'UPDATE knowledge_bases SET chatbot_id=$1, name=$2, description=$3, type=$4, content=$5, file_url=$6, status=$7, chunks_count=$8 WHERE id=$9 RETURNING *',
      [chatbot_id, name, description, type, content, file_url, status, chunks_count, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    await pool.query('DELETE FROM knowledge_bases WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
