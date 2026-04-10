"use client";

import { useEffect, useState } from "react";
import type { AutoDealerListing } from "@/app/clasificados/autos/negocios/types/autoDealerListing";
import type { AutosNegociosCopy } from "@/app/clasificados/autos/negocios/lib/autosNegociosCopy";
import type { AutosNegociosLang } from "@/app/clasificados/autos/negocios/lib/autosNegociosLang";
import {
  getAutosPreviewCompletenessIssues,
  getFirstBlockingStepIndex,
  type AutosPreviewLane,
} from "@/app/clasificados/autos/shared/lib/autosPreviewCompleteness";
import { withLangParam } from "@/app/clasificados/autos/negocios/lib/autosNegociosLang";
import type { AutosClassifiedsLane } from "@/app/lib/clasificados/autos/autosClassifiedsTypes";
import type { AutosApplicationStepContext } from "./AutosApplicationSteppedShell";
import { getAutosApplicationStepShellCopy } from "../lib/autosApplicationStepShellCopy";
import { AutosPublishPlaceholderModal } from "./AutosPublishPlaceholderModal";

const BTN_SECONDARY =
  "inline-flex min-h-[48px] w-full items-center justify-center rounded-2xl border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] px-4 text-sm font-bold text-[color:var(--lx-text)] shadow-sm transition hover:bg-[color:var(--lx-nav-hover)] active:opacity-90 sm:w-auto sm:min-w-[160px]";
const BTN_PRIMARY =
  "inline-flex min-h-[48px] w-full items-center justify-center rounded-2xl bg-[color:var(--lx-cta-dark)] px-4 text-sm font-bold text-[#FFFCF7] shadow-md transition hover:bg-[color:var(--lx-cta-dark-hover)] active:opacity-90 sm:w-auto sm:min-w-[160px]";

function toPublishLane(lane: AutosPreviewLane): AutosClassifiedsLane {
  return lane;
}

/**
 * Final-step-only: Vista previa, Publicar anuncio, subtle delete. Not duplicated in the header.
 */
export function AutosApplicationFinalActions({
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

  const publishLane = toPublishLane(lane);
  const publishConfirmHref = withLangParam(
    publishLane === "negocios" ? "/publicar/autos/negocios/confirm" : "/publicar/autos/privado/confirm",
    lang,
  );

  const h = copy.app.hints;

  return (
    <>
      <div className="mt-6 border-t border-[color:var(--lx-nav-border)] pt-6">
        <p className="text-sm leading-relaxed text-[color:var(--lx-text-2)]">{shell.finalStepActionsIntro}</p>
        <div
          className="mt-4 flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:items-stretch"
          role="group"
          aria-label={lang === "es" ? "Acciones finales" : "Final actions"}
        >
          <button
            type="button"
            className={BTN_PRIMARY}
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
            className={BTN_SECONDARY}
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
        </div>
        {blockedMessage ? (
          <p className="mt-3 rounded-[12px] border border-amber-300/60 bg-amber-50/90 px-3 py-2 text-[13px] font-medium text-amber-950" role="status">
            {blockedMessage}
          </p>
        ) : null}
        <div className="mt-5">
          <button
            type="button"
            className="text-xs font-medium text-red-800/90 underline decoration-red-800/30 underline-offset-2 hover:text-red-950"
            onClick={() => {
              if (typeof window !== "undefined" && window.confirm(h.deleteApplicationConfirm)) {
                void Promise.resolve(onDeleteApplication());
              }
            }}
          >
            {copy.app.actions.deleteApplication}
          </button>
        </div>
      </div>

      <AutosPublishPlaceholderModal
        open={publishOpen}
        onClose={() => setPublishOpen(false)}
        lang={lang}
        lane={publishLane}
        confirmHref={publishConfirmHref}
      />
    </>
  );
}
