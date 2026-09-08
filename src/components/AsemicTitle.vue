<template>
  <!--
    The title arrives in the hand that writes the rest of the site, and then
    becomes itself. The <h1> is always in the DOM and always the real text —
    it is what a screen reader reads, what a crawler indexes and what prints.
    All that changes is whether it can be seen yet, so nothing here can alter
    how the title is finally set.
  -->
  <div class="asemic-title" :class="{ resolved }">
    <h1 data-page-heading tabindex="-1">{{ title }}</h1>
    <div
      v-if="handWrites"
      class="title-hand"
      :style="{ '--row-h': rowHeight, '--row-squeeze': rowSqueeze }"
    >
      <AsemicMarks
        v-for="(line, i) in handLines"
        :key="`${playthrough}:${i}`"
        class="hand-row"
        :text="line"
        :seed="`${seed}::title::${i}`"
        :max-lines="1"
        :max-size="maxSize"
        :progress="rowProgress[i]"
        :sync-progress="true"
        :furniture="false"
      />
    </div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, onUnmounted, watch, nextTick } from 'vue';
import AsemicMarks from './AsemicMarks.vue';
import { prefersReducedMotion } from '../motion.js';
import { titleVisits } from '../title-visits.js';
import { TITLE_WRITE, TITLE_DWELL, titleRowProgress } from '../title-timing.js';

const props = defineProps({
  title: { type: String, required: true },
  seed: { type: String, required: true }
});

/**
 * How long the hand keeps the title, in two parts.
 *
 * All rows share one 1.1-second write-on in reading order, followed by a
 * 650ms pause with the complete mark. The old rows ran independently and
 * wrote several words at once; the new clock hands the pen from row to row.
 */

/**
 * And then it cuts.
 *
 * There was a cross-dissolve here and it was the wrong idea twice over: for
 * half a second the page carried a half-present hand over a half-present
 * serif, which is a third thing that is neither and reads as a smudge; and it
 * made a transition out of what is not one. The hand does not turn into the
 * type. It is the word, written, and then the word, set. One frame.
 *
 * The canvas is torn down a beat after the cut rather than on it, so the
 * unmount is never the thing a reader sees happen.
 */
const TEARDOWN = 60;

const reducedMotion = ref(prefersReducedMotion());
const resolved = ref(reducedMotion.value || titleVisits.has(props.seed));
const playthrough = ref(0);
// A reader who has asked for less movement gets the title and nothing else:
// no canvas is mounted at all, rather than one drawn and instantly hidden.
const handWrites = ref(false);
const maxSize = ref(72);
const handLines = ref([]);
const progress = ref(0);
const rowProgress = computed(() => titleRowProgress(handLines.value, progress.value));
const rowHeight = ref('200px');
const rowSqueeze = ref('0px');

/**
 * The title, broken the way the hand needs it rather than the way the type does.
 *
 * `fitSize` sizes a mark from the longest line it is given, so a title handed
 * over whole is sized by its whole length and a long one comes out small. It
 * also has two branches: one line is sized by width with height as a guardrail
 * (`height / 2.9`), and several lines are sized by height at `height /
 * ((rows + 0.9) * 2.95)`, which is nearly twice as tight per row. So a short
 * title goes over as one line to get the generous branch, and a long one is
 * broken into balanced lines to stop its own width shrinking it — and the box
 * grows with the row count so the tighter branch still has room.
 */
