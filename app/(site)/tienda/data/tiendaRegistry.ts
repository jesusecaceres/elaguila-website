import type { TiendaCategory, TiendaProductFamily, TiendaProductFamilySummary } from "../types/tienda";
import { TIENDA_CATEGORY_SLUGS, tiendaCategoryBySlug } from "./tiendaCategories";
import { tiendaProductFamilies, tiendaProductFamilyBySlug } from "./tiendaProductFamilies";

export const TIENDA_PRODUCT_FAMILY_SLUGS = tiendaProductFamilies.map((p) => p.slug);

export function isKnownCategorySlug(slug: string): slug is (typeof TIENDA_CATEGORY_SLUGS)[number] {
  return (TIENDA_CATEGORY_SLUGS as readonly string[]).includes(slug);
}

export function isKnownProductFamilySlug(slug: string): boolean {
  return slug in tiendaProductFamilyBySlug;
}

export function getCategoryBySlug(slug: string): TiendaCategory | undefined {
  return tiendaCategoryBySlug[slug];
}

export function getProductFamilyBySlug(slug: string): TiendaProductFamily | undefined {
  return tiendaProductFamilyBySlug[slug];
}

export function getFamiliesForCategory(categorySlug: string): TiendaProductFamily[] {
  const cat = getCategoryBySlug(categorySlug);
  if (!cat) return [];
  return cat.familySlugs
    .map((s) => getProductFamilyBySlug(s))
    .filter((p): p is TiendaProductFamily => Boolean(p));
}

export function productFamilyToSummary(p: TiendaProductFamily): TiendaProductFamilySummary {
  return {
    id: p.id,
    slug: p.slug,
    title: p.title,
    description: p.description,
    categorySlug: p.categorySlug,
    productMode: p.productMode,
    href: p.href,
    featured: false,
    startingPrice: p.startingPrice,
    badges: p.badges,
    comingSoon: Boolean(p.comingSoon),
    supportsUpload: p.supportsUpload,
    supportsDesigner: p.supportsOnlineDesign,
    supportsTwoSided: p.supportsTwoSided,
  };
}

export { TIENDA_CATEGORY_SLUGS };
