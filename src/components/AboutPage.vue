<template>
  <div class="about-page">
    <div class="inner">
      <div class="chrome">
        <span>mihirbellamkonda.com</span>
        <a href="#index">index</a>
      </div>

      <main class="opening">
        <h1>Mihir Bellamkonda</h1>

        <p class="bio">
          Mihir Bellamkonda is a Brooklyn-based poet. They were a finalist for Black Lawrence
          Press's St.&nbsp;Lawrence Book Award and have work published or forthcoming in
          Fairy&nbsp;Tale&nbsp;Review, The&nbsp;Offing, Nashville&nbsp;Review,
          Variant&nbsp;Literature, and Trampset, among other journals. They can be found on
          socials @MihirWords. They are honored to be read.
        </p>

        <p class="enter"><a href="#index">read →</a></p>
      </main>

      <div class="rest"></div>
    </div>

    <FooterNav />
  </div>
</template>

<script setup>
import FooterNav from './FooterNav.vue';
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
</style>
