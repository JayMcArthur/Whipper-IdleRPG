/* Whipper Wiki - Build Maker Tool (v4) - Accurate game calculations */

// Proofs of Subjugation
const PROOFS = [
  { id: 'bookmark', name: 'Bookmark', max: 999, effect: '+1000 HP/lv' },
  { id: 'combatChip', name: 'Combat Chip', max: 100, effect: '+5 BP/lv' },
  { id: 'thousandHand', name: 'Thousand-Hand', max: 100, effect: '+1 enchant lv' },
  { id: 'adamHeart', name: "Adam's Heart", max: 10, effect: '+20 max BP/lv' },
  { id: 'panoptesEye', name: "Panoptes' Eye", max: 10, effect: '+1 analysis/lv' },
  { id: 'killingStone', name: 'Killing Stone', max: 10, effect: '+500 corrosion/lv' },
  { id: 'magatama', name: 'Magatama', max: 10, effect: '+legend rate' }
];

// Enchantment categories - Game uses format: category * 10000 + level
const ENCHANT_CATS = [
  { id: 0, name: 'None', stat: null },
  { id: 1, name: 'Endurance', stat: 'hp' },
  { id: 2, name: 'Strength', stat: 'str' },
  { id: 3, name: 'Sturdy', stat: 'vit' },
  { id: 4, name: 'Agility', stat: 'spd' },
  { id: 5, name: 'Lucky', stat: 'luk' },
  { id: 6, name: 'HP Training', stat: 'hpLv' },
  { id: 7, name: 'STR Training', stat: 'strLv' },
  { id: 8, name: 'VIT Training', stat: 'vitLv' }
];

// Known enchant values at high levels (from game data)
const ENCHANT_VALUES = {
  hp: { 190: 96500, 191: 97500, 192: 99000, 193: 101000, 194: 105000, 195: 112000, 196: 122000 },
  str: { 190: 96500, 191: 97500, 192: 99000, 193: 101000, 194: 105000, 195: 112000, 196: 122000 },
  vit: { 190: 96500, 191: 97500, 192: 99000, 193: 101000, 194: 105000, 195: 112000, 196: 122000 },
  spd: { 190: 18870, 191: 19070, 192: 19400, 193: 20000, 194: 20800, 195: 22000, 196: 24000 },
  luk: { 1: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6, 7: 7, 8: 8 },
  hpLv: { 190: 4700, 191: 4780, 192: 4900, 193: 5100, 194: 5400, 195: 5800, 196: 6500 },
  strLv: { 190: 1, 191: 1, 192: 1, 193: 1, 194: 1, 195: 1, 196: 1 },
  vitLv: { 190: 1, 191: 1, 192: 1, 193: 1, 194: 1, 195: 1, 196: 1 }
};

// Analysis upgrade limits
const UPGRADE_LIMITS = {
  1: 10, 2: 20, 3: 30, 4: 40, 5: 60, 6: 80, 7: 100, 8: 130, 9: 160, 10: 200,
  11: 250, 12: 320, 13: 400, 14: 500, 15: 650, 16: 850, 17: 1100, 18: 1500,
  19: 2000, 20: 3000, 21: 4000, 22: 6000, 23: 10000, 24: 20000, 25: 100000
};

// Ring analysis stat boosts (at analysis 25 max corrosion - from screenshot)
// These are the "Break through the limit" bonuses shown on ring
const RING_ANALYSIS_BOOSTS = {
  // Analysis level thresholds and their boosts
  strBoost: 1.3,      // ×2.3 total = 1 + 1.3
  allStatsBoost: 1.7, // ×2.7 total = 1 + 1.7
  hpBoost: 0.8,       // ×1.8 total
  vitBoost: 0.3,      // ×1.3 total
  masteryBoost: 0.6   // ×1.6 = +0.6 when using matching attack type
};

// Rarity stat boosts
const RARITY_BOOSTS = {
  red: { str: 0 },
  legendary: { str: 0.2 },
  mythical: { str: 0.4 },
  noir: { str: 0.6 },
  omega: { all: 0.3 }
};

