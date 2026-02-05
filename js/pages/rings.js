/* Whipper Wiki - Rings Page */

async function initRingsPage() {
  const data = await loadGameData();
  const rings = data.equips.filter(e => e.itemType === 3);
  
  const table = new DataTable('rings-table', {
    searchFields: ['nameId', 'specialized'],
    renderRow: (item) => {
      const analysis1 = item.next ? getCustomById(item.next) : null;
      const analysis1Name = analysis1 ? getName(analysis1): '';
      const analysis1Value = analysis1?.value == null
          ? '-'
          : Number(analysis1.value) === 0
              ? ''
              : Number(analysis1.value) > 10
                  ? ` ${analysis1.value}%`
                  : ` ${analysis1.value}x`;
      const analysis1Summary = analysis1 ? getSummary(analysis1) : '';
      const analysis2 = item.ability ? getCustomById(item.ability) : null;
      const analysis2Name = analysis2 ? getName(analysis2) : '-';
      const analysis2Value =analysis2?.value == null
          ? '-'
          : Number(analysis2.value) === 0
              ? ''
              : Number(analysis2.value) > 10
                  ? ` ${analysis2.value}%`
                  : ` ${analysis2.value}x`;
      const analysis2Summary = analysis2 ? getSummary(analysis2) : '';

      return `
        <tr data-id="${item.id}">
          <td>${item.id}</td>
          <td><div class="item-cell"><img src="assets/icons/${item.icon}.png" class="item-icon" alt=""><span class="item-name">${getName(item)}</span></div></td>
          <td class="stat-col">${formatStat(item.hp, item.lvHp)}</td>
          <td class="stat-col">${formatStat(item.atk, item.lvAtk)}</td>
          <td class="stat-col">${formatStat(item.def, item.lvDef)}</td>
          <td>${item.specialized || '-'}</td>
          <td><span class="text-gold">${analysis1Name + analysis1Value }</span>${analysis1Summary ? `<br><span class="text-muted" style="font-size:0.75em">${analysis1Summary}</span>` : ''}</td>
          <td><span class="text-gold">${analysis2Name + analysis2Value}</span>${analysis2Summary ? `<br><span class="text-muted" style="font-size:0.75em">${analysis2Summary}</span>` : ''}</td>
        </tr>
      `;
    }
  });
  
  table.setData(rings);
  table.bindSortHeaders();
  document.getElementById('search-input')?.addEventListener('input', (e) => table.setSearch(e.target.value));

  const specializedFilter = document.getElementById('filter-specialized');
  if (specializedFilter) {
    const kinds = [...new Set(rings.map(r => r.specialized).filter(Boolean))];
    specializedFilter.innerHTML = '<option value="">All Specializations</option>' + kinds.map(k => `<option value="${k}">${k}</option>`).join('');
    specializedFilter.addEventListener('change', (e) => table.setFilter('specialized', e.target.value));
  }

  const analysisFilter = document.getElementById('filter-analysis');
  if (analysisFilter) {
    const ids = [... new Set(rings.flatMap(r => [r.next, r.ability]).filter(Boolean))];
    const options  = ids.map(id => {const c = getCustomById(id); return c ? {id, name: getName(c)} : null;}).filter(Boolean).sort((a, b) => a.name.localeCompare(b.name));
    analysisFilter.innerHTML = '<option value="">All Analysis</option>' + options.map(o => `<option value="${o.id}">${o.name}</option>`).join('');
    analysisFilter.addEventListener('change', (e) => table.setDualFilter('next', e.target.value, 'ability', e.target.value));
  }

  highlightItemFromUrl('rings-table');
}

document.addEventListener('DOMContentLoaded', initRingsPage);
