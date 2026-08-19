/**
 * LEO-14.8 — client PWA capability detection (no network, no authority).
 * Pure helpers for the LEO executive assistant shell.
 */

export const LEO_CANONICAL_SW_URL = "/sw.js";
export const LEO_CANONICAL_MANIFEST_URL = "/manifest.webmanifest";
export const LEO_PWA_DRAFT_STORAGE_KEY = "leonix:leo:composer-draft";
export const LEO_PWA_SESSION_POINTER_KEY = "leonix:leo:last-session-id";

export type LeoPwaCapabilities = {
  serviceWorkerSupported: boolean;
  notificationSupported: boolean;
  pushManagerSupported: boolean;
  standaloneDisplay: boolean;
  online: boolean;
  /** True only when a deferred install prompt was captured this session. */
  installPromptAvailable: boolean;
};

export function detectLeoStandaloneDisplay(
  win: Window & { matchMedia?: (q: string) => MediaQueryList; navigator: Navigator & { standalone?: boolean } },
): boolean {
  try {
    if (win.matchMedia?.("(display-mode: standalone)")?.matches) return true;
    if (win.matchMedia?.("(display-mode: fullscreen)")?.matches) return true;
    if (Boolean(win.navigator.standalone)) return true;
  } catch {
    /* ignore */
  }
  return false;
}

export function detectLeoPwaCapabilities(input?: {
  online?: boolean;
  installPromptAvailable?: boolean;
  win?: Window;
}): LeoPwaCapabilities {
  const win = input?.win ?? (typeof window !== "undefined" ? window : undefined);
  if (!win) {
    return {
      serviceWorkerSupported: false,
      notificationSupported: false,
      pushManagerSupported: false,
      standaloneDisplay: false,
      online: input?.online ?? true,
      installPromptAvailable: false,
    };
  }
  const nav = win.navigator;
  return {
    serviceWorkerSupported: "serviceWorker" in nav,
    notificationSupported: "Notification" in win,
    pushManagerSupported: "serviceWorker" in nav && "PushManager" in win,
    standaloneDisplay: detectLeoStandaloneDisplay(win as Window & { navigator: Navigator & { standalone?: boolean } }),
    online: input?.online ?? (typeof nav.onLine === "boolean" ? nav.onLine : true),
    installPromptAvailable: Boolean(input?.installPromptAvailable),
  };
}

/** Internal-only path allowlist for future leo_alert notification clicks. */
export function resolveLeoAlertNavigationPath(answerPath: string | null | undefined): string {
  const raw = String(answerPath || "/admin/leo").trim();
  if (!raw.startsWith("/")) return "/admin/leo";
  if (raw.startsWith("//")) return "/admin/leo";
  if (raw.includes("://")) return "/admin/leo";
  if (raw === "/admin/leo" || raw.startsWith("/admin/leo?") || raw.startsWith("/admin/leo/")) {
    // Strip any attempt to leave admin LEO via encoded tricks
    if (/[\r\n]/.test(raw)) return "/admin/leo";
    return raw.split("#")[0].slice(0, 200);
  }
  return "/admin/leo";
}

export function isLeoSensitiveApiPath(pathname: string): boolean {
  const p = pathname.toLowerCase();
  return (
    p.startsWith("/api/leo/") ||
    p.startsWith("/api/auth") ||
    p.includes("/oauth") ||
    p.includes("gmail") ||
    p.includes("google") ||
    p.startsWith("/admin/api")
  );
}

export const LEO_OFFLINE_SUBMIT_MESSAGE =
  "You’re offline. LEO can’t check live evidence right now — your draft is saved.";
