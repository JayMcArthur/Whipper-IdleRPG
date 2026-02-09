/* Whipper Wiki - Armor Page */

async function initArmorPage() {
  const data = await loadGameData();
  const armor = data.equips.filter(e => e.itemType === 2);
  
  const table = new DataTable('armor-table', {
    searchFields: ['nameId', 'equipKind', 'specialized'],
    renderRow: (item) => {
      const nextItem = item.next ? getEquipById(item.next) : null;
      return `
        <tr data-id="${item.id}">
          <td>${item.id}</td>
          <td><div class="item-cell"><img src="assets/icons/${item.icon}.png" class="item-icon" alt=""><span class="item-name">${getName(item)}</span></div></td>
          <td class="stat-col">${item.param}</td>
          <td class="stat-col">${formatStat(item.hp, item.lvHp)}</td>
          <td class="stat-col">${formatStat(item.atk, item.lvAtk)}</td>
          <td class="stat-col">${formatStat(item.def, item.lvDef)}</td>
          <td class="stat-col">${item.maxLv}</td>
          <td><span class="badge">${item.equipKind || '-'}</span></td>
          <td>${item.specialized || '-'}</td>
          <td>${nextItem ? `<span class="item-link" onclick="goToItem(${nextItem.id}, ${nextItem.itemType}, 'armor')">${getName(nextItem)}</span>` : '-'}</td>
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

  const specializedFilter = document.getElementById('filter-specialized');
  if (specializedFilter) {
    const kinds = [...new Set(armor.map(a => a.specialized).filter(Boolean))];
    specializedFilter.innerHTML = '<option value="">All Specializations</option>' + kinds.map(k => `<option value="${k}">${k}</option>`).join('');
    specializedFilter.addEventListener('change', (e) => table.setFilter('specialized', e.target.value));
  }
  
  highlightItemFromUrl('armor-table');
}

document.addEventListener('DOMContentLoaded', initArmorPage);
