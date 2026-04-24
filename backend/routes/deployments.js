const router = require('express').Router();
const pool = require('../db');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT d.*, c.name as chatbot_name, u.name as deployed_by_name FROM deployments d LEFT JOIN chatbots c ON d.chatbot_id = c.id LEFT JOIN users u ON d.deployed_by = u.id ORDER BY d.created_at DESC');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT d.*, c.name as chatbot_name, u.name as deployed_by_name FROM deployments d LEFT JOIN chatbots c ON d.chatbot_id = c.id LEFT JOIN users u ON d.deployed_by = u.id WHERE d.id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const { chatbot_id, version, environment, changes } = req.body;
    const result = await pool.query(
      'INSERT INTO deployments (chatbot_id, version, environment, status, deployed_by, changes) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
      [chatbot_id, version, environment || 'staging', 'pending', req.user.id, changes]
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { chatbot_id, version, environment, status, changes, rollback_version } = req.body;
    const deployed_at = status === 'deployed' ? new Date() : null;
    const result = await pool.query(
      'UPDATE deployments SET chatbot_id=$1, version=$2, environment=$3, status=$4, changes=$5, rollback_version=$6, deployed_at=$7 WHERE id=$8 RETURNING *',
      [chatbot_id, version, environment, status, changes, rollback_version, deployed_at, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    await pool.query('DELETE FROM deployments WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
