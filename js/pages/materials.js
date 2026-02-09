/* Whipper Wiki - Materials Page */

async function initMaterialsPage() {
  const data = await loadGameData();
  
  const table = new DataTable('materials-table', {
    searchFields: ['nameId', 'efficacyId'],
    renderRow: (material) => `
      <tr>
        <td><div class="item-cell"><img src="assets/icons/${material.icon}.png" class="item-icon" alt=""><span class="item-name">${getName(material)}</span></div></td>
        <td>${getEfficacy(material)}</td>
      </tr>
    `
  });
  
  table.setData(data.materials);
  table.bindSortHeaders();
  document.getElementById('search-input')?.addEventListener('input', (e) => table.setSearch(e.target.value));
}

document.addEventListener('DOMContentLoaded', initMaterialsPage);
