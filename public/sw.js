/**
 * Leonix Media — canonical service worker for the whole origin.
 * Single SW for Web Push (Build 12 digital doorbell + LEO-14.8 alert prep) AND the shared
 * Business Concierge PWA shell cache. Do not register a second competing worker.
 *
 * Rules:
 * - Cache only static shell assets (CSS, JS bundles, images)
 * - NEVER cache API responses, auth traffic, or private Business Concierge/LEO data
 * - NEVER cache authentication cookies/tokens
 * - Never expect Daily API keys or host tokens in push payloads.
 * - Never cache LEO conversation / auth / provider-sensitive responses.
 * - Truthful offline behavior: show offline page, not fake data
 * - No offline mutation queues
 * - No background sync
 * - One shared worker identity for every authorized user on the device
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

/**
 * Single fetch handler for the whole origin — a second listener that also calls
 * event.respondWith() for the same event throws at runtime, so every rule lives here.
 *
 * 1. LEO / auth / OAuth / provider-sensitive paths: network-only, never cached (LEO-14.8).
 * 2. Static shell assets: cache-first with network fallback.
 * 3. Everything else: network, with a truthful offline fallback (never fake data).
 */
self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.method !== "GET") return;

  let url;
  try {
    url = new URL(request.url);
  } catch {
    return;
  }
  if (url.origin !== self.location.origin) return;

  const path = url.pathname.toLowerCase();
  const sensitive =
    path.startsWith("/api/leo/") ||
    path.startsWith("/api/auth") ||
    path.includes("/oauth") ||
    path.includes("gmail") ||
    path.includes("google") ||
    path.startsWith("/admin/api");

  if (sensitive) {
    event.respondWith(
      fetch(request, { cache: "no-store" }).catch(() => Response.error()),
    );
    return;
  }

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

function resolveSafeInternalPath(type, answerPath) {
  const raw = String(answerPath || "").trim();
  if (type === "leo_alert") {
    if (!raw.startsWith("/") || raw.startsWith("//") || raw.includes("://")) {
      return "/admin/leo";
    }
    if (raw === "/admin/leo" || raw.startsWith("/admin/leo?") || raw.startsWith("/admin/leo/")) {
      return raw.split("#")[0].slice(0, 200);
    }
    return "/admin/leo";
  }
  // digital_contact_doorbell (default)
  if (!raw.startsWith("/") || raw.startsWith("//") || raw.includes("://")) {
    return "/admin/digital-contact/doorbell";
  }
  if (
    raw === "/admin/digital-contact/doorbell" ||
    raw.startsWith("/admin/digital-contact/doorbell?") ||
    raw.startsWith("/admin/digital-contact/")
  ) {
    return raw.split("#")[0].slice(0, 200);
  }
  return "/admin/digital-contact/doorbell";
}

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

  const type =
    data.type === "leo_alert" ? "leo_alert" : "digital_contact_doorbell";
  const title = String(
    data.title || (type === "leo_alert" ? "LEO" : "Leonix"),
  );
  const body = String(data.body || "");
  const answerPath = resolveSafeInternalPath(
    type,
    data.answerPath ||
      (type === "leo_alert" ? "/admin/leo" : "/admin/digital-contact/doorbell"),
  );

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: "/logo-clean.png",
      badge: "/logo-clean.png",
      tag:
        type === "leo_alert"
          ? data.test
            ? "leonix-leo-alert-test"
            : `leonix-leo-alert-${data.sessionId || "alert"}`
          : data.test
            ? "leonix-doorbell-test"
            : `leonix-doorbell-${data.sessionId || "session"}`,
      renotify: true,
      requireInteraction: !data.test,
      data: {
        type,
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
  const type =
    payload.type === "leo_alert" ? "leo_alert" : "digital_contact_doorbell";
  const path = resolveSafeInternalPath(type, payload.answerPath);
  const targetUrl = new URL(path, self.location.origin);
  // Never open an arbitrary external host from push payload.
  if (targetUrl.origin !== self.location.origin) {
    targetUrl.href = new URL(
      type === "leo_alert" ? "/admin/leo" : "/admin/digital-contact/doorbell",
      self.location.origin,
    ).href;
  }
  if (type === "digital_contact_doorbell") {
    targetUrl.searchParams.set("doorbell", "1");
  }

  event.waitUntil(
    (async () => {
      const all = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });
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
