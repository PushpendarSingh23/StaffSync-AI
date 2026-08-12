import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { normaliseKey, get, set, invalidate, size } from '../services/answerCache.js';

describe('normaliseKey', () => {
  test('lowercases and trims', () => {
    assert.equal(normaliseKey('  How Many Sick Days?  '), 'how many sick days?');
  });

  test('collapses internal whitespace', () => {
    assert.equal(normaliseKey('what   is   the   wfh   policy'), 'what is the wfh policy');
  });
});

describe('answer cache get/set/invalidate', () => {
  test('a cache miss returns undefined', async () => {
    await invalidate();
    const result = await get('a question nobody asked yet');
    assert.equal(result, undefined);
  });

  test('set then get returns the stored value', async () => {
    await invalidate();
    const value = { answer: 'You get 12 paid sick days.', sources: [], confidence: 'high' };
    await set('How many sick days do I get?', value);

    const result = await get('  how many sick days do i get?  ');
    assert.deepEqual(result, value);
  });

  test('invalidate clears all entries', async () => {
    await set('question one', { answer: 'a' });
    await set('question two', { answer: 'b' });
    assert.ok(size() >= 2);

    await invalidate();
    assert.equal(size(), 0);
    assert.equal(await get('question one'), undefined);
  });
});
