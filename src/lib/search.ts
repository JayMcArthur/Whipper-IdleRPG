import type { SearchEntry } from './catalog';

export function normalizeSearch(value: string) {
  return value.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}
export function findEntries(entries: SearchEntry[], query: string, category: string) {
  const words = normalizeSearch(query).split(/\s+/).filter(Boolean);
  return entries.filter(entry => (!category || entry.category === category) && words.every(word => normalizeSearch(`${entry.name} ${entry.aliases}`).includes(word)));
}
