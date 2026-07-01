import Link from "next/link";
import type { ReactNode } from "react";
import type { Lang } from "@/app/clasificados/config/clasificadosHub";
import { CategoryCompactHero } from "./CategoryCompactHero";
import { CategoryStandardCtaRow } from "./CategoryStandardCtaRow";
import { CategoryStandardSearchRow } from "./CategoryStandardSearchRow";
import { CategoryVisibilityCta, categorySupportsVisibilityCta } from "./CategoryVisibilityCta";
import { CategoryStandardResultsPageShell } from "./CategoryStandardResultsPageShell";
import { CategoryStandardResultsHeader } from "./CategoryStandardResultsHeader";
import {
  categoryStandardTitle,
  type CategoryStandardKey,
  categoryStandardUi,
} from "./categoryStandardTheme";

export type CategoryStandardResultsChromeProps = {
  category: CategoryStandardKey;
  lang: Lang;
  backHref: string;
  backLabel: string;
  resultsAction: string;
  searchPlaceholder: string;
  defaultQ?: string;
  defaultCity?: string;
  publishHref: string;
  publishLabel: string;
  resultCount?: number;
  activeFilterSummary?: ReactNode;
  advancedFilters?: ReactNode;
  chips?: ReactNode;
  clearFiltersHref?: string;
  children: ReactNode;
};

/**
 * Shared results-page chrome — compact header + search; listings slot below.
 */
export function CategoryStandardResultsChrome({
  category,
  lang,
  backHref,
  backLabel,
  resultsAction,
  searchPlaceholder,
  defaultQ = "",
  defaultCity = "",
  publishHref,
  publishLabel,
  resultCount,
  activeFilterSummary,
  advancedFilters,
  chips,
  clearFiltersHref,
  children,
}: CategoryStandardResultsChromeProps) {
  const ui = categoryStandardUi(lang);
  const title = categoryStandardTitle(category, lang);

  return (
    <CategoryStandardResultsPageShell>
      <div className="space-y-4">
        <CategoryStandardResultsHeader
          lang={lang}
          title={title}
          backHref={backHref}
          backLabel={backLabel}
          publishHref={publishHref}
          publishLabel={publishLabel}
          clearHref={clearFiltersHref}
          resultCount={resultCount}
        />

        <CategoryStandardSearchRow
          lang={lang}
          action={resultsAction}
          defaultQ={defaultQ}
          defaultCity={defaultCity}
          searchPlaceholder={searchPlaceholder}
          advancedFilters={advancedFilters}
          chips={chips}
        />

        <CategoryVisibilityCta lang={lang} category={category} surface="results" compact />

        {activeFilterSummary ? (
          <div className="text-xs text-[#3D3428]/80">{activeFilterSummary}</div>
        ) : null}

        {children}
      </div>
    </CategoryStandardResultsPageShell>
  );
}

/** Landing shell: hero embeds search + CTAs */
export type CategoryStandardLandingBlockProps = {
  category: CategoryStandardKey;
  lang: Lang;
  eyebrow?: string;
  title?: string;
  description?: string;
  imageSrc?: string;
  searchAction: string;
  searchPlaceholder: string;
  publishHref: string;
  browseHref: string;
  publishLabel: string;
  browseLabel?: string;
  searchChips?: ReactNode;
  belowHero?: ReactNode;
  children?: ReactNode;
  /** Replaces default GET search row (e.g. Rentas client-side search bar). */
  searchSlot?: ReactNode;
  /** Hide monetization strip from hero/search area (show lower on page instead). */
  suppressVisibilityCta?: boolean;
};

export function CategoryStandardLandingBlock({
  category,
  lang,
  eyebrow,
  title,
  description,
  imageSrc,
  searchAction,
  searchPlaceholder,
  publishHref,
  browseHref,
  publishLabel,
  browseLabel,
  searchChips,
  belowHero,
  searchSlot,
  suppressVisibilityCta = false,
  children,
}: CategoryStandardLandingBlockProps) {
  return (
    <div className="space-y-5 sm:space-y-6">
      <CategoryCompactHero
        category={category}
        lang={lang}
        eyebrow={eyebrow}
        title={title}
        description={description}
        imageSrc={imageSrc}
      >
        {searchSlot ?? (
          <CategoryStandardSearchRow
            lang={lang}
            action={searchAction}
            searchPlaceholder={searchPlaceholder}
            chips={searchChips}
            className="!border-0 !bg-transparent !p-0 !shadow-none"
          />
        )}
        <div className="mt-3">
          <CategoryStandardCtaRow
            lang={lang}
            publishHref={publishHref}
            browseHref={browseHref}
            publishLabel={publishLabel}
            browseLabel={browseLabel}
          />
        </div>
        {categorySupportsVisibilityCta(category) && !suppressVisibilityCta ? (
          <div className="mt-3">
            <CategoryVisibilityCta lang={lang} category={category} surface="landing" compact />
          </div>
        ) : null}
      </CategoryCompactHero>
      {belowHero}
      {children}
    </div>
  );
}
