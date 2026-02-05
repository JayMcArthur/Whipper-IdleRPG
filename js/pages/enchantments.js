/* Whipper Wiki - Enchantments Page (Reworked) */

// Enchantment categories
const SKILL_ENCHANTS = ['先制','二撃','一撃','三途','四葉','五光','六感','七福',
  '斬撃の極意','打撃の極意','刺突の極意','投射の極意','毒','猛毒','孤高','不屈','宝物狩り','水源探知'];
const BOOST_ENCHANTS = ['攻撃力ブースト','守備力ブースト','全能力値ブースト','能力Lvブースト',
  'HPブースト','VITブースト','SPDブースト','LUKブースト','STRブースト','セットブースト','強化ブースト','侵蝕度ブースト'];
const OTHER_ENCHANTS = ['強化上限アップ'];

// High-level stats table data
const HIGH_LEVEL_DATA = [
  { lv: 190, flat: 96500, training: 4700, agility: 18870 },
  { lv: 191, flat: 97500, training: 4780, agility: 19070 },
  { lv: 192, flat: 99000, training: 4900, agility: 19400 },
  { lv: 193, flat: 101000, training: 5100, agility: 20000 },
  { lv: 194, flat: 105000, training: 5400, agility: 20800 },
  { lv: 195, flat: 112000, training: 5800, agility: 22000 },
  { lv: 196, flat: 122000, training: 6500, agility: 24000 },
  { lv: 197, flat: 140000, training: 7500, agility: 27500 },
  { lv: 198, flat: 170000, training: 9000, agility: 32500 },
  { lv: 199, flat: 220000, training: 11000, agility: 40000 },
  { lv: 200, flat: 300000, training: 15000, agility: 50000 }
];

// BP alternatives for skill enchantments
const BP_ALTERNATIVES = {
  '先制': 'First Strike (50 BP) — Always attack first',
  '二撃': 'Double Strike (50 BP) — Chance for 2 attacks',
  '一撃': 'One Strike (50 BP) — 20% crit rate (40% w/ Seven Blessings)',
  '三途': 'Three Paths (50 BP) — 50% chance for x3 crit damage',
  '四葉': 'Four Leaves (50 BP) — 20% chance for double drops',
  '五光': 'Five Lights (50 BP) — Chance for 2x EXP',
  '六感': 'Sixth Sense (50 BP) — Chance to dodge attacks',
  '七福': 'Seven Blessings (50 BP) — Doubles probability-based abilities',
  '斬撃の極意': 'Slashing Mastery — Slashing weapon equipped',
  '打撃の極意': 'Bludgeoning Mastery — Bludgeoning weapon equipped',
  '刺突の極意': 'Piercing Mastery — Piercing weapon equipped',
  '投射の極意': 'Projectile Mastery — Projectile weapon equipped',
  '毒': 'Poison — Apply poison on attack',
  '猛毒': 'Deadly Poison — Apply deadly poison on attack',
  '孤高': 'Solitary — All stats up when no set equipped',
  '不屈': 'Unyielding — Survive at 1 HP',
  '宝物狩り': 'Treasure Hunter (50 BP) — Easier to find chests',
  '水源探知': 'Spring Detection — Easier to find springs'
};

async function initEnchantmentsPage() {
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
  
  // Group customs by nameId
  const enchantGroups = {};
  data.customs.forEach(c => {
    const key = c.nameId;
    if (!enchantGroups[key]) {
      enchantGroups[key] = { nameId: c.nameId, summaryId: c.summaryId, levels: {} };
    }
    enchantGroups[key].levels[c.dispLv] = c.value;
  });
  
  // Categorize
  const statEnchants = [];
  const skillEnchants = [];
  const boostEnchants = [];
  const otherEnchants = [];
  
  Object.values(enchantGroups).forEach(group => {
    const numLevels = Object.keys(group.levels).length;
    const nameId = group.nameId;
    group.maxLv = Math.max(...Object.keys(group.levels).map(Number));
    
    if (SKILL_ENCHANTS.includes(nameId)) {
      skillEnchants.push(group);
    } else if (BOOST_ENCHANTS.includes(nameId)) {
      boostEnchants.push(group);
    } else if (OTHER_ENCHANTS.includes(nameId)) {
      otherEnchants.push(group);
    } else {
      statEnchants.push(group);
    }
  });
  
  // Render stat enchantments table
  renderStatTable(statEnchants);
  renderSkillTable(skillEnchants);
  renderBoostTable(boostEnchants);
  renderOtherTable(otherEnchants);
  renderHighLevelTable();
  
  // Search
  document.getElementById('search-input')?.addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase();
    document.querySelectorAll('.data-table tbody tr').forEach(row => {
      const text = row.textContent.toLowerCase();
      row.style.display = text.includes(term) ? '' : 'none';
    });
  });
}

