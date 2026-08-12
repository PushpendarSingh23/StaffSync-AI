import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { rerankChunks } from '../services/rerankService.js';
import { config } from '../config/serverConfig.js';

// These tests avoid triggering an actual model load (which needs a network
// call on first run to download the ONNX weights) — they only exercise the
// code paths that don't touch the cross-encoder itself.

describe('rerankChunks', () => {
  test('returns the input unchanged when there are no chunks', async () => {
    const result = await rerankChunks('any question', [], 5);
    assert.deepEqual(result, []);
  });

  test('when rerank is disabled, truncates to topN in original order without loading a model', async () => {
    const original = config.rerankEnabled;
    config.rerankEnabled = false;
    try {
      const chunks = [
        { text: 'a', score: 0.5 },
        { text: 'b', score: 0.9 },
        { text: 'c', score: 0.1 },
      ];
      const result = await rerankChunks('any question', chunks, 2);
      assert.deepEqual(result, chunks.slice(0, 2));
      assert.equal(result.some((c) => 'rerankScore' in c), false);
    } finally {
      config.rerankEnabled = original;
    }
  });
});
