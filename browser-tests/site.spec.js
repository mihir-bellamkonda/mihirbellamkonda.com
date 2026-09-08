import fs from 'node:fs';
import { test as base, expect } from '@playwright/test';

const poems = JSON.parse(fs.readFileSync(new URL('../src/poems.json', import.meta.url), 'utf8'));
const poemURL = poem => `/poem/${poem.path}/`;
const first = poems[0];
const second = poems[1];

// Runtime crashes and missing artwork/fonts fail the check even when a heading
// happens to survive. Expected missing-page documents are tested separately.
const test = base.extend({
  page: async ({ page }, use) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('response', response => {
      if (response.status() >= 400 && ['script', 'stylesheet', 'font', 'image'].includes(response.request().resourceType())) {
        errors.push(`${response.status()} ${response.url()}`);
      }
    });
    await use(page);
    expect(errors, 'runtime errors or missing assets').toEqual([]);
  }
});

async function fits(page) {
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
}

test('opening, index, and a poem remain reachable', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Mihir Bellamkonda');
  await fits(page);
  await page.getByRole('link', { name: 'read poems →', exact: true }).first().click();
  await expect(page.locator('main a[href^="/poem/"]')).toHaveCount(poems.length);
  await fits(page);
  await page.getByRole('link', { name: first.title, exact: true }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(first.title);
});

test.describe('every poem', () => {
  test.use({ reducedMotion: 'reduce' });
  for (const poem of poems) {
    test(`${poem.path} opens directly with its text and fits`, async ({ page }) => {
      const response = await page.goto(poemURL(poem));
      expect(response.status()).toBe(200);
      await expect(page.locator('.asemic-title.resolved h1')).toHaveText(poem.title);
      await expect(page).toHaveTitle(`${poem.title} — Mihir Bellamkonda`);
      await expect(page.locator('.verse .l')).toHaveCount(poem.stanzas.flat().length);
      await expect(page.locator('.verse')).not.toBeEmpty();
      await expect(page.locator('.title-hand')).toHaveCount(0);
      await fits(page);
    });
  }
});

test('malformed and missing links offer recovery', async ({ page }) => {
  for (const address of ['/#%', '/#poem/%E0%A4%A', '/poem/this-poem-does-not-exist/']) {
    await page.goto(address);
    await expect(page.getByRole('heading', { name: 'Not here', exact: true })).toBeVisible();
    await page.getByRole('link', { name: 'the index', exact: true }).click();
    await expect(page.locator('main a[href^="/poem/"]')).toHaveCount(poems.length);
  }
});

test('keyboard navigation and browser back preserve the reading path', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(poemURL(first));
  await page.getByRole('heading', { level: 1 }).focus();
  await page.keyboard.press('ArrowRight');
  await expect(page).toHaveURL(poemURL(second));
  await page.getByRole('button', { name: 'share poem', exact: true }).focus();
  await page.keyboard.press('ArrowRight');
  await expect(page).toHaveURL(poemURL(second));
  await page.goBack();
  await expect(page).toHaveURL(poemURL(first));
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(first.title);
});

test('titles play once per session without a replay control', async ({ page }) => {
  await page.goto(poemURL(first));
  await expect(page.locator('.title-hand canvas').first()).toBeVisible();
  await expect(page.locator('.asemic-title')).toHaveClass(/resolved/);
  await expect(page.locator('.title-hand')).toHaveCount(0);

  await page.reload();
  await expect(page.locator('.asemic-title.resolved h1')).toHaveText(first.title);
  await expect(page.locator('.title-hand')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'replay title', exact: true })).toHaveCount(0);

  await page.getByRole('heading', { level: 1 }).focus();
  await page.keyboard.press('ArrowRight');
  await expect(page).toHaveURL(poemURL(second));
  await expect(page.locator('.title-hand canvas').first()).toBeVisible();
  // Leaving mid-animation must not leave a timer that affects the next page.
  await page.goBack();
  await expect(page.locator('.asemic-title.resolved h1')).toHaveText(first.title);
  await expect(page.locator('.title-hand')).toHaveCount(0);
});

test('reduced motion skips or settles title writing immediately', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(poemURL(first));
  await expect(page.locator('.asemic-title.resolved h1')).toHaveText(first.title);
  await expect(page.locator('.title-hand')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'replay title', exact: true })).toHaveCount(0);
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.getByRole('heading', { level: 1 }).focus();
  await page.keyboard.press('ArrowRight');
  await expect(page).toHaveURL(poemURL(second));
  await expect(page.locator('.title-hand canvas').first()).toBeVisible();
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(page.locator('.title-hand')).toHaveCount(0);
  await expect(page.locator('.asemic-title')).toHaveClass(/resolved/);
});

test('multi-row titles finish the first row before drawing the next', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-09-07T00:00:00Z') });
  await page.clock.pauseAt(new Date('2026-09-07T00:00:01Z'));
  await page.goto('/poem/my-mentorship-problem/');
  const rows = page.locator('.title-hand canvas');
  await expect(rows).toHaveCount(2);
  const hasInk = () => rows.evaluateAll(canvases => canvases.map(canvas => {
    const pixels = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data;
    return pixels.some((value, i) => i % 4 === 3 && value > 0);
  }));
  await page.clock.runFor(200);
  expect(await hasInk()).toEqual([true, false]);
  await page.clock.runFor(1000);
  expect(await hasInk()).toEqual([true, true]);
  await page.clock.runFor(700);
  await expect(page.locator('.asemic-title')).toHaveClass(/resolved/);
});

test('storage restrictions never blank a poem or lose in-page visit memory', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'sessionStorage', { get() { throw new DOMException('Blocked', 'SecurityError'); } });
  });
  await page.goto(poemURL(first));
  await expect(page.locator('.asemic-title')).toHaveClass(/resolved/);
  await page.getByRole('heading', { level: 1 }).focus();
  await page.keyboard.press('ArrowRight');
  await expect(page).toHaveURL(poemURL(second));
  await page.goBack();
  await expect(page.locator('.asemic-title.resolved h1')).toHaveText(first.title);
  await expect(page.locator('.title-hand')).toHaveCount(0);
});
