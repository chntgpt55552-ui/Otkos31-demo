(function(root){'use strict';
function propose({work,completed,quantity,specification,actual}){
 const valid=n=>typeof n==='number'&&Number.isFinite(n)&&n>=0;
 if(!work||work.id==null||work.orderId==null||!valid(work.qty)||work.qty===0||!valid(completed)||!valid(quantity)||quantity===0||completed+quantity>work.qty+1e-8)throw Error('Некорректный объём работ');
 const rows=new Map();
 const key=r=>JSON.stringify([r.materialId,r.unit,(r.prepared===true||r.preparedConsumption===true)]);
 for(const r of specification){
  if(String(r.workId)!==String(work.id)||String(r.orderId)!==String(work.orderId))continue;
  if(r.cutSource===true||r.customerOwned===true)continue;
  if(!r.materialId||!r.unit||!valid(r.qty))throw Error('Некорректная спецификация');
  const k=key(r),old=rows.get(k);
  rows.set(k,{materialId:r.materialId,unit:r.unit,prepared:r.prepared===true,qty:(old?.qty||0)+r.qty});
 }
 const consumed=new Map();
 for(const r of actual){
  if(String(r.workId)!==String(work.id)||String(r.orderId)!==String(work.orderId)||r.done!==true||r.kind!=='stockOut'||r.materialAction==='damage'||r.cutSource===true)continue;
  if(!valid(r.qty))throw Error('Некорректный фактический расход');
  const k=key(r);consumed.set(k,(consumed.get(k)||0)+r.qty);
 }
 return [...rows.entries()].map(([k,r])=>({...r,qty:Math.max(0,r.qty*Math.min(1,(completed+quantity)/work.qty)-(consumed.get(k)||0))})).filter(r=>r.qty>1e-9);
}
root.OtMaterialUsagePlan={propose};
})(globalThis);
