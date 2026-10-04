import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buildPropertyUpdate, propertyEditValues, propertyUpdateErrors } from '../lib/property-edit.ts';
import { ApiError, getApiErrorMessage, getApiValidationErrors } from '../lib/api/api-error.ts';

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

test('height rejects 3000 cm and fractional values with a meaningful field error', () => {
  for (const height of [3000, 0, -1, 200.5, NaN]) {
    assert.match(propertyUpdateErrors({ version: 7, vehicleHeightLimitCm: height }).vehicleHeightLimitCm, /whole number between 1 and 1000 cm/);
  }
  for (const height of [1, 300, 1000, null]) {
    assert.deepEqual(propertyUpdateErrors({ version: 7, vehicleHeightLimitCm: height }), {});
  }
});

test('required property fields reject blank/short edits; optional clearing remains allowed', () => {
  assert.ok(propertyUpdateErrors({ version: 7, name: null }).name);
  assert.ok(propertyUpdateErrors({ version: 7, publicArea: 'x' }).publicArea);
  assert.deepEqual(propertyUpdateErrors({ version: 7, accessInstructions: null }), {});
});

test('backend validation details identify the failed field instead of the generic message', () => {
  const error = new ApiError('Request validation failed', 400, 'VALIDATION_ERROR', undefined, { 'body.vehicleHeightLimitCm': ['Must be at most 1000 cm'] });
  assert.deepEqual(getApiValidationErrors(error), { vehicleHeightLimitCm: 'Must be at most 1000 cm' });
  assert.match(getApiErrorMessage(error), /vehicle Height Limit Cm: Must be at most 1000 cm/);
  assert.equal(getApiErrorMessage(new ApiError('Request validation failed', 400, 'VALIDATION_ERROR')), 'Please check the form fields and try again.');
  assert.deepEqual(getApiValidationErrors(new ApiError('Unavailable', 503)), {});
});
