/* Whipper Wiki - Fight Simulator (Rewritten) */

// ========== Dungeon Key Generation (matches Dart code) ==========

class SeededRandom {
  constructor(seed) { this.seed = seed & 0x7fffffff; }
  nextInt(max) {
    this.seed = (this.seed * 1103515245 + 12345) & 0x7fffffff;
    return this.seed % max;
  }
}

function generateDungeonFromKey(keyStr) {
  const key = parseInt(keyStr);
  if (isNaN(key) || key < 0) return null;

  const rand = new SeededRandom(key);
  const front = rand.nextInt(3);   // 0=Courage(skip2), 1=Judgment(skip3), 2=Wisdom(skip4)
  const behind = rand.nextInt(4);  // 0=Canyon, 1=Fortress, 2=Mausoleum, 3=Ancient Citadel
  const maxFloor = rand.nextInt(15) + 10; // 10-24
  const floorTime = rand.nextInt(16) + 5; // 5-20 min
  const startNum = rand.nextInt(5) + 1;   // 1-5

  const frontWords = ['of Courage', 'of Judgment', 'of Wisdom'];
  const behindWords = ['The Canyon', 'The Fortress', 'The Mausoleum', 'The Ancient Citadel'];
  const skipNums = [2, 3, 4];

  const name = `${behindWords[behind]} ${frontWords[front]}`;
  const skipNum = skipNums[front];

  // Starting monster position: base offset by location + startNum
  const baseOffsets = [11, 16, 21, 26]; // Canyon, Fortress, Mausoleum, Citadel
  let monsterPos = baseOffsets[behind] + startNum - 1;

  const monsters = {};
  let pos = monsterPos;
  for (let floor = 1; floor <= maxFloor; floor++) {
    monsters[floor] = [pos, pos + skipNum, pos + skipNum * 2];
    if (floor % 4 === 0) pos += skipNum * 3;
  }

  // Boss chance: Ancient Citadel of Wisdom with enough floors
  const hasBoss = behind === 3 && front === 2 && maxFloor > 20;
  if (hasBoss) monsters[maxFloor + 1] = [200];

  return {
    key, name, maxFloor, floorTime, front, behind, startNum, skipNum,
    monsters, hasBoss, isRandom: true,
    dungeonBias: [0, 2, 4, 8][behind]
  };
}

// ========== Monster Stats with Miasma ==========

function calcMonsterStats(monsterId, dungeonId, floor, miasmaLevel, dungeonBias = 0) {
  const m = WikiData.monsters.find(x => x.id === monsterId);
  if (!m) return null;

  if (miasmaLevel === 0) {
    return { id: m.id, name: getName(m), hp: m.hp, atk: m.atk, def: m.def, spd: m.spd, exp: m.exp, minDmg: 0, drops: [m.item1, m.item2].filter(Boolean) };
  }

  const baseParam = (500 * Math.round(1 + dungeonId / 4)) + (100 * dungeonId) + Math.min(2500 * (miasmaLevel - 1), 10000);
  let morePct = (10 + (dungeonId * 2) + dungeonBias) * miasmaLevel;
  morePct += Math.floor(floor / 4) * (3 + miasmaLevel);

  const minDmgPct = Math.min(miasmaLevel, 3);
  const hp = Math.floor((m.hp + baseParam) * ((morePct * 2 + 100) / 100));
  const atk = Math.floor((m.atk + baseParam) * ((morePct + 100) / 100));
  const def = Math.floor((m.def + baseParam) * ((morePct + 100) / 100));
  const spd = Math.floor(m.spd * ((morePct + 100) / 100));

  return { id: m.id, name: getName(m), hp, atk, def, spd, exp: m.exp, minDmg: Math.floor(atk * minDmgPct / 100), drops: [m.item1, m.item2].filter(Boolean) };
}

// ========== Build → Player Stats ==========

