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
      ['letter', 'word', 'caught', 'line', 'stanza'].includes(stroke.gap),
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
  const rests = {};

  for (let i = 1; i < strokes.length; i++) {
    const span = plan.spans[i];
    const before = plan.spans[i - 1];
    if (!span || !before) continue;
    // Built from what the marks actually carry rather than from a list written
    // here, so a new kind of boundary shows up as a failing ordering rather
    // than as a crash on an absent bucket.
    (rests[strokes[i].gap] ??= []).push(span.start - (before.start + before.length));
  }

  const mean = list => list.reduce((a, b) => a + b, 0) / list.length;
  assert.ok(rests.letter?.length && rests.word?.length && rests.line?.length);
  assert.ok(mean(rests.word) > mean(rests.letter) * 5, 'word gaps are not a real pause');
  assert.ok(mean(rests.line) > mean(rests.word), 'a line return should cost the most');
  // The pause a reader is meant to see, in the marks short enough to watch.
  assert.ok(mean(rests.word) > 0.06, `word pause is only ${mean(rests.word)}s`);

  // The two rare ones. A hand comes off the end of a stanza and does not start
  // the next one at once, and now and then it stops mid-line for no reason the
  // page records. Both are rare by design, so this only checks the ordering
  // where the poem happened to produce them.
  if (rests.stanza?.length) {
    assert.ok(
      mean(rests.stanza) > mean(rests.line),
      'a stanza break should rest longer than a line return'
    );
  }
  if (rests.caught?.length) {
    assert.ok(
      mean(rests.caught) > mean(rests.word),
      'a mid-line catch should rest longer than an ordinary word gap'
    );
  }
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
    beginPath() {}, moveTo() {}, lineTo() {}, quadraticCurveTo() {}, stroke() { strokes++; }
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

test('the hand the site had before the notebook is still reachable', () => {
  // Faithful and beautiful are different axes. The plain hand is the way back,
  // and an escape hatch nobody exercises is an escape hatch that has rotted.
  const options = { rng: rngFor('mercy'), x: 0, width: 320, height: 260 };
  const notebook = ghost(POEM, { ...options, hand: 'notebook' });
  const plain = ghost(POEM, { ...options, hand: 'plain' });

  assert.ok(plain.length > 0, 'the plain hand wrote nothing');
  assert.notDeepEqual(notebook, plain);
  // It joined its points with straight lines, and that is most of what made it
  // read as drawn rather than written.
  assert.ok(plain.every(s => s.curve === false), 'the plain hand went curved');
  assert.ok(notebook.every(s => s.curve === true), 'the notebook hand went straight');
  // It also lifted the pen far more often, so it makes many more strokes.
  //
  // Measured over a spread of seeds rather than on one. The ratio is genuinely
  // seed-dependent — across the corpus it runs from 1.10 to 1.48 — so a single
  // draw against a 1.2 threshold was a coin flip that happened to be landing
  // heads, and it started failing the moment an unrelated change shifted the
  // random stream by two draws. What the lift rates actually promise is that
  // the plain hand lifts more every time, and appreciably more on average.
  const ratios = [];
  for (let i = 0; i < 40; i++) {
    const each = { x: 0, width: 320, height: 260 };
    const n = ghost(POEM, { ...each, rng: rngFor(`lift${i}`), hand: 'notebook' }).length;
    const p = ghost(POEM, { ...each, rng: rngFor(`lift${i}`), hand: 'plain' }).length;
    ratios.push(p / n);
  }
  const worst = Math.min(...ratios);
  const average = ratios.reduce((a, b) => a + b, 0) / ratios.length;
  assert.ok(worst > 1, `the plain hand made no more strokes on some seed (${worst.toFixed(3)})`);
  assert.ok(average > 1.15, `plain/notebook averaged only ${average.toFixed(3)} — the lift rate is not taking effect`);
});

