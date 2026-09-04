<template>
  <div class="about-page">
    <div class="inner">
      <div class="chrome">
        <span>mihirbellamkonda.com</span>
        <a href="/#index">poems</a>
      </div>

      <main class="opening" id="main" tabindex="-1">
        <h1 data-page-heading tabindex="-1">Mihir Bellamkonda</h1>

        <p class="bio">
          Mihir Bellamkonda is a poet based in Brooklyn. They were a finalist for Black Lawrence
          Press's St.&nbsp;Lawrence Book Award, and their work appears in Oxford&nbsp;Poetry,
          Nashville&nbsp;Review, The&nbsp;Offing, Variant&nbsp;Literature, and elsewhere. They can
          be found on
          <a href="https://x.com/MihirWords" rel="me noopener" target="_blank">Twitter</a>
          and
          <a href="https://www.instagram.com/mihirwords/" rel="me noopener" target="_blank">Instagram</a>
          as @MihirWords, or reached by
          <a href="mailto:mihir.bellamkonda@gmail.com">email</a>. They are honored to be read.
        </p>

        <p class="enter"><a href="/#index">read poems →</a></p>
      </main>

      <div class="rest"></div>

      <!-- One word from the poems, in the hand, in the corner. It is a real
           word out of a real poem and it is unreadable, which is this whole
           site in miniature. -->
      <AsemicMarks class="corner-word" :text="word" :seed="`about::${word}`" :size="22" :max-lines="1" />
    </div>

    <FooterNav />
  </div>
</template>

<script setup>
import FooterNav from './FooterNav.vue';
import AsemicMarks from './AsemicMarks.vue';
import poems from '../poems.json';

/**
 * A different word every visit, drawn from every word in the book.
 *
 * Everywhere else the marks are seeded from the poem, so a poem's signature is
 * the same for every reader forever. That rule is about a poem's own hand and
 * does not reach here: this is the house drawing one word out of the hat on
 * the way in. The choosing is random; the writing is not — the same word comes
 * out in the same hand every time it comes up.
 *
 * The hat used to hold the eighty-four words curated in
 * `specimen-vocabulary.js`, which are picked to sit beside a particular poem
 * rather than to stand on their own. It holds the whole book now — 1292
 * distinct words — and it is derived from `poems.json`, which is generated from
 * the markdown at build time. A poem added tomorrow brings its words with it
 * and nothing here needs editing.
 *
 * Bounded by what the corner will actually hold. This mark is drawn at a fixed
 * size rather than fitted to its box, so a long word does not shrink to fit —
 * it runs off the edge, which is the same way the hyphen bug showed itself.
 * Measured at size 22 against the narrowest the box gets (9rem, 144px): nine
 * letters is the most that fits, `lawnmower` landing exactly on it, and ten
 * overflows. Under four letters there is not enough mark to be worth looking at.
 */
const WORDS = [...new Set(
  poems
    .flatMap(poem => String(poem.content || '').split(/\s+/))
    .map(word => word
      .replace(/[*_]/g, '')
      .replace(/^[^\p{L}\p{N}']+|[^\p{L}\p{N}']+$/gu, ''))
    .filter(word => word.length >= 4 && word.length <= 9)
)];

const word = WORDS[Math.floor(Math.random() * WORDS.length)] || 'analemma';
</script>

<style scoped>
/* The full-bleed green cover is gone. The opening is the same ground the
   poems sit on, so arriving and reading are one surface. */
.about-page {
  background: var(--a-bg);
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.inner {
  position: relative;
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

.opening {
  padding: clamp(6rem, 26vh, 15rem) 0 0;
  max-width: 42rem;
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.opening h1 {
  font-family: var(--f-display);
  font-weight: 300;
  font-size: clamp(2.6rem, 7vw, 4.4rem);
  line-height: 1;
  margin: 0;
  color: var(--a-ink);
}

.bio {
  margin: 0;
  max-width: 46ch;
  font-size: 1.02rem;
  line-height: 1.8;
  color: var(--a-ink-2);
}

.bio a {
  color: inherit;
  border-bottom: 1px solid var(--a-hair);
}

.bio a:hover {
  color: var(--accent);
  border-bottom-color: var(--accent);
}

.enter {
  margin: 0;
  font-family: var(--f-cat);
  font-size: 0.63rem;
  letter-spacing: 0.18em;
}

.enter a {
  color: var(--a-ink);
  text-decoration: none;
  border-bottom: 1px solid var(--a-hair);
  padding-bottom: 0.2rem;
}

.enter a:hover {
  color: var(--accent);
  border-bottom-color: var(--accent);
}

.rest {
  height: clamp(6rem, 22vh, 14rem);
}

/* Low and to the right, where a hand signs off. */
.corner-word {
  position: absolute;
  right: clamp(1.25rem, 5vw, 4.5rem);
  bottom: clamp(1.5rem, 5vh, 3.5rem);
  width: clamp(9rem, 16vw, 12rem);
  height: 3rem;
  opacity: 0.62;
}

@media (max-width: 860px) {
  .corner-word {
    width: 7rem;
    opacity: 0.42;
  }
}
</style>
