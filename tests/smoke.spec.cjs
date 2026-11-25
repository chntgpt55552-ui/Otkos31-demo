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
