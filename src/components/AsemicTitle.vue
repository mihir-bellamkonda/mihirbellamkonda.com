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
    <AsemicMarks
      v-if="handWrites"
      class="title-hand"
      :style="{ height: boxHeight }"
      :text="handText"
      :seed="`${seed}::title`"
      :max-lines="rows"
      :max-size="maxSize"
      :ceiling="WRITE"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue';
import AsemicMarks from './AsemicMarks.vue';
import { prefersReducedMotion } from '../motion.js';

const props = defineProps({
  title: { type: String, required: true },
  seed: { type: String, required: true }
});

/**
 * How long the hand keeps the title, in two parts.
 *
 * WRITE is the ceiling handed to `AsemicMarks`, so it is how long the pen
 * takes. DWELL is the part that was missing: the mark used to be swapped out
 * on the same frame the pen finished, so the finished word — the only frame
 * where the thing is whole — was never actually looked at. The hand writes,
 * then the writing stands, then it becomes type.
 */
const WRITE = 1400;
const DWELL = 1100;
const HOLD = WRITE + DWELL;

const resolved = ref(false);
// A reader who has asked for less movement gets the title and nothing else:
// no canvas is mounted at all, rather than one drawn and instantly hidden.
const handWrites = ref(false);
const maxSize = ref(72);
const rows = ref(1);
const handText = ref('');
const boxHeight = ref('210%');

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
  resolved.value = false;

  if (prefersReducedMotion()) {
    handWrites.value = false;
    resolved.value = true;
    return;
  }

  const lines = breakForHand(props.title);
  rows.value = lines.length;
  handText.value = lines.join('\n');
  /*
   * One line is sized against `height / 2.9` and needs a deep box to reach a
   * good size; several lines are sized against `height / ((rows + 0.9) *
   * 2.95)` and fill what they are given, so they need far less of one.
   *
   * These are percentages of the heading, and the heading has already grown
   * for the lines it wraps to — so the multiple must not grow with the rows
   * as well. It did, and a four-line title asked for six and a half times a
   * box that was already four lines deep: fifteen hundred pixels of hand down
   * the margin and across the folio.
   */
  boxHeight.value = lines.length === 1 ? '340%' : '175%';

  sizeToHeading();
  handWrites.value = true;
  timer = setTimeout(() => { resolved.value = true; }, HOLD);
}

onMounted(begin);
// Moving between poems with the arrow keys reuses this component, and the
// next title should be written the same way the first one was.
watch(() => props.seed, begin);
onUnmounted(() => clearTimeout(timer));
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
  transition: opacity 520ms ease;
}

.asemic-title.resolved :deep(h1) {
  opacity: 1;
}

/* The hand is given more room than the heading occupies, and it needs to be:
   fitted into the heading's own rect it is bound by that rect's width and
   draws small. It bleeds down over the provenance and out to the right, both
   of which are empty or nearly so while it is on screen, and it is gone by
   the time either matters. `overflow: visible` on the wrapper is what lets it
   out; nothing is clipped and nothing reflows, because the canvas is out of
   flow entirely. */
.title-hand {
  position: absolute;
  top: -0.12em;
  left: -0.04em;
  width: 136%;
  opacity: 1;
  transition: opacity 520ms ease;
  pointer-events: none;
  z-index: 1;
}

.asemic-title.resolved .title-hand {
  opacity: 0;
}

/* Paper never waits for a hand. */
@media print {
  .asemic-title :deep(h1) { opacity: 1; transition: none; font-size: 28pt; }
  .title-hand { display: none; }
}
</style>
