(function(root){
'use strict';
function classify(result,{minLength=300,minDepth=100}={}){
 if(![minLength,minDepth].every(n=>Number.isFinite(n)&&n>0))throw Error('Укажите минимальные размеры остатка');
 return {...result,sheets:result.sheets.map((s,i)=>({...s,free:s.free.map((r,j)=>({...r,key:(i+1)+':'+(j+1),usable:r.w>=minLength&&r.h>=minDepth,material:s.material}))}))};
}
function register(result,ledger,orderId,cutId){
 if(!orderId||!cutId)throw Error('Нет идентификатора раскроя');
 if(!Number.isSafeInteger(ledger.next)||ledger.next<1||!Array.isArray(ledger.items))throw Error('Некорректный журнал остатков');
 const items=ledger.items.map(x=>({...x}));let next=1;const active=x=>!['used','writtenOff','split'].includes(x.status);const allocate=()=>{let n=1;while(items.some(x=>active(x)&&x.number===n))n++;return n};
 const sheets=result.sheets.map((s,i)=>({...s,free:s.free.map(r=>{if(!r.usable)return {...r,number:null};const key=JSON.stringify([orderId,cutId,r.key]);let item=items.find(x=>x.key===key);if(item&&(item.width!==r.w||item.height!==r.h||item.material!==s.material))throw Error('Раскрой изменился: создайте новую редакцию');if(!item){item={key,number:allocate(),orderId,cutId,sheet:i+1,width:r.w,height:r.h,material:s.material,status:'available'};items.push(item)}return {...r,number:item.number}})}));
 return {result:{...result,sheets},ledger:{...ledger,next:Math.max(1,...items.map(x=>x.number+1)),items}};
}
function writeOff(ledger,key,{reason='Некондиция',rect=null,eventId}={}){
 if(!eventId)throw Error('Нет идентификатора операции');
 if((ledger.events||[]).some(e=>e.id===eventId))return ledger;
 const items=ledger.items.map(x=>({...x})),p=items.find(x=>x.key===key);
 if(!p||p.status!=='available')throw Error('Остаток недоступен для списания');
 const children=[];let area=p.width*p.height;
 if(rect){const {x,y,w,h}=rect;if(![x,y,w,h].every(Number.isFinite)||x<0||y<0||w<=0||h<=0||x+w>p.width||y+h>p.height)throw Error('Участок вне остатка');
 area=w*h;const pieces=[[0,0,p.width,y],[0,y+h,p.width,p.height-y-h],[0,y,x,h],[x+w,y,p.width-x-w,h]].filter(a=>a[2]>0&&a[3]>0);
 p.status='split';for(const [i,[x,y,width,height]] of pieces.entries()){let number=1;while(items.some(a=>!['used','writtenOff','split'].includes(a.status)&&a.number===number))number++;const child={...p,key:JSON.stringify([key,eventId,i]),parentKey:key,number,width,height,x,y,status:'available'};items.push(child);children.push(child.key)}
 }else p.status='writtenOff';
 return {...ledger,items,events:[...(ledger.events||[]),{id:eventId,key,number:p.number,reason,rect,area,children,date:new Date().toISOString(),material:p.material,location:p.location||null,kind:rect?'partial':'full',width:p.width,height:p.height}]};
}
const api={classify,register,writeOff};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.OtCuttingRemnants=api;
})(globalThis);