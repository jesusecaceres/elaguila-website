"use client";

import { useEffect } from "react";

/**
 * Program 7, Gate 7G — Conservative service worker registration.
 * Only registers in production (or when explicitly enabled).
 * Truthful: no fake offline behavior, no background sync in V1.
 */
export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    if (process.env.NODE_ENV === "production") {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .catch((err) => {
          console.error("[sw-registration] failed:", err);
        });
    }
  }, []);

  return null;
}
