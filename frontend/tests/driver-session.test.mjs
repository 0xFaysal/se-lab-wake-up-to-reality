import assert from 'node:assert/strict';
import { test } from 'node:test';
import { driverSessionBookings, bookingDirectionsUrl } from '../lib/driver-session.ts';

const now = Date.parse('2026-10-04T12:00:00Z');
const earlier = { id: 'earlier', status: 'CONFIRMED', startAt: '2026-10-05T03:00:00Z', scheduledEndAt: '2026-10-05T06:00:00Z' };
const later = { id: 'later', status: 'CONFIRMED', startAt: '2026-10-06T02:30:00Z', scheduledEndAt: '2026-10-06T04:00:00Z' };

test('nearest upcoming booking is first regardless of creation order and neither disappears', () => {
  const input = [later, earlier];
  assert.deepEqual(driverSessionBookings(input, now), [earlier, later]);
  assert.deepEqual(input, [later, earlier]);
});

test('parked and checkout-requested bookings outrank upcoming reservations, even past end', () => {
  for (const status of ['CHECKED_IN', 'CHECKOUT_REQUESTED']) {
    const parked = { id: 'parked', status, startAt: '2026-10-03T03:00:00Z', scheduledEndAt: '2026-10-03T06:00:00Z' };
    assert.deepEqual(driverSessionBookings([later, earlier, parked], now), [parked, earlier, later]);
  }
});

test('cancelled, unpaid, completed and past unoccupied reservations are excluded', () => {
  const inactive = ['CANCELLED', 'PAYMENT_PENDING', 'COMPLETED', 'NO_SHOW'].map((status) => ({ ...earlier, id: status, status }));
  assert.deepEqual(driverSessionBookings([...inactive, { ...earlier, scheduledEndAt: new Date(now).toISOString() }], now), []);
});

test('Directions uses exact coordinate destination, never an approximate address search', () => {
  const url = new URL(bookingDirectionsUrl({ latitude: 23.795896, longitude: 90.437249 }));
  assert.equal(url.pathname, '/maps/dir/');
  assert.equal(url.searchParams.get('destination'), '23.795896,90.437249');
  assert.equal(url.searchParams.get('travelmode'), 'driving');
  assert.equal(bookingDirectionsUrl(null), null);
  assert.equal(bookingDirectionsUrl({ latitude: NaN, longitude: 90 }), null);
  assert.equal(bookingDirectionsUrl({ latitude: 91, longitude: 90 }), null);
});
