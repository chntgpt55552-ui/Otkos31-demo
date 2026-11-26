/* Custom contour geometry, millimetres. */
(function(root){
'use strict';
function contour(nodes){
 if(!Array.isArray(nodes)||nodes.length<3)throw Error('Минимум три узла');
 const parts=nodes.map((a,i)=>{
 const b=nodes[(i+1)%nodes.length];
 if(![a.x,a.y,b.x,b.y].every(Number.isFinite))throw Error('Некорректные координаты');
 const chord=Math.hypot(b.x-a.x,b.y-a.y);
 if(chord<=0)throw Error('Совпадающие узлы');
 const rise=a.rise??0;
 if(!Number.isFinite(rise))throw Error('Некорректная высота дуги');
 const h=Math.abs(rise),radius=h?chord*chord/(8*h)+h/2:null;
 const angle=h?4*Math.atan2(2*h,chord):0;
 return {id:a.id??String(i),side:'Деталь '+(i+1),geometry:h?'arch':'straight',length:h?radius*angle:chord,depth:a.depth,enabled:a.enabled!==false,pieces:a.pieces,from:{x:a.x,y:a.y},to:{x:b.x,y:b.y},rise,radius,angle};
 });
 return parts;
}
const api={contour};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.OtCustomContour=api;
})(globalThis);
