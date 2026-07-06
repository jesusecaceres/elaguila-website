import Link from "next/link";
import type { ReactNode } from "react";
import type { Lang } from "@/app/clasificados/config/clasificadosHub";
import { CategoryCompactHero } from "./CategoryCompactHero";
import { CategoryStandardCtaRow } from "./CategoryStandardCtaRow";
import { CategoryStandardLandingSearch } from "./CategoryStandardLandingSearch";
import { CategoryStandardSearchRow } from "./CategoryStandardSearchRow";
import { CategoryVisibilityCta, categorySupportsVisibilityCta } from "./CategoryVisibilityCta";
import { CategoryStandardResultsPageShell } from "./CategoryStandardResultsPageShell";
import { CategoryStandardResultsHeader } from "./CategoryStandardResultsHeader";
import {
  CAT_STD_REFINE_EYEBROW,
  CAT_STD_RESULTS_REFINE_DIVIDER,
  CAT_STD_RESULTS_REFINE_PANEL,
} from "./categoryStandardStyles";
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
  /** Sort/view row — standard position below shell/chips, above listings. */
  toolbar?: ReactNode;
  /** Replaces default CategoryStandardSearchRow (e.g. compact landing-style bar). */
  searchSlot?: ReactNode;
  children: ReactNode;
};

/**
 * Shared results-page chrome — Rentas V7 refine panel: search + filters + tools; listings below.
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
  toolbar,
  searchSlot,
  children,
}: CategoryStandardResultsChromeProps) {
  const ui = categoryStandardUi(lang);
  const title = categoryStandardTitle(category, lang);
  const refineEyebrow = lang === "es" ? "Afina tu búsqueda" : "Refine your search";

  return (
    <CategoryStandardResultsPageShell>
      <div className="space-y-5">
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

        <section className={CAT_STD_RESULTS_REFINE_PANEL} aria-label={refineEyebrow}>
          <p className={CAT_STD_REFINE_EYEBROW}>{refineEyebrow}</p>

          <div className="mt-2">
            {searchSlot ?? (
              <CategoryStandardSearchRow
                lang={lang}
                action={resultsAction}
                defaultQ={defaultQ}
                defaultCity={defaultCity}
                searchPlaceholder={searchPlaceholder}
                advancedFilters={advancedFilters}
                chips={chips}
              />
            )}
          </div>

          {!searchSlot && chips ? <div className="mt-3">{chips}</div> : null}

          {activeFilterSummary ? <div className="mt-3">{activeFilterSummary}</div> : null}

          {toolbar ? (
            <>
              <div className={`${CAT_STD_RESULTS_REFINE_DIVIDER} my-4`} aria-hidden />
              {toolbar}
            </>
          ) : null}
        </section>

        {children}

        {categorySupportsVisibilityCta(category) ? (
          <footer className="mt-8 border-t border-[#D6C7AD]/50 pt-6">
            <CategoryVisibilityCta lang={lang} category={category} surface="results" compact />
          </footer>
        ) : null}
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
  /** Hide browse CTA in hero row when browse lives in search canvas. */
  hideBrowseCta?: boolean;
  /** Hide default publish/browse row when category supplies custom CTAs (e.g. dual publish). */
  hideCtaRow?: boolean;
  /** Optional custom CTA row (replaces default when hideCtaRow). */
  ctaSlot?: ReactNode;
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
  hideBrowseCta = false,
  hideCtaRow = false,
  ctaSlot,
  children,
}: CategoryStandardLandingBlockProps) {
  const landingEyebrow = lang === "es" ? "¿Qué estás buscando?" : "What are you looking for?";

  return (
    <div className="space-y-3 sm:space-y-4">
      <CategoryCompactHero
        category={category}
        lang={lang}
        eyebrow={eyebrow}
        title={title}
        description={description}
        imageSrc={imageSrc}
      >
        <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.14em] text-[#556B3E]">{landingEyebrow}</p>
        {searchSlot ??
          (category === "comunidad" ||
          category === "clases" ||
          category === "busco" ||
          category === "mascotas-y-perdidos" ? (
            <CategoryStandardLandingSearch
              category={category}
              lang={lang}
              searchAction={searchAction}
              browseHref={browseHref}
              browseLabel={browseLabel}
              searchChips={searchChips}
            />
          ) : (
            <CategoryStandardSearchRow
              lang={lang}
              action={searchAction}
              searchPlaceholder={searchPlaceholder}
              chips={searchChips}
              className="!border-0 !bg-transparent !p-0 !shadow-none"
            />
          ))}
        <div className="mt-2.5">
          {ctaSlot ??
            (hideCtaRow ? null : (
              <CategoryStandardCtaRow
                lang={lang}
                publishHref={publishHref}
                browseHref={browseHref}
                publishLabel={publishLabel}
                browseLabel={browseLabel}
                hideBrowse={hideBrowseCta}
              />
            ))}
        </div>
        {categorySupportsVisibilityCta(category) && !suppressVisibilityCta ? (
          <div className="mt-2">
            <CategoryVisibilityCta lang={lang} category={category} surface="landing" compact />
          </div>
        ) : null}
      </CategoryCompactHero>
      {belowHero}
      {children ? <div className="mt-4 space-y-4 sm:space-y-5">{children}</div> : null}
    </div>
  );
}
