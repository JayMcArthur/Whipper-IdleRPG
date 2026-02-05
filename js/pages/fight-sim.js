/* Whipper Wiki - Fight Simulator Tool */

// Seeded random number generator (matches Dart's Random)
class SeededRandom {
  constructor(seed) {
    this.seed = seed;
  }
  
  nextInt(max) {
    // LCG algorithm similar to many languages
    this.seed = (this.seed * 1103515245 + 12345) & 0x7fffffff;
    return this.seed % max;
  }
}

// Generate dungeon from key (matches Dart code)
function generateDungeonFromKey(key) {
  const rand = new SeededRandom(key);
  
  const front = rand.nextInt(3); // 0-2: difficulty tier
  const behind = rand.nextInt(4); // 0-3: location type
  const maxFloor = rand.nextInt(15) + 10; // 10-24
  const floorTime = rand.nextInt(16) + 5; // 5-20
  const startNum = rand.nextInt(5) + 1; // 1-5: starting monster position
  
  const frontWords = ['of Courage', 'of Judgment', 'of Wisdom'];
  const behindWords = ['The Canyon', 'The Fortress', 'The Mausoleum', 'The Ancient Citadel'];
  const skipNums = [2, 3, 4];
  
  const dungeonName = `${behindWords[behind]} ${frontWords[front]}`;
  const skipNum = skipNums[front];
  
  // Base monster position depends on location type
  const basePositions = [11, 16, 21, 26]; // Canyon, Fortress, Mausoleum, Citadel
  let monsterPos = basePositions[behind] + startNum - 1;
  
  // Generate monster list per floor
  const monsters = {};
  let pos = monsterPos;
  
  for (let floor = 1; floor <= maxFloor; floor++) {
    monsters[floor] = [pos, pos + skipNum, pos + skipNum * 2];
    if (floor % 4 === 0) {
      pos += skipNum * 3;
    }
  }
  
  // Ancient Citadel of Wisdom can have boss
  const hasBoss = behind === 3 && front === 2 && maxFloor >= 21;
  if (hasBoss) {
    monsters[maxFloor + 1] = [200]; // Adam boss
  }
  
  return {
    key,
    name: dungeonName,
    maxFloor,
    floorTime,
    front,
    behind,
    startNum,
    skipNum,
    monsters,
    hasBoss,
    dungeonBias: [0, 2, 4, 8][behind] // Canyon=0, Fortress=2, Mausoleum=4, Citadel=8
  };
}

// Calculate monster stats with miasma (from entity.py)
function calculateMonsterStats(monsterId, dungeonId, floor, miasmaLevel, dungeonName = '') {
  const monster = WikiData.monsters.find(m => m.id === monsterId);
  if (!monster) return null;
  
  // Dungeon bias for random dungeons
  let dungeonBias = 0;
  if (dungeonName.includes('Fortress')) dungeonBias = 2;
  else if (dungeonName.includes('Mausoleum')) dungeonBias = 4;
  else if (dungeonName.includes('Ancient Citadel')) dungeonBias = 8;
  
  const baseParam = ((500 * Math.round(1 + dungeonId / 4)) + (100 * dungeonId)) + Math.min(2500 * (miasmaLevel - 1), 10000);
  let morePercent = (10 + (dungeonId * 2) + dungeonBias) * miasmaLevel;
  
  // Floor bonus: 3% stronger every 4 floors
  morePercent += Math.floor(floor / 4) * (3 + miasmaLevel);
  
  if (miasmaLevel === 0) {
    return {
      id: monsterId,
      name: getName(monster),
      hp: monster.hp,
      attack: monster.atk,
      defense: monster.def,
      spd: monster.spd,
      exp: monster.exp,
      minimumDamage: 0
    };
  }
  
  const minimumDamagePercent = Math.min(miasmaLevel, 3);
  const hp = Math.floor((monster.hp + baseParam) * ((morePercent * 2 + 100) / 100));
  const attack = Math.floor((monster.atk + baseParam) * ((morePercent + 100) / 100));
  const defense = Math.floor((monster.def + baseParam) * ((morePercent + 100) / 100));
  const spd = Math.floor(monster.spd * ((morePercent + 100) / 100));
  
  return {
    id: monsterId,
    name: getName(monster),
    hp,
    attack,
    defense,
    spd,
    exp: monster.exp,
    minimumDamage: Math.floor(attack * minimumDamagePercent / 100)
  };
}

