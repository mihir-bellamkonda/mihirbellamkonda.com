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
      :text="title"
      :seed="`${seed}::title`"
      :max-lines="0"
      :max-size="maxSize"
      :ceiling="HOLD"
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
 * How long the hand keeps the title.
 *
 * `AsemicMarks` floors every write at a second, so a ceiling below that only
 * says "as fast as the floor allows" — the two numbers meet at 1000ms and the
 * write lands exactly where the hold ends. Anything longer and the reader is
 * waiting on a word they came to read.
 */
const HOLD = 1050;

const resolved = ref(false);
// A reader who has asked for less movement gets the title and nothing else:
// no canvas is mounted at all, rather than one drawn and instantly hidden.
const handWrites = ref(false);
const maxSize = ref(28);

let timer = null;

function sizeToHeading() {
  // The hand should be drawn at the size of the type it stands in for, not at
  // the 16px house maximum, which is meant for a mark sitting beside
  // something rather than one standing in its place.
  const el = document.querySelector('.asemic-title h1');
  if (!el) return;
  const px = parseFloat(getComputedStyle(el).fontSize) || 44;
  maxSize.value = Math.round(px * 0.62);
}

function begin() {
  clearTimeout(timer);
  resolved.value = false;

  if (prefersReducedMotion()) {
    handWrites.value = false;
    resolved.value = true;
    return;
  }

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
  transition: opacity 460ms ease;
}

.asemic-title.resolved :deep(h1) {
  opacity: 1;
}

.title-hand {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  opacity: 1;
  transition: opacity 460ms ease;
  pointer-events: none;
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
