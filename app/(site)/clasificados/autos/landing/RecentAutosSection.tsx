"use client";

import type { AutosPublicListing } from "../data/autosPublicSampleTypes";
import type { AutosPublicBlueprintCopy } from "../lib/autosPublicBlueprintCopy";
import type { AutosPublicLang } from "../lib/autosPublicBlueprintCopy";
import { AutosLandingInventoryCard } from "./AutosLandingInventoryCard";
import { AutosLandingSectionEmpty } from "./AutosLandingSectionEmpty";
import { autosLandingSectionClass } from "./autosLandingLayout";

export function RecentAutosSection({
  copy,
  lang,
  listings,
  heading,
  subheading,
  browseAllHref,
}: {
  copy: AutosPublicBlueprintCopy;
  lang: AutosPublicLang;
  listings: AutosPublicListing[];
  heading?: string;
  subheading?: string;
  browseAllHref?: string;
}) {
  const title = heading ?? copy.recentAddedTitle;
  const subtitle = subheading ?? copy.recentAddedSubtitle;

  return (
    <section className={autosLandingSectionClass}>
      <div className="rounded-[20px] border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)]/60 px-4 py-6 shadow-[0_10px_36px_-16px_rgba(42,36,22,0.12)] sm:px-6 sm:py-7">
        <h2 className="font-serif text-xl font-semibold tracking-tight text-[color:var(--lx-text)] sm:text-2xl">{title}</h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[color:var(--lx-muted)]">{subtitle}</p>
        {listings.length > 0 ? (
          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-4 md:gap-5 lg:grid-cols-4 lg:gap-5">
            {listings.map((l) => (
              <AutosLandingInventoryCard key={l.id} listing={l} copy={copy} lang={lang} variant="recent" />
            ))}
          </div>
        ) : browseAllHref ? (
          <AutosLandingSectionEmpty copy={copy} browseAllHref={browseAllHref} />
        ) : null}
      </div>
    </section>
  );
}
