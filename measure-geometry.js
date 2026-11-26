/* Pure geometry helpers for issue #3. Not yet wired into the UI. */
(function(root){
'use strict';
const MAX=3000;
function positive(n){return typeof n==='number'&&Number.isFinite(n)&&n>0}
function expand(part){
 if(!positive(part.length)||!positive(part.depth))throw Error('Укажите размеры детали');
 const pieces=part.pieces;
 if(pieces!=null&&!Array.isArray(pieces))throw Error('Некорректные составляющие');
 if(!pieces||!pieces.length){
  const count=Math.ceil(part.length/MAX);
  if(count>10000)throw Error('Слишком много составляющих');
  return Array.from({length:count},(_,i)=>({...part,pieces:undefined,segment:i+1,length:Math.min(MAX,part.length-i*MAX)}));
 }
 let sum=0;
 const out=pieces.map((p,i)=>{
  const length=p.length,depth=p.depth??part.depth;
  if(!positive(length)||length>MAX||!positive(depth))throw Error('Некорректный размер составляющей');
  sum+=length;
  return {...part,pieces:undefined,length,depth,segment:i+1};
 });
 if(Math.abs(sum-part.length)>1e-6)throw Error('Сумма составляющих не равна длине детали');
 return out;
}
function remainder(total,lengths){
 if(!positive(total)||!Array.isArray(lengths)||lengths.some(n=>!positive(n)||n>MAX))throw Error('Некорректные размеры');
 const n=total-lengths.reduce((a,b)=>a+b,0);
 if(!positive(n)||n>MAX)throw Error('Некорректный остаток');
 return n;
}
const api={MAX,expand,remainder};
if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.OtMeasureGeometry=api;
})(typeof globalThis!=='undefined'?globalThis:this);
