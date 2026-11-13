import { equips,monsterById,equipById } from '../../lib/game/data';
import { emptyBook,parseBook,normalizeProgress,bookSummary,analysisTotals,bookCategories,type ItemBook,type BookCategory } from '../../lib/game/item-book';
import type { DungeonPlan } from '../../lib/game/dungeon';
import { element,equipName,formatted,cell,download,errorText,translated,type LabContext } from './shared';

const key='whipper-item-book-v2';
export function mountBook(context:LabContext) {
  const {root,data}=context,panel=root.querySelector<HTMLElement>('#book')!,status=panel.querySelector<HTMLElement>('[data-book-status]')!;
  let book:ItemBook=emptyBook(),plan:DungeonPlan|undefined;
  const save=()=>{localStorage.setItem(key,JSON.stringify(book));root.dispatchEvent(new Event('lab:book'));};
  const summary=()=>{
    const result=bookSummary(book);
    panel.querySelector('[data-book-summary]')!.replaceChildren(...[['Recorded',`${result.collected} / ${result.total}`],['At least Lv25',result.atLeast25],['Book BP estimate',result.bp],['Known analysis XP',formatted(data,result.knownXP)]].map(([name,value])=>{const card=element('div');card.append(element('span',String(name)),element('strong',String(value)));return card;}));
  };
  const drops=()=>{
    if(!plan)return;
    panel.querySelector('[data-book-dungeon]')!.textContent=`${translated(data,plan.nameKey)} · ${plan.kind} encounter source`;
    const ids=new Set<number>();
    for(const floor of plan.floors)for(const id of floor.monsters){const enemy=monsterById.get(id)!;for(const drop of [enemy.item1,enemy.item2])if(equipById.has(drop))ids.add(drop);}
    const container=panel.querySelector('[data-book-drops]')!;
    container.replaceChildren(...[...ids].map(id=>{const item=equipById.get(id)!,category=bookCategories[item.itemType-1]!,progress=book[category][String(id)];const link=element('a',`${progress?.level||progress?.xp?'✓':'○'} ${equipName(data,id)}`);link.href=`${data.base}/${data.locale}/${category}/${id}/`;return link;}));
    if(!ids.size)container.textContent=plan.floors.length?'No equipment drops are listed for these observed enemies.':'This area needs observed encounters before its listed drops can be shown.';
  };
  const render=()=>{
    summary();drops();
    const category=panel.querySelector<HTMLSelectElement>('[data-book-category]')!.value as BookCategory;
    const query=panel.querySelector<HTMLInputElement>('[data-book-query]')!.value.toLocaleLowerCase(),filter=panel.querySelector<HTMLSelectElement>('[data-book-filter]')!.value;
    panel.querySelector('[data-book-rows]')!.replaceChildren(...equips.filter(item=>bookCategories[item.itemType-1]===category).filter(item=>`${equipName(data,item.id)} ${item.id}`.toLocaleLowerCase().includes(query)).filter(item=>{const p=book[category][String(item.id)],recorded=!!(p?.level||p?.xp);return filter==='all'||(filter==='recorded'?recorded:!recorded);}).map(item=>{
      const record=book[category][String(item.id)]||{level:0,xp:0};
      const row=element('tr'),name=cell(row,'',true),link=element('a',equipName(data,item.id));link.href=`${data.base}/${data.locale}/${category}/${item.id}/`;name.append(link);
      const level=element('input'),xp=element('input');
      for(const input of [level,xp]){input.type='number';input.min='0';input.step='1';input.className='book-number';}
      level.max='10000';level.value=String(record.level);level.setAttribute('aria-label',`Analysis level for ${equipName(data,item.id)}`);
      xp.max='1000000000000';xp.value=String(record.xp);xp.setAttribute('aria-label',`Remaining XP for ${equipName(data,item.id)}`);
      const update=()=>{try{book[category][String(item.id)]=normalizeProgress(level.value===''?NaN:Number(level.value),xp.value===''?NaN:Number(xp.value));save();render();status.textContent=`Saved analysis for ${equipName(data,item.id)}.`;}catch(error){status.textContent=errorText(error);}};
      level.addEventListener('change',update);xp.addEventListener('change',update);
      const levelCell=element('td');levelCell.append(level);row.append(levelCell);
      const xpCell=element('td');xpCell.append(xp,element('small',record.level<25?` / ${analysisTotals[record.level+1]!-analysisTotals[record.level]!}`:'Threshold not modeled'));row.append(xpCell);
      cell(row,String(Math.floor(record.level/5)));return row;
    }));
  };
  try {
    const current=localStorage.getItem(key),legacy=localStorage.getItem('whipper-item-book');
    if(current||legacy){book=parseBook(JSON.parse(current||legacy!));if(!current)save();}
  }catch(error){status.textContent=`Could not load records: ${errorText(error)}. Existing storage was left untouched.`;}
  panel.querySelectorAll('[data-book-category],[data-book-filter]').forEach(select=>select.addEventListener('change',render));
  panel.querySelector('[data-book-query]')!.addEventListener('input',render);
  panel.querySelector('[data-export-book]')!.addEventListener('click',()=>download('whipper-item-book.json',JSON.stringify(book,null,2),'application/json'));
  panel.querySelector<HTMLInputElement>('[data-import-book]')!.addEventListener('change',async event=>{
    const input=event.target as HTMLInputElement,file=input.files?.[0];if(!file)return;
    try{if(file.size>5*1024*1024)throw new Error('Item Book JSON must be smaller than 5 MiB.');const imported=parseBook(JSON.parse(await file.text()));localStorage.setItem(key,JSON.stringify(imported));book=imported;render();root.dispatchEvent(new Event('lab:book'));status.textContent='Item Book imported.';}catch(error){status.textContent=errorText(error);}finally{input.value='';}
  });
  root.addEventListener('lab:dungeon',event=>{plan=(event as CustomEvent<DungeonPlan>).detail;drops();});
  root.addEventListener('lab:tab',event=>{if((event as CustomEvent).detail==='book')render();});
  render();
}
