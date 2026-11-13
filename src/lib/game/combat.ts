import { customById, monsterById } from './data';
import { evaluateBuild, type Build, type BuildEvaluation } from './build';
import { scaleEnemy, type DungeonPlan, type EnemyStats } from './dungeon';
import { DartRandom } from './random';

export interface CombatOptions { damageRoll: boolean; speedDodge: number; speedDouble: number; poison: number; deadlyPoison: number; rounds: number; }
export const defaultCombatOptions: CombatOptions={damageRoll:true,speedDodge:0,speedDouble:0,poison:.005,deadlyPoison:.01,rounds:500};
export interface Action { turn: number; actor: 'player'|'enemy'|'poison'; damage: number; playerHP: number; enemyHP: number; note: string; }
export interface Duel { outcome:'win'|'loss'|'draw'|'unmodeled'; playerHP:number; enemyHP:number; turns:number; actions:Action[]; }
const clamp=(chance:number) => Math.max(0,Math.min(1,chance));

/** A bounded base-stat combat model, not a complete adventure or a boss-phase engine. */
export function duel(build: Build, player: BuildEvaluation,enemy: EnemyStats,seed:number,options=defaultCombatOptions): Duel {
  if (player.values.hp<=0) return {outcome:'loss',playerHP:0,enemyHP:enemy.hp,turns:0,actions:[]};
  if (enemy.phaseModelMissing) return {outcome:'unmodeled',playerHP:player.values.hp,enemyHP:enemy.hp,turns:0,actions:[]};
  for (const key of ['speedDodge','speedDouble','poison','deadlyPoison'] as const) if (!Number.isFinite(options[key]) || options[key]<0 || options[key]>1) throw new Error(`${key} must be a fraction from 0 to 1.`);
  if (!Number.isInteger(options.rounds) || options.rounds<1 || options.rounds>2000) throw new Error('Combat round budget must be 1–2000.');
  const random=new DartRandom(seed);
  const effects=new Set(player.effects);
  const effect=(name:string) => [...effects].map(id => customById.get(id)).find(item => item?.nameId===name);
  const luck=effect('七福')?.value || 1;
  const double=clamp((effect('二撃')?.value||0)/100*luck+options.speedDouble);
  const dodge=clamp((effect('六感')?.value||0)/100*luck+options.speedDodge);
  const critical=clamp(.05+(effect('一撃')?.value||0)/100*luck+build.boostPoints[6]!*.002);
  const triple=clamp((effect('三途')?.value||0)/100*luck);
  const critBoost=1+build.boostPoints[7]!*.005;
  const poison=effect('猛毒') ? options.deadlyPoison : effect('毒') ? options.poison : 0;
  let playerHP=player.values.hp,enemyHP=enemy.hp,revive=!!effect('不屈'),forceCritical=false,stacks=0,turns=0;
  const actions:Action[]=[];
  const record=(actor:Action['actor'],damage:number,note:string) => {if(actions.length<80) actions.push({turn:turns,actor,damage,playerHP,enemyHP,note});};
  const playerFirst=!!effect('先制') || player.values.spd>enemy.speed || (player.values.spd===enemy.speed && random.chance(.5));
  const attackPlayer=() => {
    for(let hit=0,hits=random.chance(double)?2:1;hit<hits && enemyHP>0;hit++) {
      const crit=forceCritical||random.chance(critical);
      forceCritical=false;
      const multiplier=crit ? (random.chance(triple)?3:2)*critBoost : 1;
      const roll=options.damageRoll ? random.nextInt(6) : 0;
      const damage=Math.floor((Math.max(1,player.attack-enemy.defense)+roll)*multiplier);
      if (!Number.isSafeInteger(damage)) throw new Error('These extreme inputs exceed the exact integer range of the encounter model.');
      enemyHP=Math.max(0,enemyHP-damage);
      if(poison) stacks++;
      record('player',damage,`${crit?'Critical':'Hit'}${hits===2?` ${hit+1}/2`:''}`);
    }
  };
  const attackEnemy=() => {
    if(random.chance(dodge)) {record('enemy',0,'Dodged');return;}
    const roll=options.damageRoll ? random.nextInt(6) : 0;
    const damage=Math.max(1,enemy.minimumDamage,enemy.attack-player.defense)+roll;
    playerHP=Math.max(0,playerHP-damage);
    if(playerHP===0 && revive) {playerHP=1;revive=false;forceCritical=true;record('enemy',damage,'Unyielding');}
    else record('enemy',damage,'Hit');
  };
  while(playerHP>0 && enemyHP>0 && turns<options.rounds) {
    turns++;
    if(playerFirst) {attackPlayer();if(enemyHP>0) attackEnemy();}
    else {attackEnemy();if(playerHP>0) attackPlayer();}
    if(playerHP>0 && enemyHP>0 && stacks) {
      const damage=Math.max(1,Math.floor(enemy.hp*(poison+build.boostPoints[12]!*.0001)*stacks));
      enemyHP=Math.max(0,enemyHP-damage);record('poison',damage,`${stacks} stack${stacks===1?'':'s'}`);
    }
  }
  return {outcome:playerHP===0?'loss':enemyHP===0?'win':'draw',playerHP,enemyHP,turns,actions};
}

export interface EncounterResult { floor:number; monsterId:number; miasma:number; enemy:EnemyStats; wins:number; losses:number; draws:number; unmodeled:boolean; trials:number; averageHP:number; averageTurns:number; trace:Duel; }
export interface Benchmark { rows:EncounterResult[]; build:BuildEvaluation; notes:string[]; trials:number; }
export function benchmarkDungeon(build:Build,plan:DungeonPlan,trials:number,seed:number,options:CombatOptions=defaultCombatOptions):Benchmark {
  if (!Number.isInteger(trials) || trials<1 || trials>200 || !Number.isSafeInteger(seed) || seed<0) throw new Error('Choose 1–200 tests per encounter and a nonnegative integer seed.');
  const player=evaluateBuild(build);
  const rows:EncounterResult[]=[];
  for (const floor of plan.floors) for (const id of floor.monsters) {
    const monster=monsterById.get(id);
    if(!monster) throw new Error(`Unknown monster #${id}.`);
    const enemy=scaleEnemy(monster,plan,floor);
    let wins=0,losses=0,draws=0,totalHP=0,totalTurns=0;
    let trace:Duel|undefined;
    const count=enemy.phaseModelMissing?1:trials;
    for(let i=0;i<count;i++) {
      const result=duel(build,player,enemy,seed+floor.floor*65537+id*257+i,options);
      trace ||= result;
      if(result.outcome==='win') wins++;else if(result.outcome==='loss') losses++;else if(result.outcome==='draw') draws++;
      totalHP+=result.playerHP;totalTurns+=result.turns;
    }
    rows.push({floor:floor.floor,monsterId:id,miasma:floor.miasma,enemy,wins,losses,draws,unmodeled:enemy.phaseModelMissing,trials:count,averageHP:totalHP/count,averageTurns:totalTurns/count,trace:trace!});
  }
  return {rows,build:player,trials,notes:[...plan.notes,...player.notes,
    'Each encounter starts with full HP at the selected character level. These are encounter benchmarks, not a dungeon-clear probability.',
    'Speed sets initiative. Speed-derived evasion/consecutive chances are explicit scenario inputs, not inferred from an unverified curve.',
    'The model uses post-defense critical damage, one extra Double Strike hit, and the displayed poison settings. Adventure events, XP progression, enemy special abilities and boss phases are not simulated.']};
}
