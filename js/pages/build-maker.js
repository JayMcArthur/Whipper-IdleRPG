/* Whipper Wiki - Build Maker Tool */

// Analysis Book boost types
const BOOST_TYPES = [
  { id: 0, name: 'HP', rate: 0.005, max: 200, effect: '0.5%/BP' },
  { id: 1, name: 'STR', rate: 0.005, max: 200, effect: '0.5%/BP' },
  { id: 2, name: 'VIT', rate: 0.005, max: 200, effect: '0.5%/BP' },
  { id: 3, name: 'SPD', rate: 0.005, max: 200, effect: '0.5%/BP' },
  { id: 4, name: 'LUK', rate: 0.005, max: 200, effect: '0.5%/BP' },
  { id: 5, name: 'Drop Rate', rate: 0.0002, max: 200, effect: '0.02%/BP' },
  { id: 6, name: 'Crit Rate', rate: 0.002, max: 200, effect: '0.2%/BP' },
  { id: 7, name: 'Crit Damage', rate: 0.005, max: 200, effect: '0.5%/BP' },
  { id: 8, name: 'Slashing Damage', rate: 0.005, max: 200, effect: '0.5%/BP' },
  { id: 9, name: 'Bludgeoning Damage', rate: 0.005, max: 200, effect: '0.5%/BP' },
  { id: 10, name: 'Piercing Damage', rate: 0.005, max: 200, effect: '0.5%/BP' },
  { id: 11, name: 'Projectile Damage', rate: 0.005, max: 200, effect: '0.5%/BP' },
  { id: 12, name: 'Poison Damage', rate: 0.0001, max: 200, effect: '0.01%/BP' },
  { id: 13, name: 'XP Gain', rate: 0.005, max: 200, effect: '0.5%/BP' },
  { id: 14, name: 'First Strike', rate: 0, max: 50, effect: '50BP = Always first', toggle: true },
  { id: 15, name: 'Poison', rate: 0, max: 50, effect: '50BP = Inflict poison', toggle: true },
  { id: 16, name: 'Unyielding', rate: 0, max: 50, effect: '50BP = Revive once', toggle: true },
  { id: 17, name: 'One Strike', rate: 0, max: 50, effect: '50BP = +20% crit chance', toggle: true },
  { id: 18, name: 'Double Strike', rate: 0, max: 50, effect: '50BP = 20% double attack', toggle: true },
  { id: 19, name: 'Three Paths', rate: 0, max: 50, effect: '50BP = 50% for 3x crit', toggle: true },
  { id: 20, name: 'Four Leaves', rate: 0, max: 50, effect: '50BP = 20% 2x drops', toggle: true },
  { id: 21, name: 'Five Lights', rate: 0, max: 50, effect: '50BP = 20% 2x XP', toggle: true },
  { id: 22, name: 'Sixth Sense', rate: 0, max: 50, effect: '50BP = 20% dodge', toggle: true },
  { id: 23, name: 'Seven Blessings', rate: 0, max: 50, effect: '50BP = Double procs', toggle: true }
];

// Enchantment categories (Japanese nameId -> English)
const ENCHANT_CATEGORIES = {
  '耐久': 'Endurance',
  '腕力': 'Strength', 
  '頑丈': 'Sturdy',
  '俊敏': 'Agility',
  '幸運': 'Lucky',
  '腕力の鍛錬': 'STR Training',
  '防御の鍛錬': 'DEF Training',
  '体力の鍛錬': 'HP Training',
  '先制': 'First Strike',
  '一ノ太刀': 'One Strike',
  '二連撃': 'Double Strike',
  '三重奏': 'Three Paths',
  '四葉': 'Four Leaves',
  '五光': 'Five Lights',
  '六感': 'Sixth Sense',
  '七福': 'Seven Blessings'
};

