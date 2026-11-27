const {test,expect}=require('@playwright/test');
test.use({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
test('mobile navigation and calendar',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:8080/');
 const nav=page.locator('#ot-module-nav');
 await nav.locator('[data-module=home]').click();
 await expect(page.locator('#ot-module-page')).toBeVisible();
 await expect(page.locator('.home-cal-grid button')).toHaveCount(new Date(new Date().getFullYear(),new Date().getMonth()+1,0).getDate());
 await expect(page.locator('#ot-module-page')).not.toContainText('Ошибка главного экрана');
 for(const id of ['finance','stock','directories','home','orders']){
 await nav.locator('[data-module='+id+']').click();
 await expect(nav.locator('[data-module='+id+']')).toHaveAttribute('aria-current','true');
 }
 await expect(page.locator('#ot-module-page')).toBeHidden();
 expect(errors).toEqual([]);
});

test('order card and reminder survive reload',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:8080/');
 const order=page.locator('[data-orders-open]').first();
 await expect(order).toBeVisible();
 const id=await order.getAttribute('data-orders-open');
 await order.click();
 await expect(page.locator('#ot-order-card')).toBeVisible();
 await page.locator('#oc-reminders summary').click();
 await page.locator('#oc-reminders button').filter({hasText:'+ Напоминание'}).click();
 const dialog=page.locator('dialog[open]');
 await dialog.locator('input[type=text]').first().fill('Smoke reminder');
 await dialog.locator('input[type=datetime-local]').fill('2027-01-15T10:00');
 await dialog.getByRole('button',{name:'Сохранить',exact:true}).click();
 await expect(page.locator('#oc-reminders')).toContainText('Smoke reminder');
 await page.reload();
 await expect(page.locator('#ot-order-card')).toBeVisible();
 await expect(page.locator('#oc-reminders')).toContainText('Smoke reminder');
 await page.goBack();
 await expect(page.locator('#ot-order-card')).toBeHidden();
 await expect(page.locator('[data-orders-open="'+id+'"]')).toBeVisible();
 expect(errors).toEqual([]);
});

test('order tree toggles and finance preview',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:8080/');
 const row=page.locator('[data-orders-open]').first();
 await expect(row).toBeVisible();
 const id=await row.getAttribute('data-orders-open');
 const kids=page.locator('[data-orders-kids="'+id+'"]');
 const initial=await kids.textContent();
 await kids.click();
 await expect(kids).not.toHaveText(initial);
 await kids.click();
 await expect(kids).toHaveText(initial);
 const finance=page.locator('[data-orders-finance="'+id+'"]');
 await finance.click();
 await expect(finance).toHaveClass(/az-active/);
 await expect(finance.locator('../..').locator('.az-branch-contents').first()).toBeVisible();
 await finance.click();
 await expect(finance).not.toHaveClass(/az-active/);
 expect(errors).toEqual([]);
});

test('transaction editor opens and browser back cancels',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:8080/');
 await page.locator('[data-orders-open]').first().click();
 await page.locator('[data-oc-route="quick:payment"]').click();
 await expect(page.locator('#az-modal')).toHaveClass(/az-visible/);
 await expect(page.locator('#az-modal-content #az-name')).toBeVisible();
 await page.goBack();
 await expect(page.locator('#az-modal')).not.toHaveClass(/az-visible/);
 await page.goBack();
 await expect(page.locator('#ot-order-card')).toBeVisible();
 expect(errors).toEqual([]);
});

test('PWA service worker and offline reload',async({page,context})=>{
 await page.goto('http://127.0.0.1:8080/');
 await page.evaluate(async()=>{await navigator.serviceWorker.ready});
 await page.reload();
 await expect.poll(()=>page.evaluate(()=>!!navigator.serviceWorker.controller)).toBe(true);
 await context.setOffline(true);
 try{
 await page.reload();
 await page.locator('#ot-module-nav [data-module=home]').click();
 await expect(page.locator('.home-cal-grid button').first()).toBeVisible();
 await expect(page.locator('#ot-module-page')).not.toContainText('Ошибка главного экрана');
 }finally{await context.setOffline(false)}
});

