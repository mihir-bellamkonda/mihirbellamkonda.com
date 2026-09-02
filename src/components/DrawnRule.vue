<template>
  <svg
    class="drawn-rule"
    viewBox="0 0 1000 8"
    preserveAspectRatio="none"
    aria-hidden="true"
    focusable="false"
  >
    <path
      :d="d"
      fill="none"
      stroke="currentColor"
      stroke-width="1"
      stroke-linecap="round"
      vector-effect="non-scaling-stroke"
    />
  </svg>
</template>

<script setup>
import { computed } from 'vue';
import { ruleMarks } from '../marginalia.js';

// The rule between two rows, drawn rather than declared. Same seed, same
// line, every load — the index is ruled once and stays ruled that way.
const props = defineProps({
  seed: { type: String, required: true }
});

const d = computed(() => ruleMarks(props.seed));
</script>

<style scoped>
.drawn-rule {
  display: block;
  width: 100%;
  height: 8px;
  /* The overrun is the point: a drawn line does not stop where the box does. */
  overflow: visible;
  pointer-events: none;
}

/* Paper takes a printed rule better than a drawn one; this is the drawn one. */
@media print {
  .drawn-rule { display: none; }
}
</style>