let currentBuild = {
  weapon: { id: 1, upgrade: 0, corrosion: 0, analysis: 1, enchants: [0, 0, 0] },
  armor: { id: 101, upgrade: 0, corrosion: 0, analysis: 1, enchants: [0, 0, 0] },
  ring: { id: 201, upgrade: 0, corrosion: 0, analysis: 1, enchants: [0, 0, 0] },
  boostPoints: Array(24).fill(0)
};

let savedBuilds = [];

async function initBuildMakerPage() {
  const data = await loadGameData();
  
  loadSavedBuilds();
  loadItemBookBP();
  
  populateEquipmentSelects(data);
  populateEnchantSelects(data);
  renderBoostTable();
  renderSavedBuilds();
  
  // Event listeners
  document.querySelectorAll('.equip-select, .equip-input').forEach(el => {
    el.addEventListener('change', () => calculateStats(data));
  });
  
  document.getElementById('save-build-btn')?.addEventListener('click', () => saveBuild(data));
  document.getElementById('clear-boosts-btn')?.addEventListener('click', clearBoosts);
  
  calculateStats(data);
}

function loadItemBookBP() {
  // Load BP from Item Book
  const saved = localStorage.getItem('whipper-item-book');
  let totalBp = 0;
  
  if (saved) {
    try {
      const itemBook = JSON.parse(saved);
      ['weapons', 'armor', 'rings'].forEach(cat => {
        Object.values(itemBook[cat] || {}).forEach(item => {
          totalBp += Math.floor((item.level || 0) / 5);
        });
      });
    } catch (e) {}
  }
  
  document.getElementById('available-bp').textContent = totalBp;
  return totalBp;
}

function loadSavedBuilds() {
  const saved = localStorage.getItem('whipper-builds');
  if (saved) {
    try {
      savedBuilds = JSON.parse(saved);
    } catch (e) {}
  }
}

function saveSavedBuilds() {
  localStorage.setItem('whipper-builds', JSON.stringify(savedBuilds));
}

function populateEquipmentSelects(data) {
  const weapons = data.equips.filter(e => e.itemType === 1).sort((a, b) => a.id - b.id);
  const armors = data.equips.filter(e => e.itemType === 2).sort((a, b) => a.id - b.id);
  const rings = data.equips.filter(e => e.itemType === 3).sort((a, b) => a.id - b.id);
  
  document.getElementById('weapon-select').innerHTML = weapons.map(w => 
    `<option value="${w.id}">${w.id} - ${getName(w)}</option>`
  ).join('');
  
  document.getElementById('armor-select').innerHTML = armors.map(a => 
    `<option value="${a.id}">${a.id} - ${getName(a)}</option>`
  ).join('');
  
  document.getElementById('ring-select').innerHTML = rings.map(r => 
    `<option value="${r.id}">${r.id} - ${getName(r)}</option>`
  ).join('');
}

function populateEnchantSelects(data) {
  // Group enchantments by category
  const enchantGroups = {};
  data.customs.forEach(c => {
    const catName = ENCHANT_CATEGORIES[c.nameId] || c.nameId;
    if (!enchantGroups[catName]) {
      enchantGroups[catName] = [];
    }
    enchantGroups[catName].push(c);
  });
  
  // Sort each group by level
  Object.keys(enchantGroups).forEach(cat => {
    enchantGroups[cat].sort((a, b) => a.dispLv - b.dispLv);
  });
  
  // Create category selects
  const categoryOptions = '<option value="">None</option>' + 
    Object.keys(enchantGroups).sort().map(cat => `<option value="${cat}">${cat}</option>`).join('');
  
  // Populate all enchant category selects
  for (let i = 1; i <= 9; i++) {
    const catSelect = document.getElementById(`enchant-cat-${i}`);
    const lvlSelect = document.getElementById(`enchant-lvl-${i}`);
    
    if (catSelect) {
      catSelect.innerHTML = categoryOptions;
      catSelect.addEventListener('change', (e) => {
        const cat = e.target.value;
        if (cat && enchantGroups[cat]) {
          lvlSelect.innerHTML = enchantGroups[cat].map(enc => 
            `<option value="${enc.id}">Lv ${enc.dispLv} (${enc.value})</option>`
          ).join('');
          lvlSelect.disabled = false;
        } else {
          lvlSelect.innerHTML = '<option value="0">-</option>';
          lvlSelect.disabled = true;
        }
        calculateStats(WikiData);
      });
    }
    
    if (lvlSelect) {
      lvlSelect.innerHTML = '<option value="0">-</option>';
      lvlSelect.disabled = true;
      lvlSelect.addEventListener('change', () => calculateStats(WikiData));
    }
  }
}

