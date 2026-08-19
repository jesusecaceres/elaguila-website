/* Leonix Media — canonical service worker (Build 12 doorbell + LEO-14.8 alert prep).
 * Single SW for the whole Leonix origin. Do not register a second competing worker.
 * Never expect Daily API keys or host tokens in push payloads.
 * Never cache LEO conversation / auth / provider-sensitive responses.
 */
/* eslint-disable no-restricted-globals */

self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

/**
 * Network-only for sensitive paths — no Cache Storage writes.
 * Future static caching must never include these routes.
 */
self.addEventListener("fetch", (event) => {
  try {
    const url = new URL(event.request.url);
    if (url.origin !== self.location.origin) return;
    const path = url.pathname.toLowerCase();
    const sensitive =
      path.startsWith("/api/leo/") ||
      path.startsWith("/api/auth") ||
      path.includes("/oauth") ||
      path.includes("gmail") ||
      path.includes("google") ||
      path.startsWith("/admin/api");
    if (!sensitive) return;
    event.respondWith(
      fetch(event.request, { cache: "no-store" }).catch(() =>
        Response.error(),
      ),
    );
  } catch {
    /* ignore malformed URLs */
  }
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
