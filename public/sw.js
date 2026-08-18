/* Leonix Media — Build 12 digital doorbell service worker.
 * Single SW for Web Push. Do not register a second competing worker.
 * Never expect Daily API keys or host tokens in push payloads.
 */
/* eslint-disable no-restricted-globals */

self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
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
