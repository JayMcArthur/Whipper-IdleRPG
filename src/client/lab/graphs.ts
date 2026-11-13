import { equips } from '../../lib/game/data';
import { defaultItem,type Slot } from '../../lib/game/build';
import { compareBuild,compareItem,type ComparisonValues,type Weights } from '../../lib/game/comparison';
import { element,control,numeric,value,equipName,formatted,cell,download,errorText,type LabContext } from './shared';
import { drawChart,type Curve } from './chart';

interface Candidate {id:string;name:string;values:(level:number)=>ComparisonValues;use:()=>void;href?:string;}
const colors=['#f5b84e','#86b9ff','#c89cff','#ff9595','#7ed9be','#f0a8dc','#b5d579','#b7c5d9'];
export function mountGraphs(context:LabContext) {
  const {root,data}=context,panel=root.querySelector<HTMLElement>('#items')!;
  let selected=new Set<string>(),previousSource='',lastRows:{name:string;level:number;values:ComparisonValues}[]=[],currentCurves:Curve[]=[];
  const status=panel.querySelector<HTMLElement>('[data-graph-status]')!;
  const notify=()=>{
    try {render();}catch(error){status.textContent=errorText(error);}
  };
  function render() {
    const source=value(panel,'source'),slot=value(panel,'category') as Slot,metric=value(panel,'stat') as keyof ComparisonValues;
    const from=numeric(panel,'start'),to=numeric(panel,'end'),tableLevel=numeric(panel,'tableLevel');
    if(![from,to,tableLevel].every(n=>Number.isInteger(n)&&n>=1&&n<=10000)||to<from)throw new Error('Choose whole character levels from 1–10000, with the end at or after the start.');
    const weights:Weights={hp:numeric(panel,'weightHP'),attack:numeric(panel,'weightATK'),defense:numeric(panel,'weightDEF')};
    const active=context.getBuild(),presets=context.getPresets();
    const contextBuild=value(panel,'context')==='swap'?active:undefined;
    const query=value(panel,'query').normalize('NFKD').toLocaleLowerCase();
    const candidates:Candidate[]=source==='builds' ? presets.map((build,i)=>({id:`build-${i}`,name:build.name,values:level=>compareBuild(build,level,weights),use:()=>{
      const select=root.querySelector<HTMLSelectElement>('[data-saved-builds]')!;select.value=String(i);root.querySelector<HTMLButtonElement>('[data-load-build]')!.click();location.hash='build';
    }})) : equips.filter(item=>item.itemType===['weapon','armor','ring'].indexOf(slot)+1).map(item=>{
      const setup=contextBuild?{...active[slot],id:item.id}:{...defaultItem(item.id),upgrade:slot==='ring'?0:numeric(panel,'upgrade'),corrosion:numeric(panel,'corrosion'),analysis:numeric(panel,'analysis')};
      return {id:String(item.id),name:equipName(data,item.id),values:(level:number)=>compareItem(slot,setup,level,weights,contextBuild),use:()=>context.useItem(slot,item.id),href:`${data.base}/${data.locale}/${{weapon:'weapons',armor:'armor',ring:'rings'}[slot]}/${item.id}/`};
    });
    const filtered=candidates.filter(candidate=>`${candidate.name} ${candidate.id}`.normalize('NFKD').toLocaleLowerCase().includes(query));
    const ranked=filtered.map(candidate=>({...candidate,snapshot:candidate.values(tableLevel)})).sort((a,b)=>b.snapshot[metric]-a.snapshot[metric]);
    const identity=`${source}:${slot}`;
    if(identity!==previousSource){const requested=new URLSearchParams(location.search).get('graph');selected=requested&&ranked.some(candidate=>candidate.id===requested)?new Set([requested]):new Set(ranked.slice(0,3).map(candidate=>candidate.id));previousSource=identity;}
    else selected=new Set([...selected].filter(id=>ranked.some(candidate=>candidate.id===id)));
    const body=panel.querySelector('[data-comparison-rows]')!;
    body.replaceChildren(...ranked.map(candidate=>{
      const row=element('tr'),check=element('input');check.type='checkbox';check.checked=selected.has(candidate.id);check.disabled=selected.size>=8&&!check.checked;check.setAttribute('aria-label',`Graph ${candidate.name}`);
      check.addEventListener('change',()=>{if(check.checked)selected.add(candidate.id);else selected.delete(candidate.id);notify();});
      const selection=element('td');selection.append(check);row.append(selection);
      const heading=cell(row,candidate.name,true);
      if(candidate.href){const link=element('a',candidate.name);link.href=candidate.href;heading.replaceChildren(link);}
      for(const stat of ['hp','attack','defense','spd','score'] as const)cell(row,formatted(data,candidate.snapshot[stat]));
      const action=element('button',source==='builds'?'Load build':'Equip item','table-action');action.type='button';action.addEventListener('click',candidate.use);
      const actionCell=element('td');actionCell.append(action);row.append(actionCell);return row;
    }));
    lastRows=ranked.map(candidate=>({name:candidate.name,level:tableLevel,values:candidate.snapshot}));
    const step=Math.max(1,Math.ceil((to-from)/200)),levels:number[]=[];
    for(let level=from;level<=to;level+=step)levels.push(level);
    if(levels.at(-1)!==to)levels.push(to);
    currentCurves=ranked.filter(candidate=>selected.has(candidate.id)).map((candidate,i)=>({name:candidate.name,color:colors[i%colors.length]!,points:levels.map(level=>({x:level,y:candidate.values(level)[metric]}))}));
    drawChart(panel.querySelector('[data-item-chart]')!,currentCurves,metric.toUpperCase(),n=>formatted(data,n),index=>{
      panel.querySelector('[data-chart-readout]')!.textContent=`Level ${levels[index]} · ${currentCurves.map(curve=>`${curve.name}: ${formatted(data,curve.points[index]!.y)}`).join(' · ')}`;
    });
    const legend=panel.querySelector('[data-chart-legend]')!;
    legend.replaceChildren(...currentCurves.map(curve=>{const label=element('span',curve.name);label.style.borderColor=curve.color;return label;}));
    panel.querySelector('[data-comparison-caption]')!.textContent=`${source==='builds'?'Saved builds':'Equipment'} at character level ${tableLevel} · sorted by ${metric.toUpperCase()}`;
    status.textContent=`${ranked.length} ${source==='builds'?'presets':'items'} · ${selected.size} curves · ${data.version} data${step>1?` · graph samples every ${step} levels`:''}`;
  }
  panel.addEventListener('submit',event=>event.preventDefault());
  panel.querySelectorAll('input:not([type=checkbox]),select').forEach(input=>input.addEventListener('change',notify));
  control(panel,'query').addEventListener('input',notify);
  root.addEventListener('lab:tab',event=>{if((event as CustomEvent).detail==='items')notify();});
  root.addEventListener('lab:presets',()=>{if(!panel.hidden)notify();});
  panel.querySelector('[data-export-comparison]')!.addEventListener('click',()=>{
    const quote=(value:string|number)=>`"${String(typeof value==='string'&&/^[=+\-@\t\r]/.test(value)?`'${value}`:value).replaceAll('"','""')}"`;
    const csv=[['Item / build','Character level','HP','ATK','DEF','SPD','Weighted score'],...lastRows.map(row=>[row.name,row.level,row.values.hp,row.values.attack,row.values.defense,row.values.spd,row.values.score])].map(row=>row.map(quote).join(',')).join('\r\n');
    download('whipper-comparison.csv',csv,'text/csv;charset=utf-8');
  });
  panel.querySelector('[data-export-graph]')!.addEventListener('click',()=>{
    const chart=panel.querySelector<SVGSVGElement>('.growth-chart');
    if(!chart)return;
    const copy=chart.cloneNode(true) as SVGSVGElement;
    copy.setAttribute('xmlns','http://www.w3.org/2000/svg');
    const style=document.createElementNS('http://www.w3.org/2000/svg','style');style.textContent='.chart-label{fill:#aab2bf;font:14px sans-serif}.chart-grid{stroke:#34343f}.chart-marker{stroke:#777;stroke-dasharray:4 4}svg{background:#0d0d0f}';copy.prepend(style);
    copy.setAttribute('viewBox',`0 0 1000 ${450+currentCurves.length*26}`);
    currentCurves.forEach((curve,i)=>{const text=document.createElementNS('http://www.w3.org/2000/svg','text');text.setAttribute('x','95');text.setAttribute('y',String(445+i*26));text.setAttribute('fill',curve.color);text.setAttribute('font-family','sans-serif');text.setAttribute('font-size','15');text.textContent=curve.name.length>100?curve.name.slice(0,97)+'…':curve.name;copy.append(text);});
    download('whipper-growth.svg',new XMLSerializer().serializeToString(copy),'image/svg+xml');
  });
}
