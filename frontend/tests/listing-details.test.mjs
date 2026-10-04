import assert from 'node:assert/strict';
import { test } from 'node:test';
import { listingDetailsError, listingDetailsPatch } from '../lib/listing-details.ts';

const valid = { title: ' Parking ', description: ' details ', minimum: '60', maximum: '720', vehicles: ['SEDAN'] };

test('non-price listing edit preserves explicit description clearing and excludes pricing', () => {
  const patch = listingDetailsPatch({ ...valid, description: '' });
  assert.deepEqual(patch, { title: 'Parking', description: '', minDurationMinutes: 60, maxDurationMinutes: 720, allowedVehicleTypes: ['SEDAN'] });
  assert.equal(JSON.parse(JSON.stringify(patch)).description, '');
  assert.equal(listingDetailsError({ ...valid, minimum: '15', maximum: '15' }), null);
});

test('listing edit rejects missing, fractional, reversed and out-of-range durations', () => {
  for (const changes of [{ minimum: '' }, { maximum: '' }, { minimum: '1.5' }, { minimum: '1441' }, { maximum: '10081' }, { minimum: '100', maximum: '60' }, { minimum: '1e2' }, { title: '  x ' }, { description: 'x'.repeat(3001) }, { vehicles: [] }]) {
    assert.ok(listingDetailsError({ ...valid, ...changes }));
    assert.throws(() => listingDetailsPatch({ ...valid, ...changes }));
  }
});
