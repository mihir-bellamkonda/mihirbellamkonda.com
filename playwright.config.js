import { defineConfig } from '@playwright/test';

const liveURL = process.env.SITE_URL;
const localURL = 'http://127.0.0.1:4173';

export default defineConfig({
  testDir: './browser-tests',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: 2,
  timeout: 30000,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: liveURL || localURL,
    browserName: 'chromium',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure'
  },
  projects: [
    { name: 'desktop', use: { viewport: { width: 1280, height: 900 } } },
    { name: 'phone', use: { viewport: { width: 320, height: 760 }, isMobile: true, hasTouch: true } }
  ],
  webServer: liveURL ? undefined : {
    command: 'node scripts/serve-built-site.js',
    url: localURL,
    reuseExistingServer: false,
    timeout: 30000
  }
});