function renderBoostTable() {
  const container = document.getElementById('boost-table');
  if (!container) return;
  
  container.innerHTML = BOOST_TYPES.map((boost, idx) => `
    <tr>
      <td>${boost.name}</td>
      <td class="boost-effect">${boost.effect}</td>
      <td>
        ${boost.toggle ? 
          `<input type="checkbox" class="boost-toggle" data-idx="${idx}" ${currentBuild.boostPoints[idx] >= 50 ? 'checked' : ''}>` :
          `<input type="number" class="boost-input" data-idx="${idx}" value="${currentBuild.boostPoints[idx]}" min="0" max="${boost.max}">`
        }
      </td>
      <td class="boost-total" id="boost-total-${idx}">0%</td>
    </tr>
  `).join('');
  
  // Add event listeners
  container.querySelectorAll('.boost-input').forEach(input => {
    input.addEventListener('change', (e) => {
      const idx = parseInt(e.target.dataset.idx);
      currentBuild.boostPoints[idx] = Math.min(parseInt(e.target.value) || 0, BOOST_TYPES[idx].max);
      e.target.value = currentBuild.boostPoints[idx];
      updateBoostTotals();
      calculateStats(WikiData);
    });
  });
  
  container.querySelectorAll('.boost-toggle').forEach(input => {
    input.addEventListener('change', (e) => {
      const idx = parseInt(e.target.dataset.idx);
      currentBuild.boostPoints[idx] = e.target.checked ? 50 : 0;
      updateBoostTotals();
      calculateStats(WikiData);
    });
  });
  
  updateBoostTotals();
}

function updateBoostTotals() {
  let usedBp = 0;
  
  BOOST_TYPES.forEach((boost, idx) => {
    const points = currentBuild.boostPoints[idx];
    usedBp += points;
    
    const totalEl = document.getElementById(`boost-total-${idx}`);
    if (totalEl) {
      if (boost.toggle) {
        totalEl.textContent = points >= 50 ? 'Active' : '-';
      } else {
        totalEl.textContent = (points * boost.rate * 100).toFixed(2) + '%';
      }
    }
  });
  
  document.getElementById('used-bp').textContent = usedBp;
  
  const availableBp = parseInt(document.getElementById('available-bp').textContent) || 0;
  const remaining = availableBp - usedBp;
  document.getElementById('remaining-bp').textContent = remaining;
  document.getElementById('remaining-bp').className = remaining < 0 ? 'text-negative' : '';
}

function clearBoosts() {
  currentBuild.boostPoints = Array(24).fill(0);
  renderBoostTable();
  calculateStats(WikiData);
}

function getEnchantIds() {
  const ids = [];
  for (let i = 1; i <= 9; i++) {
    const lvlSelect = document.getElementById(`enchant-lvl-${i}`);
    ids.push(parseInt(lvlSelect?.value) || 0);
  }
  return ids;
}

