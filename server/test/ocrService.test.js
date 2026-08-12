import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { isTextInsufficient } from '../utils/ocrService.js';

describe('isTextInsufficient', () => {
  test('flags empty text as insufficient', () => {
    assert.equal(isTextInsufficient(''), true);
  });

  test('flags null/undefined as insufficient', () => {
    assert.equal(isTextInsufficient(undefined), true);
  });

  test('flags whitespace-only text as insufficient', () => {
    assert.equal(isTextInsufficient('   \n\n  '), true);
  });

  test('flags text shorter than the threshold as insufficient', () => {
    assert.equal(isTextInsufficient('short'), true);
  });

  test('accepts text at or above the threshold', () => {
    assert.equal(isTextInsufficient('a'.repeat(200)), false);
  });
});
