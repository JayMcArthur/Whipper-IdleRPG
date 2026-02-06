/* Whipper Wiki - Build Maker Tool (Reworked) */

// ========== Constants ==========

const BOOST_TYPES = [
  { id: 0, name: 'HP Boost', nameId: 'HPブースト', rate: 0.005, max: 200, effect: '0.5%/BP' },
  { id: 1, name: 'STR Boost', nameId: 'STRブースト', rate: 0.005, max: 200, effect: '0.5%/BP' },
  { id: 2, name: 'VIT Boost', nameId: 'VITブースト', rate: 0.005, max: 200, effect: '0.5%/BP' },
  { id: 3, name: 'SPD Boost', nameId: 'SPDブースト', rate: 0.005, max: 200, effect: '0.5%/BP' },
  { id: 4, name: 'LUK Boost', nameId: 'LUKブースト', rate: 0.005, max: 200, effect: '0.5%/BP' },
  { id: 5, name: 'Drop Rate', rate: 0.0002, max: 200, effect: '0.02%/BP' },
  { id: 6, name: 'Crit Rate', rate: 0.002, max: 200, effect: '0.2%/BP' },
  { id: 7, name: 'Crit Damage', rate: 0.005, max: 200, effect: '0.5%/BP' },
  { id: 8, name: 'Slashing Dmg', rate: 0.005, max: 200, effect: '0.5%/BP' },
  { id: 9, name: 'Bludgeon Dmg', rate: 0.005, max: 200, effect: '0.5%/BP' },
  { id: 10, name: 'Piercing Dmg', rate: 0.005, max: 200, effect: '0.5%/BP' },
  { id: 11, name: 'Projectile Dmg', rate: 0.005, max: 200, effect: '0.5%/BP' },
  { id: 12, name: 'Poison Dmg', rate: 0.0001, max: 200, effect: '0.01%/BP' },
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

// Correct enchantment name mapping (nameId from customs.json -> English display)
const ENCHANT_MAP = {
  '耐久': 'Endurance (HP)',
  '腕力': 'Strength (STR)',
  '頑丈': 'Sturdy (VIT)',
  '機敏': 'Agility (SPD)',
  '幸運': 'Lucky (LUK)',
  '体力の鍛錬': 'HP Training',
  '力の鍛錬': 'STR Training',
  '守りの鍛錬': 'DEF Training',
  '先制': 'First Strike',
  '一撃': 'One Strike',
  '二撃': 'Double Strike',
  '三途': 'Three Paths',
  '四葉': 'Four Leaves',
  '五光': 'Five Lights',
  '六感': 'Sixth Sense',
  '七福': 'Seven Blessings',
  '不屈': 'Unyielding',
  '毒': 'Poison',
  '猛毒': 'Deadly Poison',
  '孤高': 'Solitude',
  '斬撃の極意': 'Slashing Mastery',
  '打撃の極意': 'Bludgeon Mastery',
  '刺突の極意': 'Piercing Mastery',
  '投射の極意': 'Projectile Mastery',
  '強化上限アップ': 'Upgrade Limit Up',
  '水源探知': 'Water Detection',
  '宝物狩り': 'Treasure Hunter'
};

// These are Analysis Book boosts, NOT equipment enchants - exclude from enchant selects
const BOOST_ENCHANT_NAMES = [
  'HPブースト', 'STRブースト', 'VITブースト', 'SPDブースト', 'LUKブースト',
  'セットブースト', '侵蝕度ブースト', '守備力ブースト', '攻撃力ブースト',
  '強化ブースト', '全能力値ブースト', '能力Lvブースト'
];

// Analysis upgrade limit boosts per level
const UPGRADE_BOOSTS = { 5: 100, 7: 300, 9: 600, 11: 1200, 13: 2500, 15: 5000, 17: 8000, 19: 12000, 20: 19000 };

let currentBuild = {
  weapon: { id: null, upgrade: 0, corrosion: 0, analysis: 1, enchants: [0, 0, 0] },
  armor: { id: null, upgrade: 0, corrosion: 0, analysis: 1, enchants: [0, 0, 0] },
  ring: { id: null, upgrade: 0, corrosion: 0, analysis: 1, enchants: [0, 0, 0] },
  boostPoints: Array(24).fill(0)
};

let savedBuilds = [];
let currentLoadedSlot = -1; // Track which slot a loaded build came from
let enchantGroups = {};

// ========== Autocomplete ==========

function setupAutocomplete(inputId, listId, selectedId, items, onSelect) {
  const input = document.getElementById(inputId);
  const list = document.getElementById(listId);
  const selectedEl = document.getElementById(selectedId);
  if (!input || !list) return;

  let highlighted = -1;
  let filtered = [];

  function showList() {
    const term = input.value.toLowerCase().trim();
    filtered = term ? items.filter(i => {
      const name = getName(i).toLowerCase();
      const id = i.id.toString();
      return name.includes(term) || id.includes(term);
    }).slice(0, 20) : items.slice(0, 20);

    if (filtered.length === 0) { list.classList.remove('open'); return; }

    list.innerHTML = filtered.map((item, idx) =>
      `<div class="auto-option" data-idx="${idx}">
        <img src="assets/icons/${item.icon}.png" alt="">
        <span>${item.id} - ${getName(item)}</span>
      </div>`
    ).join('');
    list.classList.add('open');
    highlighted = -1;

    list.querySelectorAll('.auto-option').forEach(opt => {
      opt.addEventListener('mousedown', (e) => {
        e.preventDefault();
        selectItem(parseInt(opt.dataset.idx));
      });
    });
  }

  function selectItem(idx) {
    const item = filtered[idx];
    if (!item) return;
    input.value = '';
    list.classList.remove('open');
    selectedEl.innerHTML = `<img src="assets/icons/${item.icon}.png" alt=""> ${getName(item)} (ID: ${item.id})`;
    input.dataset.selectedId = item.id;
    onSelect(item);
  }

  input.addEventListener('input', showList);
  input.addEventListener('focus', showList);
  input.addEventListener('blur', () => setTimeout(() => list.classList.remove('open'), 150));

  input.addEventListener('keydown', (e) => {
    const opts = list.querySelectorAll('.auto-option');
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      highlighted = Math.min(highlighted + 1, opts.length - 1);
      opts.forEach((o, i) => o.classList.toggle('highlighted', i === highlighted));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      highlighted = Math.max(highlighted - 1, 0);
      opts.forEach((o, i) => o.classList.toggle('highlighted', i === highlighted));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlighted >= 0) selectItem(highlighted);
      else if (filtered.length === 1) selectItem(0);
    }
  });
}

