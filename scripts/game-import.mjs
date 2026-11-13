import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, writeFile, mkdir, access } from 'node:fs/promises';
import { resolve, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'csv-parse/sync';

// These are the public table columns, not a dump of arbitrary app storage.
const schemas = {
  equips: { numbers: 'id itemType param hp atk def lvHp lvAtk lvDef maxLv next ability', strings: 'nameId icon equipKind attackKind set specialized' },
  customs: { numbers: 'id modLv dispLv value nextModId', strings: 'nameId summaryId' },
  monsters: { numbers: 'id hp atk def spd exp item1 prob1 item2 prob2', strings: 'nameId' },
  materials: { numbers: 'id use', strings: 'nameId icon efficacyId' },
  dungeons: { numbers: 'id maxFloor minutesPerFloor modLv condition', strings: 'nameId', objects: 'monsters' },
};
const hash = value => createHash('sha256').update(value).digest('hex');
const exists = async path => access(path).then(() => true, () => false);

export function parseTable(name, text, format) {
  const schema = schemas[name];
  assert(schema, `Unknown public table ${name}`);
  const numbers = schema.numbers.split(' ');
  const strings = schema.strings.split(' ');
  const objects = schema.objects?.split(' ') || [];
  let records;
  if (format === 'csv') {
    records = parse(text, { columns: headers => {
      assert.equal(new Set(headers).size, headers.length, `${name}: duplicate CSV column`);
      return headers;
    }, bom: true, skip_empty_lines: true });
    for (const record of records) {
      for (const key of numbers) {
        assert(String(record[key] ?? '').trim() !== '', `${name}: missing numeric ${key}`);
        record[key] = Number(record[key]);
      }
      for (const key of objects) record[key] = JSON.parse(record[key]);
    }
  } else records = JSON.parse(text)[name];
  assert(Array.isArray(records) && records.length, `${name}: expected a nonempty ${name} table`);
  const ids = new Set();
  const allowed = new Set([...numbers, ...strings, ...objects]);
  for (const record of records) {
    assert(record && typeof record === 'object', `${name}: expected records`);
    for (const key of Object.keys(record)) assert(allowed.has(key), `${name}: new column ${key} needs a public-table contract review`);
    for (const key of numbers) assert(Number.isSafeInteger(record[key]), `${name} #${record.id}: ${key} must be a safe integer`);
    for (const key of strings) assert.equal(typeof record[key], 'string', `${name} #${record.id}: missing string ${key}`);
    assert(record.id > 0 && !ids.has(record.id), `${name}: invalid or duplicate ID ${record.id}`);
    assert(record.nameId.trim(), `${name} #${record.id}: empty nameId`);
    if ('icon' in record) assert(/^[\w-]+$/.test(record.icon), `${name} #${record.id}: invalid icon name`);
    if (name === 'equips') assert([1,2,3].includes(record.itemType), `equips #${record.id}: unsupported equipment type`);
    if (name === 'dungeons') {
      assert(record.monsters && typeof record.monsters === 'object' && !Array.isArray(record.monsters), `dungeons #${record.id}: invalid encounter map`);
      for (const [floor, monsters] of Object.entries(record.monsters)) {
        assert(/^\d+$/.test(floor) && Array.isArray(monsters) && monsters.every(Number.isSafeInteger), `dungeons #${record.id}: invalid floor ${floor}`);
      }
    }
    ids.add(record.id);
  }
  return records;
}

export function validateLinks(tables) {
  const warnings = [];
  const sets = Object.fromEntries(Object.entries(tables).map(([name, rows]) => [name, new Set(rows.map(row => row.id))]));
  const names = new Set(tables.equips.map(item => item.nameId));
  for (const item of tables.equips) {
    assert(!item.ability || sets.customs.has(item.ability), `equips #${item.id}: missing ability ${item.ability}`);
    assert(!item.next || (item.itemType === 3 ? sets.customs : sets.equips).has(item.next), `equips #${item.id}: missing next ${item.next}`);
    assert(!item.set || names.has(item.set), `equips #${item.id}: missing set partner ${item.set}`);
  }
  const lastLevels = new Map();
  for (const item of tables.customs) lastLevels.set(item.nameId, Math.max(lastLevels.get(item.nameId) || 0,item.dispLv));
  for (const item of tables.customs) if (item.nextModId > 0 && !sets.customs.has(item.nextModId)) {
    // Game exports can point past the final recorded level; this is not a usable link.
    assert.equal(item.dispLv,lastLevels.get(item.nameId), `customs #${item.id}: missing intermediate level ${item.nextModId}`);
    warnings.push(`customs #${item.id}: terminal next level ${item.nextModId} is not recorded`);
  }
  for (const item of tables.monsters) for (const id of [item.item1,item.item2]) {
    assert(id <= 0 || sets.equips.has(id) || sets.materials.has(id >= 10000 ? id-10000 : id), `monsters #${item.id}: missing drop ${id}`);
  }
  for (const dungeon of tables.dungeons) {
    assert(dungeon.condition <= 0 || sets.dungeons.has(dungeon.condition), `dungeons #${dungeon.id}: missing prerequisite ${dungeon.condition}`);
    // 0 and -1 are source sentinels for runtime-generated encounters.
    for (const ids of Object.values(dungeon.monsters)) for (const id of ids) assert(id <= 0 || sets.monsters.has(id), `dungeons #${dungeon.id}: missing monster ${id}`);
  }
  return warnings;
}

export async function prepareImport({ input, root, gameVersion, build, capturedAt, assets }) {
  assert(/^\d+\.\d+(?:\.\d+)?$/.test(gameVersion), 'A game version is required, e.g. 7.3.1');
  assert(Number.isSafeInteger(build) && build > 0, 'A positive build number is required');
  assert(/^\d{4}-\d{2}-\d{2}$/.test(capturedAt) && !Number.isNaN(Date.parse(capturedAt)) && new Date(capturedAt).toISOString().slice(0,10)===capturedAt, 'A real calendar capture date YYYY-MM-DD is required');
  const tables = {}, files = {}, changes = {}, warnings = [], images = [];
  let provided = 0;
  for (const name of Object.keys(schemas)) {
    const json = join(input, `${name}.json`), csv = join(input, `${name}.csv`);
    const hasJson = await exists(json), hasCsv = await exists(csv);
    assert(!(hasJson && hasCsv), `${name}: choose JSON or CSV, not both`);
    const before = await readFile(join(root, 'data', `${name}.json`), 'utf8');
    const format = hasCsv ? 'csv' : 'json';
    const source = hasJson ? json : hasCsv ? csv : undefined;
    const text = source ? await readFile(source,'utf8') : before;
    if (source) provided++;
    const rows = parseTable(name, text, format);
    tables[name] = rows;
    files[`${name}.json`] = hasCsv ? JSON.stringify({ [name]:rows },null,2)+'\n' : text;
    const old = new Map(JSON.parse(before)[name].map(row => [row.id,row]));
    const current = new Map(rows.map(row => [row.id,row]));
    changes[name] = {
      added: rows.filter(row => !old.has(row.id)).map(row => row.id),
      removed: [...old.keys()].filter(id => !current.has(id)),
      changed: rows.filter(row => old.has(row.id) && Object.keys(row).some(key => JSON.stringify(row[key]) !== JSON.stringify(old.get(row.id)[key]))).map(row => row.id),
    };
  }
  const languageFile = join(input,'langs.csv');
  const hasLanguages = await exists(languageFile);
  if (hasLanguages) provided++;
  assert(provided, 'Input must contain at least one public table JSON/CSV or langs.csv');
  files['langs.csv'] = await readFile(hasLanguages ? languageFile : join(root,'data/langs.csv'),'utf8');
  const rows = parse(files['langs.csv'],{ columns:true,bom:true,skip_empty_lines:true });
  for (const column of ['str','en_US','ja_JP','zh_CN','ko','zh_TW','es','th','pt','de','fr']) assert(rows.length && column in rows[0], `langs.csv: missing ${column}`);
  const keys = new Set(rows.map(row => row.str));
  for (const [name, items] of Object.entries(tables)) for (const item of items) {
    if (!keys.has(item.nameId)) warnings.push(`${name} #${item.id}: missing name translation ${item.nameId}`);
  }
  warnings.push(...validateLinks(tables));
  const checkedImages = new Set();
  for (const [name, items] of Object.entries(tables)) for (const item of items) {
    const file = item.icon ? `icons/${item.icon}.png` : name === 'dungeons' ? `dungeons/${item.id}.png` : undefined;
    if (!file || checkedImages.has(file)) continue;
    checkedImages.add(file);
    const current = join(root,'assets',file),present = await exists(current);
    if (assets && await exists(join(assets,file))) {
      const bytes = await readFile(join(assets,file));
      assert(bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])), `Invalid PNG ${file}`);
      if (!present || hash(bytes)!==hash(await readFile(current))) images.push({path:file,bytes});
    } else assert(present, `Missing public image ${file}; provide --assets with icons/ and dungeons/`);
  }
  const previous = JSON.parse(await readFile(join(root,'data/snapshot.json'),'utf8'));
  const snapshot = { previousLabel:`${previous.gameVersion} / build ${previous.build}`,changes,gameVersion,build,platform:'Android',capturedAt,source:'Public game tables; reviewed JSON/CSV import',
    tables:Object.fromEntries(Object.keys(schemas).map(name => [name,{records:tables[name].length,sha256:hash(files[`${name}.json`])}])),translationsSha256:hash(files['langs.csv']) };
  files['snapshot.json'] = JSON.stringify(snapshot,null,2)+'\n';
  return { files, images, report:{ gameVersion,build,capturedAt,changes,warnings,images:images.map(image => image.path),translations:rows.length } };
}