const UPGRADE_BOOSTS = { 5: 100, 7: 300, 9: 600, 11: 1200, 13: 2500, 15: 5000, 17: 8000, 19: 12000, 20: 19000 };

function buildToPlayer(build) {
  const weapon = getEquipById(build.weapon?.id);
  const armor = getEquipById(build.armor?.id);
  const ring = getEquipById(build.ring?.id);

  if (!weapon || !armor || !ring) return null;

  const wA = build.weapon?.analysis || 1;
  const wC = build.weapon?.corrosion || 0;
  const wU = build.weapon?.upgrade || 0;
  const aA = build.armor?.analysis || 1;
  const aC = build.armor?.corrosion || 0;
  const aU = build.armor?.upgrade || 0;
  const rA = build.ring?.analysis || 1;

  // Enchant bonuses
  let eb = { hp: 0, str: 0, vit: 0, spd: 0, luk: 0, hpUp: 0, strUp: 0, vitUp: 0 };
  const allEnchants = [...(build.weapon?.enchants || []), ...(build.armor?.enchants || []), ...(build.ring?.enchants || [])];
  allEnchants.forEach(id => {
    if (!id) return;
    const c = getCustomById(id);
    if (!c) return;
    if (c.nameId === '耐久') eb.hp += c.value;
    else if (c.nameId === '腕力') eb.str += c.value;
    else if (c.nameId === '頑丈') eb.vit += c.value;
    else if (c.nameId === '機敏') eb.spd += c.value;
    else if (c.nameId === '幸運') eb.luk += c.value;
    else if (c.nameId === '体力の鍛錬') eb.hpUp += c.value;
    else if (c.nameId === '力の鍛錬') eb.strUp += c.value;
    else if (c.nameId === '守りの鍛錬') eb.vitUp += c.value;
  });

  const bp = build.boostPoints || Array(24).fill(0);
  const boost = {
    hp: 1 + bp[0] * 0.005, str: 1 + bp[1] * 0.005, vit: 1 + bp[2] * 0.005,
    spd: 1 + bp[3] * 0.005, luk: 1 + bp[4] * 0.005
  };

  // Base at Lv1
  const baseHP = Math.floor((30 + weapon.hp + armor.hp + ring.hp + eb.hp) * boost.hp);
  const baseSTR = Math.floor((10 + weapon.atk + armor.atk + ring.atk + eb.str) * boost.str);
  const baseVIT = Math.floor((10 + weapon.def + armor.def + ring.def + eb.vit) * boost.vit);
  const baseSPD = Math.floor((1 + eb.spd) * boost.spd);
  const baseLUK = Math.floor((1 + eb.luk) * boost.luk);

  const lvHP = 10 + weapon.lvHp + armor.lvHp + ring.lvHp + eb.hpUp;
  const lvSTR = 1 + weapon.lvAtk + armor.lvAtk + ring.lvAtk + eb.strUp;
  const lvVIT = 1 + weapon.lvDef + armor.lvDef + ring.lvDef + eb.vitUp;

  // Weapon power
  let wUpBoost = 1, wCorBoost = 1, wBoost = 1;
  if (wA >= 6 && wC >= 50) wBoost *= 1.3;
  if (wA >= 8 && wC >= 150) wUpBoost *= 2;
  if (wA >= 10 && wC >= 250) wCorBoost *= 2;
  if (wA >= 12 && wC >= 350) wUpBoost *= 2;
  if (wA >= 15 && wC >= 500) wCorBoost *= 2;

  let wMaxUp = 10;
  Object.entries(UPGRADE_BOOSTS).forEach(([lvl, v]) => { if (wA >= parseInt(lvl)) wMaxUp = v; });
  const effWU = Math.min(wU, wMaxUp);
  const weaponPower = ((effWU * wUpBoost) + (wC * 10 * wCorBoost) + weapon.param) * wBoost;

  let weaponDmgBoost = 1;
  const atkKind = weapon.attackKind || '';
  if (atkKind === 'Slashing') weaponDmgBoost += bp[8] * 0.005;
  else if (atkKind === 'Bludgeoning') weaponDmgBoost += bp[9] * 0.005;
  else if (atkKind === 'Piercing') weaponDmgBoost += bp[10] * 0.005;
  else if (atkKind === 'Projectile') weaponDmgBoost += bp[11] * 0.005;

  // Armor power
  let aUpBoost = 1, aCorBoost = 1, aBoost = 1;
  if (aA >= 8 && aC >= 150) aUpBoost *= 2;
  if (aA >= 9 && aC >= 200) aBoost *= 1.3;
  if (aA >= 10 && aC >= 250) aCorBoost *= 2;
  if (aA >= 12 && aC >= 350) aUpBoost *= 2;
  if (aA >= 15 && aC >= 500) aCorBoost *= 2;

  let aMaxUp = 10;
  Object.entries(UPGRADE_BOOSTS).forEach(([lvl, v]) => { if (aA >= parseInt(lvl)) aMaxUp = v; });
  const effAU = Math.min(aU, aMaxUp);
  const armorPower = ((effAU * aUpBoost) + (aC * 10 * aCorBoost) + armor.param) * aBoost;

  const sevenBless = bp[23] >= 50 ? 2 : 1;

  return {
    baseHP, baseSTR, baseVIT, baseSPD, baseLUK,
    lvHP, lvSTR, lvVIT,
    weaponPower, armorPower, weaponDmgBoost, boost,
    firstStrike: bp[14] >= 50,
    unyielding: bp[16] >= 50,
    oneStrike: bp[17] >= 50,
    doubleStrike: bp[18] >= 50,
    threePaths: bp[19] >= 50,
    sixthSense: bp[22] >= 50,
    sevenBlessings: bp[23] >= 50,
    sevenBless,
    critBoost: 0.05 + (bp[17] >= 50 ? 0.2 * sevenBless : 0),
    dodgeChance: bp[22] >= 50 ? 0.2 * sevenBless : 0,
    doubleChance: bp[18] >= 50 ? 0.2 * sevenBless : 0,
    weaponName: getName(weapon),
    armorName: getName(armor),
    ringName: getName(ring)
  };
}

