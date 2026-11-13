import { readFile, readdir, stat } from 'node:fs/promises';
import { resolve, relative } from 'node:path';
import assert from 'node:assert/strict';
import { base, localeCodes } from '../src/lib/site.ts';

const root = resolve('agent-output/dist');
const publicDirectories = new Set(['_astro','assets','data',...localeCodes]);
const rootFiles = new Set(['index.html','404.html','sitemap.xml','robots.txt','.nojekyll', ...['weapons','armor','rings','monsters','bosses','dungeons','enchantments','materials','analysis','guide-builds','guide-items','guide-stats','guide-story','whatsnew','build-maker','fight-sim','item-book','compare','damage'].map(name => `${name}.html`)]);
async function files(directory) {
  const result = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = resolve(directory, entry.name);
    result.push(...(entry.isDirectory() ? await files(path) : [path]));
  }
  return result;
}
const paths = await files(root);
const all = new Set(paths);
const errors = [];
let pages = 0;
for (const path of paths) {
  const name = relative(root, path).replaceAll('\\','/');
  assert(name.includes('/') ? publicDirectories.has(name.split('/')[0]) : rootFiles.has(name), `File outside publication allowlist: ${name}`);
  assert(!/(^|\/)(old|Python Scripts|node_modules|\.git|private-app)(\/|$)|\.(apk|sav|zip|map|dart|hive)$/.test(name), `Private/source artifact in output: ${name}`);
  if (/\.(html|js|json|csv|css)$/.test(name)) assert(!/backupKey|HiveAesCipher|SecretKey\(/.test(await readFile(path,'utf8')), `Private processor material in ${name}`);
  if (!name.endsWith('.html')) continue;
  pages++;
  const html = await readFile(path, 'utf8');
  for (const match of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
    const address = match[1].replaceAll('&amp;','&');
    if (/^(?:https?:|data:|mailto:|#|javascript:)/.test(address)) continue;
    const url = new URL(address, `https://wiki.invalid${base}/${name}`);
    if (!url.pathname.startsWith(`${base}/`)) { errors.push(`${name}: outside project base: ${address}`); continue; }
    let target;
    try { target = decodeURIComponent(url.pathname.slice(base.length + 1)); } catch { errors.push(`${name}: malformed URL ${address}`); continue; }
    const full = resolve(root, target);
    if (!all.has(full) && !all.has(resolve(full, 'index.html'))) errors.push(`${name}: missing ${target}`);
  }
}
assert.equal(errors.length, 0, errors.slice(0,30).join('\n') + `\n${errors.length} broken references`);
const size = (await Promise.all(paths.map(path => stat(path)))).reduce((total, info) => total + info.size, 0);
console.log(`Verified ${pages} HTML pages, project-base links/assets and public artifact allowlist (${(size/1024/1024).toFixed(1)} MiB).`);
