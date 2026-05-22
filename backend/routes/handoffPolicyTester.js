const express = require('express');
const router = express.Router();

router.post('/test', (req, res) => {
  const turns = Array.isArray(req.body?.turns) ? req.body.turns : [
    { user: 'I was charged twice and nobody answered yesterday.', sentiment: -0.7, intent_confidence: 0.54, wait_seconds: 85 },
    { user: 'Cancel my account if this is not fixed today.', sentiment: -0.9, intent_confidence: 0.46, wait_seconds: 140 }
  ];
  const thresholds = req.body?.thresholds || {};
  const sentimentLimit = Number(thresholds.sentiment ?? -0.65);
  const confidenceLimit = Number(thresholds.intent_confidence ?? 0.6);
  const waitLimit = Number(thresholds.wait_seconds ?? 120);
  const decisions = turns.map((turn, index) => {
    const reasons = [];
    if (Number(turn.sentiment ?? 0) <= sentimentLimit) reasons.push('negative_sentiment');
    if (Number(turn.intent_confidence ?? 1) <= confidenceLimit) reasons.push('low_intent_confidence');
    if (Number(turn.wait_seconds ?? 0) >= waitLimit) reasons.push('long_wait');
    return {
      turn: index + 1,
      escalate: reasons.length > 0,
      reasons,
      recommendedQueue: reasons.includes('negative_sentiment') ? 'retention_specialist' : 'general_support',
      user: turn.user || '',
    };
  });
  res.json({
    shouldHandoff: decisions.some((decision) => decision.escalate),
    firstHandoffTurn: decisions.find((decision) => decision.escalate)?.turn || null,
    decisions,
  });
});

module.exports = router;