function calculateStats(data) {
  // Get equipment
  const weaponId = parseInt(document.getElementById('weapon-select').value);
  const armorId = parseInt(document.getElementById('armor-select').value);
  const ringId = parseInt(document.getElementById('ring-select').value);
  
  const weapon = data.equips.find(e => e.id === weaponId);
  const armor = data.equips.find(e => e.id === armorId);
  const ring = data.equips.find(e => e.id === ringId);
  
  if (!weapon || !armor || !ring) return;
  
  // Get upgrade/corrosion/analysis values
  const weaponUpgrade = parseInt(document.getElementById('weapon-upgrade').value) || 0;
  const armorUpgrade = parseInt(document.getElementById('armor-upgrade').value) || 0;
  const weaponCorrosion = parseInt(document.getElementById('weapon-corrosion').value) || 0;
  const armorCorrosion = parseInt(document.getElementById('armor-corrosion').value) || 0;
  const ringCorrosion = parseInt(document.getElementById('ring-corrosion').value) || 0;
  const weaponAnalysis = parseInt(document.getElementById('weapon-analysis').value) || 1;
  const armorAnalysis = parseInt(document.getElementById('armor-analysis').value) || 1;
  const ringAnalysis = parseInt(document.getElementById('ring-analysis').value) || 1;
  const playerLevel = parseInt(document.getElementById('player-level').value) || 1;
  
  // Update max upgrade display
  let weaponMaxUpgrade = weapon.maxLv;
  let armorMaxUpgrade = armor.maxLv;
  
  // Analysis bonuses to upgrade cap (from entity.py)
  const upgradeBoosts = [0, 0, 0, 0, 100, 100, 100, 1000, 1000, 1000, 1000, 2000, 2000, 2000, 3000, 3000, 4000, 5000, 6000, 9900, 19000];
  weaponMaxUpgrade += upgradeBoosts[Math.min(weaponAnalysis, 20)] || 0;
  armorMaxUpgrade += upgradeBoosts[Math.min(armorAnalysis, 20)] || 0;
  
  document.getElementById('weapon-max-upgrade').textContent = formatNumber(weaponMaxUpgrade);
  document.getElementById('armor-max-upgrade').textContent = formatNumber(armorMaxUpgrade);
  
  // Get enchantment bonuses
  const enchantIds = getEnchantIds();
  let enchantBonus = { hp: 0, str: 0, vit: 0, spd: 0, luk: 0, hpUp: 0, strUp: 0, vitUp: 0 };
  
  enchantIds.forEach(id => {
    if (!id) return;
    const custom = data.customs.find(c => c.id === id);
    if (!custom) return;
    
    const val = custom.value;
    const name = custom.nameId;
    
    if (name === '耐久') enchantBonus.hp += val;
    else if (name === '腕力') enchantBonus.str += val;
    else if (name === '頑丈') enchantBonus.vit += val;
    else if (name === '俊敏') enchantBonus.spd += val;
    else if (name === '幸運') enchantBonus.luk += val;
    else if (name === '体力の鍛錬') enchantBonus.hpUp += val;
    else if (name === '腕力の鍛錬') enchantBonus.strUp += val;
    else if (name === '防御の鍛錬') enchantBonus.vitUp += val;
  });
  
  // Analysis boost multipliers
  const bpBoosts = currentBuild.boostPoints;
  const analysisBoost = {
    hp: 1 + bpBoosts[0] * 0.005,
    str: 1 + bpBoosts[1] * 0.005,
    vit: 1 + bpBoosts[2] * 0.005,
    spd: 1 + bpBoosts[3] * 0.005,
    luk: 1 + bpBoosts[4] * 0.005
  };
  
  // Check set bonus
  const hasSet = weapon.set && (translate(weapon.set) === getName(armor) || translate(weapon.set) === getName(ring));
  
  // Base stats (from entity.py apply_level)
  let baseHP = 30 + weapon.hp + armor.hp + ring.hp + enchantBonus.hp;
  let baseSTR = 10 + weapon.atk + armor.atk + ring.atk + enchantBonus.str;
  let baseVIT = 10 + weapon.def + armor.def + ring.def + enchantBonus.vit;
  let baseSPD = 1 + enchantBonus.spd;
  let baseLUK = 1 + enchantBonus.luk;
  
  // Level up bonuses
  const lvUpHP = 10 + weapon.lvHp + armor.lvHp + ring.lvHp + enchantBonus.hpUp;
  const lvUpSTR = 1 + weapon.lvAtk + armor.lvAtk + ring.lvAtk + enchantBonus.strUp;
  const lvUpVIT = 1 + weapon.lvDef + armor.lvDef + ring.lvDef + enchantBonus.vitUp;
  const lvUpSPD = 1;
  
  // Add level bonuses
  baseHP += lvUpHP * (playerLevel - 1);
  baseSTR += lvUpSTR * (playerLevel - 1);
  baseVIT += lvUpVIT * (playerLevel - 1);
  baseSPD += lvUpSPD * (playerLevel - 1);
  
  // Apply multipliers (equipment mult + analysis boost - 3)
  // Note: In game, each equipment starts with 1.0 mult, so 3 items = 3.0, hence -3
  const finalHP = Math.floor(baseHP * analysisBoost.hp);
  const finalSTR = Math.floor(baseSTR * analysisBoost.str);
  const finalVIT = Math.floor(baseVIT * analysisBoost.vit);
  const finalSPD = Math.floor(baseSPD * analysisBoost.spd);
  const finalLUK = Math.floor(baseLUK * analysisBoost.luk);
  
  // Weapon strength calculation
  let upgradeBoost = 1;
  let corrosionBoost = 1;
  let weaponBoost = 1;
  
  // Analysis effects (simplified from entity.py)
  if (weaponAnalysis >= 6 && weaponCorrosion >= 50) weaponBoost *= 1.3;
  if (weaponAnalysis >= 8 && weaponCorrosion >= 150) upgradeBoost *= 2;
  if (weaponAnalysis >= 10 && weaponCorrosion >= 250) corrosionBoost *= 2;
  if (weaponAnalysis >= 12 && weaponCorrosion >= 350) upgradeBoost *= 2;
  if (weaponAnalysis >= 15 && weaponCorrosion >= 500) corrosionBoost *= 2;
  
  const effectiveUpgrade = Math.min(weaponUpgrade, weaponMaxUpgrade);
  const weaponPower = ((effectiveUpgrade * upgradeBoost) + (weaponCorrosion * 10 * corrosionBoost) + weapon.param) * weaponBoost;
  
  // Weapon damage type boost from BP
  let weaponDmgBoost = 1;
  const attackKind = weapon.attackKind;
  if (attackKind === 'Slashing') weaponDmgBoost += bpBoosts[8] * 0.005;
  else if (attackKind === 'Bludgeoning') weaponDmgBoost += bpBoosts[9] * 0.005;
  else if (attackKind === 'Piercing') weaponDmgBoost += bpBoosts[10] * 0.005;
  else if (attackKind === 'Projectile') weaponDmgBoost += bpBoosts[11] * 0.005;
  
  const attack = Math.floor((finalSTR + weaponPower) * weaponDmgBoost);
  
  // Armor defense calculation
  let armorUpgradeBoost = 1;
  let armorCorrosionBoost = 1;
  let armorBoost = 1;
  
  if (armorAnalysis >= 8 && armorCorrosion >= 150) armorUpgradeBoost *= 2;
  if (armorAnalysis >= 9 && armorCorrosion >= 200) armorBoost *= 1.3;
  if (armorAnalysis >= 10 && armorCorrosion >= 250) armorCorrosionBoost *= 2;
  if (armorAnalysis >= 12 && armorCorrosion >= 350) armorUpgradeBoost *= 2;
  if (armorAnalysis >= 15 && armorCorrosion >= 500) armorCorrosionBoost *= 2;
  
  const effectiveArmorUpgrade = Math.min(armorUpgrade, armorMaxUpgrade);
  const armorPower = ((effectiveArmorUpgrade * armorUpgradeBoost) + (armorCorrosion * 10 * armorCorrosionBoost) + armor.param) * armorBoost;
  const defense = Math.floor(finalVIT + armorPower);
  
  // Display results
  document.getElementById('result-hp').textContent = formatNumber(finalHP);
  document.getElementById('result-str').textContent = formatNumber(finalSTR);
  document.getElementById('result-vit').textContent = formatNumber(finalVIT);
  document.getElementById('result-spd').textContent = formatNumber(finalSPD);
  document.getElementById('result-luk').textContent = formatNumber(finalLUK);
  document.getElementById('result-attack').textContent = formatNumber(attack);
  document.getElementById('result-defense').textContent = formatNumber(defense);
  document.getElementById('result-weapon-power').textContent = formatNumber(Math.floor(weaponPower));
  document.getElementById('result-armor-power').textContent = formatNumber(Math.floor(armorPower));
  document.getElementById('result-set').textContent = hasSet ? `Yes (${translate(weapon.set)})` : 'No';
  document.getElementById('result-attack-kind').textContent = attackKind || '-';
  
  // Store current build
  currentBuild.weapon = { id: weaponId, upgrade: weaponUpgrade, corrosion: weaponCorrosion, analysis: weaponAnalysis, enchants: enchantIds.slice(0, 3) };
  currentBuild.armor = { id: armorId, upgrade: armorUpgrade, corrosion: armorCorrosion, analysis: armorAnalysis, enchants: enchantIds.slice(3, 6) };
  currentBuild.ring = { id: ringId, upgrade: 0, corrosion: ringCorrosion, analysis: ringAnalysis, enchants: enchantIds.slice(6, 9) };
}

