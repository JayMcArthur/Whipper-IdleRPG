/* Whipper Wiki - Monsters Page */

async function initMonstersPage() {
  const data = await loadGameData();
  const monsters = data.monsters;
  
  const table = new DataTable('monsters-table', {
    searchFields: ['nameId', 'item1', 'item2'],
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

  const dropsFilter = document.getElementById('filter-drops');
  if (dropsFilter) {
    const ids = [... new Set(monsters.flatMap(m => [m.item1, m.item2]).filter(Boolean))];
    const options  = ids.map(id => {const c = getEquipById(id); return c ? {id, name: getName(c)} : null;}).filter(Boolean).sort((a, b) => a.name.localeCompare(b.name));
    dropsFilter.innerHTML = '<option value="">All Drops</option>' + options.map(o => `<option value="${o.id}">${o.name}</option>`).join('');
    dropsFilter.addEventListener('change', (e) => table.setDualFilter('item1', e.target.value, 'item2', e.target.value));
  }

  highlightItemFromUrl('monsters-table');
}

document.addEventListener('DOMContentLoaded', initMonstersPage);
