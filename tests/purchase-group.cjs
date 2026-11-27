const assert=require('node:assert/strict');
require('../cutting-stock.js');
const group=globalThis.OtCutStock.purchaseGroup;
const journal=[];
const needs={issues:[],rows:[{id:'a',deficit:3},{id:'b',deficit:2}]};
const line=(id,materialId,qty)=>({id,materialId,qty,kind:'purchase',done:false,paid:false,counterparty:'Supplier',location:'Warehouse',date:'2026-11-27',amount:100});
const args={journal,needs,requestId:'request-1',supplier:'Supplier',lines:[line('1','a',3),line('2','b',2)],baseQuantity:t=>t.qty};
const result=group(args);
assert.equal(result.length,2);
assert.ok(result.every(t=>t.purchaseGroupId==='request-1'));
assert.equal(journal.length,0);
assert.throws(()=>group({...args,journal:result}),/уже создана/);
assert.throws(()=>group({...args,lines:[line('1','a',3),line('2','b',3)]}),/Потребность/);
assert.throws(()=>group({...args,lines:[line('1','a',1),line('2','a',1)]}));
assert.throws(()=>group({...args,lines:[line('1','a',1),line('1','b',1)]}));
assert.throws(()=>group({...args,lines:[{...line('1','a',1),counterparty:'Other'}]}));
assert.throws(()=>group({...args,needs:{issues:['bad'],rows:[]}}));
assert.equal(journal.length,0);
const covered={issues:[],rows:[{id:'a',deficit:0},{id:'b',deficit:0}]};
assert.throws(()=>group({...args,journal:result,needs:covered,requestId:'request-2',lines:[line('3','a',3)]}),/Потребность/);
const partial=group({...args,journal:result,needs:{issues:[],rows:[{id:'a',deficit:1}]},requestId:'request-3',lines:[line('4','a',1)]});
assert.equal(partial.length,3);
assert.equal(result.length,2);
console.log('Purchase group regression passed');

for(const deficit of [NaN,Infinity,undefined,-1,0]) assert.throws(()=>group({...args,needs:{issues:[],rows:[{id:'a',deficit}]},lines:[line('1','a',1)]}),/Потребность/);

for(const id of ['', '   ', null]) assert.throws(()=>group({...args,lines:[line(id,'a',1)]}),/Некорректная позиция/);
