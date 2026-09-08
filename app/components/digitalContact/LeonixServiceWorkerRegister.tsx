"use client";

import { useEffect } from "react";

const SW_URL = "/sw.js";

/**
 * Registers the Leonix service worker once (Build 12 doorbell).
 * Safe to mount on admin doorbell page; fails closed if unsupported.
 */
export function LeonixServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;
    void navigator.serviceWorker.register(SW_URL, { scope: "/" }).catch(() => {
      /* SW registration failure must not break admin */
    });
  }, []);
  return null;
}

export async function ensureLeonixServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return null;
  try {
    const reg = await navigator.serviceWorker.register(SW_URL, { scope: "/" });
    await navigator.serviceWorker.ready;
    return reg;
  } catch {
    return null;
  }
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function subscribeLeonixDoorbellPush(
  vapidPublicKey: string,
): Promise<PushSubscription | null> {
  const reg = await ensureLeonixServiceWorker();
  if (!reg || !reg.pushManager) return null;
  const existing = await reg.pushManager.getSubscription();
  if (existing) return existing;
  return reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(vapidPublicKey) as BufferSource,
  });
}