function setEquipDisplay(selectedId, item) {
  const el = document.getElementById(selectedId);
  if (el && item) {
    el.innerHTML = `<img src="assets/icons/${item.icon}.png" alt=""> ${getName(item)} (ID: ${item.id})`;
  }
}

// ========== Enchantments ==========

function buildEnchantGroups(data) {
  enchantGroups = {};
  data.customs.forEach(c => {
    if (BOOST_ENCHANT_NAMES.includes(c.nameId)) return; // Skip analysis boosts
    const displayName = ENCHANT_MAP[c.nameId] || translate(c.nameId) || c.nameId;
    if (!enchantGroups[c.nameId]) enchantGroups[c.nameId] = { display: displayName, items: [] };
    enchantGroups[c.nameId].items.push(c);
  });

  // Sort items by level within each group
  Object.values(enchantGroups).forEach(g => g.items.sort((a, b) => a.dispLv - b.dispLv));
}

function populateEnchantSelects() {
  const sorted = Object.entries(enchantGroups).sort((a, b) => a[1].display.localeCompare(b[1].display));
  const categoryOptions = '<option value="">None</option>' +
    sorted.map(([nameId, g]) => `<option value="${nameId}">${g.display}</option>`).join('');

  for (let i = 1; i <= 9; i++) {
    const catSel = document.getElementById(`enchant-cat-${i}`);
    const lvlSel = document.getElementById(`enchant-lvl-${i}`);
    if (!catSel || !lvlSel) continue;

    catSel.innerHTML = categoryOptions;
    catSel.addEventListener('change', () => {
      const nameId = catSel.value;
      if (nameId && enchantGroups[nameId]) {
        const items = enchantGroups[nameId].items;
        lvlSel.innerHTML = items.map(enc =>
          `<option value="${enc.id}">Lv ${enc.dispLv} (${enc.value})</option>`
        ).join('');
        lvlSel.disabled = false;
      } else {
        lvlSel.innerHTML = '<option value="0">-</option>';
        lvlSel.disabled = true;
      }
      calculateStats();
    });

    lvlSel.addEventListener('change', calculateStats);
  }
}

