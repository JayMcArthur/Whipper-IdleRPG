/* Whipper Wiki - Dungeons Page */

async function initDungeonsPage() {
  const data = await loadGameData();
  const container = document.getElementById('dungeons-container');
  const randomContainer = document.getElementById('random-dungeons-container');
  if (!container) return;
  
  // Render regular dungeons
  container.innerHTML = data.dungeons.map(dungeon => renderDungeonCard(dungeon, data)).join('');
  
  // Render random dungeons if container exists
  if (randomContainer) {
    const uniqueRandom = getUniqueRandomDungeons();
    randomContainer.innerHTML = uniqueRandom.map(dungeon => renderRandomDungeonCard(dungeon, data)).join('');
  }
}

function renderDungeonCard(dungeon, data) {
  const floors = Object.entries(dungeon.monsters || {}).map(([floor, monsterIds]) => {
    const monsters = monsterIds.map(id => {
      const monster = getMonsterById(id);
      const name = monster ? getName(monster) : `#${id}`;
      const isBossM = isBoss(id);
      return `<span class="${isBossM ? 'monster-link text-gold' : 'monster-link'}" onclick="goToMonster(${id})">${name}</span>`;
    });
    return `<div class="floor-row"><span class="floor-num">${floor}F</span><div class="floor-monsters">${monsters.join(', ')}</div></div>`;
  }).join('');
  
  return `
    <div class="dungeon-card">
      <div class="dungeon-header">
        <img src="assets/dungeons/${dungeon.id}.png" class="dungeon-image" alt="" onerror="this.style.display='none'">
        <div class="dungeon-title">
          <h3>${getName(dungeon)}</h3>
          <div class="dungeon-meta">
            <span>${dungeon.maxFloor} Floors</span>
            <span>${dungeon.minutesPerFloor} min/floor</span>
            <span>Mod Lv ${dungeon.modLv}</span>
          </div>
        </div>
      </div>
      <div class="dungeon-floors">${floors || '<p class="text-muted">No monster data</p>'}</div>
    </div>
  `;
}

function renderRandomDungeonCard(dungeon, data) {
  // For random dungeons, show a summary instead of all floors
  const sampleFloors = [1, 4, 8, 12, 16, 20, 24];
  const floors = sampleFloors.filter(f => f <= dungeon.maxFloor).map(floor => {
    const monsterIds = dungeon.monsters[floor] || [];
    const monsters = monsterIds.map(id => {
      const monster = getMonsterById(id);
      return monster ? getName(monster) : `#${id}`;
    });
    return `<div class="floor-row"><span class="floor-num">${floor}F</span><div class="floor-monsters">${monsters.join(', ')}</div></div>`;
  }).join('');
  
  return `
    <div class="dungeon-card random-dungeon">
      <div class="dungeon-header">
        <div class="dungeon-title">
          <h3>${dungeon.nameId} <span class="badge badge-random">Random</span></h3>
          <div class="dungeon-meta">
            <span>${dungeon.maxFloor} Floors</span>
            <span>${dungeon.minutesPerFloor} min/floor</span>
            <span>Mod Lv ${dungeon.modLv}</span>
            ${dungeon.boss ? '<span class="text-gold">Has Boss</span>' : ''}
          </div>
        </div>
      </div>
      <details class="dungeon-details">
        <summary>Show Monster Spawns (Sample Floors)</summary>
        <div class="dungeon-floors">${floors}</div>
      </details>
    </div>
  `;
}

document.addEventListener('DOMContentLoaded', initDungeonsPage);
