(function(root){
'use strict';
function entries(posting,{materials,bindings,orderId,date,location}){
 if(!orderId||!location||!/^\d{4}-\d{2}-\d{2}$/.test(date))throw Error('Укажите заказ, дату и склад');
 return posting.movements.map(m=>{
 const material=materials.find(x=>x.id===bindings[m.material]);if(!material)throw Error('Не сопоставлен материал: '+m.material);
 const unit=root.otMaterialCore.units(material).find(u=>u.name==='м²'||u.name==='м2');if(!unit)throw Error('Для материала нужна единица площади');
 if(m.orderId!==orderId||!Number.isFinite(m.area)||m.area<=0||!['detail','cutWaste'].includes(m.kind))throw Error('Некорректное списание');
 return {id:'cut:'+m.id,kind:'stockOut',orderId,materialId:material.id,materialBaseUnit:material.unit,materialFactor:unit.factor,unit:unit.name,qty:m.area,price:m.unitCost,amount:Math.round(m.amount*100)/100,location,date,done:true,name:material.name,category:'Списание со склада',comment:m.kind==='cutWaste'?'Отходы раскроя':'Детали раскроя',cutMovement:m.kind};
 });
}
root.OtCutJournal={entries};
})(globalThis);