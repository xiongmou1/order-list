const CACHE_NAME = "order-v2";
const PRECACHE = ["./", "./index.html", "./order-list.html", "./manifest.json", "./icon.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      // 逐个添加，失败不阻断整体（icon 缺失也不会炸）
      await Promise.all(
        PRECACHE.map((url) =>
          cache.add(url).catch((err) => console.warn("precache miss:", url, err))
        )
      );
      await self.skipWaiting();
    })
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)));
      await self.clients.claim();
    })()
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;

  // 只处理 GET；POST/PUT/DELETE 交给网络，不要缓存
  if (req.method !== "GET") return;

  const url = new URL(req.url);

  // 第三方 API（Teable）走 network-first，不缓存
  if (url.origin !== self.location.origin) {
    e.respondWith(fetch(req).catch(() => caches.match(req)));
    return;
  }

  // 同源静态资源：cache-first + 后台更新（stale-while-revalidate）
  e.respondWith(
    caches.match(req).then((cached) => {
      const network = fetch(req)
        .then((res) => {
          if (res && res.ok) {
            const clone = res.clone();
            caches.open(CACHE_NAME).then((c) => c.put(req, clone));
          }
          return res;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});