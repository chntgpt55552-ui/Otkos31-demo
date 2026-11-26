(function(root){
'use strict';
function pack(parts,{width=3000,height=1500}={}){
 if(![width,height].every(n=>Number.isFinite(n)&&n>0))throw Error('Размер листа');
 const items=[],unplaced=[],sheets=[];
 for(const p of parts){if(![p.length,p.depth].every(n=>Number.isFinite(n)&&n>0)||!Number.isInteger(p.count)||p.count<1||p.count>1000)throw Error('Размер или количество детали');for(let i=0;i<p.count;i++)items.push({...p,copy:i+1,material:p.material||'white',fixed:['arch','halfarch'].includes(p.geometry)||p.fixed===true})}
 items.sort((a,b)=>b.length*b.depth-a.length*a.depth);
 for(const p of items){
 const options=[{w:p.length,h:p.depth,rotated:false},...(!p.fixed&&p.length!==p.depth?[{w:p.depth,h:p.length,rotated:true}]:[])];
 if(!options.some(o=>o.w<=width&&o.h<=height)){unplaced.push(p);continue}
 function best(){let result=null;for(const s of sheets.filter(s=>s.material===p.material))for(const [i,r] of s.free.entries())for(const o of options){if(o.w>r.w||o.h>r.h)continue;const score=r.w*r.h-o.w*o.h;if(!result||score<result.score)result={s,i,r,o,score}}return result}
 let b=best();if(!b){sheets.push({material:p.material,width,height,free:[{x:0,y:0,w:width,h:height}],parts:[]});b=best()}
 const {s,i,r,o}=b;s.parts.push({...p,...o,x:r.x,y:r.y});s.free.splice(i,1);if(r.w>o.w)s.free.push({x:r.x+o.w,y:r.y,w:r.w-o.w,h:o.h});if(r.h>o.h)s.free.push({x:r.x,y:r.y+o.h,w:r.w,h:r.h-o.h});
 }
 return {sheets,unplaced};
}
const api={pack};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.OtCutting=api;
})(globalThis);