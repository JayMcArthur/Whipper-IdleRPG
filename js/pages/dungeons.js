/* Whipper Wiki - Dungeons Page */

async function initDungeonsPage() {
  const data = await loadGameData();

  // Tab switching
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById('tab-' + btn.dataset.tab).classList.add('active');
    });
  });

  // Render story dungeons
  const container = document.getElementById('dungeons-container');
  if (container) {
    container.innerHTML = data.dungeons.map(dungeon => renderDungeonCard(dungeon, data)).join('');
  }
  
  // Render recommended keys
  renderKeysTable(data);
}

function renderDungeonCard(dungeon, data) {
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
            <span>${dungeon.maxFloor} Floors</span>
            <span>${dungeon.minutesPerFloor} min/floor</span>
            <span>Mod Lv ${dungeon.modLv}</span>
          </div>
        </div>
      </div>
      <div class="dungeon-floors">${floors || '<p class="text-muted">No monster data</p>'}</div>
    </div>
  `;
}

function renderKeysTable(data) {
  const keys = data.randomKeys.keys || [];
  // Filter to only show keys that have been filled in
  const filledKeys = keys.filter(k => k.longKey || k.shortKey);

  const keysTable = new DataTable('keys-table', {
    searchFields: ['dungeon', 'longKey', 'shortKey', 'startingMonster', 'monsterProgression', 'notes'],
    renderRow: (key) => {
      return `
        <tr>
          <td class="stat-col">${key.id}</td>
          <td><span class="item-name">${key.dungeon || '<span class="text-muted">-</span>'}</span></td>
          <td><code style="background:var(--bg-surface);padding:0.2rem 0.4rem;border-radius:3px;font-size:0.85rem;">${key.longKey || '-'}</code></td>
          <td><code style="background:var(--bg-surface);padding:0.2rem 0.4rem;border-radius:3px;font-size:0.85rem;">${key.shortKey || '-'}</code></td>
          <td><span class="'monster-link" onclick="goToMonster(${key.startingMonster})">${getName(getMonsterById(key.startingMonster))}</span></td> 
          <td style="font-size:0.8rem;color:var(--text-secondary);white-space:normal;max-width:200px;">${key.monsterProgression || '-'}</td>
          <td class="stat-col">${key.floors}</td>
          <td class="stat-col">${key.hasBoss ? '<span class="text-gold">✓</span>' : '-'}</td>
          <td style="font-size:0.8rem;color:var(--text-secondary);white-space:normal;max-width:150px;">${key.notes || '-'}</td>
        </tr>
      `;
    }
  });

  // If no keys filled in yet, show all as placeholders
  const displayKeys = filledKeys.length > 0 ? filledKeys : keys;

  // Add nameId to each key for DataTable compatibility
  const tableData = displayKeys.map(k => ({ ...k, nameId: k.dungeon || '' }));
  keysTable.setData(tableData);
  keysTable.bindSortHeaders();

  // Search
  document.getElementById('key-search')?.addEventListener('input', (e) => keysTable.setSearch(e.target.value));

  // Dungeon filter
  const dungeonFilter = document.getElementById('filter-dungeon');
  if (dungeonFilter) {
    const dungeonNames = [...new Set(displayKeys.map(k => k.dungeon).filter(Boolean))].sort();
    dungeonFilter.innerHTML = '<option value="">All Dungeons</option>' +
      dungeonNames.map(d => `<option value="${d}">${d}</option>`).join('');
    dungeonFilter.addEventListener('change', (e) => keysTable.setFilter('dungeon', e.target.value));
  }

  // Update count
  const countEl = document.getElementById('key-count');
  if (countEl) countEl.textContent = `${displayKeys.length} of ${keys.length}`;
}

document.addEventListener('DOMContentLoaded', initDungeonsPage);