function breakForHand(title) {
  /*
   * A title with a colon in it is a name and then an explanation of the name,
   * and the hand writes the name. *Thuragnosia: Parable of the Man Blind to
   * Doors* set whole is four rows of writing standing in for a heading a
   * reader takes in as one word; written as `Thuragnosia` it is the heading.
   *
   * Then two rows, and then it stops. `fitSize` sizes a mark from its longest
   * row, so the split is chosen to make that row as short as it can be rather
   * than by filling each row in turn — filling leaves a long first row and a
   * short last one, and the long one is the one that decides the size.
   *
   * A title that still cannot make two rows at heading size is cut to its
   * opening, with no ellipsis and no mark of the cut: it is not an
   * abbreviation, it is as far as someone got. One poem in the book is cut.
   * The <h1> underneath always carries the title in full, so nothing a reader
   * reads or a crawler indexes is ever the short form.
   */
  const named = String(title).split(':')[0].trim() || String(title);
  const words = named.split(/\s+/).filter(Boolean);
  const chars = named.replace(/\s/g, '').length;

  // What a row holds at heading size. Past this the hand is drawing small.
  const PER_ROW = 13;
  // How much of a title survives the cut, before the trailing word is tidied.
  const KEEP = 16;
  const bare = list => list.join('').replace(/\s/g, '').length;

  if (words.length === 1 || chars <= 12) return [named];

  /** The two-row split whose longer row is shortest. */
  function balance(list) {
    let best = null;
    for (let i = 1; i < list.length; i++) {
      const a = list.slice(0, i);
      const b = list.slice(i);
      const worst = Math.max(bare(a), bare(b));
      if (!best || worst < best.worst) best = { worst, lines: [a.join(' '), b.join(' ')] };
    }
    return best;
  }

  const whole = balance(words);
  if (whole && whole.worst <= PER_ROW) return whole.lines;

  // Too long for two rows. Keep the opening, then let go of a trailing word
  // that is only holding the next one's hand — a title should not break on
  // "I" or "in" or "the".
  const kept = [];
  for (const w of words) {
    if (kept.length && bare([...kept, w]) > KEEP) break;
    kept.push(w);
  }
  while (kept.length > 2 && /^(?:[a-z']{1,2}|i|a|an|the|and|in|of|at|to|on|for|my)$/i.test(kept[kept.length - 1])) {
    kept.pop();
  }
  const cut = balance(kept);
  return cut ? cut.lines : [kept.join(' ')];
}

let timer = null;
let motionQuery = null;
let frame = null;
let mounted = false;

function settle() {
  clearTimeout(timer);
  cancelAnimationFrame(frame);
  handWrites.value = false;
  resolved.value = true;
}

function motionChanged(event) {
  reducedMotion.value = event.matches;
  if (event.matches) settle();
}

function sizeToHeading() {
  /*
   * This is only a ceiling, and it is deliberately above what the box will
   * allow — the box is what decides, because the box is what changes with the
   * screen.
   *
   * The first version set it at 0.62 of the type it stands in for and the
   * hand came out visibly smaller than the serif it was standing in for, which
   * read as a caption of the title rather than as the title. Two things were
   * wrong. The ceiling was one. The other was the box: the canvas was pinned
   * to the heading's exact rect, and a long title on one line in a rect that
   * tight is bound by its width, not by this number at all.
   */
  const el = document.querySelector('.asemic-title h1');
  if (!el) return;
  const px = parseFloat(getComputedStyle(el).fontSize) || 44;
  maxSize.value = Math.round(px * 1.9);
}

function begin() {
  clearTimeout(timer);
  cancelAnimationFrame(frame);
  const alreadySeen = titleVisits.has(props.seed);
  // Count the encounter even if the reader leaves before the writing finishes.
  titleVisits.mark(props.seed);
  if (reducedMotion.value || alreadySeen) {
    settle();
    return;
  }

  resolved.value = false;
  progress.value = 0;
  playthrough.value += 1;

  const lines = breakForHand(props.title);
  handLines.value = lines;
  sizeToHeading();

  /*
   * Every row is its own single-line mark rather than one mark of several
   * rows, and the reason is both size and place.
   *
   * `fitSize` has two branches. One line is sized by width with height as a
   * guardrail; several lines are sized by height at `height / ((rows + 0.9) *
   * 2.95)`, and the leading it then draws with scales with the size it just
   * chose — so buying a bigger letter by handing it a deeper box buys exactly
   * as much extra air between the rows, and the two lines of a title drift
   * half the margin apart. `settle()` does not rescue it either: it centres a
   * finished single-line mark in its box, and a column is deliberately left
   * where it was drawn, so the block also sat high in a box this deep.
   *
   * Stacked single-line marks take the generous branch for each row, get
   * centred in their own boxes, and leave the leading here — where it can be
   * a number of pixels off the heading's own line rather than a by-product of
   * how tall a box had to be to make the letters big.
   */
  const el = document.querySelector('.asemic-title h1');
  const line = el ? (parseFloat(getComputedStyle(el).lineHeight) || parseFloat(getComputedStyle(el).fontSize)) : 44;
  // A row's box is deeper than the ink it will hold: `fitSize` treats height
  // as a guardrail on a single-line mark and lets width choose, so this is the
  // ceiling being kept out of the way rather than the size itself.
  const box = line * 4.4;
  rowHeight.value = `${Math.round(box)}px`;
  // The box carries air the ink does not use. Pulling most of it back leaves
  // the rows a hand's leading apart instead of a fitter's, which is what makes
  // the two halves of a title read as one title rather than as two marks.
  rowSqueeze.value = `${Math.round(line * 1.1)}px`;

  handWrites.value = true;
  const currentPlay = playthrough.value;
  nextTick(() => {
    if (!mounted || resolved.value || playthrough.value !== currentPlay) return;
    let started = null;
    const advance = now => {
      if (started === null) started = now;
      progress.value = Math.min(1, (now - started) / TITLE_WRITE);
      if (progress.value < 1) {
        frame = requestAnimationFrame(advance);
      } else {
        timer = setTimeout(() => {
          resolved.value = true;
          timer = setTimeout(() => { handWrites.value = false; }, TEARDOWN);
        }, TITLE_DWELL);
      }
    };
    frame = requestAnimationFrame(advance);
  });
}

onMounted(() => {
  mounted = true;
  motionQuery = window.matchMedia?.('(prefers-reduced-motion: reduce)');
  motionQuery?.addEventListener('change', motionChanged);
  begin();
});
watch(() => props.seed, () => begin());
onUnmounted(() => {
  mounted = false;
  clearTimeout(timer);
  cancelAnimationFrame(frame);
  motionQuery?.removeEventListener('change', motionChanged);
});
</script>

<style scoped>
.asemic-title {
  position: relative;
  overflow: visible;
}

/* The heading holds the box. The canvas is laid over it, so the swap costs
   no reflow and the margin never jumps. */
.asemic-title :deep(h1) {
  font-family: var(--f-display);
  font-weight: 400;
  font-size: clamp(2.3rem, 5.6vw, 3.7rem);
  line-height: 1;
  margin: 0;
  text-wrap: balance;
  color: var(--a-ink);
  opacity: 0;
}

.asemic-title.resolved :deep(h1) {
  opacity: 1;
}

/* The stack is centred on the heading and its rows are pulled together. It
   is out of flow, so nothing here reflows and nothing is clipped; it bleeds
   over the number above and the provenance below, which is intended — the
   mark is brief and belongs over the page. */
.title-hand {
  position: absolute;
  top: 50%;
  left: -0.04em;
  transform: translateY(-50%);
  width: 136%;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  pointer-events: none;
  z-index: 1;
}

.hand-row {
  width: 100%;
  height: var(--row-h);
  margin-block: calc(-1 * var(--row-squeeze));
}

.asemic-title.resolved .title-hand {
  opacity: 0;
}

/* The bleed to the right is room borrowed from the verse column, and on a
   phone there is no verse column beside the heading to borrow from — the
   margin is the whole width, so 136% of it is 36% of a horizontal scrollbar
   on every poem. The mark keeps its depth, which is what sizes it, and gives
   up the width it has nowhere to put. */
@media (max-width: 720px) {
  .title-hand {
    width: 100%;
    left: 0;
  }
}

/* Paper never waits for a hand. */
@media print {
  .asemic-title :deep(h1) { opacity: 1; font-size: 28pt; }
  .title-hand { display: none; }
}
</style>
