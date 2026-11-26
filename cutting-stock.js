(function(root){
'use strict';
function resolve({materials,report,bindings,ledger,location,width,height}){
 if(report.issues.length)throw Error('Исправьте ошибки складского журнала');
 if(!location||![width,height].every(n=>Number.isFinite(n)&&n>0))throw Error('Укажите склад и размер листа');
 const costs={},stock={},remnants=[];const ids=new Set();
 for(const [type,id] of Object.entries(bindings)){
 if(ids.has(id))throw Error('Выберите разные материалы');ids.add(id);
 const m=materials.find(x=>x.id===id),r=report.rows.find(x=>x.id===id);
 if(!m||!r)throw Error('Материал отсутствует на складе: '+type);
 const u=root.otMaterialCore.units(m).find(x=>['м²','м2'].includes(x.name));if(!u||!Number.isFinite(u.factor)||u.factor<=0)throw Error('Нет единицы площади');
 const sheetArea=width*height/1e6;
 if(Math.abs(u.factor-sheetArea)>1e-8)throw Error('Размер листа не соответствует площади складской единицы материала: '+type);
 const area=(r.locations[location]||0)*u.factor;
 const active=ledger.items.filter(x=>['available','reserved'].includes(x.status)&&(x.materialId===id||(!x.materialId&&x.material===type)));
 if(active.some(x=>!x.materialId||!x.location))throw Error('Уточните материал и склад старых остатков');
 const local=active.filter(x=>x.location===location);
 const retained=local.reduce((n,x)=>n+(x.cells?x.cells.reduce((a,c)=>a+c.w*c.h,0):x.width*x.height)/1e6,0);
 if(!Number.isFinite(area)||!Number.isFinite(retained)||area+1e-8<retained)throw Error('Остатки превышают складской запас');
 costs[type]=r.average/u.factor;stock[type]=Math.floor((area-retained+1e-8)/(width*height/1e6));remnants.push(...local.filter(x=>x.status==='available').map(x=>({...x,material:type})));
 }
 return {costs,stock,remnants};
}
function shortage({required,available,incoming=0}){
 if(![required,available,incoming].every(n=>Number.isSafeInteger(n)&&n>=0))throw Error('Некорректное количество целых листов');
 const missing=Math.max(0,required-available);
 return {missing,toPurchase:Math.max(0,missing-incoming)};
}
root.OtCutStock={resolve,shortage};
})(globalThis);