function getPlayerStatsAtLevel(player, level) {
  const hp = player.baseHP + player.lvHP * (level - 1);
  const str = player.baseSTR + player.lvSTR * (level - 1);
  const vit = player.baseVIT + player.lvVIT * (level - 1);
  const spd = player.baseSPD + (level - 1); // 1 SPD per level
  const atk = Math.floor((str + player.weaponPower) * player.weaponDmgBoost);
  const def = Math.floor(vit + player.armorPower);
  return { hp, str, vit, spd, atk, def };
}

// ========== Battle Simulation ==========

function simulateBattle(pStats, monster, player, playerFirst) {
  let pHp = pStats.hp;
  let mHp = monster.hp;
  let turns = 0;
  let unyielding = player.unyielding ? 1 : 0;
  let critNext = false;

  while (turns < 500 && pHp > 0 && mHp > 0) {
    turns++;
    const isPlayerTurn = (turns % 2 === 1) === playerFirst;

    if (isPlayerTurn) {
      let hits = 1;
      if (Math.random() < player.doubleChance) hits = 2;
      for (let i = 0; i < hits && mHp > 0; i++) {
        let dmg = Math.max(1, pStats.atk - monster.def);
        const isCrit = critNext || Math.random() < player.critBoost;
        if (isCrit) {
          let mult = 2;
          if (player.threePaths) mult = player.sevenBless === 2 ? 3 : (Math.random() < 0.5 ? 3 : 2);
          dmg *= mult;
          critNext = false;
        }
        mHp -= dmg;
      }
    } else {
      if (Math.random() < player.dodgeChance) continue;
      let dmg = Math.max(monster.minDmg || 1, monster.atk - pStats.def);
      pHp -= dmg;
      if (pHp <= 0 && unyielding > 0) {
        unyielding--;
        pHp = 1;
        critNext = true;
      }
    }
  }

  return { won: mHp <= 0, pHpLeft: Math.max(0, pHp), mHpLeft: Math.max(0, mHp), turns };
}

