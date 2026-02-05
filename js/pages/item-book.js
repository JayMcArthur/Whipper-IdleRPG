/* Whipper Wiki - Item Book Tool */

// XP required for each analysis level (cumulative)
const ANALYSIS_XP = [0, 1, 3, 7, 15, 31, 63, 103, 151, 207, 271, 335, 399, 463, 527, 591, 719, 847, 975, 1103, 1231];

// Get XP required for a level
function getXpForLevel(level) {
  return ANALYSIS_XP[Math.min(level, 20)] || 0;
}

// Get level from total XP
function getLevelFromXp(totalXp) {
  for (let i = 20; i >= 0; i--) {
    if (totalXp >= ANALYSIS_XP[i]) return i;
  }
  return 0;
}

// Calculate BP from analysis level (1 BP per 5 levels)
function getBpFromLevel(level) {
  return Math.floor(level / 5);
}

// Item Book data storage
let itemBook = {
  weapons: {},
  armor: {},
  rings: {},
  dungeons: {}
};

// Load from localStorage
function loadItemBook() {
  const saved = localStorage.getItem('whipper-item-book');
  if (saved) {
    try {
      itemBook = JSON.parse(saved);
    } catch (e) {
      console.error('Failed to load item book:', e);
    }
  }
}

// Save to localStorage
function saveItemBook() {
  localStorage.setItem('whipper-item-book', JSON.stringify(itemBook));
}

// Get item data
function getItemData(itemId, type) {
  const category = type === 1 ? 'weapons' : type === 2 ? 'armor' : 'rings';
  if (!itemBook[category][itemId]) {
    itemBook[category][itemId] = { level: 0, xp: 0 };
  }
  return itemBook[category][itemId];
}

// Set item data
function setItemData(itemId, type, level, xp) {
  const category = type === 1 ? 'weapons' : type === 2 ? 'armor' : 'rings';
  itemBook[category][itemId] = { level: Math.min(level, 20), xp };
  saveItemBook();
}

// Calculate totals
function calculateTotals() {
  let totalBp = 0;
  let totalMaxBp = 0;
  let itemsCompleted = 0;
  let totalItems = 0;
  let totalXpEarned = 0;
  let totalXpNeeded = 0;
  
  ['weapons', 'armor', 'rings'].forEach(cat => {
    const items = cat === 'weapons' ? WikiData.equips.filter(e => e.itemType === 1) :
                  cat === 'armor' ? WikiData.equips.filter(e => e.itemType === 2) :
                  WikiData.equips.filter(e => e.itemType === 3);
    
    items.forEach(item => {
      totalItems++;
      totalMaxBp += 4; // Max 4 BP per item (level 20)
      totalXpNeeded += ANALYSIS_XP[20];
      
      const data = itemBook[cat][item.id] || { level: 0, xp: 0 };
      totalBp += getBpFromLevel(data.level);
      totalXpEarned += ANALYSIS_XP[data.level] + data.xp;
      
      if (data.level >= 20) itemsCompleted++;
    });
  });
  
  return {
    totalBp,
    totalMaxBp,
    itemsCompleted,
    totalItems,
    totalXpEarned,
    totalXpNeeded,
    completionPercent: ((totalXpEarned / totalXpNeeded) * 100).toFixed(4)
  };
}

// Initialize Item Book page
async function initItemBookPage() {
  const data = await loadGameData();
  loadItemBook();
  
  renderItemBookSummary();
  renderItemTables(data);
  renderDungeonProgress(data);
  
  // Tab switching
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(btn.dataset.tab).classList.add('active');
    });
  });
  
  // Export/Import
  document.getElementById('export-btn')?.addEventListener('click', exportData);
  document.getElementById('import-btn')?.addEventListener('click', () => document.getElementById('import-file').click());
  document.getElementById('import-file')?.addEventListener('change', importData);
  document.getElementById('reset-btn')?.addEventListener('click', resetData);
}

function renderItemBookSummary() {
  const totals = calculateTotals();
  
  document.getElementById('total-bp').textContent = totals.totalBp;
  document.getElementById('max-bp').textContent = totals.totalMaxBp;
  document.getElementById('items-completed').textContent = totals.itemsCompleted;
  document.getElementById('total-items').textContent = totals.totalItems;
  document.getElementById('completion-percent').textContent = totals.completionPercent + '%';
  document.getElementById('xp-progress').textContent = `${formatNumber(totals.totalXpEarned)} / ${formatNumber(totals.totalXpNeeded)}`;
}

function renderItemTables(data) {
  const weapons = data.equips.filter(e => e.itemType === 1).sort((a, b) => a.id - b.id);
  const armor = data.equips.filter(e => e.itemType === 2).sort((a, b) => a.id - b.id);
  const rings = data.equips.filter(e => e.itemType === 3).sort((a, b) => a.id - b.id);
  
  renderItemTable('weapons-table', weapons, 1);
  renderItemTable('armor-table', armor, 2);
  renderItemTable('rings-table', rings, 3);
}

