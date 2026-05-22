const express = require('express');

const router = express.Router();

router.post('/plan', (req, res) => {
  const complaint = req.body?.complaint || {
    channel: 'CFPB',
    category: 'billing dispute',
    receivedAt: new Date().toISOString(),
    severity: 'high',
  };
  const channel = String(complaint.channel || '').toLowerCase();
  const severity = String(complaint.severity || 'medium').toLowerCase();
  const dueDays = channel.includes('cfpb') ? 15 : channel.includes('bbb') ? 10 : severity === 'high' ? 3 : 7;
  const dueAt = new Date(Date.now() + dueDays * 86400000).toISOString();

  res.json({
    dueDays,
    dueAt,
    priority: severity === 'high' || dueDays <= 3 ? 'urgent' : 'standard',
    checklist: [
      'Lock evidence package and customer timeline.',
      'Assign owner for regulator-safe response draft.',
      'Schedule legal review 48 hours before due date.',
    ],
    responseFrame: `Acknowledge the ${complaint.category || 'complaint'}, state verified facts, and give a dated remediation path.`,
  });
});

module.exports = router;
