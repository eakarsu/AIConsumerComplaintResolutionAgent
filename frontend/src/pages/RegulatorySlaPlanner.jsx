import React, { useState } from 'react';
import { postJson } from '../api.js';

const sample = JSON.stringify({
  complaint: { channel: 'CFPB', category: 'billing dispute', severity: 'high' }
}, null, 2);

export default function RegulatorySlaPlanner() {
  const [payload, setPayload] = useState(sample);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  async function run() {
    setError('');
    setResult(null);
    try {
      const data = await postJson('/api/regulatory-sla/plan', JSON.parse(payload));
      setResult(data);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    }
  }

  return (
    <div className="panel">
      <h2>Regulatory SLA Planner</h2>
      <p>Convert complaint channel and severity into due dates, review steps, and response framing.</p>
      <textarea value={payload} onChange={(event) => setPayload(event.target.value)} rows={10} />
      {error && <div className="error">{error}</div>}
      <button onClick={run}>Plan SLA</button>
      {result && (
        <div className="result-card">
          <h3>{result.priority} | due in {result.dueDays} days</h3>
          <p>{new Date(result.dueAt).toLocaleString()}</p>
          <p>{result.responseFrame}</p>
          <ul>{result.checklist.map((item) => <li key={item}>{item}</li>)}</ul>
        </div>
      )}
    </div>
  );
}
