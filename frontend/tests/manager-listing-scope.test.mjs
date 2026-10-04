import assert from 'node:assert/strict';
import { test } from 'node:test';
import { listingsInPropertyScope, managerListingControls } from '../lib/manager-listing-scope.ts';

test('property-wide Manager scope does not mix listings from other assigned properties', () => {
  const records = [
    { id: 'a', parkingSpotId: 'resource-a', parkingSpot: { propertyId: 'property-a' } },
    { id: 'b', parkingSpotId: 'resource-b', parkingSpot: { propertyId: 'property-b' } },
    { id: 'c', parkingSpotId: 'resource-c', parkingSpot: { propertyId: 'property-a' } },
    { id: 'missing', parkingSpotId: 'resource-a' },
  ];
  assert.deepEqual(listingsInPropertyScope(records, 'property-a', []).map(r => r.id), ['a', 'c']);
  assert.deepEqual(listingsInPropertyScope(records, 'property-a', ['resource-a', 'resource-b']).map(r => r.id), ['a']);
  assert.deepEqual(listingsInPropertyScope(records, 'property-b', ['resource-a']), []);
});

test('Manager can activate drafts without bypassing role or terminal-state restrictions', () => {
  for (const status of ['DRAFT', 'PAUSED']) {
    assert.deepEqual(managerListingControls(status, true, false), { editDetails: true, editPrice: false, activate: true, pause: false });
  }
  assert.deepEqual(managerListingControls('ACTIVE', false, true), { editDetails: false, editPrice: true, activate: false, pause: false });
  assert.equal(managerListingControls('ACTIVE', true, false).pause, true);
  assert.deepEqual(managerListingControls('DRAFT', false, false), { editDetails: false, editPrice: false, activate: false, pause: false });
  for (const status of ['SUSPENDED', 'ENDED']) {
    assert.deepEqual(managerListingControls(status, true, true), { editDetails: false, editPrice: false, activate: false, pause: false });
  }
});
