/* Whipper Wiki - Analysis Page */

const ANALYSIS_DATA = [
  { level: 1, corrosion: 0, cost: 1, total: 1, weapon: 'See Upgrade Limit', armor: 'See Upgrade Limit', ring: 'See Upgrade Limit' },
  { level: 2, corrosion: 0, cost: 2, total: 3, weapon: 'See Base Stats', armor: 'See Base Stats', ring: 'See Base Stats' },
  { level: 3, corrosion: 0, cost: 4, total: 7, weapon: 'See Evolution', armor: 'See Evolution', ring: 'See Evolution' },
  { level: 4, corrosion: 0, cost: 8, total: 15, weapon: 'See Level up Stats', armor: 'See Level up Stats', ring: 'See Level up Stats' },
  { level: 5, corrosion: 0, cost: 16, total: 31, weapon: '+100 Upgrade Limit', armor: '+100 Upgrade Limit', ring: 'x1.1 Specialization' },
  { level: 6, corrosion: 50, cost: 32, total: 63, weapon: 'x1.3 Attack Boost', armor: 'x1.1 Specialization', ring: 'x1.1 All Stats' },
  { level: 7, corrosion: 100, cost: 40, total: 103, weapon: '+1000 Upgrade Limit', armor: '+1000 Upgrade Limit', ring: 'Unique Effect' },
  { level: 8, corrosion: 150, cost: 48, total: 151, weapon: 'x2 Upgrade Boost', armor: 'x2 Upgrade Boost', ring: 'x1.2 Specialization' },
  { level: 9, corrosion: 200, cost: 56, total: 207, weapon: 'Set > x1.5 STR', armor: 'x1.3 Defense Boost', ring: 'x1.2 All Stats' },
  { level: 10, corrosion: 250, cost: 64, total: 271, weapon: 'x2 Corrosion Boost', armor: 'x2 Corrosion Boost', ring: 'Better Enchants' },
  { level: 11, corrosion: 300, cost: 64, total: 335, weapon: '+2000 Upgrade Limit', armor: '+2000 Upgrade Limit', ring: 'x1.3 Specialization' },
  { level: 12, corrosion: 350, cost: 64, total: 399, weapon: 'x2 Upgrade Boost', armor: 'x2 Upgrade Boost', ring: 'x1.3 All Stats' },
  { level: 13, corrosion: 400, cost: 64, total: 463, weapon: 'Set > x1.5 STR', armor: 'x1.3 HP Boost', ring: 'Unique Effect' },
  { level: 14, corrosion: 450, cost: 64, total: 527, weapon: '+3000 Upgrade Limit', armor: '+3000 Upgrade Limit', ring: 'x1.4 Specialization' },
  { level: 15, corrosion: 500, cost: 64, total: 591, weapon: 'x2 Corrosion Boost', armor: 'x2 Corrosion Boost', ring: 'Better Enchants' },
  { level: 16, corrosion: 600, cost: 128, total: 719, weapon: '+4000 Upgrade Limit', armor: '+4000 Upgrade Limit', ring: 'x1.5 HP Boost' },
  { level: 17, corrosion: 800, cost: 128, total: 847, weapon: '+5000 Upgrade Limit', armor: '+5000 Upgrade Limit', ring: 'x1.1 All Stats' },
  { level: 18, corrosion: 1100, cost: 128, total: 975, weapon: '+6000 Upgrade Limit', armor: '+6000 Upgrade Limit', ring: 'x1.2 All Stats' },
  { level: 19, corrosion: 1500, cost: 128, total: 1103, weapon: '+9900 Upgrade Limit', armor: '+9900 Upgrade Limit', ring: 'x1.3 All Stats' },
  { level: 20, corrosion: 2000, cost: 128, total: 1231, weapon: '+19000 Upgrade Limit', armor: '+19000 Upgrade Limit', ring: 'Better Enchants' },
  { level: 21, corrosion: 2000, cost: 128, total: 1359, weapon: '+10000 Upgrade Limit', armor: '+10000 Upgrade Limit', ring: 'x1.3 HP Boost' },
  { level: 22, corrosion: 2000, cost: 128, total: 1487, weapon: '+10000 Upgrade Limit', armor: '+10000 Upgrade Limit', ring: 'x1.2 All Stats' },
  { level: 23, corrosion: 2000, cost: 128, total: 1615, weapon: '+10000 Upgrade Limit', armor: '+10000 Upgrade Limit', ring: '1.3 VIT Boost' },
  { level: 24, corrosion: 2000, cost: 128, total: 1743, weapon: '+10000 Upgrade Limit', armor: '+10000 Upgrade Limit', ring: 'x1.3 All Stats' },
  { level: 25, corrosion: 2000, cost: 128, total: 1871, weapon: '+10000 Upgrade Limit', armor: '+10000 Upgrade Limit', ring: 'x1.3 STR Boost' }
];

function initAnalysisPage() {
  const table = new DataTable('analysis-table', {
    renderRow: (row) => {
      const isKeyLevel = [10, 15, 20].includes(row.level);
      const rowStyle = isKeyLevel ? 'style="background:rgba(245,166,35,0.08);"' : '';
      return `
        <tr ${rowStyle}>
          <td class="stat-col" style="font-weight:600;${isKeyLevel ? 'color:var(--accent-gold);' : ''}">LVL ${row.level}</td>
          <td class="stat-col">${row.corrosion > 0 ? formatNumber(row.corrosion) : '<span class="stat-zero">-</span>'}</td>
          <td class="stat-col">${row.cost}</td>
          <td class="stat-col">${row.total}</td>
          <td>${row.weapon}</td>
          <td>${row.armor}</td>
          <td>${row.ring}</td>
        </tr>
      `;
    }
  });
  
  // Add nameId for sorting compatibility
  const data = ANALYSIS_DATA.map(d => ({ ...d, nameId: `LVL ${d.level}` }));
  table.setData(data);
  table.bindSortHeaders();
}

document.addEventListener('DOMContentLoaded', initAnalysisPage);
