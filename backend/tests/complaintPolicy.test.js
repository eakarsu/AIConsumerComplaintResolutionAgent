'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { planSla, assertResolutionApproval } = require('../domain/complaintPolicy');
const { validateRuntime } = require('../config/runtime');

test('regulatory SLAs are deterministic', () => assert.deepEqual(planSla('regulator', '2026-01-01T00:00:00.000Z'), { class: 'regulator', dueAt: '2026-01-16T00:00:00.000Z', days: 15 }));
test('high value commitments require supervisor approval', () => assert.throws(() => assertResolutionApproval('agent', 'proposed', true, 501), /Supervisor/));
test('documented proposals may be approved by an agent below threshold', () => assert.equal(assertResolutionApproval('agent', 'proposed', true, 100), true));
test('runtime rejects weak signing secrets', () => assert.throws(() => validateRuntime({ JWT_SECRET: 'short', DB_NAME: 'test' }), /at least 32/));
