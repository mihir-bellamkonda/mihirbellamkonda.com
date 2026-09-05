<template>
  <div class="hidden-hand" @click="leave" @keydown.esc="leave" tabindex="-1">
    <h1 class="sr-only" data-page-heading tabindex="-1">The hand, writing</h1>

    <div class="field" :class="'is-' + showing">
      <div v-if="showing === 'angel'" class="angel-stack">
        <AngelusNovus />

        <div class="angel-word">
          <AsemicMarks :text="word" :seed="'angel-' + word" :max-lines="1" />
        </div>
      </div>

      <AsemicMarks
        v-else
        :text="text"
        :seed="seed"
        :max-lines="0"
        :ceiling="0"
        :stretch="showing === 'book' ? STRETCH : 1"
        :max-size="showing === 'words' ? WORD_SIZE : 16"
      />
    </div>
  </div>
</template>

<script setup>
import { defineAsyncComponent } from 'vue';
import AsemicMarks from './AsemicMarks.vue';
import poems from '../poems.json';

/**
 * A page with nothing on it, filling with writing nobody can read.
 *
 * Reached only by pressing the manicule on the index five times. It is not
 * linked, not in the sitemap, and not in the nav; `#hand` is guessable and
 * shareable, which is the right amount of secret for a thing whose only
 * content is a hand moving.
 *
 * Three things can be behind it, at five to one to one:
 *
 *   book    thirty lines of the book, filling the page illegibly
 *   words   seven words from the book, one to a line, written large
 *   angel   Klee's Angelus Novus, drawn in this site's ink
 *
 * The odds are the point rather than a detail of them. At five in seven the
 * page is what it has always been, so the other two are things a reader comes
 * upon rather than things the page shows them — and a reader who presses five
 * times again is not promised anything. Rarity is the only thing making them
 * worth arriving at; even odds would make this a menu.
 *
 * Two of the site's standing rules are deliberately not in force here.
 *
 * The marks everywhere else are seeded from a poem's slug so a signature is
 * identical for every reader forever — that rule is about a poem's own hand
 * and does not reach a page that belongs to no poem. Like the name page, this
 * is the house drawing from the hat: the choosing is random per visit, the
 * writing is not, so the same draw always comes out in the same hand.
 *
 * And the pace is the hand's own rather than the site's. This page ran for
 * two and a half minutes at a temper of -0.8, on the idea that a page reached
 * on purpose can be sat with; it could, and it was still slower than a pen
 * moves, which read as a stunt rather than as writing. Handing the timing
 * back to AsemicMarks then put it under the ordinary ceiling, which is nine
 * seconds — an eighth of what the writing costs, and over before a reader is
 * sure it began.
 *
 * Neither number was ever measured. The plan already holds the answer: this
 * page's thirty lines cost a little over a minute at pen speed, sixty to
 * eighty-five seconds depending on the screen. So the ceiling is lifted here
 * and nowhere else, and the writing takes as long as it takes, give or take
 * the STRETCH below.
 *
 * The gain is not only the length but the rests inside it — a tenth of a
 * second between words, near half a second off the end of a stanza — which
 * are what compression flattens first.
 */

// Forty kilobytes of traced contour behind a one-in-seven chance has no
// business in the bundle every reader downloads, so the angel is its own
// chunk and is fetched only on the visits it comes up.
const AngelusNovus = defineAsyncComponent(() => import('./AngelusNovus.vue'));

const roll = Math.floor(Math.random() * 7);
const showing = roll < 5 ? 'book' : (roll === 5 ? 'words' : 'angel');

// Lines from across the whole book rather than from one poem, so what fills
// the page is the book itself rather than any poem in it. Long enough to
// reach the bottom of a tall screen at a size worth looking at; the fitter
// takes it from there. Thirty lines of writing, and the stanza breaks
// between them are carried along on top rather than counted against it —
// budgeting them together bought the breaks by throwing away a quarter of
// the writing, which is paying for the shape of a page with the page.
const LINES = 30;

/**
 * Seven words, one to a line.
 *
 * The same hand as the book state and nothing else in common with it: seven
 * short lines in the same box make the fitter draw several times the size,
 * so what was a page of writing seen from across a room becomes a handful of
 * words seen close up. It is the only state where a reader can watch a single
 * letter being made.
 *
 * Drawn from every word in the book, four to nine letters, the same hat the
 * name page uses — long enough to be a word and short enough that seven of
 * them do not shrink each other.
 */
const WORD_ROWS = 7;

/**
 * How large "large" is.
 *
 * The fitter's house maximum is 16, which is right for a mark standing beside
 * something else and wrong for a page that is only writing: seven short lines
 * in a full-height box work out at about 38 by geometry, and the ceiling was
 * cutting that to 16 — seven words at the size of a caption, which is the one
 * thing this state is not for. 44 leaves the decision with the box on a tall
 * screen and stops the words growing absurd on a short one.
 */
const WORD_SIZE = 44;

