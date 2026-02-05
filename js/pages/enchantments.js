/* Whipper Wiki - Enchantments Page */

async function initEnchantmentsPage() {
  const data = await loadGameData();
  const container = document.getElementById('enchantments-container');
  if (!container) return;
  
  // Group customs by nameId
  const enchantGroups = {};
  data.customs.forEach(c => {
    const key = c.nameId;
    if (!enchantGroups[key]) {
      enchantGroups[key] = {
        nameId: c.nameId,
        summaryId: c.summaryId,
        levels: {}
      };
    }
    enchantGroups[key].levels[c.dispLv] = c.value;
  });
  
  // Build levels array 1-100
  const levelCols = [];
  for (let i = 1; i <= 100; i++) levelCols.push(i);
  
  // Build table
  let html = `
    <div class="table-container" style="max-height: 80vh;">
      <table class="enchant-table">
        <thead>
          <tr>
            <th style="position: sticky; left: 0; z-index: 20; background: var(--accent-teal);">Name</th>
            <th style="min-width: 200px;">Effect</th>
            ${levelCols.map(l => `<th>Lv${l}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
  `;
  
  // Sort by translated name
  const sortedGroups = Object.values(enchantGroups).sort((a, b) => {
    return getName({nameId: a.nameId}).localeCompare(getName({nameId: b.nameId}));
  });
  
  sortedGroups.forEach(group => {
    const name = translate(group.nameId) || group.nameId;
    const effect = translate(group.summaryId) || group.summaryId || '';
    
    html += `<tr>
      <td class="enchant-name" style="position: sticky; left: 0; background: var(--bg-card); z-index: 5;">${name}</td>
      <td class="enchant-effect">${effect}</td>
      ${levelCols.map(l => {
        const val = group.levels[l];
        return `<td>${val !== undefined ? formatNumber(val) : '0'}</td>`;
      }).join('')}
    </tr>`;
  });
  
  html += '</tbody></table></div>';
  container.innerHTML = html;
}

document.addEventListener('DOMContentLoaded', initEnchantmentsPage);