function getEnchantIds() {
  const ids = [];
  for (let i = 1; i <= 9; i++) {
    const lvlSel = document.getElementById(`enchant-lvl-${i}`);
    ids.push(lvlSel && !lvlSel.disabled ? parseInt(lvlSel.value) || 0 : 0);
  }
  return ids;
}

// ========== Boosts ==========

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

  // Bind events
  container.querySelectorAll('.boost-input').forEach(input => {
    input.addEventListener('change', () => {
      const idx = parseInt(input.dataset.idx);
      currentBuild.boostPoints[idx] = Math.min(parseInt(input.value) || 0, BOOST_TYPES[idx].max);
      input.value = currentBuild.boostPoints[idx];
      updateBpDisplay();
      calculateStats();
    });
  });

  container.querySelectorAll('.boost-toggle').forEach(toggle => {
    toggle.addEventListener('change', () => {
      const idx = parseInt(toggle.dataset.idx);
      currentBuild.boostPoints[idx] = toggle.checked ? 50 : 0;
      updateBpDisplay();
      calculateStats();
    });
  });

  updateBpDisplay();
}

function updateBpDisplay() {
  const used = currentBuild.boostPoints.reduce((a, b) => a + b, 0);
  const available = loadItemBookBP();

  document.getElementById('used-bp').textContent = used;
  document.getElementById('remaining-bp').textContent = available - used;
  document.getElementById('remaining-bp').classList.toggle('text-negative', available - used < 0);

  // Update totals
  BOOST_TYPES.forEach((boost, idx) => {
    const el = document.getElementById(`boost-total-${idx}`);
    if (!el) return;
    if (boost.toggle) {
      el.textContent = currentBuild.boostPoints[idx] >= 50 ? 'Active' : '-';
    } else {
      el.textContent = (currentBuild.boostPoints[idx] * boost.rate * 100).toFixed(1) + '%';
    }
  });
}

function clearBoosts() {
  currentBuild.boostPoints = Array(24).fill(0);
  renderBoostTable();
  calculateStats();
}

function loadItemBookBP() {
  const saved = localStorage.getItem('whipper-item-book');
  let totalBp = 0;
  if (saved) {
    try {
      const ib = JSON.parse(saved);
      ['weapons', 'armor', 'rings'].forEach(cat => {
        Object.values(ib[cat] || {}).forEach(item => {
          totalBp += Math.floor((item.level || 0) / 5);
        });
      });
    } catch (e) {}
  }
  document.getElementById('available-bp').textContent = totalBp;
  return totalBp;
}

// ========== Stat Calculation ==========

