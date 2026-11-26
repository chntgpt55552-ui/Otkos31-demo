(function(root){
'use strict';
function components(rects){
 const a=rects.map(r=>({...r}));for(const r of a)if(![r.x,r.y,r.w,r.h].every(Number.isFinite)||r.w<=0||r.h<=0)throw Error('Некорректный участок');
 const overlap=(a,b)=>Math.min(a.x+a.w,b.x+b.w)-Math.max(a.x,b.x)>0&&Math.min(a.y+a.h,b.y+b.h)-Math.max(a.y,b.y)>0;
 const touch=(a,b)=>((a.x+a.w===b.x||b.x+b.w===a.x)&&Math.min(a.y+a.h,b.y+b.h)>Math.max(a.y,b.y))||((a.y+a.h===b.y||b.y+b.h===a.y)&&Math.min(a.x+a.w,b.x+b.w)>Math.max(a.x,b.x));
 for(let i=0;i<a.length;i++)for(let j=i+1;j<a.length;j++)if(overlap(a[i],a[j]))throw Error('Перекрытие участков');
 const seen=new Set(),out=[];for(let i=0;i<a.length;i++){if(seen.has(i))continue;const queue=[i];seen.add(i);for(let k=0;k<queue.length;k++)for(let j=0;j<a.length;j++)if(!seen.has(j)&&touch(a[queue[k]],a[j])){seen.add(j);queue.push(j)}const cells=queue.map(j=>a[j]),x=Math.min(...cells.map(r=>r.x)),y=Math.min(...cells.map(r=>r.y));out.push({x,y,width:Math.max(...cells.map(r=>r.x+r.w))-x,height:Math.max(...cells.map(r=>r.y+r.h))-y,area:cells.reduce((n,r)=>n+r.w*r.h,0),cells:cells.map(r=>({...r,x:r.x-x,y:r.y-y}))})}return out;
}
function fits(cells,r){if(![r.x,r.y,r.w,r.h].every(Number.isFinite)||r.w<=0||r.h<=0)return false;return Math.abs(cells.reduce((n,c)=>n+Math.max(0,Math.min(c.x+c.w,r.x+r.w)-Math.max(c.x,r.x))*Math.max(0,Math.min(c.y+c.h,r.y+r.h)-Math.max(c.y,r.y)),0)-r.w*r.h)<1e-7}
const api={components,fits};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.OtRemnantShape=api;
})(globalThis);