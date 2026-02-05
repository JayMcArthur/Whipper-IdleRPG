/* Whipper Wiki - Bosses Page */

async function initBossesPage() {
  const data = await loadGameData();
  const container = document.getElementById('bosses-container');
  if (!container) return;
  
  const bosses = data.monsters.filter(m => BOSS_IDS.includes(m.id));
  const bossImages = { 200: 'adam_256', 201: 'pano_256', 202: 'fox_256', 203: 'orochi_256' };
  
  container.innerHTML = bosses.map(boss => {
    const drop1 = boss.item1 ? getCustomById(boss.item1) : null;
    const isJunkyard = JUNKYARD_BOSS_IDS.includes(boss.id);
    const isRoyalTomb = ROYAL_TOMB_BOSS_IDS.includes(boss.id);
    const imgFile = bossImages[boss.id] || null;
    
    return `
      <div class="card boss-card" data-id="${boss.id}">
        ${imgFile ? `<img src="assets/boss/${imgFile}.png" class="boss-image" alt="${getName(boss)}">` : ''}
        <div class="boss-info">
          <h3 class="boss-name">${getName(boss)}</h3>
          <span class="badge badge-boss">${isJunkyard ? 'Junkyard Boss' : isRoyalTomb ? 'Royal Tomb Boss' : 'Story Boss'}</span>
          <div class="boss-stats">
            <div class="boss-stat"><div class="boss-stat-value">${formatNumber(boss.hp)}</div><div class="boss-stat-label">HP</div></div>
            <div class="boss-stat"><div class="boss-stat-value">${formatNumber(boss.atk)}</div><div class="boss-stat-label">ATK</div></div>
            <div class="boss-stat"><div class="boss-stat-value">${formatNumber(boss.def)}</div><div class="boss-stat-label">DEF</div></div>
            <div class="boss-stat"><div class="boss-stat-value">${boss.spd}</div><div class="boss-stat-label">SPD</div></div>
            <div class="boss-stat"><div class="boss-stat-value">${formatNumber(boss.exp)}</div><div class="boss-stat-label">EXP</div></div>
          </div>
          <!--${drop1 ? `<p class="mt-2">Drop: <span class="item-link" onclick="goToItem(${drop1.id}, ${drop1.itemType})">${getName(drop1)}</span> (${boss.prob1}%)</p>` : ''}-->
          ${isJunkyard ? '<p class="text-muted mt-1">Junkyard bosses gain additional effects each time they are defeated.</p>' : ''}
        </div>
      </div>
    `;
  }).join('');
  
  // Highlight from URL
  const id = getUrlParam('id');
  if (id) {
    setTimeout(() => {
      const card = document.querySelector(`.boss-card[data-id="${id}"]`);
      if (card) {
        card.style.boxShadow = '0 0 0 2px var(--accent-gold)';
        card.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 300);
  }
}

document.addEventListener('DOMContentLoaded', initBossesPage);