test('flat ledger separates accruals and payments',async({page})=>{
 await page.goto('http://127.0.0.1:8080/');
 await page.locator('[data-orders-open]').first().click();
 await page.locator('[data-oc-route="finance"]').click();
 await page.locator('#az-app [data-mode=list]').click();
 const headings=page.locator('#az-content .az-flat-heading');
 for(const name of ['Начисленная стоимость работ','Оплаты заказчиков','Начисления зарплаты','Выплаты зарплаты']){
 await expect(headings.filter({hasText:name})).toHaveCount(1);
 }
 await expect(headings.filter({hasText:/^Доходы/})).toHaveCount(0);
 await expect(headings.filter({hasText:/^Расходы/})).toHaveCount(0);
});

test('flat ledger subtotals reconcile with individual rows',async({page})=>{
 await page.goto('http://127.0.0.1:8080/');
 await page.locator('[data-orders-open]').first().click();
 await page.locator('[data-oc-route="finance"]').click();
 await page.locator('#az-app [data-mode=list]').click();
 const groups=page.locator('#az-content .az-flat-group');
 const parse=s=>Math.round(Number(s.replace(/[^0-9,.]/g,'').replace(',','.'))*100);
 for(const name of ['Начисленная стоимость работ','Оплаты заказчиков','Начисления зарплаты','Выплаты зарплаты']){
 const group=groups.filter({has:page.locator('.az-flat-heading').filter({hasText:name})});
 await expect(group).toHaveCount(1);
 const amounts=await group.locator('.az-tx .az-amount').allTextContents();
 const subtotal=parse(await group.locator('.az-flat-heading .az-num').textContent());
 expect(subtotal).toBe(amounts.reduce((a,v)=>a+parse(v),0));
 }
});

test('pending payment can be created and edited',async({page})=>{
 await page.goto('http://127.0.0.1:8080/');
 await page.locator('[data-orders-open]').first().click();
 await page.locator('[data-oc-route="quick:payment"]').click();
 await page.locator('#az-name').selectOption({index:1});
 await page.locator('#az-amount').fill('1234.56');
 await page.locator('#az-comment').fill('Smoke payment persistence');
 await page.locator('#az-save').click();
 await expect(page.locator('#az-modal')).not.toHaveClass(/az-visible/);
 await page.locator('#az-app [data-mode=list]').click();
 const row=page.locator('.az-tx').filter({hasText:/1[^0-9]*234[,.]56/}).first();
 await expect(row).toBeVisible();
 await row.locator('.az-grow').click();
 await expect(page.locator('#az-comment')).toHaveValue('Smoke payment persistence');
 await page.locator('#az-amount').fill('1235.67');
 await page.locator('#az-save').click();
 await expect(page.locator('#az-modal')).not.toHaveClass(/az-visible/);
 await page.reload();
 await page.locator('#az-app [data-mode=list]').click();
 await expect(page.locator('.az-tx').filter({hasText:/1[^0-9]*235[,.]67/}).first()).toBeVisible();
});

test('pending payment persists after reload',async({page})=>{
 await page.goto('http://127.0.0.1:8080/');
 await page.locator('[data-orders-open]').first().click();
 await page.locator('[data-oc-route="quick:payment"]').click();
 const before=await page.locator('#az-stats').innerText();
 const name=page.locator('#az-name');
 await name.selectOption({index:1});
 await page.locator('#az-amount').fill('1234.56');
 await page.locator('#az-save').click();
 await expect(page.locator('#az-modal')).not.toHaveClass(/az-visible/);
 await page.locator('#az-app [data-mode=list]').click();
 const payment=page.locator('.az-flat-group').filter({has:page.locator('.az-flat-heading').filter({hasText:'Оплаты заказчиков'})});
 const row=payment.locator('.az-tx').filter({hasText:/1\s?234[,.]56/});
 await expect(row).toHaveCount(1);
 expect(await page.locator('#az-stats').innerText()).toBe(before);
 await page.reload();
 await page.locator('#az-app [data-mode=list]').click();
 await expect(row).toHaveCount(1);
 await row.locator('.az-grow[data-edit]').click();
 await expect(page.locator('#az-modal')).toHaveClass(/az-visible/);
 await page.locator('#az-amount').fill('2345.67');
 await page.locator('#az-save').click();
 await expect(page.locator('#az-modal')).not.toHaveClass(/az-visible/);
 await expect(row).toHaveCount(0);
 await expect(payment.locator('.az-tx').filter({hasText:/2\s?345[,.]67/})).toHaveCount(1);
 expect(await page.locator('#az-stats').innerText()).toBe(before);
});

