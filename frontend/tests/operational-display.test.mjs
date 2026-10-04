import assert from 'node:assert/strict';
import { test } from 'node:test';
import { localClockTime, operationalAmount } from '../lib/operational-display.ts';

test('time-only schedule values retain their wall-clock hours', () => {
  assert.equal(localClockTime('1970-01-01T08:00:00.000Z'), '08:00');
  assert.equal(localClockTime('22:30:00'), '22:30');
  for (const value of [undefined, null, '', 'invalid', '25:00', '08:61']) assert.equal(localClockTime(value), '');
});

test('redacted money is restricted, never a zero balance or NaN', () => {
  assert.equal(operationalAmount(undefined), 'Restricted');
  assert.equal(operationalAmount(null), 'Restricted');
  assert.equal(operationalAmount('invalid'), 'Unavailable');
  assert.equal(operationalAmount('0'), '৳0');
  assert.equal(operationalAmount('3640'), '৳36.4');
});