// Permanent Boost types
const BOOST_TYPES = [
  { id: 0, name: 'HP', rate: 0.005, max: 300, effect: '+0.5%' },
  { id: 1, name: 'STR', rate: 0.005, max: 300, effect: '+0.5%' },
  { id: 2, name: 'VIT', rate: 0.005, max: 300, effect: '+0.5%' },
  { id: 3, name: 'SPD', rate: 0.005, max: 300, effect: '+0.5%' },
  { id: 4, name: 'LUK', rate: 0.005, max: 300, effect: '+0.5%' },
  { id: 5, name: 'Drop Rate', rate: 0.0002, max: 300, effect: '+0.02%' },
  { id: 6, name: 'Crit Rate', rate: 0.002, max: 300, effect: '+0.2%' },
  { id: 7, name: 'Crit Dmg', rate: 0.005, max: 300, effect: '+0.5%' },
  { id: 8, name: 'Slashing', rate: 0.005, max: 300, effect: '+0.5%' },
  { id: 9, name: 'Bludgeon', rate: 0.005, max: 300, effect: '+0.5%' },
  { id: 10, name: 'Piercing', rate: 0.005, max: 300, effect: '+0.5%' },
  { id: 11, name: 'Projectile', rate: 0.005, max: 300, effect: '+0.5%' },
  { id: 12, name: 'Poison', rate: 0.0001, max: 300, effect: '+0.01%' },
  { id: 13, name: 'XP Gain', rate: 0.005, max: 300, effect: '+0.5%' },
  { id: 14, name: 'First Strike', rate: 0, max: 50, effect: 'Always 1st', toggle: true },
  { id: 15, name: 'Poison', rate: 0, max: 50, effect: 'Inflict', toggle: true },
  { id: 16, name: 'Unyielding', rate: 0, max: 50, effect: 'Revive', toggle: true },
  { id: 17, name: 'One Strike', rate: 0, max: 50, effect: '+15% crit', toggle: true },
  { id: 18, name: 'Double Strike', rate: 0, max: 50, effect: '20% ×2', toggle: true },
  { id: 19, name: 'Three Paths', rate: 0, max: 50, effect: '50% ×3', toggle: true },
  { id: 20, name: 'Four Leaves', rate: 0, max: 50, effect: '20% drops', toggle: true },
  { id: 21, name: 'Five Lights', rate: 0, max: 50, effect: '20% XP', toggle: true },
  { id: 22, name: 'Sixth Sense', rate: 0, max: 50, effect: '+20% eva', toggle: true },
  { id: 23, name: 'Seven Bless', rate: 0, max: 50, effect: '×2 proc', toggle: true },
  { id: 24, name: 'Treasure Hunter', rate: 0, max: 50, effect: 'Easier to find treasure chests', toggle: true },
  { id: 25, name: 'Water Source Detection', rate: 0, max: 50, effect: 'Easier to find springs', toggle: true }
];

// Current build state
let currentBuild = {
  weapon: { id: 104, upgrade: 0, corrosion: 0, analysis: 1, rarity: 'red', enchants: [0, 0, 0] },
  armor: { id: 213, upgrade: 0, corrosion: 0, analysis: 1, rarity: 'red', enchants: [0, 0, 0] },
  ring: { id: 314, corrosion: 0, analysis: 1, rarity: 'red', enchants: [0, 0, 0] },
  proofs: { bookmark: 0, combatChip: 0, thousandHand: 0, adamHeart: 0, panoptesEye: 0, killingStone: 0, magatama: 0 },
  boostPoints: Array(25).fill(0),
  apples: 20
};

let savedBuilds = [];
let currentBuildSlot = -1;

// ============ INITIALIZATION ============

async function initBuildMakerPage() {
  const data = await loadGameData();
  
  loadSavedBuilds();
  
  setupAutocomplete(data);
  setupEnchantSelects();
  setupRarityButtons();
  setupProofsSection();
  renderBoostTable();
  renderSavedBuilds();
  
  // Event listeners
  document.querySelectorAll('input[type="number"]').forEach(el => {
    el.addEventListener('change', () => calculateStats(data));
  });
  
  document.getElementById('save-build-btn')?.addEventListener('click', saveBuild);
  document.getElementById('clear-boosts-btn')?.addEventListener('click', clearBoosts);
  document.getElementById('import-btn')?.addEventListener('click', () => document.getElementById('import-file').click());
  document.getElementById('import-file')?.addEventListener('change', handleImport);
  
  // Defaults
  selectItem('weapon', 101, data);
  selectItem('armor', 201, data);
  selectItem('ring', 301, data);
  
  calculateStats(data);
}

// ============ AUTOCOMPLETE ============

