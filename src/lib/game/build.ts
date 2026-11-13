import { equipById, customById, customs, type Equipment } from './data';

export const slots = ['weapon','armor','ring'] as const;
export type Slot = typeof slots[number];
export const stats = ['hp','str','vit','spd','luk'] as const;
export type Stat = typeof stats[number];
export type Values = Record<Stat,number>;
export interface ItemSetup { id: number; upgrade: number; corrosion: number; analysis: number; rarity: string; enchants: number[]; }
export interface Build {
  schemaVersion: 1; name: string; level: number; apples: number; permanentHP: number;
  weapon: ItemSetup; armor: ItemSetup; ring: ItemSetup; boostPoints: number[];
  proofs: Record<string,number>;
}
export const boostDefinitions = [
  ['HP',.005],['STR',.005],['VIT',.005],['SPD',.005],['LUK',.005],['Drop rate',.0002],['Critical chance',.002],['Critical damage',.005],
  ['Slashing damage',.005],['Bludgeoning damage',.005],['Piercing damage',.005],['Projectile damage',.005],['Poison damage',.0001],['Experience',.005],
  ['First Strike',0],['Poison',0],['Unyielding',0],['One Strike',0],['Double Strike',0],['Three Paths',0],['Four Leaves',0],['Five Lights',0],['Sixth Sense',0],['Seven Blessings',0],['Treasure Hunter',0],['Water Source Detection',0],
] as const;
const zeros = (): Values => ({hp:0,str:0,vit:0,spd:0,luk:0});
const ones = (): Values => ({hp:1,str:1,vit:1,spd:1,luk:1});
export function defaultItem(id: number): ItemSetup { return {id,upgrade:0,corrosion:0,analysis:1,rarity:'red',enchants:[0,0,0]}; }
export function defaultBuild(): Build {
  return {schemaVersion:1,name:'My build',level:1,apples:0,permanentHP:0,weapon:defaultItem(101),armor:defaultItem(201),ring:defaultItem(301),boostPoints:Array(26).fill(0),proofs:{}};
}
function integer(value: unknown, label: string, max: number): asserts value is number {
  if (!Number.isSafeInteger(value) || Number(value)<0 || Number(value)>max) throw new Error(`${label} must be a whole number from 0 to ${max}.`);
}
/** One validation surface for UI, exported builds and migrated browser records. */
export function validateBuild(value: unknown): asserts value is Build {
  if (!value || typeof value!=='object') throw new Error('Expected a build object.');
  const b=value as Build;
  if (b.schemaVersion!==1 || typeof b.name!=='string' || !b.name.trim() || b.name.length>160) throw new Error('Build requires schemaVersion 1 and a name up to 160 characters.');
  integer(b.level,'Level',10000); if (!b.level) throw new Error('Character level starts at 1.');
  integer(b.apples,'Apples',20); integer(b.permanentHP,'Permanent HP',1e12);
  if (!Array.isArray(b.boostPoints) || b.boostPoints.length!==26) throw new Error('Expected 26 permanent-boost allocations.');
  b.boostPoints.forEach((v,i) => { integer(v,`BP ${boostDefinitions[i]![0]}`,1e6); if (i>=14 && v!==0 && v!==50) throw new Error('Ability boosts cost either 0 or 50 BP.'); });
  for (const [i,slot] of slots.entries()) {
    const item=b[slot];
    if (!item || equipById.get(item.id)?.itemType!==i+1) throw new Error(`Choose a valid ${slot}.`);
    integer(item.upgrade,`${slot} upgrade`,1e9); integer(item.corrosion,`${slot} corrosion`,1e7); integer(item.analysis,`${slot} analysis`,25);
    if (!item.analysis) throw new Error('Analysis starts at level 1.');
    if (!Array.isArray(item.enchants) || item.enchants.length<3 || item.enchants.length>4) throw new Error(`${slot} requires three ability slots and an optional additional ability.`);
    for (const id of item.enchants) if (id!==0 && !customById.has(id)) throw new Error(`Unknown ability record ${id}.`);
  }
}

