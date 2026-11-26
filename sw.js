// Bump cache name on each release.
const CACHE='otkos31-demo-v127-preview31.1';
const ROOT=new URL('./',self.registration.scope).href;
const ASSETS=["./","icon.svg","manifest.webmanifest","assistant-rules.js","lamination-plan.js","measure-geometry.js","measure-model.js","cutting-material-cost.js","cutting-confirmation.js","cutting-posting.js","prepared-stock.js","cutting-journal.js","object-stock.js","brigade-directory.js","brigade-work.js","brigade-stage.js","brigade-card.js","cutting-stock.js","cutting-engine.js","cutting-map.js","cutting-remnant-shape.js","cutting-remnants.js","measure-custom-contour.js","measure-contour-editor.js","measure-segment-editor.js"];
const URLS=new Set(ASSETS.map(p=>new URL(p,ROOT).href));
self.addEventListener('install',e=>e.waitUntil((async()=>{
 const cache=await caches.open(CACHE);
 await cache.addAll([...URLS].map(u=>new Request(u,{cache:'reload'})));
})()));
self.addEventListener('message',e=>{if(e.data==='ACTIVATE_UPDATE')e.waitUntil(self.skipWaiting());});
self.addEventListener('activate',e=>e.waitUntil((async()=>{
 await Promise.all((await caches.keys()).filter(k=>k.startsWith('otkos31-demo-')&&k!==CACHE).map(k=>caches.delete(k)));
 await self.clients.claim();
})()));
self.addEventListener('fetch',e=>{
 if(e.request.method!=='GET')return;
 const u=new URL(e.request.url);
 const navigation=e.request.mode==='navigate'&&u.origin===new URL(ROOT).origin&&(u.pathname===new URL(ROOT).pathname||u.pathname===new URL('index.html',ROOT).pathname);
 const key=navigation?ROOT:u.href;
 if(!URLS.has(key))return;
 e.respondWith((async()=>{const cache=await caches.open(CACHE);return await cache.match(key)||Response.error();})());
});
