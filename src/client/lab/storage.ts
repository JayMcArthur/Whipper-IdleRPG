import { validateBuild,migrateLegacyBuild,slots,type Build } from '../../lib/game/build';

export const presetKey='whipper-builds-v5';
export const draftKey='whipper-build-draft-v1';
/** Export only the public build contract, including when an imported object has extra fields. */
export function canonicalBuild(value:unknown):Build {
  validateBuild(value);
  const result:Build={schemaVersion:1,name:value.name,level:value.level,apples:value.apples,permanentHP:value.permanentHP,
    weapon:value.weapon,armor:value.armor,ring:value.ring,boostPoints:[...value.boostPoints],proofs:{}};
  for(const slot of slots) {const item=value[slot];result[slot]={id:item.id,upgrade:item.upgrade,corrosion:item.corrosion,analysis:item.analysis,rarity:typeof item.rarity==='string'?item.rarity.slice(0,80):'red',enchants:[...item.enchants]};}
  for(const key of ['bookmark','combatChip','thousandHand','adamHeart','panoptesEye','killingStone','magatama']) {
    const count=value.proofs?.[key];
    if(Number.isSafeInteger(count)&&Number(count)>=0&&Number(count)<=1e6)result.proofs[key]=count!;
  }
  return result;
}
export function readPresets():Build[] {
  const current=localStorage.getItem(presetKey);
  if(current!==null) {const records=JSON.parse(current);if(!Array.isArray(records))throw new Error('Stored presets must be a list.');return records.map(canonicalBuild);}
  const legacy=localStorage.getItem('whipper-builds-v4');
  if(!legacy)return [];
  const records=JSON.parse(legacy);
  if(!Array.isArray(records))throw new Error('Legacy presets must be a list.');
  const migrated=records.map(record=>canonicalBuild(migrateLegacyBuild(record)));
  localStorage.setItem(presetKey,JSON.stringify(migrated));
  return migrated;
}
export function parseBuildFile(text:string):Build[] {
  if(text.length>5*1024*1024)throw new Error('Build JSON must be smaller than 5 MiB.');
  const parsed=JSON.parse(text);
  const records=Array.isArray(parsed)?parsed:parsed.schemaVersion===1?parsed.builds:null;
  if(!Array.isArray(records)||!records.length||records.length>5000)throw new Error('Expected an exported build file with 1–5000 presets.');
  return records.map(record=>canonicalBuild(record.schemaVersion===1?record:migrateLegacyBuild(record)));
}
