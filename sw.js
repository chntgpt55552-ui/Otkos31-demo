const CACHE='otkos31-demo-v127-preview30.1.1';
const ROOT=new URL('./',self.registration.scope).href;
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll([ROOT,new URL('icon.svg',ROOT).href,new URL('manifest.webmanifest',ROOT).href].map(u=>new Request(u,{cache:"reload"}))).then(()=>self.skipWaiting()))));
self.addEventListener('message',e=>{if(e.data==='ACTIVATE_UPDATE')e.waitUntil(self.skipWaiting());});
self.addEventListener('activate',e=>e.waitUntil((async()=>{await Promise.all((await caches.keys()).filter(k=>k.startsWith('otkos31-demo-')&&k!==CACHE).map(k=>caches.delete(k)));await self.clients.claim();})()));
self.addEventListener('fetch',e=>{if(e.request.method!=='GET'||e.request.mode!=='navigate'||!e.request.url.startsWith(ROOT))return;e.respondWith(fetch(e.request,{cache:"no-store"}).then(async r=>{if(!r.ok)throw Error('network');const c=await caches.open(CACHE);await c.put(ROOT,r.clone());return r;}).catch(async()=>await caches.match(ROOT)||Response.error()));});