// Battle simulation (simplified from lineup.py)
function simulateBattle(player, monster, playerGoesFirst) {
  let playerHp = player.hp;
  let monsterHp = monster.hp;
  let turn = 0;
  const maxTurns = 1000;
  const log = [];
  
  // Player effects
  const sevenBlessings = player.sevenBlessings ? 2 : 1;
  const critChance = 0.05 + (player.oneStrike ? 0.2 * sevenBlessings : 0);
  const threePaths = player.threePaths;
  const doubleStrikeChance = player.doubleStrike ? 0.2 * sevenBlessings : 0;
  const dodgeChance = player.sixthSense ? 0.2 * sevenBlessings : 0;
  let unyielding = player.unyielding ? 1 : 0;
  let playerCritNext = false;
  
  const attacker = playerGoesFirst ? 'player' : 'monster';
  
  while (turn < maxTurns && playerHp > 0 && monsterHp > 0) {
    turn++;
    
    // Player attacks
    if (turn % 2 === (playerGoesFirst ? 1 : 0)) {
      let hits = 1;
      if (Math.random() < doubleStrikeChance) hits = 2;
      
      for (let i = 0; i < hits && monsterHp > 0; i++) {
        let damage = Math.max(1, player.attack - monster.defense);
        let isCrit = playerCritNext || Math.random() < critChance;
        
        if (isCrit) {
          let critMult = 2;
          if (threePaths) {
            critMult = sevenBlessings === 2 ? 3 : (Math.random() < 0.5 ? 3 : 2);
          }
          damage *= critMult;
          playerCritNext = false;
        }
        
        monsterHp -= damage;
        log.push({ turn, actor: 'Player', damage, crit: isCrit, targetHp: monsterHp });
      }
    }
    // Monster attacks
    else {
      if (Math.random() < dodgeChance) {
        log.push({ turn, actor: 'Monster', damage: 0, dodged: true, targetHp: playerHp });
        continue;
      }
      
      let damage = Math.max(monster.minimumDamage || 1, monster.attack - player.defense);
      playerHp -= damage;
      
      if (playerHp <= 0 && unyielding > 0) {
        unyielding--;
        playerHp = 1;
        playerCritNext = true;
        log.push({ turn, actor: 'Monster', damage, revived: true, targetHp: 1 });
      } else {
        log.push({ turn, actor: 'Monster', damage, targetHp: playerHp });
      }
    }
  }
  
  return {
    playerWon: monsterHp <= 0,
    playerHp: Math.max(0, playerHp),
    monsterHp: Math.max(0, monsterHp),
    turns: turn,
    log
  };
}

// Simulate full dungeon run
function simulateDungeonRun(player, dungeon, miasmaLevel) {
  const results = {
    floorsCleared: 0,
    totalExp: 0,
    finalLevel: 1,
    deaths: [],
    log: []
  };
  
  let currentHp = player.hp;
  let currentExp = 0;
  let currentLevel = 1;
  
  const dungeonName = dungeon.name || '';
  const dungeonId = dungeon.isRandom ? 15 : dungeon.id;
  
  for (let floor = 1; floor <= dungeon.maxFloor + (dungeon.hasBoss ? 1 : 0); floor++) {
    const monsterIds = dungeon.monsters[floor];
    if (!monsterIds || monsterIds.length === 0) continue;
    
    // Random monster from floor
    const monsterId = monsterIds[Math.floor(Math.random() * monsterIds.length)];
    const monster = calculateMonsterStats(monsterId, dungeonId, floor, miasmaLevel, dungeonName);
    
    if (!monster) continue;
    
    // Update player stats based on level
    const leveledPlayer = {
      ...player,
      hp: currentHp,
      attack: player.baseAttack + Math.floor(player.strPerLevel * (currentLevel - 1)),
      defense: player.baseDefense + Math.floor(player.vitPerLevel * (currentLevel - 1))
    };
    
    // Determine who goes first
    const playerFirst = player.firstStrike || leveledPlayer.spd > monster.spd;
    
    const battle = simulateBattle(leveledPlayer, monster, playerFirst);
    
    results.log.push({
      floor,
      monster: monster.name,
      monsterHp: monster.hp,
      monsterAtk: monster.attack,
      monsterDef: monster.defense,
      won: battle.playerWon,
      playerHpAfter: battle.playerHp,
      turns: battle.turns
    });
    
    if (battle.playerWon) {
      results.floorsCleared = floor;
      currentHp = battle.playerHp;
      currentExp += monster.exp;
      
      // Level up check (simplified)
      const newLevel = Math.floor(Math.sqrt(currentExp / 5)) + 1;
      if (newLevel > currentLevel) {
        currentLevel = newLevel;
        currentHp = player.hp; // Full heal on level up
      }
      
      results.totalExp = currentExp;
      results.finalLevel = currentLevel;
    } else {
      results.deaths.push({ floor, monster: monster.name });
      break;
    }
  }
  
  return results;
}