function calculateStats() {
  const weaponId = parseInt(document.getElementById('weapon-input').dataset.selectedId) || null;
  const armorId = parseInt(document.getElementById('armor-input').dataset.selectedId) || null;
  const ringId = parseInt(document.getElementById('ring-input').dataset.selectedId) || null;

  const weapon = weaponId ? getEquipById(weaponId) : null;
  const armor = armorId ? getEquipById(armorId) : null;
  const ring = ringId ? getEquipById(ringId) : null;

  const weaponUpgrade = parseInt(document.getElementById('weapon-upgrade').value) || 0;
  const weaponAnalysis = parseInt(document.getElementById('weapon-analysis').value) || 1;
  const weaponCorrosion = parseInt(document.getElementById('weapon-corrosion').value) || 0;
  const armorUpgrade = parseInt(document.getElementById('armor-upgrade').value) || 0;
  const armorAnalysis = parseInt(document.getElementById('armor-analysis').value) || 1;
  const armorCorrosion = parseInt(document.getElementById('armor-corrosion').value) || 0;
  const ringAnalysis = parseInt(document.getElementById('ring-analysis').value) || 1;
  const ringCorrosion = parseInt(document.getElementById('ring-corrosion').value) || 0;

  // Max upgrade from analysis
  let weaponMaxUpgrade = 10;
  let armorMaxUpgrade = 10;
  Object.entries(UPGRADE_BOOSTS).forEach(([lvl, val]) => {
    if (weaponAnalysis >= parseInt(lvl)) weaponMaxUpgrade = val;
    if (armorAnalysis >= parseInt(lvl)) armorMaxUpgrade = val;
  });
  document.getElementById('weapon-max-upgrade').textContent = formatNumber(weaponMaxUpgrade);
  document.getElementById('armor-max-upgrade').textContent = formatNumber(armorMaxUpgrade);

  // Enchantment bonuses
  const enchantIds = getEnchantIds();
  let eb = { hp: 0, str: 0, vit: 0, spd: 0, luk: 0, hpUp: 0, strUp: 0, vitUp: 0 };
  enchantIds.forEach(id => {
    if (!id) return;
    const c = getCustomById(id);
    if (!c) return;
    const n = c.nameId;
    if (n === '耐久') eb.hp += c.value;
    else if (n === '腕力') eb.str += c.value;
    else if (n === '頑丈') eb.vit += c.value;
    else if (n === '機敏') eb.spd += c.value;
    else if (n === '幸運') eb.luk += c.value;
    else if (n === '体力の鍛錬') eb.hpUp += c.value;
    else if (n === '力の鍛錬') eb.strUp += c.value;
    else if (n === '守りの鍛錬') eb.vitUp += c.value;
  });

  // BP boost multipliers
  const bp = currentBuild.boostPoints;
  const boost = {
    hp: 1 + bp[0] * 0.005,
    str: 1 + bp[1] * 0.005,
    vit: 1 + bp[2] * 0.005,
    spd: 1 + bp[3] * 0.005,
    luk: 1 + bp[4] * 0.005
  };

  // Base stats at Lv 1
  const baseHP = 30 + (weapon?.hp || 0) + (armor?.hp || 0) + (ring?.hp || 0) + eb.hp;
  const baseSTR = 10 + (weapon?.atk || 0) + (armor?.atk || 0) + (ring?.atk || 0) + eb.str;
  const baseVIT = 10 + (weapon?.def || 0) + (armor?.def || 0) + (ring?.def || 0) + eb.vit;
  const baseSPD = 1 + eb.spd;
  const baseLUK = 1 + eb.luk;

  // Per-level growth
  const lvHP = 10 + (weapon?.lvHp || 0) + (armor?.lvHp || 0) + (ring?.lvHp || 0) + eb.hpUp;
  const lvSTR = 1 + (weapon?.lvAtk || 0) + (armor?.lvAtk || 0) + (ring?.lvAtk || 0) + eb.strUp;
  const lvVIT = 1 + (weapon?.lvDef || 0) + (armor?.lvDef || 0) + (ring?.lvDef || 0) + eb.vitUp;

  // Final at Lv 1 with boost multipliers
  const finalHP = Math.floor(baseHP * boost.hp);
  const finalSTR = Math.floor(baseSTR * boost.str);
  const finalVIT = Math.floor(baseVIT * boost.vit);
  const finalSPD = Math.floor(baseSPD * boost.spd);
  const finalLUK = Math.floor(baseLUK * boost.luk);

  // Weapon power
  let upgradeBoost = 1, corrosionBoost = 1, weaponBoost = 1;
  if (weaponAnalysis >= 6 && weaponCorrosion >= 50) weaponBoost *= 1.3;
  if (weaponAnalysis >= 8 && weaponCorrosion >= 150) upgradeBoost *= 2;
  if (weaponAnalysis >= 10 && weaponCorrosion >= 250) corrosionBoost *= 2;
  if (weaponAnalysis >= 12 && weaponCorrosion >= 350) upgradeBoost *= 2;
  if (weaponAnalysis >= 15 && weaponCorrosion >= 500) corrosionBoost *= 2;

  const effWUpgrade = Math.min(weaponUpgrade, weaponMaxUpgrade);
  const weaponPower = weapon ? ((effWUpgrade * upgradeBoost) + (weaponCorrosion * 10 * corrosionBoost) + weapon.param) * weaponBoost : 0;

  // Weapon damage type boost
  let weaponDmgBoost = 1;
  const atkKind = weapon?.attackKind || '';
  if (atkKind === 'Slashing') weaponDmgBoost += bp[8] * 0.005;
  else if (atkKind === 'Bludgeoning') weaponDmgBoost += bp[9] * 0.005;
  else if (atkKind === 'Piercing') weaponDmgBoost += bp[10] * 0.005;
  else if (atkKind === 'Projectile') weaponDmgBoost += bp[11] * 0.005;

  const attack = Math.floor((finalSTR + weaponPower) * weaponDmgBoost);

  // Armor power
  let armorUpBoost = 1, armorCorBoost = 1, armorBoostMult = 1;
  if (armorAnalysis >= 8 && armorCorrosion >= 150) armorUpBoost *= 2;
  if (armorAnalysis >= 9 && armorCorrosion >= 200) armorBoostMult *= 1.3;
  if (armorAnalysis >= 10 && armorCorrosion >= 250) armorCorBoost *= 2;
  if (armorAnalysis >= 12 && armorCorrosion >= 350) armorUpBoost *= 2;
  if (armorAnalysis >= 15 && armorCorrosion >= 500) armorCorBoost *= 2;

  const effAUpgrade = Math.min(armorUpgrade, armorMaxUpgrade);
  const armorPower = armor ? ((effAUpgrade * armorUpBoost) + (armorCorrosion * 10 * armorCorBoost) + armor.param) * armorBoostMult : 0;
  const defense = Math.floor(finalVIT + armorPower);

  // Set bonus
  const hasSet = weapon?.set && (translate(weapon.set) === getName(armor) || translate(weapon.set) === getName(ring));

  // Ring ability
  const ringAbility = ring?.ability ? (getSummary(ring) || getEfficacy(ring) || `Ability ${ring.ability}`) : '-';

  // Display
  document.getElementById('r-hp').textContent = formatNumber(finalHP);
  document.getElementById('r-str').textContent = formatNumber(finalSTR);
  document.getElementById('r-vit').textContent = formatNumber(finalVIT);
  document.getElementById('r-spd').textContent = formatNumber(finalSPD);
  document.getElementById('r-luk').textContent = formatNumber(finalLUK);
  document.getElementById('r-hplv').textContent = '+' + formatNumber(lvHP);
  document.getElementById('r-strlv').textContent = '+' + formatNumber(lvSTR);
  document.getElementById('r-vitlv').textContent = '+' + formatNumber(lvVIT);
  document.getElementById('r-attack').textContent = formatNumber(attack);
  document.getElementById('r-defense').textContent = formatNumber(defense);
  document.getElementById('r-wpow').textContent = formatNumber(Math.floor(weaponPower));
  document.getElementById('r-apow').textContent = formatNumber(Math.floor(armorPower));
  document.getElementById('r-atkind').textContent = atkKind || '-';
  document.getElementById('r-set').textContent = hasSet ? `Yes (${translate(weapon.set)})` : 'No';
  document.getElementById('r-ringability').textContent = ringAbility;

  // Store current build
  currentBuild.weapon = { id: weaponId, upgrade: weaponUpgrade, corrosion: weaponCorrosion, analysis: weaponAnalysis, enchants: enchantIds.slice(0, 3) };
  currentBuild.armor = { id: armorId, upgrade: armorUpgrade, corrosion: armorCorrosion, analysis: armorAnalysis, enchants: enchantIds.slice(3, 6) };
  currentBuild.ring = { id: ringId, upgrade: 0, corrosion: ringCorrosion, analysis: ringAnalysis, enchants: enchantIds.slice(6, 9) };
}

