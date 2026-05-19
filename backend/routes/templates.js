const router = require('express').Router();
const pool = require('../db');
const auth = require('../middleware/auth');

// ─── GET / - List all templates ───────────────────────────────────────────────
router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM templates ORDER BY popularity DESC');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── GET /categories - List templates grouped by category ─────────────────────
router.get('/categories', auth, async (req, res) => {
  try {
    const validCategories = ['customer-service', 'sales', 'support', 'HR'];

    // Get all templates grouped by category
    const result = await pool.query(
      `SELECT * FROM templates ORDER BY popularity DESC`
    );

    const grouped = {};
    // Initialize with the standard categories
    for (const cat of validCategories) {
      grouped[cat] = [];
    }
    grouped['other'] = [];

    for (const template of result.rows) {
      const cat = template.category;
      if (validCategories.includes(cat)) {
        grouped[cat].push(template);
      } else {
        grouped['other'].push(template);
      }
    }

    res.json({
      categories: validCategories,
      templates_by_category: grouped,
      total: result.rows.length,
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── GET /:id - Get single template ──────────────────────────────────────────
router.get('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM templates WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── POST / - Create template ─────────────────────────────────────────────────
router.post('/', auth, async (req, res) => {
  try {
    const { name, description, category, flow_data, popularity } = req.body;
    const result = await pool.query(
      'INSERT INTO templates (name, description, category, flow_data, popularity) VALUES ($1,$2,$3,$4,$5) RETURNING *',
      [name, description, category, JSON.stringify(flow_data || {}), popularity || 0]
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── POST /clone - Clone a template into a new chatbot ───────────────────────
router.post('/clone', auth, async (req, res) => {
  try {
    const { template_id, chatbot_name, chatbot_description } = req.body;

    if (!template_id) {
      return res.status(400).json({ error: 'template_id is required.' });
    }

    // Fetch the source template
    const templateResult = await pool.query('SELECT * FROM templates WHERE id = $1', [template_id]);
    if (templateResult.rows.length === 0) {
      return res.status(404).json({ error: 'Template not found.' });
    }
    const template = templateResult.rows[0];

    // Determine new chatbot name
    const newName = chatbot_name || `${template.name} (Clone)`;
    const newDescription = chatbot_description || template.description || '';

    // Create a new chatbot from the template's flow_data
    const flowData = template.flow_data || {};

    // Insert into chatbots table with template's flow data embedded
    const chatbotResult = await pool.query(
      `INSERT INTO chatbots (name, description, flow_data, status, created_at, updated_at)
       VALUES ($1, $2, $3, 'draft', NOW(), NOW()) RETURNING *`,
      [newName, newDescription, JSON.stringify(flowData)]
    );

    // Increment template popularity
    await pool.query('UPDATE templates SET popularity = popularity + 1 WHERE id = $1', [template_id]);

    res.status(201).json({
      chatbot: chatbotResult.rows[0],
      cloned_from: { id: template.id, name: template.name, category: template.category },
      message: `Chatbot "${newName}" created from template "${template.name}".`,
    });
  } catch (err) {
    console.error('template clone error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── PUT /:id - Update template ───────────────────────────────────────────────
router.put('/:id', auth, async (req, res) => {
  try {
    const { name, description, category, flow_data, popularity } = req.body;
    const result = await pool.query(
      'UPDATE templates SET name=$1, description=$2, category=$3, flow_data=$4, popularity=$5 WHERE id=$6 RETURNING *',
      [name, description, category, JSON.stringify(flow_data || {}), popularity, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── DELETE /:id - Delete template ───────────────────────────────────────────
router.delete('/:id', auth, async (req, res) => {
  try {
    await pool.query('DELETE FROM templates WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
