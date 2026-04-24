const router = require('express').Router();
const pool = require('../db');
const auth = require('../middleware/auth');
const crypto = require('crypto');

router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT ak.id, ak.user_id, ak.name, ak.key_prefix, ak.permissions, ak.last_used, ak.expires_at, ak.status, ak.created_at, u.name as user_name FROM api_keys ak LEFT JOIN users u ON ak.user_id = u.id ORDER BY ak.created_at DESC');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT ak.id, ak.user_id, ak.name, ak.key_prefix, ak.permissions, ak.last_used, ak.expires_at, ak.status, ak.created_at, u.name as user_name FROM api_keys ak LEFT JOIN users u ON ak.user_id = u.id WHERE ak.id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const { name, permissions, expires_at } = req.body;
    const rawKey = 'pk_' + crypto.randomBytes(24).toString('hex');
    const keyPrefix = rawKey.substring(0, 10) + '...';
    const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');
    const result = await pool.query(
      'INSERT INTO api_keys (user_id, name, key_prefix, key_hash, permissions, expires_at) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id, name, key_prefix, permissions, status, created_at',
      [req.user.id, name, keyPrefix, keyHash, JSON.stringify(permissions || ['read']), expires_at || null]
    );
    res.json({ ...result.rows[0], full_key: rawKey });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { name, permissions, status, expires_at } = req.body;
    const result = await pool.query(
      'UPDATE api_keys SET name=$1, permissions=$2, status=$3, expires_at=$4 WHERE id=$5 RETURNING id, name, key_prefix, permissions, status, expires_at, created_at',
      [name, JSON.stringify(permissions || []), status, expires_at, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    await pool.query('DELETE FROM api_keys WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
