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


test('pending whole sheets exclude posted purchases, other materials and locations',()=>{
 require('../cutting-stock.js');
 const pendingSheets=globalThis.OtCutStock.pendingSheets;
 const material={id:'white'};
 const row=(q,extra={})=>({kind:'purchase',done:false,materialId:'white',location:'main',q,...extra});
 const journal=[row(2),row(0.5),row(0.5),row(9,{done:true}),row(8,{materialId:'other'}),row(7,{location:'car'}),row(6,{kind:'return'})];
 const args={journal,material,location:'main',baseQuantity:t=>t.q};
 assert.equal(pendingSheets(args),2);
 assert.throws(()=>pendingSheets({...args,journal:[row(-1)]}));
 assert.throws(()=>pendingSheets({...args,journal:[row(NaN)]}));
});


test('7200 mm requires manual segmentation and preserves total length and area',()=>{
 for(const mode of ['simple','advanced']) assert.throws(()=>model.specification(make(7200,mode),geometry.expand),/конструктор/);
 const w=make(7200,'advanced');
 w.parts[2].pieces=[{length:3000,depth:250},{length:3000,depth:250},{length:1200,depth:250}];
 let i=0;
 const parts=contour.contour(model.constructorNodes(w,()=>String(++i)));
 const spec=model.specification({...w,mode:'custom',parts},geometry.expand);
 assert.deepEqual(spec.map(p=>p.length),[3000,3000,1200,1400,1400]);
 assert.equal(spec.reduce((n,p)=>n+p.length,0),10000);
 assert.equal(spec.reduce((n,p)=>n+p.length*p.depth,0),2500000);
 const result=require('../cutting-engine.js').pack(spec,{width:3000,height:1500});
 assert.equal(result.unplaced.length,0);
 assert.equal(result.sheets.flatMap(s=>s.parts).reduce((n,p)=>n+p.length*p.depth,0),2500000);
});


test('allocation conserves stock across orders for every small inventory combination',()=>{
 require('../cutting-stock.js');
 const {allocate}=globalThis.OtCutStock;
 for(let available=0;available<=5;available++)for(let incoming=0;incoming<=5;incoming++)
 for(let a=0;a<=5;a++)for(let b=0;b<=5;b++){
  const demands=[{orderId:'a',required:a},{orderId:'b',required:b}];
  const rows=allocate({available,incoming,demands});
  const sum=k=>rows.reduce((n,r)=>n+r[k],0);
  assert.equal(sum('onHand'),Math.min(available,a+b));
  assert.equal(sum('expected'),Math.min(incoming,Math.max(0,a+b-available)));
  assert.equal(sum('toPurchase'),Math.max(0,a+b-available-incoming));
  for(const row of rows)assert.equal(row.onHand+row.expected+row.toPurchase,row.required);
 }
});