export async function applyImport(plan, root) {
  for (const image of plan.images) {
    const path = join(root,'assets',image.path);
    await mkdir(dirname(path),{recursive:true});
    await writeFile(path,image.bytes);
  }
  // Every table, relationship and required image was checked before any source write.
  for (const [name,text] of Object.entries(plan.files)) await writeFile(join(root,'data',name),text);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const value = flag => args[args.indexOf(flag)+1];
  if (args.includes('--help') || !args.includes('--input')) {
    console.log('node scripts/game-import.mjs --input DIRECTORY --version 7.3.1 --build 142 --captured-at YYYY-MM-DD [--assets DIRECTORY] [--apply]\nDry run by default. Accepts public table JSON or CSV exports with game field names. Missing tables retain current records; the full combined snapshot is validated.');
    process.exit(args.includes('--help') ? 0 : 1);
  }
  try {
    const root = resolve('.');
    const plan = await prepareImport({ input:resolve(value('--input')),root,gameVersion:value('--version'),build:Number(value('--build')),capturedAt:value('--captured-at'),assets:args.includes('--assets') ? resolve(value('--assets')) : undefined });
    console.log(JSON.stringify(plan.report,null,2));
    if (args.includes('--apply')) { await applyImport(plan,root); console.log('Applied validated public snapshot. Run npm run check and npm run build before publishing.'); }
    else console.log('Dry run: source unchanged. Review the changes, then repeat with --apply.');
  } catch (error) { console.error(error.message); process.exitCode=1; }
}
