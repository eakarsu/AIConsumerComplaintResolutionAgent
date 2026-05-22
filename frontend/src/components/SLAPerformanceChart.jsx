import React, { useEffect, useState } from 'react';
import { apiFetch } from '../api.js';

export default function SLAPerformanceChart() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    apiFetch('/api/custom-views/sla-performance')
      .then((d) => { if (!cancelled) setData(d); })
      .catch((e) => { if (!cancelled) setErr(e.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  if (loading) return <div className="card">Loading SLA performance...</div>;
  if (err) return <div className="card" style={{ color: '#b91c1c' }}>SLA error: {err}</div>;
  if (!data) return null;

  const W = 640, H = 240, PAD = 36;
  const max = Math.max(...data.buckets.map((b) => b.p90), data.sla_hours) * 1.1;
  const barW = (W - PAD * 2) / data.buckets.length;
  const yScale = (v) => H - PAD - (v / max) * (H - PAD * 2);

  return (
    <div className="card">
      <h3 style={{ marginTop: 0 }}>Ticket SLA Performance — last 7 days</h3>
      <div style={{ display: 'flex', gap: 16, marginBottom: 8, fontSize: 13 }}>
        <span><strong>Total:</strong> {data.total_tickets}</span>
        <span><strong>SLA:</strong> {data.sla_hours}h</span>
        <span><strong>Weighted breach:</strong> {data.weighted_breach_pct}%</span>
      </div>
      <svg width={W} height={H} role="img" aria-label="SLA performance chart" style={{ background: '#f9fafb', borderRadius: 6 }}>
        <line x1={PAD} y1={yScale(data.sla_hours)} x2={W - PAD} y2={yScale(data.sla_hours)} stroke="#ef4444" strokeDasharray="4 3" />
        <text x={W - PAD - 4} y={yScale(data.sla_hours) - 4} fontSize="10" textAnchor="end" fill="#ef4444">SLA {data.sla_hours}h</text>
        {data.buckets.map((b, i) => {
          const x = PAD + i * barW + 6;
          const w = barW - 12;
          const yP90 = yScale(b.p90);
          const yP50 = yScale(b.p50);
          const breachColor = b.breach_pct > 10 ? '#dc2626' : b.breach_pct > 5 ? '#f59e0b' : '#10b981';
          return (
            <g key={b.day}>
              <rect x={x} y={yP90} width={w} height={H - PAD - yP90} fill={breachColor} opacity="0.35" />
              <rect x={x} y={yP50} width={w} height={H - PAD - yP50} fill={breachColor} opacity="0.85" />
              <text x={x + w / 2} y={H - PAD + 14} fontSize="11" textAnchor="middle" fill="#374151">{b.day}</text>
              <text x={x + w / 2} y={yP50 - 4} fontSize="9" textAnchor="middle" fill="#1f2937">{b.breach_pct}%</text>
            </g>
          );
        })}
        <line x1={PAD} y1={H - PAD} x2={W - PAD} y2={H - PAD} stroke="#9ca3af" />
        <line x1={PAD} y1={PAD} x2={PAD} y2={H - PAD} stroke="#9ca3af" />
      </svg>
      <div style={{ fontSize: 11, color: '#6b7280', marginTop: 6 }}>
        Solid bar = p50 resolution hours, faded bar = p90. Color shows breach severity.
      </div>
    </div>
  );
}
