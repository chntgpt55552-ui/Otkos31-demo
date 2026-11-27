(() => {
 'use strict';
 const sw=navigator.serviceWorker;
 const preview = document.documentElement.hasAttribute('data-phone-preview');
 const backupKey = 'otkos31-update-backup-v1';
 const primary = 'otkos31_orders_alzex_one_journal_v1';
 const owns = k => /^(?:otkos31|otAssistant|otRemnants|ot_|ot-)/i.test(k) && k !== backupKey;
 const storageKeys = storage => Object.keys(storage).filter(owns);
 const button = document.getElementById('ot-update-button');
 const restore = document.getElementById('ot-update-restore');
 const label = document.querySelector('#ot-release-label span');
 label.textContent = preview ? 'TEST • isolated preview' : 'v' + window.otVersion;
 if (preview) { button.hidden = restore.hidden = true; return; }

 function snapshot() {
  const storage = window.localStorage;
  const entries = storageKeys(storage).map(k => [k, storage.getItem(k)]);
  const raw = JSON.stringify({format:2, version:window.otVersion, createdAt:new Date().toISOString(), entries});
  storage.setItem(backupKey, raw);
  if (storage.getItem(backupKey) !== raw) throw Error('Не удалось проверить резервную копию');
  restore.hidden = false;
 }

 function recover() {
  const storage = window.localStorage;
  const data = JSON.parse(storage.getItem(backupKey));
  if (![1,2].includes(data?.format) || !Array.isArray(data.entries)) throw Error('Некорректная копия');
  const entries = new Map();
  for (const pair of data.entries) {
   if (!Array.isArray(pair) || pair.length !== 2 || !pair.every(v => typeof v === 'string')) throw Error('Повреждённая запись');
   const [key,value] = pair;
   // Old snapshots also included standalone-preview and unrelated ot-prefixed keys.
   if (data.format === 1 && !owns(key) && /^(ot|preview:ot)/i.test(key) && key !== backupKey) continue;
   if (!owns(key) || entries.has(key)) throw Error('Некорректный ключ копии');
   if (key === primary && !window.otValidUpdateDatabase(value)) throw Error('Некорректная база в копии');
   entries.set(key,value);
  }
  if (data.format === 2) {
   for (const key of storageKeys(storage)) if (!entries.has(key)) entries.set(key,null);
  }
  otWriteStorage(Array.from(entries, ([key,value]) => [storage,key,value]),true);
 }
 window.otRestoreUpdateBackup = () => {
  if (!confirm('Восстановить данные на момент обновления? Последующие изменения будут заменены.')) return false;
  try { recover(); location.reload(); return true; }
  catch (error) { alert(error.message); return false; }
 };
 restore.onclick = window.otRestoreUpdateBackup;
 try { restore.hidden = localStorage.getItem(backupKey) === null; } catch { restore.hidden = true; }

 if (!sw || !window.isSecureContext) { button.disabled = true; return; }
 let changed = false;
 let controller = sw.controller;
 let requested = null;
 const readyLabel = () => { button.textContent = 'Обновить'; button.title = 'Доступна новая версия'; };
 sw.addEventListener('controllerchange', () => {
  if (controller && sw.controller !== controller) {
   changed = true;
   if (requested === sw.controller) location.reload();
   else readyLabel();
  }
  controller = sw.controller;
 });
 function watch(reg) {
  const worker = reg.installing;
  if (worker) worker.addEventListener('statechange', () => {
   if (worker.state === 'installed' && sw.controller) readyLabel();
  });
  if (reg.waiting) readyLabel();
 }
 const registration = sw.register('./sw.js',{updateViaCache:'none'}).then(reg => {
  reg.addEventListener('updatefound', () => watch(reg));
  watch(reg);
  return reg;
 });
 registration.catch(() => { button.title = 'Не удалось зарегистрировать обновления'; });
 document.addEventListener('visibilitychange', () => {
  if (!document.hidden && navigator.onLine) registration.then(reg => reg.update()).catch(() => {});
 });

 function until(worker, event, check) {
  return new Promise((resolve,reject) => {
   const cleanup = () => { clearTimeout(timer); worker.removeEventListener(event,onChange); };
   function onChange() {
    if (check()) { cleanup(); resolve(); }
    else if (worker.state === 'redundant') { cleanup(); reject(Error('Установка отменена')); }
   }
   const timer = setTimeout(() => { cleanup(); reject(Error('Время ожидания обновления истекло')); },30000);
   worker.addEventListener(event,onChange);
   onChange();
  });
 }
 button.onclick = async () => {
  button.disabled = true;
  try {
   const reg = await registration;
   if (!changed && !reg.waiting) {
    if (!navigator.onLine) throw Error('Нет подключения к интернету');
    await reg.update();
    const worker = reg.installing;
    if (worker) await until(worker,'statechange',() => ['installed','activating','activated'].includes(worker.state));
   }
   const waiting = reg.waiting;
   if (!waiting && !changed) { alert('Установлена актуальная версия'); return; }
   if (!confirm('Сохраните открытые изменения. Применить обновление?')) return;
   snapshot();
   if (changed && !waiting) { location.reload(); return; }
   requested = waiting;
   waiting.postMessage('ACTIVATE_UPDATE');
   await until(sw,'controllerchange',() => sw.controller === waiting);
  } catch (error) { alert('Обновление: ' + error.message); }
  finally { requested = null; button.disabled = false; }
 };
})();
