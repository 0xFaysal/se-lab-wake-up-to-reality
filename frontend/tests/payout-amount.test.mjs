import assert from 'node:assert/strict';
import { test } from 'node:test';
import { parseBDTToPaisa, validatePayoutAmount } from '../lib/payout-amount.ts';

test('payout amounts preserve exact paisa without rounding or floating point', () => {
  for (const [input, expected] of [['234', 23400n], ['234.00', 23400n], ['0.01', 1n], [' 12.3 ', 1230n], ['90071992547409.93', 9007199254740993n], ['92233720368547758.07', 9223372036854775807n]]) {
    assert.equal(parseBDTToPaisa(input), expected);
  }
  for (const input of ['', '234.001', '-1', '1e2', 'NaN', 'Infinity', '.5', '1.', '2,000', '92233720368547758.08', '999999999999999999999999']) {
    assert.equal(parseBDTToPaisa(input), null, input);
  }
});

test('withdrawal rejects invalid precision, nonpositive values and insufficient balance', () => {
  assert.equal(validatePayoutAmount('234.00', 23400n), null);
  assert.equal(validatePayoutAmount('234.001', 23400n), 'Enter a BDT amount with no more than two decimal places.');
  assert.equal(validatePayoutAmount('234.01', 23400n), 'Enter an amount within your available balance.');
  assert.equal(validatePayoutAmount('0', 23400n), 'Enter an amount greater than zero.');
  assert.equal(validatePayoutAmount('0.01', 0n), 'Enter an amount within your available balance.');
});
