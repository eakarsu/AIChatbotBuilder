const router = require('express').Router();
const pool = require('../db');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT a.*, c.name as chatbot_name FROM analytics a LEFT JOIN chatbots c ON a.chatbot_id = c.id ORDER BY a.created_at DESC');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/summary', auth, async (req, res) => {
  try {
    const totalConversations = await pool.query('SELECT COUNT(*) FROM conversations');
    const activeConversations = await pool.query("SELECT COUNT(*) FROM conversations WHERE status = 'active'");
    const totalMessages = await pool.query('SELECT COUNT(*) FROM messages');
    const avgSatisfaction = await pool.query('SELECT AVG(satisfaction_score) FROM conversations WHERE satisfaction_score IS NOT NULL');
    const channelStats = await pool.query('SELECT channel, COUNT(*) as count FROM conversations GROUP BY channel');
    const topBots = await pool.query('SELECT c.name, COUNT(conv.id) as conversations FROM chatbots c LEFT JOIN conversations conv ON c.id = conv.chatbot_id GROUP BY c.id, c.name ORDER BY conversations DESC LIMIT 5');

    res.json({
      total_conversations: parseInt(totalConversations.rows[0].count),
      active_conversations: parseInt(activeConversations.rows[0].count),
      total_messages: parseInt(totalMessages.rows[0].count),
      avg_satisfaction: parseFloat(avgSatisfaction.rows[0].avg || 0).toFixed(2),
      channel_stats: channelStats.rows,
      top_bots: topBots.rows,
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT a.*, c.name as chatbot_name FROM analytics a LEFT JOIN chatbots c ON a.chatbot_id = c.id WHERE a.id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const { chatbot_id, event_type, event_data, channel } = req.body;
    const result = await pool.query(
      'INSERT INTO analytics (chatbot_id, event_type, event_data, channel) VALUES ($1,$2,$3,$4) RETURNING *',
      [chatbot_id, event_type, JSON.stringify(event_data || {}), channel]
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    await pool.query('DELETE FROM analytics WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