// ========== XP & Leveling ==========

// Simplified leveling: XP thresholds
function getLevelFromExp(totalExp) {
  // Rough approximation - in Whipper, level scales with exp
  // Using sqrt-based formula common in these games
  let level = 1;
  let xpNeeded = 10;
  let accum = 0;
  while (accum + xpNeeded <= totalExp && level < 999) {
    accum += xpNeeded;
    level++;
    xpNeeded = Math.floor(10 * level * 1.2);
  }
  return level;
}

// ========== Full Dungeon Run ==========

function simulateDungeonRun(player, dungeon, miasmaLevel) {
  const dungeonId = dungeon.isRandom ? 15 : (dungeon.id || 1);
  const dungeonBias = dungeon.dungeonBias || 0;
  const totalFloors = dungeon.maxFloor + (dungeon.hasBoss ? 1 : 0);

  let currentLevel = 1;
  let currentExp = 0;
  let pStats = getPlayerStatsAtLevel(player, 1);
  let currentHp = pStats.hp;
  const floorLog = [];

  for (let floor = 1; floor <= totalFloors; floor++) {
    const monsterIds = dungeon.monsters[floor];
    if (!monsterIds || monsterIds.length === 0) continue;

    // Pick random monster from floor
    const mId = monsterIds[Math.floor(Math.random() * monsterIds.length)];
    const monster = calcMonsterStats(mId, dungeonId, floor, miasmaLevel, dungeonBias);
    if (!monster) continue;

    // Update player stats for current level
    pStats = getPlayerStatsAtLevel(player, currentLevel);
    pStats.hp = currentHp; // Use remaining HP

    const playerFirst = player.firstStrike || pStats.spd > monster.spd;
    const result = simulateBattle(pStats, monster, player, playerFirst);

    floorLog.push({
      floor, monster: monster.name, mHp: monster.hp, mAtk: monster.atk, mDef: monster.def,
      won: result.won, hpLeft: result.pHpLeft, turns: result.turns
    });

    if (result.won) {
      currentHp = result.pHpLeft;
      currentExp += monster.exp;
      const newLevel = getLevelFromExp(currentExp);
      if (newLevel > currentLevel) {
        currentLevel = newLevel;
        pStats = getPlayerStatsAtLevel(player, currentLevel);
        currentHp = pStats.hp; // Full heal on level up
      }
    } else {
      return { floorsCleared: floor - 1, totalExp: currentExp, finalLevel: currentLevel, floorLog, cleared: false, diedTo: monster.name, diedOnFloor: floor };
    }
  }

  return { floorsCleared: totalFloors, totalExp: currentExp, finalLevel: currentLevel, floorLog, cleared: true };
}

// ========== UI ==========

async function initFightSimPage() {
  const data = await loadGameData();

  populateDungeonSelect(data);
  populateBuildSelect();

  document.getElementById('dungeon-type').addEventListener('change', (e) => {
    const isRandom = e.target.value === 'random';
    document.getElementById('story-dungeon-group').style.display = isRandom ? 'none' : 'block';
    document.getElementById('random-dungeon-group').style.display = isRandom ? 'block' : 'none';
  });

  document.getElementById('parse-key-btn')?.addEventListener('click', parseKeyInput);
  document.getElementById('dungeon-key')?.addEventListener('keydown', (e) => { if (e.key === 'Enter') parseKeyInput(); });
  document.getElementById('run-sim-btn')?.addEventListener('click', () => runSimulation(data));
  document.getElementById('build-select')?.addEventListener('change', showBuildPreview);
  showBuildPreview();
}

