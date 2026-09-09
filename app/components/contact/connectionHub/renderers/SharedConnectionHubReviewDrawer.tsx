"use client";

import { useState } from "react";
import { LeonixMobileBottomSheet } from "@/app/(site)/components/mobile/LeonixMobileBottomSheet";
import { SharedConnectionHubReviewButton } from "./SharedConnectionHubReviewButton";
import type { SharedConnectionHubReviewLink } from "../sharedConnectionHubContactTypes";

/**
 * Globalization Build B (Gate B5) — shared Google/Yelp quick-view drawer.
 *
 * The smallest truthful regroup of the existing per-provider outbound links: this component
 * invents NO new data. It hosts the exact same `SharedConnectionHubReviewButton` instances
 * (still Level-A link-only — never a rating/count/snippet) behind one trigger, using the
 * existing `LeonixMobileBottomSheet` primitive for mobile-sheet/desktop-drawer behavior.
 *
 * This does not reopen `docs/qa/DECISION_google_yelp_quickview.md`'s deferred question (showing
 * REAL provider rating/review data) — that still has no data source and stays deferred. This is
 * presentation only: N inline buttons become one "External reviews" trigger + drawer.
 *
 * Renders nothing at all when there are no review links — no empty drawer, no trigger implying a
 * missing score.
 */

const COPY = {
  es: {
    trigger: "Reseñas externas",
    title: "Reseñas externas",
    disclaimer: "Leonix no calcula ni almacena calificaciones de Google o Yelp.",
  },
  en: {
    trigger: "External reviews",
    title: "External reviews",
    disclaimer: "Leonix does not compute or store Google or Yelp ratings.",
  },
} as const;

const DEFAULT_TRIGGER_CLASS =
  "flex min-h-[44px] w-full items-center justify-between gap-3 rounded-lg border-2 border-[#D6C7AD] bg-white px-3.5 py-2.5 text-left text-sm font-semibold text-[#1E1814] shadow-sm transition hover:bg-[#FAF6EE] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A84A]/45";

export function SharedConnectionHubReviewDrawer({
  links,
  lang,
  businessName,
  onLinkClick,
  triggerClassName,
  triggerLabel,
}: {
  links: SharedConnectionHubReviewLink[];
  lang: "es" | "en";
  /** Shown at the top of the drawer body for context — never combined into a score. */
  businessName?: string;
  onLinkClick: (link: SharedConnectionHubReviewLink) => void;
  triggerClassName?: string;
  /** Override the trigger button's own label (defaults to "External reviews"/"Reseñas externas"). */
  triggerLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const copy = COPY[lang];

  if (links.length === 0) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={triggerClassName ?? DEFAULT_TRIGGER_CLASS}
      >
        <span>{triggerLabel ?? copy.trigger}</span>
      </button>
      <LeonixMobileBottomSheet
        open={open}
        onClose={() => setOpen(false)}
        title={copy.title}
        ariaLabel={copy.title}
        lang={lang}
        placement="bottom"
      >
        {businessName?.trim() ? (
          <p className="mb-2 truncate text-sm font-bold text-[#1E1814]">{businessName.trim()}</p>
        ) : null}
        <p className="mb-3 text-xs leading-relaxed text-[#6F6254]">{copy.disclaimer}</p>
        <div className="flex flex-col gap-2">
          {links.map((link) => (
            <SharedConnectionHubReviewButton
              key={`${link.provider}-${link.url}`}
              link={link}
              lang={lang}
              onClick={() => onLinkClick(link)}
            />
          ))}
        </div>
      </LeonixMobileBottomSheet>
    </>
  );
}
