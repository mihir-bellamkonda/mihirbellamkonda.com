<template>
  <div class="poem-plate" v-if="poem">
    <main class="grid">
      <div class="col-margin">
        <div class="num">{{ pad(index) }} / {{ pad(total) }}</div>
        <h1>{{ poem.title }}</h1>
        <p v-if="poem.subtitle" class="dedication">{{ poem.subtitle }}</p>

        <div class="provenance">
          <template v-if="poem.published_in">
            <span class="k">first published</span>
            <a
              v-if="poem.external_url"
              :href="poem.external_url"
              target="_blank"
              rel="noopener"
            >{{ poem.published_in }}<template v-if="year">, {{ year }}</template></a>
            <span v-else>{{ poem.published_in }}<template v-if="year">, {{ year }}</template></span>
          </template>

          <template v-else-if="poem.external_url">
            <span class="k">venue not recorded</span>
            <a :href="poem.external_url" target="_blank" rel="noopener">read it<template v-if="year">, {{ year }}</template></a>
          </template>

          <template v-else-if="year">
            <span class="k">written</span>
            <span>{{ year }}</span>
          </template>
        </div>
      </div>

      <!-- Nothing in here is styled differently from anything else in here.
           Emphasis, where it appears, is the poet's own. -->
      <div class="verse">
        <p class="stanza" v-for="(stanza, s) in stanzas" :key="s">
          <span class="l" v-for="(line, l) in stanza" :key="l" v-html="line"></span>
        </p>
      </div>
    </main>

    <div class="rest"></div>
    <FooterNav />
  </div>
</template>

<script setup>
import { computed } from 'vue';
import FooterNav from './FooterNav.vue';

const props = defineProps({
  poem: Object,
  index: Number,
  total: Number
});

function pad(n) {
  return (n < 10 ? '0' : '') + n;
}

const year = computed(() => {
  const d = props.poem && props.poem.date;
  if (!d) return '';
  const m = String(d).match(/\d{4}/);
  return m ? m[0] : '';
});

// Prefer the structured stanzas from the build script; fall back to splitting
// the raw markdown so an older poems.json still renders.
const stanzas = computed(() => {
  if (!props.poem) return [];
  if (props.poem.stanzas && props.poem.stanzas.length) return props.poem.stanzas;
  return String(props.poem.content || '')
    .split(/\n[ \t]*\n/)
    .map(block => block.split('\n').map(l => l.trim()).filter(Boolean))
    .filter(block => block.length > 0);
});
</script>

<style scoped>
.poem-plate {
  background: var(--a-bg);
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.grid {
  flex: 1;
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: clamp(5rem, 17vh, 10rem) clamp(1.25rem, 5vw, 4.5rem) 0;
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1.25fr);
  gap: 0 clamp(2rem, 7vw, 7rem);
  align-items: start;
}

.col-margin {
  display: flex;
  flex-direction: column;
  gap: 1.4rem;
}

.num {
  font-family: var(--f-cat);
  font-size: 0.63rem;
  letter-spacing: 0.2em;
  color: var(--a-faint);
  font-variant-numeric: tabular-nums;
}

.col-margin h1 {
  font-family: var(--f-display);
  font-weight: 300;
  font-size: clamp(2.3rem, 5.6vw, 3.7rem);
  line-height: 1;
  margin: 0;
  text-wrap: balance;
  color: var(--a-ink);
}

.dedication {
  font-family: var(--f-display);
  font-style: italic;
  font-size: 1.05rem;
  color: var(--a-ink-2);
  margin: 0;
}

.provenance {
  display: flex;
  flex-direction: column;
  max-width: 28ch;
  font-family: var(--f-cat);
  font-size: 0.64rem;
  line-height: 2;
  color: var(--a-ink-2);
}

.provenance .k {
  color: var(--a-faint);
  letter-spacing: 0.16em;
  font-size: 0.58rem;
}

.provenance a {
  color: var(--a-ink-2);
  text-decoration: none;
  border-bottom: 1px solid var(--a-hair);
}

.provenance a:hover {
  color: var(--a-ink);
  border-bottom-color: var(--a-ink-2);
}

.verse {
  font-size: clamp(1.02rem, 1.45vw, 1.13rem);
  line-height: 1.78;
  max-width: 40rem;
  color: var(--a-ink);
}

.stanza {
  margin: 0 0 1.78em;
}

.stanza:last-child {
  margin-bottom: 0;
}

/* Each line is its own block with a hanging indent, so a wrap is visibly a
   wrap and not a break the poet made. This replaces fitPoemToWidth(), which
   shrank the type until the longest line fit — quietly rendering poems with
   long lines smaller than the rest of the book. */
.l {
  display: block;
  text-indent: -1.4em;
  padding-left: 1.4em;
}

.rest {
  height: clamp(10rem, 34vh, 20rem);
}

@media (max-width: 860px) {
  .grid {
    grid-template-columns: 1fr;
    gap: 2.6rem;
    padding-top: clamp(4rem, 14vh, 7rem);
  }

  .verse {
    max-width: none;
  }

  .rest {
    height: clamp(6rem, 20vh, 12rem);
  }
}

@media print {
  .poem-plate { min-height: 0; }
  .grid { display: block; padding: 0; }
  .rest { display: none; }
  .num, .provenance { color: #000; }
}
</style>
