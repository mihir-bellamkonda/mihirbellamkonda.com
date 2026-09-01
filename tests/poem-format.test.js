import test from 'node:test';
import assert from 'node:assert/strict';
import { stanzaLines } from '../scripts/poem-format.js';

test('escapes source HTML', () => {
  assert.deepEqual(stanzaLines('a < b & c > d'), ['a &lt; b &amp; c &gt; d']);
});

test('closes and reopens multiline italics', () => {
  assert.deepEqual(stanzaLines('*first\nsecond*'), [
    '<em>first</em>',
    '<em>second</em>'
  ]);
});

test('renders poet-authored bold headers', () => {
  assert.deepEqual(stanzaLines('**Inventory**'), ['<strong>Inventory</strong>']);
});

test('keeps nested emphasis valid when an outer tag closes first', () => {
  assert.deepEqual(stanzaLines('*outer **inner* still bold**'), [
    '<em>outer <strong>inner</strong></em><strong> still bold</strong>'
  ]);
});

test('drops lines containing formatting markers only', () => {
  assert.deepEqual(stanzaLines('*\n*'), []);
});
