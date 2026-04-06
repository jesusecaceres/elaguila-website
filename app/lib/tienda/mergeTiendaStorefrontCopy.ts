import type { TiendaStorefrontPayload } from "@/app/lib/siteSectionContent/payloadTypes";
import { tiendaCopy } from "@/app/tienda/data/tiendaCopy";
import type { Lang, TiendaBilingual, TiendaCategory } from "@/app/tienda/types/tienda";

function mergeBi(
  base: { es: string; en: string },
  patch: Partial<{ es: string; en: string }> | undefined
): { es: string; en: string } {
  if (!patch) return base;
  return {
    es: patch.es !== undefined && patch.es !== "" ? patch.es : base.es,
    en: patch.en !== undefined && patch.en !== "" ? patch.en : base.en,
  };
}

/**
 * Merges admin `tienda_storefront` payload over code defaults (`tiendaCopy`).
 * Empty / missing admin fields keep code defaults.
 */
export function mergeTiendaStorefrontCopy(patch: TiendaStorefrontPayload | null | undefined) {
  if (!patch) return tiendaCopy;

  const trustItemsEs = patch.trust?.items?.es?.filter(Boolean);
  const trustItemsEn = patch.trust?.items?.en?.filter(Boolean);

  return {
    ...tiendaCopy,
    hero: {
      eyebrow: mergeBi(tiendaCopy.hero.eyebrow, patch.hero?.eyebrow),
      headline: mergeBi(tiendaCopy.hero.headline, patch.hero?.headline),
      subhead: mergeBi(tiendaCopy.hero.subhead, patch.hero?.subhead),
      ctaPrimary: mergeBi(tiendaCopy.hero.ctaPrimary, patch.hero?.ctaPrimary),
      ctaSecondary: mergeBi(tiendaCopy.hero.ctaSecondary, patch.hero?.ctaSecondary),
      supportingLine: mergeBi(tiendaCopy.hero.supportingLine, patch.hero?.supportingLine),
    },
    sections: {
      ...tiendaCopy.sections,
      categories: {
        eyebrow: mergeBi(tiendaCopy.sections.categories.eyebrow, patch.categoriesSection?.eyebrow),
        title: mergeBi(tiendaCopy.sections.categories.title, patch.categoriesSection?.title),
        description: mergeBi(tiendaCopy.sections.categories.description, patch.categoriesSection?.description),
      },
      featured: {
        eyebrow: mergeBi(tiendaCopy.sections.featured.eyebrow, patch.featuredSection?.eyebrow),
        title: mergeBi(tiendaCopy.sections.featured.title, patch.featuredSection?.title),
        description: mergeBi(tiendaCopy.sections.featured.description, patch.featuredSection?.description),
      },
      howItWorks: {
        ...tiendaCopy.sections.howItWorks,
        eyebrow: mergeBi(tiendaCopy.sections.howItWorks.eyebrow, patch.howItWorks?.eyebrow),
        title: mergeBi(tiendaCopy.sections.howItWorks.title, patch.howItWorks?.title),
        description: mergeBi(tiendaCopy.sections.howItWorks.description, patch.howItWorks?.description),
        note: mergeBi(tiendaCopy.sections.howItWorks.note, patch.howItWorks?.note),
        steps: tiendaCopy.sections.howItWorks.steps,
      },
      trust: {
        eyebrow: mergeBi(tiendaCopy.sections.trust.eyebrow, patch.trust?.eyebrow),
        title: mergeBi(tiendaCopy.sections.trust.title, patch.trust?.title),
        items: {
          es: trustItemsEs?.length ? trustItemsEs : tiendaCopy.sections.trust.items.es,
          en: trustItemsEn?.length ? trustItemsEn : tiendaCopy.sections.trust.items.en,
        },
      },
      finalCta: {
        title: mergeBi(tiendaCopy.sections.finalCta.title, patch.finalCta?.title),
        body: mergeBi(tiendaCopy.sections.finalCta.body, patch.finalCta?.body),
        primary: mergeBi(tiendaCopy.sections.finalCta.primary, patch.finalCta?.primary),
        secondary: mergeBi(tiendaCopy.sections.finalCta.secondary, patch.finalCta?.secondary),
      },
      split: tiendaCopy.sections.split,
      categoryPage: tiendaCopy.sections.categoryPage,
      productPage: tiendaCopy.sections.productPage,
      modeLabels: tiendaCopy.sections.modeLabels,
    },
  };
}

export function pickMerged<T extends { es: string; en: string }>(v: T, lang: Lang): string {
  return lang === "en" ? v.en : v.es;
}

/** Apply optional admin title/description overrides for a category card. */
export function applyCategoryCardCopyOverrides(
  category: TiendaCategory,
  override?: { title?: Partial<{ es: string; en: string }>; description?: Partial<{ es: string; en: string }> }
): TiendaCategory {
  if (!override) return category;
  const title: TiendaBilingual = {
    es: override.title?.es !== undefined && override.title.es !== "" ? override.title.es : category.title.es,
    en: override.title?.en !== undefined && override.title.en !== "" ? override.title.en : category.title.en,
  };
  const description: TiendaBilingual = {
    es:
      override.description?.es !== undefined && override.description.es !== ""
        ? override.description.es
        : category.description.es,
    en:
      override.description?.en !== undefined && override.description.en !== ""
        ? override.description.en
        : category.description.en,
  };
  return { ...category, title, description };
}