export interface ItemEvaluation { item: Equipment; flat: Values; growth: Values; boost: Values; power: number; upgradeLimit: number; effects: number[]; notes: string[]; }
const flatNames: Record<string,Stat> = {耐久:'hp',腕力:'str',頑丈:'vit',機敏:'spd',幸運:'luk'};
const growthNames: Record<string,Stat> = {体力の鍛錬:'hp',力の鍛錬:'str',守りの鍛錬:'vit'};
const boostNames: Record<string,Stat> = {HPブースト:'hp',STRブースト:'str',VITブースト:'vit',SPDブースト:'spd',LUKブースト:'luk'};
const specialNames = new Set(['先制','二撃','一撃','三途','四葉','五光','六感','七福','毒','猛毒','不屈','宝物狩り','水源探知']);
const mastery: Record<string,string> = {斬撃の極意:'Slashing',打撃の極意:'Bludgeoning',刺突の極意:'Piercing',投射の極意:'Projectile'};
const capRules = [[5,0,1101],[7,100,1102],[11,300,1103],[14,450,1104],[16,600,1105],[17,800,1106],[18,1100,1107],[19,1500,1108],[20,2000,1109],[21,2000,1110],[22,2000,1110],[23,2000,1110],[24,2000,1110],[25,2000,1110]];
const ringRules = [[6,50,2601],[9,200,2602],[12,350,2603],[16,600,2105],[17,800,2601],[18,1100,2602],[19,1500,2603],[21,2000,2103],[22,2000,2602],[23,2000,2303],[24,2000,2603],[25,2000,2203]];

export function evaluateItem(setup: ItemSetup, context: { attackKind?: string; hasSet?: boolean } = {}): ItemEvaluation {
  const item=equipById.get(setup.id);
  if (!item) throw new Error(`Unknown equipment ${setup.id}.`);
  const result: ItemEvaluation={item,flat:{hp:item.hp,str:item.atk,vit:item.def,spd:0,luk:0},growth:{hp:item.lvHp,str:item.lvAtk,vit:item.lvDef,spd:0,luk:0},boost:ones(),power:0,upgradeLimit:item.maxLv,effects:[],notes:[]};
  let powerBoost=1,upgradeFactor=1,corrosionFactor=1;
  const active=(a:number,c:number) => setup.analysis>=a && setup.corrosion>=c;
  const addAll=(amount:number) => { for (const stat of stats) result.boost[stat]+=amount; };
  const apply=(id:number) => {
    if (!id) return;
    const custom=customById.get(id);
    if (!custom) { result.notes.push(`Unknown ability #${id}`); return; }
    const {nameId:name,value}=custom;
    if (flatNames[name]) result.flat[flatNames[name]!]+=value;
    else if (growthNames[name]) result.growth[growthNames[name]!]+=value;
    else if (boostNames[name]) result.boost[boostNames[name]!]+=value/100;
    else if (name==='全能力値ブースト') addAll(value/100);
    else if (mastery[name]) { if (context.attackKind===mastery[name]) result.boost.str+=value/100; }
    else if (name==='孤高') { if (!context.hasSet) addAll(value/100); }
    else if (name==='セットブースト') { if (context.hasSet) result.boost.str+=value/100; }
    else if (name==='攻撃力ブースト' || name==='守備力ブースト') powerBoost+=value/100;
    else if (name==='強化ブースト') upgradeFactor*=value;
    else if (name==='侵蝕度ブースト') corrosionFactor*=value;
    else if (name==='強化上限アップ') result.upgradeLimit+=value;
    else if (specialNames.has(name)) result.effects.push(id);
    else if (name!=='能力Lvブースト') result.notes.push(`Effect ${name} (#${id}) is not modeled.`);
  };
  const specialized = (level:number) => {
    const key=item.specialized.toLowerCase() as Stat;
    const prefix={hp:2100,str:2200,vit:2300,spd:2400,luk:2500}[key];
    if (prefix) apply(prefix+level);
  };
  if (item.itemType!==3) {
    for (const [a,c,id] of capRules) if (active(a!,c!)) apply(id!);
    if (active(8,150)) apply(1001);
    if (active(12,350)) apply(1001);
    if (active(10,250)) apply(1201);
    if (active(15,500)) apply(1201);
    if (item.itemType===1) {
      if (active(6,50)) apply(972);
      if (active(9,200)) apply(3101);
      if (active(13,400)) apply(3101);
    } else {
      if (active(6,50)) specialized(1);
      if (active(9,200)) apply(982);
      if (active(13,400)) apply(2103);
    }
  } else {
    for (const [a,c,level] of [[5,0,1],[8,150,2],[11,300,3],[14,450,4]]) if (active(a!,c!)) specialized(level!);
    for (const [a,c,id] of ringRules) if (active(a!,c!)) apply(id!);
    if (active(7,100)) apply(item.ability);
    if (active(13,400)) apply(item.next);
  }
  setup.enchants.forEach(apply);
  result.power=(item.param+setup.upgrade*upgradeFactor+setup.corrosion*10*corrosionFactor)*powerBoost;
  if (item.itemType!==3 && setup.upgrade>result.upgradeLimit) result.notes.push(`${setup.upgrade} upgrade exceeds the modeled ${result.upgradeLimit} limit for equipment #${item.id}.`);
  if (setup.analysis>20) result.notes.push('Analysis 21–25 uses the retained community extension; current runtime parity remains unverified.');
  return result;
}

