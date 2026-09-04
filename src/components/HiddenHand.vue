<template>
  <div class="hidden-hand" @click="leave" @keydown.esc="leave" tabindex="-1">
    <h1 class="sr-only" data-page-heading tabindex="-1">The hand, writing</h1>

    <div class="field">
      <AsemicMarks
        :text="text"
        :seed="seed"
        :temper="SLOW"
        :progress="progress"
        :max-lines="0"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import AsemicMarks from './AsemicMarks.vue';
import poems from '../poems.json';
import { prefersReducedMotion } from '../motion.js';

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
 * And the write-on everywhere else is capped at thirteen seconds, which is
 * the right length for a signature beside a poem and much too fast here. The
 * point is to fill slowly enough that a reader is not sure it is happening.
 * `progress` is driven by hand over FILL_MS instead.
 */

const SLOW = -0.8;
const FILL_MS = 150000;
const STEP_MS = 250;

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

const progress = ref(0);
let timer = null;
let began = 0;

/**
 * Stepped on a timer rather than on requestAnimationFrame.
 *
 * Every change to `progress` repaints the whole field, and the field here is
 * the whole page — at sixty frames a second over two and a half minutes that
 * is nine thousand repaints of a canvas several million pixels wide, to show
 * a hand that moves slower than a second hand. A quarter-second step is four
 * hundred times gentler and indistinguishable at this pace.
 *
 * Progress comes from the wall clock rather than from a tick count, so a tab
 * left in the background — where timers are throttled to about a second —
 * comes back to where the writing would have got to, not to where it stopped.
 */
function step() {
  progress.value = Math.min(1, (Date.now() - began) / FILL_MS);
  if (progress.value >= 1 && timer) {
    clearInterval(timer);
    timer = null;
  }
}

function leave() {
  // The way out is the way back. A hash route means the browser's own back
  // button already works; this is for a reader who arrived by pressing five
  // times and will leave by pressing once more.
  window.history.back();
}

onMounted(() => {
  // A reader asking for less movement is not asking to watch a page fill for
  // two and a half minutes. They get the finished page.
  if (prefersReducedMotion()) {
    progress.value = 1;
    return;
  }
  began = Date.now();
  timer = setInterval(step, STEP_MS);
});

onUnmounted(() => {
  if (timer) clearInterval(timer);
});
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
