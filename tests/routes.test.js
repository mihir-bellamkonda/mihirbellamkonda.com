import test from 'node:test';
import assert from 'node:assert/strict';
import { parseRoute } from '../src/routes.js';

test('damaged URL escapes show a recovery page instead of crashing the site', () => {
  for (const value of ['%', '%2', '%GG', '%E0%A4%A', '%FF']) {
    assert.deepEqual(parseRoute({ hash: '#' + value }), { page: 'nothere' });
    assert.deepEqual(parseRoute({ pathname: '/poem/' + value + '/' }), { page: 'nothere' });
  }
});

test('normal, encoded, legacy and missing-page routes retain their destinations', () => {
  assert.deepEqual(parseRoute(), { page: 'about' });
  for (const hash of ['#index', '#contents', '#poems']) {
    assert.deepEqual(parseRoute({ hash }), { page: 'index' });
  }
  assert.deepEqual(parseRoute({ hash: '#hand' }), { page: 'hand' });
  assert.deepEqual(parseRoute({ hash: '#poem/00-The%20Carpenter' }), { page: 'poem', slug: '00-The Carpenter' });
  assert.deepEqual(parseRoute({ pathname: '/poem/my-mentorship-problem/' }), { page: 'poem', path: 'my-mentorship-problem' });
  assert.deepEqual(parseRoute({ pathname: '/poem/dallas/', hash: '#index' }), { page: 'index' });
  assert.deepEqual(parseRoute({ notHere: true, hash: '#index' }), { page: 'nothere' });
});
