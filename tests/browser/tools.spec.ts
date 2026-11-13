import { test,expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readFile } from 'node:fs/promises';

test('build editor uses actual effect values, persists presets and exports the same build',async({page})=>{
  await page.goto('en/tools/#build');
  await expect(page.locator('[data-build-stats]')).toContainText('35');
  await expect(page.locator('[data-build-stats] > div').nth(1).locator('strong')).toHaveText('15');
  await page.getByRole('combobox',{name:'weapon ability 1',exact:true}).selectOption('腕力');
  await expect(page.locator('[data-build-stats] > div').nth(1).locator('strong')).toHaveText('16');
  await expect(page.locator('[data-gear=weapon] [data-ability-description]').first()).toContainText('1');
  await page.locator('[name=name]').fill('My first preset');
  await page.locator('[name=level]').fill('11');
  await page.getByRole('button',{name:'Save preset',exact:true}).click();
  await expect(page.locator('[data-preset-status]')).toContainText('Saved');
  const [download]=await Promise.all([page.waitForEvent('download'),page.getByRole('button',{name:'Export JSON',exact:true}).click()]);
  const exported=JSON.parse(await readFile((await download.path())!,'utf8'));
  expect(exported.schemaVersion).toBe(1);expect(exported.builds[0].weapon.enchants[0]).toBe(9);expect(exported.builds[0].level).toBe(11);
  await page.reload();
  await expect(page.locator('[name=level]')).toHaveValue('11');
  await expect(page.locator('[data-saved-builds] option').last()).toHaveText('My first preset');
  await page.locator('[data-import-builds]').setInputFiles({name:'invalid.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify({schemaVersion:1,builds:[{name:'bad'}]}))});
  await expect(page.locator('[data-lab-error]')).toBeVisible();
  await expect(page.locator('[data-saved-builds] option').last()).toHaveText('My first preset');
});

test('item curves are interactive, filterable, exportable and can equip a candidate',async({page})=>{
  await page.goto('en/tools/#items');
  const chart=page.locator('.growth-chart');
  await expect(chart).toBeVisible();
  await expect(chart.locator('polyline')).toHaveCount(3);
  await chart.focus();await page.keyboard.press('ArrowRight');
  await expect(page.locator('[data-chart-readout]')).toContainText('Level 2');
  await page.locator('[name=query]').fill('101');
  await expect(page.locator('[data-comparison-rows] tr')).toHaveCount(1);
  const check=page.locator('[data-comparison-rows] input[type=checkbox]');
  if(!await check.isChecked())await check.check();
  await expect(chart.locator('polyline')).toHaveCount(1);
  const [csv]=await Promise.all([page.waitForEvent('download'),page.getByRole('button',{name:'Export table CSV'}).click()]);
  expect(await readFile((await csv.path())!,'utf8')).toContain('Wooden');
  const [svg]=await Promise.all([page.waitForEvent('download'),page.getByRole('button',{name:'Download graph SVG'}).click()]);
  expect(await readFile((await svg.path())!,'utf8')).toContain('polyline');
  await page.getByRole('button',{name:'Equip item',exact:true}).click();
  await expect(page).toHaveURL(/#build$/);
  await expect(page.locator('[name=weapon-id]')).toHaveValue('101');
});

test('random layouts use code fixtures, workers return encounters and special areas stay explicit',async({page})=>{
  await page.goto('en/tools/#dungeon');
  await page.locator('[name=kind]').selectOption('random');
  await page.locator('[name=code]').fill(':');
  await page.locator('[name=miasma]').focus();
  await expect(page.locator('[data-dungeon-name]')).toHaveText('The Ancient Citadel of Courage');
  await expect(page.locator('[data-dungeon-description]')).toContainText('24 floor definitions · 5 min / floor');
  await expect(page.locator('[data-floor-pools] tr')).toHaveCount(24);
  await page.getByText('Combat model and scenario settings',{exact:true}).click();
  await page.locator('[name=trials]').fill('2');
  await page.getByRole('button',{name:'Run encounter tests',exact:true}).click();
  await expect(page.locator('[data-dungeon-status]')).toHaveText('Encounter tests complete.');
  await expect(page.locator('[data-benchmark-rows] tr')).toHaveCount(72);
  await page.locator('[data-benchmark-rows]').getByRole('button',{name:'Inspect',exact:true}).first().click();
  await expect(page.locator('[data-trace-summary]')).toContainText('Floor 1');
  await page.locator('[name=kind]').selectOption('fixed');
  await page.locator('[name=dungeon]').selectOption('13');
  await expect(page.locator('[data-floor-pools] tr')).toHaveCount(0);
  await page.getByRole('button',{name:'Run encounter tests',exact:true}).click();
  await expect(page.locator('[data-dungeon-status]')).toContainText('needs observed encounters');
  await page.getByText('Observed pools for special or custom areas',{exact:true}).click();
  await page.locator('[name=observed]').fill('1: 200');
  await page.getByRole('button',{name:'Run encounter tests',exact:true}).click();
  await expect(page.locator('[data-benchmark-rows]')).toContainText('Phase model needed');
});

test('Item Book migrates without overwriting old records and rolls remaining XP through known levels',async({page})=>{
  await page.goto('en/');
  const old={weapons:{101:{level:4,xp:15}},armor:{},rings:{}};
  await page.evaluate(old=>localStorage.setItem('whipper-item-book',JSON.stringify(old)),old);
  await page.goto('item-book.html');
  await expect(page).toHaveURL(/#book$/);
  await page.locator('[data-book-query]').fill('101');
  await page.getByRole('spinbutton',{name:'Remaining XP for Wooden Stick',exact:true}).fill('16');
  await page.locator('[data-book-query]').focus();
  await expect(page.getByRole('spinbutton',{name:'Analysis level for Wooden Stick',exact:true})).toHaveValue('5');
  expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('whipper-item-book')!))).toEqual(old);
  expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('whipper-item-book-v2')!).weapons['101'])).toEqual({level:5,xp:0});
});

test('dark tool panels work with keyboard, accessible controls and phone layout',async({page},info)=>{
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('en/tools/#build');
  expect(await page.locator('html').evaluate(node=>getComputedStyle(node).backgroundColor)).toBe('rgb(13, 13, 15)');
  for(const tab of ['build','items','dungeon','book']){
    await page.goto(`en/tools/#${tab}`);
    await expect(page.locator(`#${tab}`)).toBeVisible();
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    const result=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa']).analyze();
    expect(result.violations.map(item=>({id:item.id,nodes:item.nodes.map(node=>node.target)}))).toEqual([]);
  }
  expect(errors).toEqual([]);
  await page.goto('en/tools/#build');await page.locator('h1').click();await page.evaluate(()=>window.scrollTo(0,0));await page.screenshot({path:`agent-output/screenshots/lab-build-${info.project.name}.png`,fullPage:true});
  await page.goto('en/tools/#items');await page.locator('.chart-panel').screenshot({path:`agent-output/screenshots/lab-graph-${info.project.name}.png`});
});
