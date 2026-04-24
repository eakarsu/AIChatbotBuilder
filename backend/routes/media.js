const router = require('express').Router();
const pool = require('../db');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT m.*, u.name as uploaded_by FROM media m LEFT JOIN users u ON m.user_id = u.id ORDER BY m.created_at DESC');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT m.*, u.name as uploaded_by FROM media m LEFT JOIN users u ON m.user_id = u.id WHERE m.id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const { name, file_type, mime_type, file_size, url, thumbnail_url, folder, tags } = req.body;
    const result = await pool.query(
      'INSERT INTO media (user_id, name, file_type, mime_type, file_size, url, thumbnail_url, folder, tags) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *',
      [req.user.id, name, file_type, mime_type, file_size || 0, url, thumbnail_url, folder || 'general', JSON.stringify(tags || [])]
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { name, file_type, mime_type, file_size, url, thumbnail_url, folder, tags } = req.body;
    const result = await pool.query(
      'UPDATE media SET name=$1, file_type=$2, mime_type=$3, file_size=$4, url=$5, thumbnail_url=$6, folder=$7, tags=$8 WHERE id=$9 RETURNING *',
      [name, file_type, mime_type, file_size, url, thumbnail_url, folder, JSON.stringify(tags || []), req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    await pool.query('DELETE FROM media WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
