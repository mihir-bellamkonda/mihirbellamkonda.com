<template>
  <div class="index-page">
    <div class="inner">
      <div class="chrome">
        <a href="#about">mihir bellamkonda</a>
        <span>{{ pad(poems.length) }}</span>
      </div>

      <div class="lead"></div>

      <div class="rows">
        <button
          v-for="(poem, i) in poems"
          :key="poem.slug"
          type="button"
          class="row"
          @click="onSelect(poem.slug)"
        >
          <span class="no">{{ pad(i + 1) }}</span>
          <span class="title">
            {{ poem.title }}
            <span v-if="poem.subtitle" class="ded">{{ poem.subtitle }}</span>
          </span>
          <span class="where">
            <span v-if="poem.published_in" class="venue">{{ poem.published_in }}</span>
            <span v-if="yearOf(poem)" class="yr">{{ yearOf(poem) }}</span>
          </span>
        </button>
      </div>

      <div class="rest"></div>
    </div>

    <FooterNav />
  </div>
</template>

<script setup>
import FooterNav from './FooterNav.vue';

defineProps({
  poems: Array,
  onSelect: Function
});

function pad(n) {
  return (n < 10 ? '0' : '') + n;
}

function yearOf(poem) {
  if (!poem.date) return '';
  const m = String(poem.date).match(/\d{4}/);
  return m ? m[0] : '';
}
</script>

<style scoped>
.index-page {
  background: var(--a-bg);
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.inner {
  flex: 1;
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 clamp(1.25rem, 5vw, 4.5rem);
}

.chrome {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 1.5rem;
  padding: clamp(1.4rem, 4vw, 2.4rem) 0 0;
  font-family: var(--f-cat);
  font-size: 0.63rem;
  letter-spacing: 0.18em;
  color: var(--a-faint);
}

.chrome a {
  color: var(--a-faint);
  text-decoration: none;
  border-bottom: 1px solid transparent;
}

.chrome a:hover {
  color: var(--a-ink);
  border-bottom-color: var(--a-hair);
}

/* The list explains itself; it gets space instead of a heading. */
.lead {
  height: clamp(4rem, 15vh, 9rem);
}

.rows {
  display: flex;
  flex-direction: column;
  border-top: 1px solid var(--a-hair);
}

.row {
  display: grid;
  grid-template-columns: 3.4rem minmax(0, 1fr) 11rem;
  gap: 0 clamp(1rem, 3vw, 2.2rem);
  align-items: baseline;
  width: 100%;
  padding: clamp(1.1rem, 2.6vw, 1.7rem) 0;
  border: 0;
  border-bottom: 1px solid var(--a-hair);
  background: none;
  font: inherit;
  color: inherit;
  text-align: left;
  cursor: pointer;
}

.no {
  font-family: var(--f-cat);
  font-size: 0.63rem;
  letter-spacing: 0.16em;
  color: var(--a-faint);
  font-variant-numeric: tabular-nums;
}

.title {
  font-family: var(--f-display);
  font-weight: 300;
  font-size: clamp(1.3rem, 2.5vw, 1.75rem);
  line-height: 1.18;
  color: var(--a-ink);
  transition: color 0.2s ease;
}

.ded {
  display: block;
  font-family: var(--f-cat);
  font-size: 0.6rem;
  letter-spacing: 0.12em;
  color: var(--a-faint);
  margin-top: 0.35rem;
}

.where {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.15rem;
  font-family: var(--f-cat);
  font-size: 0.62rem;
  line-height: 1.6;
  color: var(--a-ink-2);
  text-align: right;
}

.where .yr {
  color: var(--a-faint);
  font-variant-numeric: tabular-nums;
}

.row:hover .title { color: var(--accent); }

.row:focus-visible {
  outline: 1px solid var(--accent);
  outline-offset: 4px;
}

.rest {
  height: clamp(8rem, 30vh, 18rem);
}

@media (max-width: 860px) {
  .row {
    grid-template-columns: 2.6rem minmax(0, 1fr);
  }

  .where {
    grid-column: 2 / 3;
    align-items: flex-start;
    text-align: left;
    flex-direction: row;
    gap: 0.6rem;
    margin-top: 0.45rem;
  }
}
</style>
