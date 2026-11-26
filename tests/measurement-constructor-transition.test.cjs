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

test('manual segments replace parent in specification without double counting',()=>{
 const w=make(4200,'advanced');
 w.parts[2].pieces=[{length:2200,depth:250},{length:2000,depth:300}];
 let i=0;const parts=contour.contour(model.constructorNodes(w,()=>String(++i)));
 const spec=model.specification({...w,count:2,mode:'custom',parts},geometry.expand);
 assert.equal(spec.length,4);
 assert.equal(spec.reduce((n,p)=>n+p.linear,0),14);
 assert.ok(Math.abs(spec.reduce((n,p)=>n+p.area,0)-3.7)<1e-9);
 assert.ok(spec.every(p=>p.length<=3000));
});
test('invalid manual segmentation cannot reach specification',()=>{
 for(const pieces of [[{length:3100},{length:1100}],[{length:2000},{length:2000}]]){
 const w=make(4200,'custom');w.parts[2].pieces=pieces;
 assert.throws(()=>model.specification(w,geometry.expand));
 }
});

test('cutting receives only final pieces with correct multiplicity',()=>{
 const w=make(4200,'advanced');
 w.parts[2].pieces=[{length:2200,depth:250},{length:2000,depth:300}];
 let i=0;const parts=contour.contour(model.constructorNodes(w,()=>String(++i)));
 const spec=model.specification({...w,count:2,mode:'custom',parts},geometry.expand);
 const result=require('../cutting-engine.js').pack(spec,{width:3000,height:1500});
 assert.equal(result.unplaced.length,0);
 const placed=result.sheets.flatMap(s=>s.parts);
 assert.equal(placed.length,8);
 assert.ok(placed.every(p=>p.length<=3000));
 assert.equal(placed.reduce((n,p)=>n+p.length*p.depth,0),3700000);
});

test('whole sheet shortage distinguishes physical stock from incoming purchases',()=>{
 require('../cutting-stock.js');
 const shortage=globalThis.OtCutStock.shortage;
 assert.deepEqual(shortage({required:10,available:4,incoming:2}),{missing:6,toPurchase:4});
 assert.deepEqual(shortage({required:10,available:4,incoming:8}),{missing:6,toPurchase:0});
 assert.deepEqual(shortage({required:3,available:4}),{missing:0,toPurchase:0});
 assert.throws(()=>shortage({required:3,available:1.5}));
 assert.throws(()=>shortage({required:3,available:1,incoming:-1}));
});

test('allocation never assigns the same sheet twice',()=>{
 require('../cutting-stock.js');
 const allocate=globalThis.OtCutStock.allocate;
 const rows=allocate({available:5,incoming:3,demands:[{orderId:'a',required:4},{orderId:'b',required:3},{orderId:'c',required:5}]});
 assert.deepEqual(rows.map(r=>[r.onHand,r.expected,r.toPurchase]),[[4,0,0],[1,2,0],[0,1,4]]);
 assert.throws(()=>allocate({available:5,demands:[{orderId:'a',required:1},{orderId:'a',required:2}]}));
 assert.deepEqual(allocate({available:0,demands:[]}),[]);
});
