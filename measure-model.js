/* Shared measurement model, issue #3. */
(function(root){
'use strict';
const modes=['simple','advanced','custom'];
function normalize(w){
 const mode=w.mode??'advanced';
 if(!modes.includes(mode))throw Error('Неизвестный режим замера');
 if(!Array.isArray(w.parts))throw Error('Нет деталей окна');
 return {...w,mode,parts:w.parts.map((p,i)=>({...p,id:p.id??String(w.id)+':'+i,geometry:p.geometry??(/арка/i.test(p.side)?(/полуарка/i.test(p.side)?'halfarch':'arch'):'straight'),pieces:p.pieces?.map(x=>({...x}))}))};
}
function simpleParts(width,height,depth,bottom=false){
 if(![width,height,depth].every(n=>Number.isFinite(n)&&n>0))throw Error('Укажите размеры окна');
 return [['Левая',height],['Правая',height],['Верхняя',width],...(bottom?[['Нижняя',width]]:[])].map(([side,length])=>({side,length,depth,geometry:'straight'}));
}
function specification(w,expand){
 w=normalize(w);
 if(!Number.isInteger(w.count)||w.count<1||w.count>1000)throw Error('Некорректное количество окон');
 if(w.mode!=='custom'&&w.parts.some(p=>p.enabled!==false&&p.length>3000))throw Error('Для стороны длиннее 3000 мм используйте конструктор');
 return w.parts.filter(p=>p.enabled!==false).flatMap(p=>expand(p).map(x=>({windowId:w.id,partId:p.id,side:p.side,geometry:p.geometry,segment:x.segment,length:x.length,depth:x.depth,count:w.count,area:x.length*x.depth*w.count/1e6,linear:x.length*w.count/1000})));
}
function constructorNodes(w,idFactory){
 const parts=w.parts||[],find=s=>parts.find(p=>p.side===s);
 const top=find('Верхняя'),right=find('Правая'),bottom=find('Нижняя'),left=find('Левая');
 if(!top||!right||!left||parts.length!==(bottom?4:3)||parts.some(p=>p.geometry&&p.geometry!=='straight')||left.length!==right.length||(bottom&&bottom.length!==top.length))throw Error('Для сложного контура задайте узлы вручную; исходные размеры сохранены');
 if(![top.length,left.length].every(n=>Number.isFinite(n)&&n>0))throw Error('Укажите размеры окна');
 return [[0,0,top],[top.length,0,right],[top.length,left.length,bottom],[0,left.length,left]].map(([x,y,p])=>({id:idFactory(),x,y,depth:p?.depth??top.depth,enabled:!!p&&p.enabled!==false,pieces:p?.pieces?.map(s=>({...s}))}));
}
const api={normalize,simpleParts,specification,constructorNodes};
if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.OtMeasurementModel=api;
})(globalThis);
