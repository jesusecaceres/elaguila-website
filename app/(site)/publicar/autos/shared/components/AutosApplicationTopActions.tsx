"use client";

import { useState } from "react";
import type { AutoDealerListing } from "@/app/clasificados/autos/negocios/types/autoDealerListing";
import type { AutosNegociosCopy } from "@/app/clasificados/autos/negocios/lib/autosNegociosCopy";
import type { AutosNegociosLang } from "@/app/clasificados/autos/negocios/lib/autosNegociosLang";
import {
  getAutosPreviewCompletenessIssues,
  type AutosPreviewCompletenessKey,
  type AutosPreviewLane,
} from "@/app/clasificados/autos/shared/lib/autosPreviewCompleteness";
import type { AutosClassifiedsLane } from "@/app/lib/clasificados/autos/autosClassifiedsTypes";
import { AutosPublishPlaceholderModal } from "./AutosPublishPlaceholderModal";

const BTN_SECONDARY =
  "inline-flex min-h-[44px] items-center justify-center rounded-[12px] border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] px-4 text-xs font-bold text-[color:var(--lx-text)] shadow-sm transition hover:bg-[color:var(--lx-nav-hover)]";
const BTN_PRIMARY =
  "inline-flex min-h-[44px] items-center justify-center rounded-[12px] bg-[color:var(--lx-cta-dark)] px-4 text-xs font-bold text-[#FFFCF7] shadow-md transition hover:bg-[color:var(--lx-cta-dark-hover)]";
const BTN_DANGER =
  "inline-flex min-h-[44px] items-center justify-center rounded-[12px] border border-red-200 bg-[#FFFCF7] px-4 text-xs font-bold text-red-900 hover:bg-red-50";

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
  onPreview,
  onDeleteApplication,
}: {
  lane: AutosPreviewLane;
  lang: AutosNegociosLang;
  copy: AutosNegociosCopy;
  listing: AutoDealerListing;
  onPreview: () => void | Promise<void>;
  onDeleteApplication: () => void | Promise<void>;
}) {
  const issues = getAutosPreviewCompletenessIssues(lane, listing);
  const h = copy.app.hints;
  const [publishOpen, setPublishOpen] = useState(false);

  return (
    <>
      <div className="mb-6 space-y-3 rounded-[16px] border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-2">
          <button
            type="button"
            className={BTN_PRIMARY}
            onClick={() => {
              void Promise.resolve(onPreview());
            }}
          >
            {copy.app.actions.openPreview}
          </button>
          <button type="button" className={BTN_SECONDARY} onClick={() => setPublishOpen(true)}>
            {copy.app.actions.continueToPublish}
          </button>
          <button
            type="button"
            className={`${BTN_DANGER} sm:ml-auto`}
            onClick={() => {
              if (typeof window !== "undefined" && window.confirm(h.deleteApplicationConfirm)) {
                void Promise.resolve(onDeleteApplication());
              }
            }}
          >
            {copy.app.actions.deleteApplication}
          </button>
        </div>
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
