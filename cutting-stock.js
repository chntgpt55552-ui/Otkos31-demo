(function(root){
'use strict';
function resolve({materials,report,bindings,ledger,location,width,height}){
 if(report.issues.length)throw Error('Исправьте ошибки складского журнала');
 if(!location||![width,height].every(n=>Number.isFinite(n)&&n>0))throw Error('Укажите склад и размер листа');
 if(String(location).startsWith('prepared:'))throw Error('Готовые детали нельзя использовать как сырьё для раскроя');
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
function allocate({available,incoming=0,demands}){
 if(![available,incoming].every(n=>Number.isSafeInteger(n)&&n>=0)||!Array.isArray(demands))throw Error('Некорректный запас');
 const seen=new Set();
 return demands.map(d=>{
 if(d.orderId==null||seen.has(String(d.orderId))||!Number.isSafeInteger(d.required)||d.required<0)throw Error('Некорректная потребность заказа');
 seen.add(String(d.orderId));
 const onHand=Math.min(available,d.required);available-=onHand;
 const expected=Math.min(incoming,d.required-onHand);incoming-=expected;
 return {...d,onHand,expected,toPurchase:d.required-onHand-expected};
 });
}
function pendingSheets({journal,material,location,baseQuantity}){
 return journal.filter(t=>t.kind==='purchase'&&!t.done&&t.materialId===material.id&&t.location===location).reduce((n,t)=>{
 const q=baseQuantity(t,material);
 if(!Number.isFinite(q)||q<=0)throw Error('Некорректная ожидаемая закупка');
 return n+(Math.abs(q-Math.round(q))<1e-8?Math.round(q):0);
 },0);
}
function purchaseGroup({journal,needs,requestId,supplier,lines,baseQuantity}){
 if(!Array.isArray(journal)||!Array.isArray(lines)||!lines.length||typeof requestId!=='string'||!requestId.trim()||typeof supplier!=='string'||!supplier.trim())throw Error('Некорректная заявка');
 if(journal.some(t=>t.purchaseGroupId===requestId))throw Error('Заявка уже создана');
 if(!needs||needs.issues.length)throw Error('Ошибки складского журнала');
 const seen=new Set(), ids=new Set(journal.map(t=>String(t.id)));
 const additions=lines.map(t=>{
 const key=String(t.materialId),need=needs.rows.find(n=>String(n.id)===key);
 if(t.id==null||!String(t.id).trim()||t.materialId==null||!String(t.materialId).trim()||ids.has(String(t.id))||seen.has(key)||!need||t.kind!=='purchase'||t.orderId!=null||t.done!==false||t.paid!==false||t.counterparty!==supplier||!t.location||!t.date||!Number.isFinite(t.amount)||t.amount<0)throw Error('Некорректная позиция заявки');
 const q=baseQuantity(t,need);
 if(!Number.isFinite(need.deficit)||need.deficit<=0||!Number.isFinite(q)||q<=0||q>need.deficit+1e-9)throw Error('Потребность изменилась');
 seen.add(key);ids.add(String(t.id));
 return {...t,purchaseGroupId:requestId};
 });
 return [...journal,...additions];
}
root.OtCutStock={resolve,shortage,allocate,pendingSheets,purchaseGroup};
})(globalThis);