import assert from 'node:assert/strict';
import { test } from 'node:test';
import { listingOvertimeSettings } from '../lib/listing-overtime.ts';

test('listing overtime keeps fixed five-minute grace and exact multiplier basis points', () => {
  assert.deepEqual(listingOvertimeSettings('MULTIPLIER', '1.2345', null, '5'), {
    overtimeMultiplierBps: 12345, overtimeRatePerHourPaisa: null, overtimeGracePeriodMinutes: 5,
  });
  assert.equal(listingOvertimeSettings('MULTIPLIER', '5', null, '5').overtimeMultiplierBps, 50000);
  assert.equal(listingOvertimeSettings('FIXED_PER_HOUR', '', '12345', '5').overtimeRatePerHourPaisa, '12345');
});

test('listing overtime rejects invalid values before any request', () => {
  for (const multiplier of ['0.9', '5.0001', '1.23456', '1e0', 'NaN', '']) {
    assert.throws(() => listingOvertimeSettings('MULTIPLIER', multiplier, null, '5'));
  }
  for (const grace of ['', '0', '15', '180', '-1', '1.5', '181', 'NaN', '1e1']) {
    assert.throws(() => listingOvertimeSettings('MULTIPLIER', '1.5', null, grace));
  }
  for (const rate of [null, '5', '99', '10000001', '1e2']) {
    assert.throws(() => listingOvertimeSettings('FIXED_PER_HOUR', '', rate, '5'));
  }
});
