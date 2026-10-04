import assert from 'node:assert/strict';
import { test } from 'node:test';
import { availabilityEditorError, availabilityWindowInput } from '../lib/availability-editor.ts';

test('multiple windows retain their original dates and optional expiry', () => {
  const rules = [
    { dayOfWeek: 1, startLocalTime: '08:00', endLocalTime: '12:00', validFrom: '2026-09-01T00:00:00.000Z' },
    { dayOfWeek: 1, startLocalTime: '14:00', endLocalTime: '22:00', validFrom: '2026-10-01T00:00:00.000Z', validUntil: '2026-10-31T00:00:00.000Z' },
  ].map(availabilityWindowInput);
  assert.equal(rules.length, 2);
  assert.equal(rules[0].validFrom, '2026-09-01');
  assert.equal(rules[1].validUntil, '2026-10-31');
  assert.equal(Object.hasOwn(rules[0], 'validUntil'), false);
  assert.equal(availabilityEditorError(rules), null);
});

test('invalid times and calendar ranges are rejected before submission', () => {
  const rule = { dayOfWeek: 0, startLocalTime: '08:00', endLocalTime: '22:00', validFrom: '2026-10-04' };
  for (const patch of [{ endLocalTime: '07:00' }, { startLocalTime: '' }, { validFrom: '2026-02-30' }, { validUntil: '2026-10-03' }, { dayOfWeek: 7 }]) {
    assert.ok(availabilityEditorError([{ ...rule, ...patch }]));
  }
  assert.equal(availabilityEditorError([{ ...rule, validUntil: rule.validFrom }]), null);
  assert.equal(availabilityEditorError([]), null);
  assert.ok(availabilityEditorError(Array.from({ length: 51 }, () => rule)));
});
