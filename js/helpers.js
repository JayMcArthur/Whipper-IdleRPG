/* Whipper Wiki - Shared Helpers */

// Global state
const WikiData = {
  equips: [], monsters: [], dungeons: [], customs: [], materials: [],
  translations: {},
  uiTranslations: {},
  randomKeys: { keys: [], specialKeys: [] },
  loaded: false
};

// Language column mapping: str,en_US,ja_JP,zh_CN,ko,zh_TW,es,th,pt,de,fr
const LANG_COLUMNS = {
  'en': 1, 'ja': 2, 'zh_CN': 3, 'ko': 4, 'zh_TW': 5,
  'es': 6, 'th': 7, 'pt': 8, 'de': 9, 'fr': 10
};

let currentLang = localStorage.getItem('wiki-lang') || 'en';

// Boss monster IDs
const BOSS_IDS = [100, 109, 129, 130, 131, 133, 134, 200, 201, 202, 203];
const STORY_BOSS_IDS = [100, 109, 129, 130, 131];
const ROYAL_TOMB_BOSS_IDS = [133, 134];
const JUNKYARD_BOSS_IDS = [200, 201, 202, 203];

// Parse CSV text into lookup object
function parseCSV(text) {
  const lines = text.split('\n');
  const result = {};
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const fields = [];
    let current = '';
    let inQuotes = false;
    
    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        fields.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    fields.push(current.trim());
    
    if (fields.length > 1 && fields[0]) {
      const key = fields[0].replace(/"/g, '').replace(/'/g, '').trim();
      result[key] = fields;
    }
  }
  
  return result;
}

// Translate a string using langs.csv
function translate(key) {
  if (!key || key === '') return '';
  const row = WikiData.translations[key];
  if (row) {
    const colIndex = LANG_COLUMNS[currentLang] || 1;
    return row[colIndex] || row[1] || key;
  }
  return key;
}

// Translate a UI string using ui-translations.json
// Usage: translateUI('nav.home') or translateUI('bosses.storyBosses')
function translateUI(path) {
  if (!path) return '';
  const parts = path.split('.');
  let obj = WikiData.uiTranslations;
  for (const part of parts) {
    if (!obj || !obj[part]) return path;
    obj = obj[part];
  }
  // obj should now be { en: '...', ja: '...', ... }
  if (typeof obj === 'object') {
    return obj[currentLang] || obj['en'] || path;
  }
  return obj || path;
}

// Generate random dungeons
function generateRandomDungeons() {
  const randomDungeons = [];
  const behindWords = ['The Canyon', 'The Fortress', 'The Mausoleum', 'The Ancient Citadel'];
  const frontWords = ['of Courage', 'of Judgment', 'of Wisdom'];
  
  for (let dId = 0; dId < 60; dId++) {
    const front = Math.floor(dId / 20); // 0, 1, 2 - determines difficulty tier
    const behind = Math.floor((dId % 20) / 5); // 0, 1, 2, 3 - determines location type
    let monsterPos = ((dId % 20) % 5) + 1; // 1-5 starting position variant
    monsterPos += 10 + 5 * behind; // Offset by location type
    
    const skips = front + 2; // Monster ID skip amount per slot
    const maxFloor = 24; // 14 + 10 (using max floor config)
    const minutesPerFloor = 20; // 15 + 5 (using max time config)
    
    const name = `${behindWords[behind]} ${frontWords[front]}`;
    
    const monsters = {};
    let pos = monsterPos;
    for (let floor = 1; floor <= maxFloor; floor++) {
      monsters[floor] = [pos, pos + skips, pos + skips + skips];
      if (floor % 4 === 0) {
        pos += skips + skips + skips;
      }
    }
    
    // Boss for Ancient Citadel of Wisdom with maxFloor > 20
    // Really 10% chance if Max Floor > 20, 50% if maxFloor == 24
    const hasBoss = name === 'The Ancient Citadel of Wisdom' && maxFloor > 20;
    if (hasBoss) {
      monsters[maxFloor + 1] = [200]; // Junkyard boss
    }
    
    randomDungeons.push({
      id: 16 + dId,
      nameId: name,
      maxFloor: maxFloor,
      minutesPerFloor: minutesPerFloor,
      modLv: 8,
      monsters: monsters,
      boss: hasBoss,
      isRandom: true,
      condition: 0
    });
  }
  
  return randomDungeons;
}

