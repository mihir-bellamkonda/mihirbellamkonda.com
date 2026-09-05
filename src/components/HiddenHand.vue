<template>
  <div class="hidden-hand" @click="leave" @keydown.esc="leave" tabindex="-1">
    <h1 class="sr-only" data-page-heading tabindex="-1">The hand, writing</h1>

    <div class="field">
      <AsemicMarks
        :text="text"
        :seed="seed"
        :max-lines="0"
        :ceiling="0"
      />
    </div>
  </div>
</template>

<script setup>
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
 * and nowhere else, and the writing takes exactly as long as it takes. The
 * gain is not only the length but the rests inside it — a tenth of a second
 * between words, near half a second off the end of a stanza — which are what
 * compression flattens first.
 */

// Lines from across the whole book rather than from one poem, so what fills
// the page is the book itself rather than any poem in it. Long enough to
// reach the bottom of a tall screen at a size worth looking at; the fitter
// takes it from there.
const LINES = 30;

const all = poems.flatMap(poem =>
  String(poem.content || '')
    .split('\n')
    .map(line => line.replace(/[*_#]/g, '').trim())
    .filter(line => line.length > 12)
);

const start = Math.floor(Math.random() * Math.max(1, all.length - LINES));
const text = all.slice(start, start + LINES).join('\n');
const seed = 'hand-' + start;

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
