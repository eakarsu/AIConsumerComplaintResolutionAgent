'use strict';

const DEADLINES = Object.freeze({ regulator: 15, legal: 3, executive: 2, standard: 30 });

function planSla(channel, receivedAt) {
  const kind = String(channel || 'standard').toLowerCase();
  const days = DEADLINES[kind] || DEADLINES.standard;
  const received = new Date(receivedAt);
  if (Number.isNaN(received.getTime())) throw Object.assign(new Error('receivedAt must be ISO-8601'), { statusCode: 400 });
  return { class: kind in DEADLINES ? kind : 'standard', dueAt: new Date(received.getTime() + days * 86400000).toISOString(), days };
}

function assertResolutionApproval(role, status, hasEvidence, commitmentAmount) {
  if (!['agent', 'supervisor', 'admin'].includes(role)) throw Object.assign(new Error('Agent approval is required'), { statusCode: 403 });
  if (status !== 'proposed' || !hasEvidence) throw Object.assign(new Error('A proposed resolution with preserved evidence is required'), { statusCode: 409 });
  const amount = Number(commitmentAmount || 0);
  if (amount > 500 && !['supervisor', 'admin'].includes(role)) throw Object.assign(new Error('Supervisor approval is required above the commitment threshold'), { statusCode: 403 });
  return true;
}

module.exports = { planSla, assertResolutionApproval };
