export interface Curve {name:string;color:string;points:{x:number;y:number}[];}
const namespace='http://www.w3.org/2000/svg';
function svg<K extends keyof SVGElementTagNameMap>(name:K,attributes:Record<string,string|number>,text?:string) {
  const node=document.createElementNS(namespace,name);
  for(const [key,value] of Object.entries(attributes))node.setAttribute(key,String(value));
  if(text!==undefined)node.textContent=text;
  return node;
}
export function drawChart(container:HTMLElement,curves:Curve[],label:string,format:(n:number)=>string,onInspect:(index:number)=>void) {
  container.replaceChildren();
  if(!curves.length){container.textContent='Select items or presets in the table to draw their curves.';return;}
  const width=1000,height=420,pad={left:95,right:30,top:30,bottom:65};
  const first=curves[0]!.points,minimumX=first[0]!.x,maximumX=first.at(-1)!.x;
  const all=curves.flatMap(curve=>curve.points.map(point=>point.y));
  const min=Math.min(0,...all),max=Math.max(1,...all),spread=max-min||1;
  const x=(level:number)=>pad.left+(level-minimumX)/(maximumX-minimumX||1)*(width-pad.left-pad.right);
  const y=(value:number)=>height-pad.bottom-(value-min)/spread*(height-pad.top-pad.bottom);
  const chart=svg('svg',{viewBox:`0 0 ${width} ${height}`,role:'img',tabindex:0,'aria-label':`${label} by character level. Use left and right arrows to inspect values.`,class:'growth-chart'});
  chart.append(svg('title',{},`${label} by character level`));
  for(let i=0;i<=4;i++){
    const value=min+spread*i/4,position=y(value);
    chart.append(svg('line',{x1:pad.left,y1:position,x2:width-pad.right,y2:position,class:'chart-grid'}));
    chart.append(svg('text',{x:pad.left-12,y:position+5,'text-anchor':'end',class:'chart-label'},format(value)));
    const level=Math.round(minimumX+(maximumX-minimumX)*i/4);
    chart.append(svg('text',{x:x(level),y:height-pad.bottom+28,'text-anchor':'middle',class:'chart-label'},String(level)));
  }
  chart.append(svg('text',{x:width/2,y:height-10,'text-anchor':'middle',class:'chart-label'},'Character level · level 1 = no growth'));
  for(const [index,curve] of curves.entries())chart.append(svg('polyline',{points:curve.points.map(point=>`${x(point.x)},${y(point.y)}`).join(' '),fill:'none',stroke:curve.color,'stroke-width':2.7,'stroke-dasharray':index>3?'8 4':'none'}));
  const marker=svg('line',{x1:pad.left,x2:pad.left,y1:pad.top,y2:height-pad.bottom,class:'chart-marker'});chart.append(marker);
  let selected=0;
  const inspect=(index:number)=>{selected=Math.max(0,Math.min(first.length-1,index));marker.setAttribute('x1',String(x(first[selected]!.x)));marker.setAttribute('x2',String(x(first[selected]!.x)));onInspect(selected);};
  chart.addEventListener('pointermove',event=>{
    const matrix=chart.getScreenCTM();if(!matrix)return;
    const position=new DOMPoint(event.clientX,event.clientY).matrixTransform(matrix.inverse());
    const ratio=(position.x-pad.left)/(width-pad.left-pad.right);
    inspect(Math.round(ratio*(first.length-1)));
  });
  chart.addEventListener('keydown',event=>{if(event.key==='ArrowLeft'||event.key==='ArrowRight'){event.preventDefault();inspect(selected+(event.key==='ArrowRight'?1:-1));}});
  container.append(chart);inspect(0);
}