test('posted payment updates cash and debt exactly once',async({page})=>{
 await page.goto('http://127.0.0.1:8080/');
 await page.locator('[data-orders-open]').first().click();
 await page.locator('[data-oc-route="quick:payment"]').click();
 const stat=async label=>Math.round(Number((await page.locator('#az-stats .az-stat').filter({hasText:label}).locator('strong').innerText()).replace(/[^0-9,.]/g,'').replace(',','.'))*100);
 const received=await stat('Получено'), debt=await stat('Мне должны');
 await page.locator('#az-name').selectOption({index:1});
 await page.locator('#az-amount').fill('1234.56');
 await page.locator('#az-save').click();
 await expect(page.locator('#az-modal')).not.toHaveClass(/az-visible/);
 await page.locator('#az-app [data-mode=list]').click();
 const row=page.locator('.az-flat-group').filter({has:page.locator('.az-flat-heading').filter({hasText:'Оплаты заказчиков'})}).locator('.az-tx').filter({hasText:/1[^0-9]*234[,.]56/});
 await expect(row).toHaveCount(1);
 await row.locator('input[data-check]').check();
 await expect.poll(()=>stat('Получено')).toBe(received+123456);
 await expect.poll(()=>stat('Мне должны')).toBe(Math.max(0,debt-123456));
 await row.locator('.az-grow[data-edit]').click();
 await expect(page.locator('#az-modal')).toHaveClass(/az-visible/);
 const amount=page.locator('#az-amount');
 if(await amount.isEditable()){
 await amount.fill('2345.67');
 await page.locator('#az-save').click();
 await expect(page.locator('#az-error')).not.toBeEmpty();
 await expect(page.locator('#az-modal')).toHaveClass(/az-visible/);
 }else{
 await expect(amount).not.toBeEditable();
 }
 await page.goBack();
 await expect.poll(()=>stat('Получено')).toBe(received+123456);
 await expect.poll(()=>stat('Мне должны')).toBe(Math.max(0,debt-123456));

});

test('release cache replaces obsolete app cache without touching unrelated caches',async({page})=>{
 await page.goto('http://127.0.0.1:8080/');
 const source=await (await page.request.get('http://127.0.0.1:8080/sw.js')).text();
 const cacheName=source.match(/const CACHE='([^']+)'/)?.[1];
 expect(cacheName).toMatch(/^otkos31-demo-/);
 await page.evaluate(async()=>{
 await caches.open('otkos31-demo-obsolete-test');
 await caches.open('unrelated-test');
 const reg=await navigator.serviceWorker.ready;
 await reg.unregister();
 });
 await page.reload();
 await expect.poll(()=>page.evaluate(async(name)=>{const keys=await caches.keys();return keys.includes(name)&&!keys.includes('otkos31-demo-obsolete-test')&&keys.includes('unrelated-test')},cacheName)).toBe(true);
});

test('profit drilldown uses standard financial tree and list',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:8080/');
 await page.locator('[data-orders-open]').first().click();
 await page.locator('[data-oc-fin="profit"]').click();
 await expect(page.locator('#az-stats')).not.toContainText('операций');
 await expect(page.locator('#az-content .az-nodehead').first()).toBeVisible();
 await page.locator('#az-app [data-mode=list]').click();
 await expect(page.locator('#az-content .az-flat-group').first()).toBeVisible();
 await page.locator('#ot-clear-branch').click();
 await expect(page.locator('#az-stats')).toContainText('Получено');
 expect(errors).toEqual([]);
});

test('original transaction status opens partial execution dialog without posting on cancel',async({page})=>{
 await page.goto('http://127.0.0.1:8080/');
 const work=await page.evaluate(()=>window.otStockJournal().find(t=>t.kind==='accrual'&&!t.done&&Number(t.qty)>0));
 expect(work).toBeTruthy();
 await page.locator('[data-orders-open="'+work.orderId+'"]').click();
 await page.locator('[data-oc-route="finance"]').click();
 await page.locator('#az-app [data-mode=list]').click();
 await page.locator('#az-content .az-grow[data-edit="'+work.id+'"]').click();
 await page.locator('#az-status-toggle').click();
 await page.locator('#az-status-menu [data-status="confirmed"]').click();
 const dialog=page.locator('dialog[open]');
 await expect(dialog).toContainText('Подтверждение исполнения');
 await expect(dialog).toContainText('Бригада');
 await dialog.getByRole('button',{name:'Частично',exact:true}).click();
 await expect(dialog.locator('input[type=number]').first()).toHaveValue('');
 await dialog.getByRole('button',{name:'Закрыть',exact:true}).click();
 expect(await page.evaluate(id=>window.otStockJournal().find(t=>t.id===id).done,work.id)).toBeFalsy();
});

