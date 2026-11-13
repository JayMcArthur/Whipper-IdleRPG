import { readFileSync } from 'node:fs';
import { parse } from 'csv-parse/sync';
import equipment from '../../data/equips.json';
import monsters from '../../data/monsters.json';
import dungeons from '../../data/dungeons.json';
import materials from '../../data/materials.json';
import customs from '../../data/customs.json';
import snapshot from '../../data/snapshot.json';
import { asset, href, languages, ui, type Label, type Locale } from './site';

export { snapshot };
export const categories = ['weapons', 'armor', 'rings', 'monsters', 'bosses', 'dungeons', 'enchantments', 'materials'] as const;
export type Category = typeof categories[number];
export const bossIds = [100, 109, 129, 130, 131, 133, 134, 200, 201, 202, 203];
const rawRows = parse(readFileSync('data/langs.csv', 'utf8'), { columns: true, bom: true, skip_empty_lines: true }) as Record<string, string>[];
export const translationRows = rawRows.length;
const translations = new Map(rawRows.map(row => [row.str!, row]));
export const duplicateTranslationKeys = rawRows.length - translations.size;
export function translate(key: string, locale: Locale): string {
  if (!key) return '';
  const row = translations.get(key);
  return row?.[languages[locale].column] || row?.en_US || key;
}
export function number(value: number, locale: Locale) { return new Intl.NumberFormat(languages[locale].html).format(value); }

