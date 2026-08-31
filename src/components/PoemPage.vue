<template>
  <div class="poem-plate" v-if="poem">
    <div class="chrome">
      <a href="/">mihir bellamkonda</a>
      <a href="/#index">index</a>
    </div>

    <main class="grid" id="main" tabindex="-1">
      <div class="col-margin">
        <div class="num">{{ pad(index) }} / {{ pad(total) }}</div>
        <h1 data-page-heading tabindex="-1">{{ poem.title }}</h1>
        <p v-if="poem.subtitle" class="dedication">{{ poem.subtitle }}</p>

        <div class="provenance">
          <template v-if="poem.published_in">
            <span class="k">first published</span>
            <a
              v-if="poem.external_url"
              :href="poem.external_url"
              target="_blank"
              rel="noopener"
            >{{ poem.published_in }}<template v-if="year">, {{ year }}</template><span
              class="ext" aria-hidden="true">&#8599;</span><span
              class="sr-only"> (opens in a new tab)</span></a>
            <span v-else>{{ poem.published_in }}<template v-if="year">, {{ year }}</template></span>
          </template>

          <template v-else-if="poem.external_url">
            <span class="k">venue not recorded</span>
            <a :href="poem.external_url" target="_blank" rel="noopener">read it<template v-if="year">, {{ year }}</template><span
              class="ext" aria-hidden="true">&#8599;</span><span
              class="sr-only"> (opens in a new tab)</span></a>
          </template>

          <template v-else-if="year">
            <span class="k">written</span>
            <span>{{ year }}</span>
          </template>
        </div>

        <div class="tools">
          <button type="button" class="copy" @click="copyLink">
            {{ copied ? 'link copied' : 'copy link' }}
          </button>
          <span class="sr-only" role="status" aria-live="polite">{{ copied ? 'Link copied' : '' }}</span>
        </div>

        <!-- The arrow keys have always worked; nothing ever said so. Hidden
             where there is no keyboard to press. -->
        <p class="hint" v-if="prev || next">
          <kbd>&#8592;</kbd><kbd>&#8594;</kbd> to move between poems
        </p>

        <AsemicMarks
          v-if="ghost"
          class="ghost"
          :text="ghost.content"
          :seed="poem.slug + '::ghost'"
        />
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
    <FooterNav :prev="prev" :next="next" :position="pad(index) + ' / ' + pad(total)" :on-go="onGo" />
  </div>
</template>

<script setup>
import { computed, ref, onUnmounted } from 'vue';
import FooterNav from './FooterNav.vue';
import AsemicMarks from './AsemicMarks.vue';

const props = defineProps({
  poem: Object,
  index: Number,
  total: Number,
  prev: { type: Object, default: null },
  next: { type: Object, default: null },
  ghost: { type: Object, default: null },
  onGo: { type: Function, default: null }
});

function pad(n) {
  return (n < 10 ? '0' : '') + n;
}

const copied = ref(false);
let copyTimer = null;

/**
 * Copy this poem's canonical URL. Every poem has had a real shareable
 * address since the static pages landed; nothing on the page invited
 * anyone to take it.
 */
async function copyLink() {
  const url = window.location.origin + props.poem.url;
  try {
    await navigator.clipboard.writeText(url);
  } catch (e) {
    // Clipboard is unavailable over plain http and in some embedded
    // browsers. Select the address instead of failing silently.
    window.prompt('Copy this link', url);
    return;
  }
  copied.value = true;
  clearTimeout(copyTimer);
  copyTimer = setTimeout(() => { copied.value = false; }, 2000);
}

onUnmounted(() => clearTimeout(copyTimer));

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

.chrome {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: clamp(1.4rem, 4vw, 2.4rem) clamp(1.25rem, 5vw, 4.5rem) 0;
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 1.5rem;
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

.ext {
  display: inline-block;
  margin-left: 0.3em;
  font-size: 0.85em;
  vertical-align: baseline;
}

.tools {
  display: flex;
  gap: 1.2rem;
  align-items: baseline;
}

.copy {
  background: none;
  border: 0;
  padding: 0;
  cursor: pointer;
  font-family: var(--f-cat);
  font-size: 0.6rem;
  letter-spacing: 0.16em;
  color: var(--a-faint);
  border-bottom: 1px solid transparent;
  transition: color 0.2s ease;
}

.copy:hover {
  color: var(--a-ink);
  border-bottom-color: var(--a-hair);
}

.copy:focus-visible {
  outline: 1px solid var(--accent);
  outline-offset: 3px;
}

.hint {
  margin: 0;
  font-family: var(--f-cat);
  font-size: 0.58rem;
  letter-spacing: 0.14em;
  color: var(--a-faint);
}

.hint kbd {
  font: inherit;
  border: 1px solid var(--a-hair);
  border-radius: 2px;
  padding: 0.05rem 0.3rem;
  margin-right: 0.25rem;
}

/* No keyboard to press. */
@media (hover: none) {
  .hint { display: none; }
}

/* The illegible column. Its height is the composition — the marks fill
   whatever room they are given, so this is a layout decision. */
.ghost {
  height: clamp(15rem, 40vh, 32rem);
  margin-top: 0.4rem;
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
  .ghost {
    height: 8rem;
  }

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
  .tools, .hint { display: none; }
  .poem-plate { min-height: 0; }
  .grid { display: block; padding: 0; }
  .rest { display: none; }
  .num, .provenance { color: #000; }
}
</style>
