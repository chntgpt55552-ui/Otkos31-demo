(function(root){
'use strict';
function run(parts,{width=3000,height=1500,remnants=[]}={},strategy=0){
 if(![width,height].every(n=>Number.isFinite(n)&&n>0))throw Error('Размер листа');
 const items=[],unplaced=[],sheets=remnants.filter(r=>r.status==='available'&&r.width>0&&r.height>0).map(r=>({material:r.material,width:r.width,height:r.height,remnantKey:r.key,remnantNumber:r.number,free:(r.cells||[{x:0,y:0,w:r.width,h:r.height}]).map(c=>({...c})),parts:[]}));
 for(const p of parts){if(![p.length,p.depth].every(n=>Number.isFinite(n)&&n>0)||!Number.isInteger(p.count)||p.count<1||p.count>1000)throw Error('Размер или количество детали');for(let i=0;i<p.count;i++)items.push({...p,copy:i+1,material:p.material||'white',fixed:['arch','halfarch'].includes(p.geometry)||p.fixed===true})}
 const scores=[p=>p.length*p.depth,p=>Math.max(p.length,p.depth),p=>p.length,p=>p.depth,p=>Math.min(p.length,p.depth),p=>2*(p.length+p.depth)];items.sort((a,b)=>scores[strategy](b)-scores[strategy](a)||b.length*b.depth-a.length*a.depth);
 for(const p of items){
 const options=[{w:p.length,h:p.depth,rotated:false},...(!p.fixed&&p.length!==p.depth?[{w:p.depth,h:p.length,rotated:true}]:[])];
 if(!options.some(o=>o.w<=width&&o.h<=height||sheets.some(s=>s.material===p.material&&o.w<=s.width&&o.h<=s.height))){unplaced.push(p);continue}
 function best(){let result=null;for(const s of sheets.filter(s=>s.material===p.material))for(const o of options){const xs=[...new Set(s.free.flatMap(c=>[c.x,c.x+c.w-o.w]))],ys=[...new Set(s.free.flatMap(c=>[c.y,c.y+c.h-o.h]))];for(const x of xs)for(const y of ys){if(x<0||y<0||x+o.w>s.width||y+o.h>s.height)continue;const area=s.free.reduce((n,c)=>n+Math.max(0,Math.min(c.x+c.w,x+o.w)-Math.max(c.x,x))*Math.max(0,Math.min(c.y+c.h,y+o.h)-Math.max(c.y,y)),0);if(Math.abs(area-o.w*o.h)>1e-7)continue;const score=s.free.reduce((n,c)=>n+c.w*c.h,0)-area;if(!result||Boolean(s.remnantKey)>Boolean(result.s.remnantKey)||Boolean(s.remnantKey)===Boolean(result.s.remnantKey)&&score<result.score)result={s,r:{x,y},o,score}}}return result}
 let b=best();if(!b&&!options.some(o=>o.w<=width&&o.h<=height)){unplaced.push(p);continue}if(!b){sheets.push({material:p.material,width,height,free:[{x:0,y:0,w:width,h:height}],parts:[]});b=best()}
 const {s,r,o}=b;s.parts.push({...p,...o,x:r.x,y:r.y});s.free=s.free.flatMap(c=>{const x1=Math.max(c.x,r.x),y1=Math.max(c.y,r.y),x2=Math.min(c.x+c.w,r.x+o.w),y2=Math.min(c.y+c.h,r.y+o.h);if(x2<=x1||y2<=y1)return [c];return [{x:c.x,y:c.y,w:c.w,h:y1-c.y},{x:c.x,y:y2,w:c.w,h:c.y+c.h-y2},{x:c.x,y:y1,w:x1-c.x,h:y2-y1},{x:x2,y:y1,w:c.x+c.w-x2,h:y2-y1}].filter(c=>c.w>0&&c.h>0)});
 }
 return {sheets:sheets.filter(s=>s.parts.length),unplaced};
}
function pack(parts,options={}){
 let best=null;
 const score=r=>[r.unplaced.length,r.sheets.filter(s=>!s.remnantKey).length,-r.sheets.filter(s=>s.remnantKey).reduce((n,s)=>n+s.parts.reduce((a,p)=>a+p.w*p.h,0),0),-r.sheets.reduce((sum,s)=>sum+Math.max(0,...s.free.map(f=>f.w*f.h))**2,0),r.sheets.reduce((sum,s)=>sum+s.free.length,0)];
 const better=(a,b)=>{for(let i=0;i<a.length;i++){if(a[i]!==b[i])return a[i]<b[i]}return false};
 for(let strategy=0;strategy<6;strategy++){const r=run(parts,options,strategy);if(!best||better(score(r),score(best)))best={...r,strategy}}
 return best;
}
const api={pack};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.OtCutting=api;
})(globalThis);