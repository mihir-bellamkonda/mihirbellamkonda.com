<template>
  <div class="nothere">
    <div class="chrome">
      <a href="/">mihir bellamkonda</a>
      <a href="/#index">poems</a>
    </div>

    <main id="main" tabindex="-1">
      <h1 class="sr-only" data-page-heading tabindex="-1">Not here</h1>

      <div class="field">
        <AsemicMarks
          :text="text"
          :seed="seed"
          :temper="SLOW"
          :progress="progress"
          :max-lines="0"
        />
      </div>
    </main>

    <p class="ways">
      <a href="/#index">the index</a>
      <a href="/">the opening</a>
    </p>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import AsemicMarks from './AsemicMarks.vue';
import poems from '../poems.json';
import { prefersReducedMotion } from '../motion.js';

/**
 * The page that is not here, writing itself.
 *
 * A 404 is the one page on this site with nothing to say, and it used to say
 * it in words — a heading, an apology, two links. The book already has a way
 * of saying something illegibly, and this is the place for it: the hand
 * writes over the missing page while the reader decides where to go instead.
 *
 * The two links stay. A reader who has landed somewhere that does not exist
 * needs a way out more than they need a mark, so the chrome and the ways out
 * are ordinary text, above and below the field, and they are the first thing
 * a screen reader meets. The hand is aria-hidden like every other mark.
 *
 * Faster than `#hand`, which is a place a reader chose to go and can sit in
 * for two and a half minutes. Nobody chose to come here.
 */

const SLOW = -0.4;
const FILL_MS = 22000;
const STEP_MS = 200;
const LINES = 14;

// The book bleeding through the page that is not there. Random per visit
// like the name page, since this page belongs to no poem; the writing itself
// is still fixed to whatever was drawn.
const all = poems.flatMap(poem =>
  String(poem.content || '')
    .split('\n')
    .map(line => line.replace(/[*_#]/g, '').trim())
    .filter(line => line.length > 12)
);

const start = Math.floor(Math.random() * Math.max(1, all.length - LINES));
const text = all.slice(start, start + LINES).join('\n');
const seed = 'nothere-' + start;

const progress = ref(0);
let timer = null;
let began = 0;

function step() {
  progress.value = Math.min(1, (Date.now() - began) / FILL_MS);
  if (progress.value >= 1 && timer) {
    clearInterval(timer);
    timer = null;
  }
}

onMounted(() => {
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
.nothere {
  min-height: 100vh;
  background: var(--a-bg);
  display: flex;
  flex-direction: column;
  padding: clamp(1.4rem, 4vw, 2.4rem) clamp(1.25rem, 5vw, 4.5rem) clamp(2rem, 5vw, 3.5rem);
}

.chrome {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 1.5rem;
  font-family: var(--f-cat);
  font-size: 0.64rem;
  letter-spacing: 0.18em;
  color: var(--a-faint);
}

.chrome a {
  color: var(--a-faint);
  text-decoration: none;
  border-bottom: 1px solid transparent;
}

.chrome a:hover {
  color: var(--accent);
  border-bottom-color: var(--accent);
}

main {
  flex: 1;
  min-height: 0;
  display: flex;
}

main:focus {
  outline: none;
}

/* AsemicMarks sizes its canvas to whatever holds it, so the field is what
   decides how much room the writing gets. */
.field {
  flex: 1;
  min-height: clamp(14rem, 52vh, 34rem);
  margin: clamp(1.5rem, 5vw, 3rem) 0;
}

.ways {
  display: flex;
  gap: 2rem;
  flex-wrap: wrap;
  margin: 0;
  font-family: var(--f-cat);
  font-size: 0.64rem;
  letter-spacing: 0.18em;
}

.ways a {
  color: var(--a-ink-2);
  text-decoration: none;
  border-bottom: 1px solid var(--a-hair);
  padding-bottom: 0.15rem;
}

.ways a:hover {
  color: var(--accent);
  border-bottom-color: var(--accent);
}

@media (pointer: coarse) {
  .chrome a,
  .ways a {
    position: relative;
  }

  .chrome a::after,
  .ways a::after {
    content: '';
    position: absolute;
    left: 0;
    right: 0;
    top: 50%;
    height: 24px;
    transform: translateY(-50%);
  }
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