export interface Address { category: Category; id: number; }
export interface Relation { label: Label; target: Address; variantId?: number; }
export interface Fact { label: Label | 'HP' | 'STR' | 'VIT' | 'SPD' | 'ATK' | 'DEF' | 'EXP'; value: string | number; translate?: boolean; }
export interface Entry extends Address {
  nameKey: string;
  summaryKey: string;
  icon: string;
  facts: Fact[];
  relations: Relation[];
  levels: { id: number; level: number; value: number; summaryKey: string }[];
  floors: { floor: string; targets: Address[] }[];
}
const equipType: Record<number, Category> = { 1: 'weapons', 2: 'armor', 3: 'rings' };
function equipAddress(id: number): Address | undefined {
  const item = equipment.equips.find(item => item.id === id);
  return item ? { category: equipType[item.itemType]!, id } : undefined;
}
function dropAddress(id: number): Address | undefined {
  const equip = equipAddress(id);
  if (equip) return equip;
  const materialId = id >= 10000 ? id - 10000 : id;
  return materials.materials.some(item => item.id === materialId) ? { category: 'materials', id: materialId } : undefined;
}
function monsterAddress(id: number): Address { return { category: bossIds.includes(id) ? 'bosses' : 'monsters', id }; }
const enchantGroups = new Map<string, typeof customs.customs>();
for (const custom of customs.customs) {
  const group = enchantGroups.get(custom.nameId) || [];
  group.push(custom);
  enchantGroups.set(custom.nameId, group);
}
const entries: Entry[] = [];
for (const item of equipment.equips) {
  const relations: Relation[] = [];
  const next = equipAddress(item.next);
  if (next) relations.push({ label: 'evolution', target: next });
  const partner = equipment.equips.find(other => other.nameId === item.set);
  if (partner) relations.push({ label: 'set', target: equipAddress(partner.id)! });
  for (const monster of monsters.monsters) {
    if (monster.item1 === item.id || monster.item2 === item.id) relations.push({ label: 'drops', target: monsterAddress(monster.id) });
  }
  const ability = customs.customs.find(custom => custom.id === item.ability);
  if (ability) relations.push({ label: 'effect', target: { category: 'enchantments', id: enchantGroups.get(ability.nameId)![0]!.id }, variantId: ability.id });
  const laterAbility = item.itemType === 3 && item.next !== item.ability ? customs.customs.find(custom => custom.id === item.next) : undefined;
  if (laterAbility) relations.push({ label: 'laterAbility', target: { category: 'enchantments', id: enchantGroups.get(laterAbility.nameId)![0]!.id }, variantId: laterAbility.id });
  entries.push({
    category: equipType[item.itemType]!, id: item.id, nameKey: item.nameId, summaryKey: '', icon: `assets/icons/${item.icon}.png`,
    facts: [{ label: 'power', value: item.param }, { label: 'HP', value: item.hp }, { label: 'STR', value: item.atk }, { label: 'VIT', value: item.def },
      { label: 'growth', value: `HP ${item.lvHp >= 0 ? '+' : ''}${item.lvHp} · STR ${item.lvAtk >= 0 ? '+' : ''}${item.lvAtk} · VIT ${item.lvDef >= 0 ? '+' : ''}${item.lvDef}` },
      { label: 'upgrade', value: item.maxLv }, { label: 'type', value: item.attackKind, translate: true },
      ...(item.specialized !== 'None' ? [{ label: 'specialization' as const, value: item.specialized }] : [])],
    relations, levels: [], floors: [],
  });
}
for (const item of monsters.monsters) {
  const relations: Relation[] = [];
  for (const drop of [item.item1, item.item2]) {
    const target = dropAddress(drop);
    if (target) relations.push({ label: 'drops', target });
  }
  for (const dungeon of dungeons.dungeons) {
    if (Object.values(dungeon.monsters).some(ids => ids.includes(item.id))) relations.push({ label: 'found', target: { category: 'dungeons', id: dungeon.id } });
  }
  const bossArt: Record<number, string> = { 200: 'adam_256', 201: 'pano_256', 202: 'fox_256', 203: 'orochi_256' };
  entries.push({ ...monsterAddress(item.id), nameKey: item.nameId, summaryKey: '', icon: bossArt[item.id] ? `assets/boss/${bossArt[item.id]}.png` : '',
    facts: [{ label: 'HP', value: item.hp }, { label: 'ATK', value: item.atk }, { label: 'DEF', value: item.def }, { label: 'SPD', value: item.spd }, { label: 'EXP', value: item.exp }], relations, levels: [], floors: [] });
}
for (const item of materials.materials) {
  const relations: Relation[] = [];
  for (const monster of monsters.monsters) {
    if ([monster.item1, monster.item2].some(id => dropAddress(id)?.category === 'materials' && dropAddress(id)?.id === item.id)) relations.push({ label: 'drops', target: monsterAddress(monster.id) });
  }
  entries.push({ category: 'materials', id: item.id, nameKey: item.nameId, summaryKey: item.efficacyId, icon: `assets/icons/${item.icon}.png`, facts: [], relations, levels: [], floors: [] });
}
for (const group of enchantGroups.values()) {
  const first = group[0]!;
  entries.push({ category: 'enchantments', id: first.id, nameKey: first.nameId, summaryKey: first.summaryId, icon: '', facts: [], relations: [],
    levels: group.map(item => ({ id: item.id, level: item.dispLv, value: item.value, summaryKey: item.summaryId })).sort((a, b) => a.level - b.level), floors: [] });
}
for (const item of dungeons.dungeons) {
  const prerequisite = dungeons.dungeons.find(other => other.id === item.condition);
  entries.push({ category: 'dungeons', id: item.id, nameKey: item.nameId, summaryKey: '', icon: `assets/dungeons/${item.id}.png`,
    facts: [{ label: 'minutes', value: item.minutesPerFloor }, ...(item.maxFloor < 1000000 ? [{ label: 'floorCount' as const, value: item.maxFloor }] : [])],
    relations: prerequisite ? [{ label: 'unlock', target: { category: 'dungeons', id: prerequisite.id } }] : [], levels: [],
    floors: Object.entries(item.monsters).map(([floor, ids]) => ({ floor, targets: (ids as number[]).filter(id => monsters.monsters.some(monster => monster.id === id)).map(monsterAddress) })),
  });
}
export const references = entries;
export function catalog(category: Category) { return references.filter(entry => entry.category === category); }
export function entryAt(address: Address) { return references.find(entry => entry.id === address.id && entry.category === address.category)!; }
export function entryHref(address: Address, locale: Locale) { return href(locale, `${address.category}/${address.id}`); }
export function entryName(address: Address, locale: Locale) { return translate(entryAt(address).nameKey, locale); }
export function icon(entry: Entry) { return entry.icon ? asset(entry.icon) : ''; }
export function factLabel(label: Fact['label'], locale: Locale) { return ['HP', 'STR', 'VIT', 'SPD', 'ATK', 'DEF', 'EXP'].includes(label) ? label : ui(locale, label as Label); }

export interface SearchEntry { name: string; aliases: string; category: Category; categoryName: string; href: string; icon: string; }
export function searchIndex(locale: Locale): SearchEntry[] {
  return references.map(entry => ({
    name: translate(entry.nameKey, locale), aliases: `${translate(entry.nameKey, 'en')} ${translate(entry.nameKey, 'ja')} ${entry.nameKey} ${entry.id} ${translate(entry.summaryKey, 'en')} ${entry.levels.map(level => level.id).join(' ')}`,
    category: entry.category, categoryName: ui(locale, entry.category), href: entryHref(entry, locale), icon: icon(entry),
  }));
}
