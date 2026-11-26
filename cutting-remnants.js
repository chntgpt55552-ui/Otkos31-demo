(function(root){
'use strict';
function classify(result,{minLength=300,minDepth=100}={}){
 if(![minLength,minDepth].every(n=>Number.isFinite(n)&&n>0))throw Error('Укажите минимальные размеры остатка');
 return {...result,sheets:result.sheets.map((s,i)=>({...s,free:s.free.map((r,j)=>({...r,key:(i+1)+':'+(j+1),usable:r.w>=minLength&&r.h>=minDepth,material:s.material}))}))};
}
function register(result,ledger,orderId,cutId){
 if(!orderId||!cutId)throw Error('Нет идентификатора раскроя');
 if(!Number.isSafeInteger(ledger.next)||ledger.next<1||!Array.isArray(ledger.items))throw Error('Некорректный журнал остатков');
 const items=ledger.items.map(x=>({...x}));let next=ledger.next;
 const sheets=result.sheets.map((s,i)=>({...s,free:s.free.map(r=>{if(!r.usable)return {...r,number:null};const key=JSON.stringify([orderId,cutId,r.key]);let item=items.find(x=>x.key===key);if(item&&(item.width!==r.w||item.height!==r.h||item.material!==s.material))throw Error('Раскрой изменился: создайте новую редакцию');if(!item){item={key,number:next++,orderId,cutId,sheet:i+1,width:r.w,height:r.h,material:s.material,status:'available'};items.push(item)}return {...r,number:item.number}})}));
 return {result:{...result,sheets},ledger:{next,items}};
}
const api={classify,register};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.OtCuttingRemnants=api;
})(globalThis);