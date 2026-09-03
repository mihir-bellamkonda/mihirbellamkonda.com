<template>
  <!-- Four words the poem already contains, set down again in the margin the
       way a printer notes a sheet. Decorative duplication of the poem's own
       language, so it is not announced. -->
  <p class="specimen-vocabulary" aria-hidden="true">
    <span class="field">{{ vocabulary.field }}</span>
    <span class="coordinates"><span v-for="word in vocabulary.coordinates" :key="word">{{ word }}</span></span>
  </p>
</template>

<script setup>
import { computed } from 'vue';
import { specimenWordsFor } from '../specimen-vocabulary.js';

const props = defineProps({
  poem: { type: Object, required: true }
});

const vocabulary = computed(() => specimenWordsFor(props.poem));
</script>

<style scoped>
/* Fainter than the index by roughly half. The index invites handling and
   answers it; this only has to be there when someone looks for it. */
.specimen-vocabulary {
  display: flex;
  flex-direction: column;
  gap: 0.16rem;
  margin: -0.5rem 0 0;
  font-family: var(--f-cat);
  font-size: 0.52rem;
  line-height: 1.5;
  letter-spacing: 0.14em;
  user-select: none;
}

.field {
  color: var(--accent);
  opacity: 0.16;
  text-transform: uppercase;
  transition: opacity 420ms ease;
}

/* Set apart by space rather than by middots, matching the collage. */
.coordinates {
  display: flex;
  gap: 0.62em;
  color: var(--a-ink-2);
  opacity: 0.11;
  letter-spacing: 0.08em;
  transition: opacity 420ms ease;
}

.specimen-vocabulary:hover .field {
  opacity: 0.26;
}

.specimen-vocabulary:hover .coordinates {
  opacity: 0.17;
}

@media print {
  .specimen-vocabulary { display: none; }
}
</style>
