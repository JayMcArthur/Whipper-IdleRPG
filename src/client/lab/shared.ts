import type { Build, Slot } from '../../lib/game/build';
import { equipById,monsterById } from '../../lib/game/data';

export interface LabData {locale:string;htmlLocale:string;base:string;version:string;build:number;translations:Record<string,string>;}
export interface LabContext { data:LabData; root:HTMLElement; getBuild:()=>Build; getPresets:()=>Build[]; useItem:(slot:Slot,id:number)=>void; }
export function element<K extends keyof HTMLElementTagNameMap>(tag:K,text?:string,className?:string):HTMLElementTagNameMap[K] {
  const node=document.createElement(tag);
  if(text!==undefined)node.textContent=text;
  if(className)node.className=className;
  return node;
}
export function control(root:ParentNode,name:string) {return root.querySelector<HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement>(`[name="${name}"]`)!;}
export function value(root:ParentNode,name:string) {return control(root,name).value;}
export function numeric(root:ParentNode,name:string) {const raw=value(root,name);return raw.trim()===''?NaN:Number(raw);}
export function translated(data:LabData,key:string) {return data.translations[key]||key;}
export function equipName(data:LabData,id:number) {return translated(data,equipById.get(id)!.nameId);}
export function monsterName(data:LabData,id:number) {return translated(data,monsterById.get(id)!.nameId);}
export function formatted(data:LabData,n:number,digits=0) {return new Intl.NumberFormat(data.htmlLocale,{maximumFractionDigits:digits}).format(n);}
export function cell(row:HTMLTableRowElement,text:string,header=false) {const node=element(header?'th':'td',text);if(header)node.setAttribute('scope','row');row.append(node);return node;}
export function list(root:Element,items:string[]) {root.replaceChildren(...items.map(item=>element('li',item)));}
export function download(name:string,contents:string,mime:string) {
  const url=URL.createObjectURL(new Blob([contents],{type:mime}));
  const link=element('a');link.href=url;link.download=name;link.click();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
}
export function errorText(error:unknown) {return error instanceof Error?error.message:String(error);}
