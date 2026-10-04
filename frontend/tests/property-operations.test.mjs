import assert from 'node:assert/strict';
import { test } from 'node:test';
import { propertyOperations } from '../lib/property-operations.ts';

test('capacity counts physical units and occupancy counts vehicles, not resources', () => {
  const resources = [{ id: 'a', capacity: 10, status: 'ACTIVE', resourceType: 'FIXED_SPACE',
    units: Array.from({ length: 10 }, (_, i) => ({ id: String(i), status: i === 9 ? 'BLOCKED' : 'ACTIVE' })) }];
  const bookings = [{ parkingSpotId: 'a', status: 'CHECKED_IN', startAt: '2026-10-03T03:00:00Z' },
    { parkingSpotId: 'a', status: 'CHECKOUT_REQUESTED', startAt: '2026-10-03T03:00:00Z' },
    { parkingSpotId: 'a', status: 'CONFIRMED', startAt: '2026-10-04T03:00:00Z' },
    { parkingSpotId: 'a', status: 'NO_SHOW', startAt: '2026-09-29T03:00:00Z' }];
  const result = propertyOperations(resources, bookings, new Date('2026-10-03T08:00:00Z'));
  assert.equal(result.totalSpaces, 10);
  assert.equal(result.activeCapacity, 9);
  assert.equal(result.occupied, 2);
  assert.equal(result.available, 7);
  assert.equal(result.activeReservations, 3);
  assert.equal(result.todayBookings.length, 2);
});

test('Dhaka day boundaries, inactive resources and empty capacity are handled', () => {
  const result = propertyOperations([{ id: 'pool', capacity: 5, status: 'INACTIVE', resourceType: 'SHARED_POOL' }],
    [{ parkingSpotId: 'pool', status: 'NO_SHOW', startAt: '2026-10-02T18:30:00Z' }], new Date('2026-10-03T08:00:00Z'));
  assert.equal(result.todayBookings.length, 1);
  assert.equal(result.available, 0);
  assert.equal(result.vacancyPercent, 0);
});
