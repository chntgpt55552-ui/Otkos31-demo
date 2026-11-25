const CACHE='otkos31-demo-update-v2';
const ROOT=new URL('./',self.registration.scope).href;
self.addEventListener('install',e=>e.waitUntil((async()=>{
 const c=await caches.open(CACHE);
 await c.addAll(['./','./icon.svg','./manifest.webmanifest'].map(p=>new Request(new URL(p,ROOT),{cache:'reload'})));
 await self.skipWaiting();
})()));
self.addEventListener('activate',e=>e.waitUntil((async()=>{
 await Promise.all((await caches.keys()).filter(k=>k.startsWith('otkos31-demo-')&&k!==CACHE).map(k=>caches.delete(k)));
 await self.clients.claim();
})()));
self.addEventListener('fetch',e=>{
 if(e.request.method!=='GET'||e.request.mode!=='navigate'||!e.request.url.startsWith(ROOT))return;
 e.respondWith((async()=>{
 try{
 const r=await fetch(e.request,{cache:'no-store'});
 if(!r.ok)throw new Error('HTTP '+r.status);
 const c=await caches.open(CACHE);
 if(new URL(e.request.url).pathname===new URL(ROOT).pathname||new URL(e.request.url).pathname===new URL('index.html',ROOT).pathname)await c.put(ROOT,r.clone());
 return r;
 }catch(err){return (await caches.open(CACHE)).match(ROOT).then(r=>r||Response.error());}
 })());
});