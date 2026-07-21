const express = require('express');
const cors = require('cors');
require('dotenv').config({ path: '../.env' });
require('./config/runtime').validateRuntime();

const app = express();
const PORT = process.env.BACKEND_PORT || 3001;

app.use(cors({ origin: process.env.FRONTEND_ORIGIN || 'http://localhost:4150', credentials: true }));
app.use(express.json());

app.use('/api/auth', require('./routes/auth'));
app.use('/api/complaints', require('./routes/complaintWorkflow'));
app.use('/api/ai', require('./routes/ai'));


app.use('/api/ai', require('./routes/complaintTriage'));

app.use('/api/ai', require('./routes/churnPrediction'));

app.use('/api/ai', require('./routes/rootCauseCluster'));

app.use('/api/ai', require('./routes/sentimentEscalate'));

app.use('/api/ai', require('./routes/refundScoring'));
app.use('/api/regulatory-sla', require('./routes/regulatorySla'));
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'AIConsumerComplaintResolutionAgent', timestamp: new Date().toISOString() });
});

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.message);
  res.status(err.statusCode || 500).json({ error: err.message || 'Something went wrong' });
});

// === Custom Views (4 endpoints) — mounted BEFORE 404 ===
app.use('/api/custom-views', require('./routes/customViews'));

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found', path: req.originalUrl });
});

app.listen(PORT, () => {
  console.log(`AIConsumerComplaintResolutionAgent backend running on port ${PORT}`);
});
