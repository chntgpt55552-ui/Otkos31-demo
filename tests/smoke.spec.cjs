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
