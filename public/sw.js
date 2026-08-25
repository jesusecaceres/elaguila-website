/**
 * Conservative service worker for the shared Leonix Business Concierge PWA.
 *
 * Rules:
 * - Cache only static shell assets (CSS, JS bundles, images)
 * - NEVER cache API responses, auth traffic, or private Business Concierge data
 * - NEVER cache authentication cookies/tokens
 * - Truthful offline behavior: show offline page, not fake data
 * - No offline mutation queues
 * - No background sync, no push
 * - One shared worker identity for every authorized user on the device
 */

const CACHE_NAME = "leonix-business-concierge-v1";
const OFFLINE_URL = "/offline";

const STATIC_ASSET_PATTERNS = [
  /\/_next\/static\//,
  /\/_next\/chunks\//,
  /\/pwa\//,
  /\.(?:css|js|png|jpg|jpeg|gif|svg|ico|woff|woff2)$/i,
];

const NEVER_CACHE_PATTERNS = [
  /\/api\//,
  /\/auth\//,
  /supabase\.co/,
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll([OFFLINE_URL])),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)),
      ),
    ),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.method !== "GET") return;

  const url = new URL(request.url);

  if (NEVER_CACHE_PATTERNS.some((pattern) => pattern.test(url.pathname) || pattern.test(url.href))) {
    return;
  }

  const isStaticAsset = STATIC_ASSET_PATTERNS.some((pattern) => pattern.test(url.pathname));

  if (isStaticAsset) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        }).catch(() => caches.match(OFFLINE_URL));
      }),
    );
    return;
  }

  event.respondWith(
    fetch(request).catch(() => {
      if (request.mode === "navigate") {
        return caches.match(OFFLINE_URL);
      }
      return new Response("Offline", { status: 503, statusText: "Offline" });
    }),
  );
});
