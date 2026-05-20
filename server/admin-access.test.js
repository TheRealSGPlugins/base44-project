import test from 'node:test';
import assert from 'node:assert/strict';
import { verifyAdminCode } from './admin-access.js';

test('accepts a matching admin code', () => {
  assert.equal(verifyAdminCode('246810', '246810'), true);
});

test('rejects a mismatched admin code', () => {
  assert.equal(verifyAdminCode('246811', '246810'), false);
});

test('rejects a missing admin code', () => {
  assert.equal(verifyAdminCode('', '246810'), false);
});
