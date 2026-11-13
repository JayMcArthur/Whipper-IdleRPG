import { randomDungeon,fixedDungeon,observedDungeon,type DungeonPlan } from '../../lib/game/dungeon';
import { defaultCombatOptions,type Benchmark } from '../../lib/game/combat';
import { control,value,numeric,element,cell,list,translated,formatted,monsterName,errorText,type LabContext } from './shared';

const bosses=new Set([100,109,129,130,131,133,134,200,201,202,203]);
export function mountDungeon(context:LabContext) {
  const {root,data}=context,panel=root.querySelector<HTMLElement>('#dungeon')!,form=panel.querySelector<HTMLFormElement>('[data-dungeon-form]')!;
  const status=panel.querySelector<HTMLElement>('[data-dungeon-status]')!,cancel=panel.querySelector<HTMLButtonElement>('[data-cancel-benchmark]')!;
  const results=panel.querySelector<HTMLElement>('[data-benchmark-results]')!;
  let plan:DungeonPlan|undefined,worker:Worker|undefined;
  const enemyLink=(id:number)=>{const link=element('a',monsterName(data,id));link.href=`${data.base}/${data.locale}/${bosses.has(id)?'bosses':'monsters'}/${id}/`;return link;};
  const stop=()=>{worker?.terminate();worker=undefined;cancel.hidden=true;form.querySelector<HTMLButtonElement>('[type=submit]')!.disabled=false;};
  const preview=()=>{
    stop();results.hidden=true;
    try {
      const random=value(form,'kind')==='random',miasma=numeric(form,'miasma');
      for(const name of ['code','codeMode'])control(form,name).closest('label')!.hidden=!random;
      for(const name of ['dungeon','start','count'])control(form,name).closest('label')!.hidden=random;
      plan=random?randomDungeon(value(form,'code'),value(form,'codeMode')==='seed',miasma):fixedDungeon(numeric(form,'dungeon'),miasma,numeric(form,'start'),numeric(form,'count'));
      const observed=value(form,'observed');if(observed.trim())plan=observedDungeon(plan,observed,miasma);
      panel.querySelector('[data-dungeon-name]')!.textContent=translated(data,plan.nameKey);
      panel.querySelector('[data-dungeon-description]')!.textContent=`${plan.floors.length} floor definitions · ${plan.minutesPerFloor} min / floor · ${plan.kind} encounter source${plan.seed!==undefined?` · seed ${plan.seed}`:''}`;
      list(panel.querySelector('[data-dungeon-notes]')!,plan.notes);
      panel.querySelector('[data-floor-pools]')!.replaceChildren(...plan.floors.map(floor=>{
        const row=element('tr');cell(row,String(floor.floor),true);cell(row,String(floor.miasma));const enemies=element('td');
        floor.monsters.forEach((id,i)=>{if(i)enemies.append(document.createTextNode(' · '));enemies.append(enemyLink(id));});row.append(enemies);return row;
      }));
      root.dispatchEvent(new CustomEvent('lab:dungeon',{detail:plan}));
      status.textContent=plan.floors.length?'Ready to test the current build.':'Add observed floor pools for this special area.';
    } catch(error){plan=undefined;status.textContent=errorText(error);}
  };
  const render=(benchmark:Benchmark)=>{
    results.hidden=false;
    panel.querySelector('[data-combat-trace]')!.setAttribute('hidden','');
    const unknown=benchmark.rows.filter(row=>row.unmodeled).length;
    panel.querySelector('[data-benchmark-summary]')!.textContent=`${benchmark.rows.length} encounter definitions at character level ${context.getBuild().level}; ${unknown} require additional phase rules. ${benchmark.trials} independent tests per modeled encounter.`;
    list(panel.querySelector('[data-benchmark-notes]')!,benchmark.notes);
    panel.querySelector('[data-benchmark-rows]')!.replaceChildren(...benchmark.rows.map(result=>{
      const row=element('tr');cell(row,String(result.floor),true);const name=element('td');name.append(enemyLink(result.monsterId));row.append(name);
      cell(row,`${formatted(data,result.enemy.hp)} / ${formatted(data,result.enemy.attack)} / ${formatted(data,result.enemy.defense)}`);
      cell(row,result.unmodeled?'Phase model needed':`${result.wins} / ${result.trials}`);
      cell(row,result.unmodeled?'—':String(result.draws));cell(row,result.unmodeled?'—':formatted(data,result.averageHP,1));cell(row,result.unmodeled?'—':formatted(data,result.averageTurns,1));
      const traceCell=element('td');
      if(!result.unmodeled){const button=element('button','Inspect','table-action');button.type='button';button.addEventListener('click',()=>{
        panel.querySelector<HTMLElement>('[data-combat-trace]')!.hidden=false;
        panel.querySelector('[data-trace-summary]')!.textContent=`Floor ${result.floor} · ${monsterName(data,result.monsterId)} · ${result.trace.outcome} after ${result.trace.turns} rounds. Showing the first test’s first 80 actions.`;
        panel.querySelector('[data-trace-rows]')!.replaceChildren(...result.trace.actions.map(action=>{const row=element('tr');cell(row,String(action.turn),true);cell(row,action.actor);cell(row,action.note);cell(row,formatted(data,action.damage));cell(row,formatted(data,action.playerHP));cell(row,formatted(data,action.enemyHP));return row;}));
        panel.querySelector('[data-combat-trace]')!.scrollIntoView({block:'nearest'});
      });traceCell.append(button);}
      row.append(traceCell);return row;
    }));
  };
  form.addEventListener('change',preview);
  form.addEventListener('submit',event=>{
    event.preventDefault();stop();
    try {
      if(!plan?.floors.length)throw new Error('This area needs observed encounters before it can be tested.');
      const build=context.getBuild(),trials=numeric(form,'trials'),seed=numeric(form,'seed');
      const options={...defaultCombatOptions,damageRoll:value(form,'damageRoll')==='on',speedDodge:numeric(form,'speedDodge')/100,speedDouble:numeric(form,'speedDouble')/100,poison:numeric(form,'poison')/100,deadlyPoison:numeric(form,'deadlyPoison')/100};
      worker=new Worker(new URL('../../lib/game/benchmark-worker.ts',import.meta.url),{type:'module'});
      worker.onmessage=event=>{stop();if(event.data.error)status.textContent=event.data.error;else{render(event.data.result);status.textContent='Encounter tests complete.';}};
      worker.onerror=()=>{stop();status.textContent='The encounter worker could not run. Check the page console for details.';};
      worker.postMessage({build,plan,trials,seed,options});cancel.hidden=false;form.querySelector<HTMLButtonElement>('[type=submit]')!.disabled=true;status.textContent='Testing encounters…';
    }catch(error){stop();status.textContent=errorText(error);}
  });
  cancel.addEventListener('click',()=>{stop();status.textContent='Encounter tests cancelled.';});
  root.addEventListener('lab:build',()=>{stop();results.hidden=true;status.textContent='Build changed. Run the encounter tests again.';});
  window.addEventListener('pagehide',stop);
  const query=new URLSearchParams(location.search);
  if(query.has('dungeon'))control(form,'dungeon').value=query.get('dungeon')!;
  if(query.has('enemy'))control(form,'observed').value=`1: ${query.get('enemy')}`;
  preview();
}
