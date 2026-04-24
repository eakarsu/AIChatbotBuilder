const pool = require('./db');
const bcrypt = require('bcryptjs');

async function seed() {
  const client = await pool.connect();
  try {
    // Drop and recreate tables
    await client.query(`
      DROP TABLE IF EXISTS plugins CASCADE;
      DROP TABLE IF EXISTS forms CASCADE;
      DROP TABLE IF EXISTS broadcasts CASCADE;
      DROP TABLE IF EXISTS tags CASCADE;
      DROP TABLE IF EXISTS media CASCADE;
      DROP TABLE IF EXISTS quick_replies CASCADE;
      DROP TABLE IF EXISTS deployments CASCADE;
      DROP TABLE IF EXISTS audit_logs CASCADE;
      DROP TABLE IF EXISTS api_keys CASCADE;
      DROP TABLE IF EXISTS contacts CASCADE;
      DROP TABLE IF EXISTS settings CASCADE;
      DROP TABLE IF EXISTS webhooks CASCADE;
      DROP TABLE IF EXISTS responses CASCADE;
      DROP TABLE IF EXISTS training_data CASCADE;
      DROP TABLE IF EXISTS entities CASCADE;
      DROP TABLE IF EXISTS intents CASCADE;
      DROP TABLE IF EXISTS analytics CASCADE;
      DROP TABLE IF EXISTS channels CASCADE;
      DROP TABLE IF EXISTS templates CASCADE;
      DROP TABLE IF EXISTS messages CASCADE;
      DROP TABLE IF EXISTS conversations CASCADE;
      DROP TABLE IF EXISTS knowledge_bases CASCADE;
      DROP TABLE IF EXISTS flows CASCADE;
      DROP TABLE IF EXISTS chatbots CASCADE;
      DROP TABLE IF EXISTS users CASCADE;
    `);

    // Create tables
    await client.query(`
      CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'user',
        avatar VARCHAR(255),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE chatbots (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        status VARCHAR(50) DEFAULT 'draft',
        language VARCHAR(50) DEFAULT 'en',
        avatar VARCHAR(255),
        welcome_message TEXT DEFAULT 'Hello! How can I help you today?',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE flows (
        id SERIAL PRIMARY KEY,
        chatbot_id INTEGER REFERENCES chatbots(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        nodes JSONB DEFAULT '[]',
        edges JSONB DEFAULT '[]',
        is_active BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE knowledge_bases (
        id SERIAL PRIMARY KEY,
        chatbot_id INTEGER REFERENCES chatbots(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        type VARCHAR(50) DEFAULT 'document',
        content TEXT,
        file_url VARCHAR(500),
        status VARCHAR(50) DEFAULT 'active',
        chunks_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE conversations (
        id SERIAL PRIMARY KEY,
        chatbot_id INTEGER REFERENCES chatbots(id) ON DELETE CASCADE,
        channel VARCHAR(50) DEFAULT 'web',
        visitor_name VARCHAR(255),
        visitor_email VARCHAR(255),
        status VARCHAR(50) DEFAULT 'active',
        messages_count INTEGER DEFAULT 0,
        satisfaction_score DECIMAL(3,2),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE messages (
        id SERIAL PRIMARY KEY,
        conversation_id INTEGER REFERENCES conversations(id) ON DELETE CASCADE,
        role VARCHAR(50) NOT NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE templates (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        category VARCHAR(100),
        flow_data JSONB DEFAULT '{}',
        popularity INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE channels (
        id SERIAL PRIMARY KEY,
        chatbot_id INTEGER REFERENCES chatbots(id) ON DELETE CASCADE,
        type VARCHAR(50) NOT NULL,
        name VARCHAR(255) NOT NULL,
        config JSONB DEFAULT '{}',
        status VARCHAR(50) DEFAULT 'inactive',
        messages_sent INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE analytics (
        id SERIAL PRIMARY KEY,
        chatbot_id INTEGER REFERENCES chatbots(id) ON DELETE CASCADE,
        event_type VARCHAR(100),
        event_data JSONB DEFAULT '{}',
        channel VARCHAR(50),
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE intents (
        id SERIAL PRIMARY KEY,
        chatbot_id INTEGER REFERENCES chatbots(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        examples JSONB DEFAULT '[]',
        confidence_threshold DECIMAL(3,2) DEFAULT 0.70,
        status VARCHAR(50) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE entities (
        id SERIAL PRIMARY KEY,
        chatbot_id INTEGER REFERENCES chatbots(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        type VARCHAR(100),
        values JSONB DEFAULT '[]',
        description TEXT,
        status VARCHAR(50) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE training_data (
        id SERIAL PRIMARY KEY,
        chatbot_id INTEGER REFERENCES chatbots(id) ON DELETE CASCADE,
        input_text TEXT NOT NULL,
        expected_intent VARCHAR(255),
        expected_entities JSONB DEFAULT '[]',
        verified BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE responses (
        id SERIAL PRIMARY KEY,
        chatbot_id INTEGER REFERENCES chatbots(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        intent VARCHAR(255),
        content TEXT NOT NULL,
        type VARCHAR(50) DEFAULT 'text',
        variations JSONB DEFAULT '[]',
        status VARCHAR(50) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE webhooks (
        id SERIAL PRIMARY KEY,
        chatbot_id INTEGER REFERENCES chatbots(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        url VARCHAR(500) NOT NULL,
        method VARCHAR(10) DEFAULT 'POST',
        headers JSONB DEFAULT '{}',
        events JSONB DEFAULT '[]',
        status VARCHAR(50) DEFAULT 'active',
        last_triggered TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE settings (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        key VARCHAR(255) NOT NULL,
        value JSONB,
        category VARCHAR(100),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE contacts (
        id SERIAL PRIMARY KEY,
        chatbot_id INTEGER REFERENCES chatbots(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        phone VARCHAR(50),
        channel VARCHAR(50) DEFAULT 'web',
        tags JSONB DEFAULT '[]',
        custom_fields JSONB DEFAULT '{}',
        conversations_count INTEGER DEFAULT 0,
        last_seen TIMESTAMP DEFAULT NOW(),
        status VARCHAR(50) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE api_keys (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        key_prefix VARCHAR(20) NOT NULL,
        key_hash VARCHAR(255) NOT NULL,
        permissions JSONB DEFAULT '["read"]',
        last_used TIMESTAMP,
        expires_at TIMESTAMP,
        status VARCHAR(50) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE audit_logs (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        user_name VARCHAR(255),
        action VARCHAR(100) NOT NULL,
        resource_type VARCHAR(100) NOT NULL,
        resource_id INTEGER,
        resource_name VARCHAR(255),
        details JSONB DEFAULT '{}',
        ip_address VARCHAR(50),
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE deployments (
        id SERIAL PRIMARY KEY,
        chatbot_id INTEGER REFERENCES chatbots(id) ON DELETE CASCADE,
        version VARCHAR(50) NOT NULL,
        environment VARCHAR(50) DEFAULT 'staging',
        status VARCHAR(50) DEFAULT 'pending',
        deployed_by INTEGER REFERENCES users(id),
        changes TEXT,
        rollback_version VARCHAR(50),
        created_at TIMESTAMP DEFAULT NOW(),
        deployed_at TIMESTAMP
      );

      CREATE TABLE quick_replies (
        id SERIAL PRIMARY KEY,
        chatbot_id INTEGER REFERENCES chatbots(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        text VARCHAR(500) NOT NULL,
        type VARCHAR(50) DEFAULT 'text',
        payload JSONB DEFAULT '{}',
        category VARCHAR(100),
        sort_order INTEGER DEFAULT 0,
        status VARCHAR(50) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE media (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        file_type VARCHAR(50) NOT NULL,
        mime_type VARCHAR(100),
        file_size INTEGER DEFAULT 0,
        url VARCHAR(500),
        thumbnail_url VARCHAR(500),
        folder VARCHAR(255) DEFAULT 'general',
        tags JSONB DEFAULT '[]',
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE tags (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        color VARCHAR(20) DEFAULT '#4F46E5',
        category VARCHAR(100) DEFAULT 'general',
        description TEXT,
        usage_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE broadcasts (
        id SERIAL PRIMARY KEY,
        chatbot_id INTEGER REFERENCES chatbots(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        channel VARCHAR(50) DEFAULT 'web',
        target_segment JSONB DEFAULT '{}',
        scheduled_at TIMESTAMP,
        sent_at TIMESTAMP,
        recipients_count INTEGER DEFAULT 0,
        delivered_count INTEGER DEFAULT 0,
        opened_count INTEGER DEFAULT 0,
        status VARCHAR(50) DEFAULT 'draft',
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE forms (
        id SERIAL PRIMARY KEY,
        chatbot_id INTEGER REFERENCES chatbots(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        fields JSONB DEFAULT '[]',
        submissions_count INTEGER DEFAULT 0,
        status VARCHAR(50) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE plugins (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        icon VARCHAR(100),
        category VARCHAR(100),
        version VARCHAR(20) DEFAULT '1.0.0',
        author VARCHAR(255),
        config JSONB DEFAULT '{}',
        status VARCHAR(50) DEFAULT 'inactive',
        installed_at TIMESTAMP DEFAULT NOW()
      );
    `);

    console.log('  Tables created.');

    // Seed Users (15+)
    const hashedPass = await bcrypt.hash('password123', 10);
    const users = [];
    const userNames = [
      ['Admin User', 'admin@chatbot.ai', 'admin'],
      ['John Smith', 'john@chatbot.ai', 'user'],
      ['Sarah Connor', 'sarah@chatbot.ai', 'user'],
      ['Mike Johnson', 'mike@chatbot.ai', 'user'],
      ['Emma Wilson', 'emma@chatbot.ai', 'editor'],
      ['David Brown', 'david@chatbot.ai', 'user'],
      ['Lisa Anderson', 'lisa@chatbot.ai', 'user'],
      ['James Taylor', 'james@chatbot.ai', 'editor'],
      ['Amy Martinez', 'amy@chatbot.ai', 'user'],
      ['Chris Lee', 'chris@chatbot.ai', 'user'],
      ['Rachel Green', 'rachel@chatbot.ai', 'user'],
      ['Tom Harris', 'tom@chatbot.ai', 'editor'],
      ['Nina Patel', 'nina@chatbot.ai', 'user'],
      ['Oscar White', 'oscar@chatbot.ai', 'user'],
      ['Zara Khan', 'zara@chatbot.ai', 'admin'],
      ['Leo Garcia', 'leo@chatbot.ai', 'user'],
    ];
    for (const [name, email, role] of userNames) {
      const res = await client.query(
        'INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id',
        [name, email, hashedPass, role]
      );
      users.push(res.rows[0].id);
    }
    console.log('  Users seeded: ' + users.length);

    // Seed Chatbots (16)
    const chatbots = [];
    const botData = [
      ['Customer Support Bot', 'Handles customer inquiries and support tickets', 'active', 'en'],
      ['Sales Assistant', 'Helps qualify leads and schedule demos', 'active', 'en'],
      ['FAQ Bot', 'Answers frequently asked questions', 'active', 'en'],
      ['Onboarding Guide', 'Guides new users through product setup', 'active', 'en'],
      ['HR Assistant', 'Handles HR-related queries for employees', 'draft', 'en'],
      ['IT Helpdesk Bot', 'Resolves common IT issues and tickets', 'active', 'en'],
      ['E-commerce Helper', 'Assists with product browsing and orders', 'active', 'en'],
      ['Appointment Scheduler', 'Books and manages appointments', 'active', 'en'],
      ['Feedback Collector', 'Collects and processes user feedback', 'draft', 'en'],
      ['Lead Qualifier', 'Qualifies marketing leads automatically', 'active', 'en'],
      ['Knowledge Navigator', 'Helps users find documentation', 'active', 'en'],
      ['Training Bot', 'Delivers interactive training modules', 'draft', 'en'],
      ['Survey Bot', 'Conducts automated surveys', 'active', 'en'],
      ['Billing Assistant', 'Handles billing inquiries and payments', 'active', 'en'],
      ['Social Media Bot', 'Manages social media interactions', 'draft', 'en'],
      ['Multi-Language Bot', 'Supports multiple languages', 'active', 'es'],
    ];
    for (const [name, desc, status, lang] of botData) {
      const uid = users[Math.floor(Math.random() * 3)];
      const res = await client.query(
        'INSERT INTO chatbots (user_id, name, description, status, language) VALUES ($1, $2, $3, $4, $5) RETURNING id',
        [uid, name, desc, status, lang]
      );
      chatbots.push(res.rows[0].id);
    }
    console.log('  Chatbots seeded: ' + chatbots.length);

    // Seed Flows (16)
    const flowData = [
      ['Welcome Flow', 'Initial greeting and routing', 1],
      ['Support Ticket Flow', 'Create and track support tickets', 1],
      ['Product Inquiry Flow', 'Handle product questions', 2],
      ['Demo Booking Flow', 'Schedule product demonstrations', 2],
      ['FAQ Resolution Flow', 'Match and answer FAQs', 3],
      ['Password Reset Flow', 'Guide through password reset', 6],
      ['Order Tracking Flow', 'Track order status', 7],
      ['Return Process Flow', 'Handle product returns', 7],
      ['Appointment Flow', 'Book appointments', 8],
      ['Feedback Collection Flow', 'Gather user feedback', 9],
      ['Lead Scoring Flow', 'Score and qualify leads', 10],
      ['Document Search Flow', 'Search knowledge base', 11],
      ['Training Module Flow', 'Interactive training delivery', 12],
      ['Survey Flow', 'Conduct automated surveys', 13],
      ['Payment Flow', 'Process billing inquiries', 14],
      ['Escalation Flow', 'Escalate to human agent', 1],
    ];
    for (const [name, desc, botIdx] of flowData) {
      const nodes = JSON.stringify([
        { id: '1', type: 'start', position: { x: 250, y: 0 }, data: { label: 'Start' } },
        { id: '2', type: 'message', position: { x: 250, y: 100 }, data: { label: 'Send Message', text: `Welcome to ${name}` } },
        { id: '3', type: 'condition', position: { x: 250, y: 200 }, data: { label: 'Check Intent' } },
        { id: '4', type: 'action', position: { x: 100, y: 300 }, data: { label: 'Action A' } },
        { id: '5', type: 'action', position: { x: 400, y: 300 }, data: { label: 'Action B' } },
        { id: '6', type: 'end', position: { x: 250, y: 400 }, data: { label: 'End' } },
      ]);
      const edges = JSON.stringify([
        { id: 'e1-2', source: '1', target: '2' },
        { id: 'e2-3', source: '2', target: '3' },
        { id: 'e3-4', source: '3', target: '4', label: 'Yes' },
        { id: 'e3-5', source: '3', target: '5', label: 'No' },
        { id: 'e4-6', source: '4', target: '6' },
        { id: 'e5-6', source: '5', target: '6' },
      ]);
      await client.query(
        'INSERT INTO flows (chatbot_id, name, description, nodes, edges, is_active) VALUES ($1, $2, $3, $4, $5, $6)',
        [chatbots[botIdx - 1], name, desc, nodes, edges, botIdx <= 8]
      );
    }
    console.log('  Flows seeded: 16');

    // Seed Knowledge Bases (16)
    const kbData = [
      ['Product Documentation', 'Complete product docs', 'document', 'Comprehensive documentation covering all product features, installation guides, and troubleshooting steps.', 1, 245],
      ['API Reference', 'REST API documentation', 'document', 'Full API reference including endpoints, parameters, authentication, and response formats.', 1, 180],
      ['User Guide', 'End-user documentation', 'document', 'Step-by-step user guides for common tasks and workflows.', 3, 120],
      ['Troubleshooting Guide', 'Common issue resolutions', 'document', 'Solutions for frequently encountered issues and error codes.', 6, 95],
      ['Sales Playbook', 'Sales scripts and objection handling', 'document', 'Proven sales scripts, objection handling techniques, and pricing information.', 2, 67],
      ['Company FAQ', 'Frequently asked questions', 'faq', 'Common questions about company policies, products, and services.', 3, 150],
      ['HR Policies', 'Employee handbook content', 'document', 'Employee policies, benefits information, and workplace guidelines.', 5, 88],
      ['Technical Specs', 'Product technical specifications', 'document', 'Detailed technical specifications for all product lines.', 7, 45],
      ['Return Policy', 'Return and refund policies', 'document', 'Complete return, exchange, and refund policy documentation.', 7, 30],
      ['Training Materials', 'Employee training content', 'document', 'Training modules, quizzes, and certification requirements.', 12, 200],
      ['Pricing Guide', 'Product pricing information', 'document', 'Current pricing tiers, discounts, and enterprise packages.', 2, 25],
      ['Integration Guide', 'Third-party integration docs', 'document', 'How to integrate with popular third-party services and APIs.', 11, 110],
      ['Security Policies', 'Security and compliance docs', 'document', 'Security protocols, data handling policies, and compliance information.', 1, 55],
      ['Release Notes', 'Product update history', 'document', 'Changelog and release notes for all product versions.', 11, 175],
      ['Onboarding Checklist', 'New user onboarding steps', 'document', 'Step-by-step onboarding checklist for new users.', 4, 40],
      ['Billing FAQ', 'Billing related questions', 'faq', 'Common billing questions, payment methods, and invoice information.', 14, 35],
    ];
    for (const [name, desc, type, content, botIdx, chunks] of kbData) {
      await client.query(
        'INSERT INTO knowledge_bases (chatbot_id, name, description, type, content, status, chunks_count) VALUES ($1, $2, $3, $4, $5, $6, $7)',
        [chatbots[botIdx - 1], name, desc, type, content, 'active', chunks]
      );
    }
    console.log('  Knowledge Bases seeded: 16');

    // Seed Conversations (16)
    const convData = [
      ['web', 'Alice Johnson', 'alice@example.com', 'active', 12, 0.95],
      ['web', 'Bob Williams', 'bob@example.com', 'closed', 8, 0.80],
      ['whatsapp', 'Carlos Mendez', 'carlos@example.com', 'active', 15, 0.90],
      ['slack', 'Diana Prince', 'diana@example.com', 'active', 6, null],
      ['web', 'Ethan Hunt', 'ethan@example.com', 'closed', 20, 0.70],
      ['whatsapp', 'Fiona Apple', 'fiona@example.com', 'active', 3, null],
      ['web', 'George Lucas', 'george@example.com', 'closed', 10, 0.85],
      ['slack', 'Hannah Montana', 'hannah@example.com', 'active', 7, 0.92],
      ['web', 'Ivan Petrov', 'ivan@example.com', 'active', 18, 0.60],
      ['whatsapp', 'Julia Roberts', 'julia@example.com', 'closed', 5, 0.98],
      ['web', 'Kevin Hart', 'kevin@example.com', 'active', 14, 0.75],
      ['slack', 'Laura Palmer', 'laura@example.com', 'active', 9, 0.88],
      ['web', 'Michael Scott', 'michael@example.com', 'closed', 22, 0.50],
      ['whatsapp', 'Nancy Drew', 'nancy@example.com', 'active', 11, 0.93],
      ['web', 'Oliver Twist', 'oliver@example.com', 'active', 4, null],
      ['slack', 'Penny Lane', 'penny@example.com', 'closed', 16, 0.82],
    ];
    const convIds = [];
    for (const [channel, vname, vemail, status, msgCount, score] of convData) {
      const botId = chatbots[Math.floor(Math.random() * 5)];
      const res = await client.query(
        'INSERT INTO conversations (chatbot_id, channel, visitor_name, visitor_email, status, messages_count, satisfaction_score) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id',
        [botId, channel, vname, vemail, status, msgCount, score]
      );
      convIds.push(res.rows[0].id);
    }
    console.log('  Conversations seeded: 16');

    // Seed Messages for first few conversations
    const msgData = [
      [1, 'user', 'Hi, I need help with my order'],
      [1, 'assistant', 'Hello! I would be happy to help you with your order. Could you please provide your order number?'],
      [1, 'user', 'It is ORDER-12345'],
      [1, 'assistant', 'Thank you! I found your order. It is currently in transit and expected to arrive by Friday.'],
      [2, 'user', 'How do I reset my password?'],
      [2, 'assistant', 'To reset your password, go to Settings > Security > Change Password. You can also click "Forgot Password" on the login page.'],
      [3, 'user', 'I want to know about your enterprise plan'],
      [3, 'assistant', 'Our Enterprise plan includes unlimited chatbots, priority support, custom integrations, and dedicated account management. Would you like to schedule a demo?'],
    ];
    for (const [convIdx, role, content] of msgData) {
      await client.query(
        'INSERT INTO messages (conversation_id, role, content) VALUES ($1, $2, $3)',
        [convIds[convIdx - 1], role, content]
      );
    }
    console.log('  Messages seeded: 8');

    // Seed Templates (16)
    const tplData = [
      ['Customer Support', 'Ready-made customer support chatbot', 'support', 850],
      ['E-commerce Assistant', 'Product browsing and checkout help', 'ecommerce', 720],
      ['Lead Generation', 'Capture and qualify leads', 'marketing', 680],
      ['FAQ Bot', 'Answer frequently asked questions', 'general', 920],
      ['Appointment Booking', 'Schedule appointments automatically', 'scheduling', 540],
      ['Feedback Survey', 'Collect customer feedback', 'surveys', 430],
      ['HR Onboarding', 'New employee onboarding assistant', 'hr', 310],
      ['IT Helpdesk', 'Technical support automation', 'support', 590],
      ['Real Estate Agent', 'Property inquiry and scheduling', 'realestate', 280],
      ['Restaurant Bot', 'Menu, reservations, and orders', 'food', 460],
      ['Travel Assistant', 'Flight and hotel booking help', 'travel', 350],
      ['Banking Bot', 'Account inquiries and transactions', 'finance', 410],
      ['Education Helper', 'Course info and enrollment', 'education', 270],
      ['Healthcare Bot', 'Symptom checker and appointments', 'healthcare', 520],
      ['Insurance Bot', 'Policy info and claims processing', 'insurance', 330],
      ['Event Registration', 'Event signup and information', 'events', 240],
    ];
    for (const [name, desc, category, popularity] of tplData) {
      await client.query(
        'INSERT INTO templates (name, description, category, popularity, flow_data) VALUES ($1,$2,$3,$4,$5)',
        [name, desc, category, popularity, JSON.stringify({ nodes: [], edges: [] })]
      );
    }
    console.log('  Templates seeded: 16');

    // Seed Channels (16)
    const chData = [
      [1, 'web', 'Main Website Widget', 'active', 15200],
      [1, 'whatsapp', 'WhatsApp Business', 'active', 8400],
      [1, 'slack', 'Slack Workspace', 'active', 3200],
      [2, 'web', 'Sales Landing Page', 'active', 12100],
      [2, 'whatsapp', 'Sales WhatsApp', 'inactive', 0],
      [3, 'web', 'FAQ Page Widget', 'active', 22500],
      [4, 'web', 'Onboarding Widget', 'active', 5600],
      [4, 'slack', 'Onboarding Slack', 'active', 1800],
      [6, 'web', 'IT Support Portal', 'active', 9800],
      [6, 'slack', 'IT Slack Channel', 'active', 4500],
      [7, 'web', 'Online Store Chat', 'active', 31000],
      [7, 'whatsapp', 'Store WhatsApp', 'active', 11200],
      [8, 'web', 'Booking Website', 'active', 7300],
      [10, 'web', 'Marketing Page Bot', 'active', 6400],
      [13, 'web', 'Survey Widget', 'active', 2900],
      [14, 'web', 'Billing Portal Chat', 'active', 4100],
    ];
    for (const [botIdx, type, name, status, msgSent] of chData) {
      await client.query(
        'INSERT INTO channels (chatbot_id, type, name, config, status, messages_sent) VALUES ($1,$2,$3,$4,$5,$6)',
        [chatbots[botIdx - 1], type, name, JSON.stringify({ enabled: status === 'active' }), status, msgSent]
      );
    }
    console.log('  Channels seeded: 16');

    // Seed Analytics (20)
    const eventTypes = ['message_sent', 'message_received', 'session_start', 'session_end', 'handoff', 'intent_matched', 'fallback'];
    const analyticsChannels = ['web', 'whatsapp', 'slack'];
    for (let i = 0; i < 20; i++) {
      const botId = chatbots[Math.floor(Math.random() * chatbots.length)];
      const evtType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
      const ch = analyticsChannels[Math.floor(Math.random() * analyticsChannels.length)];
      await client.query(
        'INSERT INTO analytics (chatbot_id, event_type, event_data, channel) VALUES ($1,$2,$3,$4)',
        [botId, evtType, JSON.stringify({ count: Math.floor(Math.random() * 100), timestamp: new Date().toISOString() }), ch]
      );
    }
    console.log('  Analytics seeded: 20');

    // Seed Intents (16)
    const intentData = [
      ['greeting', 'User greets the bot', ['hello', 'hi', 'hey', 'good morning', 'howdy'], 0.80],
      ['goodbye', 'User says goodbye', ['bye', 'goodbye', 'see you', 'later', 'take care'], 0.80],
      ['order_status', 'Check order status', ['where is my order', 'track order', 'order status', 'shipping update'], 0.75],
      ['product_inquiry', 'Ask about products', ['tell me about', 'product info', 'what does it do', 'features'], 0.70],
      ['pricing', 'Ask about pricing', ['how much', 'price', 'cost', 'pricing plans', 'subscription'], 0.75],
      ['support_ticket', 'Create support ticket', ['I have a problem', 'issue', 'bug', 'not working', 'help me'], 0.70],
      ['refund_request', 'Request a refund', ['refund', 'money back', 'return item', 'cancel order'], 0.80],
      ['appointment_book', 'Book an appointment', ['schedule', 'book appointment', 'available times', 'meet'], 0.75],
      ['password_reset', 'Reset password', ['forgot password', 'reset password', 'cant login', 'locked out'], 0.85],
      ['feedback', 'Give feedback', ['feedback', 'suggestion', 'complaint', 'review', 'rate'], 0.70],
      ['transfer_agent', 'Talk to human', ['speak to agent', 'human', 'representative', 'transfer', 'real person'], 0.90],
      ['cancel_subscription', 'Cancel subscription', ['cancel', 'unsubscribe', 'stop service', 'end membership'], 0.85],
      ['account_info', 'Account information', ['my account', 'profile', 'account details', 'settings'], 0.70],
      ['payment_issue', 'Payment problems', ['payment failed', 'charge', 'billing error', 'invoice'], 0.80],
      ['feature_request', 'Request new feature', ['can you add', 'feature request', 'suggestion', 'would be nice'], 0.65],
      ['thank_you', 'User thanks the bot', ['thank you', 'thanks', 'appreciate it', 'great help'], 0.85],
    ];
    for (const [name, desc, examples, threshold] of intentData) {
      const botId = chatbots[Math.floor(Math.random() * 5)];
      await client.query(
        'INSERT INTO intents (chatbot_id, name, description, examples, confidence_threshold) VALUES ($1,$2,$3,$4,$5)',
        [botId, name, desc, JSON.stringify(examples), threshold]
      );
    }
    console.log('  Intents seeded: 16');

    // Seed Entities (16)
    const entityData = [
      ['order_number', 'regex', ['ORD-[0-9]+', 'ORDER-[0-9]+'], 'Order number pattern'],
      ['email', 'regex', ['[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}'], 'Email address'],
      ['phone_number', 'regex', ['\\+?[0-9]{10,15}'], 'Phone number'],
      ['product_name', 'list', ['Pro Plan', 'Starter Plan', 'Enterprise Plan', 'Free Plan'], 'Product names'],
      ['date', 'datetime', ['today', 'tomorrow', 'next week', 'MM/DD/YYYY'], 'Date expressions'],
      ['time', 'datetime', ['morning', 'afternoon', 'evening', 'HH:MM'], 'Time expressions'],
      ['currency', 'regex', ['\\$[0-9]+\\.?[0-9]*', 'USD', 'EUR'], 'Currency values'],
      ['location', 'list', ['New York', 'London', 'Tokyo', 'Paris', 'Berlin'], 'City names'],
      ['department', 'list', ['sales', 'support', 'billing', 'engineering', 'hr'], 'Company departments'],
      ['priority', 'list', ['low', 'medium', 'high', 'urgent', 'critical'], 'Priority levels'],
      ['language', 'list', ['English', 'Spanish', 'French', 'German', 'Japanese'], 'Languages'],
      ['sentiment', 'classifier', ['positive', 'negative', 'neutral'], 'Sentiment categories'],
      ['ticket_id', 'regex', ['TKT-[0-9]+'], 'Support ticket ID'],
      ['subscription_type', 'list', ['monthly', 'yearly', 'lifetime'], 'Subscription types'],
      ['rating', 'number', ['1', '2', '3', '4', '5'], 'Rating scale 1-5'],
      ['category', 'list', ['bug', 'feature', 'question', 'complaint', 'praise'], 'Feedback categories'],
    ];
    for (const [name, type, values, desc] of entityData) {
      const botId = chatbots[Math.floor(Math.random() * 5)];
      await client.query(
        'INSERT INTO entities (chatbot_id, name, type, values, description) VALUES ($1,$2,$3,$4,$5)',
        [botId, name, type, JSON.stringify(values), desc]
      );
    }
    console.log('  Entities seeded: 16');

    // Seed Training Data (16)
    const tdData = [
      ['Hi there, I need help', 'greeting', true],
      ['Can you tell me my order status for ORD-5678?', 'order_status', true],
      ['How much does the Pro Plan cost?', 'pricing', true],
      ['I want to speak with a real person', 'transfer_agent', true],
      ['My payment did not go through', 'payment_issue', true],
      ['I would like to return this item', 'refund_request', false],
      ['Can I book an appointment for tomorrow?', 'appointment_book', true],
      ['I forgot my password', 'password_reset', true],
      ['Your service is terrible', 'feedback', false],
      ['Thanks for the help!', 'thank_you', true],
      ['I want to cancel my subscription', 'cancel_subscription', true],
      ['What features does the Enterprise plan have?', 'product_inquiry', true],
      ['Good morning, anyone there?', 'greeting', false],
      ['I have a suggestion for improvement', 'feature_request', true],
      ['Where can I find my account settings?', 'account_info', false],
      ['I need to create a support ticket', 'support_ticket', true],
    ];
    for (const [text, intent, verified] of tdData) {
      const botId = chatbots[Math.floor(Math.random() * 5)];
      await client.query(
        'INSERT INTO training_data (chatbot_id, input_text, expected_intent, verified) VALUES ($1,$2,$3,$4)',
        [botId, text, intent, verified]
      );
    }
    console.log('  Training Data seeded: 16');

    // Seed Responses (16)
    const respData = [
      ['Greeting Response', 'greeting', 'Hello! Welcome to our service. How can I help you today?', 'text', ['Hi there! How can I assist you?', 'Welcome! What can I do for you?']],
      ['Goodbye Response', 'goodbye', 'Goodbye! Thank you for chatting with us. Have a great day!', 'text', ['See you later!', 'Take care!']],
      ['Order Status Response', 'order_status', 'I can help you track your order. Please provide your order number.', 'text', ['Sure! What is your order number?']],
      ['Pricing Response', 'pricing', 'We offer three plans: Starter ($29/mo), Pro ($79/mo), and Enterprise (custom). Which interests you?', 'text', []],
      ['Support Ticket Created', 'support_ticket', 'I have created a support ticket for you. A team member will follow up within 24 hours.', 'text', []],
      ['Refund Initiated', 'refund_request', 'I understand you want a refund. Let me connect you with our billing team to process this.', 'text', []],
      ['Appointment Confirmation', 'appointment_book', 'Your appointment has been booked! You will receive a confirmation email shortly.', 'text', []],
      ['Password Reset Link', 'password_reset', 'I have sent a password reset link to your registered email. Please check your inbox.', 'text', []],
      ['Feedback Thanks', 'feedback', 'Thank you for your feedback! We truly value your input and will use it to improve.', 'text', []],
      ['Agent Transfer', 'transfer_agent', 'I am connecting you with a human agent now. Please hold for a moment.', 'text', []],
      ['Cancel Confirmation', 'cancel_subscription', 'I am sorry to hear that. Before canceling, would you like to hear about our retention offers?', 'text', []],
      ['Account Info', 'account_info', 'You can manage your account settings at Settings > Profile. What would you like to update?', 'text', []],
      ['Payment Help', 'payment_issue', 'I am sorry about the payment issue. Let me look into this for you right away.', 'text', []],
      ['Feature Noted', 'feature_request', 'Great suggestion! I have logged this feature request for our product team to review.', 'text', []],
      ['Thank Response', 'thank_you', 'You are welcome! Is there anything else I can help you with?', 'text', ['Happy to help!', 'Anytime!']],
      ['Fallback Response', 'fallback', 'I am not sure I understand. Could you rephrase that or would you like to speak with a human agent?', 'text', ['Sorry, I did not catch that.']],
    ];
    for (const [name, intent, content, type, variations] of respData) {
      const botId = chatbots[Math.floor(Math.random() * 5)];
      await client.query(
        'INSERT INTO responses (chatbot_id, name, intent, content, type, variations) VALUES ($1,$2,$3,$4,$5,$6)',
        [botId, name, intent, content, type, JSON.stringify(variations)]
      );
    }
    console.log('  Responses seeded: 16');

    // Seed Webhooks (16)
    const whData = [
      ['Slack Notification', 'https://hooks.slack.com/services/T00/B00/xxx', 'POST', ['message_received', 'handoff']],
      ['CRM Update', 'https://api.salesforce.com/webhook/chatbot', 'POST', ['lead_captured', 'conversation_ended']],
      ['Analytics Tracker', 'https://analytics.example.com/track', 'POST', ['session_start', 'session_end']],
      ['Email Alert', 'https://api.sendgrid.com/v3/mail/send', 'POST', ['escalation', 'negative_feedback']],
      ['Ticket Creator', 'https://api.zendesk.com/webhooks/chatbot', 'POST', ['support_ticket']],
      ['Order System', 'https://orders.example.com/api/webhook', 'POST', ['order_inquiry', 'refund_request']],
      ['Calendar Sync', 'https://calendar.google.com/api/webhook', 'POST', ['appointment_booked']],
      ['Feedback DB', 'https://feedback.example.com/api/store', 'POST', ['feedback_received']],
      ['User Tracker', 'https://mixpanel.com/api/webhook', 'POST', ['user_identified']],
      ['Payment Gateway', 'https://stripe.com/webhooks/chatbot', 'POST', ['payment_request']],
      ['SMS Notifier', 'https://api.twilio.com/webhook', 'POST', ['urgent_escalation']],
      ['Log Aggregator', 'https://logs.example.com/api/ingest', 'POST', ['error', 'warning']],
      ['AB Test Tracker', 'https://optimizely.com/webhook', 'POST', ['experiment_trigger']],
      ['Translation API', 'https://translate.example.com/webhook', 'POST', ['language_detected']],
      ['Survey Results', 'https://surveys.example.com/api/result', 'POST', ['survey_completed']],
      ['Backup Service', 'https://backup.example.com/api/trigger', 'POST', ['daily_backup']],
    ];
    for (const [name, url, method, events] of whData) {
      const botId = chatbots[Math.floor(Math.random() * 5)];
      await client.query(
        'INSERT INTO webhooks (chatbot_id, name, url, method, events, status) VALUES ($1,$2,$3,$4,$5,$6)',
        [botId, name, url, method, JSON.stringify(events), Math.random() > 0.3 ? 'active' : 'inactive']
      );
    }
    console.log('  Webhooks seeded: 16');

    // Seed Settings (16)
    const settingsData = [
      ['theme', { mode: 'light', primaryColor: '#4F46E5' }, 'appearance'],
      ['notifications', { email: true, push: true, slack: false }, 'notifications'],
      ['language', { default: 'en', available: ['en', 'es', 'fr'] }, 'general'],
      ['timezone', { zone: 'America/New_York', format: '12h' }, 'general'],
      ['ai_model', { provider: 'openrouter', model: 'anthropic/claude-haiku-4.5' }, 'ai'],
      ['rate_limit', { requests_per_minute: 60, burst: 100 }, 'security'],
      ['data_retention', { days: 90, auto_delete: true }, 'privacy'],
      ['export_format', { default: 'csv', options: ['csv', 'json', 'pdf'] }, 'general'],
      ['chat_widget', { position: 'bottom-right', color: '#4F46E5', size: 'medium' }, 'widget'],
      ['auto_reply', { enabled: true, delay_seconds: 1 }, 'chatbot'],
      ['working_hours', { start: '09:00', end: '17:00', timezone: 'EST' }, 'scheduling'],
      ['backup', { auto_backup: true, frequency: 'daily' }, 'system'],
      ['api_keys', { max_keys: 5, rotation_days: 90 }, 'security'],
      ['branding', { logo_url: '', company_name: 'AI Chatbot Builder' }, 'appearance'],
      ['integrations', { slack: true, whatsapp: true, zapier: false }, 'integrations'],
      ['analytics_retention', { days: 365, granularity: 'daily' }, 'analytics'],
    ];
    for (const [key, value, category] of settingsData) {
      await client.query(
        'INSERT INTO settings (user_id, key, value, category) VALUES ($1, $2, $3, $4)',
        [users[0], key, JSON.stringify(value), category]
      );
    }
    console.log('  Settings seeded: 16');

    // Seed Contacts (16)
    const contactData = [
      ['Alice Johnson', 'alice@example.com', '+1555-0101', 'web', ['vip', 'enterprise'], 12],
      ['Bob Williams', 'bob@example.com', '+1555-0102', 'web', ['lead'], 8],
      ['Carlos Mendez', 'carlos@example.com', '+1555-0103', 'whatsapp', ['spanish'], 15],
      ['Diana Prince', 'diana@example.com', '+1555-0104', 'slack', ['support'], 6],
      ['Ethan Hunt', 'ethan@example.com', '+1555-0105', 'web', ['lead', 'demo-requested'], 20],
      ['Fiona Apple', 'fiona@example.com', '+1555-0106', 'whatsapp', ['newsletter'], 3],
      ['George Lucas', 'george@example.com', '+1555-0107', 'web', ['enterprise'], 10],
      ['Hannah Montana', 'hannah@example.com', '+1555-0108', 'slack', ['vip'], 7],
      ['Ivan Petrov', 'ivan@example.com', '+1555-0109', 'web', ['trial'], 18],
      ['Julia Roberts', 'julia@example.com', '+1555-0110', 'whatsapp', ['enterprise', 'vip'], 5],
      ['Kevin Hart', 'kevin@example.com', '+1555-0111', 'web', ['lead'], 14],
      ['Laura Palmer', 'laura@example.com', '+1555-0112', 'slack', ['support'], 9],
      ['Michael Scott', 'michael@example.com', '+1555-0113', 'web', ['churned'], 22],
      ['Nancy Drew', 'nancy@example.com', '+1555-0114', 'whatsapp', ['lead', 'qualified'], 11],
      ['Oliver Twist', 'oliver@example.com', '+1555-0115', 'web', ['new'], 4],
      ['Penny Lane', 'penny@example.com', '+1555-0116', 'slack', ['newsletter', 'lead'], 16],
    ];
    for (const [name, email, phone, channel, tags, convCount] of contactData) {
      const botId = chatbots[Math.floor(Math.random() * 5)];
      await client.query(
        'INSERT INTO contacts (chatbot_id, name, email, phone, channel, tags, conversations_count) VALUES ($1,$2,$3,$4,$5,$6,$7)',
        [botId, name, email, phone, channel, JSON.stringify(tags), convCount]
      );
    }
    console.log('  Contacts seeded: 16');

    // Seed API Keys (16)
    const apiKeyData = [
      ['Production Web App', 'pk_live_', 'read,write', 'active'],
      ['Staging Environment', 'pk_test_', 'read,write', 'active'],
      ['Mobile App iOS', 'pk_ios_', 'read', 'active'],
      ['Mobile App Android', 'pk_and_', 'read', 'active'],
      ['Analytics Dashboard', 'pk_ana_', 'read', 'active'],
      ['CRM Integration', 'pk_crm_', 'read,write', 'active'],
      ['Zapier Connector', 'pk_zap_', 'read,write', 'active'],
      ['Slack Bot', 'pk_slk_', 'read,write', 'active'],
      ['WhatsApp Gateway', 'pk_wha_', 'read,write', 'active'],
      ['Internal Testing', 'pk_dev_', 'read,write,admin', 'active'],
      ['Partner API Access', 'pk_par_', 'read', 'active'],
      ['Webhook Receiver', 'pk_whk_', 'write', 'active'],
      ['Data Export Service', 'pk_exp_', 'read', 'active'],
      ['Monitoring Service', 'pk_mon_', 'read', 'active'],
      ['Old Production Key', 'pk_old_', 'read', 'revoked'],
      ['Deprecated Key', 'pk_dep_', 'read,write', 'revoked'],
    ];
    for (const [name, prefix, perms, status] of apiKeyData) {
      await client.query(
        'INSERT INTO api_keys (user_id, name, key_prefix, key_hash, permissions, status) VALUES ($1,$2,$3,$4,$5,$6)',
        [users[0], name, prefix, 'hash_' + Math.random().toString(36).substr(2, 32), JSON.stringify(perms.split(',')), status]
      );
    }
    console.log('  API Keys seeded: 16');

    // Seed Audit Logs (16)
    const auditData = [
      ['create', 'chatbot', 1, 'Customer Support Bot', 'Created new chatbot'],
      ['update', 'chatbot', 1, 'Customer Support Bot', 'Changed status to active'],
      ['create', 'flow', 1, 'Welcome Flow', 'Created conversation flow'],
      ['delete', 'knowledge_base', 5, 'Old FAQ', 'Removed outdated FAQ'],
      ['create', 'channel', 1, 'Main Website Widget', 'Added web channel'],
      ['update', 'settings', 1, 'theme', 'Changed to dark mode'],
      ['login', 'user', 1, 'Admin User', 'Logged in from 192.168.1.1'],
      ['create', 'webhook', 1, 'Slack Notification', 'Set up Slack webhook'],
      ['update', 'intent', 3, 'order_status', 'Added 5 new training examples'],
      ['deploy', 'chatbot', 2, 'Sales Assistant', 'Deployed v1.2 to production'],
      ['create', 'template', 1, 'E-commerce Helper', 'Published new template'],
      ['update', 'response', 5, 'Greeting Response', 'Improved greeting message'],
      ['delete', 'conversation', 100, 'Conversation #100', 'Deleted stale conversation'],
      ['create', 'user', 5, 'Emma Wilson', 'Invited new team member'],
      ['update', 'channel', 3, 'WhatsApp Business', 'Updated API credentials'],
      ['export', 'analytics', null, 'Monthly Report', 'Exported analytics for January'],
    ];
    for (const [action, resourceType, resourceId, resourceName, detail] of auditData) {
      const uid = users[Math.floor(Math.random() * 3)];
      await client.query(
        'INSERT INTO audit_logs (user_id, user_name, action, resource_type, resource_id, resource_name, details, ip_address) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)',
        [uid, userNames[0][0], action, resourceType, resourceId, resourceName, JSON.stringify({ description: detail }), '192.168.1.' + Math.floor(Math.random() * 255)]
      );
    }
    console.log('  Audit Logs seeded: 16');

    // Seed Deployments (16)
    const deployData = [
      [1, 'v1.0.0', 'production', 'deployed', 'Initial release'],
      [1, 'v1.1.0', 'production', 'deployed', 'Added FAQ flow, improved greeting'],
      [1, 'v1.2.0', 'staging', 'deployed', 'New escalation flow'],
      [2, 'v1.0.0', 'production', 'deployed', 'Initial sales bot release'],
      [2, 'v1.1.0', 'staging', 'pending', 'Updated lead qualification flow'],
      [3, 'v1.0.0', 'production', 'deployed', 'FAQ bot launch'],
      [3, 'v2.0.0', 'staging', 'deployed', 'Major rewrite with AI'],
      [4, 'v1.0.0', 'production', 'deployed', 'Onboarding bot release'],
      [6, 'v1.0.0', 'production', 'deployed', 'IT helpdesk launch'],
      [6, 'v1.0.1', 'production', 'deployed', 'Bug fix: password reset flow'],
      [7, 'v1.0.0', 'production', 'deployed', 'E-commerce bot launch'],
      [7, 'v1.1.0', 'staging', 'failed', 'Order tracking - deployment failed'],
      [8, 'v1.0.0', 'production', 'deployed', 'Appointment scheduler release'],
      [10, 'v1.0.0', 'production', 'deployed', 'Lead qualifier release'],
      [13, 'v1.0.0', 'production', 'deployed', 'Survey bot release'],
      [14, 'v1.0.0', 'staging', 'pending', 'Billing assistant beta'],
    ];
    for (const [botIdx, version, env, status, changes] of deployData) {
      const uid = users[Math.floor(Math.random() * 3)];
      await client.query(
        'INSERT INTO deployments (chatbot_id, version, environment, status, deployed_by, changes, deployed_at) VALUES ($1,$2,$3,$4,$5,$6,$7)',
        [chatbots[botIdx - 1], version, env, status, uid, changes, status === 'deployed' ? new Date() : null]
      );
    }
    console.log('  Deployments seeded: 16');

    // Seed Quick Replies (16)
    const qrData = [
      ['Yes', 'Yes', 'text', 'confirmation', 1],
      ['No', 'No', 'text', 'confirmation', 2],
      ['Talk to Agent', 'I want to speak with a human agent', 'text', 'escalation', 3],
      ['View Pricing', 'Show me your pricing plans', 'text', 'sales', 4],
      ['Track Order', 'I want to track my order', 'text', 'orders', 5],
      ['Book Demo', 'I would like to book a demo', 'text', 'sales', 6],
      ['Get Help', 'I need help with something', 'text', 'support', 7],
      ['Cancel Order', 'I want to cancel my order', 'text', 'orders', 8],
      ['Refund', 'I want a refund', 'text', 'billing', 9],
      ['FAQ', 'Show me frequently asked questions', 'text', 'general', 10],
      ['Schedule Call', 'I want to schedule a call', 'text', 'scheduling', 11],
      ['Product Info', 'Tell me more about your product', 'text', 'sales', 12],
      ['Report Bug', 'I want to report a bug', 'text', 'support', 13],
      ['Leave Feedback', 'I want to leave feedback', 'text', 'feedback', 14],
      ['Subscribe', 'Subscribe me to updates', 'text', 'marketing', 15],
      ['Unsubscribe', 'Unsubscribe me from updates', 'text', 'marketing', 16],
    ];
    for (const [name, text, type, category, order] of qrData) {
      const botId = chatbots[Math.floor(Math.random() * 5)];
      await client.query(
        'INSERT INTO quick_replies (chatbot_id, name, text, type, category, sort_order) VALUES ($1,$2,$3,$4,$5,$6)',
        [botId, name, text, type, category, order]
      );
    }
    console.log('  Quick Replies seeded: 16');

    // Seed Media (16)
    const mediaData = [
      ['Company Logo', 'image', 'image/png', 45200, 'branding'],
      ['Product Screenshot', 'image', 'image/png', 128000, 'products'],
      ['Welcome Video', 'video', 'video/mp4', 5200000, 'onboarding'],
      ['User Guide PDF', 'document', 'application/pdf', 890000, 'docs'],
      ['Bot Avatar', 'image', 'image/svg+xml', 2100, 'branding'],
      ['Feature Demo GIF', 'image', 'image/gif', 340000, 'marketing'],
      ['Pricing Table', 'image', 'image/png', 67000, 'marketing'],
      ['Team Photo', 'image', 'image/jpeg', 210000, 'branding'],
      ['API Docs PDF', 'document', 'application/pdf', 1200000, 'docs'],
      ['Tutorial Video', 'video', 'video/mp4', 8500000, 'onboarding'],
      ['Error Icon', 'image', 'image/svg+xml', 1500, 'ui'],
      ['Success Sound', 'audio', 'audio/mp3', 35000, 'ui'],
      ['Background Pattern', 'image', 'image/png', 18000, 'branding'],
      ['Chatbot Icon Set', 'image', 'image/png', 52000, 'ui'],
      ['Onboarding Slides', 'document', 'application/pdf', 3400000, 'onboarding'],
      ['Customer Testimonial', 'video', 'video/mp4', 12000000, 'marketing'],
    ];
    for (const [name, fileType, mimeType, size, folder] of mediaData) {
      await client.query(
        'INSERT INTO media (user_id, name, file_type, mime_type, file_size, url, folder) VALUES ($1,$2,$3,$4,$5,$6,$7)',
        [users[0], name, fileType, mimeType, size, '/uploads/' + name.toLowerCase().replace(/\s+/g, '-') + '.' + mimeType.split('/')[1], folder]
      );
    }
    console.log('  Media seeded: 16');

    // Seed Tags (16)
    const tagData = [
      ['VIP', '#EF4444', 'customer', 'High-value customer tag', 24],
      ['Enterprise', '#4F46E5', 'customer', 'Enterprise tier customer', 18],
      ['Lead', '#F59E0B', 'customer', 'Potential customer lead', 45],
      ['Qualified', '#10B981', 'customer', 'Qualified lead', 32],
      ['Bug', '#EF4444', 'issue', 'Bug report tag', 12],
      ['Feature Request', '#8B5CF6', 'issue', 'Feature request from users', 28],
      ['Urgent', '#DC2626', 'priority', 'Urgent priority', 8],
      ['High Priority', '#F97316', 'priority', 'High priority items', 15],
      ['Low Priority', '#6B7280', 'priority', 'Low priority items', 35],
      ['FAQ', '#3B82F6', 'content', 'Frequently asked questions', 20],
      ['Tutorial', '#0891B2', 'content', 'Tutorial content', 14],
      ['Onboarding', '#059669', 'workflow', 'Onboarding related', 22],
      ['Sales', '#D97706', 'workflow', 'Sales pipeline', 30],
      ['Support', '#6366F1', 'workflow', 'Customer support', 40],
      ['Marketing', '#EC4899', 'workflow', 'Marketing related', 18],
      ['Internal', '#475569', 'general', 'Internal use only', 10],
    ];
    for (const [name, color, category, description, count] of tagData) {
      await client.query(
        'INSERT INTO tags (name, color, category, description, usage_count) VALUES ($1,$2,$3,$4,$5)',
        [name, color, category, description, count]
      );
    }
    console.log('  Tags seeded: 16');

    // Seed Broadcasts (16)
    const broadcastData = [
      ['New Feature Announcement', 'We just launched our new AI-powered response suggestions! Try it now.', 'web', 'sent', 2500, 2350, 1800],
      ['Holiday Hours Notice', 'Our support will be limited during the holidays. Use our chatbot 24/7!', 'web', 'sent', 3200, 3100, 2200],
      ['Maintenance Window', 'Scheduled maintenance on Saturday 2AM-4AM EST. Expect brief downtime.', 'web', 'sent', 4100, 3900, 1500],
      ['Product Update v2.0', 'Version 2.0 is here! Check out the new features and improvements.', 'whatsapp', 'sent', 1800, 1650, 1200],
      ['Survey Request', 'Help us improve! Take our 2-minute satisfaction survey.', 'web', 'sent', 5000, 4800, 800],
      ['Webinar Invitation', 'Join our live webinar on chatbot best practices. Register now!', 'web', 'sent', 2200, 2000, 1600],
      ['Security Update', 'Important: Please update your password as part of our security review.', 'web', 'sent', 6000, 5800, 4200],
      ['Welcome Series #1', 'Welcome to AI Chatbot Builder! Here are 5 tips to get started.', 'web', 'draft', 0, 0, 0],
      ['Welcome Series #2', 'Ready to build your first flow? Follow our step-by-step guide.', 'web', 'draft', 0, 0, 0],
      ['Re-engagement', 'We miss you! Come back and see what new features we have added.', 'whatsapp', 'scheduled', 0, 0, 0],
      ['Black Friday Promo', '50% off all annual plans this Black Friday! Limited time offer.', 'web', 'scheduled', 0, 0, 0],
      ['API Update Notice', 'Important API changes coming next month. Review the migration guide.', 'slack', 'sent', 850, 820, 650],
      ['Customer Success Tips', 'Top 10 ways to improve your chatbot engagement rate.', 'web', 'sent', 3500, 3300, 2100],
      ['Beta Feature Invite', 'You are invited to try our new flow builder beta. Join now!', 'web', 'sent', 500, 480, 380],
      ['Quarterly Review', 'Your Q4 chatbot performance report is ready. View insights now.', 'web', 'sent', 1200, 1100, 900],
      ['Integration Launch', 'New integration: Connect your chatbot to Zapier in one click!', 'slack', 'sent', 750, 700, 550],
    ];
    for (const [name, message, channel, status, recipients, delivered, opened] of broadcastData) {
      const botId = chatbots[Math.floor(Math.random() * 5)];
      await client.query(
        'INSERT INTO broadcasts (chatbot_id, name, message, channel, recipients_count, delivered_count, opened_count, status) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)',
        [botId, name, message, channel, recipients, delivered, opened, status]
      );
    }
    console.log('  Broadcasts seeded: 16');

    // Seed Forms (16)
    const formData = [
      ['Contact Form', 'Collect visitor contact information', [{ name: 'name', type: 'text', required: true }, { name: 'email', type: 'email', required: true }, { name: 'message', type: 'textarea', required: false }], 245],
      ['Lead Capture Form', 'Capture lead details for sales team', [{ name: 'company', type: 'text', required: true }, { name: 'email', type: 'email', required: true }, { name: 'phone', type: 'tel', required: false }, { name: 'budget', type: 'select', options: ['<$10k', '$10k-$50k', '$50k+'], required: true }], 180],
      ['Support Ticket Form', 'Create a support ticket', [{ name: 'subject', type: 'text', required: true }, { name: 'description', type: 'textarea', required: true }, { name: 'priority', type: 'select', options: ['Low', 'Medium', 'High'], required: true }], 320],
      ['Feedback Form', 'Collect user feedback', [{ name: 'rating', type: 'number', min: 1, max: 5, required: true }, { name: 'feedback', type: 'textarea', required: false }], 150],
      ['Appointment Form', 'Book an appointment', [{ name: 'name', type: 'text', required: true }, { name: 'date', type: 'date', required: true }, { name: 'time', type: 'time', required: true }], 95],
      ['Registration Form', 'Event registration', [{ name: 'name', type: 'text', required: true }, { name: 'email', type: 'email', required: true }, { name: 'company', type: 'text', required: false }], 210],
      ['Survey Form', 'Customer satisfaction survey', [{ name: 'q1', type: 'select', options: ['Very Satisfied', 'Satisfied', 'Neutral', 'Unsatisfied'], required: true }, { name: 'comments', type: 'textarea', required: false }], 175],
      ['Bug Report Form', 'Report a bug', [{ name: 'title', type: 'text', required: true }, { name: 'steps', type: 'textarea', required: true }, { name: 'severity', type: 'select', options: ['Critical', 'Major', 'Minor'], required: true }], 65],
      ['Order Form', 'Simple order form', [{ name: 'product', type: 'text', required: true }, { name: 'quantity', type: 'number', required: true }, { name: 'notes', type: 'textarea', required: false }], 130],
      ['Newsletter Signup', 'Newsletter subscription', [{ name: 'email', type: 'email', required: true }, { name: 'interests', type: 'text', required: false }], 450],
      ['Demo Request Form', 'Request a product demo', [{ name: 'name', type: 'text', required: true }, { name: 'company', type: 'text', required: true }, { name: 'role', type: 'text', required: false }, { name: 'email', type: 'email', required: true }], 88],
      ['Return Request Form', 'Request a product return', [{ name: 'order_number', type: 'text', required: true }, { name: 'reason', type: 'select', options: ['Defective', 'Wrong item', 'Changed mind', 'Other'], required: true }], 42],
      ['Consultation Form', 'Book a consultation', [{ name: 'name', type: 'text', required: true }, { name: 'email', type: 'email', required: true }, { name: 'topic', type: 'textarea', required: true }], 76],
      ['Payment Form', 'Collect payment information', [{ name: 'amount', type: 'number', required: true }, { name: 'description', type: 'text', required: true }], 55],
      ['Employee Onboarding', 'New employee information', [{ name: 'full_name', type: 'text', required: true }, { name: 'department', type: 'select', options: ['Engineering', 'Sales', 'Marketing', 'Support'], required: true }, { name: 'start_date', type: 'date', required: true }], 30],
      ['Quiz Form', 'Interactive quiz', [{ name: 'q1', type: 'select', options: ['A', 'B', 'C', 'D'], required: true }, { name: 'q2', type: 'select', options: ['True', 'False'], required: true }], 120],
    ];
    for (const [name, desc, fields, submissions] of formData) {
      const botId = chatbots[Math.floor(Math.random() * 5)];
      await client.query(
        'INSERT INTO forms (chatbot_id, name, description, fields, submissions_count) VALUES ($1,$2,$3,$4,$5)',
        [botId, name, desc, JSON.stringify(fields), submissions]
      );
    }
    console.log('  Forms seeded: 16');

    // Seed Plugins (16)
    const pluginData = [
      ['Slack Integration', 'Connect your chatbot to Slack workspaces', 'fa-brands fa-slack', 'messaging', '2.1.0', 'AI Chatbot Builder', 'active'],
      ['WhatsApp Business', 'Deploy chatbots on WhatsApp Business API', 'fa-brands fa-whatsapp', 'messaging', '1.8.0', 'AI Chatbot Builder', 'active'],
      ['Salesforce CRM', 'Sync contacts and leads with Salesforce', 'fa-solid fa-cloud', 'crm', '1.5.0', 'Salesforce Inc', 'active'],
      ['HubSpot CRM', 'Integrate with HubSpot CRM and marketing', 'fa-solid fa-h', 'crm', '1.3.0', 'HubSpot Inc', 'inactive'],
      ['Stripe Payments', 'Accept payments through chatbot conversations', 'fa-brands fa-stripe', 'payments', '2.0.0', 'Stripe Inc', 'active'],
      ['Google Analytics', 'Track chatbot events in Google Analytics', 'fa-brands fa-google', 'analytics', '1.6.0', 'Google LLC', 'active'],
      ['Zendesk Support', 'Create and manage Zendesk tickets', 'fa-solid fa-headset', 'support', '1.4.0', 'Zendesk Inc', 'inactive'],
      ['Mailchimp', 'Add chatbot contacts to Mailchimp lists', 'fa-solid fa-envelope', 'marketing', '1.2.0', 'Intuit Inc', 'inactive'],
      ['Zapier', 'Connect to 5000+ apps through Zapier', 'fa-solid fa-bolt', 'automation', '2.3.0', 'Zapier Inc', 'active'],
      ['Google Sheets', 'Export data to Google Sheets automatically', 'fa-solid fa-table', 'productivity', '1.1.0', 'Google LLC', 'active'],
      ['Twilio SMS', 'Send SMS messages through Twilio', 'fa-solid fa-sms', 'messaging', '1.7.0', 'Twilio Inc', 'inactive'],
      ['Calendly', 'Book appointments with Calendly integration', 'fa-solid fa-calendar', 'scheduling', '1.0.0', 'Calendly LLC', 'active'],
      ['Jira', 'Create and track Jira issues from chatbot', 'fa-brands fa-jira', 'project-management', '1.2.0', 'Atlassian', 'inactive'],
      ['Shopify', 'E-commerce integration for Shopify stores', 'fa-brands fa-shopify', 'ecommerce', '1.5.0', 'Shopify Inc', 'active'],
      ['Notion', 'Sync chatbot data with Notion databases', 'fa-solid fa-n', 'productivity', '1.0.0', 'Notion Labs', 'inactive'],
      ['Intercom', 'Handoff conversations to Intercom agents', 'fa-solid fa-headset', 'support', '1.3.0', 'Intercom Inc', 'active'],
    ];
    for (const [name, desc, icon, category, version, author, status] of pluginData) {
      await client.query(
        'INSERT INTO plugins (name, description, icon, category, version, author, status) VALUES ($1,$2,$3,$4,$5,$6,$7)',
        [name, desc, icon, category, version, author, status]
      );
    }
    console.log('  Plugins seeded: 16');

    console.log('');
    console.log('  Seed complete! All tables populated with 15+ items.');

  } catch (err) {
    console.error('Seed error:', err.message);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
