import assert from 'node:assert/strict';
import { test } from 'node:test';
import { defaultSearchWindow, dhakaToday } from '../lib/search-window.ts';

test('Dhaka search defaults are future arrivals, independent of the browser timezone', () => {
  for (const instant of ['2026-10-03T00:15:00Z', '2026-10-03T09:00:00Z', '2026-10-03T17:30:00Z', '2026-12-31T17:30:00Z']) {
    const now = new Date(instant);
    const window = defaultSearchWindow(now);
    assert.ok(new Date(`${window.date}T${window.startTime}:00+06:00`) > now);
    assert.ok(window.endTime > window.startTime);
  }
});

test('late-night default rolls forward without rejecting the remaining current day', () => {
  const now = new Date('2026-12-31T17:30:00Z');
  assert.equal(dhakaToday(now), '2026-12-31');
  assert.deepEqual(defaultSearchWindow(now), { date: '2027-01-01', startTime: '09:00', endTime: '12:00' });
  assert.equal(dhakaToday(new Date('2026-10-03T18:00:00Z')), '2026-10-04');
});
