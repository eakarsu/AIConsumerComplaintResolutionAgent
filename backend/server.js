const express = require('express');
const cors = require('cors');
require('dotenv').config({ path: '../.env' });

const app = express();
const PORT = process.env.BACKEND_PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/api/auth', require('./routes/auth'));
app.use('/api/ai', require('./routes/ai'));


app.use('/api/ai', require('./routes/complaintTriage'));

app.use('/api/ai', require('./routes/churnPrediction'));

app.use('/api/ai', require('./routes/rootCauseCluster'));

app.use('/api/ai', require('./routes/sentimentEscalate'));

app.use('/api/ai', require('./routes/refundScoring'));
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'AIConsumerComplaintResolutionAgent', timestamp: new Date().toISOString() });
});

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.message);
  res.status(err.statusCode || 500).json({ error: err.message || 'Something went wrong' });
});

// // === Batch 02 Gaps & Frontend Mounts ===
app.use('/api/gap-no-complaint-auto-routing-triage-ai', require('./routes/gap_no_complaint_auto_routing_triage_ai'));

// // === Batch 02 Gaps & Frontend Mounts ===
app.use('/api/gap-no-sentiment-driven-escalation', require('./routes/gap_no_sentiment_driven_escalation'));

// // === Batch 02 Gaps & Frontend Mounts ===
app.use('/api/gap-no-resolution-prediction-or-churn-risk-scoring', require('./routes/gap_no_resolution_prediction_or_churn_risk_scoring'));

// // === Batch 02 Gaps & Frontend Mounts ===
app.use('/api/gap-no-root-cause-clustering-ai', require('./routes/gap_no_root_cause_clustering_ai'));

// // === Batch 02 Gaps & Frontend Mounts ===
app.use('/api/gap-no-complaint-intake-form-or-api', require('./routes/gap_no_complaint_intake_form_or_api'));

// // === Batch 02 Gaps & Frontend Mounts ===
app.use('/api/gap-no-categorization-or-assignment-workflow', require('./routes/gap_no_categorization_or_assignment_workflow'));

// // === Batch 02 Gaps & Frontend Mounts ===
app.use('/api/gap-no-resolution-tracking-or-escalation-chain', require('./routes/gap_no_resolution_tracking_or_escalation_chain'));

// // === Batch 02 Gaps & Frontend Mounts ===
app.use('/api/gap-no-customer-communication-channel', require('./routes/gap_no_customer_communication_channel'));

// // === Batch 02 Gaps & Frontend Mounts ===
app.use('/api/gap-no-analytics-or-reporting', require('./routes/gap_no_analytics_or_reporting'));

// // === Batch 02 Gaps & Frontend Mounts ===
app.use('/api/gap-no-notifications-webhooks-integrations', require('./routes/gap_no_notifications_webhooks_integrations'));

// === Custom Views (4 endpoints) — mounted BEFORE 404 ===
app.use('/api/custom-views', require('./routes/customViews'));

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found', path: req.originalUrl });
});

app.listen(PORT, () => {
  console.log(`AIConsumerComplaintResolutionAgent backend running on port ${PORT}`);
});
