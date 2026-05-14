const express = require('express');
const fetch = require('node-fetch');
const auth = require('../middleware/auth');
const pool = require('../db');
const router = express.Router();

const SERVICE_TITLE = 'AI Consumer Complaint Resolution Agent';

async function callOpenRouter(prompt, systemPrompt, model) {
  const chosenModel = model || process.env.OPENROUTER_MODEL || 'anthropic/claude-haiku-4.5';
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'http://localhost:3000',
      'X-Title': SERVICE_TITLE,
    },
    body: JSON.stringify({
      model: chosenModel,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
      ],
      max_tokens: 3000,
    }),
  });
  const data = await response.json();
  if (data.error) throw new Error(data.error.message || 'OpenRouter API error');
  return {
    content: data.choices[0].message.content,
    model: chosenModel,
    tokens: data.usage?.total_tokens || null,
  };
}

async function persistResult(userId, endpoint, params, result) {
  try {
    await pool.query(
      `INSERT INTO ai_results (user_id, endpoint, request_params, result_text, model_used, tokens_used)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [userId, endpoint, JSON.stringify(params), result.content, result.model, result.tokens]
    );
  } catch (err) {
    console.error('Failed to persist AI result:', err.message);
  }
}

async function ensureAiTables() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS ai_results (
      id SERIAL PRIMARY KEY,
      user_id INTEGER,
      endpoint VARCHAR(100) NOT NULL,
      request_params JSONB,
      result_text TEXT NOT NULL,
      model_used VARCHAR(100),
      tokens_used INTEGER,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);
}
ensureAiTables().catch(console.error);

router.get('/history', auth, async (req, res) => {
  try {
    const { endpoint, limit = 20, offset = 0 } = req.query;
    let query = `SELECT id, endpoint, request_params, result_text, model_used, tokens_used, created_at
                 FROM ai_results WHERE user_id = $1`;
    const params = [req.user.id];
    if (endpoint) { params.push(endpoint); query += ` AND endpoint = $${params.length}`; }
    query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);
    const result = await pool.query(query, params);
    res.json({ results: result.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 1. Triage / classify an incoming complaint
router.post('/complaint-triage', auth, async (req, res) => {
  try {
    const { complaintText, channel, customerTier } = req.body;
    const prompt = `Triage this consumer complaint:
COMPLAINT TEXT: ${complaintText || 'Not provided'}
CHANNEL: ${channel || 'Unspecified'}
CUSTOMER TIER: ${customerTier || 'Standard'}

Output as JSON-like fields:
- category (Billing / Product Quality / Delivery / Service / Refund / Privacy / Other)
- subcategory
- severity 1-5
- urgency 1-5
- recommended team (Tier1 / Tier2 / Legal / Trust&Safety)
- 1-line action`;
    const systemPrompt = `You are a triage classifier for consumer complaints. Be decisive and use the exact categories. Always assign severity and urgency separately.`;
    const result = await callOpenRouter(prompt, systemPrompt);
    await persistResult(req.user.id, 'complaint-triage', req.body, result);
    res.json({ result: result.content });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 2. Sentiment & emotion analysis
router.post('/sentiment-analysis', auth, async (req, res) => {
  try {
    const { complaintText, threadHistory } = req.body;
    const prompt = `Analyze sentiment and emotion in this customer interaction:
LATEST MESSAGE: ${complaintText || 'Not provided'}
THREAD HISTORY: ${threadHistory || 'Not provided'}

Output:
- overall sentiment (-1 to +1)
- dominant emotion (anger / frustration / disappointment / fear / sadness / neutral)
- escalation risk 0-100
- early-warning indicators detected (verbatim quotes)
- recommended de-escalation tactic`;
    const systemPrompt = `You are an emotional-intelligence analyst trained on customer-service transcripts. Quote specific phrases as evidence. Be conservative on escalation risk.`;
    const result = await callOpenRouter(prompt, systemPrompt);
    await persistResult(req.user.id, 'sentiment-analysis', req.body, result);
    res.json({ result: result.content });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 3. Draft customer response
router.post('/response-draft', auth, async (req, res) => {
  try {
    const { complaintText, customerName, productInvolved, policyContext, tone } = req.body;
    const prompt = `Draft a response to this customer:
CUSTOMER: ${customerName || 'Customer'}
COMPLAINT: ${complaintText || 'Not provided'}
PRODUCT: ${productInvolved || 'Unspecified'}
POLICY CONTEXT: ${policyContext || 'Standard policies'}
TONE: ${tone || 'Empathetic and solution-oriented'}

Produce 3 versions:
1. Empathetic / apologetic
2. Factual / policy-focused
3. Resolution-forward (offers a specific remedy)

Each version: subject line, greeting, acknowledgement, explanation, offer, next steps, signature.`;
    const systemPrompt = `You are a senior customer-care writer. Never admit liability. Always acknowledge the customer's experience. Offer specific remedies, not vague apologies.`;
    const result = await callOpenRouter(prompt, systemPrompt);
    await persistResult(req.user.id, 'response-draft', req.body, result);
    res.json({ result: result.content });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 4. Refund/credit recommendation
router.post('/refund-recommendation', auth, async (req, res) => {
  try {
    const { complaintCategory, orderValue, customerLifetimeValue, faultParty, repeatIncidence } = req.body;
    const prompt = `Recommend a fair refund/credit for this case:
CATEGORY: ${complaintCategory || 'Unspecified'}
ORDER VALUE: ${orderValue || 0}
CUSTOMER LIFETIME VALUE: ${customerLifetimeValue || 0}
FAULT: ${faultParty || 'Unclear'}
REPEAT INCIDENT FOR THIS CUSTOMER: ${repeatIncidence || 'No'}

Provide:
- recommended remedy (full refund / partial refund / store credit / replacement / goodwill gesture / no compensation)
- exact dollar amount
- justification with policy reasoning
- escalation threshold if customer rejects`;
    const systemPrompt = `You are a customer-care economist. Balance customer fairness with company cost. Always quantify, always justify against policy.`;
    const result = await callOpenRouter(prompt, systemPrompt);
    await persistResult(req.user.id, 'refund-recommendation', req.body, result);
    res.json({ result: result.content });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 5. Root cause cluster from recent complaints
router.post('/root-cause-cluster', auth, async (req, res) => {
  try {
    const { period = '30 days' } = req.body;
    const recent = await pool.query(
      `SELECT request_params, result_text FROM ai_results
       WHERE user_id=$1 AND endpoint='complaint-triage'
       ORDER BY created_at DESC LIMIT 100`,
      [req.user.id]
    );
    const prompt = `Identify systemic root causes across recent complaints (period=${period}):

RECENT TRIAGED COMPLAINTS (${recent.rows.length}):
${recent.rows.slice(0, 30).map((r, i) => `${i + 1}. params=${JSON.stringify(r.request_params).substring(0, 200)} | triage=${r.result_text.substring(0, 200)}`).join('\n') || 'No history yet — request user to submit narrative summary'}

Output: top 5 systemic issues, complaint volume per cluster, suspected upstream cause (product / process / policy / training), and recommended remediation owner.`;
    const systemPrompt = `You are a customer-experience root-cause analyst. Look for patterns across complaints. Always assign an owner team.`;
    const result = await callOpenRouter(prompt, systemPrompt);
    await persistResult(req.user.id, 'root-cause-cluster', req.body, result);
    res.json({ result: result.content });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 6. Escalation decision
router.post('/escalation-decision', auth, async (req, res) => {
  try {
    const { caseSummary, attemptedRemedies, customerThreats, mediaRisk } = req.body;
    const prompt = `Decide escalation path for this case:
CASE SUMMARY: ${caseSummary || 'Not provided'}
REMEDIES ALREADY ATTEMPTED: ${attemptedRemedies || 'None'}
CUSTOMER THREATS / SIGNALS: ${customerThreats || 'None'}
MEDIA / SOCIAL RISK: ${mediaRisk || 'Low'}

Output:
- escalation level (1-5)
- next owner (Tier2 / Manager / Legal / PR / Executive)
- specific actions in next 24 hours
- communication SLA
- legal/PR risk flags`;
    const systemPrompt = `You are an escalation-routing expert. Be conservative when media/legal risk is non-trivial. Always specify the next owner and SLA.`;
    const result = await callOpenRouter(prompt, systemPrompt);
    await persistResult(req.user.id, 'escalation-decision', req.body, result);
    res.json({ result: result.content });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 7. Churn risk for this complainant
router.post('/churn-risk', auth, async (req, res) => {
  try {
    const { customerHistory, currentSentiment, complaintCount90d, ltv } = req.body;
    const prompt = `Score churn risk for this complaining customer:
HISTORY: ${customerHistory || 'Not provided'}
CURRENT SENTIMENT: ${currentSentiment || 'Unknown'}
COMPLAINT COUNT LAST 90d: ${complaintCount90d || 0}
LIFETIME VALUE: ${ltv || 0}

Output:
- churn probability 0-100
- churn drivers (specific list)
- retention plays in priority order, with cost estimate
- expected net retention value if play succeeds`;
    const systemPrompt = `You are a retention strategist. Recommend retention plays whose cost is justified by LTV. Always rank by ROI.`;
    const result = await callOpenRouter(prompt, systemPrompt);
    await persistResult(req.user.id, 'churn-risk', req.body, result);
    res.json({ result: result.content });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 8. Regulatory flag detection (e.g., CFPB / FTC / GDPR triggers)
router.post('/regulatory-flag', auth, async (req, res) => {
  try {
    const { complaintText, customerLocation, productType } = req.body;
    const prompt = `Flag potential regulatory exposure in this complaint:
COMPLAINT: ${complaintText || 'Not provided'}
CUSTOMER LOCATION: ${customerLocation || 'US'}
PRODUCT TYPE: ${productType || 'General consumer'}

Output:
- regulatory regimes potentially triggered (CFPB / FTC / FDA / GDPR / CCPA / state AG / sector-specific)
- mandatory response windows
- documentation requirements
- whether legal must be notified
- recommended hold actions`;
    const systemPrompt = `You are a consumer-regulatory triage analyst. Be precise about jurisdiction. Flag conservatively when in doubt; always recommend legal review for high-risk cases.`;
    const result = await callOpenRouter(prompt, systemPrompt);
    await persistResult(req.user.id, 'regulatory-flag', req.body, result);
    res.json({ result: result.content });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 9. Multi-turn agent conversation with the consumer
router.post('/agent-chat', auth, async (req, res) => {
  try {
    const { sessionId, customerMessage, caseContext } = req.body;
    let history = [];
    if (sessionId) {
      const rows = await pool.query(
        `SELECT request_params, result_text FROM ai_results
         WHERE user_id=$1 AND endpoint='agent-chat' AND request_params->>'sessionId'=$2
         ORDER BY created_at ASC LIMIT 20`,
        [req.user.id, sessionId]
      );
      history = rows.rows.map(r => ({
        user: (() => { try { return JSON.parse(r.request_params).customerMessage; } catch { return ''; } })(),
        assistant: r.result_text,
      }));
    }
    const histTranscript = history.map(h => `Customer: ${h.user}\nAgent: ${h.assistant}`).join('\n\n');
    const prompt = `CASE CONTEXT: ${caseContext || 'New complaint'}

CONVERSATION HISTORY:
${histTranscript || '(none)'}

LATEST CUSTOMER MESSAGE:
${customerMessage || 'Not provided'}

Respond as the agent. Be empathetic, concrete, and move toward resolution. End with a specific next step.`;
    const systemPrompt = `You are an empathetic, professional consumer-resolution agent. Never make policy promises beyond your authority. Always offer a concrete next step.`;
    const result = await callOpenRouter(prompt, systemPrompt);
    await persistResult(req.user.id, 'agent-chat', { sessionId, customerMessage }, result);
    res.json({ result: result.content });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 10. Post-resolution survey & learnings
router.post('/post-resolution-summary', auth, async (req, res) => {
  try {
    const { caseId, finalOutcome, customerFeedback, durationDays } = req.body;
    const prompt = `Summarize this resolved complaint case for the knowledge base:
CASE ID: ${caseId || 'Unspecified'}
FINAL OUTCOME: ${finalOutcome || 'Not provided'}
CUSTOMER FEEDBACK: ${customerFeedback || 'Not provided'}
DURATION: ${durationDays || '?'} days

Output:
- one-paragraph case summary
- what went well
- what could be improved
- coaching point for the agent (1 sentence)
- candidate process change (if any)
- canned-response template extracted from this case (if reusable)`;
    const systemPrompt = `You are a customer-experience knowledge curator. Extract reusable lessons. Be candid about what failed.`;
    const result = await callOpenRouter(prompt, systemPrompt);
    await persistResult(req.user.id, 'post-resolution-summary', req.body, result);
    res.json({ result: result.content });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
