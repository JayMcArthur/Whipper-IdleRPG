/* Whipper Wiki - Core JavaScript v2 */

// Global state
const WikiData = {
  equips: [], monsters: [], dungeons: [], customs: [], materials: [],
  loaded: false
};

let currentLang = localStorage.getItem('wiki-lang') || 'en';

// Boss monster IDs
const BOSS_IDS = [100, 108, 109, 122, 123, 129, 133, 134, 200, 201, 202];
const JUNKYARD_BOSS_IDS = [200, 201, 202];

// Analysis data
const ANALYSIS_DATA = [
  { level: 1, corrosion: 0, cost: 1, total: 1, weapon: 'See Upgrade Limit', armor: 'See Upgrade Limit', ring: 'See Upgrade Limit' },
  { level: 2, corrosion: 0, cost: 2, total: 3, weapon: 'See Base Stats', armor: 'See Base Stats', ring: 'See Base Stats' },
  { level: 3, corrosion: 0, cost: 4, total: 7, weapon: 'See Evolution', armor: 'See Evolution', ring: 'See Evolution' },
  { level: 4, corrosion: 0, cost: 8, total: 15, weapon: 'See Level up Stats', armor: 'See Level up Stats', ring: 'See Level up Stats' },
  { level: 5, corrosion: 0, cost: 16, total: 31, weapon: '+100 Upgrade Limit', armor: '+100 Upgrade Limit', ring: 'x1.1 Specialization' },
  { level: 6, corrosion: 50, cost: 32, total: 63, weapon: 'x1.3 Attack Boost', armor: 'x1.1 Specialization', ring: 'x1.1 All Stats' },
  { level: 7, corrosion: 100, cost: 40, total: 103, weapon: '+1000 Upgrade Limit', armor: '+1000 Upgrade Limit', ring: 'Unique Effect' },
  { level: 8, corrosion: 150, cost: 48, total: 151, weapon: 'x2 Upgrade Boost', armor: 'x2 Upgrade Boost', ring: 'x1.2 Specialization' },
  { level: 9, corrosion: 200, cost: 56, total: 207, weapon: 'Set > x1.5 STR', armor: 'x1.3 Defense Boost', ring: 'x1.2 All Stats' },
  { level: 10, corrosion: 250, cost: 64, total: 271, weapon: 'x2 Corrosion Boost', armor: 'x2 Corrosion Boost', ring: 'Better Enchants' },
  { level: 11, corrosion: 300, cost: 64, total: 335, weapon: '+2000 Upgrade Limit', armor: '+2000 Upgrade Limit', ring: 'x1.3 Specialization' },
  { level: 12, corrosion: 350, cost: 64, total: 399, weapon: 'x2 Upgrade Boost', armor: 'x2 Upgrade Boost', ring: 'x1.3 All Stats' },
  { level: 13, corrosion: 400, cost: 64, total: 463, weapon: 'Set > x1.5 STR', armor: 'x1.3 HP Boost', ring: 'Unique Effect' },
  { level: 14, corrosion: 450, cost: 64, total: 527, weapon: '+3000 Upgrade Limit', armor: '+3000 Upgrade Limit', ring: 'x1.4 Specialization' },
  { level: 15, corrosion: 500, cost: 64, total: 591, weapon: 'x2 Corrosion Boost', armor: 'x2 Corrosion Boost', ring: 'Better Enchants' },
  { level: 16, corrosion: 600, cost: 128, total: 719, weapon: '+4000 Upgrade Limit', armor: '+4000 Upgrade Limit', ring: 'x1.5 HP Boost' },
  { level: 17, corrosion: 800, cost: 128, total: 847, weapon: '+5000 Upgrade Limit', armor: '+5000 Upgrade Limit', ring: 'x1.1 All Stats' },
  { level: 18, corrosion: 1100, cost: 128, total: 975, weapon: '+6000 Upgrade Limit', armor: '+6000 Upgrade Limit', ring: 'x1.2 All Stats' },
  { level: 19, corrosion: 1500, cost: 128, total: 1103, weapon: '+9900 Upgrade Limit', armor: '+9900 Upgrade Limit', ring: 'x1.3 All Stats' },
  { level: 20, corrosion: 2000, cost: 128, total: 1231, weapon: '+19000 Upgrade Limit', armor: '+19000 Upgrade Limit', ring: 'Better Enchants' }
];

