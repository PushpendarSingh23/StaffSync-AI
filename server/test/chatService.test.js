import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { scoreToConfidence } from '../services/chatService.js';
import { config } from '../config/serverConfig.js';

describe('scoreToConfidence', () => {
  test('scores at or above the high threshold are "high"', () => {
    assert.equal(scoreToConfidence(config.highConfidence), 'high');
    assert.equal(scoreToConfidence(0.99), 'high');
    assert.equal(scoreToConfidence(1), 'high');
  });

  test('scores between medium and high thresholds are "medium"', () => {
    assert.equal(scoreToConfidence(config.mediumConfidence), 'medium');
    assert.equal(scoreToConfidence(config.highConfidence - 0.001), 'medium');
  });

  test('scores below the medium threshold are "low"', () => {
    assert.equal(scoreToConfidence(config.mediumConfidence - 0.001), 'low');
    assert.equal(scoreToConfidence(0), 'low');
  });
});