function setupAutocomplete(data) {
  ['weapon', 'armor', 'ring'].forEach(slot => {
    const itemTypes = { weapon: 1, armor: 2, ring: 3 };
    const searchInput = document.getElementById(`${slot}-search`);
    const autocompleteList = document.getElementById(`${slot}-autocomplete`);
    if (!searchInput) return;
    
    const items = data.equips.filter(e => e.itemType === itemTypes[slot]).sort((a, b) => a.id - b.id);
    let selectedIndex = -1;
    
    searchInput.addEventListener('focus', () => showAutocomplete(autocompleteList, items, searchInput.value, slot));
    searchInput.addEventListener('input', () => {
      selectedIndex = -1;
      showAutocomplete(autocompleteList, items, searchInput.value, slot);
    });
    searchInput.addEventListener('keydown', (e) => {
      const visibleItems = autocompleteList.querySelectorAll('.autocomplete-item');
      if (e.key === 'ArrowDown') { e.preventDefault(); selectedIndex = Math.min(selectedIndex + 1, visibleItems.length - 1); updateSelection(visibleItems, selectedIndex); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); selectedIndex = Math.max(selectedIndex - 1, 0); updateSelection(visibleItems, selectedIndex); }
      else if (e.key === 'Enter' && selectedIndex >= 0) { e.preventDefault(); selectItem(slot, parseInt(visibleItems[selectedIndex].dataset.id), WikiData); autocompleteList.classList.remove('active'); }
      else if (e.key === 'Escape') { autocompleteList.classList.remove('active'); }
    });
    searchInput.addEventListener('blur', () => setTimeout(() => autocompleteList.classList.remove('active'), 200));
  });
}

function showAutocomplete(listEl, items, query, slot) {
  const q = query.toLowerCase();
  const filtered = items.filter(item => getName(item).toLowerCase().includes(q) || item.id.toString().includes(q)).slice(0, 12);
  listEl.innerHTML = filtered.length === 0 
    ? '<div class="autocomplete-item">No results</div>'
    : filtered.map(item => `<div class="autocomplete-item" data-id="${item.id}" onclick="selectItem('${slot}', ${item.id}, WikiData)"><img src="assets/icons/${item.icon || 'none'}.png"><span>${getName(item)}</span><span class="item-id">#${item.id}</span></div>`).join('');
  listEl.classList.add('active');
}

function updateSelection(items, index) {
  items.forEach((item, i) => item.classList.toggle('selected', i === index));
  if (items[index]) items[index].scrollIntoView({ block: 'nearest' });
}

function selectItem(slot, itemId, data) {
  const item = data.equips.find(e => e.id === itemId);
  if (!item) return;
  
  currentBuild[slot].id = itemId;
  document.getElementById(`${slot}-search`).value = getName(item);
  document.getElementById(`${slot}-icon`).src = `assets/icons/${item.icon || 'none'}.png`;
  document.getElementById(`${slot}-name`).textContent = getName(item);
  document.getElementById(`${slot}-type`).textContent = item.attackKind || item.equipKind || '-';
  document.getElementById(`${slot}-autocomplete`)?.classList.remove('active');
  
  calculateStats(data);
}

// ============ ENCHANTS ============

function setupEnchantSelects() {
  const catOptions = ENCHANT_CATS.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
  
  ['weapon', 'armor', 'ring'].forEach(slot => {
    for (let i = 1; i <= 3; i++) {
      const catSelect = document.getElementById(`${slot}-enc-${i}`);
      const lvInput = document.getElementById(`${slot}-enc-${i}-lv`);
      if (catSelect) {
        catSelect.innerHTML = catOptions;
        catSelect.addEventListener('change', () => {
          updateEnchantFromUI(slot, i - 1);
          calculateStats(WikiData);
        });
      }
      if (lvInput) {
        lvInput.addEventListener('change', () => {
          updateEnchantFromUI(slot, i - 1);
          calculateStats(WikiData);
        });
      }
    }
  });
}

function updateEnchantFromUI(slot, index) {
  const catSelect = document.getElementById(`${slot}-enc-${index + 1}`);
  const lvInput = document.getElementById(`${slot}-enc-${index + 1}-lv`);
  const cat = parseInt(catSelect?.value) || 0;
  const lv = parseInt(lvInput?.value) || 1;
  currentBuild[slot].enchants[index] = cat === 0 ? 0 : cat * 10000 + lv;
}

