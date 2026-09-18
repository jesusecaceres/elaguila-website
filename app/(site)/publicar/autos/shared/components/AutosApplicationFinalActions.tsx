"use client";

import { useRouter } from "next/navigation";
import { useEffect, useId, useState } from "react";
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
import { getAutosPublishPlaceholderCopy } from "../lib/autosPublishPlaceholderCopy";
import {
  buildAutosInventoryAddConfirmHref,
  type AutosInventoryAddContext,
} from "@/app/lib/clasificados/autos/autosDealerInventoryAddFlow";

const BTN_SECONDARY =
  "inline-flex min-h-[48px] w-full items-center justify-center rounded-2xl border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] px-4 text-sm font-bold text-[color:var(--lx-text)] shadow-sm transition hover:bg-[color:var(--lx-nav-hover)] active:opacity-90 sm:w-auto sm:min-w-[160px]";
const BTN_PRIMARY =
  "inline-flex min-h-[48px] w-full items-center justify-center rounded-2xl bg-[color:var(--lx-cta-dark)] px-4 text-sm font-bold text-[#FFFCF7] shadow-md transition hover:bg-[color:var(--lx-cta-dark-hover)] active:opacity-90 sm:w-auto sm:min-w-[160px]";

function toPublishLane(lane: AutosPreviewLane): AutosClassifiedsLane {
  return lane;
}

/**
 * Final-step-only: preview, publish (gated), confirmations, delete. Not duplicated in the header.
 */
