import test from 'node:test';
import assert from 'node:assert/strict';
import { ghost, rngFor, writingPlan } from '../src/asemic.js';

const POEM = `You have to kill the baby bird with the shovel.
The dog with tail wagging at novelty has taken it
beyond its body's ability to repair.

It stutters movement, globular eyes throbbing,
the abraded throat in faint peristalsis.`;

const write = (options = {}) =>
  ghost(POEM, { rng: rngFor('test'), x: 0, width: 320, height: 260, ...options });

test('the same seed writes the same marks, for every reader, forever', () => {
  const first = ghost(POEM, { rng: rngFor('mercy'), x: 0, width: 320, height: 260 });
  const second = ghost(POEM, { rng: rngFor('mercy'), x: 0, width: 320, height: 260 });
  assert.deepEqual(first, second);
  assert.notDeepEqual(
    first,
    ghost(POEM, { rng: rngFor('dallas'), x: 0, width: 320, height: 260 })
  );
});

test('a slow hand and a hurried one are not the ordinary hand', () => {
  const ordinary = JSON.stringify(write());
  assert.notEqual(JSON.stringify(write({ temper: -0.8 })), ordinary);
  assert.notEqual(JSON.stringify(write({ temper: 0.8 })), ordinary);
});

test('every mark knows what the pen did just before it', () => {
  const strokes = write();
  assert.ok(strokes.length > 0);
  for (const stroke of strokes) {
    assert.ok(
      ['letter', 'word', 'line'].includes(stroke.gap),
      `unknown boundary: ${stroke.gap}`
    );
  }
  const kinds = new Set(strokes.map(s => s.gap));
  assert.ok(kinds.has('word'), 'no word boundaries were marked');
  assert.ok(kinds.has('line'), 'no line boundaries were marked');
});

test('the plan runs forwards, in seconds, and never doubles back', () => {
  const strokes = write();
  const plan = writingPlan(strokes);

  assert.equal(plan.spans.length, strokes.length);
  assert.ok(plan.total > 0 && Number.isFinite(plan.total));

  let previous = -1;
  for (const span of plan.spans) {
    if (!span) continue;
    assert.ok(span.start >= previous, 'a stroke begins before the one before it ends');
    for (let i = 1; i < span.marks.length; i++) {
      assert.ok(span.marks[i] >= span.marks[i - 1], 'a stroke doubles back through time');
    }
    previous = span.start + span.length;
  }
  assert.ok(previous <= plan.total + 1e-9);
});

test('the pen rests longest between lines and least inside a word', () => {
  const strokes = write();
  const plan = writingPlan(strokes);
  const rests = { letter: [], word: [], line: [] };

  for (let i = 1; i < strokes.length; i++) {
    const span = plan.spans[i];
    const before = plan.spans[i - 1];
    if (!span || !before) continue;
    rests[strokes[i].gap].push(span.start - (before.start + before.length));
  }

  const mean = list => list.reduce((a, b) => a + b, 0) / list.length;
  assert.ok(rests.letter.length && rests.word.length && rests.line.length);
  assert.ok(mean(rests.word) > mean(rests.letter) * 5, 'word gaps are not a real pause');
  assert.ok(mean(rests.line) > mean(rests.word), 'a line return should cost the most');
  // The pause a reader is meant to see, in the marks short enough to watch.
  assert.ok(mean(rests.word) > 0.06, `word pause is only ${mean(rests.word)}s`);
});

test('a single-line mark never writes outside the box it was given', () => {
  // The row signature is the tight case: twenty-six pixels of canvas, a hand
  // that drifts, and an ascender that once came through the top of it.
  for (const height of [20, 26, 34, 60]) {
    for (const seed of ['mercy', 'circling-figures', 'the-horse', 'epiphany', 'dallas']) {
      const strokes = ghost(POEM, {
        rng: rngFor(`${seed}::sig`), x: 0, width: 257, height, maxLines: 1
      });
      for (const stroke of strokes) {
        for (const [, y] of stroke.pts) {
          assert.ok(
            y >= 0 && y <= height,
            `${seed} at ${height}px: the hand reached ${y.toFixed(2)}`
          );
        }
      }
    }
  }
});

/** A canvas that keeps no pixels and counts what it was asked to draw. */
function tally() {
  let strokes = 0;
  return {
    strokes: () => strokes,
    set lineCap(v) {}, set lineJoin(v) {}, set strokeStyle(v) {}, set lineWidth(v) {},
    beginPath() {}, moveTo() {}, lineTo() {}, stroke() { strokes++; }
  };
}

test('the write-on reveals the marks forwards and arrives at all of them', async () => {
  // palette() reads CSS variables off the document, which only exists in a browser.
  globalThis.document = { documentElement: {} };
  globalThis.getComputedStyle = () => ({ getPropertyValue: () => '35,33,28' });
  const { paint, paintProgress } = await import('../src/asemic.js');

  const strokes = write();
  const plan = writingPlan(strokes);

  const nothing = tally();
  paintProgress(nothing, strokes, plan, 0);
  assert.equal(nothing.strokes(), 0, 'the pen had already written at t=0');

  let last = 0;
  for (let t = 0.1; t <= 1.0001; t += 0.1) {
    const at = tally();
    paintProgress(at, strokes, plan, t);
    assert.ok(at.strokes() >= last, `the marks went backwards at t=${t.toFixed(1)}`);
    last = at.strokes();
  }

  const whole = tally();
  paint(whole, strokes);
  assert.equal(last, whole.strokes(), 'the write-on ends short of the finished marks');
});
