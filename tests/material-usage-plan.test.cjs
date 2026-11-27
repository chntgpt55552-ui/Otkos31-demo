const {test}=require('node:test');
const assert=require('node:assert/strict');
require('../material-usage-plan.js');
const work={id:'w',orderId:'o',qty:40};
const row={workId:'w',orderId:'o',materialId:'foam',unit:'баллон',qty:20};
const propose=(patch={})=>globalThis.OtMaterialUsagePlan.propose({work,completed:0,quantity:10,specification:[row],actual:[],...patch});
test('first stage consumes proportional quantity',()=>assert.equal(propose()[0].qty,5));
test('next stage accounts for actual previous overuse',()=>assert.equal(propose({completed:10,actual:[{...row,qty:6,kind:'stockOut',done:true} ]})[0].qty,4));
test('final stage uses remaining specification',()=>assert.equal(propose({completed:30,actual:[{...row,qty:14,kind:'stockOut',done:true} ]})[0].qty,6));
test('excludes customer materials, cutting sources and unrelated works',()=>assert.deepEqual(propose({specification:[{...row,customerOwned:true},{...row,cutSource:true},{...row,workId:'other'}]}),[]));
test('already consumed material never generates negative usage',()=>assert.deepEqual(propose({actual:[{...row,qty:8,kind:'stockOut',done:true}]}),[]));
test('rejects excess work and invalid specification',()=>{assert.throws(()=>propose({completed:35}));assert.throws(()=>propose({specification:[{...row,qty:-1}]}));});
test('prepared material remains distinct from raw material',()=>assert.equal(propose({specification:[row,{...row,prepared:true}]}).length,2));
test('pending stock and damage do not count as productive consumption',()=>assert.equal(propose({actual:[{...row,qty:2,kind:'stockOut',done:false},{...row,qty:2,kind:'stockOut',done:true,materialAction:'damage'}]})[0].qty,5));

test('actual prepared consumption uses production journal marker',()=>assert.equal(propose({specification:[{...row,prepared:true}],actual:[{...row,qty:2,kind:'stockOut',done:true,preparedConsumption:true} ]})[0].qty,3));
