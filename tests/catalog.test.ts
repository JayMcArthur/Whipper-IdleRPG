import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { categories, catalog, references, snapshot, translate, searchIndex, entryAt, entryHref, factLabel } from '../src/lib/catalog';
import { localeCodes, languages, ui, href } from '../src/lib/site';
import { findEntries, normalizeSearch } from '../src/lib/search';
import { referenceRoutes } from '../src/lib/routes';

test('public data matches the versioned captured-source hashes and counts', () => {
  assert.equal(snapshot.gameVersion, '7.3.1'); assert.equal(snapshot.build,142);
  for (const [name, info] of Object.entries(snapshot.tables)) {
    const bytes = readFileSync(`data/${name}.json`);
    assert.equal(createHash('sha256').update(bytes).digest('hex'), info.sha256, name);
    const data: Record<string, { id: number }[]> = JSON.parse(bytes.toString());
    assert.equal(data[name]!.length, info.records, name);
    assert.equal(new Set(data[name]!.map(item => item.id)).size, info.records, `${name} duplicate ID`);
  }
  assert.equal(createHash('sha256').update(readFileSync('data/langs.csv')).digest('hex'),snapshot.translationsSha256);
});
test('catalogs cover every equipment, monster, material and individual enchantment level once', () => {
  assert.equal(catalog('weapons').length + catalog('armor').length + catalog('rings').length,168);
  assert.equal(catalog('monsters').length + catalog('bosses').length,139);
  assert.equal(catalog('materials').length,82);
  assert.equal(catalog('dungeons').length,13);
  const levels = catalog('enchantments').flatMap(entry => entry.levels.map(level => level.id));
  assert.equal(levels.length,1479); assert.equal(new Set(levels).size,1479);
  assert.equal(catalog('enchantments').length,39);
});
test('every displayed relationship and encounter link has a real target', () => {
  for (const entry of references) {
    for (const relation of entry.relations) assert.ok(entryAt(relation.target),JSON.stringify(relation));
    for (const row of entry.floors) for (const target of row.targets) assert.ok(entryAt(target),JSON.stringify(target));
    if (entry.icon) assert.ok(existsSync(entry.icon),entry.icon);
  }
});
test('drop relationships resolve Adam’s encoded material reward and equipment evolution', () => {
  assert.ok(entryAt({category:'bosses',id:200}).relations.some(relation => relation.target.category === 'materials' && relation.target.id === 99));
  assert.ok(entryAt({category:'weapons',id:101}).relations.some(relation => relation.label === 'evolution' && relation.target.id === 102));
  assert.equal(factLabel('DEF','ja'),'DEF');
  assert.ok(entryAt({category:'monsters',id:1}).facts.some(fact => fact.label === 'DEF' && fact.value === 5));
});
test('search matches Japanese names, English aliases, accents, IDs and ability descriptions', () => {
  const entries=searchIndex('ja');
  assert.ok(findEntries(entries,'wooden','weapons').some(entry => entry.href.endsWith('/weapons/101/')));
  assert.ok(findEntries(entries,'木の棒','').some(entry => entry.href.endsWith('/weapons/101/')));
  assert.ok(findEntries(entries,'101','weapons').some(entry => entry.href.endsWith('/weapons/101/')));
  assert.ok(findEntries(entries,'critical','enchantments').length > 0);
  assert.equal(normalizeSearch('  ÉPÉE  '),'epee');
  assert.equal(findEntries(entries,'<img src=x onerror=alert(1)>','').length,0);
  assert.equal(findEntries(entries,'wooden','bosses').length,0);
});
test('ring specialization and later abilities stay visible, without inventing a continuing-dungeon end', () => {
  const foxfire=entryAt({category:'rings',id:324});
  assert.ok(foxfire.facts.some(fact => fact.label === 'specialization' && fact.value === 'HP'));
  assert.ok(foxfire.relations.some(relation => relation.variantId === 941 && relation.label === 'effect'));
  assert.ok(foxfire.relations.some(relation => relation.variantId === 942 && relation.label === 'laterAbility'));
  assert.ok(entryAt({category:'dungeons',id:1}).facts.some(fact => fact.label === 'floorCount' && fact.value === 5));
  assert.ok(!entryAt({category:'dungeons',id:12}).facts.some(fact => fact.label === 'floorCount'));
});
test('ten locales retain entity identity and never generate a repository-root escape', () => {
  for (const locale of localeCodes) {
    assert.ok(languages[locale].html);
    for (const category of categories) assert.ok(ui(locale,category));
    for (const entry of references) {
      assert.ok(translate(entry.nameKey,locale));
      assert.equal(entryHref(entry,locale),href(locale,`${entry.category}/${entry.id}`));
    }
  }
  assert.equal(translate('木の棒','ja'),'木の棒');
  assert.equal(translate('a missing optional game key','en'),'a missing optional game key');
});
test('all entities and guides have unique static routes in each locale', () => {
  const guideIds=readdirSync('src/content/guides').map(name => name.replace(/\.md$/,''));
  const routes=referenceRoutes(guideIds);
  assert.equal(new Set(routes.map(route => route.params.path)).size,routes.length);
  for (const locale of localeCodes) {
    for (const entry of references) assert.ok(routes.some(route => route.params.path === `${locale}/${entry.category}/${entry.id}`));
    for (const id of guideIds) assert.ok(routes.some(route => route.params.path === `${locale}/guides/${id}`));
  }
});