function getEnchantValue(enchantId) {
  if (!enchantId) return { stat: null, value: 0 };
  const cat = Math.floor(enchantId / 10000);
  const lv = enchantId % 10000;
  const catInfo = ENCHANT_CATS.find(c => c.id === cat);
  if (!catInfo || !catInfo.stat) return { stat: null, value: 0 };
  
  const stat = catInfo.stat;
  const valueTable = ENCHANT_VALUES[stat];
  
  // Use known values or interpolate
  if (valueTable && valueTable[lv]) {
    return { stat, value: valueTable[lv] };
  }
  
  // Approximation for lower levels
  if (stat === 'luk') return { stat, value: Math.min(lv, 8) };
  if (stat === 'spd') return { stat, value: Math.floor(lv * 100) };
  if (stat === 'strLv' || stat === 'vitLv') return { stat, value: Math.max(1, Math.floor(lv / 100)) };
  if (stat === 'hpLv') return { stat, value: Math.floor(lv * 25) };
  
  // For hp, str, vit - quadratic growth
  return { stat, value: Math.floor(lv * lv * 2.5) };
}

// ============ RARITY ============

function setupRarityButtons() {
  document.querySelectorAll('.rarity-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const slot = btn.dataset.slot;
      document.querySelectorAll(`.rarity-btn[data-slot="${slot}"]`).forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentBuild[slot].rarity = btn.dataset.rarity;
      calculateStats(WikiData);
    });
  });
}

// ============ PROOFS ============

function setupProofsSection() {
  const container = document.getElementById('proofs-container');
  if (!container) return;
  
  container.innerHTML = PROOFS.map(p => `
    <div class="proof-item">
      <label>${p.name}</label>
      <input type="number" id="proof-${p.id}" value="0" min="0" max="${p.max}">
      <span class="proof-effect">${p.effect}</span>
    </div>
  `).join('');
  
  container.querySelectorAll('input').forEach(input => {
    input.addEventListener('change', (e) => {
      const proofId = e.target.id.replace('proof-', '');
      currentBuild.proofs[proofId] = parseInt(e.target.value) || 0;
      updateLimits();
      calculateStats(WikiData);
    });
  });
}

function updateLimits() {
  const proofs = currentBuild.proofs;
  const maxAnalysis = 15 + 10 + proofs.panoptesEye; // base + magnifying glass + proofs
  const maxCorrosion = 5000 + proofs.killingStone * 500;
  const maxEnchant = 100 + proofs.thousandHand;
  
  document.querySelectorAll('[id$="-analysis"]').forEach(el => { if (el.max) el.max = maxAnalysis; });
  document.querySelectorAll('[id$="-corrosion"]').forEach(el => { if (el.max) el.max = maxCorrosion; });
  document.querySelectorAll('[id$="-lv"]').forEach(el => { if (el.id.includes('enc')) el.max = maxEnchant; });
}

// ============ BOOSTS ============

function renderBoostTable() {
  const container = document.getElementById('boost-table');
  if (!container) return;
  
  const adamBonus = (currentBuild.proofs?.adamHeart || 0) * 20;
  
  container.innerHTML = BOOST_TYPES.map((boost, idx) => {
    const max = boost.toggle ? boost.max : boost.max + adamBonus;
    return `<tr>
      <td>${boost.name}</td>
      <td style="font-size:0.65rem;color:var(--text-secondary)">${boost.effect}</td>
      <td>${boost.toggle 
        ? `<input type="checkbox" class="boost-toggle" data-idx="${idx}" ${currentBuild.boostPoints[idx] >= 50 ? 'checked' : ''}>`
        : `<input type="number" class="boost-input" data-idx="${idx}" value="${currentBuild.boostPoints[idx]}" min="0" max="${max}">`
      }</td>
      <td class="boost-total" id="boost-total-${idx}">-</td>
    </tr>`;
  }).join('');
  
  container.querySelectorAll('.boost-input').forEach(input => {
    input.addEventListener('change', (e) => {
      const idx = parseInt(e.target.dataset.idx);
      currentBuild.boostPoints[idx] = Math.min(parseInt(e.target.value) || 0, parseInt(e.target.max));
      e.target.value = currentBuild.boostPoints[idx];
      calculateStats(WikiData);
    });
  });
  
  container.querySelectorAll('.boost-toggle').forEach(toggle => {
    toggle.addEventListener('change', (e) => {
      currentBuild.boostPoints[parseInt(e.target.dataset.idx)] = e.target.checked ? 50 : 0;
      calculateStats(WikiData);
    });
  });
}

