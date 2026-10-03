import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buildPropertyUpdate, propertyEditValues } from '../lib/property-edit.ts';

const property = {
  id: 'property', version: 7, name: 'Green View House', publicArea: 'Dhaka',
  approximateAddress: 'Noton Bazar', exactAddress: 'Private address',
  latitude: 23.78, longitude: 90.47, entranceLatitude: null, entranceLongitude: null,
  accessInstructions: 'Call the guard', visitorIdentificationRequired: false,
  vehicleHeightLimitCm: 200, entryCutoffLocalTime: '12:00',
  generalParkingRules: 'Old rule', commonSafetyRules: null, isSharedBuilding: false,
};

test('rules edit sends only that field and the original version, not location', () => {
  const values = propertyEditValues(property);
  assert.deepEqual(buildPropertyUpdate(property, { ...values, generalParkingRules: 'New rule' }), { version: 7, generalParkingRules: 'New rule' });
});

test('cleared optional values survive JSON serialization as explicit null', () => {
  const values = { ...propertyEditValues(property), accessInstructions: undefined, vehicleHeightLimitCm: undefined, entryCutoffLocalTime: undefined, generalParkingRules: undefined };
  assert.deepEqual(JSON.parse(JSON.stringify(buildPropertyUpdate(property, values))), { version: 7, accessInstructions: null, vehicleHeightLimitCm: null, entryCutoffLocalTime: null, generalParkingRules: null });
});

test('unchanged values and normalized whitespace do not produce false edits', () => {
  assert.deepEqual(buildPropertyUpdate(property, { ...propertyEditValues(property), name: ' Green View House ' }), { version: 7 });
});

test('actual identity and location changes remain in the patch', () => {
  assert.deepEqual(buildPropertyUpdate(property, { ...propertyEditValues(property), latitude: 23.8, isSharedBuilding: true }), { version: 7, latitude: 23.8, isSharedBuilding: true });
});
