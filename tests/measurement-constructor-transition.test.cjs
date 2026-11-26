const test=require('node:test');
const assert=require('node:assert/strict');
const model=require('../measure-model.js');
const geometry=require('../measure-geometry.js');
const contour=require('../measure-custom-contour.js');
const make=(width,mode)=>({id:'w',count:1,mode,parts:model.simpleParts(width,1400,250)});
test('3000 mm allowed, 3001 requires constructor',()=>{
 for(const mode of ['simple','advanced']){
 assert.equal(model.specification(make(3000,mode),geometry.expand).length,3);
 assert.throws(()=>model.specification(make(3001,mode),geometry.expand),/конструктор/);
 }
});
test('constructor preserves rectangle and individual depths',()=>{
 const w=make(4200,'advanced');w.parts[0].depth=280;w.parts[2].pieces=[{length:3000,depth:250},{length:1200,depth:260}];
 let i=0;const nodes=model.constructorNodes(w,()=>String(++i));
 const parts=contour.contour(nodes);
 const spec=model.specification({...w,mode:'custom',parts},geometry.expand);
 assert.deepEqual(spec.map(p=>[p.length,p.depth]),[[3000,250],[1200,260],[1400,250],[1400,280]]);
});
test('complex geometry cannot silently become rectangle',()=>{
 const w=make(4200,'advanced');w.parts[2].geometry='arch';
 assert.throws(()=>model.constructorNodes(w,()=> 'id'),/сложного контура/);
});
