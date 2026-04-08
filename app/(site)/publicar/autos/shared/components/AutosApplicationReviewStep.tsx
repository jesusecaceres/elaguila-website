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
  "rounded-[20px] border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] p-4 shadow-[0_8px_28px_-12px_rgba(42,36,22,0.12)] sm:p-5";

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

  return (
    <section className={CARD} aria-labelledby="autos-app-review-heading">
      <h2 id="autos-app-review-heading" className="text-lg font-bold text-[color:var(--lx-text)]">
        {shell.reviewTitle}
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-[color:var(--lx-text-2)]">{shell.reviewIntro}</p>

      <div className="mt-6 rounded-[14px] border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-section)] px-4 py-3">
        <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[color:var(--lx-muted)]">{shell.reviewChecklistTitle}</p>
        {issues.length === 0 ? (
          <p className="mt-2 text-sm text-[color:var(--lx-text-2)]">{shell.reviewAllGood}</p>
        ) : (
          <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-[color:var(--lx-text-2)]">
            {issues.map((issue) => (
              <li key={issue}>{h[previewHintKey(issue)]}</li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
