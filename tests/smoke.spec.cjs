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
 const name=page.locator('#az-name');
 await name.selectOption({index:1});
 await page.locator('#az-amount').fill('1234.56');
 await page.locator('#az-save').click();
 await expect(page.locator('#az-modal')).not.toHaveClass(/az-visible/);
 await page.locator('#az-app [data-mode=list]').click();
 const payment=page.locator('.az-flat-group').filter({has:page.locator('.az-flat-heading').filter({hasText:'Оплаты заказчиков'})});
 const row=payment.locator('.az-tx').filter({hasText:/1\s?234[,.]56/});
 await expect(row).toHaveCount(1);
 await page.reload();
 await page.locator('#az-app [data-mode=list]').click();
 await expect(row).toHaveCount(1);
});