export interface BuildEvaluation {
  values: Values; base: Values; growth: Values; boost: Values; attack: number; defense: number;
  weaponPower: number; armorPower: number; hasSet: boolean; attackKind: string;
  effects: number[]; items: ItemEvaluation[]; notes: string[]; usedBP: number;
}
export function evaluateBuild(build: Build, level=build.level): BuildEvaluation {
  validateBuild(build); integer(level,'Level',10000); if (!level) throw new Error('Level must be at least 1.');
  const weapon=equipById.get(build.weapon.id)!;
  const hasSet=!!weapon.set && [equipById.get(build.armor.id)!,equipById.get(build.ring.id)!].some(item => item.nameId===weapon.set);
  const items=slots.map(slot => evaluateItem(build[slot],{attackKind:weapon.attackKind,hasSet}));
  const base:Values={hp:30+build.permanentHP,str:10,vit:10,spd:1,luk:1+build.apples};
  const growth:Values={hp:10,str:1,vit:1,spd:1,luk:0};
  const boost=ones();
  for (const item of items) for (const stat of stats) {base[stat]+=item.flat[stat];growth[stat]+=item.growth[stat];boost[stat]+=item.boost[stat]-1;}
  for (const [i,stat] of stats.entries()) boost[stat]+=build.boostPoints[i]!*.005;
  const values=zeros();
  for (const stat of stats) values[stat]=Math.floor((base[stat]+growth[stat]*(level-1))*boost[stat]);
  const effects=items.flatMap(item => item.effects);
  const abilityBoostIds=[66,941,961,68,67,803,804,805,806,807,965,966];
  abilityBoostIds.forEach((id,index) => {if(build.boostPoints[index+14]===50) effects.push(id);});
  const kindIndex=['Slashing','Bludgeoning','Piercing','Projectile'].indexOf(weapon.attackKind);
  const typeBoost=1+(kindIndex>=0 ? build.boostPoints[kindIndex+8]!*.005 : 0);
  const notes=[...new Set(items.flatMap(item => item.notes))];
  if (Object.values(build.proofs||{}).some(value=>value>0)) notes.push('Legacy proof counts were retained as metadata. Enter the actual permanent HP bonus from the game; current proof stat/cap bonuses are not inferred from the older calculator.');
  if (slots.some(slot=>build[slot].rarity!=='red')) notes.push('Rarity labels were retained. Select the actual additional item ability; no automatic rarity stat bonus is assumed.');
  return { values,base,growth,boost,attack:Math.floor((values.str+items[0]!.power)*typeBoost),defense:Math.floor(values.vit+items[1]!.power),weaponPower:items[0]!.power,armorPower:items[1]!.power,
    hasSet,attackKind:weapon.attackKind,effects:[...new Set(effects)],items,notes,usedBP:build.boostPoints.reduce((a,b) => a+b,0) };
}

/** Legacy v4 used category*10000+level, which is not a game-record identity. */
export function migrateLegacyBuild(value: unknown): Build {
  if (!value || typeof value!=='object') throw new Error('Invalid legacy build.');
  const legacy=value as Record<string,unknown>;
  const build={...defaultBuild(),...legacy,schemaVersion:1,level:1,permanentHP:0} as Build;
  const names=['','耐久','腕力','頑丈','機敏','幸運','体力の鍛錬','力の鍛錬','守りの鍛錬'];
  for (const slot of slots) {
    const source=legacy[slot] as ItemSetup;
    if (!source) throw new Error(`Missing legacy ${slot}.`);
    build[slot]={...defaultItem(source.id),...source,upgrade:source.upgrade||0,enchants:source.enchants.map(id => {
      if (id<10000) return id;
      const name=names[Math.floor(id/10000)],level=id%10000;
      const record=customs.find(item => item.nameId===name && item.dispLv===level);
      if (!record) throw new Error(`Legacy enchant ${id} has no recorded ${name||'category'} level ${level}.`);
      return record.id;
    })};
  }
  build.boostPoints=Array.from({length:26},(_,i) => (legacy.boostPoints as number[])?.[i]||0);
  validateBuild(build);
  return build;
}
