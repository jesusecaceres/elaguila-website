"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

import { ensureLeonixServiceWorker } from "@/app/components/digitalContact/LeonixServiceWorkerRegister";
import {
  detectLeoPwaCapabilities,
  type LeoPwaCapabilities,
} from "@/app/leo/_lib/leoPwaCapabilities";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

/**
 * LEO-14.8 PWA shell — registers the canonical Leonix SW once,
 * tracks online/install/standalone state. No second SW / no fake offline brain.
 */
export function LeoPwaShell({
  children,
  onOnlineChange,
}: {
  children: ReactNode;
  onOnlineChange?: (online: boolean) => void;
}) {
  const [caps, setCaps] = useState<LeoPwaCapabilities>(() => detectLeoPwaCapabilities());
  const [networkFlash, setNetworkFlash] = useState<"offline" | "online" | null>(null);
  const [installReady, setInstallReady] = useState(false);
  const deferredPrompt = useRef<BeforeInstallPromptEvent | null>(null);
  const registered = useRef(false);

  useEffect(() => {
    if (registered.current) return;
    registered.current = true;
    void ensureLeonixServiceWorker();
  }, []);

  useEffect(() => {
    const sync = () => {
      const next = detectLeoPwaCapabilities({
        online: navigator.onLine,
        installPromptAvailable: Boolean(deferredPrompt.current),
      });
      setCaps(next);
      onOnlineChange?.(next.online);
    };
    sync();

    const onOffline = () => {
      sync();
      setNetworkFlash("offline");
    };
    const onOnline = () => {
      sync();
      setNetworkFlash("online");
      window.setTimeout(() => setNetworkFlash((f) => (f === "online" ? null : f)), 2500);
    };

    window.addEventListener("offline", onOffline);
    window.addEventListener("online", onOnline);

    const onBip = (e: Event) => {
      e.preventDefault();
      deferredPrompt.current = e as BeforeInstallPromptEvent;
      setInstallReady(true);
      setCaps(
        detectLeoPwaCapabilities({
          online: navigator.onLine,
          installPromptAvailable: true,
        }),
      );
    };
    window.addEventListener("beforeinstallprompt", onBip);

    return () => {
      window.removeEventListener("offline", onOffline);
      window.removeEventListener("online", onOnline);
      window.removeEventListener("beforeinstallprompt", onBip);
    };
  }, [onOnlineChange]);

  const requestInstall = useCallback(async () => {
    const ev = deferredPrompt.current;
    if (!ev) return;
    try {
      await ev.prompt();
      await ev.userChoice;
    } catch {
      /* ignore */
    } finally {
      deferredPrompt.current = null;
      setInstallReady(false);
      setCaps(
        detectLeoPwaCapabilities({
          online: navigator.onLine,
          installPromptAvailable: false,
        }),
      );
    }
  }, []);

  const standalonePad = caps.standaloneDisplay
    ? "pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]"
    : "";

  return (
    <div className={`min-w-0 ${standalonePad}`} data-leo-pwa-shell data-standalone={caps.standaloneDisplay ? "1" : "0"}>
      <div className="mb-2 flex min-w-0 flex-wrap items-center gap-2">
        {networkFlash === "offline" || !caps.online ? (
          <p className="text-[11px] text-amber-900" role="status">
            Offline
          </p>
        ) : null}
        {networkFlash === "online" && caps.online ? (
          <p className="text-[11px] text-[#2A4536]" role="status">
            Back online
          </p>
        ) : null}
        {installReady && !caps.standaloneDisplay ? (
          <button
            type="button"
            onClick={() => void requestInstall()}
            className="inline-flex min-h-[36px] items-center rounded-lg border border-[color:var(--lx-border)] bg-[color:var(--lx-section)] px-2.5 text-[11px] font-semibold text-[#1E1810]"
          >
            Install Leonix
          </button>
        ) : null}
      </div>
      {children}
    </div>
  );
}
