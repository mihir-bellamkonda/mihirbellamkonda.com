import test from 'node:test';
import assert from 'node:assert/strict';
import matter from 'gray-matter';
import { nextNumber, fileNameFor, frontMatter } from '../scripts/new-poem.js';

test('a new poem takes a number no filename or kept catalogue number has used', () => {
  assert.equal(nextNumber([]), 1);
  assert.equal(nextNumber([
    { file: '00-The Carpenter.md', data: { catalogue: 19 } },
    { file: '16a-Thuragnosia.md', data: {} },
    { file: '32-Atlas.md', data: { catalogue: 24 } }
  ]), 33);
  assert.equal(nextNumber([{ file: '05-Moved.md', data: { catalogue: 40 } }]), 41);
});

test('the filename keeps the title as written, minus what a filesystem refuses', () => {
  assert.equal(fileNameFor(33, 'The Tailors'), '33-The Tailors.md');
  assert.equal(fileNameFor(7, 'Thuragnosia: Parable  of the Man'), '07-Thuragnosia Parable of the Man.md');
});

test('front matter parses back to what was asked for', () => {
  const unpublished = matter(frontMatter({ title: 'Song "for" L.', date: '2026-09-28' })).data;
  assert.equal(unpublished.title, 'Song "for" L.');
  assert.equal(unpublished.unpublished, true);
  assert.equal(unpublished.published_in, undefined);

  const published = matter(frontMatter({
    title: 'Atlas', date: '2026-09-28', venue: 'matchbook', url: 'https://example.com/atlas'
  })).data;
  assert.equal(published.published_in, 'matchbook');
  assert.equal(published.external_url, 'https://example.com/atlas');
  assert.equal(published.unpublished, undefined);
});
