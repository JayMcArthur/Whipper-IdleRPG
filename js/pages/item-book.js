/* Whipper Wiki - Item Book Tool (Reworked) */

const ANALYSIS_XP = [0, 1, 3, 7, 15, 31, 63, 103, 151, 207, 271, 335, 399, 463, 527, 591, 719, 847, 975, 1103, 1231, 1359, 1487, 1615, 1743, 1871];

function getBpFromLevel(level) { return Math.floor(level / 5); }

// Item Book data storage
let itemBook = { weapons: {}, armor: {}, rings: {} };

function loadItemBook() {
  const saved = localStorage.getItem('whipper-item-book');
  if (saved) { try { itemBook = JSON.parse(saved); } catch (e) {} }
  // Ensure no legacy dungeons key interferes
  if (!itemBook.weapons) itemBook.weapons = {};
  if (!itemBook.armor) itemBook.armor = {};
  if (!itemBook.rings) itemBook.rings = {};
}

function saveItemBook() {
  localStorage.setItem('whipper-item-book', JSON.stringify(itemBook));
}

function getItemData(itemId, type) {
  const cat = type === 1 ? 'weapons' : type === 2 ? 'armor' : 'rings';
  return itemBook[cat][itemId] || { level: 0, xp: 0 };
}

function setItemData(itemId, type, level, xp) {
  const cat = type === 1 ? 'weapons' : type === 2 ? 'armor' : 'rings';
  itemBook[cat][itemId] = { level: Math.min(level, 25), xp };
  saveItemBook();
}

function calculateTotals() {
  let totalBp = 0, totalMaxBp = 0, itemsCompleted = 0, totalItems = 0, totalXpEarned = 0, totalXpNeeded = 0;
  ['weapons', 'armor', 'rings'].forEach(cat => {
    const typeNum = cat === 'weapons' ? 1 : cat === 'armor' ? 2 : 3;
    const items = WikiData.equips.filter(e => e.itemType === typeNum);
    items.forEach(item => {
      totalItems++;
      totalMaxBp += 5;
      totalXpNeeded += ANALYSIS_XP[25];
      const data = itemBook[cat][item.id] || { level: 0, xp: 0 };
      totalBp += getBpFromLevel(data.level);
      totalXpEarned += ANALYSIS_XP[data.level] + (data.xp || 0);
      if (data.level >= 25) itemsCompleted++;
    });
  });
  return { totalBp, totalMaxBp, itemsCompleted, totalItems, totalXpEarned, totalXpNeeded,
    completionPercent: totalXpNeeded > 0 ? ((totalXpEarned / totalXpNeeded) * 100).toFixed(4) : '0.0000'
  };
}

function renderSummary() {
  const t = calculateTotals();
  document.getElementById('total-bp').textContent = t.totalBp;
  document.getElementById('max-bp').textContent = t.totalMaxBp;
  document.getElementById('items-completed').textContent = t.itemsCompleted;
  document.getElementById('total-items').textContent = t.totalItems;
  document.getElementById('completion-percent').textContent = t.completionPercent + '%';
  document.getElementById('xp-progress').textContent = `${formatNumber(t.totalXpEarned)} / ${formatNumber(t.totalXpNeeded)}`;
}

// Create a DataTable-style item table with inline editing
function buildItemTable(tableId, items, itemType, searchId, countId) {
  const table = new DataTable(tableId, {
    searchFields: ['nameId', 'equipKind'],
    renderRow: (item) => {
      const d = getItemData(item.id, itemType);
      const bp = getBpFromLevel(d.level);
      const isComplete = d.level >= 25;
      const nextXp = d.level < 25 ? (ANALYSIS_XP[d.level + 1] - ANALYSIS_XP[d.level]) : 0;
      const isRing = itemType === 3;
      return `
        <tr data-id="${item.id}" class="${isComplete ? 'item-complete' : ''}">
          <td class="stat-col">${item.id}</td>
          <td><div class="item-cell"><img src="assets/icons/${item.icon}.png" class="item-icon" alt=""><span class="item-name">${getName(item)}</span></div></td>
          ${!isRing ? `<td><span class="badge">${item.equipKind || '-'}</span></td>` : ''}
          <td class="stat-col">
            <select class="level-select" data-id="${item.id}" data-type="${itemType}">
              ${Array.from({length: 26}, (_, i) => `<option value="${i}" ${i === d.level ? 'selected' : ''}>Lv ${i}</option>`).join('')}
            </select>
          </td>
          <td>
            <input type="number" class="xp-input" data-id="${item.id}" data-type="${itemType}"
              value="${d.xp || 0}" min="0" max="${nextXp}" ${isComplete ? 'disabled' : ''}>
            <span class="xp-max">/ ${nextXp || '—'}</span>
          </td>
          <td class="stat-col"><span class="bp-badge ${bp > 0 ? 'has-bp' : ''}">${bp}</span></td>
        </tr>
      `;
    }
  });

  // Enrich items with _bp for sorting
  items.forEach(item => {
    const d = getItemData(item.id, itemType);
    item._bp = getBpFromLevel(d.level);
  });

  table.setData(items);
  table.bindSortHeaders();

  // Search
  document.getElementById(searchId)?.addEventListener('input', (e) => table.setSearch(e.target.value));

  // Override count element ID for this table
  const origRender = table.render.bind(table);
  table.render = function() {
    origRender();
    const el = document.getElementById(countId);
    if (el) el.textContent = `${this.filteredData.length} of ${this.data.length}`;
    bindTableEvents(tableId, itemType, table, items);
  };
  table.render();

  return table;
}

