import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import ts from 'typescript';

let source = await readFile(new URL('../lib/listing-payload.ts', import.meta.url), 'utf8');
for (const name of ['listing-details', 'listing-overtime', 'payout-amount']) {
  source = source.replaceAll(`"@/lib/${name}"`, JSON.stringify(new URL(`../lib/${name}.ts`, import.meta.url).href));
}
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2020 } }).outputText;
const { listingPayload, paisaToBDTInput } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);

function form(changes = {}) {
  const data = new FormData();
  for (const [key, value] of Object.entries({ title: ' Test parking ', description: '', hourlyRate: '12.34', deposit: '0', minimum: '60', maximum: '720', overtimeMultiplier: '1.2345', overtimeGrace: '5', ...changes })) data.set(key, value);
  return data;
}

test('location disclosure is explicit and unrelated forms preserve existing consent', () => {
  assert.equal(Object.hasOwn(listingPayload(form(), 'MULTIPLIER', ['SEDAN']), 'discloseLocationBeforePayment'), false);
  assert.equal(listingPayload(form({ discloseLocationBeforePayment: 'on' }), 'MULTIPLIER', ['SEDAN']).discloseLocationBeforePayment, true);
  assert.equal(listingPayload(form({ discloseLocationBeforePayment: '' }), 'MULTIPLIER', ['SEDAN']).discloseLocationBeforePayment, false);
});

test('actual Provider listing payload keeps exact money, fixed five-minute grace and cleared description', () => {
  const payload = listingPayload(form({ deposit: '90071992547409.93' }), 'MULTIPLIER', ['SEDAN']);
  assert.equal(payload.pricePerHourPaisa, '1234');
  assert.equal(payload.securityDepositPaisa, '9007199254740993');
  assert.equal(payload.description, '');
  assert.equal(payload.overtimeMultiplierBps, 12345);
  assert.equal(payload.overtimeGracePeriodMinutes, 5);
  assert.equal(paisaToBDTInput('9007199254740993'), '90071992547409.93');
  const fixed = listingPayload(form({ overtimeRate: '123.45' }), 'FIXED_PER_HOUR', ['SEDAN']);
  assert.equal(fixed.overtimeMultiplierBps, null);
  assert.equal(fixed.overtimeRatePerHourPaisa, '12345');
});

test('actual Provider payload rejects invalid amounts and duration before a request', () => {
  for (const changes of [{ hourlyRate: '12.345' }, { hourlyRate: '0' }, { deposit: '-1' }, { deposit: '1e2' }, { deposit: '' }, { minimum: '800', maximum: '720' }, { maximum: '' }, { overtimeGrace: '' }, { overtimeMultiplier: '5.0001' }]) {
    assert.throws(() => listingPayload(form(changes), 'MULTIPLIER', ['SEDAN']));
  }
  assert.throws(() => listingPayload(form({ overtimeRate: '0.99' }), 'FIXED_PER_HOUR', ['SEDAN']));
});

test('Manager creation accepts API duration boundaries without treating blanks as zero', () => {
  const payload = listingPayload(form({ minimum: '15', maximum: '15', overtimeGrace: '5' }), 'MULTIPLIER', ['SEDAN']);
  assert.equal(payload.minDurationMinutes, 15);
  assert.equal(payload.maxDurationMinutes, 15);
  assert.equal(payload.overtimeGracePeriodMinutes, 5);
  for (const changes of [{ title: 'x' }, { minimum: '' }, { maximum: '10081' }, { minimum: '1441' }, { overtimeGrace: '' }, { overtimeGrace: '181' }]) {
    assert.throws(() => listingPayload(form(changes), 'MULTIPLIER', ['SEDAN']));
  }
});