// Enchantment definitions with effects
const ENCHANT_DEFS = [
  { name: 'Endurance', effect: 'Increases the HP base value by {value}.', hasLevels: true },
  { name: 'Strength', effect: 'Increases the STR base value by {value}.', hasLevels: true },
  { name: 'Sturdy', effect: 'Increases the VIT base value by {value}.', hasLevels: true },
  { name: 'Agility', effect: 'Increases the SPD base value by {value}.', hasLevels: true },
  { name: 'Lucky', effect: 'Increases the LUK base value by {value}.', hasLevels: true },
  { name: 'Strength Training', effect: 'Increases the STR growth value by {value}.', hasLevels: true },
  { name: 'Defense Training', effect: 'Increases the VIT growth value by {value}.', hasLevels: true },
  { name: 'Endurance Training', effect: 'Increases the HP growth value by {value}.', hasLevels: true },
  { name: 'First Strike', effect: 'Can always attack first in battle.', hasLevels: false },
  { name: 'Double Strike', effect: 'Chance of consecutive attacks increases by {value}%', hasLevels: true },
  { name: 'One Strike', effect: 'Critical hit chance increases by {value}%', hasLevels: true },
  { name: 'Three Paths', effect: '{value}% chance for critical damage to be tripled', hasLevels: true },
  { name: 'Four Leaves', effect: '{value}% chance for enemy drops to double', hasLevels: true },
  { name: 'Five Lights', effect: '{value}% chance to double experience points', hasLevels: true },
  { name: 'Sixth Sense', effect: '{value}% chance to dodge an attack', hasLevels: true },
  { name: 'Seven Blessings', effect: 'The probability of probability-based abilities is doubled.', hasLevels: false },
  { name: 'Mastery of Slashing', effect: 'Equip a slashing weapon', hasLevels: true },
  { name: 'Mastery of Bludgeoning', effect: 'Equip a bludgeoning weapon', hasLevels: true },
  { name: 'Mastery of Piercing', effect: 'Equip a piercing weapon', hasLevels: true },
  { name: 'Mastery of Projectiles', effect: 'Equip a projectile weapon', hasLevels: true },
  { name: 'Poison', effect: 'Inflict poison with each attack', hasLevels: false },
  { name: 'Solitude', effect: 'Increase all abilities when not equipping a set', hasLevels: true },
  { name: 'Unyielding', effect: 'Stay at 1 HP once during an adventure and deliver a critical hit on the next attack', hasLevels: false },
  { name: 'Attack Power Boost', effect: 'Weapon attack power increased by {value}%', hasLevels: true },
  { name: 'Defense Power Boost', effect: 'Shield defense power increased by {value}%', hasLevels: true },
  { name: 'Upgrade Boost', effect: 'Upgrade increase by {value} times', hasLevels: true },
  { name: 'Exceed upgrade limit', effect: 'Upgrade limit increased by {value}', hasLevels: true },
  { name: 'Corrosion Level Boost', effect: 'N/A', hasLevels: false },
  { name: 'HP Boost', effect: 'HP increased by {value}%', hasLevels: true },
  { name: 'STR Boost', effect: 'STR increased by {value}%', hasLevels: true },
  { name: 'VIT Boost', effect: 'VIT increased by {value}%', hasLevels: true },
  { name: 'SPD Boost', effect: 'SPD increased by {value}%', hasLevels: true },
  { name: 'LUK Boost', effect: 'LUK increased by {value}%', hasLevels: true },
  { name: 'All Stats Boost', effect: 'All stats increased by {value}%', hasLevels: true },
  { name: 'Ability Level Boost', effect: 'This item is more likely to gain high-level abilities', hasLevels: false },
  { name: 'Set Boost', effect: 'Increases the effect of set equipment', hasLevels: true }
];

