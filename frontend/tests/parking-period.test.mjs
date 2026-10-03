import assert from 'node:assert/strict';
import { test } from 'node:test';
import { isCheckoutLocked, isValidParkingPeriod } from '../lib/parking-period.ts';

test('invalid, missing, equal and reversed periods cannot render the time picker', () => {
  for (const [start, end] of [
    ['', ''], ['invalid', '2026-10-03T05:00:00Z'],
    ['2026-10-03T05:00:00Z', 'invalid'],
    ['2026-10-03T05:00:00Z', '2026-10-03T05:00:00Z'],
    ['2026-10-03T05:00:00Z', '2026-10-03T04:00:00Z'],
  ]) assert.equal(isValidParkingPeriod(start, end), false);
});

test('equivalent timezone offsets preserve valid chronological periods', () => {
  assert.equal(isValidParkingPeriod('2026-10-03T11:00:00+06:00', '2026-10-03T06:00:00Z'), true);
  assert.equal(isValidParkingPeriod('2026-10-03T11:00:00+06:00', '2026-10-03T05:00:00Z'), false);
});

test('a quote, hold, booking or in-flight quote freezes checkout inputs', () => {
  const idle = { hasQuote: false, hasHold: false, hasBooking: false, quotePending: false };
  assert.equal(isCheckoutLocked(idle), false);
  for (const key of Object.keys(idle)) assert.equal(isCheckoutLocked({ ...idle, [key]: true }), true);
});
