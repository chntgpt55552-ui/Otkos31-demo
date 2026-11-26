(function(root){
'use strict';
function commit(args,{stock,limits={},bindings={},location=null}={}){
 const check=root.OtCutConfirmation.prepare(args), classified=root.OtCuttingRemnants.classify(args.result,limits);
 const ledger={...args.ledger,items:args.ledger.items.map(r=>({...r})),events:[...(args.ledger.events||[])]};
 const movements=[],active=r=>['available','reserved'].includes(r.status),allocate=()=>{let n=1;while(ledger.items.some(r=>active(r)&&r.number===n))n++;return n};
 for(const [material,t] of Object.entries(check.totals)){if(!stock||!Number.isInteger(stock[material])||stock[material]<t.newSheets)throw Error('Недостаточно целых листов: '+material)}
 const sheets=classified.sheets.map((s,i)=>{
 const parent=s.remnantKey?ledger.items.find(r=>r.key===s.remnantKey):null;if(parent){if(location&&parent.location!==location)throw Error('Остаток находится на другом складе');if(bindings[s.material]&&parent.materialId!==bindings[s.material])throw Error('Материал остатка изменился');parent.status='used';}
 const free=s.free.slice().sort((a,b)=>b.area-a.area);let retained=0,first=true;
 for(const r of free){if(!r.usable){ledger.events.push({id:JSON.stringify([args.cutId,i,r.key]),kind:'cutWaste',orderId:args.orderId,material:s.material,area:r.area,unitCost:args.costs[s.material],amount:r.area/1e6*args.costs[s.material],date:new Date().toISOString(),reason:'Отходы раскроя',number:parent?.number??null});continue}
 const number=parent&&first?parent.number:allocate();first=false;retained+=r.area;const key=JSON.stringify([args.orderId,args.cutId,i,r.key]);ledger.items.push({key,number,parentKey:parent?.key,orderId:args.orderId,cutId:args.cutId,width:r.w,height:r.h,cells:r.cells,area:r.area,material:s.material,status:'available',materialId:bindings[s.material]||parent?.materialId,location:location||parent?.location});r.number=number;
 }
 const source=parent?(parent.cells||[{w:parent.width,h:parent.height}]).reduce((n,c)=>n+c.w*c.h,0):s.width*s.height;
 const detail=s.parts.reduce((n,p)=>n+p.w*p.h,0);
 const v=root.OtMaterialCost.cuttingValue({sourceArea:source/1e6,detailArea:detail/1e6,remnantArea:retained/1e6,unitCost:args.costs[s.material],orderId:args.orderId});
 movements.push(...v.movements.map((m,j)=>({...m,material:s.material,id:JSON.stringify([args.cutId,i,j])})));return {...s,free};
 });
 ledger.confirmed=[...(ledger.confirmed||[]),args.cutId];const remainingStock={...stock};for(const [m,t] of Object.entries(check.totals))remainingStock[m]-=t.newSheets;
 return {ledger,stock:remainingStock,movements,result:{...classified,sheets}};
}
root.OtCutPosting={commit};
})(globalThis);