// Load game data
async function loadGameData() {
  if (WikiData.loaded) return WikiData;
  
  try {
    const [equipsRes, monstersRes, dungeonsRes, customsRes, materialsRes] = await Promise.all([
      fetch('data/equips.json'),
      fetch('data/monsters.json'),
      fetch('data/dungeons.json'),
      fetch('data/customs.json'),
      fetch('data/materials.json')
    ]);
    
    WikiData.equips = (await equipsRes.json()).equips || [];
    WikiData.monsters = (await monstersRes.json()).monsters || [];
    WikiData.dungeons = (await dungeonsRes.json()).dungeons || [];
    WikiData.customs = (await customsRes.json()).customs || [];
    WikiData.materials = (await materialsRes.json()).materials || [];
    WikiData.loaded = true;
    
    return WikiData;
  } catch (error) {
    console.error('Failed to load game data:', error);
    throw error;
  }
}

// Helper functions
function getEquipById(id) { return WikiData.equips.find(e => e.id === id); }
function getMonsterById(id) { return WikiData.monsters.find(m => m.id === id); }
function getCustomById(id) { return WikiData.customs.find(c => c.id === id); }

function getName(item) {
  if (!item) return '-';
  return currentLang === 'ja' ? (item.nameId || item.nameId_EN) : (item.nameId_EN || item.nameId);
}

function formatNumber(num) {
  if (num === undefined || num === null) return '-';
  return num.toLocaleString();
}

function formatStat(base, growth) {
  let html = '';
  if (base === 0 && (!growth || growth === 0)) {
    html = '<span class="stat-zero">0</span>';
  } else if (base > 0) {
    html = `<span class="stat-positive">+${base}</span>`;
  } else if (base < 0) {
    html = `<span class="stat-negative">${base}</span>`;
  } else {
    html = '<span class="stat-zero">0</span>';
  }
  
  if (growth && growth > 0) {
    html += `<br><span class="stat-growth">↑${growth}</span>`;
  }
  return html;
}

function isBoss(monsterId) {
  return BOSS_IDS.includes(monsterId);
}

// Navigation to item/monster pages
function goToItem(itemId, itemType) {
  let page = 'weapons.html';
  if (itemType === 2) page = 'armor.html';
  else if (itemType === 3) page = 'rings.html';
  window.location.href = `${page}?id=${itemId}`;
}

function goToMonster(monsterId) {
  if (isBoss(monsterId)) {
    window.location.href = `bosses.html?id=${monsterId}`;
  } else {
    window.location.href = `monsters.html?id=${monsterId}`;
  }
}

// Get URL parameter
function getUrlParam(param) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(param);
}