function populateDungeonSelect(data) {
  const sel = document.getElementById('story-dungeon');
  sel.innerHTML = data.dungeons.map(d => `<option value="${d.id}">${getName(d)} (${d.maxFloor}F)</option>`).join('');
}

function populateBuildSelect() {
  const saved = localStorage.getItem('whipper-builds');
  const builds = saved ? JSON.parse(saved) : [];
  const sel = document.getElementById('build-select');
  if (builds.length === 0) {
    sel.innerHTML = '<option value="">No builds — create one in Build Maker</option>';
    return;
  }
  sel.innerHTML = builds.map((b, i) => `<option value="${i}">${b.name}</option>`).join('');
}

function showBuildPreview() {
  const idx = parseInt(document.getElementById('build-select').value);
  const container = document.getElementById('build-preview');
  const saved = localStorage.getItem('whipper-builds');
  const builds = saved ? JSON.parse(saved) : [];
  const build = builds[idx];

  if (!build) { container.style.display = 'none'; return; }

  const player = buildToPlayer(build);
  if (!player) { container.style.display = 'none'; return; }

  const s = getPlayerStatsAtLevel(player, 1);
  container.style.display = 'block';
  container.innerHTML = `
    <div class="bp-row"><span class="bp-label">Weapon</span><span class="bp-val">${player.weaponName}</span></div>
    <div class="bp-row"><span class="bp-label">Armor</span><span class="bp-val">${player.armorName}</span></div>
    <div class="bp-row"><span class="bp-label">Ring</span><span class="bp-val">${player.ringName}</span></div>
    <div class="bp-row"><span class="bp-label">HP</span><span class="bp-val gold">${formatNumber(s.hp)}</span></div>
    <div class="bp-row"><span class="bp-label">Attack</span><span class="bp-val gold">${formatNumber(s.atk)}</span></div>
    <div class="bp-row"><span class="bp-label">Defense</span><span class="bp-val gold">${formatNumber(s.def)}</span></div>
    <div class="bp-row"><span class="bp-label">Per Level</span><span class="bp-val">+${player.lvHP} HP, +${player.lvSTR} STR, +${player.lvVIT} VIT</span></div>
  `;
}

function parseKeyInput() {
  const keyStr = document.getElementById('dungeon-key').value.trim();
  const infoEl = document.getElementById('key-info');
  const dungeon = generateDungeonFromKey(keyStr);
  if (!dungeon) { infoEl.innerHTML = '<span class="text-negative">Invalid key</span>'; return; }

  infoEl.innerHTML = `
    <div class="key-info-grid">
      <div><strong>Name:</strong> ${dungeon.name}</div>
      <div><strong>Floors:</strong> ${dungeon.maxFloor}</div>
      <div><strong>Time/Floor:</strong> ${dungeon.floorTime} min</div>
      <div><strong>Has Boss:</strong> ${dungeon.hasBoss ? 'Yes' : 'No'}</div>
      <div><strong>Start Monster:</strong> ID ${[11,16,21,26][dungeon.behind] + dungeon.startNum - 1}</div>
      <div><strong>Skip:</strong> +${dungeon.skipNum}</div>
    </div>
  `;
}

function runSimulation(data) {
  const buildIdx = parseInt(document.getElementById('build-select').value);
  const miasma = parseInt(document.getElementById('miasma-level').value) || 50;
  const numRuns = Math.min(parseInt(document.getElementById('num-runs').value) || 10, 100);
  const dungeonType = document.getElementById('dungeon-type').value;

  const saved = localStorage.getItem('whipper-builds');
  const builds = saved ? JSON.parse(saved) : [];
  const build = builds[buildIdx];
  if (!build) { alert('Please select a build.'); return; }

  const player = buildToPlayer(build);
  if (!player) { alert('Build has invalid equipment. Please fix in Build Maker.'); return; }

  let dungeon;
  if (dungeonType === 'random') {
    dungeon = generateDungeonFromKey(document.getElementById('dungeon-key').value);
    if (!dungeon) { alert('Invalid dungeon key.'); return; }
  } else {
    const dId = parseInt(document.getElementById('story-dungeon').value);
    dungeon = data.dungeons.find(d => d.id === dId);
    if (!dungeon) { alert('Invalid dungeon.'); return; }
  }

  const results = [];
  for (let i = 0; i < numRuns; i++) results.push(simulateDungeonRun(player, dungeon, miasma));

  displayResults(results, dungeon);
}

