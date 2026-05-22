import React, { useEffect, useState } from 'react';
import { apiFetch } from '../api.js';

export default function CategoryChannelHeatmap() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    apiFetch('/api/custom-views/category-heatmap')
      .then((d) => { if (!cancelled) setData(d); })
      .catch((e) => { if (!cancelled) setErr(e.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  if (loading) return <div className="card">Loading category heatmap...</div>;
  if (err) return <div className="card" style={{ color: '#b91c1c' }}>Heatmap error: {err}</div>;
  if (!data) return null;

  function colorFor(v) {
    const t = data.max > 0 ? v / data.max : 0;
    const r = Math.round(239 - t * 40);
    const g = Math.round(246 - t * 130);
    const b = Math.round(255 - t * 130);
    return `rgb(${r},${g},${b})`;
  }

  return (
    <div className="card">
      <h3 style={{ marginTop: 0 }}>Complaint Category x Channel Heatmap</h3>
      <div style={{ fontSize: 13, marginBottom: 8 }}>
        <strong>Total complaints:</strong> {data.total} · <strong>Peak cell:</strong> {data.max}
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr>
              <th style={{ padding: '6px 10px', textAlign: 'left', color: '#6b7280' }}>Category \\ Channel</th>
              {data.channels.map((c) => (
                <th key={c} style={{ padding: '6px 10px', textAlign: 'center', color: '#6b7280' }}>{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.matrix.map((row) => (
              <tr key={row.category}>
                <td style={{ padding: '6px 10px', fontWeight: 600 }}>{row.category}</td>
                {row.values.map((v) => (
                  <td
                    key={v.channel}
                    title={`${row.category} via ${v.channel}: ${v.count}`}
                    style={{
                      padding: '10px 14px',
                      textAlign: 'center',
                      background: colorFor(v.count),
                      color: v.count > data.max * 0.6 ? '#fff' : '#1f2937',
                      border: '1px solid #fff',
                      minWidth: 56,
                      fontWeight: 600,
                    }}
                  >
                    {v.count}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ fontSize: 11, color: '#6b7280', marginTop: 6 }}>
        Darker cells indicate higher complaint volume for that category/channel pair.
      </div>
    </div>
  );
}
