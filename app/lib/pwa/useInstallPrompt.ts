"use client";

import { useEffect, useState } from "react";

/**
 * Shared PWA install-prompt hook for the one Business Concierge app.
 * No authorization lives here. Server capability checks remain the only source of truth.
 * Installing does not grant privilege and is not tied to one user.
 */

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export type InstallPromptOutcome = "accepted" | "dismissed" | "unavailable";

export function useInstallPrompt() {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [lastOutcome, setLastOutcome] = useState<InstallPromptOutcome | null>(null);

  useEffect(() => {
    function handler(e: Event) {
      e.preventDefault();
      setInstallEvent(e as BeforeInstallPromptEvent);
      setLastOutcome(null);
    }
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  useEffect(() => {
    function onInstalled() {
      setInstallEvent(null);
      setLastOutcome("accepted");
    }
    window.addEventListener("appinstalled", onInstalled);
    return () => window.removeEventListener("appinstalled", onInstalled);
  }, []);

  return {
    canInstall: Boolean(installEvent),
    lastOutcome,
    promptInstall: async (): Promise<InstallPromptOutcome> => {
      if (!installEvent) return "unavailable";
      await installEvent.prompt();
      const choice = await installEvent.userChoice;
      setInstallEvent(null);
      setLastOutcome(choice.outcome);
      return choice.outcome;
    },
  };
}

/** True once the app is already running installed (standalone / iOS home screen). */
export function useIsStandaloneDisplay(): boolean {
  const [standalone, setStandalone] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia?.("(display-mode: standalone)");
    const iosStandalone = Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone);
    const update = () => setStandalone(Boolean(mq?.matches) || iosStandalone);
    update();
    if (!mq) return;
    mq.addEventListener?.("change", update);
    return () => mq.removeEventListener?.("change", update);
  }, []);
  return standalone;
}

/** iPhone/iPad Safari, including iPadOS desktop user-agent. Never fires beforeinstallprompt. */
export function useIsIosSafari(): boolean {
  const [isIosSafari, setIsIosSafari] = useState(false);
  useEffect(() => {
    if (typeof navigator === "undefined") return;
    const ua = navigator.userAgent || "";
    const iOSDevice = /iPad|iPhone|iPod/.test(ua);
    const iPadOsDesktopUa = navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
    const isIos = (iOSDevice || iPadOsDesktopUa) && !(window as Window & { MSStream?: unknown }).MSStream;
    const isSafari = /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS|OPiOS|Chrome|Android/.test(ua);
    setIsIosSafari(Boolean(isIos && (isSafari || iPadOsDesktopUa)));
  }, []);
  return isIosSafari;
}
