import { dungeons, monsterById, type Monster } from './data';
import { DartRandom, dungeonCodeSeed } from './random';

export interface FloorPlan { floor: number; monsters: number[]; miasma: number; }
export interface DungeonPlan {
  nameKey: string; id: number; kind: 'fixed'|'random'|'community'|'manual'|'unknown';
  minutesPerFloor: number; floors: FloorPlan[]; notes: string[];
  bias: number; seed?: number; possibleBoss?: boolean;
}
export function randomDungeon(code: string, numericSeed=false, miasma=0): DungeonPlan {
  if (!code.length) throw new Error('Enter a dungeon code.');
  if (code==='wonderland') return fixedDungeon(9,miasma);
  if (code==='就2') return {nameKey:'就2 — special dungeon',id:8,kind:'unknown',minutesPerFloor:17,bias:8,floors:[],notes:['This is a special three-floor scenario, not the ordinary seeded generator. Supply its observed encounters below.']};
  if (numericSeed && !/^\d+$/.test(code)) throw new Error('Numeric seeds contain digits only.');
  if (!Number.isInteger(miasma) || miasma<0 || miasma>10000) throw new Error('Miasma must be a whole number from 0 to 10000.');
  const seed=numericSeed ? Number(code) : dungeonCodeSeed(code);
  if (!Number.isSafeInteger(seed) || seed<0) throw new Error('Numeric seeds must be nonnegative safe integers.');
  const random=new DartRandom(seed);
  const front=random.nextInt(3),behind=random.nextInt(4),count=random.nextInt(15)+10,minutes=random.nextInt(16)+5;
  const first=random.nextInt(5)+11+behind*5,skip=front+2;
  const nameKey=`${['The Canyon','The Fortress','The Mausoleum','The Ancient Citadel'][behind]} ${['of Courage','of Judgment','of Wisdom'][front]}`;
  return {nameKey,id:8,kind:'random',minutesPerFloor:minutes,bias:[0,2,4,8][behind]!,seed,
    possibleBoss:behind===3 && front===2 && count>20,
    floors:Array.from({length:count},(_,i) => {const start=first+Math.floor(i/4)*skip*3;return {floor:i+1,monsters:[start,start+skip,start+skip*2],miasma};}),
    notes:['The code predicts the normal dungeon layout, not a particular adventure’s random events.',...(behind===3 && front===2 && count>20 ? ['An additional final boss is possible. Its occurrence and phase rules are not inferred; add the observed final encounter if needed.'] : [])]};
}

export function fixedDungeon(id: number, miasma=0, start=1, count=50): DungeonPlan {
  const source=dungeons.find(dungeon => dungeon.id===id);
  if (!source) throw new Error(`Unknown dungeon #${id}.`);
  if (!Number.isInteger(miasma) || miasma<0 || miasma>10000) throw new Error('Miasma must be a whole number from 0 to 10000.');
  if (!Number.isInteger(start) || start<1 || !Number.isInteger(count) || count<1 || count>200) throw new Error('Choose a starting floor and 1–200 floors.');
  const result:DungeonPlan={nameKey:source.nameId,id,kind:'fixed',minutesPerFloor:source.minutesPerFloor,bias:0,floors:[],notes:[]};
  if ([8,13,14].includes(id)) {
    result.kind='unknown';
    result.notes.push('This area uses runtime-generated or special encounters. Its base table is not a complete adventure; supply observed encounters to test it.');
    return result;
  }
  if (id===12) {
    result.kind='community';
    result.notes.push('Royal Tomb uses the older documented 50-floor groups and miasma scaling. Current special floors, elites and boss phases are not verified.');
  }
  const end=id===12 ? start+count-1 : Math.min(source.maxFloor,start+count-1);
  for(let floor=start;floor<=end;floor++) {
    const group=id===12 ? String(Math.ceil(((floor-1)%50+1)/10)) : String(floor);
    const ids=(source.monsters as Record<string,number[]>)[group];
    if (!ids?.length || ids.some(id => !monsterById.has(id))) {
      result.notes.push(`Floor ${floor} has no complete fixed encounter definition.`);
      continue;
    }
    result.floors.push({floor,monsters:ids,miasma:id===12 ? Math.floor(floor/100) : miasma});
  }
  if (id===12) result.notes.push('Tomb endpoint bosses are not silently added from a repeating-group table. Add observed boss encounters explicitly.');
  if (!result.floors.length) result.kind='unknown';
  return result;
}

/** Observed floor pools extend a special/generated area without pretending an empty table is complete. */
export function observedDungeon(plan: DungeonPlan, text: string, miasma: number): DungeonPlan {
  const floors=text.trim().split(/\r?\n/).filter(Boolean).map(line => {
    const match=/^\s*(\d+)\s*:\s*(\d+(?:\s*,\s*\d+)*)\s*$/.exec(line);
    if (!match) throw new Error('Use one floor per line, e.g. 1: 1, 2, 3');
    const floor=Number(match[1]),ids=match[2]!.split(',').map(Number);
    if (floor<1 || !Number.isSafeInteger(floor) || ids.some(id => !monsterById.has(id))) throw new Error(`Unknown floor or monster in: ${line}`);
    return {floor,monsters:[...new Set(ids)],miasma};
  });
  if (!floors.length || floors.length>200 || new Set(floors.map(f => f.floor)).size!==floors.length) throw new Error('Supply 1–200 unique floors.');
  return {...plan,kind:'manual',floors:floors.sort((a,b) => a.floor-b.floor),notes:[...plan.notes,'Encounter pools were entered from observations; they replace automatic floor pools for this test.']};
}

export interface EnemyStats { id: number; hp: number; attack: number; defense: number; speed: number; minimumDamage: number; experience: number; phaseModelMissing: boolean; }
function miasmaBase(level: number,id: number,bias: number) {
  return level<=0 ? {base:0,percent:0} : {base:500*Math.trunc(1+id/4)+100*id+Math.min(2500*(level-1),10000),percent:(10+id*2+bias)*level};
}
/** Developer-published monster/miasma arithmetic, preserving integer truncation rather than Math.round. */
export function scaleEnemy(monster: Monster,plan: DungeonPlan,floor: FloorPlan): EnemyStats {
  const level=floor.miasma;
  let {base,percent}=miasmaBase(level,plan.id,plan.bias);
  if (plan.id===12 && floor.floor%100===0) {
    const previous=miasmaBase(level-1,plan.id,plan.bias);
    base=Math.trunc((base+previous.base)/2);percent=Math.trunc((percent+previous.percent)/2);
  }
  const position=plan.id===12 ? (floor.floor-1)%50+1 : floor.floor;
  if (level>0) percent+=Math.floor(position/4)*(3+level);
  const attack=monster.id===131 ? monster.atk*level**2 : Math.floor((monster.atk+base)*(percent+100)/100);
  return {id:monster.id,hp:Math.floor((monster.hp+base)*(percent*2+100)/100),attack,defense:Math.floor((monster.def+base)*(percent+100)/100),speed:Math.floor(monster.spd*(percent+100)/100),minimumDamage:Math.floor(attack*Math.min(level,3)/100),experience:monster.exp,
    phaseModelMissing:[132,133,134,200,201,202,203].includes(monster.id)};
}
