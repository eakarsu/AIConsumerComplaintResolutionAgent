'use strict';
const router = require('express').Router();
const pool = require('../db');
const auth = require('../middleware/auth');
const { planSla, assertResolutionApproval } = require('../domain/complaintPolicy');

async function member(client, organizationId, userId) {
  const result = await client.query('SELECT role FROM cr_memberships WHERE organization_id=$1 AND user_id=$2', [organizationId, userId]);
  if (!result.rows.length) throw Object.assign(new Error('Organization membership is required'), { statusCode: 403 });
  return result.rows[0];
}
function fail(res, error) { res.status(error.statusCode || 500).json({ error: error.statusCode ? error.message : 'Complaint workflow failed' }); }

router.post('/organizations/:organizationId/complaints', auth, async (req, res) => {
  const client = await pool.connect();
  try {
    const organizationId = Number(req.params.organizationId); await member(client, organizationId, req.user.id);
    const sla = planSla(req.body.channel, req.body.receivedAt);
    if (!req.get('idempotency-key') || !req.body.complainantKey || !req.body.jurisdiction || !req.body.product) return res.status(400).json({ error: 'Idempotency-Key and required complaint fields are missing' });
    await client.query('BEGIN');
    const result = await client.query(`INSERT INTO cr_complaints(organization_id,external_reference,complainant_key,jurisdiction,product,channel,priority,due_at,received_at,created_by)
      VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) ON CONFLICT(organization_id,external_reference) DO UPDATE SET external_reference=EXCLUDED.external_reference RETURNING *`,
      [organizationId, req.body.externalReference || req.get('idempotency-key'), req.body.complainantKey, req.body.jurisdiction, req.body.product, req.body.channel, req.body.priority || 'normal', sla.dueAt, req.body.receivedAt, req.user.id]);
    await client.query("INSERT INTO cr_audit_events(organization_id,complaint_id,actor_id,action,after_state,request_id) VALUES($1,$2,$3,'complaint.received',$4,$5)", [organizationId, result.rows[0].id, req.user.id, result.rows[0], req.get('x-request-id') || null]);
    await client.query('COMMIT'); res.status(201).json({ ...result.rows[0], sla });
  } catch (error) { await client.query('ROLLBACK').catch(() => {}); fail(res, error); } finally { client.release(); }
});

router.post('/complaints/:id/resolutions', auth, async (req, res) => {
  try {
    const complaint = await pool.query('SELECT * FROM cr_complaints WHERE id=$1', [req.params.id]);
    if (!complaint.rows.length) return res.status(404).json({ error: 'Complaint not found' });
    const membership = await member(pool, complaint.rows[0].organization_id, req.user.id);
    if (!['agent','supervisor','admin'].includes(membership.role)) return res.status(403).json({ error: 'Agent role is required' });
    const result = await pool.query(`INSERT INTO cr_resolutions(complaint_id,remedy,commitment_amount,currency,rationale,proposed_by)
      VALUES($1,$2,$3,$4,$5,$6) RETURNING *`, [req.params.id, req.body.remedy, req.body.commitmentAmount || 0, req.body.currency || 'USD', req.body.rationale, req.user.id]);
    await pool.query("UPDATE cr_complaints SET status='resolution_proposed',version=version+1 WHERE id=$1", [req.params.id]);
    await pool.query("INSERT INTO cr_audit_events(organization_id,complaint_id,actor_id,action,after_state) VALUES($1,$2,$3,'resolution.proposed',$4)", [complaint.rows[0].organization_id, req.params.id, req.user.id, result.rows[0]]);
    res.status(201).json(result.rows[0]);
  } catch (error) { fail(res, error); }
});

router.post('/resolutions/:id/approve', auth, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const found = await client.query('SELECT r.*,c.organization_id FROM cr_resolutions r JOIN cr_complaints c ON c.id=r.complaint_id WHERE r.id=$1 FOR UPDATE', [req.params.id]);
    if (!found.rows.length) throw Object.assign(new Error('Resolution not found'), { statusCode: 404 });
    const resolution = found.rows[0]; const membership = await member(client, resolution.organization_id, req.user.id);
    const evidence = await client.query('SELECT count(*)::int AS count FROM cr_evidence WHERE complaint_id=$1', [resolution.complaint_id]);
    assertResolutionApproval(membership.role, resolution.status, evidence.rows[0].count > 0, resolution.commitment_amount);
    const result = await client.query("UPDATE cr_resolutions SET status='approved',approved_by=$1,approved_at=now() WHERE id=$2 AND status='proposed' RETURNING *", [req.user.id, resolution.id]);
    await client.query("INSERT INTO cr_audit_events(organization_id,complaint_id,actor_id,action,before_state,after_state) VALUES($1,$2,$3,'resolution.approved',$4,$5)", [resolution.organization_id, resolution.complaint_id, req.user.id, resolution, result.rows[0]]);
    await client.query('COMMIT'); res.json(result.rows[0]);
  } catch (error) { await client.query('ROLLBACK').catch(() => {}); fail(res, error); } finally { client.release(); }
});

router.post('/complaints/:id/appeals', auth, async (req, res) => {
  try {
    const complaint = await pool.query('SELECT * FROM cr_complaints WHERE id=$1', [req.params.id]);
    if (!complaint.rows.length) return res.status(404).json({ error: 'Complaint not found' });
    await member(pool, complaint.rows[0].organization_id, req.user.id);
    const result = await pool.query('INSERT INTO cr_appeals(complaint_id,reason,requested_by) VALUES($1,$2,$3) RETURNING *', [req.params.id, req.body.reason, String(req.user.id)]);
    await pool.query("UPDATE cr_complaints SET status='appealed',version=version+1 WHERE id=$1", [req.params.id]);
    res.status(201).json(result.rows[0]);
  } catch (error) { fail(res, error); }
});

module.exports = router;