function clearBoosts() {
  currentBuild.boostPoints = Array(25).fill(0);
  renderBoostTable();
  calculateStats(WikiData);
}

// ============ STAT CALCULATIONS ============

function calculateStats(data) {
  const weapon = data.equips.find(e => e.id === currentBuild.weapon.id) || {};
  const armor = data.equips.find(e => e.id === currentBuild.armor.id) || {};
  const ring = data.equips.find(e => e.id === currentBuild.ring.id) || {};
  
  // Read UI values
  const wUpgrade = parseInt(document.getElementById('weapon-upgrade')?.value) || 0;
  const wCorrosion = parseInt(document.getElementById('weapon-corrosion')?.value) || 0;
  const wAnalysis = parseInt(document.getElementById('weapon-analysis')?.value) || 1;
  
  const aUpgrade = parseInt(document.getElementById('armor-upgrade')?.value) || 0;
  const aCorrosion = parseInt(document.getElementById('armor-corrosion')?.value) || 0;
  const aAnalysis = parseInt(document.getElementById('armor-analysis')?.value) || 1;
  
  const rCorrosion = parseInt(document.getElementById('ring-corrosion')?.value) || 0;
  const rAnalysis = parseInt(document.getElementById('ring-analysis')?.value) || 1;
  
  // Update build
  currentBuild.weapon = { ...currentBuild.weapon, upgrade: wUpgrade, corrosion: wCorrosion, analysis: wAnalysis };
  currentBuild.armor = { ...currentBuild.armor, upgrade: aUpgrade, corrosion: aCorrosion, analysis: aAnalysis };
  currentBuild.ring = { ...currentBuild.ring, corrosion: rCorrosion, analysis: rAnalysis };
  
  // Upgrade limits
  const wMaxUpgrade = (UPGRADE_LIMITS[wAnalysis] || 10);
  const aMaxUpgrade = (UPGRADE_LIMITS[aAnalysis] || 10);
  document.getElementById('weapon-max-upgrade').textContent = formatNumber(wMaxUpgrade);
  document.getElementById('armor-max-upgrade').textContent = formatNumber(aMaxUpgrade);
  
  // === WEAPON ATK CALCULATION ===
  // From screenshot: ATK = (param + upgrade×upgradeBoost + corrosion×10×corrosionBoost) × powerBoost
  const wPowerBoost = (wAnalysis >= 6 && wCorrosion >= 50) ? 1.3 : 1;
  const wUpgradeBoost = ((wAnalysis >= 8 && wCorrosion >= 150) ? 2 : 1) * ((wAnalysis >= 12 && wCorrosion >= 350) ? 2 : 1);
  const wCorrosionBoost = ((wAnalysis >= 10 && wCorrosion >= 250) ? 2 : 1) * ((wAnalysis >= 15 && wCorrosion >= 500) ? 2 : 1);
  
  const effectiveWUpgrade = Math.min(wUpgrade, wMaxUpgrade);
  const weaponATK = Math.floor(((weapon.param || 30) + effectiveWUpgrade * wUpgradeBoost + wCorrosion * 10 * wCorrosionBoost) * wPowerBoost);
  
  // === ARMOR DEF CALCULATION ===
  const aPowerBoost = (aAnalysis >= 9 && aCorrosion >= 200) ? 1.3 : 1;
  const aUpgradeBoost = ((aAnalysis >= 8 && aCorrosion >= 150) ? 2 : 1) * ((aAnalysis >= 12 && aCorrosion >= 350) ? 2 : 1);
  const aCorrosionBoost = ((aAnalysis >= 10 && aCorrosion >= 250) ? 2 : 1) * ((aAnalysis >= 15 && aCorrosion >= 500) ? 2 : 1);
  
  const effectiveAUpgrade = Math.min(aUpgrade, aMaxUpgrade);
  const armorDEF = Math.floor(((armor.param || 80) + effectiveAUpgrade * aUpgradeBoost + aCorrosion * 10 * aCorrosionBoost) * aPowerBoost);
  
  // === ENCHANT STATS ===
  const enchantStats = { hp: 0, str: 0, vit: 0, spd: 0, luk: 0, hpLv: 0, strLv: 0, vitLv: 0 };
  [...currentBuild.weapon.enchants, ...currentBuild.armor.enchants, ...currentBuild.ring.enchants].forEach(enchId => {
    const enc = getEnchantValue(enchId);
    if (enc.stat && enchantStats.hasOwnProperty(enc.stat)) {
      enchantStats[enc.stat] += enc.value;
    }
  });
  
  // === STAT BOOSTS ===
  const bp = currentBuild.boostPoints;
  const proofs = currentBuild.proofs;
  
  // Start with base 1.0
  let hpBoost = 1 + bp[0] * 0.005;
  let strBoost = 1 + bp[1] * 0.005;
  let vitBoost = 1 + bp[2] * 0.005;
  let spdBoost = 1 + bp[3] * 0.005;
  let lukBoost = 1 + bp[4] * 0.005;
  
  // Ring analysis boosts (at high analysis levels with sufficient corrosion)
  if (rAnalysis >= 25 && rCorrosion >= 50) {
    strBoost += RING_ANALYSIS_BOOSTS.strBoost;
    hpBoost += RING_ANALYSIS_BOOSTS.allStatsBoost;
    strBoost += RING_ANALYSIS_BOOSTS.allStatsBoost;
    vitBoost += RING_ANALYSIS_BOOSTS.allStatsBoost;
    spdBoost += RING_ANALYSIS_BOOSTS.allStatsBoost;
    lukBoost += RING_ANALYSIS_BOOSTS.allStatsBoost;
    hpBoost += RING_ANALYSIS_BOOSTS.hpBoost;
    vitBoost += RING_ANALYSIS_BOOSTS.vitBoost;
  }
  
  // Rarity boosts per item
  [currentBuild.weapon, currentBuild.armor, currentBuild.ring].forEach(item => {
    const rarity = RARITY_BOOSTS[item.rarity] || RARITY_BOOSTS.red;
    if (rarity.str) strBoost += rarity.str;
    if (rarity.all) {
      hpBoost += rarity.all;
      strBoost += rarity.all;
      vitBoost += rarity.all;
      spdBoost += rarity.all;
    }
  });
  
  // Set bonus
  const weaponSet = weapon.set ? translate(weapon.set) : '';
  const hasSet = weaponSet && (weaponSet === getName(armor) || weaponSet === getName(ring));
  if (hasSet) {
    strBoost += 1.0; // Set bonus gives ×2.0 STR
  }
  
  // Ring mastery (if attack type matches)
  const attackKind = weapon.attackKind;
  if (rAnalysis >= 25 && rCorrosion >= 50) {
    strBoost += RING_ANALYSIS_BOOSTS.masteryBoost;
  }
  
  // Attack type damage boost from BP
  let atkTypeBoost = 1;
  if (attackKind === 'Slashing') atkTypeBoost += bp[8] * 0.005;
  else if (attackKind === 'Bludgeoning') atkTypeBoost += bp[9] * 0.005;
  else if (attackKind === 'Piercing') atkTypeBoost += bp[10] * 0.005;
  else if (attackKind === 'Projectile') atkTypeBoost += bp[11] * 0.005;
  
  // === BASE STATS ===
  const baseHP = 30 + (weapon.hp || 0) + (armor.hp || 0) + (ring.hp || 0) + enchantStats.hp + (proofs.bookmark * 1000);
  const baseSTR = 10 + (weapon.atk || 0) + (armor.atk || 0) + (ring.atk || 0) + enchantStats.str;
  const baseVIT = 10 + (weapon.def || 0) + (armor.def || 0) + (ring.def || 0) + enchantStats.vit;
  const baseSPD = 1 + enchantStats.spd;
  const baseLUK = 1 + (currentBuild.apples || 20) + enchantStats.luk;
  
  // Per-level gains
  const lvUpHP = 10 + (weapon.lvHp || 0) + (armor.lvHp || 0) + (ring.lvHp || 0) + enchantStats.hpLv;
  const lvUpSTR = 1 + (weapon.lvAtk || 0) + (armor.lvAtk || 0) + (ring.lvAtk || 0) + enchantStats.strLv;
  const lvUpVIT = 1 + (weapon.lvDef || 0) + (armor.lvDef || 0) + (ring.lvDef || 0) + enchantStats.vitLv;
  
  // === FINAL STATS ===
  const finalHP = Math.floor(baseHP * hpBoost);
  const finalSTR = Math.floor(baseSTR * strBoost);
  const finalVIT = Math.floor(baseVIT * vitBoost);
  const finalSPD = Math.floor(baseSPD * spdBoost);
  const finalLUK = Math.floor(baseLUK * lukBoost);
  
  const totalATK = Math.floor((finalSTR + weaponATK) * atkTypeBoost);
  const totalDEF = finalVIT + armorDEF;
  
  // Power rating (simplified)
  const powerRating = totalATK + totalDEF + finalHP + finalSPD * 100;
  
  // === UPDATE DISPLAY ===
  document.getElementById('result-hp').textContent = formatNumber(finalHP);
  document.getElementById('result-str').textContent = formatNumber(finalSTR);
  document.getElementById('result-vit').textContent = formatNumber(finalVIT);
  document.getElementById('result-spd').textContent = formatNumber(finalSPD);
  document.getElementById('result-luk').textContent = formatNumber(finalLUK);
  
  document.getElementById('result-hp-lv').textContent = `+${lvUpHP}`;
  document.getElementById('result-str-lv').textContent = `+${lvUpSTR}`;
  document.getElementById('result-vit-lv').textContent = `+${lvUpVIT}`;
  
  document.getElementById('result-weapon-atk').textContent = formatNumber(weaponATK);
  document.getElementById('result-shield-def').textContent = formatNumber(armorDEF);
  document.getElementById('result-attack').textContent = formatNumber(totalATK);
  document.getElementById('result-defense').textContent = formatNumber(totalDEF);
  document.getElementById('result-attack-kind').textContent = attackKind || '-';
  document.getElementById('result-set').textContent = hasSet ? `Yes (${weaponSet})` : 'No';
  document.getElementById('result-power').textContent = formatNumber(powerRating);
  
  // Boost summary
  document.getElementById('boost-hp').textContent = `×${hpBoost.toFixed(1)}`;
  document.getElementById('boost-str').textContent = `×${strBoost.toFixed(1)}`;
  document.getElementById('boost-vit').textContent = `×${vitBoost.toFixed(1)}`;
  document.getElementById('boost-spd').textContent = `×${spdBoost.toFixed(1)}`;
  document.getElementById('boost-luk').textContent = `×${lukBoost.toFixed(1)}`;
  document.getElementById('boost-slash').textContent = `×${atkTypeBoost.toFixed(1)}`;
  
  // Boost totals
  BOOST_TYPES.forEach((boost, idx) => {
    const el = document.getElementById(`boost-total-${idx}`);
    if (el) el.textContent = boost.toggle ? (bp[idx] >= 50 ? '✓' : '-') : `+${(bp[idx] * boost.rate * 100).toFixed(1)}%`;
  });
  
  // BP display
  const usedBP = bp.reduce((a, b) => a + b, 0);
  const availableBP = getAvailableBP();
  document.getElementById('available-bp').textContent = availableBP;
  document.getElementById('used-bp').textContent = usedBP;
  const remainingEl = document.getElementById('remaining-bp');
  remainingEl.textContent = availableBP - usedBP;
  remainingEl.classList.toggle('negative', availableBP - usedBP < 0);
}

