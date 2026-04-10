"use client";

import type { AutosPublicListing } from "../data/autosPublicSampleTypes";
import type { AutosPublicBlueprintCopy } from "../lib/autosPublicBlueprintCopy";
import type { AutosPublicLang } from "../lib/autosPublicBlueprintCopy";
import { AutosLandingInventoryCard } from "./AutosLandingInventoryCard";
import { autosLandingSectionClass } from "./autosLandingLayout";

export function RecentAutosSection({
  copy,
  lang,
  listings,
}: {
  copy: AutosPublicBlueprintCopy;
  lang: AutosPublicLang;
  listings: AutosPublicListing[];
}) {
  if (listings.length === 0) return null;

  return (
    <section className={autosLandingSectionClass}>
      <h2 className="font-serif text-xl font-semibold tracking-tight text-[color:var(--lx-text)] sm:text-2xl">{copy.recentAddedTitle}</h2>
      <p className="mt-2 max-w-2xl text-sm text-[color:var(--lx-muted)]">{copy.recentAddedSubtitle}</p>
      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-4 md:gap-5 lg:grid-cols-4 lg:gap-5">
        {listings.map((l) => (
          <AutosLandingInventoryCard key={l.id} listing={l} copy={copy} lang={lang} variant="recent" />
        ))}
      </div>
    </section>
  );
}
