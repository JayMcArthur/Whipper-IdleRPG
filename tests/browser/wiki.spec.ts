import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('beginner route works without uploads, accounts or JavaScript', async ({ browser, baseURL }, info) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport:info.project.use.viewport, isMobile:info.project.use.isMobile, hasTouch:info.project.use.hasTouch });
  const page = await context.newPage();
  await page.goto(baseURL!);
  await expect(page.locator('#site-navigation')).toBeVisible();
  await page.locator('main').getByRole('link', { name: 'Start here', exact: false }).first().click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Your first adventures');
  await expect(page.getByRole('heading', { name: '1. Equip your adventurer' })).toBeVisible();
  await expect(page.locator('input[type="file"]')).toHaveCount(0);
  await page.getByRole('link', { name: 'the first dungeon', exact: true }).click();
  await expect(page).toHaveURL(/\/en\/dungeons\/1\/$/);
  await context.close();
});

test('search and equipment relationships lead to real localized pages', async ({ page }) => {
  await page.goto('en/search/');
  await page.getByRole('searchbox').fill('wooden');
  await page.locator('[data-search-results] a[href$="/weapons/101/"]').click();
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Wooden');
  await page.locator('.relation-list a[href$="/weapons/102/"]').click();
  await expect(page).toHaveURL(/\/en\/weapons\/102\/$/);
  if (await page.locator('.menu-toggle').isVisible()) await page.locator('.menu-toggle').click();
  await page.locator('.language-menu summary').click();
  await page.locator('.language-options').getByRole('link', { name: '日本語', exact: true }).click();
  await expect(page).toHaveURL(/\/ja\/weapons\/102\/$/);
  await expect(page.locator('html')).toHaveAttribute('lang','ja');
  await page.goto('ja/search/');
  await page.getByRole('searchbox').fill('wooden');
  await expect(page.locator('[data-search-results]')).toContainText('木の棒');
  await page.getByRole('combobox').selectOption('bosses');
  await expect(page.getByRole('status')).toContainText('該当なし');
});

test('old page and entity entry links retain their destinations', async ({ page }) => {
  await page.goto('weapons.html?id=101');
  await expect(page).toHaveURL(/\/en\/weapons\/101\/$/);
  await page.goto('monsters.html?id=200');
  await expect(page).toHaveURL(/\/en\/bosses\/200\/$/);
  await page.goto('guide-story.html');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Choose your next goal');
});

test('navigation, contrast and layout work at desktop and phone sizes', async ({ page }, info) => {
  const errors: string[] = [];
  const requests: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('request', request => requests.push(new URL(request.url()).origin));
  await page.goto('en/');
  await page.keyboard.press('Tab');
  await expect(page.locator('.skip-link')).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('main')).toBeFocused();
  if (info.project.name === 'phone') {
    const toggle=page.getByRole('button', { name: /Menu/ });
    await expect(toggle).toHaveAttribute('aria-expanded','false');
    await toggle.click();
    await expect(page.locator('#site-navigation')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(toggle).toBeFocused();
    await expect(toggle).toHaveAttribute('aria-expanded','false');
  }
  for (const route of ['en/','ja/weapons/101/','en/guides/getting-started/','en/coverage/','en/guides/community-stats/','en/guides/community-story/']) {
    await page.goto(route);
    await expect(page.locator('h1')).toHaveCount(1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    const result=await new AxeBuilder({ page }).withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa']).analyze();
    expect(result.violations.map(item => ({ id:item.id, nodes:item.nodes.map(node => node.target) }))).toEqual([]);
  }
  expect(errors).toEqual([]);
  expect(new Set(requests)).toEqual(new Set(['http://127.0.0.1:4326']));
  await page.goto('en/');
  await page.screenshot({ path:`agent-output/screenshots/home-${info.project.name}.png`, fullPage:true });
});

test('guide fallback is explicit and search input cannot become markup', async ({ page }) => {
  await page.goto('ja/guides/getting-started/');
  await expect(page.locator('article .translation-note')).toHaveText('ガイド本文は現在英語です。');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href',/\/en\/guides\/getting-started\/$/);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content','noindex,follow');
  await page.goto('en/search/?q=%3Cimg%20src%3Dx%20onerror%3Dalert(1)%3E');
  await expect(page.getByRole('status')).toContainText('No matches');
  await expect(page.locator('[data-search-results] img')).toHaveCount(0);
});

test('local builds survive the wiki refresh and imported names stay text', async ({ page }) => {
  await page.goto('en/');
  const name='<img src=x onerror="window.injected=true">';
  const item=(id:number) => ({ id, upgrade:0, corrosion:0, analysis:1, rarity:'red', enchants:[0,0,0] });
  const build={ name, timestamp:1, weapon:item(101), armor:item(201), ring:item(301), boostPoints:Array(26).fill(0), proofs:{ bookmark:0, combatChip:0, thousandHand:0, adamHeart:0, panoptesEye:0, killingStone:0, magatama:0 }, apples:0 };
  await page.evaluate(build => localStorage.setItem('whipper-builds-v4',JSON.stringify([build])), build);
  await page.goto('build-maker.html');
  await expect(page.locator('#saved-builds-list strong')).toHaveText(name);
  await expect(page.locator('#saved-builds-list img')).toHaveCount(0);
  await expect(page.locator('.tool-notice')).toContainText('Experimental');
  await page.goto('fight-sim.html');
  await expect(page.locator('#build-select option')).toHaveText(name);
  expect(await page.evaluate(() => localStorage.getItem('whipper-builds-v4'))).toContain(name.replaceAll('"','\\"'));
});
