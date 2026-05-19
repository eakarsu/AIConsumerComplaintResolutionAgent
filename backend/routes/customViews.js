const express = require('express');
const pool = require('../db');
const router = express.Router();

async function ensureTables() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS cv_routing_rules (
      id SERIAL PRIMARY KEY,
      intent VARCHAR(120) NOT NULL,
      queue VARCHAR(120) NOT NULL,
      priority INTEGER DEFAULT 5,
      active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
  `);
  const r = await pool.query('SELECT COUNT(*)::int AS n FROM cv_routing_rules');
  if (r.rows[0].n === 0) {
    const seed = [
      ['billing_dispute', 'billing_team', 9],
      ['shipping_delay', 'logistics_team', 7],
      ['product_defect', 'quality_team', 8],
      ['account_access', 'security_team', 9],
      ['refund_request', 'finance_team', 6],
      ['service_outage', 'tier2_support', 10],
      ['warranty_claim', 'warranty_team', 5],
    ];
    for (const [intent, queue, priority] of seed) {
      await pool.query(
        'INSERT INTO cv_routing_rules (intent, queue, priority) VALUES ($1, $2, $3)',
        [intent, queue, priority]
      );
    }
  }
}
ensureTables().catch((e) => console.error('cv ensureTables failed:', e.message));

// VIZ 1: ticket SLA performance chart
router.get('/sla-performance', async (req, res) => {
  try {
    const buckets = [
      { day: 'Mon', target: 24, p50: 6.5, p90: 19.4, breach_pct: 4.2, tickets: 142 },
      { day: 'Tue', target: 24, p50: 7.1, p90: 22.8, breach_pct: 7.1, tickets: 168 },
      { day: 'Wed', target: 24, p50: 8.3, p90: 27.5, breach_pct: 12.5, tickets: 191 },
      { day: 'Thu', target: 24, p50: 6.0, p90: 18.9, breach_pct: 3.7, tickets: 155 },
      { day: 'Fri', target: 24, p50: 9.4, p90: 31.2, breach_pct: 15.8, tickets: 208 },
      { day: 'Sat', target: 24, p50: 5.2, p90: 14.6, breach_pct: 2.1, tickets: 89 },
      { day: 'Sun', target: 24, p50: 4.8, p90: 13.2, breach_pct: 1.4, tickets: 71 },
    ];
    const total = buckets.reduce((s, b) => s + b.tickets, 0);
    const weighted_breach = buckets.reduce((s, b) => s + b.breach_pct * b.tickets, 0) / total;
    res.json({
      window: 'last_7_days',
      sla_hours: 24,
      total_tickets: total,
      weighted_breach_pct: Number(weighted_breach.toFixed(2)),
      buckets,
      generated_at: new Date().toISOString(),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// VIZ 2: complaint category heatmap (category x channel)
router.get('/category-heatmap', async (req, res) => {
  try {
    const categories = ['Billing', 'Shipping', 'Defect', 'Account', 'Refund', 'Outage'];
    const channels = ['Email', 'Phone', 'Chat', 'Social', 'Web'];
    // Deterministic synthetic counts seeded by category+channel
    function cell(c, ch) {
      let h = 0;
      const s = c + '|' + ch;
      for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
      return 5 + (h % 95);
    }
    const matrix = categories.map((c) => ({
      category: c,
      values: channels.map((ch) => ({ channel: ch, count: cell(c, ch) })),
    }));
    let max = 0, total = 0;
    matrix.forEach((row) => row.values.forEach((v) => {
      total += v.count;
      if (v.count > max) max = v.count;
    }));
    res.json({
      categories,
      channels,
      matrix,
      max,
      total,
      generated_at: new Date().toISOString(),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// NON-VIZ 1: resolution letter PDF
router.post('/resolution-letter-pdf', async (req, res) => {
  try {
    const {
      customer_name = 'Customer',
      ticket_id = 'TCK-0000',
      complaint_summary = 'Issue reported on account',
      resolution = 'Full credit applied to account',
      agent_name = 'Resolution Agent',
      compensation = '',
    } = req.body || {};

    const safe = (s) => String(s).replace(/[\\()]/g, (c) => '\\' + c).replace(/\r?\n/g, ' ');
    const date = new Date().toISOString().slice(0, 10);
    const lines = [
      `Re: Ticket ${safe(ticket_id)}`,
      `Date: ${date}`,
      '',
      `Dear ${safe(customer_name)},`,
      '',
      'Thank you for contacting our consumer resolution team.',
      `Complaint: ${safe(complaint_summary)}`,
      `Resolution: ${safe(resolution)}`,
    ];
    if (compensation) lines.push(`Compensation: ${safe(compensation)}`);
    lines.push('', 'We appreciate your patience and continued business.', '', `Sincerely,`, safe(agent_name), 'Consumer Complaint Resolution Team');

    // Build minimal PDF (single page, Helvetica 12pt)
    const header = '%PDF-1.4\n';
    let body = '';
    const objects = [];
    function addObj(content) {
      objects.push(content);
      return objects.length;
    }
    // 1: Catalog
    addObj('<< /Type /Catalog /Pages 2 0 R >>');
    // 2: Pages
    addObj('<< /Type /Pages /Kids [3 0 R] /Count 1 >>');
    // 3: Page
    addObj('<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>');
    // 4: Contents stream
    let stream = 'BT\n/F1 12 Tf\n72 740 Td\n14 TL\n';
    lines.forEach((l, i) => {
      const t = `(${l})`;
      if (i === 0) stream += `${t} Tj\n`;
      else stream += `T* ${t} Tj\n`;
    });
    stream += 'ET';
    addObj(`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`);
    // 5: Font
    addObj('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');

    const offsets = [];
    let cursor = header.length;
    objects.forEach((obj, idx) => {
      offsets.push(cursor);
      const o = `${idx + 1} 0 obj\n${obj}\nendobj\n`;
      body += o;
      cursor += o.length;
    });
    const xrefStart = cursor;
    let xref = `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
    offsets.forEach((off) => {
      xref += String(off).padStart(10, '0') + ' 00000 n \n';
    });
    const trailer = `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;
    const pdf = header + body + xref + trailer;
    const buf = Buffer.from(pdf, 'binary');

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="resolution-${ticket_id}.pdf"`);
    res.setHeader('Content-Length', buf.length);
    res.send(buf);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// NON-VIZ 2: routing rules editor (CRUD intent->queue)
