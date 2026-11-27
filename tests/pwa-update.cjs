// Run from the repository root with Playwright and Chromium installed.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const {execFileSync} = require('node:child_process');
const {chromium} = require('playwright');
const key = 'otkos31_orders_alzex_one_journal_v1';
const backup = 'otkos31-update-backup-v1';
const previous = 'e54d2076bcea77fd4ee06e9685b405db9409f7bf';
const version = fs.readFileSync('index.html','utf8').match(/window.otVersion = '([^']+)'/)[1];
const legacy = new Map();
let stage = 'legacy';
let retriedShell = false;
function content(path) {
 if (stage === 'legacy') {
  if (!legacy.has(path)) legacy.set(path,execFileSync('git',['show',previous + ':' + path]));
  return legacy.get(path);
 }
 const file = fs.readFileSync(path);
 if (stage === 'broken' && path === 'index.html') return 'invalid release';
 return file;
}
async function run() {
 const server = http.createServer((req,res) => {
  const path = new URL(req.url,'http://localhost').pathname.slice(1) || 'index.html';
  if (!/^[\w.-]+$/.test(path) || !fs.existsSync(path)) { res.writeHead(404).end(); return; }
  res.setHeader('content-type',path.endsWith('.js')?'application/javascript':path.endsWith('.html')?'text/html':'application/octet-stream');
  res.setHeader('cache-control','no-store');
  if (stage === 'retry-shell' && path === 'index.html') {
   if (!new URL(req.url,'http://localhost').searchParams.has('ot_release')) {
    res.end('stale response');
    return;
   }
   retriedShell = true;
  }
  res.end(content(path));
 });
 await new Promise(resolve => server.listen(0,'127.0.0.1',resolve));
 const url = 'http://127.0.0.1:' + server.address().port;
 let browser;
 try {
  browser = await chromium.launch({executablePath:process.env.CHROMIUM_PATH});
  const context = await browser.newContext();
  let page = await context.newPage();
  const messages = [];
  const listen = p => p.on('dialog', async d => {messages.push(d.message()); await d.accept().catch(() => {});});
  listen(page);
  await page.goto(url);
  await page.waitForFunction(() => !!navigator.serviceWorker.controller);
  const old = JSON.stringify({orders:[{id:7,name:'Контрольный заказ',parent:null}],journal:[{id:3,orderId:7,kind:'payment',amount:42,done:true}]});
  await page.evaluate(([k,v])=>{localStorage.setItem(k,v);localStorage.setItem('preview:otRemnantsV1','isolated');},[key,old]);
  stage = 'broken';
  await page.evaluate(async()=>{const r=await navigator.serviceWorker.ready;await r.update();const w=r.installing;if(w) await new Promise(done=>w.addEventListener('statechange',()=>{if(w.state==='redundant')done();}));});
  assert.equal(await page.evaluate(()=>window.otVersion),'127-preview29.1');
  stage = 'retry-shell';
  await Promise.all([page.waitForNavigation(),page.locator('#ot-update-button').click()]);
  await page.waitForFunction(async()=>!!(await navigator.serviceWorker.ready).waiting);
  assert.equal(retriedShell,true);
  stage = 'current';
  await page.waitForFunction(k=>!!localStorage.getItem(k),backup);
  const workers = context.serviceWorkers();
  const installed = workers.at(-1);
  // Observe activation from outside the scope, so a quick reopen cannot keep the old worker alive.
  await page.close();
  const deadline = Date.now()+15000;
  while (await installed.evaluate(async()=> (await caches.keys()).includes('otkos31-demo-v127-preview31.1'))) {
   if (Date.now()>deadline) throw Error('Legacy worker still active after closing the application');
   await new Promise(resolve=>setTimeout(resolve,100));
  }
  page = await context.newPage();
  listen(page);
  await page.goto(url);
  await page.waitForFunction(v=>window.otVersion===v,version);
  const data = () => page.evaluate(k=>JSON.parse(localStorage.getItem(k)),key);
  assert.equal((await data()).schemaVersion,1);
  assert.equal((await data()).journal[0].paid,true);
  assert.equal(await page.evaluate(k=>localStorage.getItem(k+'-before-schema-1'),key),old);
  const stable = await data();
  await page.reload();
  assert.deepEqual(await data(),stable);

  // The legacy snapshot contains preview keys. A production restore must leave them alone.
  await page.evaluate(()=>localStorage.setItem('preview:otRemnantsV1','still isolated'));
  await Promise.all([page.waitForNavigation(),page.evaluate(()=>window.otRestoreUpdateBackup())]);
  assert.deepEqual(await data(),stable);
  assert.equal(await page.evaluate(()=>localStorage.getItem('preview:otRemnantsV1')),'still isolated');
  await context.setOffline(true);
  await page.reload();
  assert.equal(await page.locator('#ot-release-label span').textContent(),'v'+version);
  assert.deepEqual(await data(),stable);
  await context.setOffline(false);

  // Deploy identical app assets under a new worker identity to exercise a second update.
  const worker = fs.readFileSync('sw.js','utf8');
  const next = worker.replace('otkos31-demo-v'+version,'otkos31-demo-v'+version+'-test');
  const override = (req,res) => {
   if(req.url==='/sw.js'){res.writeHead(200,{'Content-Type':'application/javascript','Cache-Control':'no-store'});res.end(next);}
   else normal(req,res);
  };
  const [normal] = server.listeners('request');
  server.removeListener('request',normal).on('request',override);
  await page.evaluate(async()=>{await (await navigator.serviceWorker.ready).update();});
  await page.waitForFunction(()=>document.querySelector('#ot-update-button').textContent==='Обновить');
  await Promise.all([page.waitForNavigation(),page.locator('#ot-update-button').click()]);
  assert.equal(await page.evaluate(k=>JSON.parse(localStorage.getItem(k)).format,backup),2);
  assert.deepEqual(await data(),stable);
  await page.evaluate(()=>localStorage.setItem('otRemnantsV1','later'));
  await Promise.all([page.waitForNavigation(),page.evaluate(()=>window.otRestoreUpdateBackup())]);
  assert.equal(await page.evaluate(()=>localStorage.getItem('otRemnantsV1')),null);
  const before = await page.evaluate(k=>localStorage.getItem(k),backup);
  const [status] = await Promise.all([page.waitForEvent('dialog'),page.locator('#ot-update-button').click()]);
  assert.equal(status.message(),'Установлена актуальная версия');
  assert.equal(await page.evaluate(k=>localStorage.getItem(k),backup),before);
  // A mid-restore quota error rolls back the first write and retains the snapshot.
  const rollback = await page.evaluate(k=>{
   const snapshot = localStorage.getItem(k);
   const payload = JSON.parse(snapshot);
   payload.entries.push(['ot_test_first','new'],['ot_test_second','fail']);
   localStorage.setItem(k,JSON.stringify(payload));
   localStorage.setItem('ot_test_first','old');
   const original = Storage.prototype.setItem;
   Storage.prototype.setItem = function(key,value) {
    if(key==='ot_test_second') throw Error('quota');
    original.call(this,key,value);
   };
   try {
    return [window.otRestoreUpdateBackup(),localStorage.ot_test_first,localStorage.getItem('ot_test_second'),
            localStorage.getItem(k)===JSON.stringify(payload)];
   } finally { Storage.prototype.setItem=original; localStorage.setItem(k,snapshot); }
  },backup);
  assert.deepEqual(rollback,[false,'old',null,true]);
  const future = JSON.stringify({...stable,schemaVersion:9});
  await page.evaluate(([k,v])=>localStorage.setItem(k,v),[key,future]);
  await page.reload();
  assert.equal(await page.evaluate(k=>localStorage.getItem(k),key),future);
  assert(messages.some(message=>message.includes('Запись заблокирована')));
  console.log('Legacy install, failed integrity check, waiting activation, schema migration, idempotence, offline reopen, next release, both restore formats and no-update check passed.');
 } finally { await browser?.close(); server.closeAllConnections(); await new Promise(done=>server.close(done)); }
}
run().catch(error=>{console.error(error);process.exitCode=1;});
