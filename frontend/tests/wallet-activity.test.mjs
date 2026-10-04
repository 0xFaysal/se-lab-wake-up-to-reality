import assert from 'node:assert/strict';
import { test } from 'node:test';
import { walletActivity } from '../lib/wallet-activity.ts';

test('internal debit/credit reclassification is one event with no net balance movement', () => {
  const tx = { id: 'reclassification', description: 'Internal transfer' };
  const entries = ['CREDIT', 'DEBIT'].map((entrySide, i) => ({ id: String(i), entrySide,
    amountPaisa: '10000', createdAt: '2026-10-03T08:00:00Z', ledgerTransaction: tx }));
  assert.equal(walletActivity(entries).length, 1);
  assert.equal(walletActivity(entries)[0].netPaisa, 0n);
  assert.equal(entries.length, 2);
});

test('ordinary refund and booking usage retain exact signed amounts and descriptions', () => {
  const entries = [{ id: 'refund', entrySide: 'CREDIT', amountPaisa: '40000', createdAt: '', ledgerTransaction: { id: 'refund', description: 'Deposit return' } },
    { id: 'usage', entrySide: 'DEBIT', amountPaisa: '16600', createdAt: '', ledgerTransaction: { id: 'usage', description: 'Booking wallet usage' } }];
  assert.deepEqual(walletActivity(entries).map(e => e.netPaisa), [40000n, -16600n]);
  assert.equal(walletActivity(entries)[0].description, 'Deposit return');
});
