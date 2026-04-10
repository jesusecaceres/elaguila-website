"use client";

import type { AutoDealerListing } from "@/app/clasificados/autos/negocios/types/autoDealerListing";
import type { AutosNegociosCopy } from "@/app/clasificados/autos/negocios/lib/autosNegociosCopy";
import type { AutosNegociosLang } from "@/app/clasificados/autos/negocios/lib/autosNegociosLang";
import {
  getAutosPreviewCompletenessIssues,
  mapAutosPreviewIssueToStep,
  type AutosPreviewCompletenessKey,
  type AutosPreviewLane,
} from "@/app/clasificados/autos/shared/lib/autosPreviewCompleteness";
import type { AutosApplicationStepContext } from "./AutosApplicationSteppedShell";

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

/**
 * Informative checklist only (no preview/publish/delete). Shown below the progress row.
 */
export function AutosApplicationMissingItemsBanner({
  lane,
  lang,
  copy,
  listing,
  stepCtx,
}: {
  lane: AutosPreviewLane;
  lang: AutosNegociosLang;
  copy: AutosNegociosCopy;
  listing: AutoDealerListing;
  stepCtx: AutosApplicationStepContext;
}) {
  const issues = getAutosPreviewCompletenessIssues(lane, listing);
  const h = copy.app.hints;
  if (issues.length === 0) return null;

  return (
    <div className="mb-6 rounded-[14px] border border-[color:var(--lx-gold-border)] bg-[color:var(--lx-nav-hover)] px-3.5 py-3 text-[13px] leading-snug text-[color:var(--lx-text-2)] shadow-sm">
      <p className="font-semibold text-[color:var(--lx-text)]">{h.previewCompletenessIntro}</p>
      <ul className="mt-2 list-none space-y-2">
        {issues.map((issue) => {
          const stepIndex = mapAutosPreviewIssueToStep(issue);
          const stepNum = stepIndex + 1;
          return (
            <li key={issue} className="flex flex-wrap items-baseline gap-x-2 gap-y-1 pl-0.5">
              <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-[color:var(--lx-gold)]" aria-hidden />
              <span className="min-w-0 flex-1">{h[previewHintKey(issue)]}</span>
              <button
                type="button"
                className="shrink-0 text-xs font-bold text-[#2d528d] underline underline-offset-2 hover:text-[#1e3d6b]"
                onClick={() => stepCtx.goToStep(stepIndex, { bypassMax: true })}
              >
                {lang === "es" ? `Ir al paso ${stepNum}` : `Go to step ${stepNum}`}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