router.get('/routing-rules', async (req, res) => {
  try {
    const r = await pool.query(
      'SELECT id, intent, queue, priority, active, created_at, updated_at FROM cv_routing_rules ORDER BY priority DESC, id ASC'
    );
    res.json({ rules: r.rows, count: r.rows.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/routing-rules', async (req, res) => {
  try {
    const { intent, queue, priority = 5, active = true } = req.body || {};
    if (!intent || !queue) return res.status(400).json({ error: 'intent and queue required' });
    const r = await pool.query(
      'INSERT INTO cv_routing_rules (intent, queue, priority, active) VALUES ($1, $2, $3, $4) RETURNING *',
      [intent, queue, priority, active]
    );
    res.json({ rule: r.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/routing-rules/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { intent, queue, priority, active } = req.body || {};
    const existing = await pool.query('SELECT * FROM cv_routing_rules WHERE id = $1', [id]);
    if (existing.rows.length === 0) return res.status(404).json({ error: 'rule not found' });
    const cur = existing.rows[0];
    const r = await pool.query(
      `UPDATE cv_routing_rules
         SET intent = $1, queue = $2, priority = $3, active = $4, updated_at = NOW()
       WHERE id = $5 RETURNING *`,
      [
        intent ?? cur.intent,
        queue ?? cur.queue,
        priority ?? cur.priority,
        typeof active === 'boolean' ? active : cur.active,
        id,
      ]
    );
    res.json({ rule: r.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/routing-rules/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const r = await pool.query('DELETE FROM cv_routing_rules WHERE id = $1 RETURNING id', [id]);
    if (r.rows.length === 0) return res.status(404).json({ error: 'rule not found' });
    res.json({ deleted: r.rows[0].id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