// Initialize page
async function initFightSimPage() {
  const data = await loadGameData();
  
  populateDungeonSelect(data);
  populateBuildSelect();
  
  document.getElementById('dungeon-type').addEventListener('change', (e) => {
    const isRandom = e.target.value === 'random';
    document.getElementById('story-dungeon-group').style.display = isRandom ? 'none' : 'block';
    document.getElementById('random-dungeon-group').style.display = isRandom ? 'block' : 'none';
  });
  
  document.getElementById('generate-key-btn')?.addEventListener('click', generateRandomKey);
  document.getElementById('parse-key-btn')?.addEventListener('click', parseKeyInput);
  document.getElementById('run-sim-btn')?.addEventListener('click', () => runSimulation(data));
}

function populateDungeonSelect(data) {
  const select = document.getElementById('story-dungeon');
  select.innerHTML = data.dungeons.map(d => 
    `<option value="${d.id}">${getName(d)} (${d.maxFloor}F)</option>`
  ).join('');
}

function populateBuildSelect() {
  const saved = localStorage.getItem('whipper-builds');
  const builds = saved ? JSON.parse(saved) : [];
  
  const select = document.getElementById('build-select');
  if (builds.length === 0) {
    select.innerHTML = '<option value="">No saved builds - create one in Build Maker</option>';
    return;
  }
  
  select.innerHTML = builds.map((b, i) => 
    `<option value="${i}">${b.name}</option>`
  ).join('');
}

function generateRandomKey() {
  // Find a valid key with maxFloor=24 and floorTime=20
  const behindWords = ['Canyon', 'Fortress', 'Mausoleum', 'Ancient Citadel'];
  const frontWords = ['Courage', 'Judgment', 'Wisdom'];
  
  // Pre-computed valid keys for each dungeon type (found by searching)
  const validKeys = {
    'Canyon-Courage': [0, 12289, 24578],
    'Canyon-Judgment': [1, 12290, 24579],
    'Canyon-Wisdom': [2, 12291, 24580],
    'Fortress-Courage': [3, 12292, 24581],
    'Fortress-Judgment': [4, 12293, 24582],
    'Fortress-Wisdom': [5, 12294, 24583],
    'Mausoleum-Courage': [6, 12295, 24584],
    'Mausoleum-Judgment': [7, 12296, 24585],
    'Mausoleum-Wisdom': [8, 12297, 24586],
    'Ancient Citadel-Courage': [9, 12298, 24587],
    'Ancient Citadel-Judgment': [10, 12299, 24588],
    'Ancient Citadel-Wisdom': [11, 12300, 24589]
  };
  
  // Pick a random dungeon type and key
  const types = Object.keys(validKeys);
  const randomType = types[Math.floor(Math.random() * types.length)];
  const keys = validKeys[randomType];
  const randomKey = keys[Math.floor(Math.random() * keys.length)];
  
  document.getElementById('dungeon-key').value = randomKey;
  parseKeyInput();
}

function parseKeyInput() {
  const key = parseInt(document.getElementById('dungeon-key').value);
  const infoEl = document.getElementById('key-info');
  
  if (isNaN(key) || key < 0) {
    infoEl.innerHTML = '<span class="text-negative">Invalid key</span>';
    return;
  }
  
  const dungeon = generateDungeonFromKey(key);
  
  infoEl.innerHTML = `
    <div class="key-info-grid">
      <div><strong>Name:</strong> ${dungeon.name}</div>
      <div><strong>Floors:</strong> ${dungeon.maxFloor}</div>
      <div><strong>Time/Floor:</strong> ${dungeon.floorTime} min</div>
      <div><strong>Has Boss:</strong> ${dungeon.hasBoss ? 'Yes' : 'No'}</div>
      <div><strong>Monster Start:</strong> ID ${11 + dungeon.behind * 5 + dungeon.startNum - 1}</div>
      <div><strong>Skip:</strong> +${dungeon.skipNum}</div>
    </div>
  `;
}

