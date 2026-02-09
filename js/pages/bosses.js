/* Whipper Wiki - Bosses Page (Reworked) */

// Junkyard boss special data
const JUNKYARD_BOSS_DATA = {
  200: { // Adam
    attackType: 'Slashing / Bludgeoning',
    dropItem: 'Apple (+1 Luck, 20 max)',
    proofName: "Adam's Heart",
    proofIcon: 'adamheart',
    proofEffect: '+20 max BP in permanent boosts per level',
    phases: [
      { hpThreshold: '100%', effects: ['30% chance to attack'] },
      { hpThreshold: '70%', effects: ['50% chance to attack', 'Nullifies Piercing and Projectile weapon types'] },
      { hpThreshold: '40%', effects: ['Lowers player level to 1', 'Counters critical hits — takes no crit damage and instead hits you with an undodgeable crit'] }
    ],
    recommendations: [
      'Use flat stat enchantments over training if you can kill in 1 combat. Use training to get to 40%, then switch to flat.',
      'Use crits in the first half, but switch away below 40% HP. Put BP into slashing damage, dodge rate, or consecutive attack chance instead.',
      'Kill Lv1 Adam 20 times for apples to boost base luck stat. Should be easy by M5.'
    ]
  },
  201: { // Panoptes
    attackType: 'Projectile',
    dropItem: 'Aegis (Shield No. 53)',
    proofName: "Panoptes' Eye",
    proofIcon: 'panopteseye',
    proofEffect: '+1 max analysis level per level',
    phases: [
      { hpThreshold: '100%', effects: ['Immune to preemptive strikes'] },
      { hpThreshold: '70%', effects: ['15% dodge rate'] },
      { hpThreshold: '40%', effects: ['30% dodge rate'] }
    ],
    recommendations: [
      'Do not use First Strike — Panoptes is immune.',
      'Put BP into Projectile damage.',
      'Crits are reliable additional damage. Use crit rate/damage BP.',
      'Dodge rate and consecutive attack probability are helpful.',
      'Panoptes does not reduce player to Lv1, so training enchants are better than flat enchants.'
    ]
  },
  202: { // Nine-Tails
    attackType: 'Piercing',
    dropItem: 'Foxfire (Ring No. 24)',
    proofName: "Killing Stone",
    proofIcon: 'sesshoseki',
    proofEffect: '+500-1000 max corrosion per level',
    phases: [
      { hpThreshold: '100%', effects: ['Inflicts poison — 1 stack per turn end + 1 stack per hit', 'Poison: 1% max HP per stack'] },
      { hpThreshold: '70%', effects: ['Poison: 2% max HP per stack (new stacks only)'] },
      { hpThreshold: '40%', effects: ['Poison: 3% max HP per stack (new stacks only)'] }
    ],
    recommendations: [
      'Finish the fight quickly — poison stacks indefinitely.',
      'First Strike is optional but helpful. Fox SPD is relatively low so high agility may suffice at lower levels.',
      'Put BP into Piercing damage.',
      'Crits are reliable. Dodge rate and consecutive attack help.',
      'Fox does not reduce player to Lv1, so training enchants are better than flat enchants.',
      'Existing stacks do not upgrade when Fox drops below HP thresholds.'
    ]
  },
  203: { // Yamata no Orochi
    attackType: 'Any',
    dropItem: 'Murakumo (Weapon No. 91)',
    proofName: "Magatama",
    proofIcon: 'magatama',
    proofEffect: 'Increases rate of legendary equipment',
    phases: [
      { hpThreshold: 'Magatama', effects: [
        'Upon receiving 2 heart attacks (crits), the Magatama shatters dealing 16% of max HP. It then regenerates.',
        'Magatama shattering can only bring Orochi to 1 HP — you must deal the finishing blow.',
        'Shattering resets all applied poison stacks.'
      ]},
      { hpThreshold: 'Healing', effects: [
        'Upon successfully hitting the adventurer, heals 10% of max HP (20% on crit).',
        'Healing also decreases poison stacks.'
      ]},
      { hpThreshold: 'Poison', effects: [
        'Upon being poisoned, cuts off the poisoned head.',
        'At 1 remaining head, takes full poison damage.'
      ]},
      { hpThreshold: 'Intimidate', effects: [
        'Can intimidate you, reducing evasion rate to 1/3.',
        'Example: 80% → 26% → 8%'
      ]}
    ],
    recommendations: [
      'Two routes: Crit build (high crit rate to shatter Magatama repeatedly) or Poison build (low crit rate to avoid shattering).',
      'Consecutive strike chance is important for both routes.',
      'First Strike helps get a free hit in.',
      'Dodge rate is greatly reduced by intimidation, so may not be worth investing in Sixth Sense directly.'
    ]
  }
};

