"use client";

import { useState } from "react";
import { useInstallPrompt, useIsIosSafari, useIsStandaloneDisplay } from "@/app/lib/pwa/useInstallPrompt";

/**
 * Visible install surface for the one shared Business Concierge PWA.
 * Chromium: user-triggered beforeinstallprompt. iOS/iPadOS: Add to Home Screen instructions.
 * Unsupported: truthful help, never a dead Install button. Standalone: Installed, no nag.
 * Installation does not change server authorization.
 */
export function BusinessConciergeInstallBanner() {
  const { canInstall, promptInstall, lastOutcome } = useInstallPrompt();
  const isStandalone = useIsStandaloneDisplay();
  const isIosSafari = useIsIosSafari();
  const [iosInstructionsOpen, setIosInstructionsOpen] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [promptBusy, setPromptBusy] = useState(false);

  if (dismissed && !isStandalone && lastOutcome !== "accepted") return null;

  if (isStandalone || lastOutcome === "accepted") {
    return (
      <div className="flex w-full min-w-0 items-center rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 sm:w-auto">
        <p className="text-xs font-bold text-[#1F3A2D]">Installed</p>
      </div>
    );
  }

  async function onInstallClick() {
    setPromptBusy(true);
    await promptInstall();
    setPromptBusy(false);
  }

  return (
    <div className="flex w-full min-w-0 max-w-full flex-col gap-2 overflow-hidden rounded-xl border border-[#E8DFD0] bg-[#FFFCF7] px-3 py-2.5 sm:max-w-md">
      <div className="min-w-0">
        <p className="text-xs font-bold text-[#1E1810]">Install Business Concierge</p>
        <p className="text-[11px] text-[#7A7164]">One shared app. Your login decides access.</p>
      </div>
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        {canInstall ? (
          <button
            type="button"
            disabled={promptBusy}
            onClick={() => void onInstallClick()}
            className="inline-flex min-h-[44px] items-center rounded-lg bg-[#7A1E2C] px-3 py-2 text-xs font-bold text-white disabled:opacity-50"
          >
            {promptBusy ? "Installing…" : "Install Business Concierge"}
          </button>
        ) : isIosSafari ? (
          <button
            type="button"
            onClick={() => setIosInstructionsOpen((v) => !v)}
            className="inline-flex min-h-[44px] items-center rounded-lg border border-[#7A1E2C] px-3 py-2 text-xs font-bold text-[#7A1E2C]"
          >
            Add to Home Screen
          </button>
        ) : lastOutcome === "dismissed" ? null : (
          <p className="text-[11px] leading-relaxed text-[#5C5346]">
            This browser cannot install automatically. Use Chrome or Edge, or on iPhone/iPad use Safari Share → Add to Home Screen.
          </p>
        )}
        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label="Dismiss install help"
          className="inline-flex min-h-[44px] items-center rounded-lg px-2 py-2 text-xs font-semibold text-[#7A7164]"
        >
          Dismiss
        </button>
      </div>
      {lastOutcome === "dismissed" ? (
        <p className="text-[11px] text-[#7A7164]">Install was dismissed. You can try again later from this page.</p>
      ) : null}
      {iosInstructionsOpen ? (
        <p className="rounded-lg bg-white px-3 py-2 text-[11px] leading-relaxed text-[#5C5346]">
          Safari: tap <span className="font-semibold">Share</span>, then <span className="font-semibold">Add to Home Screen</span>.
          Automatic install is not available on iPhone/iPad Safari.
        </p>
      ) : null}
    </div>
  );
}
