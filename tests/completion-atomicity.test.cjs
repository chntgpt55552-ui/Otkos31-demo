const {test}=require('node:test');
const assert=require('node:assert/strict');
require('../brigade-work.js');
require('../object-stock.js');
require('../brigade-completion.js');
function fixture(){
 globalThis.otMaterialCore={units:m=>[{name:m.unit,factor:1}]};
 const work={id:'w1',orderId:'o1',qty:10,unit:'м',name:'Откосы'};
 const brigade={id:'b1',name:'Бригада'};
 const plan=OtBrigadeWork.allocate({work,assignments:[{brigadeId:'b1',qty:10}],brigadeIds:['b1']});
 const material={id:'m1',name:'Панель',unit:'м²'};
 const reporter=journal=>({issues:journal.reduce((n,t)=>n+(t.kind==='stockOut'?t.qty:0),0)>5?['Недостаток материала']:[]});
 return {work,brigade,plan,event:{id:'e1',workId:'w1',brigadeId:'b1',qty:4,date:'2026-11-27'},rate:300,events:[],journal:[],materials:[{material,unit:'м²',qty:2}],stockMaterials:[material],reporter};
}
test('completion prepares linked wage and material without mutating input',()=>{
 const f=fixture(),before=JSON.stringify(f);
 const p=OtBrigadeCompletion.prepare(f);
 assert.equal(p.accrualPreview.amount,1200);
 assert.equal(p.materialEntries.length,1);
 assert.equal(p.materialEntries[0].orderId,'o1');
 assert.equal(p.materialEntries[0].completionId,'e1');
 assert.equal(JSON.stringify(f),before);
 assert.throws(()=>OtBrigadeCompletion.prepare({...f,events:p.events}));
 assert.throws(()=>OtBrigadeCompletion.prepare({...f,journal:p.materialEntries}));
});
test('second material shortage leaves all original inputs unchanged',()=>{
 const f=fixture();
 f.materials.push({...f.materials[0],qty:4});
 const before=JSON.stringify(f);
 assert.throws(()=>OtBrigadeCompletion.prepare(f),/Недостаток/);
 assert.equal(JSON.stringify(f),before);
});
test('completion cannot exceed assigned quantity',()=>{
 const f=fixture();
 assert.throws(()=>OtBrigadeCompletion.prepare({...f,event:{...f.event,qty:11}}),/Превышен/);
});

test('linked completion cannot be repeated even without material lines',()=>{
 const f=fixture();
 const p=OtBrigadeCompletion.prepare(f);
 assert.throws(()=>OtBrigadeCompletion.prepare({...f,materials:[],journal:p.materialEntries}),/Исполнение уже проведено/);
});
