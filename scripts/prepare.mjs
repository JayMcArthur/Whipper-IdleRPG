import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { base } from '../src/lib/site.ts';

const output = new URL('../agent-output/public/', import.meta.url);
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
for (const directory of ['assets', 'data']) {
  await cp(new URL(`../${directory}/`, import.meta.url), new URL(`${directory}/`, output), { recursive: true });
}

const aliases = {
  weapons: 'weapons', armor: 'armor', rings: 'rings', monsters: 'monsters', bosses: 'bosses', dungeons: 'dungeons',
  enchantments: 'enchantments', materials: 'materials', analysis: 'analysis',
  'guide-builds': 'guides/equipment', 'guide-items': 'guides/equipment', 'guide-stats': 'guides/stats', 'guide-story': 'guides/progression', whatsnew: 'coverage',
};
const codes = { en: 'en', ja: 'ja', zh_CN: 'zh-cn', ko: 'ko', zh_TW: 'zh-tw', es: 'es', th: 'th', pt: 'pt', de: 'de', fr: 'fr' };
const records = JSON.parse(await readFile(new URL('../data/customs.json', import.meta.url), 'utf8')).customs;
const groupIds = new Map();
for (const record of records) if (!groupIds.has(record.nameId)) groupIds.set(record.nameId, record.id);
const enchantIds = Object.fromEntries(records.map(record => [record.id, groupIds.get(record.nameId)]));
const monsterRecords = JSON.parse(await readFile(new URL('../data/monsters.json', import.meta.url), 'utf8')).monsters;
const bossIds = [100,109,129,130,131,133,134,200,201,202,203];
const monsterPaths = Object.fromEntries(monsterRecords.map(record => [record.id, `${bossIds.includes(record.id) ? 'bosses' : 'monsters'}/${record.id}`]));
for (const [old, target] of Object.entries(aliases)) {
  const fallback = `${base}/en/${target}/`;
  const detail = ['weapons','armor','rings','monsters','bosses','dungeons','enchantments','materials'].includes(old);
  const script = `const languages=${JSON.stringify(codes)};let locale='en';try{locale=languages[localStorage.getItem('wiki-lang')]||'en'}catch{};const query=new URLSearchParams(location.search);const id=query.get('id');let path=${JSON.stringify(target)};if(${detail}&&id&&/^\\d+$/.test(id)){const groups=${old === 'enchantments' ? JSON.stringify(enchantIds) : '{}'};const monsters=${['monsters','bosses'].includes(old) ? JSON.stringify(monsterPaths) : '{}'};path=monsters[id]||path+'/'+(groups[id]||id)}location.replace(${JSON.stringify(base)}+'/'+locale+'/'+path+'/'+location.hash);`;
  await writeFile(new URL(`${old}.html`, output), `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Whipper Wiki</title><link rel="canonical" href="https://jaymcarthur.github.io${fallback}"><noscript><meta http-equiv="refresh" content="0;url=${fallback}"></noscript></head><body><p><a href="${fallback}">Continue to the Whipper Wiki</a></p><script>${script}</script></body></html>`);
}
const toolTabs = { 'build-maker':'build', 'fight-sim':'dungeon', compare:'items', damage:'dungeon', 'item-book':'book' };
for (const [old,tab] of Object.entries(toolTabs)) {
  const fallback = `${base}/en/tools/#${tab}`;
  const script = `const languages=${JSON.stringify(codes)};let locale='en';try{locale=languages[localStorage.getItem('wiki-lang')]||'en'}catch{}location.replace(${JSON.stringify(base)}+'/'+locale+'/tools/'+location.search+'#${tab}');`;
  await writeFile(new URL(`${old}.html`,output),`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Whipper Build Lab</title><link rel="canonical" href="https://jaymcarthur.github.io${fallback}"><noscript><meta http-equiv="refresh" content="0;url=${fallback}"></noscript></head><body><p><a href="${fallback}">Open the Whipper Build Lab</a></p><script>${script}</script></body></html>`);
}
await writeFile(new URL('.nojekyll', output), '');
await writeFile(new URL('robots.txt', output), 'User-agent: *\nAllow: /\nSitemap: https://jaymcarthur.github.io/Whipper-IdleRPG/sitemap.xml\n');
console.log('Prepared public assets and existing wiki/tool entry redirects.');