function displayResults(results, dungeon) {
  const container = document.getElementById('sim-results');
  const totalFloors = dungeon.maxFloor + (dungeon.hasBoss ? 1 : 0);
  const wins = results.filter(r => r.cleared).length;
  const avgFloors = (results.reduce((a, r) => a + r.floorsCleared, 0) / results.length).toFixed(1);
  const avgExp = Math.floor(results.reduce((a, r) => a + r.totalExp, 0) / results.length);
  const avgLevel = (results.reduce((a, r) => a + r.finalLevel, 0) / results.length).toFixed(1);

  // Show best run's floor log
  const bestRun = results.reduce((best, r) => r.floorsCleared > best.floorsCleared ? r : best, results[0]);

  container.innerHTML = `
    <div class="results-grid">
      <div class="result-item">
        <div class="result-value ${wins > 0 ? 'text-positive' : 'text-negative'}">${wins}/${results.length}</div>
        <div class="result-label">Clears</div>
      </div>
      <div class="result-item">
        <div class="result-value">${avgFloors}/${totalFloors}</div>
        <div class="result-label">Avg Floors</div>
      </div>
      <div class="result-item">
        <div class="result-value">${formatNumber(avgExp)}</div>
        <div class="result-label">Avg EXP</div>
      </div>
      <div class="result-item">
        <div class="result-value">${avgLevel}</div>
        <div class="result-label">Avg Level</div>
      </div>
    </div>

    <h4 style="color:var(--text-secondary);margin-bottom:0.5rem;font-size:0.9rem;">Best Run Floor Log (${bestRun.floorsCleared}F)</h4>
    <div class="floor-log">
      <div class="floor-row" style="font-weight:600;color:var(--text-secondary);font-size:0.75rem;">
        <span>FL</span><span>Monster</span><span>Turns</span><span>HP Left</span><span>Result</span>
      </div>
      ${bestRun.floorLog.map(f => `
        <div class="floor-row ${f.won ? 'win' : 'loss'}">
          <span class="fl">${f.floor}</span>
          <span class="monster-name" title="${f.monster} (HP:${formatNumber(f.mHp)} ATK:${formatNumber(f.mAtk)} DEF:${formatNumber(f.mDef)})">${f.monster}</span>
          <span class="turns">${f.turns}T</span>
          <span class="hp-left">${formatNumber(f.hpLeft)}</span>
          <span class="outcome ${f.won ? 'w' : 'l'}">${f.won ? 'Win' : 'Dead'}</span>
        </div>
      `).join('')}
    </div>

    <h4 style="color:var(--text-secondary);margin:1rem 0 0.5rem;font-size:0.9rem;">All Runs</h4>
    <div class="floor-log" style="max-height:200px;">
      ${results.map((r, i) => `
        <div class="floor-row ${r.cleared ? 'win' : 'loss'}" style="grid-template-columns:60px 1fr 60px 100px;">
          <span class="fl">Run ${i + 1}</span>
          <span>${r.floorsCleared}F · Lv ${r.finalLevel}</span>
          <span>${formatNumber(r.totalExp)} XP</span>
          <span class="outcome ${r.cleared ? 'w' : 'l'}">${r.cleared ? 'Clear!' : `Died F${r.diedOnFloor}: ${r.diedTo}`}</span>
        </div>
      `).join('')}
    </div>
  `;
}

document.addEventListener('DOMContentLoaded', initFightSimPage);