function bindTableEvents(tableId, itemType, table, items) {
  const tbody = document.querySelector(`#${tableId} tbody`);
  if (!tbody) return;

  tbody.querySelectorAll('.level-select').forEach(sel => {
    sel.addEventListener('change', (e) => {
      const id = parseInt(e.target.dataset.id);
      const level = parseInt(e.target.value);
      setItemData(id, itemType, level, 0);
      items.forEach(item => { if (item.id === id) item._bp = getBpFromLevel(level); });
      table.render();
      renderSummary();
      renderDungeonProgress();
    });
  });

  tbody.querySelectorAll('.xp-input').forEach(input => {
    input.addEventListener('change', (e) => {
      const id = parseInt(e.target.dataset.id);
      const d = getItemData(id, itemType);
      let xp = parseInt(e.target.value) || 0;
      const nextXp = ANALYSIS_XP[d.level + 1] - ANALYSIS_XP[d.level];
      if (xp >= nextXp && d.level < 25) {
        setItemData(id, itemType, d.level + 1, 0);
        items.forEach(item => { if (item.id === id) item._bp = getBpFromLevel(d.level + 1); });
      } else {
        setItemData(id, itemType, d.level, Math.max(0, xp));
      }
      table.render();
      renderSummary();
      renderDungeonProgress();
    });
  });
}

// ========== Dungeon Completion Display ==========

function getDungeonDrops(dungeon) {
  // Collect all unique monster IDs from all floors
  const monsterIds = new Set();
  if (dungeon.monsters) {
    Object.values(dungeon.monsters).forEach(floorMonsters => {
      if (Array.isArray(floorMonsters)) {
        floorMonsters.forEach(id => monsterIds.add(id));
      }
    });
  }

  // Get all drops from those monsters
  const drops = new Map(); // equipId -> { equip, monsterNames[] }
  monsterIds.forEach(mId => {
    const monster = getMonsterById(mId);
    if (!monster) return;
    [monster.item1, monster.item2].forEach(dropId => {
      if (!dropId) return;
      const equip = getEquipById(dropId);
      if (!equip) return;
      if (!drops.has(dropId)) {
        drops.set(dropId, { equip, monsters: [] });
      }
      const mName = getName(monster);
      if (!drops.get(dropId).monsters.includes(mName)) {
        drops.get(dropId).monsters.push(mName);
      }
    });
  });

  return drops;
}

function isItemCollected(equipId, itemType) {
  const d = getItemData(equipId, itemType);
  return d.level > 0 || d.xp > 0;
}

function renderDungeonProgress() {
  const container = document.getElementById('dungeon-list');
  if (!container) return;

  const searchTerm = (document.getElementById('dungeon-search')?.value || '').toLowerCase();

  let html = '';

  // Story Dungeons
  html += '<div class="dungeon-section-title">Story Dungeons</div>';
  WikiData.dungeons.forEach(d => {
    const dungeonHtml = renderDungeonCard(d, searchTerm);
    if (dungeonHtml) html += dungeonHtml;
  });

  // Random Dungeons - group by name (12 types × 5 variants = 60)
  html += '<div class="dungeon-section-title">Random Dungeons</div>';
  const randomDungeons = WikiData.randomDungeons || generateRandomDungeons();
  // Group by dungeon name
  const grouped = {};
  randomDungeons.forEach(d => {
    if (!grouped[d.nameId]) grouped[d.nameId] = [];
    grouped[d.nameId].push(d);
  });

  Object.entries(grouped).forEach(([name, variants]) => {
    // Use the first variant as representative (they all have the same monster pool across variants)
    // Actually each variant has different starting monsters, so merge all drops
    const mergedDrops = new Map();
    variants.forEach(v => {
      const drops = getDungeonDrops(v);
      drops.forEach((val, key) => {
        if (!mergedDrops.has(key)) mergedDrops.set(key, val);
      });
    });

    const dungeonHtml = renderDungeonCardFromDrops(name, `${variants.length} variants · 24F · 20min/floor`, mergedDrops, searchTerm);
    if (dungeonHtml) html += dungeonHtml;
  });

  container.innerHTML = html;

  // Bind toggle
  container.querySelectorAll('.dungeon-card-header').forEach(header => {
    header.addEventListener('click', () => {
      header.closest('.dungeon-card').classList.toggle('open');
    });
  });
}