/**
 * Holds the page at the pace it already had.
 *
 * Bringing the stanza breaks back put about eleven blank lines on the page,
 * and the fitter answers more lines by writing smaller — a quarter smaller,
 * here. Smaller writing is less ink, less ink is less time, and the page came
 * out at 53s where it had been 63s: a change made for the shape of the
 * writing had quietly sped it up.
 *
 * The ratio is the same wherever it is measured — 62.9→53.0, 72.6→61.1,
 * 58.7→49.5 across three window sizes, all of them 1.18 or 1.19 — because
 * both sides scale with the same ink. So the stretch is not a dial for how
 * slow the page ought to feel; it is the number that leaves that question
 * exactly where it was, while the writing underneath it changes.
 *
 * It belongs to the book state alone. The words state has no blank lines to
 * pay for, so stretching it would only be slowing it down.
 */
const STRETCH = 1.19;

/**
 * The book flattened to lines, blank ones kept.
 *
 * ghost() turns a blank line into a stanza gap, and coming off a stanza is
 * the longest rest the hand has — near half a second, against a tenth
 * between words. Dropping the blanks here meant the one page that is nothing
 * but handwriting was the one page that never took that rest.
 *
 * A short line is dropped, as before: it is a title or a leftover of
 * formatting, not a line of verse. It leaves no gap behind it, because a
 * line that was never a stanza break should not become one. Only a line that
 * was actually blank in the poem does that, and never two in a row.
 */
const all = [];
for (const poem of poems) {
  for (const raw of String(poem.content || '').split('\n')) {
    const line = raw.replace(/[*_#]/g, '').trim();
    if (line.length > 12) all.push(line);
    else if (!line && all.length && all[all.length - 1] !== '') all.push('');
  }
  // The end of a poem is a stanza break too — the widest one in the book.
  if (all.length && all[all.length - 1] !== '') all.push('');
}

let text = '';
let seed = '';
let word = '';

/** Every word in the book, four to nine letters — the name page's hat. */
function hat() {
  return [...new Set(
    poems
      .flatMap(poem => String(poem.content || '').split(/\s+/))
      .map(w => w
        .replace(/[*_]/g, '')
        .replace(/^[^\p{L}\p{N}']+|[^\p{L}\p{N}']+$/gu, ''))
      .filter(w => w.length >= 4 && w.length <= 9)
  )];
}

if (showing === 'book') {
  // Start on writing rather than on a gap, so the page does not open with the
  // hand already resting, and run to the last of LINES written lines — taking
  // whatever breaks fall between them.
  const written = all.map((line, i) => (line ? i : -1)).filter(i => i >= 0);
  const from = Math.floor(Math.random() * Math.max(1, written.length - LINES));
  const start = written[from] || 0;
  const end = written[Math.min(written.length - 1, from + LINES - 1)] || start;
  text = all.slice(start, end + 1).join('\n');
  seed = 'hand-' + start;
} else if (showing === 'words') {
  const bag = hat();
  const picked = [];
  const taken = new Set();
  while (picked.length < WORD_ROWS && taken.size < bag.length) {
    const i = Math.floor(Math.random() * bag.length);
    if (taken.has(i)) continue;
    taken.add(i);
    picked.push(bag[i]);
  }
  text = picked.join('\n');
  seed = 'words-' + picked.join('-');
} else {
  // One word under the angel, the size a label is rather than the size the
  // writing is — it names the figure the way a plate in a book is named, and
  // names it with something nobody can read.
  const bag = hat();
  word = bag[Math.floor(Math.random() * bag.length)] || 'analemma';
}

function leave() {
  // The way out is the way back. A hash route means the browser's own back
  // button already works; this is for a reader who arrived by pressing five
  // times and will leave by pressing once more.
  window.history.back();
}

</script>

<style scoped>
.hidden-hand {
  position: fixed;
  inset: 0;
  background: var(--a-bg);
  cursor: default;
}

.hidden-hand:focus {
  outline: none;
}

/* AsemicMarks is a bare <canvas> that sizes itself 100%/100% of whatever holds
   it, so it needs a parent with a size — putting the inset on the canvas made
   it circular, since a canvas with `width: auto` falls back to its own
   attribute width and the box it was meant to be measuring came out 1200
   where the inset said 1126. Every other caller gives it a sized parent; so
   does this one. The margin is the point: a page fills from inside its edges,
   the way a written page does. */
.field {
  position: absolute;
  inset: clamp(1.5rem, 6vw, 5rem);
}

/* The angel is one figure rather than a page of writing. It sits dead centre
   of the screen whatever shape the screen is, so the field is the whole
   viewport and the figure is placed in the middle of it rather than fitted
   into a margin — a margin centres what is left over, which is not the same
   thing.

   Its own box carries the drawing's proportions, so the figure is centred and
   the label hangs off the bottom of it without moving it. Putting the two in
   a column together would centre the pair and leave the angel sitting high. */
.field.is-angel {
  inset: 0;
  display: grid;
  place-items: center;
}

.angel-stack {
  position: relative;
  height: min(64vh, 620px);
  aspect-ratio: 217 / 440;
}

.angel-word {
  position: absolute;
  top: calc(100% + clamp(0.8rem, 2.2vh, 1.6rem));
  left: 50%;
  transform: translateX(-50%);
  width: min(52%, 132px);
  height: clamp(16px, 2.2vh, 26px);
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
</style>