async function initBossesPage() {
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
  
  // Render each section
  renderBossSection('story-bosses', STORY_BOSS_IDS, data, false);
  renderBossSection('tomb-bosses', ROYAL_TOMB_BOSS_IDS, data, false);
  renderBossSection('junkyard-bosses', JUNKYARD_BOSS_IDS, data, true);
  
  // Handle URL param to auto-switch tab
  const id = getUrlParam('id');
  if (id) {
    const numId = parseInt(id);
    let tabName = 'junkyard';
    if (STORY_BOSS_IDS.includes(numId)) tabName = 'story';
    else if (ROYAL_TOMB_BOSS_IDS.includes(numId)) tabName = 'tomb';
    
    // Switch to correct tab
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    const tabBtn = document.querySelector(`.tab-btn[data-tab="${tabName}"]`);
    if (tabBtn) tabBtn.classList.add('active');
    const tabContent = document.getElementById('tab-' + tabName);
    if (tabContent) tabContent.classList.add('active');
    
    setTimeout(() => {
      const card = document.querySelector(`.boss-card[data-id="${id}"]`);
      if (card) {
        card.style.boxShadow = '0 0 0 2px var(--accent-gold)';
        card.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 300);
  }
}

function renderBossSection(containerId, bossIds, data, isJunkyard) {
  const container = document.getElementById(containerId);
  if (!container) return;
  
  const bosses = data.monsters.filter(m => bossIds.includes(m.id));
  const bossImages = { 200: 'adam_256', 201: 'pano_256', 202: 'fox_256', 203: 'orochi_256' };
  
  container.innerHTML = bosses.map(boss => {
    const imgFile = bossImages[boss.id] || null;
    const jData = JUNKYARD_BOSS_DATA[boss.id];
    
    // Get equipment drop
    const drop1 = boss.item1 ? getEquipById(boss.item1) : null;
    
    let html = `<div class="card boss-card" data-id="${boss.id}" style="grid-column: 1 / -1;">`;
    
    // Header with image
    html += `<div style="display:flex;gap:1.5rem;align-items:flex-start;flex-wrap:wrap;">`;
    if (imgFile) {
      html += `<img src="assets/boss/${imgFile}.png" class="boss-image" alt="${getName(boss)}">`;
    }
    html += `<div style="flex:1;min-width:250px;">`;
    html += `<h3 class="boss-name">${getName(boss)}</h3>`;
    
    if (jData) {
      html += `<div style="display:flex;gap:0.75rem;flex-wrap:wrap;margin:0.5rem 0;">`;
      html += `<span class="badge badge-boss">Junkyard Boss</span>`;
      html += `<span class="badge" style="background:rgba(32,178,170,0.2);color:var(--accent-teal);">${jData.attackType}</span>`;
      html += `</div>`;
    } else {
      const locLabel = ROYAL_TOMB_BOSS_IDS.includes(boss.id) ? 'Royal Tomb' : 'Story Boss';
      html += `<span class="badge badge-boss">${locLabel}</span>`;
    }
    
    // Base stats (Lv1 for junkyard)
    html += `<div class="boss-stats" style="margin-top:0.75rem;">`;
    html += `<div class="boss-stat"><div class="boss-stat-value">${formatNumber(boss.hp)}</div><div class="boss-stat-label">HP</div></div>`;
    html += `<div class="boss-stat"><div class="boss-stat-value">${formatNumber(boss.atk)}</div><div class="boss-stat-label">ATK</div></div>`;
    html += `<div class="boss-stat"><div class="boss-stat-value">${formatNumber(boss.def)}</div><div class="boss-stat-label">DEF</div></div>`;
    html += `<div class="boss-stat"><div class="boss-stat-value">${boss.spd}</div><div class="boss-stat-label">SPD</div></div>`;
    html += `<div class="boss-stat"><div class="boss-stat-value">${formatNumber(boss.exp)}</div><div class="boss-stat-label">EXP</div></div>`;
    html += `</div>`;
    if (isJunkyard) html += `<p class="text-muted" style="font-size:0.8rem;margin-top:0.25rem;">Stats shown are for Lv1. Stats scale with boss level.</p>`;
    
    html += `</div></div>`; // close flex header
    
    // Junkyard-specific: phases, drops, proof, recommendations
    if (jData) {
      // Drops section
      html += `<div style="margin-top:1.25rem;display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:1rem;">`;
      
      // Drop
      html += `<div style="background:var(--bg-surface);padding:1rem;border-radius:var(--radius-md);">`;
      html += `<h4 style="font-family:'DM Sans',sans-serif;font-size:0.85rem;color:var(--accent-gold);margin-bottom:0.5rem;">Drop</h4>`;
      html += `<p style="font-size:0.9rem;">${jData.dropItem}</p>`;
      html += `</div>`;
      
      // Proof of Subjugation
      html += `<div style="background:var(--bg-surface);padding:1rem;border-radius:var(--radius-md);">`;
      html += `<h4 style="font-family:'DM Sans',sans-serif;font-size:0.85rem;color:var(--accent-gold);margin-bottom:0.5rem;">Proof of Subjugation</h4>`;
      html += `<div style="display:flex;align-items:center;gap:0.75rem;">`;
      html += `<img src="assets/icons/${jData.proofIcon}.png" class="item-icon" style="width:32px;height:32px;" alt="">`;
      html += `<div><p style="font-weight:600;font-size:0.9rem;">${jData.proofName}</p><p style="font-size:0.8rem;color:var(--text-secondary);">${jData.proofEffect}</p></div>`;
      html += `</div></div>`;
      
      html += `</div>`;
      
      // Phases
      html += `<div style="margin-top:1rem;">`;
      html += `<h4 style="font-family:'DM Sans',sans-serif;font-size:0.95rem;color:var(--text-primary);margin-bottom:0.75rem;">Phases & Special Effects</h4>`;
      html += `<div style="display:flex;flex-direction:column;gap:0.5rem;">`;
      jData.phases.forEach(phase => {
        html += `<div style="background:var(--bg-surface);padding:0.75rem 1rem;border-radius:var(--radius-md);border-left:3px solid var(--accent-gold);">`;
        html += `<div style="font-weight:600;font-size:0.85rem;color:var(--accent-gold);margin-bottom:0.25rem;">${phase.hpThreshold}</div>`;
        phase.effects.forEach(e => {
          html += `<p style="font-size:0.85rem;color:var(--text-secondary);margin:0.15rem 0;">• ${e}</p>`;
        });
        html += `</div>`;
      });
      html += `</div></div>`;
      
      // Recommendations
      html += `<div style="margin-top:1rem;">`;
      html += `<h4 style="font-family:'DM Sans',sans-serif;font-size:0.95rem;color:var(--text-primary);margin-bottom:0.5rem;">Recommendations</h4>`;
      jData.recommendations.forEach(r => {
        html += `<p style="font-size:0.85rem;color:var(--text-secondary);margin:0.35rem 0;padding-left:0.75rem;border-left:2px solid var(--border-accent);">${r}</p>`;
      });
      html += `</div>`;
    } else {
      // Non-junkyard: just show drops if available
      if (drop1) {
        html += `<div style="margin-top:1rem;">`;
        html += `<p class="mt-1">Drop: <span class="item-link" onclick="goToItem(${drop1.id}, ${drop1.itemType})">${getName(drop1)}</span> <span class="text-muted">(${boss.prob1}%)</span></p>`;
        html += `</div>`;
      }
    }
    
    html += `</div>`; // close card
    return html;
  }).join('');
}

document.addEventListener('DOMContentLoaded', initBossesPage);
