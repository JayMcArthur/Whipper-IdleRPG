import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { prepareImport, applyImport, parseTable } from '../scripts/game-import.mjs';

const root = resolve('.');
const metadata = { root,gameVersion:'7.3.2',build:143,capturedAt:'2026-11-14' };
const equipment = JSON.parse(await readFile('data/equips.json','utf8')).equips;
async function home(t) {
  const parent=resolve('agent-output/import-tests');
  await mkdir(parent,{recursive:true});
  const path=await mkdtemp(join(parent,'case-'));
  t.after(() => rm(path,{recursive:true,force:true}));
  return path;
}
const csv = rows => [Object.keys(rows[0]),...rows.map(row => Object.values(row))].map(row => row.map(value => `"${String(value).replaceAll('"','""')}"`).join(',')).join('\r\n');

test('a new equipment CSV becomes a complete hashed snapshot without editing page code', async t => {
  const input=await home(t);
  const added={...equipment[0],id:9999,param:123,next:0,set:''};
  await writeFile(join(input,'equips.csv'),'\uFEFF'+csv([...equipment,added]));
  const before=await readFile('data/snapshot.json','utf8');
  const plan=await prepareImport({...metadata,input});
  assert.deepEqual(plan.report.changes.equips.added,[9999]);
  assert.equal(JSON.parse(plan.files['equips.json']).equips.find(item => item.id===9999).param,123);
  assert.equal(JSON.parse(plan.files['snapshot.json']).tables.equips.records,equipment.length+1);
  assert.equal(await readFile('data/snapshot.json','utf8'),before,'dry run must not write source');
  const destination=join(input,'applied');
  await mkdir(join(destination,'data'),{recursive:true});
  await applyImport(plan,destination);
  assert.equal(JSON.parse(await readFile(join(destination,'data/snapshot.json'),'utf8')).gameVersion,'7.3.2');
  assert.deepEqual(JSON.parse(await readFile(join(destination,'data/equips.json'),'utf8')).equips.at(-1),added);
});
test('broken cross-table references fail before any source write', async t => {
  const input=await home(t);
  await writeFile(join(input,'equips.json'),JSON.stringify({equips:equipment.map((item,i) => i ? item : {...item,ability:999999})}));
  const before=await readFile('data/equips.json','utf8');
  await assert.rejects(prepareImport({...metadata,input}),/missing ability 999999/);
  assert.equal(await readFile('data/equips.json','utf8'),before);
});
test('spreadsheet types, duplicate IDs and new unreviewed columns cannot silently enter public data', () => {
  assert.throws(() => parseTable('equips',csv([{...equipment[0],param:'=SUM(A1:A5)'}]),'csv'),/param must be a safe integer/);
  assert.throws(() => parseTable('equips',JSON.stringify({equips:[equipment[0],equipment[0]]}),'json'),/duplicate ID/);
  assert.throws(() => parseTable('equips',JSON.stringify({equips:[{...equipment[0],privateKey:'do not publish'}]}),'json'),/contract review/);
  assert.throws(() => parseTable('equips',JSON.stringify({equips:[{...equipment[0],icon:'../private'}]}),'json'),/invalid icon/);
});
test('supplied changed public PNGs refresh existing image names without changing source during review', async t => {
  const input=await home(t),assets=join(input,'images');
  await mkdir(join(assets,'icons'),{recursive:true});
  await writeFile(join(input,'equips.json'),await readFile('data/equips.json'));
  const before=await readFile('assets/icons/we01.png'),replacement=await readFile('assets/icons/we02.png');
  assert.notDeepEqual(before,replacement);
  await writeFile(join(assets,'icons/we01.png'),replacement);
  const plan=await prepareImport({...metadata,input,assets});
  assert.deepEqual(plan.report.images,['icons/we01.png']);
  assert.deepEqual(await readFile('assets/icons/we01.png'),before);
  const destination=join(input,'applied');await mkdir(join(destination,'data'),{recursive:true});
  await applyImport(plan,destination);
  assert.deepEqual(await readFile(join(destination,'assets/icons/we01.png')),replacement);
});
test('invalid calendar dates cannot stamp a supposedly valid imported snapshot',async()=>{
  await assert.rejects(prepareImport({...metadata,input:resolve('data'),capturedAt:'2026-02-31'}),/real calendar/);
});