// Get unique random dungeon names (for display purposes)
function getUniqueRandomDungeons() {
  const seen = new Set();
  const unique = [];
  const allRandom = generateRandomDungeons();
  
  for (const d of allRandom) {
    if (!seen.has(d.nameId)) {
      seen.add(d.nameId);
      unique.push(d);
    }
  }
  return unique;
}

// Load all game data
async function loadGameData() {
  if (WikiData.loaded) return WikiData;
  
  try {
    const [equipsRes, monstersRes, dungeonsRes, customsRes, materialsRes, langsRes, uiTransRes, randomKeysRes] = await Promise.all([
      fetch('data/equips.json'),
      fetch('data/monsters.json'),
      fetch('data/dungeons.json'),
      fetch('data/customs.json'),
      fetch('data/materials.json'),
      fetch('data/langs.csv'),
      fetch('data/ui-translations.json').catch(() => ({ json: () => ({}) })),
      fetch('data/random-keys.json').catch(() => ({ json: () => ({ keys: [], specialKeys: [] }) }))
    ]);
    
    WikiData.equips = (await equipsRes.json()).equips || [];
    WikiData.monsters = (await monstersRes.json()).monsters || [];
    WikiData.dungeons = (await dungeonsRes.json()).dungeons || [];
    WikiData.customs = (await customsRes.json()).customs || [];
    WikiData.materials = (await materialsRes.json()).materials || [];
    WikiData.translations = parseCSV(await langsRes.text());
    WikiData.uiTranslations = await uiTransRes.json();
    const keysData = await randomKeysRes.json();
    WikiData.randomKeys = { keys: keysData.keys || [], specialKeys: keysData.specialKeys || [] };
    
    // Add random dungeons
    WikiData.randomDungeons = generateRandomDungeons();

    // OVERRIDES for where the game data is wrong
    // WikiData.monsters[135].item1 = 99; // Adam's item is 99 not 10099
    WikiData.dungeons[6]["monsters"]["31"] = [100]; // Add God of Death to Giant Tower of Justice
    WikiData.dungeons[8]["monsters"]["31"] = [109]; // Add Judgment to Dimensional Rift
    WikiData.dungeons[9]["monsters"]["21"] = [129, 130, 131]; // Add Demon King, Puppet King, Emperor Teba to Magic Castle of the End
    WikiData.dungeons[10]["monsters"]["6"] = [133, 134]; // Add Anubis, Necronomicon to The Illusory Royal Tomb
    WikiData.dungeons[11]["monsters"]["1"] = [200, 201, 202, 203]; // Add Adam, Panoptes, Nine Tails, Yamata to Junkyard
    WikiData.dungeons[12]["monsters"] = {}; // Clear Alchemist's Island


    WikiData.loaded = true;
    return WikiData;
  } catch (error) {
    console.error('Failed to load game data:', error);
    throw error;
  }
}

// Lookup functions
function getEquipById(id) { return WikiData.equips.find(e => e.id === id); }
function getMonsterById(id) { return WikiData.monsters.find(m => m.id === id); }
function getCustomById(id) { return WikiData.customs.find(c => c.id === id); }

// Get translated names
function getName(item) {
  if (!item) return '-';
  return translate(item.nameId) || item.nameId || '-';
}

function getSetName(item) {
  if (!item || !item.set) return '-';
  return translate(item.set) || item.set;
}

function getSummary(item) {
  if (!item || !item.summaryId) return '';
  return translate(item.summaryId) || item.summaryId;
}

function getEfficacy(item) {
  if (!item || !item.efficacyId) return '-';
  return translate(item.efficacyId) || item.efficacyId;
}

// Find equipment by set name (for linking)
function findEquipByName(name) {
  if (!name || name === '-') return null;
  return WikiData.equips.find(e => {
    const eName = getName(e);
    return eName === name || e.nameId === name;
  });
}

// Formatting
function formatNumber(num) {
  if (num === undefined || num === null) return '-';
  return num.toLocaleString();
}

function formatStat(base, growth) {
  let html = '';
  if (base === 0 && (!growth || growth === 0)) {
    html = '<span class="stat-zero">0</span>';
  } else if (base > 0) {
    html = `<span>${base}</span>`;
  } else if (base < 0) {
    html = `<span>-${base}</span>`;
  } else {
    html = '<span class="stat-zero">0</span>';
  }


  if (growth && growth > 0) {
    html += `<br><span class="stat-growth-positive">+${growth}/lv</span>`;
  }
  if (growth && growth < 0) {
    html += `<br><span class="stat-growth-negative">${growth}/lv</span>`;
  }

  return html;
}

