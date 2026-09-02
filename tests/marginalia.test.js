import test from 'node:test';
import assert from 'node:assert/strict';
import { deckle, ruleMarks, marginMark } from '../src/marginalia.js';

const POEMS = [
  'the-gesture', 'summer', 'thuragnosia-parable-of-the-man-blind-to-doors',
  'questions-and-answers', 'the-dinner-party', 'mother-dreams-in-half-light',
  'in-of', 'mercy', 'up-above-my-head-i-hear-music-in-the-air', 'dallas',
  'new-orleans', 'circling-figures', 'the-horse', 'brahmanda', 'a-quiet-family',
  'old-man-at-dinner', 'the-carpenter', 'the-economy', 'epiphany',
  'love-outside-poems', 'musician-s-daughter'
];

function corners(polygon) {
  const inside = polygon.match(/^polygon\((.*)\)$/);
  assert.ok(inside, `not a polygon: ${polygon}`);
  return inside[1].split(',').map(pair => {
    const [x, y] = pair.trim().split(/\s+/).map(n => Number.parseFloat(n));
    assert.ok(Number.isFinite(x) && Number.isFinite(y), `bad point in ${polygon}`);
    return [x, y];
  });
}

const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
const straddles = (a, b, c, d) =>
  (cross(a, b, c) > 0) !== (cross(a, b, d) > 0) &&
  (cross(c, d, a) > 0) !== (cross(c, d, b) > 0);

/**
 * Whether the outline ever crosses itself.
 *
 * This is the test the folio wanted. A cut corner that gives up its two
 * vertices in the wrong order folds the outline back through itself, and CSS
 * renders that as a pinch — the sheet reads as a sweet wrapper rather than as
 * torn paper. It is invisible in the source and obvious on the screen, which
 * is the worst place to find it.
 */
function selfIntersects(points) {
  const n = points.length;
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      // Neighbouring edges share a vertex; they are allowed to touch.
      if (j === i || (j + 1) % n === i || (i + 1) % n === j) continue;
      if (straddles(points[i], points[(i + 1) % n], points[j], points[(j + 1) % n])) {
        return [i, j];
      }
    }
  }
  return null;
}

test('every sheet is torn as a simple outline, never folded through itself', () => {
  for (const poem of POEMS) {
    for (const layer of ['ground', 'primary', 'secondary', 'tertiary', 'trace']) {
      const points = corners(deckle(`${poem}::${layer}`, { steps: 5, tear: 2.6 }));
      assert.equal(
        selfIntersects(points),
        null,
        `${poem}/${layer}: the outline crosses itself`
      );
    }
  }
});

test('a tear stays within reach of the sheet it is tearing', () => {
  for (const poem of POEMS) {
    for (const [x, y] of corners(deckle(`${poem}::plate`, { steps: 5, tear: 2.6 }))) {
      assert.ok(x >= -3 && x <= 103, `${poem}: x out of range (${x})`);
      assert.ok(y >= -3 && y <= 103, `${poem}: y out of range (${y})`);
    }
  }
});

test('an open side is left whole so a mark can run off the paper', () => {
  for (const poem of POEMS) {
    const right = corners(deckle(`${poem}::large`, { steps: 4, tear: 2.4, open: 'right' }));
    assert.ok(
      Math.max(...right.map(p => p[0])) > 98,
      `${poem}: the open side was torn back from the edge`
    );

    const left = corners(deckle(`${poem}::large`, { steps: 4, tear: 2.4, open: 'left' }));
    assert.ok(
      Math.min(...left.map(p => p[0])) < 2,
      `${poem}: the open side was torn back from the edge`
    );
  }
});

test('a plate is torn the same way every time it is asked', () => {
  assert.equal(deckle('mercy::plate'), deckle('mercy::plate'));
  assert.notEqual(deckle('mercy::plate'), deckle('dallas::plate'));
});

test('a drawn rule is a path, and no two rules are the same line', () => {
  const first = ruleMarks('index::opening');
  assert.match(first, /^M[-\d.,\sQL]+$/);
  assert.equal(first, ruleMarks('index::opening'));
  assert.notEqual(first, ruleMarks('mercy::rule'));
});

test('a plate gets one mark, of a kind the stylesheet knows', () => {
  const kinds = new Set();
  for (const poem of POEMS) {
    const mark = marginMark(`${poem}::arrow`);
    assert.ok(['arrow', 'scribble', 'spiral', 'cross'].includes(mark.kind), mark.kind);
    assert.match(mark.d, /^M/);
    assert.match(mark.left, /%$/);
    assert.match(mark.top, /%$/);
    kinds.add(mark.kind);
  }
  // Not a distribution test — only that the folio is not all arrows.
  assert.ok(kinds.size > 1, 'every plate got the same kind of mark');
});
