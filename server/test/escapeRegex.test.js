import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import escapeRegex from '../utils/escapeRegex.js';

describe('escapeRegex', () => {
  test('escapes regex metacharacters', () => {
    assert.equal(escapeRegex('a.b*c?'), 'a\\.b\\*c\\?');
  });

  test('escapes parentheses and brackets', () => {
    assert.equal(escapeRegex('(hr) [policy]'), '\\(hr\\) \\[policy\\]');
  });

  test('leaves plain alphanumeric text untouched', () => {
    assert.equal(escapeRegex('leave policy 2026'), 'leave policy 2026');
  });

  test('a malicious-looking search string is safely neutralised', () => {
    const input = 'employee (a+)+$ search';
    const escaped = escapeRegex(input);
    // Should not throw and should match itself literally when used in a RegExp
    const re = new RegExp(escaped, 'i');
    assert.ok(re.test(input));
  });
});