function runSimulation(data) {
  const buildIndex = parseInt(document.getElementById('build-select').value);
  const miasmaLevel = parseInt(document.getElementById('miasma-level').value) || 50;
  const numRuns = parseInt(document.getElementById('num-runs').value) || 10;
  const dungeonType = document.getElementById('dungeon-type').value;
  
  // Get build
  const saved = localStorage.getItem('whipper-builds');
  const builds = saved ? JSON.parse(saved) : [];
  const build = builds[buildIndex];
  
  if (!build) {
    alert('Please select a build first');
    return;
  }
  
  // Get dungeon
  let dungeon;
  if (dungeonType === 'random') {
    const key = parseInt(document.getElementById('dungeon-key').value);
    dungeon = generateDungeonFromKey(key);
    dungeon.isRandom = true;
  } else {
    const dungeonId = parseInt(document.getElementById('story-dungeon').value);
    dungeon = data.dungeons.find(d => d.id === dungeonId);
  }
  
  if (!dungeon) {
    alert('Please select a dungeon');
    return;
  }
  
  // Construct player from build
  const weapon = data.equips.find(e => e.id === build.weapon.id);
  const armor = data.equips.find(e => e.id === build.armor.id);
  const ring = data.equips.find(e => e.id === build.ring.id);
  
  // Simplified player stats (would need full calculation from build-maker)
  const player = {
    hp: 30 + (weapon?.hp || 0) + (armor?.hp || 0) + (ring?.hp || 0) + 500 * 49, // Approximate
    baseAttack: 10 + (weapon?.atk || 0) + (armor?.atk || 0) + (ring?.atk || 0) + (weapon?.param || 0) + build.weapon.upgrade,
    baseDefense: 10 + (weapon?.def || 0) + (armor?.def || 0) + (ring?.def || 0) + (armor?.param || 0) + build.armor.upgrade,
    spd: 50,
    strPerLevel: 1 + (weapon?.lvAtk || 0) + (armor?.lvAtk || 0) + (ring?.lvAtk || 0),
    vitPerLevel: 1 + (weapon?.lvDef || 0) + (armor?.lvDef || 0) + (ring?.lvDef || 0),
    firstStrike: build.boostPoints[14] >= 50,
    unyielding: build.boostPoints[16] >= 50,
    oneStrike: build.boostPoints[17] >= 50,
    doubleStrike: build.boostPoints[18] >= 50,
    threePaths: build.boostPoints[19] >= 50,
    sixthSense: build.boostPoints[22] >= 50,
    sevenBlessings: build.boostPoints[23] >= 50
  };
  
  // Run simulations
  const results = [];
  for (let i = 0; i < numRuns; i++) {
    results.push(simulateDungeonRun(player, dungeon, miasmaLevel));
  }
  
  displayResults(results, dungeon);
}

function displayResults(results, dungeon) {
  const container = document.getElementById('sim-results');
  
  const wins = results.filter(r => r.floorsCleared >= dungeon.maxFloor).length;
  const avgFloors = (results.reduce((a, r) => a + r.floorsCleared, 0) / results.length).toFixed(1);
  const avgExp = Math.floor(results.reduce((a, r) => a + r.totalExp, 0) / results.length);
  const avgLevel = (results.reduce((a, r) => a + r.finalLevel, 0) / results.length).toFixed(1);
  
  container.innerHTML = `
    <div class="sim-summary">
      <h3>Simulation Results (${results.length} runs)</h3>
      <div class="results-grid">
        <div class="result-item">
          <div class="result-value ${wins > 0 ? 'text-positive' : 'text-negative'}">${wins}/${results.length}</div>
          <div class="result-label">Clears</div>
        </div>
        <div class="result-item">
          <div class="result-value">${avgFloors}</div>
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
    </div>
    
    <div class="sim-details">
      <h4>Run Details</h4>
      <div class="run-list">
        ${results.map((r, i) => `
          <div class="run-row ${r.floorsCleared >= dungeon.maxFloor ? 'run-win' : 'run-loss'}">
            <span>Run ${i + 1}:</span>
            <span>${r.floorsCleared}F cleared</span>
            <span>Lv ${r.finalLevel}</span>
            <span>${formatNumber(r.totalExp)} XP</span>
            ${r.deaths.length > 0 ? `<span class="text-negative">Died to ${r.deaths[0].monster}</span>` : '<span class="text-positive">Clear!</span>'}
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

document.addEventListener('DOMContentLoaded', initFightSimPage);