function renderDungeonCard(dungeon, searchTerm) {
  const name = getName(dungeon);
  const drops = getDungeonDrops(dungeon);
  const meta = `${dungeon.maxFloor}F · ${dungeon.minutesPerFloor}min/floor`;
  return renderDungeonCardFromDrops(name, meta, drops, searchTerm);
}

function renderDungeonCardFromDrops(name, meta, drops, searchTerm) {
  if (searchTerm && !name.toLowerCase().includes(searchTerm)) return '';

  const dropArr = Array.from(drops.values());
  let collected = 0;
  dropArr.forEach(d => {
    if (isItemCollected(d.equip.id, d.equip.itemType)) collected++;
  });
  const total = dropArr.length;
  const pct = total > 0 ? Math.floor((collected / total) * 100) : 0;
  const compClass = pct === 0 ? 'completion-0' : pct >= 100 ? 'completion-full' : 'completion-partial';

  let dropHtml = '';
  if (total === 0) {
    dropHtml = '<p class="text-muted" style="font-size:0.85rem;">No equipment drops from this dungeon.</p>';
  } else {
    dropHtml = '<div class="drop-grid">';
    dropArr.sort((a, b) => getName(a.equip).localeCompare(getName(b.equip)));
    dropArr.forEach(d => {
      const got = isItemCollected(d.equip.id, d.equip.itemType);
      dropHtml += `
        <div class="drop-item ${got ? 'collected' : ''}">
          <span class="${got ? 'check' : 'unchecked'}">${got ? '✓' : '○'}</span>
          <img src="assets/icons/${d.equip.icon}.png" class="item-icon" style="width:20px;height:20px;" alt="">
          <span>${getName(d.equip)}</span>
        </div>
      `;
    });
    dropHtml += '</div>';
  }

  return `
    <div class="dungeon-card">
      <div class="dungeon-card-header">
        <div style="display:flex;align-items:center;gap:0.75rem;">
          <span class="toggle-icon">▶</span>
          <span class="dungeon-card-title">${name}</span>
        </div>
        <div class="dungeon-card-meta">
          <span>${meta}</span>
          <span class="dungeon-completion ${compClass}">${collected}/${total} (${pct}%)</span>
        </div>
      </div>
      <div class="dungeon-card-body">${dropHtml}</div>
    </div>
  `;
}

// ========== Export / Import / Reset ==========

function exportData() {
  const dataStr = JSON.stringify(itemBook, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'whipper-item-book.json'; a.click();
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
      location.reload();
    } catch (err) { alert('Failed to import: Invalid file format'); }
  };
  reader.readAsText(file);
}

function resetData() {
  if (confirm('Are you sure you want to reset all Item Book data? This cannot be undone.')) {
    itemBook = { weapons: {}, armor: {}, rings: {} };
    saveItemBook();
    location.reload();
  }
}

async function maxItemBook() {
  if (!confirm('Are you sure you want to max all Item Book data? This cannot be undone.')) return;

  try {
    const res = await fetch('data/whipper-full-item-book.json');
    if (!res.ok) throw new Error('Failed to load full item book');

    const fullBook = await res.json();

    itemBook = fullBook;
    saveItemBook();
    location.reload();
  } catch (err) {
    console.error(err);
    alert('Failed to load maxed item book.');
  }
}

// ========== Init ==========

async function initItemBookPage() {
  const data = await loadGameData();
  loadItemBook();

  const weapons = data.equips.filter(e => e.itemType === 1).sort((a, b) => a.id - b.id);
  const armors = data.equips.filter(e => e.itemType === 2).sort((a, b) => a.id - b.id);
  const rings = data.equips.filter(e => e.itemType === 3).sort((a, b) => a.id - b.id);

  buildItemTable('weapons-table', weapons, 1, 'weapon-search', 'weapon-count');
  buildItemTable('armor-table', armors, 2, 'armor-search', 'armor-count');
  buildItemTable('rings-table', rings, 3, 'ring-search', 'ring-count');

  renderSummary();
  renderDungeonProgress();

  // Tab switching
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(btn.dataset.tab).classList.add('active');
    });
  });

  // Dungeon search
  document.getElementById('dungeon-search')?.addEventListener('input', () => renderDungeonProgress());

  // Actions
  document.getElementById('export-btn')?.addEventListener('click', exportData);
  document.getElementById('import-btn')?.addEventListener('click', () => document.getElementById('import-file').click());
  document.getElementById('import-file')?.addEventListener('change', importData);
  document.getElementById('reset-btn')?.addEventListener('click', resetData);
  document.getElementById('max-all-btn')?.addEventListener('click', maxItemBook);
}

document.addEventListener('DOMContentLoaded', initItemBookPage);
