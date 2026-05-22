import React, { useEffect, useState } from 'react';
import { apiFetch } from '../api.js';

const empty = { intent: '', queue: '', priority: 5, active: true };

export default function RoutingRulesEditor() {
  const [rules, setRules] = useState([]);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState(empty);
  const [editingId, setEditingId] = useState(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    setLoading(true);
    setErr('');
    try {
      const d = await apiFetch('/api/custom-views/routing-rules');
      setRules(d.rules || []);
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); }, []);

  async function save() {
    if (!draft.intent || !draft.queue) {
      setErr('intent and queue are required');
      return;
    }
    setBusy(true);
    setErr('');
    try {
      if (editingId) {
        await apiFetch(`/api/custom-views/routing-rules/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify(draft),
        });
      } else {
        await apiFetch('/api/custom-views/routing-rules', {
          method: 'POST',
          body: JSON.stringify(draft),
        });
      }
      setDraft(empty);
      setEditingId(null);
      await load();
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function remove(id) {
    setBusy(true);
    setErr('');
    try {
      await apiFetch(`/api/custom-views/routing-rules/${id}`, { method: 'DELETE' });
      await load();
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  function startEdit(r) {
    setEditingId(r.id);
    setDraft({ intent: r.intent, queue: r.queue, priority: r.priority, active: r.active });
  }
  function cancelEdit() {
    setEditingId(null);
    setDraft(empty);
  }

  return (
    <div className="card">
      <h3 style={{ marginTop: 0 }}>Routing Rules — intent to queue</h3>
      <p className="muted" style={{ marginTop: 0 }}>CRUD mapping for ticket auto-routing. Higher priority wins on conflict.</p>

      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1.4fr 0.8fr 0.6fr auto', gap: 8, alignItems: 'end', marginBottom: 12 }}>
        <div className="form-row" style={{ marginBottom: 0 }}>
          <label>Intent</label>
          <input value={draft.intent} onChange={(e) => setDraft({ ...draft, intent: e.target.value })} placeholder="e.g. billing_dispute" />
        </div>
        <div className="form-row" style={{ marginBottom: 0 }}>
          <label>Queue</label>
          <input value={draft.queue} onChange={(e) => setDraft({ ...draft, queue: e.target.value })} placeholder="e.g. billing_team" />
        </div>
        <div className="form-row" style={{ marginBottom: 0 }}>
          <label>Priority</label>
          <input type="number" min="1" max="10" value={draft.priority} onChange={(e) => setDraft({ ...draft, priority: parseInt(e.target.value || '5', 10) })} />
        </div>
        <div className="form-row" style={{ marginBottom: 0 }}>
          <label>Active</label>
          <select value={draft.active ? 'y' : 'n'} onChange={(e) => setDraft({ ...draft, active: e.target.value === 'y' })}>
            <option value="y">Yes</option>
            <option value="n">No</option>
          </select>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button className="primary" onClick={save} disabled={busy}>{editingId ? 'Update' : 'Add'}</button>
          {editingId && <button onClick={cancelEdit} disabled={busy} style={{ background: '#6b7280', color: '#fff', border: 0, padding: '8px 12px', borderRadius: 4, cursor: 'pointer' }}>Cancel</button>}
        </div>
      </div>

      {err && <div className="error" style={{ color: '#b91c1c', marginBottom: 8 }}>{err}</div>}
      {loading ? (
        <div>Loading rules...</div>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #e5e7eb', textAlign: 'left' }}>
              <th style={{ padding: 6 }}>ID</th>
              <th style={{ padding: 6 }}>Intent</th>
              <th style={{ padding: 6 }}>Queue</th>
              <th style={{ padding: 6 }}>Priority</th>
              <th style={{ padding: 6 }}>Active</th>
              <th style={{ padding: 6 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rules.map((r) => (
              <tr key={r.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                <td style={{ padding: 6 }}>{r.id}</td>
                <td style={{ padding: 6 }}>{r.intent}</td>
                <td style={{ padding: 6 }}>{r.queue}</td>
                <td style={{ padding: 6 }}>{r.priority}</td>
                <td style={{ padding: 6 }}>{r.active ? 'yes' : 'no'}</td>
                <td style={{ padding: 6 }}>
                  <button onClick={() => startEdit(r)} disabled={busy} style={{ marginRight: 6, background: '#2563eb', color: '#fff', border: 0, padding: '4px 10px', borderRadius: 4, cursor: 'pointer' }}>Edit</button>
                  <button onClick={() => remove(r.id)} disabled={busy} style={{ background: '#ef4444', color: '#fff', border: 0, padding: '4px 10px', borderRadius: 4, cursor: 'pointer' }}>Delete</button>
                </td>
              </tr>
            ))}
            {rules.length === 0 && (
              <tr><td colSpan="6" style={{ padding: 12, color: '#6b7280' }}>No rules defined.</td></tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}
