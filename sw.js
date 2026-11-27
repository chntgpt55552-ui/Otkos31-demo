const CACHE='otkos31-demo-v127-preview31.5-1a2c0ae2100b6a28';
const ASSETS=[
 [
  "./",
  "sha256-GGEZaMaqeuhEa81IynTZkI3FA4b9XUOAOaqYwSnWX10="
 ],
 [
  "icon-512.png",
  "sha256-Ffd7kNOlSYiJCzGClYIIbSbT/IMnRqfp3ZpIll3hSw4="
 ],
 [
  "icon-192.png",
  "sha256-n0LGj5Y6iL47HDostYuT9Q9GzLRQPK8RX7rZpa167wc="
 ],
 [
  "icon.svg",
  "sha256-j9P9cz5+QsK8B2W6QKXfTJUyBKNpsPc0yQLD93iaujg="
 ],
 [
  "manifest.webmanifest",
  "sha256-v9M/N1PuKcQTvjqsOy4cwD4IDfWxUhpRKBtsey3a8R0="
 ],
 [
  "assistant-rules.js",
  "sha256-9GJmX2qVZMx4LIMdMmtHSeg9ZUPSBZmX+UoSqWMHHJw="
 ],
 [
  "lamination-plan.js",
  "sha256-hMHTf30JYgS3EyV6Z0Cr9h80dTMfSQBk5dBRZjjlke0="
 ],
 [
  "measure-geometry.js",
  "sha256-MN6aFGzGiEhCfdAOxyJTLQOLHzkatYGk2hHySZAZNoI="
 ],
 [
  "measure-model.js",
  "sha256-gjTGZ4jxSXJVKQgxlA0VBf3jNsDEG+aqdc5LhIp/hqU="
 ],
 [
  "cutting-material-cost.js",
  "sha256-eaARtrtD7XCtWmsXo5m4pUaTjZBGgp4/dN9znF/Uwsc="
 ],
 [
  "cutting-confirmation.js",
  "sha256-/Tu6G746XaL+LqIdVEipg6O9P7dFUlxAM1b5kaWAE7U="
 ],
 [
  "cutting-posting.js",
  "sha256-KnjavhaHDZ6eQzo5MXK3EMe9+8ykOk/CQIh9TCcnxdA="
 ],
 [
  "prepared-stock.js",
  "sha256-2jjrGFABIDXTkOM4QmzQZoPIcPsqRJnMpyuTeafW4sE="
 ],
 [
  "cutting-journal.js",
  "sha256-dH2aOgHcN5DwM7zJOjtFPHzU+ikkqRhX/tx135zDXls="
 ],
 [
  "object-stock.js",
  "sha256-4jHWsE9fJmfWkOKjufiNaJe1kWFgCzYgg6/EJh734BM="
 ],
 [
  "brigade-directory.js",
  "sha256-SFtsf5m6tf412h1ByeTy5k9L4Hc00m7Be8hpkZhR7eg="
 ],
 [
  "brigade-work.js",
  "sha256-2TCzieeIbhIBVZ9hc6hSy3ivcztD6xYjH0bR+Y3k57M="
 ],
 [
  "brigade-stage.js",
  "sha256-FqT8iyvPbx380ByGeyA7oTQjpRcuC3uR7BuiOrQMqZ0="
 ],
 [
  "material-usage-plan.js",
  "sha256-v9FJNBBtYbWl3nDPCrLGw+KeI1XkCf0cedxsJ8Y8IcA="
 ],
 [
  "brigade-card.js",
  "sha256-lBpX/vZHLjT/pxay03+KaDLM5H8RfPV4G5JLgQNEmYs="
 ],
 [
  "cutting-stock.js",
  "sha256-u7j03BWHxBM+uVfpp9sM1H5Xm+uiQ/MOXgRb7/Qodl0="
 ],
 [
  "cutting-engine.js",
  "sha256-TO+tTKh6xvn0jmAYCcvuiedxMjQgIXGUN9Rf/lnPqmw="
 ],
 [
  "cutting-map.js",
  "sha256-R1Bt2do8Dz7FklDMiHzIrxNUd5zyHMd7PJrOFZQkIeA="
 ],
 [
  "cutting-remnant-shape.js",
  "sha256-suifJ82XacPSZJGM6hmwnMqybWfFxKDp6uh8e4BUVMk="
 ],
 [
  "cutting-remnants.js",
  "sha256-SCFtjNC9d85ryj+SwHeIaMfFSwqiHMb2nDJClETlGS0="
 ],
 [
  "measure-custom-contour.js",
  "sha256-MWrHPIqQ0xXYSJ9KkCLRuZz1u7wZlWlkkroPnt0WKOY="
 ],
 [
  "measure-contour-editor.js",
  "sha256-i+5cgcM/j1sYHkNGOChA83xKW10J2mX5H/Q6RqTFyfU="
 ],
 [
  "measure-segment-editor.js",
  "sha256-gwlibwgacutemIKf/aLjMxSkjlvkdAsK1pod29smXGY="
 ],
 [
  "pwa-update.js",
  "sha256-efWRWRRRuuaFc/sMALBU7ARKllanxiStYPQwc6UqprE="
 ]
];
const ROOT=new URL('./',self.registration.scope).href;
const URLS=new Set(ASSETS.map(([p])=>new URL(p,ROOT).href));
async function verified(response, integrity) {
 if (!response || !response.ok) throw Error(response ? 'HTTP ' + response.status : 'Нет файла');
 const bytes = await response.clone().arrayBuffer();
 const digest = new Uint8Array(await crypto.subtle.digest('SHA-256',bytes));
 if ('sha256-' + btoa(String.fromCharCode(...digest)) !== integrity) throw Error('Содержимое отличается от сборки');
 return response;
}
async function storeAsset(cache, prior, [path,integrity]) {
 const url = new URL(path,ROOT);
 // Reuse only bytes verified against the NEW release, including on an intermittent connection.
 if (prior) {
  let existing;
  try { existing = await verified(await prior.match(url),integrity); } catch { /* Fetch changed or missing files. */ }
  if (existing) { await cache.put(url,existing); return; }
 }
 for (let attempt=0;attempt<2;attempt++) {
  const request = new URL(url);
  if (attempt) request.searchParams.set('ot_release',CACHE);
  try {
   const response = await fetch(request,{cache:'no-store',credentials:'same-origin'});
   await cache.put(url,await verified(response,integrity));
   return;
  } catch (error) { if (attempt) throw Error(path+' — '+error.message); }
 }
}
self.addEventListener('install',event=>event.waitUntil((async()=>{
 try {
  const names = await caches.keys();
  const previous = names.filter(name=>name.startsWith('otkos31-demo-v') && name!==CACHE).at(-1);
  const prior = previous ? await caches.open(previous) : null;
  const cache = await caches.open(CACHE);
  for (let i=0;i<ASSETS.length;i+=4) {
   await Promise.all(ASSETS.slice(i,i+4).map(asset=>storeAsset(cache,prior,asset)));
  }
 } catch (error) {
  const clients = await self.clients.matchAll({type:'window',includeUncontrolled:true});
  for (const client of clients) client.postMessage({type:'OT_UPDATE_ERROR',message:error.message});
  throw error;
 }
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
