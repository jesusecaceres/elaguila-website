/**
 * Conservative service worker for the shared Leonix Business Concierge PWA.
 *
 * Rules:
 * - Cache only static shell assets (CSS, JS bundles, images)
 * - NEVER cache API responses, auth traffic, or private Business Concierge data
 * - NEVER cache authentication cookies/tokens
 * - Truthful offline behavior: show offline page, not fake data
 * - No offline mutation queues
 * - No background sync
 * - One shared worker identity for every authorized user on the device
 *
 * Also serves as the single SW for Web Push (Build 12 digital doorbell).
 * Do not register a second competing worker — everything push-related lives here too.
 * Never expect Daily API keys or host tokens in push payloads.
 */
/* eslint-disable no-restricted-globals */

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

self.addEventListener("push", (event) => {
  let data = {
    type: "digital_contact_doorbell",
    title: "Leonix",
    body: "Virtual Front Desk",
    answerPath: "/admin/digital-contact/doorbell",
    sessionId: null,
    test: false,
  };
  try {
    if (event.data) {
      const parsed = event.data.json();
      data = { ...data, ...parsed };
    }
  } catch {
    /* keep defaults */
  }

  const title = String(data.title || "Leonix");
  const body = String(data.body || "");
  const answerPath = String(data.answerPath || "/admin/digital-contact/doorbell");

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: "/logo-clean.png",
      badge: "/logo-clean.png",
      tag: data.test ? "leonix-doorbell-test" : `leonix-doorbell-${data.sessionId || "session"}`,
      renotify: true,
      requireInteraction: !data.test,
      data: {
        type: data.type,
        answerPath,
        sessionId: data.sessionId,
        test: Boolean(data.test),
      },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const payload = event.notification.data || {};
  const path = String(payload.answerPath || "/admin/digital-contact/doorbell");
  const targetUrl = new URL(path, self.location.origin);
  targetUrl.searchParams.set("doorbell", "1");

  event.waitUntil(
    (async () => {
      const all = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      for (const client of all) {
        if ("focus" in client) {
          await client.focus();
          if ("navigate" in client) {
            try {
              await client.navigate(targetUrl.href);
              return;
            } catch {
              /* fall through */
            }
          }
        }
      }
      if (self.clients.openWindow) {
        await self.clients.openWindow(targetUrl.href);
      }
    })(),
  );
});
