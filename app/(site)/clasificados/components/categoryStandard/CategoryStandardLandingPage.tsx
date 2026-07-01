"use client";

import type { ReactNode } from "react";
import { appendLangToPath } from "@/app/clasificados/lib/hubUrl";
import type { Lang } from "@/app/clasificados/config/clasificadosHub";
import { CategoryStandardLandingBlock } from "./CategoryStandardResultsChrome";
import { CategoryStandardLandingPageShell } from "./CategoryStandardLandingPageShell";
import { CategoryStandardQuickFilterChips } from "./CategoryStandardQuickFilterChips";
import {
  buildCategoryResultsUrl,
  categoryPublishPath,
  type CatStdAllSlug,
} from "./categoryStandardRoutes";
import {
  categoryStandardSearchPlaceholder,
  categoryStandardTitle,
  categoryStandardDescription,
  categoryStandardUi,
} from "./categoryStandardTheme";

export type CategoryStandardLandingPageProps = {
  category: CatStdAllSlug;
  lang: Lang;
  eyebrow?: string;
  publishHref?: string;
  browseHref?: string;
  searchAction?: string;
  publishLabel?: string;
  browseLabel?: string;
  searchChips?: ReactNode;
  belowHero?: ReactNode;
  searchSlot?: ReactNode;
  children?: ReactNode;
  suppressVisibilityCta?: boolean;
};

/**
 * CAT-STD-ALL — full standard landing: compact hero, search, CTAs, quick chips.
 */
export function CategoryStandardLandingPage({
  category,
  lang,
  eyebrow,
  publishHref: publishHrefProp,
  browseHref: browseHrefProp,
  searchAction: searchActionProp,
  publishLabel,
  browseLabel,
  searchChips,
  belowHero,
  searchSlot,
  suppressVisibilityCta,
  children,
}: CategoryStandardLandingPageProps) {
  const searchAction = searchActionProp ?? buildCategoryResultsUrl(category, lang);
  const browseHref = browseHrefProp ?? buildCategoryResultsUrl(category, lang);
  const publishHref = publishHrefProp ?? appendLangToPath(categoryPublishPath(category), lang);
  const ui = categoryStandardUi(lang);
  const resolvedPublishLabel =
    publishLabel ?? ui.postIn(categoryStandardTitle(category, lang));
  const resolvedBrowseLabel = browseLabel ?? ui.viewAll;

  return (
    <CategoryStandardLandingPageShell>
      <CategoryStandardLandingBlock
        category={category}
        lang={lang}
        eyebrow={eyebrow}
        title={categoryStandardTitle(category, lang)}
        description={categoryStandardDescription(category, lang)}
        searchAction={searchAction}
        searchPlaceholder={categoryStandardSearchPlaceholder(category, lang)}
        publishHref={publishHref}
        browseHref={browseHref}
        publishLabel={resolvedPublishLabel}
        browseLabel={resolvedBrowseLabel}
        searchChips={searchChips ?? <CategoryStandardQuickFilterChips category={category} lang={lang} />}
        searchSlot={searchSlot}
        belowHero={belowHero}
        suppressVisibilityCta={suppressVisibilityCta}
      >
        {children}
      </CategoryStandardLandingBlock>
    </CategoryStandardLandingPageShell>
  );
}
