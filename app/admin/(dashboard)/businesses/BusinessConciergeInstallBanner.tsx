"use client";

import { useState } from "react";
import { useInstallPrompt, useIsIosSafari, useIsStandaloneDisplay } from "@/app/lib/pwa/useInstallPrompt";

/**
 * Package C — Staff Studio Install Surface.
 * Lets authorized staff discover that Business Concierge can be installed without needing to
 * know about /admin/field. Reuses the exact same install-prompt behavior as the Field Agent
 * shell (app/lib/pwa/useInstallPrompt.ts) — no new PWA logic, no fake download link.
 *
 * Truthful by construction:
 * - Renders nothing once already running installed (standalone display mode).
 * - Renders the real browser install button only when the browser actually supports it
 *   (beforeinstallprompt fired).
 * - On iOS Safari (which never fires beforeinstallprompt), shows static "Add to Home Screen"
 *   instructions instead of a dead button — never fake functionality.
 * - On any other unsupported browser, renders nothing.
 * - Installing does not grant any additional capability — the same server-authoritative
 *   role/capability checks (requireSalesWorkspaceAccess) apply whether installed or in-browser.
 */
export function BusinessConciergeInstallBanner() {
  const { canInstall, promptInstall } = useInstallPrompt();
  const isStandalone = useIsStandaloneDisplay();
  const isIosSafari = useIsIosSafari();
  const [iosInstructionsOpen, setIosInstructionsOpen] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  if (isStandalone || dismissed) return null;
  if (!canInstall && !isIosSafari) return null;

  return (
    <div className="flex w-full flex-col gap-2 rounded-xl border border-[#E8DFD0] bg-[#FFFCF7] px-3 py-2.5 sm:w-auto sm:flex-row sm:items-center sm:gap-3">
      <div className="min-w-0">
        <p className="text-xs font-bold text-[#1E1810]">Business Concierge</p>
        <p className="text-[11px] text-[#7A7164]">Take Business Concierge with you.</p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {canInstall ? (
          <button
            type="button"
            onClick={() => void promptInstall()}
            className="min-h-[40px] rounded-lg bg-[#7A1E2C] px-3 py-1.5 text-xs font-bold text-white sm:min-h-0"
          >
            Install app
          </button>
        ) : isIosSafari ? (
          <button
            type="button"
            onClick={() => setIosInstructionsOpen((v) => !v)}
            className="min-h-[40px] rounded-lg border border-[#7A1E2C] px-3 py-1.5 text-xs font-bold text-[#7A1E2C] sm:min-h-0"
          >
            Install on iPhone
          </button>
        ) : null}
        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label="Dismiss"
          className="min-h-[40px] rounded-lg px-2 py-1.5 text-xs font-semibold text-[#7A7164] sm:min-h-0"
        >
          Dismiss
        </button>
      </div>
      {iosInstructionsOpen ? (
        <p className="w-full rounded-lg bg-white px-3 py-2 text-[11px] leading-relaxed text-[#5C5346] sm:w-auto sm:max-w-xs">
          To install on iPhone: tap <span className="font-semibold">Share</span>, then{" "}
          <span className="font-semibold">Add to Home Screen</span>.
        </p>
      ) : null}
    </div>
  );
}
