/**
 * Rate limiting middleware using in-memory stores (no external dependency).
 * Provides per-user AI limiter and per-chatbot message limiter.
 */

// Simple in-memory store: key -> { count, windowStart }
const store = new Map();

function createLimiter({ windowMs, max, keyFn, message }) {
  return (req, res, next) => {
    const key = keyFn(req);
    if (!key) return next(); // skip if key cannot be determined

    const now = Date.now();
    const entry = store.get(key);

    if (!entry || now - entry.windowStart > windowMs) {
      // Start a new window
      store.set(key, { count: 1, windowStart: now });
      return next();
    }

    if (entry.count >= max) {
      const retryAfter = Math.ceil((entry.windowStart + windowMs - now) / 1000);
      res.setHeader('Retry-After', retryAfter);
      return res.status(429).json({
        error: message || 'Too many requests. Please try again later.',
        retryAfterSeconds: retryAfter,
      });
    }

    entry.count += 1;
    return next();
  };
}

// Periodically clean expired entries to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  const oneHour = 60 * 60 * 1000;
  for (const [key, entry] of store.entries()) {
    if (now - entry.windowStart > oneHour) {
      store.delete(key);
    }
  }
}, 5 * 60 * 1000); // clean every 5 minutes

/**
 * aiLimiter: 20 AI calls per hour per authenticated user.
 */
const aiLimiter = createLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20,
  keyFn: (req) => req.user?.id ? `ai:user:${req.user.id}` : null,
  message: 'AI rate limit exceeded: 20 calls per hour per user.',
});

/**
 * chatbotLimiter: 100 messages per hour per chatbot_id.
 * chatbot_id is read from req.body or req.params.
 */
const chatbotLimiter = createLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 100,
  keyFn: (req) => {
    const chatbotId = req.body?.chatbot_id || req.params?.chatbot_id || req.params?.id;
    return chatbotId ? `chat:bot:${chatbotId}` : null;
  },
  message: 'Chatbot rate limit exceeded: 100 messages per hour per chatbot.',
});

module.exports = { aiLimiter, chatbotLimiter };