function getAvailableBP() {
  let totalBp = 0;
  const saved = localStorage.getItem('whipper-item-book');
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
  totalBp += (currentBuild.proofs?.combatChip || 0) * 5;
  return totalBp;
}

// ============ BUILD MANAGEMENT ============

function loadSavedBuilds() {
  try { savedBuilds = JSON.parse(localStorage.getItem('whipper-builds-v4') || '[]'); } catch { savedBuilds = []; }
}

function saveSavedBuilds() {
  localStorage.setItem('whipper-builds-v4', JSON.stringify(savedBuilds));
}

function saveBuild() {
  const name = prompt('Build name:', currentBuildSlot >= 0 ? savedBuilds[currentBuildSlot]?.name : '');
  if (!name) return;
  
  const build = { name, timestamp: Date.now(), ...JSON.parse(JSON.stringify(currentBuild)) };
  
  if (currentBuildSlot >= 0) savedBuilds[currentBuildSlot] = build;
  else { savedBuilds.push(build); currentBuildSlot = savedBuilds.length - 1; }
  
  saveSavedBuilds();
  renderSavedBuilds();
}

function loadBuild(index) {
  const build = savedBuilds[index];
  if (!build) return;
  
  currentBuildSlot = index;
  currentBuild = JSON.parse(JSON.stringify(build));
  while (currentBuild.boostPoints.length < 25) currentBuild.boostPoints.push(0);
  if (!currentBuild.proofs) currentBuild.proofs = { bookmark: 0, combatChip: 0, thousandHand: 0, adamHeart: 0, panoptesEye: 0, killingStone: 0, magatama: 0 };
  
  // Update UI
  selectItem('weapon', build.weapon.id, WikiData);
  selectItem('armor', build.armor.id, WikiData);
  selectItem('ring', build.ring.id, WikiData);
  
  document.getElementById('weapon-upgrade').value = build.weapon.upgrade || 0;
  document.getElementById('weapon-corrosion').value = build.weapon.corrosion || 0;
  document.getElementById('weapon-analysis').value = build.weapon.analysis || 1;
  
  document.getElementById('armor-upgrade').value = build.armor.upgrade || 0;
  document.getElementById('armor-corrosion').value = build.armor.corrosion || 0;
  document.getElementById('armor-analysis').value = build.armor.analysis || 1;
  
  document.getElementById('ring-corrosion').value = build.ring?.corrosion || 0;
  document.getElementById('ring-analysis').value = build.ring?.analysis || 1;
  
  // Rarity
  ['weapon', 'armor', 'ring'].forEach(slot => {
    const rarity = build[slot]?.rarity || 'red';
    document.querySelectorAll(`.rarity-btn[data-slot="${slot}"]`).forEach(btn => btn.classList.toggle('active', btn.dataset.rarity === rarity));
  });
  
  // Enchants
  ['weapon', 'armor', 'ring'].forEach(slot => {
    (build[slot]?.enchants || []).forEach((enchId, i) => {
      const cat = Math.floor(enchId / 10000);
      const lv = enchId % 10000 || 1;
      const catSelect = document.getElementById(`${slot}-enc-${i + 1}`);
      const lvInput = document.getElementById(`${slot}-enc-${i + 1}-lv`);
      if (catSelect) catSelect.value = cat;
      if (lvInput) lvInput.value = lv;
    });
  });
  
  // Proofs
  if (build.proofs) {
    Object.entries(build.proofs).forEach(([id, value]) => {
      const input = document.getElementById(`proof-${id}`);
      if (input) input.value = value;
    });
  }
  
  renderBoostTable();
  renderSavedBuilds();
  calculateStats(WikiData);
}

