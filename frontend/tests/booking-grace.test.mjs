import assert from 'node:assert/strict';
import { test } from 'node:test';
import { bookingGraceTimes, overtimePolicyText } from '../lib/booking-grace.ts';

test('grace labels cross midnight in Dhaka without changing reservation times', () => {
  assert.deepEqual(bookingGraceTimes('2026-10-04T18:00:00Z', '2026-10-04T19:00:00Z', 5), {
    entryOpensAt: '2026-10-04T17:55:00.000Z',
    freeExitUntil: '2026-10-04T19:05:00.000Z',
  });
});
test('policy disclosure distinguishes new threshold pricing from saved legacy grace', () => {
  assert.match(overtimePolicyText(2, 5), /including those 5 minutes/);
  assert.match(overtimePolicyText(2, 5), /2-minute allowance/);
  assert.match(overtimePolicyText(1, 15), /saved 15-minute/);
  assert.doesNotMatch(overtimePolicyText(undefined, 15), /2-minute/);
});
