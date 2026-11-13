import equipment from '../../../data/equips.json';
import abilities from '../../../data/customs.json';
import enemies from '../../../data/monsters.json';
import locations from '../../../data/dungeons.json';

export const equips = equipment.equips;
export const customs = abilities.customs;
export const monsters = enemies.monsters;
export const dungeons = locations.dungeons;
export type Equipment = typeof equips[number];
export type Custom = typeof customs[number];
export type Monster = typeof monsters[number];
export const equipById = new Map(equips.map(item => [item.id,item]));
export const customById = new Map(customs.map(item => [item.id,item]));
export const monsterById = new Map(monsters.map(item => [item.id,item]));