function isBoss(monsterId) {
  return BOSS_IDS.includes(monsterId);
}

// Navigation - scroll to item on same page or navigate to different page
function goToItem(itemId, itemType, currentPage) {
  const typeToPage = { 1: 'weapons', 2: 'armor', 3: 'rings' };
  const targetPage = typeToPage[itemType];
  const currentPageName = currentPage || window.location.pathname.split('/').pop().replace('.html', '');
  
  if (currentPageName === targetPage) {
    // Same page - scroll to item
    scrollToItem(itemId);
  } else {
    // Different page - navigate
    window.location.href = `${targetPage}.html?id=${itemId}`;
  }
}

function scrollToItem(itemId) {
  const row = document.querySelector(`tr[data-id="${itemId}"]`);
  if (row) {
    // Remove previous highlights
    document.querySelectorAll('tr.highlighted').forEach(r => r.classList.remove('highlighted'));
    row.classList.add('highlighted');
    row.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}

function goToMonster(monsterId) {
  if (isBoss(monsterId)) {
    window.location.href = `bosses.html?id=${monsterId}`;
  } else {
    window.location.href = `monsters.html?id=${monsterId}`;
  }
}

function getUrlParam(param) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(param);
}

function highlightItemFromUrl(tableId) {
  const id = getUrlParam('id');
  if (!id) return;
  
  setTimeout(() => {
    const row = document.querySelector(`#${tableId} tr[data-id="${id}"]`);
    if (row) {
      row.classList.add('highlighted');
      row.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, 300);
}

// DataTable class for sortable/filterable tables
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

  setDualFilter(key1, value, key2, value2 = value) {
    if (value === '' || value === 'all' || value == null) {
      delete this.filters.__dual;
    } else {
      this.filters.__dual = { key1, value, key2, value2 };
    }
    this.applyFilters();
  }

  applyFilters() {
    const dual = this.filters.__dual; // may be undefined

    this.filteredData = this.data.filter(item => {
      // Search
      if (this.searchTerm) {
        const searchFields = this.options.searchFields || ['nameId'];
        const matches = searchFields.some(field => {
          let v = item[field];
          if (field === 'nameId') v = getName(item);
          else if (field === 'set') v = getSetName(item);
          return v && v.toString().toLowerCase().includes(this.searchTerm);
        });
        if (!matches) return false;
      }

      // Dual (only if present)
      if (dual) {
        const { key1, value, key2, value2 } = dual;

        const v1 = item[key1];
        const v2 = item[key2];

        const match1 = v1 != null && v1.toString() === value.toString();
        const match2 = v2 != null && v2.toString() === value2.toString();

        if (!match1 && !match2) return false;
      }

      // Normal filters (ignore __dual)
      for (const [key, value] of Object.entries(this.filters)) {
        if (key === '__dual') continue;

        const v = item[key];
        if (v != null && v.toString() !== value.toString()) return false;
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
      
      if (column === 'nameId') {
        aVal = getName(a);
        bVal = getName(b);
      }
      
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

// Header/Footer injection
function injectHeaderFooter() {
  // Get current page for active state
  const currentPage = window.location.pathname.split('/').pop().replace('.html', '') || 'index';
  
  const langOptions = `
    <option value="en">English</option>
    <option value="ja">日本語</option>
    <option value="zh_CN">简体中文</option>
    <option value="zh_TW">繁體中文</option>
    <option value="ko">한국어</option>
    <option value="es">Español</option>
    <option value="pt">Português</option>
    <option value="de">Deutsch</option>
    <option value="fr">Français</option>
    <option value="th">ไทย</option>
  `;
  
  const isEquipPage = ['weapons', 'armor', 'rings'].includes(currentPage);
  const isToolPage = ['compare', 'damage', 'item-book', 'build-maker', 'fight-sim'].includes(currentPage);
  const isGuidePage = ['guide-builds', 'guide-stats', 'guide-items', 'guide-story', 'guide-enchantments'].includes(currentPage);
  
  const header = `
    <nav class="nav">
      <div class="nav-container">
        <a href="index.html" class="nav-brand"><img src="assets/images/logo.png" alt=""><span>Whipper Wiki</span></a>
        <button class="nav-toggle">☰</button>
        <ul class="nav-links">
          <li><a href="index.html"${currentPage === 'index' ? ' class="active"' : ''}>Home</a></li>
          <li class="nav-dropdown">
            <a href="#"${isEquipPage ? ' class="active"' : ''}>Equipment</a>
            <div class="nav-dropdown-content">
              <a href="weapons.html"${currentPage === 'weapons' ? ' class="active"' : ''}>Weapons</a>
              <a href="armor.html"${currentPage === 'armor' ? ' class="active"' : ''}>Armor</a>
              <a href="rings.html"${currentPage === 'rings' ? ' class="active"' : ''}>Rings</a>
            </div>
          </li>
          <li><a href="monsters.html"${currentPage === 'monsters' ? ' class="active"' : ''}>Monsters</a></li>
          <li><a href="bosses.html"${currentPage === 'bosses' ? ' class="active"' : ''}>Bosses</a></li>
          <li><a href="dungeons.html"${currentPage === 'dungeons' ? ' class="active"' : ''}>Dungeons</a></li>
          <li><a href="enchantments.html"${currentPage === 'enchantments' ? ' class="active"' : ''}>Enchantments</a></li>
          <li><a href="materials.html"${currentPage === 'materials' ? ' class="active"' : ''}>Materials</a></li>
          <li><a href="analysis.html"${currentPage === 'analysis' ? ' class="active"' : ''}>Analysis</a></li>
          <li class="nav-dropdown">
            <a href="#"${isGuidePage ? ' class="active"' : ''}>Guides</a>
            <div class="nav-dropdown-content">
              <a href="guide-builds.html"${currentPage === 'guide-builds' ? ' class="active"' : ''}>Build Building</a>
              <a href="guide-stats.html"${currentPage === 'guide-stats' ? ' class="active"' : ''}>Stats for Dummies</a>
              <a href="guide-items.html"${currentPage === 'guide-items' ? ' class="active"' : ''}>Items Guide</a>
              <a href="guide-story.html"${currentPage === 'guide-story' ? ' class="active"' : ''}>Story Progression</a>
            </div>
          </li>
          <li class="nav-dropdown">
            <a href="#"${isToolPage ? ' class="active"' : ''}>Tools</a>
            <div class="nav-dropdown-content">
              <a href="item-book.html"${currentPage === 'item-book' ? ' class="active"' : ''}>Item Book</a>
              <a href="build-maker.html"${currentPage === 'build-maker' ? ' class="active"' : ''}>Build Maker</a>
              <a href="fight-sim.html"${currentPage === 'fight-sim' ? ' class="active"' : ''}>Fight Simulator</a>
              <!--a href="compare.html"${currentPage === 'compare' ? ' class="active"' : ''}>Item Comparison</a-->
              <!--a href="damage.html"${currentPage === 'damage' ? ' class="active"' : ''}>Damage Calculator</a-->
            </div>
          </li>
          <li class="lang-picker"><select id="lang-select">${langOptions}</select></li>
        </ul>
      </div>
    </nav>
  `;
  
  const footer = `
    <footer class="footer">
      <div class="footer-content">
        <div class="footer-links">
        <a href="https://discord.gg/aduUynVxqU" style="margin-right: 30px"><i class="fab fa-discord w3-hover-opacity icon-color"></i></a>
        <a href="https://twitter.com/HAappss" style="margin-right: 30px"><i class="fab fa-twitter w3-hover-opacity icon-color"></i></a>
        <a href="mailto:haappss@gmail.com"><i class="fa fa-envelope w3-hover-opacity icon-color"></i></a>
      </div>
      <p>Whipper Wiki - Game by HAappss - Wiki by Jay McArthur</p>
      </div>
    </footer>
  `;
  
  // Inject header
  const headerEl = document.getElementById('wiki-header');
  if (headerEl) headerEl.innerHTML = header;
  
  // Inject footer
  const footerEl = document.getElementById('wiki-footer');
  if (footerEl) footerEl.innerHTML = footer;
  
  // Initialize nav toggle and language picker
  initNavigation();
}

// Initialize navigation
function initNavigation() {
  const navToggle = document.querySelector('.nav-toggle');
  const navLinks = document.querySelector('.nav-links');
  if (navToggle && navLinks) {
    navToggle.addEventListener('click', () => navLinks.classList.toggle('active'));
  }
  
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

// Auto-inject header/footer on load
document.addEventListener('DOMContentLoaded', () => {
  injectHeaderFooter();
});
