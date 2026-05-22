import React, { useState } from 'react';
import { getToken } from '../api.js';

export default function ResolutionLetterPdf() {
  const [form, setForm] = useState({
    customer_name: 'Jane Doe',
    ticket_id: 'TCK-10472',
    complaint_summary: 'Duplicate charge on May 12 statement',
    resolution: 'Duplicate charge reversed; goodwill credit applied',
    agent_name: 'Resolution Agent',
    compensation: '$45 account credit',
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [last, setLast] = useState('');

  function set(k, v) { setForm((f) => ({ ...f, [k]: v })); }

  async function download() {
    setErr('');
    setBusy(true);
    try {
      const token = getToken();
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers.Authorization = `Bearer ${token}`;
      const res = await fetch('/api/custom-views/resolution-letter-pdf', {
        method: 'POST',
        headers,
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || `HTTP ${res.status}`);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `resolution-${form.ticket_id}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setLast(new Date().toLocaleTimeString());
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card">
      <h3 style={{ marginTop: 0 }}>Resolution Letter PDF</h3>
      <p className="muted" style={{ marginTop: 0 }}>Generate a downloadable PDF resolution letter for the customer.</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div className="form-row">
          <label>Customer name</label>
          <input value={form.customer_name} onChange={(e) => set('customer_name', e.target.value)} />
        </div>
        <div className="form-row">
          <label>Ticket ID</label>
          <input value={form.ticket_id} onChange={(e) => set('ticket_id', e.target.value)} />
        </div>
        <div className="form-row" style={{ gridColumn: '1 / -1' }}>
          <label>Complaint summary</label>
          <input value={form.complaint_summary} onChange={(e) => set('complaint_summary', e.target.value)} />
        </div>
        <div className="form-row" style={{ gridColumn: '1 / -1' }}>
          <label>Resolution</label>
          <input value={form.resolution} onChange={(e) => set('resolution', e.target.value)} />
        </div>
        <div className="form-row">
          <label>Agent name</label>
          <input value={form.agent_name} onChange={(e) => set('agent_name', e.target.value)} />
        </div>
        <div className="form-row">
          <label>Compensation (optional)</label>
          <input value={form.compensation} onChange={(e) => set('compensation', e.target.value)} />
        </div>
      </div>
      {err && <div className="error" style={{ color: '#b91c1c', marginBottom: 8 }}>{err}</div>}
      <button className="primary" onClick={download} disabled={busy}>
        {busy ? 'Generating PDF...' : 'Download PDF'}
      </button>
      {last && <span style={{ marginLeft: 12, fontSize: 12, color: '#6b7280' }}>Last download {last}</span>}
    </div>
  );
}
