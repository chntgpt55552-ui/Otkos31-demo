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
const api={normalize,simpleParts,specification};
if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.OtMeasurementModel=api;
})(globalThis);
