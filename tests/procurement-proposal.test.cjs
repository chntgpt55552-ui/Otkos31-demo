const test=require('node:test');
const assert=require('node:assert/strict');
require('../procurement-proposal.js');
const propose=globalThis.OtProcurementProposal.propose;
const row=(overrides={})=>({materialId:'foam',location:'main',unit:'шт',missing:10,expected:0,orderId:'a',...overrides});
const offer=(materialId='foam',supplierId='s1')=>({materialId,supplierId,preferred:true});
test('expected purchase covers shortage without another request',()=>{
 assert.deepEqual(propose({shortages:[row({expected:10})],suppliers:[offer()]}),{requests:[],unassigned:[]});
});
test('only uncovered quantity is proposed',()=>{
 const r=propose({shortages:[row({expected:4})],suppliers:[offer()]});
 assert.equal(r.requests[0].items[0].qty,6);
});
test('one supplier request contains separate material positions',()=>{
 const r=propose({shortages:[row(),row({materialId:'glue'})],suppliers:[offer(),offer('glue')]});
 assert.equal(r.requests.length,1);assert.equal(r.requests[0].items.length,2);
});
test('different suppliers get separate requests',()=>{
 const r=propose({shortages:[row(),row({materialId:'glue'})],suppliers:[offer(),offer('glue','s2')]});
 assert.equal(r.requests.length,2);
});
test('missing preferred supplier remains unassigned',()=>{
 const r=propose({shortages:[row()],suppliers:[]});
 assert.equal(r.requests.length,0);assert.equal(r.unassigned[0].qty,10);
});
test('incompatible units cannot be silently merged',()=>{
 assert.throws(()=>propose({shortages:[row(),row({unit:'кг',orderId:'b'})],suppliers:[offer()]}),/Несовместимые/);
});
