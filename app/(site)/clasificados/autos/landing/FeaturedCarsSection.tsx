"use client";

import { FaStar } from "react-icons/fa";
import type { AutosPublicListing } from "../data/autosPublicSampleTypes";
import type { AutosPublicBlueprintCopy } from "../lib/autosPublicBlueprintCopy";
import type { AutosPublicLang } from "../lib/autosPublicBlueprintCopy";
import { AutosLandingInventoryCard } from "./AutosLandingInventoryCard";
import { AutosLandingSectionEmpty } from "./AutosLandingSectionEmpty";
import { autosLandingSectionClass } from "./autosLandingLayout";

export function FeaturedCarsSection({
  copy,
  lang,
  listings,
  heading,
  subheading,
  showStar = true,
  browseAllHref,
}: {
  copy: AutosPublicBlueprintCopy;
  lang: AutosPublicLang;
  listings: AutosPublicListing[];
  /** Overrides default featured landing title when this band is dealer-only or mixed. */
  heading?: string;
  subheading?: string;
  showStar?: boolean;
  browseAllHref?: string;
}) {
  const title = heading ?? copy.landingFeaturedTitle;
  const subtitle = subheading ?? copy.landingFeaturedSubtitle;

  return (
    <section className={autosLandingSectionClass}>
      <div className="rounded-[20px] border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)]/60 px-4 py-6 shadow-[0_10px_36px_-16px_rgba(42,36,22,0.12)] sm:px-6 sm:py-7">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              {showStar ? <FaStar className="h-4 w-4 shrink-0 text-[color:var(--lx-gold)]" aria-hidden /> : null}
              <h2 className="font-serif text-xl font-semibold tracking-tight text-[color:var(--lx-text)] sm:text-2xl">{title}</h2>
            </div>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[color:var(--lx-muted)]">{subtitle}</p>
          </div>
        </div>
        {listings.length > 0 ? (
          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-4 md:gap-5 lg:grid-cols-3 lg:gap-5 xl:grid-cols-4 2xl:grid-cols-6 2xl:gap-5">
            {listings.map((l) => (
              <AutosLandingInventoryCard key={l.id} listing={l} copy={copy} lang={lang} variant="featured" />
            ))}
          </div>
        ) : browseAllHref ? (
          <AutosLandingSectionEmpty copy={copy} browseAllHref={browseAllHref} />
        ) : null}
      </div>
    </section>
  );
}
