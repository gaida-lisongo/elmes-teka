import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
const exports = {};
const source = readFileSync(new URL('../../src/lib/payments/plans.ts', import.meta.url), 'utf8');
vm.runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, { exports, Object, Date, Error });
const { PLANS, isPlan, upgradePrice } = exports;
const start = new Date('2026-01-01T00:00:00Z');
const end = new Date('2027-01-01T00:00:00Z');
const half = new Date((start.getTime() + end.getTime()) / 2);
test('catalogue et validation des entrées non fiables', () => {
  assert.equal(Object.values(PLANS).map(p => p.annualUsd).join(","), "50,120,200");
  for (const value of ['__proto__', 'constructor', 'starter', null, 50]) assert.equal(isPlan(value), false);
});
test('prorata, changements successifs et bornes', () => {
  assert.equal(upgradePrice('STARTER', 'BUSINESS', start, end, half), 35);
  assert.equal(upgradePrice('STARTER', 'PREMIUM', start, end, half), 75);
  assert.equal(upgradePrice('BUSINESS', 'PREMIUM', start, end, half), 40);
  assert.throws(() => upgradePrice('STARTER', 'BUSINESS', start, end, new Date('2025-12-01')));
  assert.throws(() => upgradePrice('STARTER', 'BUSINESS', start, end, end));
  assert.throws(() => upgradePrice('PREMIUM', 'BUSINESS', start, end, half));
  assert.throws(() => upgradePrice('BUSINESS', 'BUSINESS', start, end, half));
});

test('dates invalides, année bissextile et arrondi au centime', () => {
  assert.throws(() => upgradePrice('STARTER', 'BUSINESS', new Date('invalid'), end, half));
  assert.throws(() => upgradePrice('STARTER', 'BUSINESS', end, start, half));
  const leapStart = new Date('2028-01-01T00:00:00Z');
  const leapEnd = new Date('2029-01-01T00:00:00Z');
  const leapHalf = new Date((leapStart.getTime() + leapEnd.getTime()) / 2);
  assert.equal(upgradePrice('STARTER', 'PREMIUM', leapStart, leapEnd, leapHalf), 75);
  assert.equal(upgradePrice('STARTER', 'BUSINESS', start, end, start), 70);
  const third = new Date(start.getTime() + (end.getTime() - start.getTime()) / 3);
  assert.equal(upgradePrice('STARTER', 'BUSINESS', start, end, third), 46.67);
});
