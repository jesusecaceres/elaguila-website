"use client";

import type { AutoDealerListing } from "@/app/clasificados/autos/negocios/types/autoDealerListing";
import type { AutosNegociosCopy } from "@/app/clasificados/autos/negocios/lib/autosNegociosCopy";
import {
  getAutosPreviewCompletenessIssues,
  type AutosPreviewCompletenessKey,
  type AutosPreviewLane,
} from "@/app/clasificados/autos/shared/lib/autosPreviewCompleteness";
import type { AutosNegociosLang } from "@/app/clasificados/autos/negocios/lib/autosNegociosLang";
import { getAutosApplicationStepShellCopy } from "../lib/autosApplicationStepShellCopy";

const CARD =
  "rounded-[20px] border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] p-5 shadow-[0_8px_28px_-12px_rgba(42,36,22,0.12)] sm:p-6";

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

export function AutosApplicationReviewStep({
  lane,
  listing,
  copy,
  lang,
}: {
  lane: AutosPreviewLane;
  listing: AutoDealerListing;
  copy: AutosNegociosCopy;
  lang: AutosNegociosLang;
}) {
  const shell = getAutosApplicationStepShellCopy(lang);
  const issues = getAutosPreviewCompletenessIssues(lane, listing);
  const h = copy.app.hints;
  const ready = issues.length === 0;

  return (
    <section className={CARD} aria-labelledby="autos-app-review-heading">
      <h2 id="autos-app-review-heading" className="text-xl font-bold tracking-tight text-[color:var(--lx-text)]">
        {shell.reviewTitle}
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-[color:var(--lx-text-2)]">{shell.reviewIntro}</p>

      {!ready ? (
        <div className="mt-5 rounded-[14px] border border-amber-300/50 bg-amber-50/50 px-4 py-3.5 text-sm text-amber-950 shadow-sm">
          <p className="font-semibold leading-snug">{shell.reviewNotReadyTitle}</p>
          <p className="mt-1.5 text-[13px] leading-relaxed text-amber-950/90">{shell.reviewNotReadyIntro}</p>
        </div>
      ) : null}

      <div
        className={`mt-6 rounded-[14px] border px-4 py-4 sm:px-5 ${
          ready ? "border-[color:var(--lx-nav-border)] bg-[color:var(--lx-section)]" : "border-amber-300/35 bg-[color:var(--lx-section)]/60"
        }`}
      >
        <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[color:var(--lx-muted)]">{shell.reviewChecklistTitle}</p>
        {ready ? (
          <p className="mt-2 text-sm font-medium leading-relaxed text-[color:var(--lx-text)]">{shell.reviewAllGood}</p>
        ) : (
          <ul className="mt-3 list-none space-y-2.5 text-sm leading-snug text-[color:var(--lx-text-2)]">
            {issues.map((issue) => (
              <li key={issue} className="flex gap-2">
                <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-[color:var(--lx-gold)]" aria-hidden />
                <span>{h[previewHintKey(issue)]}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
