"use client";

import { useEffect, useState } from "react";
import type { AutoDealerListing } from "@/app/clasificados/autos/negocios/types/autoDealerListing";
import type { AutosNegociosCopy } from "@/app/clasificados/autos/negocios/lib/autosNegociosCopy";
import type { AutosNegociosLang } from "@/app/clasificados/autos/negocios/lib/autosNegociosLang";
import {
  getAutosPreviewCompletenessIssues,
  getFirstBlockingStepIndex,
  type AutosPreviewCompletenessKey,
  type AutosPreviewLane,
} from "@/app/clasificados/autos/shared/lib/autosPreviewCompleteness";
import type { AutosClassifiedsLane } from "@/app/lib/clasificados/autos/autosClassifiedsTypes";
import type { AutosApplicationStepContext } from "./AutosApplicationSteppedShell";
import { getAutosApplicationStepShellCopy } from "../lib/autosApplicationStepShellCopy";
import { AutosPublishPlaceholderModal } from "./AutosPublishPlaceholderModal";

const BTN_SECONDARY =
  "inline-flex min-h-[48px] items-center justify-center rounded-[12px] border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] px-4 text-xs font-bold text-[color:var(--lx-text)] shadow-sm transition hover:bg-[color:var(--lx-nav-hover)]";
const BTN_PRIMARY =
  "inline-flex min-h-[48px] items-center justify-center rounded-[12px] bg-[color:var(--lx-cta-dark)] px-4 text-xs font-bold text-[#FFFCF7] shadow-md transition hover:bg-[color:var(--lx-cta-dark-hover)]";
const BTN_DANGER =
  "inline-flex min-h-[48px] items-center justify-center rounded-[12px] border border-red-200 bg-[#FFFCF7] px-4 text-xs font-bold text-red-900 hover:bg-red-50";

function previewHintKey(issue: AutosPreviewCompletenessKey): keyof AutosNegociosCopy["app"]["hints"] {
  switch (issue) {
    case "media":
      return "previewNeed_media";
    case "title":
      return "previewNeed_title";
    case "price":
      return "previewNeed_price";
    case "location":
      return "previewNeed_location";
    case "dealerIdentity":
      return "previewNeed_dealerIdentity";
    case "sellerContact":
      return "previewNeed_sellerContact";
  }
}

function toPublishLane(lane: AutosPreviewLane): AutosClassifiedsLane {
  return lane;
}

/**
 * Top application controls: Preview (same tab), Publish placeholder, Delete.
 */
export function AutosApplicationTopActions({
  lane,
  lang,
  copy,
  listing,
  stepCtx,
  onPreview,
  onDeleteApplication,
}: {
  lane: AutosPreviewLane;
  lang: AutosNegociosLang;
  copy: AutosNegociosCopy;
  listing: AutoDealerListing;
  stepCtx: AutosApplicationStepContext;
  onPreview: () => void | Promise<void>;
  onDeleteApplication: () => void | Promise<void>;
}) {
  const issues = getAutosPreviewCompletenessIssues(lane, listing);
  const h = copy.app.hints;
  const shell = getAutosApplicationStepShellCopy(lang);
  const [publishOpen, setPublishOpen] = useState(false);
  const [blockedTap, setBlockedTap] = useState<null | "preview" | "publish">(null);

  useEffect(() => {
    if (!blockedTap) return;
    const t = window.setTimeout(() => setBlockedTap(null), 8000);
    return () => window.clearTimeout(t);
  }, [blockedTap]);

  const blockedMessage =
    blockedTap === "preview" ? shell.gatingPreviewTapBlocked : blockedTap === "publish" ? shell.gatingPublishTapBlocked : null;

  function navigateToFirstBlockingStep() {
    const idx = getFirstBlockingStepIndex(lane, listing);
    if (idx !== null) stepCtx.goToStep(idx, { bypassMax: true });
  }

  return (
    <>
      <div className="mb-6 space-y-3 rounded-[16px] border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] p-4 shadow-sm sm:p-5">
        <div
          className="flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:items-stretch sm:gap-2 sm:[&>button]:min-w-0 sm:[&>button]:flex-1 md:[&>button]:flex-none"
          role="group"
          aria-label={lang === "es" ? "Acciones del anuncio" : "Listing actions"}
        >
          <button
            type="button"
            className={`${BTN_PRIMARY} w-full sm:w-auto`}
            onClick={() => {
              if (issues.length > 0) {
                navigateToFirstBlockingStep();
                setBlockedTap("preview");
                return;
              }
              void Promise.resolve(onPreview());
            }}
          >
            {copy.app.actions.openPreview}
          </button>
          <button
            type="button"
            className={`${BTN_SECONDARY} w-full sm:w-auto`}
            onClick={() => {
              if (issues.length > 0) {
                navigateToFirstBlockingStep();
                setBlockedTap("publish");
                return;
              }
              setPublishOpen(true);
            }}
          >
            {copy.app.actions.continueToPublish}
          </button>
          <button
            type="button"
            className={`${BTN_DANGER} w-full sm:w-auto md:ml-auto`}
            onClick={() => {
              if (typeof window !== "undefined" && window.confirm(h.deleteApplicationConfirm)) {
                void Promise.resolve(onDeleteApplication());
              }
            }}
          >
            {copy.app.actions.deleteApplication}
          </button>
        </div>
        {blockedMessage ? (
          <p className="rounded-[12px] border border-amber-300/60 bg-amber-50/90 px-3 py-2 text-[13px] font-medium text-amber-950" role="status">
            {blockedMessage}
          </p>
        ) : null}
        {issues.length > 0 ? (
          <div className="rounded-[12px] border border-[color:var(--lx-gold-border)] bg-[color:var(--lx-nav-hover)] px-3 py-2 text-[13px] text-[color:var(--lx-text-2)]">
            <p className="font-semibold text-[color:var(--lx-text)]">{h.previewCompletenessIntro}</p>
            <ul className="mt-1 list-inside list-disc space-y-0.5">
              {issues.map((issue) => (
                <li key={issue}>{h[previewHintKey(issue)]}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>

      <AutosPublishPlaceholderModal open={publishOpen} onClose={() => setPublishOpen(false)} lang={lang} lane={toPublishLane(lane)} />
    </>
  );
}
