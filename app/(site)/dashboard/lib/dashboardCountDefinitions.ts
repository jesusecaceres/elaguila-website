/**
 * Leonix dashboard count language contract (USER-DASHBOARD-CATEGORY-FOCUS-02).
 *
 * 1. Activos — live/visible/current active ads only (`countOwnerActiveListingsAcrossSources`).
 * 2. Total gestionados — all seller-owned manageable records across connected sources
 *    (`countOwnerInventoryListings`), including active, paused, archived, staged when manageable.
 * 3. Borradores — unpublished drafts only (`dashboardNavCounts.drafts`).
 * 4. Por expirar — active ads with visibility/expiration ending within 7 days (`navCounts.expiringSoon`).
 * 5. Vistas — real `listing_view` events from `listing_analytics` only.
 * 6. Compartidos — real `listing_share` events from `listing_analytics` only.
 *
 * Hard rule: never label inventory totals as "Anuncios" alone — use Activos or Total gestionados.
 */

import type { Lang } from "@/app/clasificados/config/clasificadosHub";

export function dashboardCountLabelActivos(lang: Lang): string {
  return lang === "es" ? "Activos" : "Active";
}

export function dashboardCountLabelAnunciosActivos(lang: Lang): string {
  return lang === "es" ? "Anuncios activos" : "Active listings";
}

export function dashboardCountLabelTotalGestionados(lang: Lang): string {
  return lang === "es" ? "Total gestionados" : "Total managed";
}

export function dashboardCountLabelBorradores(lang: Lang): string {
  return lang === "es" ? "Borradores" : "Drafts";
}

export function dashboardCountLabelPorExpirar(lang: Lang): string {
  return lang === "es" ? "Por expirar (7 días)" : "Expiring soon (7 days)";
}

export function dashboardCountLabelVistas(lang: Lang): string {
  return lang === "es" ? "Vistas" : "Views";
}

export function dashboardCountLabelVistasTotales(lang: Lang): string {
  return lang === "es" ? "Vistas totales" : "Total views";
}

export function dashboardCountLabelCompartidos(lang: Lang): string {
  return lang === "es" ? "Compartidos" : "Shares";
}

export function dashboardActiveVsTotalFootnote(lang: Lang, totalManaged: number | null, active: number | null): string {
  if (totalManaged == null || active == null || totalManaged <= active) {
    return lang === "es"
      ? "Activos = anuncios visibles o publicados hoy. No incluye borradores ni registros archivados."
      : "Active = listings visible or published today. Excludes drafts and archived records.";
  }
  return lang === "es"
    ? `Activos (${active}) = visibles hoy. Total gestionados (${totalManaged}) incluye pausados, archivados y otras fuentes conectadas a tu cuenta.`
    : `Active (${active}) = visible today. Total managed (${totalManaged}) includes paused, archived, and other sources tied to your account.`;
}

export function dashboardCategoryCountLabel(count: number, lang: Lang): string {
  if (lang === "es") {
    return count === 1 ? "1 publicación" : `${count} publicaciones`;
  }
  return count === 1 ? "1 listing" : `${count} listings`;
}
