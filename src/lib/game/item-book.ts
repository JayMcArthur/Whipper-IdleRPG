import thresholds from '../../../data/analysis-notes.json';
import { equips } from './data';

export const bookCategories=['weapons','armor','rings'] as const;
export type BookCategory=typeof bookCategories[number];
export interface Progress {level:number;xp:number;}
export type ItemBook=Record<BookCategory,Record<string,Progress>>;
export const analysisTotals=[0,...thresholds.map(row=>row.total)];
export const emptyBook=():ItemBook=>({weapons:{},armor:{},rings:{}});
export function normalizeProgress(level:number,xp:number):Progress {
  if(!Number.isSafeInteger(level)||level<0||level>10000||!Number.isSafeInteger(xp)||xp<0||xp>1e12)throw new Error('Analysis level and remaining XP must be nonnegative whole numbers.');
  while(level<analysisTotals.length-1 && xp>=analysisTotals[level+1]!-analysisTotals[level]!) {xp-=analysisTotals[level+1]!-analysisTotals[level]!;level++;}
  return {level,xp};
}
export function parseBook(value:unknown):ItemBook {
  if(!value||typeof value!=='object')throw new Error('Expected an Item Book object.');
  const record=value as Record<string,unknown>,book=emptyBook();
  for(const category of bookCategories) {
    const entries=record[category];if(!entries||typeof entries!=='object'||Array.isArray(entries))throw new Error(`Missing Item Book ${category} records.`);
    if(Object.keys(entries).length>5000)throw new Error('Item Book has too many records.');
    for(const [id,entry] of Object.entries(entries)) {
      if(!/^\d+$/.test(id)||Number(id)<1||!entry||typeof entry!=='object')throw new Error(`Invalid Item Book record ${id}.`);
      const {level,xp}=entry as Progress;book[category][id]=normalizeProgress(level,xp);
    }
  }
  return book;
}
export function bookSummary(book:ItemBook) {
  let bp=0,collected=0,knownXP=0,atLeast25=0;
  for(const item of equips) {
    const progress=book[bookCategories[item.itemType-1]!][String(item.id)]||{level:0,xp:0};
    bp+=Math.floor(progress.level/5);
    if(progress.level||progress.xp)collected++;
    if(progress.level>=25)atLeast25++;
    knownXP+=Math.min(analysisTotals.at(-1)!,progress.level>=25?analysisTotals.at(-1)!:analysisTotals[progress.level]!+progress.xp);
  }
  return {bp,collected,total:equips.length,knownXP,atLeast25};
}
