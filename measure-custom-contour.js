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
 const poly=[];
 for(const p of parts){
 const a=p.from,b=p.to,dx=b.x-a.x,dy=b.y-a.y,c=Math.hypot(dx,dy);
 if(!p.radius){poly.push(a);continue}
 const h=Math.abs(p.rise),sign=Math.sign(p.rise),nx=-dy/c,ny=dx/c;
 const cx=(a.x+b.x)/2+sign*nx*(p.radius-h),cy=(a.y+b.y)/2+sign*ny*(p.radius-h);
 const start=Math.atan2(a.y-cy,a.x-cx),steps=Math.max(16,Math.ceil(p.angle/0.025));
 for(let j=0;j<steps;j++){const t=start+sign*p.angle*j/steps;poly.push({x:cx+p.radius*Math.cos(t),y:cy+p.radius*Math.sin(t)})}
 }
 const cross=(a,b,c)=>(b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x);
 const on=(a,b,c)=>Math.abs(cross(a,b,c))<1e-7&&c.x>=Math.min(a.x,b.x)-1e-7&&c.x<=Math.max(a.x,b.x)+1e-7&&c.y>=Math.min(a.y,b.y)-1e-7&&c.y<=Math.max(a.y,b.y)+1e-7;
 function intersects(a,b,c,d){const x=cross(a,b,c),y=cross(a,b,d),z=cross(c,d,a),w=cross(c,d,b);return (x*y<0&&z*w<0)||on(a,b,c)||on(a,b,d)||on(c,d,a)||on(c,d,b)}
 let area=0;for(let i=0;i<poly.length;i++){const a=poly[i],b=poly[(i+1)%poly.length];area+=a.x*b.y-b.x*a.y;for(let j=i+2;j<poly.length;j++){if(i===0&&j===poly.length-1)continue;if(intersects(a,b,poly[j],poly[(j+1)%poly.length]))throw Error('Контур пересекается')}}if(Math.abs(area)<1e-6)throw Error('Контур не имеет площади');
 return parts;
}
const api={contour};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.OtCustomContour=api;
})(globalThis);
