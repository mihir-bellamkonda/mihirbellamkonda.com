<template>
  <div class="container" v-if="poem">
    <main class="poem-content-wrapper">
      <div class="poem-container">
        <div class="poem-header">
          <h1 class="section-title">{{ poem.title }}</h1>
        </div>
        <div ref="poemContent" class="poem-content" v-html="poem.html"></div>
        <p v-if="poem.external_url && poem.published_in" class="external-link">
          Also published in <a :href="poem.external_url" target="_blank" rel="noopener">{{ poem.published_in }}</a>
        </p>
      </div>
    </main>
    <FooterNav />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue';
import FooterNav from './FooterNav.vue';

// Font scaling constants
const FONT_SIZE_MIN = 10;        // Minimum readable font size (px)
const FONT_SIZE_MAX = 24;        // Maximum font size for poems (px)
const FONT_SIZE_STEP = 0.5;      // Size reduction increment (px)
const CONTAINER_PADDING = 32;    // Horizontal padding to account for (px)
const DOM_UPDATE_DELAY = 10;     // Milliseconds to wait for DOM update (ms)

const props = defineProps({
  poem: Object,
  index: Number,
  total: Number
});

const poemContent = ref(null);

function fitPoemToWidth() {
  if (!poemContent.value) return;

  const container = poemContent.value;
  const maxWidth = container.parentElement.clientWidth - CONTAINER_PADDING;
  let fontSize = FONT_SIZE_MAX; // Start at max and scale down

  container.style.fontSize = fontSize + 'px';

  // Check if content overflows and reduce font size if needed
  while (container.scrollWidth > maxWidth && fontSize > FONT_SIZE_MIN) {
    fontSize -= FONT_SIZE_STEP;
    container.style.fontSize = fontSize + 'px';
  }
}

onMounted(() => {
  fitPoemToWidth();
  window.addEventListener('resize', fitPoemToWidth);
});

onUnmounted(() => {
  window.removeEventListener('resize', fitPoemToWidth);
});

watch(() => props.poem, () => {
  setTimeout(fitPoemToWidth, DOM_UPDATE_DELAY); // Small delay to ensure DOM is updated
});
</script>