// ========== Save / Load / Export / Import ==========

function loadSavedBuilds() {
  const saved = localStorage.getItem('whipper-builds');
  if (saved) { try { savedBuilds = JSON.parse(saved); } catch (e) {} }
}

function saveSavedBuilds() {
  localStorage.setItem('whipper-builds', JSON.stringify(savedBuilds));
}

function saveBuild() {
  calculateStats(); // Ensure current build is up to date

  let name, slot;
  if (currentLoadedSlot >= 0) {
    // Overwrite existing slot
    name = savedBuilds[currentLoadedSlot]?.name || 'Build';
    name = prompt('Save build name:', name);
    if (!name) return;
    slot = currentLoadedSlot;
    savedBuilds[slot] = { name, timestamp: Date.now(), ...JSON.parse(JSON.stringify(currentBuild)) };
  } else {
    name = prompt('Enter a name for this build:');
    if (!name) return;
    savedBuilds.push({ name, timestamp: Date.now(), ...JSON.parse(JSON.stringify(currentBuild)) });
    currentLoadedSlot = savedBuilds.length - 1;
  }

  saveSavedBuilds();
  renderSavedBuilds();
}

function loadBuild(index) {
  const build = savedBuilds[index];
  if (!build) return;

  currentLoadedSlot = index;
  currentBuild = JSON.parse(JSON.stringify(build));

  // Set equipment
  if (build.weapon?.id) {
    const w = getEquipById(build.weapon.id);
    if (w) {
      document.getElementById('weapon-input').dataset.selectedId = w.id;
      setEquipDisplay('weapon-selected', w);
    }
  }
  if (build.armor?.id) {
    const a = getEquipById(build.armor.id);
    if (a) {
      document.getElementById('armor-input').dataset.selectedId = a.id;
      setEquipDisplay('armor-selected', a);
    }
  }
  if (build.ring?.id) {
    const r = getEquipById(build.ring.id);
    if (r) {
      document.getElementById('ring-input').dataset.selectedId = r.id;
      setEquipDisplay('ring-selected', r);
    }
  }

  // Set fields
  document.getElementById('weapon-upgrade').value = build.weapon?.upgrade || 0;
  document.getElementById('weapon-analysis').value = build.weapon?.analysis || 1;
  document.getElementById('weapon-corrosion').value = build.weapon?.corrosion || 0;
  document.getElementById('armor-upgrade').value = build.armor?.upgrade || 0;
  document.getElementById('armor-analysis').value = build.armor?.analysis || 1;
  document.getElementById('armor-corrosion').value = build.armor?.corrosion || 0;
  document.getElementById('ring-analysis').value = build.ring?.analysis || 1;
  document.getElementById('ring-corrosion').value = build.ring?.corrosion || 0;

  // Set enchants
  const allEnchants = [...(build.weapon?.enchants || [0,0,0]), ...(build.armor?.enchants || [0,0,0]), ...(build.ring?.enchants || [0,0,0])];
  allEnchants.forEach((encId, i) => {
    const catSel = document.getElementById(`enchant-cat-${i + 1}`);
    const lvlSel = document.getElementById(`enchant-lvl-${i + 1}`);
    if (!catSel || !lvlSel || !encId) return;

    const custom = getCustomById(encId);
    if (!custom) return;

    catSel.value = custom.nameId;
    catSel.dispatchEvent(new Event('change')); // Populate level select
    lvlSel.value = encId;
  });

  renderBoostTable();
  calculateStats();
}

