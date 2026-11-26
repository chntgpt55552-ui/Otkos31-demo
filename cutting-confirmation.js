(function(root){
'use strict';
function prepare({result,ledger,orderId,cutId,costs}){
 if(!orderId||!cutId||!result||!Array.isArray(result.sheets)||!result.sheets.length||result.unplaced?.length)throw Error('Раскрой не завершён');
 if((ledger.confirmed||[]).includes(cutId))throw Error('Раскрой уже подтверждён');
 const used=new Set(),totals={};
 for(const s of result.sheets){
 let source=s.width*s.height;let cells=[{x:0,y:0,w:s.width,h:s.height}];if(!Number.isFinite(source)||source<=0)throw Error('Некорректный источник');
 if(s.remnantKey){if(used.has(s.remnantKey))throw Error('Повторный остаток');used.add(s.remnantKey);const r=ledger.items.find(r=>r.key===s.remnantKey);if(!r||r.status!=='available'||r.material!==s.material||r.width!==s.width||r.height!==s.height)throw Error('Остаток изменился');cells=r.cells||cells;source=cells.reduce((n,c)=>n+c.w*c.h,0);}
 const all=[...s.parts,...s.free];const intersection=(a,b)=>Math.max(0,Math.min(a.x+a.w,b.x+b.w)-Math.max(a.x,b.x))*Math.max(0,Math.min(a.y+a.h,b.y+b.h)-Math.max(a.y,b.y));for(let i=0;i<all.length;i++){const p=all[i];if(![p.x,p.y,p.w,p.h].every(Number.isFinite)||p.w<=0||p.h<=0||Math.abs(cells.reduce((n,c)=>n+intersection(p,c),0)-p.w*p.h)>1e-6)throw Error('Участок вне материала');for(let j=0;j<i;j++)if(intersection(p,all[j])>1e-7)throw Error('Перекрытие участков');}
 const details=s.parts.reduce((n,p)=>n+p.w*p.h,0),free=s.free.reduce((n,r)=>n+r.w*r.h,0);
 if(!Number.isFinite(details)||!Number.isFinite(free)||details<=0||Math.abs(source-details-free)>1e-6)throw Error('Нарушен баланс площади');
 const t=totals[s.material]||(totals[s.material]={source:0,details:0,free:0,newSheets:0});t.source+=source/1e6;t.details+=details/1e6;t.free+=free/1e6;if(!s.remnantKey)t.newSheets++;
 }
 for(const [material,t] of Object.entries(totals)){const cost=costs[material];if(!Number.isFinite(cost)||cost<0)throw Error('Нет себестоимости: '+material);t.unitCost=cost;t.detailCost=t.details*cost;}
 return {orderId,cutId,used:[...used],totals};
}
const api={prepare};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.OtCutConfirmation=api;
})(globalThis);