function renderItemTable(tableId, items, itemType) {
  const tbody = document.querySelector(`#${tableId} tbody`);
  if (!tbody) return;
  
  tbody.innerHTML = items.map(item => {
    const itemData = getItemData(item.id, itemType);
    const currentLevel = itemData.level;
    const currentXp = itemData.xp;
    const nextLevelXp = currentLevel < 20 ? (ANALYSIS_XP[currentLevel + 1] - ANALYSIS_XP[currentLevel]) : 0;
    const bp = getBpFromLevel(currentLevel);
    const isComplete = currentLevel >= 20;
    
    return `
      <tr data-id="${item.id}" data-type="${itemType}" class="${isComplete ? 'item-complete' : ''}">
        <td><div class="item-cell"><img src="assets/icons/${item.icon}.png" class="item-icon"><span>${getName(item)}</span></div></td>
        <td class="level-cell">
          <select class="level-select" data-id="${item.id}" data-type="${itemType}">
            ${Array.from({length: 21}, (_, i) => `<option value="${i}" ${i === currentLevel ? 'selected' : ''}>Lv ${i}</option>`).join('')}
          </select>
        </td>
        <td class="xp-cell">
          <input type="number" class="xp-input" data-id="${item.id}" data-type="${itemType}" 
            value="${currentXp}" min="0" max="${nextLevelXp}" ${isComplete ? 'disabled' : ''}>
          <span class="xp-max">/ ${nextLevelXp || '-'}</span>
        </td>
        <td class="bp-cell"><span class="bp-value ${bp > 0 ? 'has-bp' : ''}">${bp}</span></td>
      </tr>
    `;
  }).join('');
  
  // Add event listeners
  tbody.querySelectorAll('.level-select').forEach(sel => {
    sel.addEventListener('change', (e) => {
      const id = parseInt(e.target.dataset.id);
      const type = parseInt(e.target.dataset.type);
      const level = parseInt(e.target.value);
      setItemData(id, type, level, 0);
      renderItemTables(WikiData);
      renderItemBookSummary();
    });
  });
  
  tbody.querySelectorAll('.xp-input').forEach(input => {
    input.addEventListener('change', (e) => {
      const id = parseInt(e.target.dataset.id);
      const type = parseInt(e.target.dataset.type);
      const itemData = getItemData(id, type);
      let xp = parseInt(e.target.value) || 0;
      
      // Check if we should level up
      const nextLevelXp = ANALYSIS_XP[itemData.level + 1] - ANALYSIS_XP[itemData.level];
      if (xp >= nextLevelXp && itemData.level < 20) {
        setItemData(id, type, itemData.level + 1, 0);
      } else {
        setItemData(id, type, itemData.level, Math.max(0, xp));
      }
      
      renderItemTables(WikiData);
      renderItemBookSummary();
    });
  });
}

function renderDungeonProgress(data) {
  const container = document.getElementById('dungeon-progress');
  if (!container) return;
  
  // Initialize dungeon progress if not exists
  if (!itemBook.dungeons) itemBook.dungeons = {};
  
  const dungeons = data.dungeons.map(d => ({
    ...d,
    totalXp: calculateDungeonTotalXp(d, data),
    currentXp: itemBook.dungeons[d.id]?.xp || 0
  }));
  
  container.innerHTML = dungeons.map(d => {
    const percent = d.totalXp > 0 ? ((d.currentXp / d.totalXp) * 100).toFixed(2) : '0.00';
    return `
      <div class="dungeon-row">
        <span class="dungeon-name">${getName(d)}</span>
        <input type="number" class="dungeon-xp" data-id="${d.id}" value="${d.currentXp}" min="0">
        <span class="dungeon-total">/ ${formatNumber(d.totalXp)}</span>
        <span class="dungeon-percent">${percent}%</span>
      </div>
    `;
  }).join('');
  
  container.querySelectorAll('.dungeon-xp').forEach(input => {
    input.addEventListener('change', (e) => {
      const id = parseInt(e.target.dataset.id);
      if (!itemBook.dungeons[id]) itemBook.dungeons[id] = {};
      itemBook.dungeons[id].xp = parseInt(e.target.value) || 0;
      saveItemBook();
      renderDungeonProgress(data);
    });
  });
}

function calculateDungeonTotalXp(dungeon, data) {
  // Sum of all monster XP on all floors
  let total = 0;
  const monsters = dungeon.monsters || {};
  Object.values(monsters).forEach(floorMonsters => {
    floorMonsters.forEach(monsterId => {
      const monster = data.monsters.find(m => m.id === monsterId);
      if (monster) total += monster.exp;
    });
  });
  return total * dungeon.minutesPerFloor; // Approximate
}

function exportData() {
  const dataStr = JSON.stringify(itemBook, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'whipper-item-book.json';
  a.click();
  URL.revokeObjectURL(url);
}

function importData(e) {
  const file = e.target.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = (event) => {
    try {
      itemBook = JSON.parse(event.target.result);
      saveItemBook();
      renderItemTables(WikiData);
      renderItemBookSummary();
      renderDungeonProgress(WikiData);
      alert('Import successful!');
    } catch (err) {
      alert('Failed to import: Invalid file format');
    }
  };
  reader.readAsText(file);
}

function resetData() {
  if (confirm('Are you sure you want to reset all Item Book data? This cannot be undone.')) {
    itemBook = { weapons: {}, armor: {}, rings: {}, dungeons: {} };
    saveItemBook();
    renderItemTables(WikiData);
    renderItemBookSummary();
    renderDungeonProgress(WikiData);
  }
}

// Export for use in Build Maker
function getTotalBp() {
  loadItemBook();
  return calculateTotals().totalBp;
}

document.addEventListener('DOMContentLoaded', initItemBookPage);
