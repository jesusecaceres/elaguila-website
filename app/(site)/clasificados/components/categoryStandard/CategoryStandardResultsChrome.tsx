import Link from "next/link";
import type { ReactNode } from "react";
import type { Lang } from "@/app/clasificados/config/clasificadosHub";
import { CategoryCompactHero } from "./CategoryCompactHero";
import { CategoryStandardSearchRow } from "./CategoryStandardSearchRow";
import { CategoryStandardCtaRow } from "./CategoryStandardCtaRow";
import {
  categoryStandardTitle,
  type CategoryStandardKey,
  categoryStandardUi,
  CATEGORY_STANDARD_PAGE_BG,
  CATEGORY_STANDARD_MAIN,
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
    <div className={CATEGORY_STANDARD_PAGE_BG}>
      <div className={CATEGORY_STANDARD_MAIN}>
        <div className="mb-4">
          <Link
            href={backHref}
            className="text-sm font-semibold text-[#556B3E] transition hover:text-[#7A1E2C]"
          >
            ← {backLabel}
          </Link>
        </div>

        <CategoryCompactHero
          category={category}
          lang={lang}
          title={title}
          eyebrow={lang === "es" ? `${title} · ${ui.results}` : `${title} · ${ui.results}`}
        />

        <div className="mt-4 space-y-4">
          <CategoryStandardSearchRow
            lang={lang}
            action={resultsAction}
            defaultQ={defaultQ}
            defaultCity={defaultCity}
            searchPlaceholder={searchPlaceholder}
            advancedFilters={advancedFilters}
            chips={chips}
          />

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              {typeof resultCount === "number" ? (
                <p className="text-sm font-semibold text-[#2A4536]">{ui.count(resultCount)}</p>
              ) : null}
              {activeFilterSummary ? (
                <div className="mt-1 text-xs text-[#3D3428]/80">{activeFilterSummary}</div>
              ) : null}
            </div>
            <div className="flex flex-wrap gap-2">
              {clearFiltersHref ? (
                <Link
                  href={clearFiltersHref}
                  className="inline-flex min-h-[2.25rem] items-center rounded-lg border border-[#D6C7AD] bg-[#FFFDF7] px-3 text-xs font-bold text-[#3D3428] hover:bg-[#FBF7EF]"
                >
                  {ui.clearFilters}
                </Link>
              ) : null}
              <Link
                href={publishHref}
                className="inline-flex min-h-[2.25rem] items-center rounded-lg bg-[#7A1E2C] px-4 text-xs font-bold text-[#FFFDF7] hover:bg-[#5e1721]"
              >
                {publishLabel}
              </Link>
            </div>
          </div>

          {children}
        </div>
      </div>
    </div>
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
        <CategoryStandardSearchRow
          lang={lang}
          action={searchAction}
          searchPlaceholder={searchPlaceholder}
          chips={searchChips}
          className="!border-0 !bg-transparent !p-0 !shadow-none"
        />
        <div className="mt-3">
          <CategoryStandardCtaRow
            lang={lang}
            publishHref={publishHref}
            browseHref={browseHref}
            publishLabel={publishLabel}
            browseLabel={browseLabel}
          />
        </div>
      </CategoryCompactHero>
      {belowHero}
      {children}
    </div>
  );
}
