import { defaultBuild,evaluateBuild,slots,stats,type Build,type Slot } from '../lib/game/build';
import { equipById,customs,customById } from '../lib/game/data';
import { ordinaryAbilities,tieredAbilities,abilityFitsSlot,abilityTier } from '../lib/game/abilities';
import { formatEffect } from '../lib/effects';
import { canonicalBuild,readPresets,parseBuildFile,presetKey,draftKey } from './lab/storage';
import { control,numeric,element,cell,list,formatted,translated,download,errorText,type LabData,type LabContext } from './lab/shared';
import { mountGraphs } from './lab/graphs';
import { mountDungeon } from './lab/dungeon';
import { mountBook } from './lab/book';

export function mountLab() {
  const root=document.querySelector<HTMLElement>('[data-lab]');
  if(!root)return;
  const data:LabData=JSON.parse(root.querySelector('[data-lab-data]')!.textContent!);
  const form=root.querySelector<HTMLFormElement>('[data-build-form]')!;
  const error=root.querySelector<HTMLElement>('[data-lab-error]')!;
  const status=root.querySelector<HTMLElement>('[data-preset-status]')!;
  let build=defaultBuild(),presets:Build[]=[];
  const fail=(value:unknown)=>{error.textContent=errorText(value);error.hidden=false;};
  const attempt=(fn:()=>void)=>{try{fn();error.hidden=true;}catch(e){fail(e);}};
  const pools=[ordinaryAbilities,tieredAbilities].map(abilities=>{
    const groups=new Map<string,typeof customs>();
    for(const ability of abilities){const group=groups.get(ability.nameId)||[];group.push(ability);groups.set(ability.nameId,group);}
    return groups;
  });
  const groupsFor=(row:HTMLElement)=>pools[Number(row.dataset.index)===3?1:0]!;
  const rows=[...root.querySelectorAll<HTMLElement>('[data-ability-row]')];
  const describe=(row:HTMLElement)=> {
    const selected=customById.get(Number(row.querySelector<HTMLSelectElement>('[data-ability-level]')!.value));
    const tier=selected&&abilityTier(selected.id);
    const effect=selected?formatEffect(translated(data,selected.summaryId),selected.value,data.htmlLocale):'';
    const unsupported=selected&&!abilityFitsSlot(selected.id,Number(row.dataset.index));
    row.querySelector('[data-ability-description]')!.textContent=`${tier?`${tier} · `:''}${effect}${unsupported?' This saved effect cannot be used in this slot and is excluded from stats. Choose a supported effect.':''}`;
  };
  const levels=(row:HTMLElement,id?:number)=> {
    const name=row.querySelector<HTMLSelectElement>('[data-ability-group]')!.value;
    const level=row.querySelector<HTMLSelectElement>('[data-ability-level]')!;
    const records=groupsFor(row).get(name)||[];
    level.replaceChildren(...records.map(item=>new Option(String(item.dispLv),String(item.id))));
    // Keep an older unsupported selection visible so loading a preset never silently changes it.
    const stored=id&&customById.get(id);
    if(stored&&!records.some(item=>item.id===id))level.add(new Option(String(stored.dispLv),String(id)));
    if(!level.options.length)level.add(new Option('—','0'));
    if(id!==undefined)level.value=String(id);
    describe(row);
  };
  for(const row of rows) {
    const group=row.querySelector<HTMLSelectElement>('[data-ability-group]')!;
    group.addEventListener('change',()=>levels(row));
    row.querySelector('[data-ability-level]')!.addEventListener('change',()=>describe(row));
  }
  const fill=()=> {
    for(const field of ['name','level','apples','permanentHP'] as const)control(form,field).value=String(build[field]);
    for(const slot of slots) {
      for(const key of ['id','corrosion','analysis','upgrade'] as const)if(slot!=='ring'||key!=='upgrade')control(form,`${slot}-${key}`).value=String(build[slot][key]);
    }
    build.boostPoints.forEach((points,i)=>control(form,`bp-${i}`).value=String(points));
    for(const row of rows) {
      const id=build[row.dataset.slot as Slot].enchants[Number(row.dataset.index)]||0;
      const group=row.querySelector<HTMLSelectElement>('[data-ability-group]')!;
      const groups=groupsFor(row),stored=customById.get(id);
      group.replaceChildren(new Option('None',''),...[...groups.keys()].map(name=>new Option(translated(data,name),name)));
      if(stored&&!groups.has(stored.nameId))group.add(new Option(translated(data,stored.nameId),stored.nameId));
      group.value=stored?.nameId||'';
      levels(row,id);
    }
  };
  const read=():Build=>{
    const next=structuredClone(build);
    next.name=control(form,'name').value;
    for(const field of ['level','apples','permanentHP'] as const)next[field]=numeric(form,field);
    for(const slot of slots) {
      for(const field of ['id','analysis','corrosion','upgrade'] as const)if(slot!=='ring'||field!=='upgrade')next[slot][field]=numeric(form,`${slot}-${field}`);
      next[slot].enchants=rows.filter(row=>row.dataset.slot===slot).map(row=>Number(row.querySelector<HTMLSelectElement>('[data-ability-level]')!.value));
    }
    next.boostPoints=Array.from({length:26},(_,i)=>numeric(form,`bp-${i}`));
    return canonicalBuild(next);
  };
  const render=()=> {
    const result=evaluateBuild(build);
    const strip=root.querySelector('[data-build-stats]')!;
    strip.replaceChildren(...[['HP',result.values.hp],['ATK',result.attack],['DEF',result.defense],['SPD',result.values.spd],['LUK',result.values.luk]].map(([label,value])=>{
      const card=element('div');card.append(element('span',String(label)),element('strong',formatted(data,Number(value))));return card;
    }));
    const body=root.querySelector('[data-stat-breakdown]')!;
    body.replaceChildren(...stats.map(stat=>{const row=element('tr');cell(row,stat.toUpperCase(),true);for(const number of [result.base[stat],result.growth[stat],result.boost[stat],result.values[stat]])cell(row,formatted(data,number,3));return row;}));
    root.querySelector('[data-used-bp]')!.textContent=formatted(data,result.usedBP);
    root.querySelector('[data-build-summary]')!.textContent=`Weapon power ${formatted(data,result.weaponPower,2)} · Shield power ${formatted(data,result.armorPower,2)} · ${result.attackKind} · ${result.hasSet?'Matching set active':'No matching set'} · ${result.usedBP} BP`;
    list(root.querySelector('[data-model-notes]')!,result.notes);
    for(const [i,slot] of slots.entries()) {
      const link=root.querySelector<HTMLAnchorElement>(`[data-item-reference="${slot}"]`)!;
      link.href=`${data.base}/${data.locale}/${['weapons','armor','rings'][i]}/${build[slot].id}/`;
    }
    root.dispatchEvent(new Event('lab:build'));
  };
  const presetList=()=>{
    const select=root.querySelector<HTMLSelectElement>('[data-saved-builds]')!;
    const previous=select.value;
    select.replaceChildren(new Option('Choose a preset',''),...presets.map((preset,i)=>new Option(preset.name,String(i))));
    if([...select.options].some(option=>option.value===previous))select.value=previous;
    root.dispatchEvent(new Event('lab:presets'));
  };
  const saveDraft=()=>localStorage.setItem(draftKey,JSON.stringify(build));
  const setBuild=(value:Build)=>{build=canonicalBuild(value);fill();render();saveDraft();};
  form.addEventListener('submit',event=>event.preventDefault());
  form.addEventListener('change',()=>attempt(()=>{build=read();render();saveDraft();}));
  root.querySelector('[data-save-build]')!.addEventListener('click',()=>attempt(()=>{
    build=read();const index=presets.findIndex(preset=>preset.name===build.name);
    if(index<0)presets.push(canonicalBuild(build));else presets[index]=canonicalBuild(build);
    localStorage.setItem(presetKey,JSON.stringify(presets));presetList();status.textContent=`Saved “${build.name}” in this browser.`;
  }));
  root.querySelector('[data-load-build]')!.addEventListener('click',()=>attempt(()=>{
    const selected=root.querySelector<HTMLSelectElement>('[data-saved-builds]')!.value;
    if(selected==='')throw new Error('Choose a saved preset first.');
    setBuild(presets[Number(selected)]!);status.textContent=`Loaded “${build.name}”.`;
  }));
  root.querySelector('[data-delete-build]')!.addEventListener('click',()=>attempt(()=>{
    const selected=root.querySelector<HTMLSelectElement>('[data-saved-builds]')!.value;
    if(selected==='')throw new Error('Choose a saved preset first.');
    const [removed]=presets.splice(Number(selected),1);localStorage.setItem(presetKey,JSON.stringify(presets));presetList();status.textContent=`Deleted preset “${removed!.name}”.`;
  }));
  root.querySelector('[data-export-builds]')!.addEventListener('click',()=>attempt(()=>download('whipper-builds.json',JSON.stringify({schemaVersion:1,gameVersion:data.version,builds:presets.length?presets:[read()]},null,2),'application/json')));
  root.querySelector<HTMLInputElement>('[data-import-builds]')!.addEventListener('change',async event=>{
    const input=event.target as HTMLInputElement,file=input.files?.[0];
    if(!file)return;
    try {
      if(file.size>5*1024*1024)throw new Error('Build JSON must be smaller than 5 MiB.');
      const imported=parseBuildFile(await file.text());
      const merged=[...presets];for(const preset of imported){const index=merged.findIndex(item=>item.name===preset.name);if(index<0)merged.push(preset);else merged[index]=preset;}
      localStorage.setItem(presetKey,JSON.stringify(merged));presets=merged;presetList();setBuild(imported[0]!);error.hidden=true;status.textContent=`Imported ${imported.length} preset(s).`;
    } catch(e){fail(e);} finally {input.value='';}
  });
  attempt(()=>{presets=readPresets();const stored=localStorage.getItem(draftKey);if(stored)build=canonicalBuild(JSON.parse(stored));});
  const query=new URLSearchParams(location.search),slot=query.get('slot') as Slot,id=Number(query.get('id'));
  if(slots.includes(slot)&&equipById.get(id)?.itemType===slots.indexOf(slot)+1)build[slot].id=id;
  const graphCategory=query.get('category') as Slot;if(slots.includes(graphCategory))control(root.querySelector('#items')!,'category').value=graphCategory;
  fill();presetList();render();
  const context:LabContext={data,root,getBuild:()=>read(),getPresets:()=>presets,useItem:(slot,id)=>attempt(()=>{build[slot].id=id;setBuild(build);location.hash='build';})};
  mountGraphs(context);mountBook(context);mountDungeon(context);
  const tab=()=>{
    const requested=location.hash.slice(1),active=['build','items','dungeon','book'].includes(requested)?requested:'build';
    root.querySelectorAll<HTMLElement>('.lab-panel').forEach(panel=>panel.hidden=panel.id!==active);
    root.querySelectorAll<HTMLAnchorElement>('.lab-tabs a').forEach(link=>link.setAttribute('aria-current',link.hash===`#${active}`?'page':'false'));
    root.dispatchEvent(new CustomEvent('lab:tab',{detail:active}));
  };
  window.addEventListener('hashchange',tab);tab();
}
