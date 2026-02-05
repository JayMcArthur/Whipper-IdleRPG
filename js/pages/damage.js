/* Whipper Wiki - Damage Calculator Page */

async function initDamageCalculatorPage() {
  const data = await loadGameData();
  
  // Populate monster select
  const monsterSelect = document.getElementById('monster-select');
  const monsters = data.monsters.sort((a, b) => getName(a).localeCompare(getName(b)));
  monsterSelect.innerHTML = monsters.map(m => `<option value="${m.id}">${getName(m)} (HP: ${formatNumber(m.hp)})</option>`).join('');
  
  // Populate dungeon select for miasma
  const dungeonSelect = document.getElementById('dungeon-select');
  dungeonSelect.innerHTML = data.dungeons.map(d => `<option value="${d.id}">${getName(d)}</option>`).join('');
  
  document.getElementById('calc-damage-btn').addEventListener('click', () => calculateDamage(data));
  
  // Auto-calculate
  document.querySelectorAll('input, select').forEach(el => {
    el.addEventListener('change', () => calculateDamage(data));
  });
  
  calculateDamage(data);
}

function calculateDamage(data) {
  const monsterId = parseInt(document.getElementById('monster-select').value);
  const dungeonId = parseInt(document.getElementById('dungeon-select').value);
  const miasmaLevel = parseInt(document.getElementById('miasma-level').value) || 1;
  const playerAttack = parseInt(document.getElementById('player-attack').value) || 100;
  const playerDefense = parseInt(document.getElementById('player-defense').value) || 50;
  const playerHP = parseInt(document.getElementById('player-hp').value) || 500;
  
  const monster = data.monsters.find(m => m.id === monsterId);
  if (!monster) return;
  
  // Calculate monster stats with miasma (from Python enitity.py)
  // base_param = (((500 * round(1 + dungeon_id / 4)) + (100 * dungeon_id)) + min(2500 * (miasma_level - 1), 10000))
  const baseParam = ((500 * Math.round(1 + dungeonId / 4)) + (100 * dungeonId)) + Math.min(2500 * (miasmaLevel - 1), 10000);
  const morePercent = (10 + (dungeonId * 2)) * miasmaLevel;
  
  const monsterHP = Math.floor((monster.hp + baseParam) * ((morePercent * 2 + 100) / 100));
  const monsterATK = Math.floor((monster.atk + baseParam) * ((morePercent + 100) / 100));
  const monsterDEF = Math.floor((monster.def + baseParam) * ((morePercent + 100) / 100));
  
  // Simple damage formula: damage = max(1, attack - defense)
  const playerDamage = Math.max(1, playerAttack - monsterDEF);
  const monsterDamage = Math.max(1, monsterATK - playerDefense);
  
  // Turns to kill
  const turnsToKillMonster = Math.ceil(monsterHP / playerDamage);
  const turnsToKillPlayer = Math.ceil(playerHP / monsterDamage);
  
  const canWin = turnsToKillMonster <= turnsToKillPlayer;
  
  // Display results
  document.getElementById('dmg-monster-hp').textContent = formatNumber(monsterHP);
  document.getElementById('dmg-monster-atk').textContent = formatNumber(monsterATK);
  document.getElementById('dmg-monster-def').textContent = formatNumber(monsterDEF);
  document.getElementById('dmg-player-deals').textContent = formatNumber(playerDamage);
  document.getElementById('dmg-monster-deals').textContent = formatNumber(monsterDamage);
  document.getElementById('dmg-turns-kill').textContent = turnsToKillMonster;
  document.getElementById('dmg-turns-die').textContent = turnsToKillPlayer;
  document.getElementById('dmg-result').textContent = canWin ? 'WIN' : 'LOSE';
  document.getElementById('dmg-result').className = canWin ? 'stat-positive' : 'stat-negative';
}

document.addEventListener('DOMContentLoaded', initDamageCalculatorPage);
