/* Segment editor for expanded measurements, issue #3. */
(function(root){
'use strict';
function mount(container,part,onChange=()=>{}){
 const doc=container.ownerDocument;
 function el(tag,label,parent=container){const e=doc.createElement(tag);e.textContent=label;parent.append(e);return e}
 function render(){
 container.replaceChildren();
 const pieces=part.pieces||[];
 const status=el('p','');
 function validate(){try{root.OtMeasureGeometry.expand(part);status.textContent='Размеры согласованы';return true}catch(e){status.textContent=e.message;return false}}
 function change(){validate();onChange(part)}
 pieces.forEach((p,i)=>{
 const row=el('section','');
 el('strong','Составляющая '+(i+1),row);
 for(const [key,label] of [['length','Длина, мм'],['depth','Глубина, мм']]){
 const l=el('label',label,row),input=el('input','',l);input.type='number';input.min='1';if(key==='length')input.max='3000';input.value=p[key]??part.depth;input.oninput=()=>{p[key]=Number(input.value);change()};
 }
 const remove=el('button','Удалить',row);remove.type='button';remove.onclick=()=>{pieces.splice(i,1);render();change()};
 });
 const add=el('button',pieces.length?'Добавить составляющую':'Разбить деталь');add.type='button';add.onclick=()=>{if(!part.pieces)part.pieces=[];const remaining=part.length-part.pieces.reduce((s,p)=>s+p.length,0);part.pieces.push({length:Math.max(0,Math.min(3000,remaining)),depth:part.depth});render();change()};
 if(pieces.length){const last=el('button','Рассчитать последнюю по остатку');last.type='button';last.onclick=()=>{try{pieces[pieces.length-1].length=root.OtMeasureGeometry.remainder(part.length,pieces.slice(0,-1).map(p=>p.length));render();change()}catch(e){status.textContent=e.message}}}
 validate();
 }
 render();return {refresh:render};
}
root.OtMeasureSegmentEditor={mount};
})(globalThis);
