<template>
  <div class="index-page">
    <div class="inner">
      <div class="chrome">
        <a href="/">mihir bellamkonda</a>
        <span>{{ pad(poems.length) }}</span>
      </div>

      <h1 class="sr-only" data-page-heading tabindex="-1">Poems</h1>

      <div class="lead"></div>

      <main class="rows" id="main" tabindex="-1">
        <template v-for="(poem, i) in poems" :key="poem.slug">
          <p v-if="startsYear(i)" class="year-mark" aria-hidden="true">{{ yearOf(poem) }}</p>

          <!-- Not a single <a> any more: the venue is its own link, and an
               anchor cannot legally contain another. The poem link is
               stretched across the row instead, so the whole row still
               opens the poem while the venue stays separately clickable. -->
          <div class="row">
            <span class="no">{{ pad(i + 1) }}</span>

            <a
              class="rowlink"
              :href="poem.url"
              @click="follow($event, poem.slug)"
            >
              <span class="title">
                {{ poem.title }}
                <span v-if="poem.subtitle" class="ded">{{ poem.subtitle }}</span>
              </span>
            </a>

            <span class="where">
              <a
                v-if="poem.published_in && poem.external_url"
                class="venue"
                :href="poem.external_url"
                target="_blank"
                rel="noopener"
              >{{ poem.published_in }}<span class="ext" aria-hidden="true">&#8599;</span><span
                class="sr-only"> — read at the publisher, opens in a new tab</span></a>
              <span v-else-if="poem.published_in" class="venue">{{ poem.published_in }}</span>
              <span v-if="yearOf(poem)" class="yr">{{ yearOf(poem) }}</span>
            </span>

            <!-- The poet's own line, unaltered, in the reading face. It is a
                 way in, not a caption. -->
            <span class="firstline" aria-hidden="true" v-html="firstLine(poem)"></span>

            <AsemicMarks
              class="sig"
              :text="poem.content"
              :seed="poem.slug + '::sig'"
              :max-lines="1"
              instant
            />
          </div>
        </template>
      </main>

      <div class="rest"></div>
    </div>

    <FooterNav />
  </div>
</template>

<script setup>
import FooterNav from './FooterNav.vue';
import AsemicMarks from './AsemicMarks.vue';

const props = defineProps({
  poems: Array,
  onSelect: Function
});

function follow(event, slug) {
  if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  event.preventDefault();
  props.onSelect?.(slug);
}

function pad(n) {
  return (n < 10 ? '0' : '') + n;
}

function yearOf(poem) {
  if (!poem.date) return '';
  const m = String(poem.date).match(/\d{4}/);
  return m ? m[0] : '';
}

// A year is marked where it first differs from the row above it.
function startsYear(i) {
  const y = yearOf(props.poems[i]);
  if (!y) return false;
  return i === 0 || yearOf(props.poems[i - 1]) !== y;
}

// stanzas[0][0] is already a complete HTML fragment from build-poems.js,
// carrying the poet's emphasis and nothing added.
function firstLine(poem) {
  const first = poem.stanzas && poem.stanzas[0] && poem.stanzas[0][0];
  return first || '';
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
  position: relative;
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
}

.rowlink {
  grid-column: 2 / 3;
  text-decoration: none;
  color: inherit;
  cursor: pointer;
}

/* Stretched across the whole row, so the row remains one large target
   without the markup nesting one link inside another. */
.rowlink::after {
  content: '';
  position: absolute;
  inset: 0;
}

/* The venue rides above the stretched link so it stays clickable. */
.where a {
  position: relative;
  z-index: 1;
}

/* A year, set once where it changes. */
.year-mark {
  margin: 0;
  padding: clamp(1.6rem, 3.5vw, 2.4rem) 0 0.55rem;
  font-family: var(--f-cat);
  font-size: 0.58rem;
  letter-spacing: 0.22em;
  color: var(--a-faint);
  font-variant-numeric: tabular-nums;
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

.where a.venue {
  color: var(--a-ink-2);
  text-decoration: none;
  border-bottom: 1px solid transparent;
}

.where a.venue:hover {
  color: var(--a-ink);
  border-bottom-color: var(--a-hair);
}

.where a.venue:focus-visible {
  outline: 1px solid var(--accent);
  outline-offset: 3px;
}

.ext {
  display: inline-block;
  margin-left: 0.25em;
  font-size: 0.85em;
}

/* The poet's first line, in the reading face, revealed on approach. It is
   set exactly as the poem sets it — no emphasis added, none removed. */
.firstline {
  grid-column: 2 / 3;
  font-family: var(--f-verse);
  font-weight: 300;
  font-size: 0.94rem;
  line-height: 1.6;
  color: var(--a-ink-2);
  max-height: 0;
  opacity: 0;
  overflow: hidden;
  transition: max-height 0.28s ease, opacity 0.28s ease, margin-top 0.28s ease;
}

.row:hover .firstline,
.row:focus-within .firstline {
  max-height: 4rem;
  opacity: 1;
  margin-top: 0.55rem;
}

/* Nothing hovers on a touch screen; the line would never appear, and
   reserving space for it would only loosen the list. */
@media (hover: none) {
  .firstline { display: none; }
}

.row:hover .title,
.row:focus-within .title { color: var(--accent); }

.rowlink:focus-visible {
  outline: 1px solid var(--accent);
  outline-offset: 4px;
}

/* One illegible line of the poem itself, so every row is distinguishable
   at a glance without a thumbnail. */
.sig {
  grid-column: 2 / 3;
  height: 26px;
  margin-top: 0.5rem;
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
