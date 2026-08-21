"use client";

import { useEffect, useState } from "react";

/**
 * Program 7, Gate 7G (Package C) — shared PWA install-prompt hook.
 * Extracted from app/admin/field/FieldAgentComponents.tsx so every authorized staff surface
 * (Field Agent shell, main Business Concierge / Sales Workspace) reuses the exact same,
 * already-certified install behavior instead of duplicating it.
 *
 * No authorization logic lives here — this is purely a browser-capability hook. Server-side
 * capability checks (requireSalesWorkspaceAccess, etc.) remain the only source of truth for
 * what a staff member can see or do; installing the PWA changes nothing about that.
 */
export function useInstallPrompt() {
  const [installEvent, setInstallEvent] = useState<Event | null>(null);

  useEffect(() => {
    function handler(e: Event) {
      e.preventDefault();
      setInstallEvent(e);
    }
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  useEffect(() => {
    function onInstalled() {
      setInstallEvent(null);
    }
    window.addEventListener("appinstalled", onInstalled);
    return () => window.removeEventListener("appinstalled", onInstalled);
  }, []);

  return {
    canInstall: Boolean(installEvent),
    promptInstall: async () => {
      if (!installEvent) return;
      await (installEvent as any).prompt();
      setInstallEvent(null);
    },
  };
}

/** True once the app is already running installed (standalone display mode). Feature-detected. */
export function useIsStandaloneDisplay(): boolean {
  const [standalone, setStandalone] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia?.("(display-mode: standalone)");
    const iosStandalone = Boolean((window.navigator as any).standalone);
    setStandalone(Boolean(mq?.matches) || iosStandalone);
    if (!mq) return;
    const onChange = () => setStandalone(mq.matches || iosStandalone);
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, []);
  return standalone;
}

/** True on iOS Safari specifically — the one major platform that never fires beforeinstallprompt. */
export function useIsIosSafari(): boolean {
  const [isIosSafari, setIsIosSafari] = useState(false);
  useEffect(() => {
    if (typeof navigator === "undefined") return;
    const ua = navigator.userAgent || "";
    const isIos = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
    const isSafari = /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS|OPiOS/.test(ua);
    setIsIosSafari(isIos && isSafari);
  }, []);
  return isIosSafari;
}
