/* Whipper Wiki - Weapons Page */

function injectStatLegend() {
  // Get current page for active state

  const StatLegend = `
    <div>
        <h3>${translate('各項目の説明')}</h3>
        <p class="mt-1 text-muted">HP: ${translate('体力説明')}</p>
        <p class="mt-1 text-muted">STR: ${translate('力説明')}</p>
        <p class="mt-1 text-muted">VIT: ${translate('頑丈さ説明')}</p>
        <p class="mt-1 text-muted">SPD: ${translate('速さ説明')}</p>
        <p class="mt-1 text-muted">LUK: ${translate('運説明')}</p>
        <p class="mt-1 text-muted">Lv1: ${translate('Lv1説明')}</p>
        <p class="mt-1 text-muted">LvUP: ${translate('LvUP説明')}</p>
        <p class="mt-1 text-muted">BOOST: ${translate('Boost説明')}</p>
        
    </div>
  `;

  // Inject stat legend
  const StatLegendEl = document.getElementById('stat-legend');
  if (StatLegendEl) StatLegendEl.innerHTML = StatLegend;
}

async function initWeaponsPage() {
  const data = await loadGameData();
  const weapons = data.equips.filter(e => e.itemType === 1);

  injectStatLegend();
  
  const table = new DataTable('weapons-table', {
    searchFields: ['nameId', 'set', 'equipKind', 'attackKind'],
    renderRow: (item) => {
      const nextItem = item.next ? getEquipById(item.next) : null;
      const setItem = item.set ? findEquipByName(getSetName(item)) : null;
      
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
          <td>${translate(item.attackKind) || '-'}</td>
          <td>${setItem ? `<span class="item-link" onclick="goToItem(${setItem.id}, ${setItem.itemType}, 'weapons')">${getSetName(item)}</span>` : (item.set ? getSetName(item) : '-')}</td>
          <td>${nextItem ? `<span class="item-link" onclick="goToItem(${nextItem.id}, ${nextItem.itemType}, 'weapons')">${getName(nextItem)}</span>` : '-'}</td>
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

document.addEventListener('DOMContentLoaded', initWeaponsPage);