function deleteBuild(index) {
  if (!confirm('Delete?')) return;
  savedBuilds.splice(index, 1);
  if (currentBuildSlot === index) currentBuildSlot = -1;
  else if (currentBuildSlot > index) currentBuildSlot--;
  saveSavedBuilds();
  renderSavedBuilds();
}

function exportBuild(index) {
  const build = savedBuilds[index];
  if (!build) return;
  const blob = new Blob([JSON.stringify(build, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `whipper-build-${build.name.replace(/[^a-z0-9]/gi, '_')}.json`;
  a.click();
}

function handleImport(e) {
  const file = e.target.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = (event) => {
    try {
      const build = JSON.parse(event.target.result);
      if (!build.weapon || !build.armor) throw new Error('Invalid');
      build.name = build.name || 'Imported';
      build.timestamp = Date.now();
      savedBuilds.push(build);
      saveSavedBuilds();
      renderSavedBuilds();
      loadBuild(savedBuilds.length - 1);
    } catch (err) {
      alert('Import failed: ' + err.message);
    }
  };
  reader.readAsText(file);
  e.target.value = '';
}

function renderSavedBuilds() {
  const container = document.getElementById('saved-builds-list');
  if (!container) return;
  
  if (savedBuilds.length === 0) {
    container.innerHTML = '<p class="text-muted" style="font-size:0.8rem">No saved builds.</p>';
    return;
  }
  
  container.innerHTML = savedBuilds.map((build, idx) => `
    <div class="saved-build${idx === currentBuildSlot ? ' active' : ''}">
      <div class="build-info">
        <strong>${build.name}</strong>
        <small>${new Date(build.timestamp).toLocaleDateString()}</small>
      </div>
      <div class="build-actions">
        <button class="btn btn-sm" onclick="loadBuild(${idx})">Load</button>
        <button class="btn btn-sm" onclick="exportBuild(${idx})">↓</button>
        <button class="btn btn-sm btn-danger" onclick="deleteBuild(${idx})">×</button>
      </div>
    </div>
  `).join('');
}

// Globals
window.selectItem = selectItem;
window.loadBuild = loadBuild;
window.deleteBuild = deleteBuild;
window.exportBuild = exportBuild;

document.addEventListener('DOMContentLoaded', initBuildMakerPage);
