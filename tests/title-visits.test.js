import test from 'node:test';
import assert from 'node:assert/strict';
import { createTitleVisits } from '../src/title-visits.js';

function storage() {
  const values = new Map();
  return { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) };
}

test('title encounters survive reloads in one session without suppressing other poems', () => {
  const session = storage();
  const first = createTitleVisits(() => session);
  assert.equal(first.has('atlas'), false);
  first.mark('atlas');
  const reloaded = createTitleVisits(() => session);
  assert.equal(reloaded.has('atlas'), true);
  assert.equal(reloaded.has('gaps'), false);
  assert.equal(createTitleVisits(() => storage()).has('atlas'), false);
});

test('blocked session storage still remembers titles during navigation', () => {
  const visits = createTitleVisits(() => { throw new Error('Storage denied'); });
  assert.equal(visits.has('atlas'), false);
  visits.mark('atlas');
  assert.equal(visits.has('atlas'), true);
  assert.equal(visits.has('gaps'), false);
});

test('a full storage quota does not break title playback or its memory fallback', () => {
  const visits = createTitleVisits(() => ({
    getItem: () => null,
    setItem: () => { throw new Error('Quota exceeded'); }
  }));
  visits.mark('atlas');
  assert.equal(visits.has('atlas'), true);
});
