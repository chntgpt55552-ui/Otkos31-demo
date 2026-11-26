(function(root){
'use strict';
function shape(){return root.OtRemnantShape||(typeof require==='function'?require('./cutting-remnant-shape.js'):null)}
function classify(result,{minLength=300,minDepth=100}={}){
 if(![minLength,minDepth].every(n=>Number.isFinite(n)&&n>0))throw Error('Укажите минимальные размеры остатка');
 return {...result,sheets:result.sheets.map((s,i)=>({...s,free:shape().components(s.free).map((r,j)=>({...r,w:r.width,h:r.height,key:(i+1)+':'+(j+1),usable:r.cells.some(c=>c.w>=minLength&&c.h>=minDepth),material:s.material}))}))};
}
function register(result,ledger,orderId,cutId){
 if(!orderId||!cutId)throw Error('Нет идентификатора раскроя');
 if(!Number.isSafeInteger(ledger.next)||ledger.next<1||!Array.isArray(ledger.items))throw Error('Некорректный журнал остатков');
 const items=ledger.items.map(x=>({...x}));let next=1;const active=x=>!['used','writtenOff','split'].includes(x.status);const allocate=()=>{let n=1;while(items.some(x=>active(x)&&x.number===n))n++;return n};
 const sheets=result.sheets.map((s,i)=>({...s,free:s.free.map(r=>{if(!r.usable)return {...r,number:null};const key=JSON.stringify([orderId,cutId,r.key]);let item=items.find(x=>x.key===key);if(item&&(item.width!==r.w||item.height!==r.h||item.material!==s.material))throw Error('Раскрой изменился: создайте новую редакцию');if(!item){item={key,number:allocate(),orderId,cutId,sheet:i+1,width:r.w,height:r.h,cells:r.cells,area:r.area,material:s.material,status:'available'};items.push(item)}return {...r,number:item.number}})}));
 return {result:{...result,sheets},ledger:{...ledger,next:Math.max(1,...items.map(x=>x.number+1)),items}};
}
function writeOff(ledger,key,{reason='Некондиция',rect=null,eventId}={}){
 if(!eventId)throw Error('Нет идентификатора операции');
 if((ledger.events||[]).some(e=>e.id===eventId))return ledger;
 const items=ledger.items.map(x=>({...x})),p=items.find(x=>x.key===key);
 if(!p||p.status!=='available')throw Error('Остаток недоступен для списания');
 const children=[];const cells=p.cells||[{x:0,y:0,w:p.width,h:p.height}];let area=cells.reduce((n,c)=>n+c.w*c.h,0);
 if(rect){const {x,y,w,h}=rect;if(![x,y,w,h].every(Number.isFinite)||x<0||y<0||w<=0||h<=0||x+w>p.width||y+h>p.height)throw Error('Участок вне остатка');
 const remaining=[];let removed=0;for(const c of cells){const x1=Math.max(x,c.x),y1=Math.max(y,c.y),x2=Math.min(x+w,c.x+c.w),y2=Math.min(y+h,c.y+c.h);if(x2<=x1||y2<=y1){remaining.push(c);continue}removed+=(x2-x1)*(y2-y1);remaining.push(...[{x:c.x,y:c.y,w:c.w,h:y1-c.y},{x:c.x,y:y2,w:c.w,h:c.y+c.h-y2},{x:c.x,y:y1,w:x1-c.x,h:y2-y1},{x:x2,y:y1,w:c.x+c.w-x2,h:y2-y1}].filter(r=>r.w>0&&r.h>0))}if(!removed)throw Error('Нет материала в участке');area=removed;const pieces=shape().components(remaining).sort((a,b)=>b.area-a.area);p.status=pieces.length?'split':'writtenOff';for(const [i,r] of pieces.entries()){let number=i===0?p.number:1;while(items.some(a=>!['used','writtenOff','split'].includes(a.status)&&a.number===number))number++;const child={...p,...r,key:JSON.stringify([key,eventId,i]),parentKey:key,number,status:'available'};items.push(child);children.push(child.key)}
 }else p.status='writtenOff';
 return {...ledger,items,events:[...(ledger.events||[]),{id:eventId,key,number:p.number,reason,rect,area,children,date:new Date().toISOString(),material:p.material,location:p.location||null,kind:rect?'partial':'full',width:p.width,height:p.height}]};
}
const api={classify,register,writeOff};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.OtCuttingRemnants=api;
})(globalThis);