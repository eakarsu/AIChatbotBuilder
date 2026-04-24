const router = require('express').Router();
const pool = require('../db');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM plugins ORDER BY name ASC');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM plugins WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const { name, description, icon, category, version, author, config, status } = req.body;
    const result = await pool.query(
      'INSERT INTO plugins (name, description, icon, category, version, author, config, status) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *',
      [name, description, icon, category, version || '1.0.0', author, JSON.stringify(config || {}), status || 'inactive']
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { name, description, icon, category, version, author, config, status } = req.body;
    const result = await pool.query(
      'UPDATE plugins SET name=$1, description=$2, icon=$3, category=$4, version=$5, author=$6, config=$7, status=$8 WHERE id=$9 RETURNING *',
      [name, description, icon, category, version, author, JSON.stringify(config || {}), status, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    await pool.query('DELETE FROM plugins WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
