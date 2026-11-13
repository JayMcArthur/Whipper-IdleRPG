import { test } from 'node:test';
import assert from 'node:assert/strict';
import keys from '../data/random-keys.json';
import { defaultBuild, defaultItem, evaluateBuild, evaluateItem, migrateLegacyBuild } from '../src/lib/game/build';
import { randomDungeon, fixedDungeon, observedDungeon, scaleEnemy } from '../src/lib/game/dungeon';
import { dungeonCodeSeed } from '../src/lib/game/random';
import { monsterById } from '../src/lib/game/data';
import { duel, defaultCombatOptions } from '../src/lib/game/combat';
import { compareItem,compareBuild } from '../src/lib/game/comparison';
import { emptyBook,parseBook,normalizeProgress,bookSummary } from '../src/lib/game/item-book';
import { ordinaryAbilities,tieredAbilities,abilityTier } from '../src/lib/game/abilities';

test('one stat model includes character level, real equipment, abilities and zero apples correctly', () => {
  const build=defaultBuild();
  const one=evaluateBuild(build);
  assert.deepEqual(one.values,{hp:35,str:10,vit:10,spd:1,luk:1});
  assert.equal(one.attack,15);assert.equal(one.defense,13);
  assert.deepEqual(evaluateBuild(build,11).values,{hp:135,str:20,vit:20,spd:11,luk:1});
  build.weapon.enchants=[9,1,0];build.apples=20;
  assert.deepEqual(evaluateBuild(build).values,{hp:40,str:11,vit:10,spd:1,luk:21});
});
test('fusion permits rare combat effects in every ordinary position and tier follows the bonus record', () => {
  for(const index of [0,1,2]) {
    const build=defaultBuild();build.weapon.enchants[index]=66;
    assert.ok(evaluateBuild(build).effects.includes(66));
    assert.deepEqual(evaluateBuild(build).notes,[]);
  }
  assert.ok(ordinaryAbilities.some(item=>item.id===961));
  assert.ok(!ordinaryAbilities.some(item=>item.id===2101)); // Intrinsic analysis effect.
  assert.ok(!tieredAbilities.some(item=>item.id===66));
  assert.equal(abilityTier(2206),'Noir');assert.equal(abilityTier(2603),'Omega');
  const item={...defaultItem(101),enchants:[66,9,0,2206]};
  assert.equal(evaluateItem(item).boost.str,1.6);
  assert.ok(evaluateItem(item).effects.includes(66));
});
test('older unsupported slot selections remain intact and cannot contribute an invalid bonus', () => {
  const build=defaultBuild();build.weapon.enchants=[0,0,0,9];
  const result=evaluateBuild(build);
  assert.equal(result.attack,15);
  assert.match(result.notes.join(' '),/Tiered bonus #9.*excluded from stats/);
  assert.deepEqual(build.weapon.enchants,[0,0,0,9]);
  build.weapon.enchants=[2206,0,0];
  assert.equal(evaluateBuild(build).attack,15);
  assert.match(evaluateBuild(build).notes.join(' '),/Ability 1 #2206/);
});
test('analysis needs both its level and corrosion; upgrade cap adds to the actual equipment limit', () => {
  const item={...defaultItem(101),analysis:6,upgrade:10,corrosion:49};
  assert.equal(evaluateItem(item).power,505);
  assert.equal(evaluateItem({...item,corrosion:50}).power,669.5);
  assert.equal(evaluateItem({...item,analysis:5}).upgradeLimit,110);
  const ring={...defaultItem(301),analysis:7,corrosion:99};
  assert.equal(evaluateItem(ring,{attackKind:'Bludgeoning'}).boost.str,1.1);
  assert.ok(Math.abs(evaluateItem({...ring,corrosion:100},{attackKind:'Bludgeoning'}).boost.str-1.4)<1e-10);
  assert.equal(evaluateItem({...ring,corrosion:100},{attackKind:'Slashing'}).boost.str,1.1);
});
test('legacy browser builds resolve encoded levels to actual game IDs, retaining player names', () => {
  const legacy=defaultBuild();legacy.name='<img src=x onerror=alert(1)>';legacy.weapon.enchants=[20001,10001,60001];
  const result=migrateLegacyBuild(legacy);
  assert.equal(result.name,legacy.name);
  assert.deepEqual(result.weapon.enchants,[9,1,47]);
  assert.equal(evaluateBuild(result).growth.hp,12);
  assert.throws(() => migrateLegacyBuild({...legacy,weapon:{...legacy.weapon,enchants:[90001,0,0]}}),/no recorded/);
});
test('comparison separates item contributions from the full build and makes weighting explicit', () => {
  const weights={hp:0,attack:.5,defense:.5};
  const item=compareItem('weapon',defaultItem(101),1,weights);
  assert.equal(item.attack,5);assert.equal(item.hp,0);assert.equal(item.score,2);
  const build=defaultBuild();
  assert.deepEqual(compareItem('weapon',build.weapon,11,weights,build),compareBuild(build,11,weights));
  assert.equal(compareBuild(build,1,{hp:1,attack:0,defense:0}).score,35);
});
test('manual Item Book normalizes known XP thresholds and preserves unknown IDs and higher levels', () => {
  assert.deepEqual(normalizeProgress(4,16),{level:5,xp:0});
  const book=emptyBook();book.weapons['101']={level:5,xp:0};book.weapons['9999']={level:30,xp:9};
  assert.deepEqual(parseBook(book).weapons['9999'],{level:30,xp:9});
  assert.equal(bookSummary(book).bp,1);assert.equal(bookSummary(book).collected,1);
  assert.throws(()=>parseBook({...book,armor:{201:{level:1,xp:'<img>'}}}),/whole numbers/);
});
test('Dart layout generator matches every recommended long and short dungeon code', () => {
  for (const fixture of keys.keys) for (const field of ['longKey','shortKey'] as const) {
    if(fixture[field]==='')continue; // The source has one explicitly unavailable short-code entry.
    const plan=randomDungeon(fixture[field]);
    assert.equal(plan.nameKey,fixture.dungeon,`${fixture.id} ${field} name`);
    assert.equal(plan.floors.length,fixture.floors,`${fixture.id} ${field} floors`);
    assert.equal(plan.floors[0]!.monsters[0],fixture.startingMonster,`${fixture.id} ${field} first monster`);
    assert.equal(plan.floors[0]!.monsters[1]!-plan.floors[0]!.monsters[0]!,fixture.monsterProgression);
    assert.equal(plan.minutesPerFloor,field==='longKey'?20:5);
  }
  assert.equal(dungeonCodeSeed('风犒'),68448);assert.equal(dungeonCodeSeed('金福'),68448);
  assert.equal(dungeonCodeSeed('😀'),112189);
  assert.equal(randomDungeon('58',true).nameKey,'The Ancient Citadel of Courage');
});
test('sparse special tables cannot become an empty successful dungeon; observations are explicit', () => {
  for (const id of [8,13,14]) {const plan=fixedDungeon(id);assert.equal(plan.kind,'unknown');assert.equal(plan.floors.length,0);}
  const observed=observedDungeon(fixedDungeon(13),'1: 200, 201\n2: 202',0);
  assert.equal(observed.kind,'manual');assert.equal(observed.floors.length,2);
  assert.throws(() => observedDungeon(fixedDungeon(13),'1: 999999',0),/Unknown/);
  assert.equal(randomDungeon('wonderland').id,9);
  assert.equal(randomDungeon('就2').kind,'unknown');
});
test('miasma arithmetic truncates dungeon scaling as in the developer source', () => {
  const plan=fixedDungeon(2,1);
  const enemy=scaleEnemy(monsterById.get(1)!,plan,plan.floors[0]!);
  assert.deepEqual([enemy.hp,enemy.attack,enemy.defense,enemy.speed,enemy.minimumDamage],[915,803,803,1,8]);
});
test('fights terminate at death, remain bounded and repeat with the same seed', () => {
  const build=defaultBuild(),player=evaluateBuild(build),options={...defaultCombatOptions,damageRoll:false,rounds:2};
  const enemy={id:1,hp:1,attack:99999,defense:0,speed:0,minimumDamage:0,experience:0,phaseModelMissing:false};
  const win=duel(build,player,enemy,1,options);
  assert.equal(win.outcome,'win');assert.equal(win.playerHP,35);assert.equal(win.actions.length,1);
  const loss=duel(build,player,{...enemy,speed:100},1,options);
  assert.equal(loss.outcome,'loss');assert.equal(loss.actions.length,1);assert.equal(loss.enemyHP,1);
  const tough={...enemy,hp:1000000,attack:1};
  const draw=duel(build,player,tough,123,options);
  assert.equal(draw.outcome,'draw');assert.equal(draw.turns,2);
  assert.deepEqual(draw,duel(build,player,tough,123,options));
  assert.equal(duel(build,player,{...enemy,phaseModelMissing:true},1,options).outcome,'unmodeled');
});
