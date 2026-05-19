const router = require('express').Router();
const pool = require('../db');
const auth = require('../middleware/auth');

// ─── GET / - List all analytics events ───────────────────────────────────────
router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT a.*, c.name as chatbot_name FROM analytics a LEFT JOIN chatbots c ON a.chatbot_id = c.id ORDER BY a.created_at DESC');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── GET /summary - Overall summary stats ────────────────────────────────────
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

// ─── GET /chatbot/:id - Chatbot performance dashboard ─────────────────────────
router.get('/chatbot/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { start_date, end_date } = req.query;

    // Date filter
    let dateFilter = '';
    const params = [id];
    if (start_date) {
      params.push(start_date);
      dateFilter += ` AND conv.created_at >= $${params.length}`;
    }
    if (end_date) {
      params.push(end_date);
      dateFilter += ` AND conv.created_at <= $${params.length}`;
    }

    // Basic conversation stats
    const convStats = await pool.query(`
      SELECT
        COUNT(*) as total_conversations,
        COUNT(*) FILTER (WHERE conv.status = 'resolved') as resolved_conversations,
        COUNT(*) FILTER (WHERE conv.status = 'active') as active_conversations,
        AVG(conv.messages_count) as avg_turns_per_conversation,
        AVG(conv.satisfaction_score) FILTER (WHERE conv.satisfaction_score IS NOT NULL) as avg_satisfaction,
        MIN(conv.created_at) as first_conversation,
        MAX(conv.created_at) as last_conversation
      FROM conversations conv
      WHERE conv.chatbot_id = $1 ${dateFilter}
    `, params);

    const stats = convStats.rows[0];

    // Resolution rate
    const total = parseInt(stats.total_conversations) || 0;
    const resolved = parseInt(stats.resolved_conversations) || 0;
    const resolutionRate = total > 0 ? ((resolved / total) * 100).toFixed(2) : '0.00';

    // Message volume over time (last 30 days by default)
    const messageVolume = await pool.query(`
      SELECT
        DATE(m.created_at) as date,
        COUNT(*) as message_count
      FROM messages m
      JOIN conversations conv ON m.conversation_id = conv.id
      WHERE conv.chatbot_id = $1
        AND m.created_at >= NOW() - INTERVAL '30 days'
      GROUP BY DATE(m.created_at)
      ORDER BY date ASC
    `, [id]);

    // Top KB articles used (approximation from analytics events)
    let kbArticlesUsed = [];
    try {
      const kbQuery = await pool.query(`
        SELECT event_data->>'article_id' as article_id,
               event_data->>'article_name' as article_name,
               COUNT(*) as usage_count
        FROM analytics
        WHERE chatbot_id = $1 AND event_type = 'kb_article_used'
        GROUP BY event_data->>'article_id', event_data->>'article_name'
        ORDER BY usage_count DESC
        LIMIT 10
      `, [id]);
      kbArticlesUsed = kbQuery.rows;
    } catch (_) {
      // analytics table may not have kb events yet
    }

    // Avg turns (messages per conversation)
    const avgTurns = parseFloat(stats.avg_turns_per_conversation || 0).toFixed(2);

    // Cost estimation (rough: $0.003 per 1K tokens, ~100 tokens/message)
    const totalMessages = await pool.query(`
      SELECT COUNT(*) as count FROM messages m
      JOIN conversations conv ON m.conversation_id = conv.id
      WHERE conv.chatbot_id = $1 ${dateFilter}
    `, params);
    const msgCount = parseInt(totalMessages.rows[0].count) || 0;
    const estimatedTokens = msgCount * 100;
    const costPerConversation = total > 0
      ? ((estimatedTokens * 0.003 / 1000) / total).toFixed(4)
      : '0.0000';

    // Channel distribution
    const channels = await pool.query(`
      SELECT channel, COUNT(*) as count
      FROM conversations
      WHERE chatbot_id = $1 ${dateFilter}
      GROUP BY channel
    `, params);

    res.json({
      chatbot_id: id,
      period: { start_date: start_date || null, end_date: end_date || null },
      performance: {
        total_conversations: total,
        resolved_conversations: resolved,
        active_conversations: parseInt(stats.active_conversations) || 0,
        resolution_rate_pct: resolutionRate,
        avg_turns_per_conversation: avgTurns,
        avg_satisfaction: parseFloat(stats.avg_satisfaction || 0).toFixed(2),
        cost_per_conversation_usd: costPerConversation,
        estimated_total_cost_usd: (estimatedTokens * 0.003 / 1000).toFixed(4),
      },
      message_volume_last_30_days: messageVolume.rows,
      kb_articles_used: kbArticlesUsed,
      channel_distribution: channels.rows,
      first_conversation: stats.first_conversation,
      last_conversation: stats.last_conversation,
    });
  } catch (err) {
    console.error('chatbot analytics error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /:id - Get single analytics event ────────────────────────────────────
router.get('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT a.*, c.name as chatbot_name FROM analytics a LEFT JOIN chatbots c ON a.chatbot_id = c.id WHERE a.id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── POST / - Create analytics event ─────────────────────────────────────────
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

// ─── DELETE /:id - Delete analytics event ────────────────────────────────────
router.delete('/:id', auth, async (req, res) => {
  try {
    await pool.query('DELETE FROM analytics WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
