(function(root){
'use strict';
function valueMovement({area,unitCost,kind,orderId=null}){
 if(!Number.isFinite(area)||area<=0||!Number.isFinite(unitCost)||unitCost<0)throw Error('Некорректная площадь или себестоимость');
 if(!['detail','cutWaste','storageLoss','orderDamage'].includes(kind))throw Error('Неизвестная операция');
 const orderExpense=kind!=='storageLoss';if(orderExpense&&!orderId)throw Error('Укажите заказ');
 return {kind,orderId:orderExpense?orderId:null,area,unitCost,amount:area*unitCost,stockDelta:-area,cashDelta:0,category:orderExpense?'Себестоимость материалов':'Потери материалов'};
}
function cuttingValue({sourceArea,detailArea,remnantArea,unitCost,orderId}){
 if(![sourceArea,detailArea,remnantArea,unitCost].every(n=>Number.isFinite(n)&&n>=0)||sourceArea<=0||!orderId)throw Error('Некорректный раскрой');
 const waste=sourceArea-detailArea-remnantArea;if(waste< -1e-8)throw Error('Нарушен баланс площади');
 const wasteArea=Math.max(0,waste),movements=[];
 if(detailArea>0)movements.push(valueMovement({area:detailArea,unitCost,kind:'detail',orderId}));
 if(wasteArea>0)movements.push(valueMovement({area:wasteArea,unitCost,kind:'cutWaste',orderId}));
 return {movements,sourceValue:sourceArea*unitCost,retainedValue:remnantArea*unitCost,orderCost:movements.reduce((n,m)=>n+m.amount,0),wasteArea,unitCost};
}
const api={valueMovement,cuttingValue};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.OtMaterialCost=api;
})(globalThis);