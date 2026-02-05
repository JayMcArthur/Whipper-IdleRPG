/* Whipper Wiki - Item Comparison Page */

async function initComparisonPage() {
  const data = await loadGameData();
  
  const allEquips = data.equips.sort((a, b) => {
    if (a.itemType !== b.itemType) return a.itemType - b.itemType;
    return getName(a).localeCompare(getName(b));
  });
  
  const typeLabels = { 1: 'Weapon', 2: 'Armor', 3: 'Ring' };
  const optionsHTML = '<option value="">Select item...</option>' +
    allEquips.map(e => `<option value="${e.id}">[${typeLabels[e.itemType]}] ${getName(e)}</option>`).join('');
  
  for (let i = 1; i <= 3; i++) {
    document.getElementById(`compare-item-${i}`).innerHTML = optionsHTML;
    document.getElementById(`compare-item-${i}`).addEventListener('change', () => updateComparison(data));
  }
}

function updateComparison(data) {
  const items = [];
  for (let i = 1; i <= 3; i++) {
    const id = parseInt(document.getElementById(`compare-item-${i}`).value);
    if (id) {
      const item = data.equips.find(e => e.id === id);
      if (item) items.push({ item, col: i });
    }
  }
  
  // Clear all columns first
  for (let i = 1; i <= 3; i++) {
    document.getElementById(`compare-icon-${i}`).innerHTML = '';
    document.getElementById(`compare-name-${i}`).textContent = '-';
    document.getElementById(`compare-type-${i}`).textContent = '-';
    document.getElementById(`compare-param-${i}`).textContent = '-';
    document.getElementById(`compare-hp-${i}`).textContent = '-';
    document.getElementById(`compare-str-${i}`).textContent = '-';
    document.getElementById(`compare-vit-${i}`).textContent = '-';
    document.getElementById(`compare-maxlv-${i}`).textContent = '-';
    document.getElementById(`compare-set-${i}`).textContent = '-';
    document.getElementById(`compare-special-${i}`).textContent = '-';
  }
  
  // Fill in selected items
  items.forEach(({ item, col }) => {
    const typeLabels = { 1: 'Weapon', 2: 'Armor', 3: 'Ring' };
    document.getElementById(`compare-icon-${col}`).innerHTML = `<img src="assets/icons/${item.icon}.png" class="item-icon-lg">`;
    document.getElementById(`compare-name-${col}`).textContent = getName(item);
    document.getElementById(`compare-type-${col}`).textContent = typeLabels[item.itemType];
    document.getElementById(`compare-param-${col}`).textContent = item.param;
    document.getElementById(`compare-hp-${col}`).innerHTML = formatStat(item.hp, item.lvHp);
    document.getElementById(`compare-str-${col}`).innerHTML = formatStat(item.atk, item.lvAtk);
    document.getElementById(`compare-vit-${col}`).innerHTML = formatStat(item.def, item.lvDef);
    document.getElementById(`compare-maxlv-${col}`).textContent = item.maxLv;
    document.getElementById(`compare-set-${col}`).textContent = getSetName(item);
    
    if (item.itemType === 1) {
      document.getElementById(`compare-special-${col}`).textContent = item.attackKind || '-';
    } else if (item.itemType === 2 || item.itemType === 3) {
      document.getElementById(`compare-special-${col}`).textContent = item.specialized || '-';
    }
  });
}

document.addEventListener('DOMContentLoaded', initComparisonPage);