export function AutosApplicationFinalActions({
  lane,
  lang,
  copy,
  listing,
  stepCtx,
  onPreview,
  onDeleteApplication,
  flushDraft,
  inventoryAddMode = false,
  inventoryAddContext = null,
  onSaveEdit,
}: {
  lane: AutosPreviewLane;
  lang: AutosNegociosLang;
  copy: AutosNegociosCopy;
  listing: AutoDealerListing;
  stepCtx: AutosApplicationStepContext;
  onPreview: () => void | Promise<void>;
  onDeleteApplication: () => void | Promise<void>;
  flushDraft: () => Promise<void>;
  inventoryAddMode?: boolean;
  inventoryAddContext?: AutosInventoryAddContext | null;
  /** Dashboard edit of an EXISTING listing: saves to the same row. When set, the "continue to publish"
   * path (which would POST a NEW listing and start a new charge) is not offered. */
  onSaveEdit?: () => Promise<{ ok: boolean; message?: string }>;
}) {
  const router = useRouter();
  const baseId = useId();
  const issues = getAutosPreviewCompletenessIssues(lane, listing);
  const shell = getAutosApplicationStepShellCopy(lang);
  const publishLane = toPublishLane(lane);
  const c = getAutosPublishPlaceholderCopy(lang, publishLane);
  const [checks, setChecks] = useState([false, false, false]);
  const [blockedTap, setBlockedTap] = useState<null | "preview" | "publish" | "checks">(null);
  const [continueBusy, setContinueBusy] = useState(false);
  const [saveBusy, setSaveBusy] = useState(false);
  const [saveNote, setSaveNote] = useState<{ ok: boolean; text: string } | null>(null);

  const allChecks = checks.every(Boolean);
  const publishConfirmHref =
    inventoryAddMode && inventoryAddContext
      ? buildAutosInventoryAddConfirmHref(inventoryAddContext, lang)
      : withLangParam(
          publishLane === "negocios" ? "/publicar/autos/negocios/confirm" : "/publicar/autos/privado/confirm",
          lang,
        );
  useEffect(() => {
    if (!blockedTap) return;
    const t = window.setTimeout(() => setBlockedTap(null), 8000);
    return () => window.clearTimeout(t);
  }, [blockedTap]);

  const blockedMessage =
    blockedTap === "preview"
      ? shell.gatingPreviewTapBlocked
      : blockedTap === "publish"
        ? shell.gatingPublishTapBlocked
        : blockedTap === "checks"
          ? shell.gatingPublishChecksBlocked
          : null;

  function navigateToFirstBlockingStep() {
    const idx = getFirstBlockingStepIndex(lane, listing);
    if (idx !== null) stepCtx.goToStep(idx, { bypassMax: true });
  }

  const h = copy.app.actions;
  const continueLabel =
    inventoryAddMode && publishLane === "negocios"
      ? lang === "es"
        ? "Agregar al inventario"
        : "Add to inventory"
      : h.continueToPublish;
  const del = copy.app.hints.deleteApplicationConfirm;
  // Owner lock — Dealer main application review step exposes Preview only; publication happens
  // exclusively from Preview → Checkout Checkpoint → Revenue OS → Stripe → verified webhook.
  // Privado keeps its existing proven "continue to publish" path, and the child-draft
  // "Agregar al inventario" action is NOT public publication, so it stays for both lanes.
  const showSecondaryContinueButton = !onSaveEdit && (publishLane !== "negocios" || inventoryAddMode);

  return (
    <div className="mt-6 border-t border-[color:var(--lx-nav-border)] pt-6">
      <p className="text-sm leading-relaxed text-[color:var(--lx-text-2)]">{shell.finalStepActionsIntro}</p>

      {showSecondaryContinueButton ? (
        <div className="mt-6">
          <h3 className="text-sm font-bold text-[color:var(--lx-text)]">{shell.finalStepPublishHeading}</h3>
          <ul className="mt-4 space-y-3.5">
            <li className="flex gap-3">
              <input
                id={`${baseId}-a`}
                type="checkbox"
                checked={checks[0]}
                onChange={(e) => setChecks((x) => [e.target.checked, x[1], x[2]])}
                className="mt-0.5 h-5 w-5 shrink-0 rounded border-[color:var(--lx-nav-border)]"
              />
              <label htmlFor={`${baseId}-a`} className="text-sm leading-snug text-[color:var(--lx-text)]">
                {c.checks.accurate}
              </label>
            </li>
            <li className="flex gap-3">
              <input
                id={`${baseId}-b`}
                type="checkbox"
                checked={checks[1]}
                onChange={(e) => setChecks((x) => [x[0], e.target.checked, x[2]])}
                className="mt-0.5 h-5 w-5 shrink-0 rounded border-[color:var(--lx-nav-border)]"
              />
              <label htmlFor={`${baseId}-b`} className="text-sm leading-snug text-[color:var(--lx-text)]">
                {c.checks.rules}
              </label>
            </li>
            <li className="flex gap-3">
              <input
                id={`${baseId}-c`}
                type="checkbox"
                checked={checks[2]}
                onChange={(e) => setChecks((x) => [x[0], x[1], e.target.checked])}
                className="mt-0.5 h-5 w-5 shrink-0 rounded border-[color:var(--lx-nav-border)]"
              />
              <label htmlFor={`${baseId}-c`} className="text-sm leading-snug text-[color:var(--lx-text)]">
                {c.checks.paidPlaceholder}
              </label>
            </li>
          </ul>
          <p className="mt-2 text-xs text-[color:var(--lx-muted)]">{c.mustCheck}</p>
          <p className="mt-3 text-xs leading-relaxed text-[color:var(--lx-text-2)]">{c.phaseNote}</p>
        </div>
      ) : null}

      <div
        className="mt-6 flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:items-stretch"
        role="group"
        aria-label={lang === "es" ? "Vista previa y publicación" : "Preview and publish"}
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
          {h.openPreview}
        </button>
        {onSaveEdit ? (
          <button
            type="button"
            className={BTN_SECONDARY}
            disabled={saveBusy}
            data-testid="autos-dashboard-edit-save"
            onClick={() => {
              if (issues.length > 0) {
                navigateToFirstBlockingStep();
                setBlockedTap("preview");
                return;
              }
              setSaveBusy(true);
              setSaveNote(null);
              void (async () => {
                try {
                  const r = await onSaveEdit();
                  setSaveNote({
                    ok: r.ok,
                    text: r.message ?? (r.ok ? (lang === "es" ? "Cambios guardados." : "Changes saved.") : lang === "es" ? "No se pudo guardar." : "Could not save."),
                  });
                } finally {
                  setSaveBusy(false);
                }
              })();
            }}
          >
            {lang === "es" ? "Guardar cambios" : "Save changes"}
          </button>
        ) : null}
        {showSecondaryContinueButton ? (
          <button
            type="button"
            className={BTN_SECONDARY}
            disabled={continueBusy}
            onClick={() => {
              if (issues.length > 0) {
                navigateToFirstBlockingStep();
                setBlockedTap("publish");
                return;
              }
              if (!allChecks) {
                setBlockedTap("checks");
                return;
              }
              setContinueBusy(true);
              void (async () => {
                try {
                  await flushDraft();
                  router.push(publishConfirmHref);
                } finally {
                  setContinueBusy(false);
                }
              })();
            }}
          >
            {continueLabel}
          </button>
        ) : null}
      </div>
      {saveNote ? (
        <p
          className={`mt-3 rounded-[12px] border px-3 py-2 text-[13px] font-medium ${saveNote.ok ? "border-emerald-300/60 bg-emerald-50/90 text-emerald-950" : "border-red-300/60 bg-red-50/90 text-red-950"}`}
          role="status"
        >
          {saveNote.text}
        </p>
      ) : null}
      {blockedMessage ? (
        <p
          className="mt-3 rounded-[12px] border border-amber-300/60 bg-amber-50/90 px-3 py-2 text-[13px] font-medium text-amber-950"
          role="status"
        >
          {blockedMessage}
        </p>
      ) : null}
      <div className="mt-5">
        <button
          type="button"
          className="text-xs font-medium text-red-800/90 underline decoration-red-800/30 underline-offset-2 hover:text-red-950"
          onClick={() => {
            if (typeof window !== "undefined" && window.confirm(del)) {
              void Promise.resolve(onDeleteApplication());
            }
          }}
        >
          {copy.app.actions.deleteApplication}
        </button>
      </div>
    </div>
  );
}
