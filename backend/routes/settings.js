const router = require('express').Router();
const pool = require('../db');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT s.*, u.name as user_name FROM settings s LEFT JOIN users u ON s.user_id = u.id ORDER BY s.category, s.key');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT s.*, u.name as user_name FROM settings s LEFT JOIN users u ON s.user_id = u.id WHERE s.id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const { key, value, category } = req.body;
    const result = await pool.query(
      'INSERT INTO settings (user_id, key, value, category) VALUES ($1,$2,$3,$4) RETURNING *',
      [req.user.id, key, JSON.stringify(value), category]
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { key, value, category } = req.body;
    const result = await pool.query(
      'UPDATE settings SET key=$1, value=$2, category=$3, updated_at=NOW() WHERE id=$4 RETURNING *',
      [key, JSON.stringify(value), category, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    await pool.query('DELETE FROM settings WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