test('a letter is never made the same way twice, so the writing stays unreadable', () => {
  // The one thing these marks must not be is legible. What keeps them illegible
  // is not bad letterforms — it is letters landing on top of one another, and
  // the e landing on the o above all. Giving six letters their true shapes
  // pulled them apart far enough that sentences came back off the page, and the
  // fix was to make a traced form what the hand reaches for rather than what it
  // always lands on. This is that fix, held in place.
  const G = 10;
  const raster = (letter, i) => {
    const strokes = ghost(letter, {
      rng: rngFor(`${letter}#${i}`), x: 0, width: 600, height: 300,
      size: 60, maxLines: 1, temper: 0
    });
    const points = strokes.flatMap(s => s.pts);
    if (!points.length) return null;
    const xs = points.map(p => p[0]);
    const ys = points.map(p => p[1]);
    const x0 = Math.min(...xs), y0 = Math.min(...ys);
    const w = Math.max(1e-6, Math.max(...xs) - x0);
    const h = Math.max(1e-6, Math.max(...ys) - y0);
    const cells = new Array(G * G).fill(0);
    for (const s of strokes) {
      for (let j = 1; j < s.pts.length; j++) {
        const a = s.pts[j - 1], b = s.pts[j];
        for (let t = 0; t <= 1; t += 0.1) {
          const gx = Math.min(G - 1, Math.floor((a[0] + (b[0] - a[0]) * t - x0) / w * G));
          const gy = Math.min(G - 1, Math.floor((a[1] + (b[1] - a[1]) * t - y0) / h * G));
          cells[gy * G + gx]++;
        }
      }
    }
    const norm = Math.sqrt(cells.reduce((s, v) => s + v * v, 0)) || 1;
    return cells.map(v => v / norm);
  };
  const apart = (a, b) => Math.sqrt(a.reduce((s, v, i) => s + (v - b[i]) ** 2, 0));

  const bank = {};
  for (const letter of ['e', 'o', 'a']) {
    bank[letter] = [];
    for (let i = 0; i < 14; i++) {
      const r = raster(letter, i);
      if (r) bank[letter].push(r);
    }
  }

  const mean = list => list.reduce((a, b) => a + b, 0) / list.length;
  const spread = letter => {
    const d = [];
    for (let i = 0; i < bank[letter].length; i++)
      for (let j = i + 1; j < bank[letter].length; j++) d.push(apart(bank[letter][i], bank[letter][j]));
    return mean(d);
  };
  const between = (a, b) => {
    const d = [];
    for (const p of bank[a]) for (const q of bank[b]) d.push(apart(p, q));
    return mean(d);
  };

  // An e that is reliably further from an o than one e is from another e is an
  // e a reader can pick out, and once the vowels separate the sentences return.
  //
  // The limit was 1.12 and is 1.18. It moved once, deliberately, when the lean
  // went out to -0.1 at the poet's request: a steeper backward lean tilts the
  // e's open side away from the a's bowl and the pair reads 1.14, where every
  // other dial moved at the same time left it at 1.12. Holding the number would
  // have meant refusing the lean, and the lean is the poet's call — so the gate
  // was relaxed knowingly rather than the change being dropped, and this note
  // exists so the next person can see it was a decision and not a drift.
  //
  // 1.18 rather than 1.15 so there is real room above the present value; a limit
  // sitting a hundredth above where the hand already is stops being a gate and
  // starts being a tripwire for noise. What it still catches is the thing it was
  // built for: a change that pulls the vowels properly apart and hands the
  // sentences back.
  //
  // It is a proxy either way. The actual standard is that a line cannot be read,
  // and that is checked by looking — see asemic-hand/reference/legibility.png.
  for (const other of ['o', 'a']) {
    const ratio = between('e', other) / ((spread('e') + spread(other)) / 2);
    assert.ok(
      ratio < 1.18,
      `e and ${other} have pulled apart (${ratio.toFixed(2)}); the writing is becoming readable`
    );
  }
  // And the hand must genuinely vary: one shape every time would be a font.
  assert.ok(spread('e') > 0, 'the e is drawn identically every time');
});

test('a th that ends its word keeps the h standing up', () => {
  // The shoulder is a connecting stroke. Of the seven `th` on the photographed
  // page, the five that run on into another letter are flattened into a single
  // gesture — the, that, father — and the two that end their word are not: both
  // spellings of `with` keep a full ascender on the h, because there is nothing
  // after it to reach for.
  //
  // The ligature takes a visible bite out of a word's width, so measuring the
  // narrowest rendering against the widest catches it. These words are chosen
  // because no *other* letter in them has a traced form, which makes the pair
  // the only thing that can vary: with the rule in place they sit around 0.75,
  // and with it removed they fall to 0.56-0.64.
  const spread = word => {
    let narrowest = Infinity;
    let widest = 0;
    for (let i = 0; i < 120; i++) {
      const strokes = ghost(word, {
        rng: rngFor(`${word}~${i}`), x: 0, width: 1e6, height: 400,
        size: 60, maxLines: 1, temper: 0
      });
      const xs = strokes.flatMap(s => s.pts.map(p => p[0]));
      const run = Math.max(...xs) - Math.min(...xs);
      if (run < narrowest) narrowest = run;
      if (run > widest) widest = run;
    }
    return narrowest / widest;
  };

  for (const word of ['path', 'cloth', 'faith', 'oath']) {
    assert.ok(
      spread(word) > 0.7,
      `${word}: the narrowest rendering is ${spread(word).toFixed(2)} of the widest — the h is being flattened at the end of a word`
    );
  }

  // And it must still happen where the h does run on, or the letterform is dead.
  const runsOn = ['the', 'other', 'that'].some(w => spread(w) < 0.7);
  assert.ok(runsOn, 'the th ligature never fires, even where the h connects onward');
});