function saveBuild(data) {
  const name = prompt('Enter a name for this build:');
  if (!name) return;
  
  const build = {
    name,
    timestamp: Date.now(),
    ...JSON.parse(JSON.stringify(currentBuild))
  };
  
  savedBuilds.push(build);
  saveSavedBuilds();
  renderSavedBuilds();
}

function loadBuild(index) {
  const build = savedBuilds[index];
  if (!build) return;
  
  currentBuild = JSON.parse(JSON.stringify(build));
  
  // Update UI
  document.getElementById('weapon-select').value = build.weapon.id;
  document.getElementById('weapon-upgrade').value = build.weapon.upgrade;
  document.getElementById('weapon-corrosion').value = build.weapon.corrosion;
  document.getElementById('weapon-analysis').value = build.weapon.analysis;
  
  document.getElementById('armor-select').value = build.armor.id;
  document.getElementById('armor-upgrade').value = build.armor.upgrade;
  document.getElementById('armor-corrosion').value = build.armor.corrosion;
  document.getElementById('armor-analysis').value = build.armor.analysis;
  
  document.getElementById('ring-select').value = build.ring.id;
  document.getElementById('ring-corrosion').value = build.ring.corrosion;
  document.getElementById('ring-analysis').value = build.ring.analysis;
  
  renderBoostTable();
  calculateStats(WikiData);
}

function deleteBuild(index) {
  if (confirm('Delete this build?')) {
    savedBuilds.splice(index, 1);
    saveSavedBuilds();
    renderSavedBuilds();
  }
}

function renderSavedBuilds() {
  const container = document.getElementById('saved-builds-list');
  if (!container) return;
  
  if (savedBuilds.length === 0) {
    container.innerHTML = '<p class="text-muted">No saved builds yet.</p>';
    return;
  }
  
  container.innerHTML = savedBuilds.map((build, idx) => `
    <div class="saved-build">
      <div class="build-info">
        <strong>${build.name}</strong>
        <small>${new Date(build.timestamp).toLocaleDateString()}</small>
      </div>
      <div class="build-actions">
        <button class="btn btn-sm" onclick="loadBuild(${idx})">Load</button>
        <button class="btn btn-sm btn-danger" onclick="deleteBuild(${idx})">Delete</button>
      </div>
    </div>
  `).join('');
}

document.addEventListener('DOMContentLoaded', initBuildMakerPage);
