<template>
  <!-- A real link, but the default is prevented: this site routes on the
       hash, so letting the browser set #main would navigate the app. -->
  <a class="skip-link" href="#main" @click="skipToMain">skip to content</a>
  <component :is="current.view" v-bind="current.props" :key="currentKey" />
</template>

<script setup>
import { ref, computed, watchEffect, onMounted, onUnmounted, nextTick } from 'vue';
import poemsData from './poems.json';
import AboutPage from './components/AboutPage.vue';
import PoemsListPage from './components/PoemsListPage.vue';
import PoemPage from './components/PoemPage.vue';

/**
 * Real paths for poems, with legacy hash routing retained.
 *
 *   #            → about
 *   #index       → the index   (#contents and #poems still work; they were
 *                               the old names and may exist in shared links)
 *   #poem/<slug> → one poem
 *   /poem/<path>/ → one poem, pre-rendered at build time for link previews
 *
 * The card-stack swipe that used to live here is gone. It hid the index
 * behind a gesture, behaved differently on desktop and phone, and had no
 * keyboard-free way back. Navigation is now ordinary links with real URLs.
 */

const route = ref(parseRoute());

function parseRoute() {
  const hash = decodeURIComponent(window.location.hash.slice(1) || '');
  if (hash === 'about') return { page: 'about' };
  if (hash === 'index' || hash === 'contents' || hash === 'poems') return { page: 'index' };
  if (hash.startsWith('poem/')) return { page: 'poem', slug: hash.slice(5) };

  const pathMatch = decodeURIComponent(window.location.pathname).match(/^\/poem\/([^/]+)\/?$/);
  if (pathMatch) return { page: 'poem', path: pathMatch[1] };

  return { page: 'about' };
}

function urlFor(r) {
  if (r.page === 'about') return '/';
  if (r.page === 'index') return '/#index';
  const poem = poemsData.find(p => p.slug === r.slug || p.path === r.path);
  return poem ? poem.url : '/#index';
}

function navigate(r) {
  const next = urlFor(r);
  if (window.location.pathname + window.location.hash === next) return;
  window.history.pushState(null, '', next);
  route.value = parseRoute();
  window.scrollTo({ top: 0, behavior: 'instant' });
  focusHeading();
}

/**
 * Move focus to the new page's heading after a client-side navigation.
 *
 * Without this the document stays where it was: a screen reader announces
 * nothing when the poem changes, and the next Tab resumes from a control
 * that no longer exists. The headings carry tabindex="-1" so they can take
 * focus without entering the tab order, and the focus ring is suppressed
 * for them in style.css — the reader did not tab here.
 *
 * Only navigation calls this. Focus is left alone on first load.
 */
function focusHeading() {
  nextTick(() => {
    const heading = document.querySelector('[data-page-heading]');
    if (heading) heading.focus({ preventScroll: true });
  });
}

function skipToMain(event) {
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  event.preventDefault();
  const main = document.getElementById('main');
  if (!main) return;
  main.focus({ preventScroll: true });
  main.scrollIntoView({ behavior: 'instant', block: 'start' });
}

const poemIndex = computed(() =>
  route.value.page === 'poem'
    ? poemsData.findIndex(p =>
        route.value.slug ? p.slug === route.value.slug : p.path === route.value.path
      )
    : -1
);

const current = computed(() => {
  const r = route.value;

  if (r.page === 'index') {
    return {
      view: PoemsListPage,
      props: { poems: poemsData, onSelect: slug => navigate({ page: 'poem', slug }) }
    };
  }

  if (r.page === 'poem') {
    const i = poemIndex.value;
    // Unknown slug falls back to the index rather than a blank page
    if (i === -1) {
      return {
        view: PoemsListPage,
        props: { poems: poemsData, onSelect: slug => navigate({ page: 'poem', slug }) }
      };
    }
    return {
      view: PoemPage,
      props: {
        poem: poemsData[i],
        index: i + 1,
        total: poemsData.length,
        prev: i > 0 ? poemsData[i - 1] : null,
        next: i < poemsData.length - 1 ? poemsData[i + 1] : null,
        // The marks beside a poem are the *next* poem's shape, wrapping at
        // the end — the book bleeding through the page you are on.
        ghost: poemsData[(i + 1) % poemsData.length],
        onGo: slug => navigate({ page: 'poem', slug })
      }
    };
  }

  return { view: AboutPage, props: {} };
});

const currentKey = computed(() =>
  route.value.page === 'poem' && poemIndex.value !== -1
    ? 'poem-' + poemsData[poemIndex.value].slug
    : route.value.page
);

// Arrow keys still move between poems — a convenience, never the only way.
function handleKeydown(e) {
  if (route.value.page !== 'poem') return;
  if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey) return;
  const target = e.target;
  if (
    target instanceof Element
    && target.closest('a, button, input, select, textarea, [contenteditable="true"], [role="slider"]')
  ) return;
  const i = poemIndex.value;
  if (i === -1) return;
  if (e.key === 'ArrowLeft' && i > 0) navigate({ page: 'poem', slug: poemsData[i - 1].slug });
  if (e.key === 'ArrowRight' && i < poemsData.length - 1) navigate({ page: 'poem', slug: poemsData[i + 1].slug });
}

function onHashChange() {
  route.value = parseRoute();
  focusHeading();
}

function onPopState() {
  route.value = parseRoute();
  focusHeading();
}

/**
 * Per-route browser titles. The build also emits a real HTML file for each
 * poem URL, giving unfurlers and crawlers poem-specific metadata before the
 * Vue application takes over.
 */
function setTitle() {
  const r = route.value;
  const name = 'Mihir Bellamkonda';
  if (r.page === 'index') {
    document.title = 'Poems — ' + name;
  } else if (r.page === 'poem') {
    const p = poemsData[poemIndex.value];
    document.title = p ? p.title + ' — ' + name : name;
  } else {
    document.title = name;
  }
}

watchEffect(setTitle);

onMounted(() => {
  window.addEventListener('hashchange', onHashChange);
  window.addEventListener('popstate', onPopState);
  document.addEventListener('keydown', handleKeydown);
});

onUnmounted(() => {
  window.removeEventListener('hashchange', onHashChange);
  window.removeEventListener('popstate', onPopState);
  document.removeEventListener('keydown', handleKeydown);
});
</script>
