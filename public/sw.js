const CACHE = "rentabilidad-agricola-v1";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((c) => c.addAll(["/", "/index.html", "/manifest.webmanifest", "/icon-192.png"]))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  // navegación: red primero, respaldo con la app cacheada
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req).catch(() => caches.match("/index.html").then((r) => r || caches.match("/"))),
    );
    return;
  }

  // estáticos: caché primero, actualizan en segundo plano
  event.respondWith(
    caches.match(req).then((cacheada) => {
      const red = fetch(req)
        .then((resp) => {
          if (resp && resp.ok && new URL(req.url).origin === self.location.origin) {
            const copia = resp.clone();
            caches.open(CACHE).then((c) => c.put(req, copia));
          }
          return resp;
        })
        .catch(() => cacheada);
      return cacheada || red;
    }),
  );
});
