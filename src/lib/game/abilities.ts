import { customs, customById } from './data';

const tiers: Record<number,string> = {10000:'Legendary',11000:'Mythic',12000:'Noir',13000:'Omega'};
export function abilityTier(id: number): string | undefined {
  return tiers[customById.get(id)?.modLv ?? 0];
}
export const ordinaryAbilities = customs.filter(item => item.modLv<=9000);
export const tieredAbilities = customs.filter(item => abilityTier(item.id));
const ordinaryIds = new Set(ordinaryAbilities.map(item => item.id));
export function abilityFitsSlot(id: number, index: number): boolean {
  return id===0 || (index===3 ? abilityTier(id)!==undefined : ordinaryIds.has(id));
}
