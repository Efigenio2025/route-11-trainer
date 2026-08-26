const C="route-trainer-v7";
self.addEventListener("install",e=>{self.skipWaiting();e.waitUntil(caches.open(C).then(c=>c.addAll(["/manifest.webmanifest","/favicon.svg"]))) });
self.addEventListener("activate",e=>e.waitUntil(Promise.all([self.clients.claim(),caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==C).map(k=>caches.delete(k))))])));
self.addEventListener("fetch",e=>{if(e.request.method!=="GET")return;const nav=e.request.mode==="navigate";e.respondWith(fetch(e.request,{cache:nav?"no-store":"default"}).then(r=>{if(!nav&&r.ok){const x=r.clone();caches.open(C).then(c=>c.put(e.request,x))}return r}).catch(()=>caches.match(e.request).then(r=>r||caches.match("/"))))});