test('partial execution posts wage and persists after reload',async({page})=>{
 await page.goto('http://127.0.0.1:8080/');
 await page.evaluate(()=>{const key='otkos31_tx_directories_v1';const d=JSON.parse(window.otStorage.getItem(key)||'{}');d.brigadesV1=[{id:'test-crew',name:'Тестовая бригада',leader:'Монтажник',members:['Монтажник'],date:'2026-11-27',archived:false}];window.otStorage.setItem(key,JSON.stringify(d));});
 const work=await page.evaluate(()=>window.otStockJournal().find(t=>t.kind==='accrual'&&!t.done&&Number(t.qty)>0));
 await page.locator('[data-orders-open="'+work.orderId+'"]').click();
 await page.locator('[data-oc-route="finance"]').click();
 await page.locator('#az-app [data-mode=list]').click();
 await page.locator('#az-content .az-grow[data-edit="'+work.id+'"]').click();
 await page.locator('#az-status-toggle').click();
 await page.locator('#az-status-menu [data-status="confirmed"]').click();
 const dialog=page.locator('dialog[open]');
 await dialog.locator('select').selectOption('test-crew');
 await dialog.locator('input[type=number]').nth(0).fill(String(work.qty/2));
 await dialog.locator('input[type=number]').nth(1).fill('300');
 page.on('dialog',async d=>{if(d.type()==='confirm')await d.accept();else await d.dismiss();});
 await dialog.getByRole('button',{name:'Подтвердить и начислить'}).click();
 await expect(dialog).toHaveCount(0);
 await page.reload();
 const rows=await page.evaluate(w=>window.otStockJournal().filter(t=>String(t.orderId)===String(w.orderId)&&String(t.workId)===String(w.id)&&t.stageId),work);
 expect(rows).toHaveLength(1);
 expect(rows[0].qty).toBe(work.qty/2);
 expect(rows[0].amount).toBe(Math.round(work.qty/2*300*100)/100);
 expect(rows[0].paid).toBe(false);
});

test('control order: partial wage survives repeated reload without duplication',async({page})=>{
 await page.goto('http://127.0.0.1:8080/');
 await page.evaluate(()=>{const key='otkos31_tx_directories_v1';const d=JSON.parse(window.otStorage.getItem(key)||'{}');d.brigadesV1=[{id:'test-crew',name:'Тестовая бригада',leader:'Монтажник',members:['Монтажник'],date:'2026-11-27',archived:false}];window.otStorage.setItem(key,JSON.stringify(d));});
 const work=await page.evaluate(()=>window.otStockJournal().find(t=>t.kind==='accrual'&&!t.done&&Number(t.qty)>0));
 await page.locator('[data-orders-open="'+work.orderId+'"]').click();
 await page.locator('[data-oc-route="finance"]').click();
 await page.locator('#az-app [data-mode=list]').click();
 await page.locator('#az-content .az-grow[data-edit="'+work.id+'"]').click();
 await page.locator('#az-status-toggle').click();
 await page.locator('#az-status-menu [data-status="confirmed"]').click();
 const dialog=page.locator('dialog[open]');
 await dialog.locator('select').selectOption('test-crew');
 await dialog.locator('input[type=number]').nth(0).fill(String(work.qty/2));
 await dialog.locator('input[type=number]').nth(1).fill('300');
 page.on('dialog',async d=>{if(d.type()==='confirm')await d.accept();else await d.dismiss();});
 await dialog.getByRole('button',{name:'Подтвердить и начислить'}).click();
 await expect(dialog).toHaveCount(0);
 await page.reload();
 const rows=await page.evaluate(w=>window.otStockJournal().filter(t=>String(t.orderId)===String(w.orderId)&&String(t.workId)===String(w.id)&&t.stageId),work);
 expect(rows).toHaveLength(1);
 expect(rows[0].qty).toBe(work.qty/2);
 expect(rows[0].amount).toBe(Math.round(work.qty/2*300*100)/100);
 expect(rows[0].paid).toBe(false);
 const ids=rows.map(t=>String(t.id));
 await page.reload();
 const again=await page.evaluate(w=>window.otStockJournal().filter(t=>String(t.orderId)===String(w.orderId)&&String(t.workId)===String(w.id)&&t.stageId),work);
 expect(again.map(t=>String(t.id))).toEqual(ids);
 expect(again.reduce((sum,t)=>sum+Number(t.amount),0)).toBe(rows[0].amount);
});

