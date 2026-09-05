<template>
  <footer>
    <nav class="inner">
      <span class="slot start">
        <a v-if="prev" :href="prev.url" @click="follow($event, prev.slug)">← {{ short(prev.title) }}</a>
        <a v-else href="/">← about</a>
      </span>

      <span class="slot mid">
        <a v-if="position" href="/#index">{{ position }} — all poems</a>
        <a v-else href="/#index">poems</a>
      </span>

      <span class="slot end">
        <a v-if="next" :href="next.url" @click="follow($event, next.slug)">{{ short(next.title) }} →</a>
        <a v-else href="/#index">read poems →</a>
      </span>
    </nav>
  </footer>
</template>

<script setup>
const props = defineProps({
  prev: { type: Object, default: null },
  next: { type: Object, default: null },
  position: { type: String, default: '' },
  onGo: { type: Function, default: null }
});

function follow(event, slug) {
  if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  event.preventDefault();
  props.onGo?.(slug);
}

// Titles like "Thuragnosia: Parable of the Man Blind to Doors" would swamp
// the footer, so only the part before the colon appears here.
function short(title) {
  return String(title || '').split(':')[0].toLowerCase();
}
</script>

<style scoped>
/* The hard block below the ground. In dark mode the pair inverts rather
   than dimming, so the edge survives in both themes. */
footer {
  background: var(--b-bg);
  color: var(--b-ink);
  border: 0;
  margin: 0;
  padding: 0;
}

.inner {
  max-width: 1200px;
  margin: 0 auto;
  padding: clamp(1.4rem, 4vw, 2.2rem) clamp(1.25rem, 5vw, 4.5rem);
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: baseline;
  gap: 1rem;
  font-family: var(--f-cat);
  font-size: 0.64rem;
  letter-spacing: 0.14em;
}

.slot.start { text-align: left; }
.slot.mid   { text-align: center; }
.slot.end   { text-align: right; }

a {
  color: var(--b-ink-2);
  background: none;
  border: 0;
  padding: 0;
  font: inherit;
  letter-spacing: inherit;
  text-decoration: none;
  cursor: pointer;
}

a:hover {
  color: var(--b-ink);
}

.slot.mid a { color: var(--b-faint); }
.slot.mid a:hover { color: var(--b-ink); }

a:focus-visible {
  outline: 1px solid var(--b-ink-2);
  outline-offset: 3px;
}

@media (max-width: 560px) {
  .inner {
    grid-template-columns: 1fr;
    gap: 0.7rem;
    text-align: center;
  }
  .slot.start,
  .slot.end { text-align: center; }
}

@media print {
  footer { display: none; }
}
</style>