function deleteBuild(index) {
  if (!confirm('Delete this build?')) return;
  savedBuilds.splice(index, 1);
  if (currentLoadedSlot === index) currentLoadedSlot = -1;
  else if (currentLoadedSlot > index) currentLoadedSlot--;
  saveSavedBuilds();
  renderSavedBuilds();
}

function exportBuild(index) {
  const build = savedBuilds[index];
  if (!build) return;
  const dataStr = JSON.stringify(build, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `whipper-build-${build.name.replace(/\s+/g, '_')}.json`; a.click();
  URL.revokeObjectURL(url);
}

function importBuild(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (event) => {
    try {
      const build = JSON.parse(event.target.result);
      if (!build.name) build.name = 'Imported Build';
      build.timestamp = Date.now();
      savedBuilds.push(build);
      saveSavedBuilds();
      renderSavedBuilds();
      loadBuild(savedBuilds.length - 1);
    } catch (err) { alert('Failed to import build: Invalid file'); }
  };
  reader.readAsText(file);
  e.target.value = ''; // Reset so same file can be imported again
}

function renderSavedBuilds() {
  const container = document.getElementById('saved-builds-list');
  if (!container) return;

  if (savedBuilds.length === 0) {
    container.innerHTML = '<p class="text-muted">No saved builds yet.</p>';
    return;
  }

  container.innerHTML = savedBuilds.map((build, idx) => `
    <div class="saved-build" ${idx === currentLoadedSlot ? 'style="border:1px solid var(--accent-gold);"' : ''}>
      <div class="build-info">
        <strong>${build.name}${idx === currentLoadedSlot ? ' ★' : ''}</strong>
        <small>${new Date(build.timestamp).toLocaleDateString()}</small>
      </div>
      <div class="build-actions">
        <button class="btn btn-sm" onclick="loadBuild(${idx})">Load</button>
        <button class="btn btn-sm btn-secondary" onclick="exportBuild(${idx})">Export</button>
        <button class="btn btn-sm btn-danger" onclick="deleteBuild(${idx})">Delete</button>
      </div>
    </div>
  `).join('');
}

// ========== Init ==========

async function initBuildMakerPage() {
  const data = await loadGameData();

  loadSavedBuilds();
  loadItemBookBP();

  const weapons = data.equips.filter(e => e.itemType === 1).sort((a, b) => a.id - b.id);
  const armors = data.equips.filter(e => e.itemType === 2).sort((a, b) => a.id - b.id);
  const rings = data.equips.filter(e => e.itemType === 3).sort((a, b) => a.id - b.id);

  // Setup autocomplete for each equipment slot
  setupAutocomplete('weapon-input', 'weapon-list', 'weapon-selected', weapons, () => calculateStats());
  setupAutocomplete('armor-input', 'armor-list', 'armor-selected', armors, () => calculateStats());
  setupAutocomplete('ring-input', 'ring-list', 'ring-selected', rings, () => calculateStats());

  // Build enchant groups from actual data
  buildEnchantGroups(data);
  populateEnchantSelects();

  renderBoostTable();
  renderSavedBuilds();

  // Input change listeners
  document.querySelectorAll('.equip-input').forEach(el => {
    el.addEventListener('change', calculateStats);
    el.addEventListener('input', calculateStats);
  });

  document.getElementById('save-build-btn')?.addEventListener('click', saveBuild);
  document.getElementById('clear-boosts-btn')?.addEventListener('click', clearBoosts);
  document.getElementById('import-build-btn')?.addEventListener('click', () => document.getElementById('import-build-file').click());
  document.getElementById('import-build-file')?.addEventListener('change', importBuild);

  // Set defaults
  if (weapons.length > 0) {
    document.getElementById('weapon-input').dataset.selectedId = weapons[0].id;
    setEquipDisplay('weapon-selected', weapons[0]);
  }
  if (armors.length > 0) {
    document.getElementById('armor-input').dataset.selectedId = armors[0].id;
    setEquipDisplay('armor-selected', armors[0]);
  }
  if (rings.length > 0) {
    document.getElementById('ring-input').dataset.selectedId = rings[0].id;
    setEquipDisplay('ring-selected', rings[0]);
  }

  calculateStats();
}

document.addEventListener('DOMContentLoaded', initBuildMakerPage);
