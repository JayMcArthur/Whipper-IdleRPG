import { evaluateBuild,evaluateItem,defaultBuild,validateBuild,type Build,type ItemSetup,type Slot,type Values,stats } from './build';

export interface ComparisonValues extends Values {attack:number;defense:number;score:number;}
export interface Weights {hp:number;attack:number;defense:number;}
export function weightedScore(values:Pick<ComparisonValues,'hp'|'attack'|'defense'>,weights:Weights):number {
  for(const value of Object.values(weights))if(!Number.isFinite(value)||value<0||value>100)throw new Error('Score weights must be 0–100.');
  return Math.floor(values.hp*weights.hp+values.attack*weights.attack+values.defense*weights.defense);
}
export function compareBuild(build:Build,level:number,weights:Weights):ComparisonValues {
  const result=evaluateBuild(build,level),values={...result.values,attack:result.attack,defense:result.defense};
  return {...values,score:weightedScore(values,weights)};
}
export function compareItem(slot:Slot,setup:ItemSetup,level:number,weights:Weights,context?:Build):ComparisonValues {
  if(context)return compareBuild({...context,[slot]:setup},level,weights);
  const checked={...defaultBuild(),[slot]:setup,level};validateBuild(checked);
  const item=evaluateItem(setup),values={} as ComparisonValues;
  for(const stat of stats)values[stat]=Math.floor((item.flat[stat]+item.growth[stat]*(level-1))*item.boost[stat]);
  values.attack=Math.floor(values.str+(slot==='weapon'?item.power:0));
  values.defense=Math.floor(values.vit+(slot==='armor'?item.power:0));
  values.score=weightedScore(values,weights);
  return values;
}