// Highlight item by ID from URL
function highlightItemFromUrl(tableId) {
  const id = getUrlParam('id');
  if (!id) return;
  
  setTimeout(() => {
    const row = document.querySelector(`#${tableId} tr[data-id="${id}"]`);
    if (row) {
      row.style.background = 'rgba(245, 166, 35, 0.2)';
      row.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, 500);
}

// DataTable class
class DataTable {
  constructor(tableId, options = {}) {
    this.table = document.getElementById(tableId);
    this.options = options;
    this.data = [];
    this.filteredData = [];
    this.sortColumn = null;
    this.sortDirection = 'asc';
    this.searchTerm = '';
    this.filters = {};
  }
  
  setData(data) {
    this.data = data;
    this.filteredData = [...data];
    this.render();
  }
  
  setSearch(term) {
    this.searchTerm = term.toLowerCase();
    this.applyFilters();
  }
  
  setFilter(key, value) {
    if (value === '' || value === 'all') delete this.filters[key];
    else this.filters[key] = value;
    this.applyFilters();
  }
  
  applyFilters() {
    this.filteredData = this.data.filter(item => {
      if (this.searchTerm) {
        const searchFields = this.options.searchFields || ['nameId_EN', 'nameId'];
        const matches = searchFields.some(field => {
          const value = item[field];
          return value && value.toString().toLowerCase().includes(this.searchTerm);
        });
        if (!matches) return false;
      }
      for (const [key, value] of Object.entries(this.filters)) {
        if (item[key] !== undefined && item[key].toString() !== value.toString()) return false;
      }
      return true;
    });
    
    if (this.sortColumn) this.sort(this.sortColumn, this.sortDirection, false);
    this.render();
  }
  
  sort(column, direction = null, render = true) {
    if (direction === null) {
      this.sortDirection = (this.sortColumn === column && this.sortDirection === 'asc') ? 'desc' : 'asc';
    } else {
      this.sortDirection = direction;
    }
    this.sortColumn = column;
    
    this.filteredData.sort((a, b) => {
      let aVal = a[column] ?? '';
      let bVal = b[column] ?? '';
      
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return this.sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
      }
      
      aVal = aVal.toString().toLowerCase();
      bVal = bVal.toString().toLowerCase();
      if (aVal < bVal) return this.sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return this.sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    
    if (render) this.render();
    this.updateSortIndicators();
  }
  
  updateSortIndicators() {
    if (!this.table) return;
    this.table.querySelectorAll('th[data-sort]').forEach(th => {
      th.classList.remove('sorted-asc', 'sorted-desc');
      if (th.dataset.sort === this.sortColumn) {
        th.classList.add(this.sortDirection === 'asc' ? 'sorted-asc' : 'sorted-desc');
      }
    });
  }
  
  render() {
    if (!this.table || !this.options.renderRow) return;
    const tbody = this.table.querySelector('tbody');
    if (!tbody) return;
    
    if (this.filteredData.length === 0) {
      tbody.innerHTML = '<tr><td colspan="100" class="no-results">No results found</td></tr>';
      return;
    }
    
    tbody.innerHTML = this.filteredData.map(item => this.options.renderRow(item)).join('');
    
    const countEl = document.getElementById('result-count');
    if (countEl) countEl.textContent = `${this.filteredData.length} of ${this.data.length}`;
  }
  
  bindSortHeaders() {
    if (!this.table) return;
    this.table.querySelectorAll('th[data-sort]').forEach(th => {
      th.addEventListener('click', () => this.sort(th.dataset.sort));
    });
  }
}

// Initialize navigation
function initNavigation() {
  const navToggle = document.querySelector('.nav-toggle');
  const navLinks = document.querySelector('.nav-links');
  if (navToggle && navLinks) {
    navToggle.addEventListener('click', () => navLinks.classList.toggle('active'));
  }
  
  // Language picker
  const langSelect = document.getElementById('lang-select');
  if (langSelect) {
    langSelect.value = currentLang;
    langSelect.addEventListener('change', (e) => {
      currentLang = e.target.value;
      localStorage.setItem('wiki-lang', currentLang);
      location.reload();
    });
  }
}

// === PAGE INITIALIZERS ===

// Weapons Page
async function initWeaponsPage() {
  const data = await loadGameData();
  const weapons = data.equips.filter(e => e.itemType === 1);
  
  const table = new DataTable('weapons-table', {
    searchFields: ['nameId_EN', 'nameId', 'set_EN', 'equipKind', 'attackKind'],
    renderRow: (item) => {
      const nextItem = item.next ? getEquipById(item.next) : null;
      return `
        <tr data-id="${item.id}">
          <td><div class="item-cell"><img src="assets/icons/${item.icon}.png" class="item-icon" alt=""><span class="item-name">${getName(item)}</span></div></td>
          <td class="stat-col">${item.param}</td>
          <td class="stat-col">${formatStat(item.hp, item.lvHp)}</td>
          <td class="stat-col">${formatStat(item.atk, item.lvAtk)}</td>
          <td class="stat-col">${formatStat(item.def, item.lvDef)}</td>
          <td class="stat-col">${item.maxLv}</td>
          <td><span class="badge">${item.equipKind || '-'}</span></td>
          <td>${item.attackKind || '-'}</td>
          <td>${item.set_EN || '-'}</td>
          <td>${nextItem ? `<span class="item-link" onclick="goToItem(${nextItem.id}, ${nextItem.itemType})">${getName(nextItem)}</span>` : '-'}</td>
        </tr>
      `;
    }
  });
  
  table.setData(weapons);
  table.bindSortHeaders();
  
  document.getElementById('search-input')?.addEventListener('input', (e) => table.setSearch(e.target.value));
  
  const equipKindFilter = document.getElementById('filter-equipKind');
  if (equipKindFilter) {
    const kinds = [...new Set(weapons.map(w => w.equipKind).filter(Boolean))];
    equipKindFilter.innerHTML = '<option value="">All Types</option>' + kinds.map(k => `<option value="${k}">${k}</option>`).join('');
    equipKindFilter.addEventListener('change', (e) => table.setFilter('equipKind', e.target.value));
  }
  
  const attackKindFilter = document.getElementById('filter-attackKind');
  if (attackKindFilter) {
    const kinds = [...new Set(weapons.map(w => w.attackKind).filter(Boolean))];
    attackKindFilter.innerHTML = '<option value="">All Damage</option>' + kinds.map(k => `<option value="${k}">${k}</option>`).join('');
    attackKindFilter.addEventListener('change', (e) => table.setFilter('attackKind', e.target.value));
  }
  
  highlightItemFromUrl('weapons-table');
}

// Armor Page
async function initArmorPage() {
  const data = await loadGameData();
  const armor = data.equips.filter(e => e.itemType === 2);
  
  const table = new DataTable('armor-table', {
    searchFields: ['nameId_EN', 'nameId', 'equipKind', 'specialized'],
    renderRow: (item) => {
      const nextItem = item.next ? getEquipById(item.next) : null;
      return `
        <tr data-id="${item.id}">
          <td><div class="item-cell"><img src="assets/icons/${item.icon}.png" class="item-icon" alt=""><span class="item-name">${getName(item)}</span></div></td>
          <td class="stat-col">${item.param}</td>
          <td class="stat-col">${formatStat(item.hp, item.lvHp)}</td>
          <td class="stat-col">${formatStat(item.atk, item.lvAtk)}</td>
          <td class="stat-col">${formatStat(item.def, item.lvDef)}</td>
          <td class="stat-col">${item.maxLv}</td>
          <td><span class="badge">${item.equipKind || '-'}</span></td>
          <td>${item.specialized || '-'}</td>
          <td>${nextItem ? `<span class="item-link" onclick="goToItem(${nextItem.id}, ${nextItem.itemType})">${getName(nextItem)}</span>` : '-'}</td>
        </tr>
      `;
    }
  });
  
  table.setData(armor);
  table.bindSortHeaders();
  document.getElementById('search-input')?.addEventListener('input', (e) => table.setSearch(e.target.value));
  
  const equipKindFilter = document.getElementById('filter-equipKind');
  if (equipKindFilter) {
    const kinds = [...new Set(armor.map(a => a.equipKind).filter(Boolean))];
    equipKindFilter.innerHTML = '<option value="">All Types</option>' + kinds.map(k => `<option value="${k}">${k}</option>`).join('');
    equipKindFilter.addEventListener('change', (e) => table.setFilter('equipKind', e.target.value));
  }
  
  highlightItemFromUrl('armor-table');
}

// Rings Page
async function initRingsPage() {
  const data = await loadGameData();
  const rings = data.equips.filter(e => e.itemType === 3);
  
  const table = new DataTable('rings-table', {
    searchFields: ['nameId_EN', 'nameId', 'specialized'],
    renderRow: (item) => {
      const ability = item.ability ? getCustomById(item.ability) : null;
      const abilityText = ability ? `${getName(ability)}` : '-';
      const abilitySummary = ability ? (ability.summaryId_EN || ability.summaryId || '') : '';
      
      return `
        <tr data-id="${item.id}">
          <td><div class="item-cell"><img src="assets/icons/${item.icon}.png" class="item-icon" alt=""><span class="item-name">${getName(item)}</span></div></td>
          <td class="stat-col">${formatStat(item.hp, item.lvHp)}</td>
          <td class="stat-col">${formatStat(item.atk, item.lvAtk)}</td>
          <td class="stat-col">${formatStat(item.def, item.lvDef)}</td>
          <td>${item.specialized || '-'}</td>
          <td><span class="text-gold">${abilityText}</span>${abilitySummary ? `<br><span class="text-muted" style="font-size:0.75em">${abilitySummary}</span>` : ''}</td>
        </tr>
      `;
    }
  });
  
  table.setData(rings);
  table.bindSortHeaders();
  document.getElementById('search-input')?.addEventListener('input', (e) => table.setSearch(e.target.value));
  highlightItemFromUrl('rings-table');
}

// Monsters Page (non-bosses)
async function initMonstersPage() {
  const data = await loadGameData();
  const monsters = data.monsters.filter(m => !BOSS_IDS.includes(m.id));
  
  const table = new DataTable('monsters-table', {
    searchFields: ['nameId_EN', 'nameId'],
    renderRow: (monster) => {
      const drop1 = monster.item1 ? getEquipById(monster.item1) : null;
      const drop2 = monster.item2 ? getEquipById(monster.item2) : null;
      
      return `
        <tr data-id="${monster.id}">
          <td>${monster.id}</td>
          <td><span class="item-name">${getName(monster)}</span></td>
          <td class="stat-col">${formatNumber(monster.hp)}</td>
          <td class="stat-col">${formatNumber(monster.atk)}</td>
          <td class="stat-col">${formatNumber(monster.def)}</td>
          <td class="stat-col">${monster.spd}</td>
          <td class="stat-col">${formatNumber(monster.exp)}</td>
          <td>${drop1 ? `<div class="item-cell"><img src="assets/icons/${drop1.icon}.png" class="item-icon"><span class="item-link" onclick="goToItem(${drop1.id}, ${drop1.itemType})">${getName(drop1)}</span> <span class="text-muted">(${monster.prob1}%)</span></div>` : '-'}</td>
          <td>${drop2 ? `<div class="item-cell"><img src="assets/icons/${drop2.icon}.png" class="item-icon"><span class="item-link" onclick="goToItem(${drop2.id}, ${drop2.itemType})">${getName(drop2)}</span> <span class="text-muted">(${monster.prob2}%)</span></div>` : '-'}</td>
        </tr>
      `;
    }
  });
  
  table.setData(monsters);
  table.bindSortHeaders();
  document.getElementById('search-input')?.addEventListener('input', (e) => table.setSearch(e.target.value));
  highlightItemFromUrl('monsters-table');
}

// Bosses Page
async function initBossesPage() {
  const data = await loadGameData();
  const container = document.getElementById('bosses-container');
  if (!container) return;
  
  const bosses = data.monsters.filter(m => BOSS_IDS.includes(m.id));
  const bossImages = { 200: 'adam_256', 201: 'pano_256', 202: 'fox_256' };
  
  container.innerHTML = bosses.map(boss => {
    const drop1 = boss.item1 ? getEquipById(boss.item1) : null;
    const isJunkyard = JUNKYARD_BOSS_IDS.includes(boss.id);
    const imgFile = bossImages[boss.id] || null;
    
    return `
      <div class="card boss-card">
        ${imgFile ? `<img src="assets/boss/${imgFile}.png" class="boss-image" alt="${getName(boss)}">` : '<div class="boss-image"></div>'}
        <div class="boss-info">
          <h3 class="boss-name">${getName(boss)}</h3>
          ${isJunkyard ? '<span class="badge badge-boss">Junkyard Boss</span>' : '<span class="badge badge-boss">Boss</span>'}
          <div class="boss-stats">
            <div class="boss-stat"><div class="boss-stat-value">${formatNumber(boss.hp)}</div><div class="boss-stat-label">HP</div></div>
            <div class="boss-stat"><div class="boss-stat-value">${formatNumber(boss.atk)}</div><div class="boss-stat-label">ATK</div></div>
            <div class="boss-stat"><div class="boss-stat-value">${formatNumber(boss.def)}</div><div class="boss-stat-label">DEF</div></div>
            <div class="boss-stat"><div class="boss-stat-value">${boss.spd}</div><div class="boss-stat-label">SPD</div></div>
            <div class="boss-stat"><div class="boss-stat-value">${formatNumber(boss.exp)}</div><div class="boss-stat-label">EXP</div></div>
          </div>
          ${drop1 ? `<p class="mt-2">Drop: <span class="item-link" onclick="goToItem(${drop1.id}, ${drop1.itemType})">${getName(drop1)}</span> (${boss.prob1}%)</p>` : ''}
          ${isJunkyard ? '<p class="text-muted mt-1">Junkyard bosses gain additional effects each time they are defeated.</p>' : ''}
        </div>
      </div>
    `;
  }).join('');
}

// Dungeons Page
async function initDungeonsPage() {
  const data = await loadGameData();
  const container = document.getElementById('dungeons-container');
  if (!container) return;
  
  container.innerHTML = data.dungeons.map(dungeon => {
    const floors = Object.entries(dungeon.monsters || {}).map(([floor, monsterIds]) => {
      const monsters = monsterIds.map(id => {
        const monster = getMonsterById(id);
        const name = monster ? getName(monster) : `#${id}`;
        const isBossM = isBoss(id);
        return `<span class="${isBossM ? 'monster-link text-gold' : 'monster-link'}" onclick="goToMonster(${id})">${name}</span>`;
      });
      return `<div class="floor-row"><span class="floor-num">${floor}F</span><div class="floor-monsters">${monsters.join(', ')}</div></div>`;
    }).join('');
    
    return `
      <div class="dungeon-card">
        <div class="dungeon-header">
          <img src="assets/dungeons/${dungeon.id}.png" class="dungeon-image" alt="" onerror="this.style.display='none'">
          <div class="dungeon-title">
            <h3>${getName(dungeon)}</h3>
            <div class="dungeon-meta">
              <span>📊 ${dungeon.maxFloor} Floors</span>
              <span>⏱️ ${dungeon.minutesPerFloor} min/floor</span>
              <span>⚔️ Mod Lv ${dungeon.modLv}</span>
            </div>
          </div>
        </div>
        <div class="dungeon-floors">${floors || '<p class="text-muted">No monster data</p>'}</div>
      </div>
    `;
  }).join('');
}

// Enchantments Page
async function initEnchantmentsPage() {
  const data = await loadGameData();
  const container = document.getElementById('enchantments-container');
  if (!container) return;
  
  // Group by name
  const enchantGroups = {};
  data.customs.forEach(c => {
    const name = getName(c);
    if (!enchantGroups[name]) enchantGroups[name] = [];
    enchantGroups[name].push({ level: c.dispLv, value: c.value, modLv: c.modLv });
  });
  
  // Sort by level
  Object.values(enchantGroups).forEach(arr => arr.sort((a, b) => a.level - b.level));
  
  // Find matching definition
  const getEffect = (name) => {
    const def = ENCHANT_DEFS.find(d => d.name === name);
    return def ? def.effect : '';
  };
  
  // Build table with levels 1-18
  const levels = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18];
  
  let html = `
    <div class="table-container">
      <table class="enchant-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Effect</th>
            ${levels.map(l => `<th>Lv ${l}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
  `;
  
  const sortedNames = Object.keys(enchantGroups).sort();
  
  sortedNames.forEach(name => {
    const group = enchantGroups[name];
    const effect = getEffect(name);
    
    html += `<tr>
      <td class="enchant-name">${name}</td>
      <td class="enchant-effect">${effect}</td>
      ${levels.map(l => {
        const lvData = group.find(g => g.level === l);
        return `<td>${lvData ? formatNumber(lvData.value) : '-'}</td>`;
      }).join('')}
    </tr>`;
  });
  
  html += '</tbody></table></div>';
  container.innerHTML = html;
}

// Materials Page
async function initMaterialsPage() {
  const data = await loadGameData();
  
  const table = new DataTable('materials-table', {
    searchFields: ['nameId_EN', 'nameId', 'efficacyId_EN'],
    renderRow: (material) => `
      <tr>
        <td><div class="item-cell"><img src="assets/icons/${material.icon}.png" class="item-icon" alt=""><span class="item-name">${getName(material)}</span></div></td>
        <td>${material.efficacyId_EN || material.efficacyId || '-'}</td>
      </tr>
    `
  });
  
  table.setData(data.materials);
  table.bindSortHeaders();
  document.getElementById('search-input')?.addEventListener('input', (e) => table.setSearch(e.target.value));
}

// Analysis Page
function initAnalysisPage() {
  const container = document.getElementById('analysis-container');
  if (!container) return;
  
  let html = `
    <div class="table-container">
      <table class="analysis-table">
        <thead>
          <tr>
            <th>Level</th>
            <th>Corrosion</th>
            <th>Cost</th>
            <th>Total</th>
            <th>Weapon</th>
            <th>Armor</th>
            <th>Ring</th>
          </tr>
        </thead>
        <tbody>
  `;
  
  ANALYSIS_DATA.forEach(row => {
    html += `
      <tr>
        <td>LVL ${row.level}</td>
        <td>${row.corrosion}</td>
        <td>${row.cost}</td>
        <td>${row.total}</td>
        <td>${row.weapon}</td>
        <td>${row.armor}</td>
        <td>${row.ring}</td>
      </tr>
    `;
  });
  
  html += '</tbody></table></div>';
  container.innerHTML = html;
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  initNavigation();
});
