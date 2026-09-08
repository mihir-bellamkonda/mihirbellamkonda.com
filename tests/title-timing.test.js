import test from 'node:test';
import assert from 'node:assert/strict';
import { titleRowProgress } from '../src/title-timing.js';

test('only one title row can be writing at a time, in reading order', () => {
  const lines = ['My Mentorship', 'Problem'];
  for (let frame = 0; frame <= 100; frame++) {
    const rows = titleRowProgress(lines, frame / 100);
    assert.ok(rows.filter(value => value > 0 && value < 1).length <= 1);
    if (rows[1] > 0) assert.equal(rows[0], 1);
  }
  assert.deepEqual(titleRowProgress(lines, 0), [0, 0]);
  assert.deepEqual(titleRowProgress(lines, 1), [1, 1]);
});

test('the title clock stays bounded and gives a longer row more writing time', () => {
  assert.deepEqual(titleRowProgress(['AA', 'B'], 0.5), [0.75, 0]);
  assert.deepEqual(titleRowProgress(['AA', 'B'], -1), [0, 0]);
  assert.deepEqual(titleRowProgress(['AA', 'B'], 2), [1, 1]);
  assert.deepEqual(titleRowProgress([], 1), []);
});