test('real stage commit rejects insufficient stock without changing journal',async({page})=>{
 await page.goto('http://127.0.0.1:8080/');
 const result=await page.evaluate(()=>{
  const journal=window.otStockJournal();
  const work=journal.find(t=>t.kind==='accrual'&&!t.done&&Number(t.qty)>0&&!journal.some(x=>x.kind==='salaryPlan'&&String(x.workId)===String(t.id)&&String(x.orderId)===String(t.orderId)));
  const material=window.otMaterialCore.read().items.find(m=>window.otMaterialCore.units(m).some(u=>u.factor>0));
  if(!work||!material)throw Error('Missing control fixture');
  const unit=window.otMaterialCore.units(material).find(u=>u.factor>0).name;
  const brigade={id:'atomic-test-empty-crew',name:'Контроль',members:['Монтажник']};
  const qty=Number(work.qty)/2;
  const plan=window.OtBrigadeWork.allocate({work,assignments:[{brigadeId:brigade.id,qty}],brigadeIds:[brigade.id]});
  let error='';
  try{window.otCommitBrigadeStage({plan,event:{id:'atomic-test-stage',workId:work.id,brigadeId:brigade.id,qty,date:'2026-11-27'},work,brigade,rate:300,usage:[{materialId:material.id,unit,qty:1000000000}]});}catch(e){error=e.message;}
  return {error,unchanged:JSON.stringify(journal)===JSON.stringify(window.otStockJournal()),before:journal};
 });
 expect(result.error).not.toBe('');
 expect(result.unchanged).toBe(true);
 await page.reload();
 expect(await page.evaluate(()=>window.otStockJournal())).toEqual(result.before);
});

test('stage consumes available brigade stock and posts wage once',async({page})=>{
 await page.goto('http://127.0.0.1:8080/');
 const result=await page.evaluate(()=>{
  const materials=window.otMaterialCore.read().items;
  const journal=window.otStockJournal();
  const work=journal.find(t=>t.kind==='accrual'&&!t.done&&Number(t.qty)>0&&!journal.some(x=>x.kind==='salaryPlan'&&String(x.workId)===String(t.id)&&String(x.orderId)===String(t.orderId)));
  const report=window.otStockReport(journal,materials);
  const row=report.rows.find(r=>r.locations['Основной склад']>0&&materials.some(m=>m.id===r.id));
  if(!work||!row)throw Error('Missing positive stock fixture');
  const material=materials.find(m=>m.id===row.id);
  const brigade={id:'control-stock-crew',name:'Контроль',members:['Монтажник']};
  const date=new Date().toLocaleDateString('sv-SE');
  const q=row.locations['Основной склад']/2;
  const move=window.OtObjectStock.movement({id:'control-stock-move',material,unit:material.unit,qty:q,date,from:{type:'main'},to:{type:'brigade',id:brigade.id}});
  window.otAddStockMove(move);
  const qty=Number(work.qty)/2;
  const plan=window.OtBrigadeWork.allocate({work,assignments:[{brigadeId:brigade.id,qty}],brigadeIds:[brigade.id]});
  const args={plan,event:{id:'control-stock-stage',workId:work.id,brigadeId:brigade.id,qty,date},work,brigade,rate:300,usage:[{materialId:material.id,unit:material.unit,qty:q}]};
  const posted=window.otCommitBrigadeStage(args);
  const after=window.otStockJournal();
  let rejected=false;
  try{window.otCommitBrigadeStage(args)}catch(e){rejected=true}
  return {entries:posted.entries,rejected,unchanged:JSON.stringify(after)===JSON.stringify(window.otStockJournal()),after,qty,q,balance:window.otStockReport(after,materials).rows.find(r=>r.id===row.id).locations['brigade:'+brigade.id]||0};
 });
 expect(result.entries).toHaveLength(2);
 expect(result.entries[0].amount).toBe(Math.round(result.qty*300*100)/100);
 expect(result.entries[1].qty).toBe(result.q);
 expect(result.balance).toBeCloseTo(0);
 expect(result.rejected).toBe(true);
 expect(result.unchanged).toBe(true);
 await page.reload();
 expect(await page.evaluate(()=>window.otStockJournal())).toEqual(result.after);
});
