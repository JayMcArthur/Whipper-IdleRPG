import { categories, references, type Category, type Entry } from './catalog';
import { localeCodes, type Locale } from './site';

export type Page = { kind: 'home' | 'reference' | 'search' | 'guides' | 'tools' | 'coverage' | 'analysis' | 'dungeon-codes' }
  | { kind: 'catalog'; category: Category }
  | { kind: 'entry'; entry: Entry }
  | { kind: 'guide'; id: string };
export interface Route { params: { path: string }; props: { locale: Locale; path: string; page: Page }; }
export function referenceRoutes(guideIds: string[]): Route[] {
  return localeCodes.flatMap(locale => {
    const routes: { path: string; page: Page }[] = [
      { path: '', page: { kind: 'home' } },
      ...(['reference', 'search', 'guides', 'tools', 'coverage', 'analysis', 'dungeon-codes'] as const).map(kind => ({ path: kind, page: { kind } })),
      ...categories.map(category => ({ path: category, page: { kind: 'catalog' as const, category } })),
      ...references.map(entry => ({ path: `${entry.category}/${entry.id}`, page: { kind: 'entry' as const, entry } })),
      ...guideIds.map(id => ({ path: `guides/${id}`, page: { kind: 'guide' as const, id } })),
    ];
    return routes.map(({ path, page }) => ({ params: { path: `${locale}${path ? `/${path}` : ''}` }, props: { locale, path, page } }));
  });
}