function renderStatTable(groups) {
  const tbody = document.querySelector('#stat-enchant-table tbody');
  if (!tbody) return;
  
  const sampleLevels = [1, 10, 50, 100, 150, 190, 195, 200];
  
  groups.sort((a, b) => getName({nameId: a.nameId}).localeCompare(getName({nameId: b.nameId})));
  
  tbody.innerHTML = groups.map(group => {
    const name = translate(group.nameId) || group.nameId;
    const effect = translate(group.summaryId) || group.summaryId || '';
    
    return `<tr>
      <td><span class="item-name">${name}</span></td>
      <td style="color:var(--text-secondary);font-size:0.8rem;white-space:normal;max-width:200px;">${effect}</td>
      <td class="stat-col">${group.maxLv}</td>
      ${sampleLevels.map(l => {
        const val = group.levels[l];
        return `<td class="stat-col">${val !== undefined ? formatNumber(val) : '<span class="stat-zero">-</span>'}</td>`;
      }).join('')}
    </tr>`;
  }).join('');
}

function renderSkillTable(groups) {
  const tbody = document.querySelector('#skill-enchant-table tbody');
  if (!tbody) return;
  
  groups.sort((a, b) => getName({nameId: a.nameId}).localeCompare(getName({nameId: b.nameId})));
  
  tbody.innerHTML = groups.map(group => {
    const name = translate(group.nameId) || group.nameId;
    const effect = translate(group.summaryId) || group.summaryId || '';
    const val = Object.values(group.levels)[0];
    const bpAlt = BP_ALTERNATIVES[group.nameId] || '-';
    
    return `<tr>
      <td><span class="item-name">${name}</span></td>
      <td style="color:var(--text-secondary);font-size:0.85rem;white-space:normal;">${effect}</td>
      <td class="stat-col">${val !== undefined ? formatNumber(val) : '-'}</td>
      <td style="font-size:0.8rem;color:var(--text-secondary);white-space:normal;">${bpAlt}</td>
    </tr>`;
  }).join('');
}

function renderBoostTable(groups) {
  const tbody = document.querySelector('#boost-enchant-table tbody');
  if (!tbody) return;
  
  groups.sort((a, b) => getName({nameId: a.nameId}).localeCompare(getName({nameId: b.nameId})));
  
  tbody.innerHTML = groups.map(group => {
    const name = translate(group.nameId) || group.nameId;
    const effect = translate(group.summaryId) || group.summaryId || '';
    const sortedLevels = Object.entries(group.levels).sort((a, b) => Number(a[0]) - Number(b[0]));
    const valuesStr = sortedLevels.map(([lv, val]) => `Lv${lv}: ${val}`).join(', ');
    
    return `<tr>
      <td><span class="item-name">${name}</span></td>
      <td style="color:var(--text-secondary);font-size:0.85rem;white-space:normal;">${effect}</td>
      <td class="stat-col">${group.maxLv}</td>
      <td style="font-size:0.8rem;white-space:normal;">${valuesStr}</td>
    </tr>`;
  }).join('');
}

function renderOtherTable(groups) {
  const tbody = document.querySelector('#other-enchant-table tbody');
  if (!tbody) return;
  
  groups.sort((a, b) => getName({nameId: a.nameId}).localeCompare(getName({nameId: b.nameId})));
  
  tbody.innerHTML = groups.map(group => {
    const name = translate(group.nameId) || group.nameId;
    const effect = translate(group.summaryId) || group.summaryId || '';
    const sortedLevels = Object.entries(group.levels).sort((a, b) => Number(a[0]) - Number(b[0]));
    const valuesStr = sortedLevels.map(([lv, val]) => `Lv${lv}: ${formatNumber(val)}`).join(', ');
    
    return `<tr>
      <td><span class="item-name">${name}</span></td>
      <td style="color:var(--text-secondary);font-size:0.85rem;white-space:normal;">${effect}</td>
      <td class="stat-col">${group.maxLv}</td>
      <td style="font-size:0.8rem;white-space:normal;">${valuesStr}</td>
    </tr>`;
  }).join('');
}

function renderHighLevelTable() {
  const tbody = document.querySelector('#highlevel-table tbody');
  if (!tbody) return;
  
  tbody.innerHTML = HIGH_LEVEL_DATA.map(row => `
    <tr>
      <td style="font-weight:600;">Lv${row.lv}</td>
      <td class="stat-col">${formatNumber(row.flat)}</td>
      <td class="stat-col">${formatNumber(row.training)}</td>
      <td class="stat-col">${formatNumber(row.agility)}</td>
    </tr>
  `).join('');
}

document.addEventListener('DOMContentLoaded', initEnchantmentsPage);
