<template>
  <div class="container">
    <main class="poems-list-content">
      <h2 class="section-title">Contents</h2>
      <div class="poems-list">
        <div v-for="poem in poems" :key="poem.slug" class="poem-entry">
          <div class="poem-entry-top">
            <a @click.prevent="onSelect(poem.slug)" href="#" class="poem-title">{{ poem.title }}</a>
          </div>
          <div v-if="poem.published_in" class="poem-meta">Also published in {{ poem.published_in }}</div>
        </div>
      </div>
    </main>
    <FooterNav />
  </div>
</template>

<script setup>
import FooterNav from './FooterNav.vue';

defineProps({
  poems: Array,
  onSelect: Function
});
</script>
