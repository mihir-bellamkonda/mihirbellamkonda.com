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

<style scoped>
/* Poem Page Specific Styles */
.poem-content-wrapper {
  padding-top: var(--spacing-lg);
}

.poem-container {
  max-width: 600px;
  margin: 0 auto;
  text-align: center;
}

.poem-header {
  text-align: center;
  margin-bottom: var(--spacing-lg);
}

.poem-header h1 {
  font-family: var(--font-heading);
  font-size: 1.8rem;
  font-weight: 400;
  letter-spacing: 0.05em;
  color: var(--color-text);
}

.poem-content {
  font-family: var(--font-body);
  font-size: 18px; /* Will be adjusted by JavaScript */
  line-height: 1.6;
  color: var(--color-text);
  margin-bottom: var(--spacing-lg);
  white-space: pre;
  overflow-x: auto;
  max-width: 100%;
  -webkit-overflow-scrolling: touch;
  text-align: left;
  display: inline-block;
}

.poem-content p {
  margin-bottom: 1.5em;
}

.external-link {
  text-align: center;
  font-size: 0.9rem;
  color: var(--color-text-light);
  font-style: italic;
  margin-top: var(--spacing-lg);
  margin-bottom: var(--spacing-md);
}

.external-link a {
  color: var(--color-accent);
  text-decoration: underline;
}

@media (max-width: 768px) {
  .poem-header h1 {
    font-size: 1.5rem;
  }

  .poem-content {
    font-size: 1rem;
  }
}
</style>
