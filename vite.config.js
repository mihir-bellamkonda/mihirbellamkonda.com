import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  base: '/mihirbellamkonda.com/',  // GitHub Pages project site path
  build: {
    outDir: 'dist'
  }
});
