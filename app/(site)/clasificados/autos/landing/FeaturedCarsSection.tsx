"use client";

import { FaStar } from "react-icons/fa";
import type { AutosPublicListing } from "../data/autosPublicSampleTypes";
import type { AutosPublicBlueprintCopy } from "../lib/autosPublicBlueprintCopy";
import type { AutosPublicLang } from "../lib/autosPublicBlueprintCopy";
import { AutosLandingInventoryCard } from "./AutosLandingInventoryCard";

export function FeaturedCarsSection({
  copy,
  lang,
  listings,
}: {
  copy: AutosPublicBlueprintCopy;
  lang: AutosPublicLang;
  listings: AutosPublicListing[];
}) {
  return (
    <section className="mx-auto max-w-[1280px] px-4 sm:px-5 md:px-6">
      <div className="flex items-center gap-2">
        <FaStar className="h-4 w-4 text-[color:var(--lx-gold)]" aria-hidden />
        <h2 className="font-serif text-xl font-semibold tracking-tight text-[color:var(--lx-text)] sm:text-2xl">{copy.landingFeaturedTitle}</h2>
      </div>
      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 xl:grid-cols-6">
        {listings.map((l) => (
          <AutosLandingInventoryCard key={l.id} listing={l} copy={copy} lang={lang} variant="featured" />
        ))}
      </div>
    </section>
  );
}
