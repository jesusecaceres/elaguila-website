/**
 * Generic `listings` PUBLIC DETAIL row rule — PURE (no I/O). Gate 9 (2026-09 parity).
 *
 * `/clasificados/anuncio/[id]` renders every `public.listings` category. Its row-level gate used to be a single
 * generic `is_published !== false` + `status IN (active, sold)` check, looser than the per-category results
 * readers: a null-`expires_at` / sold / rentado Rentas row, or a null-`is_published` Bienes Raices / Clases /
 * Comunidad / Busco / Mascotas row, opened by direct URL although the results page (and Admin Live) hide it.
 *
 * This module is the row-level half of the detail gate (the FSBO term, Clases/Rentas enforced term and the BR
 * inventory-child parent gate stay in the page because they need the shared predicates / a parent lookup):
 *
 *   rentas                       status = active (sold is NOT a Rentas state), published !== false, lifecycle live
 *                                (future expires_at required) and not rentado / bajo_contrato  == Rentas results
 *   bienes-raices                published = true, status IN (active, sold), generic expires_at not past
 *   clases / comunidad /
 *   mascotas-y-perdidos / busco  published = true, status IN (active, sold)             == their browse readers
 *   en-venta / other             published !== false, status IN (active, sold)  (sold = documented direct-URL state)
 *
 * `sold` stays a viewable direct-URL state for En Venta and Bienes Raices (owner decision recorded in the 2026-09
 * closeout and the `listings` RLS design), never a results/Admin Live state for those two lanes.
 */
import { isRentasRowPubliclyVisible } from "@/app/(site)/clasificados/rentas/lib/rentasPublicRowVisibility";

const PUBLISHED_TRUE_CATEGORIES: ReadonlySet<string> = new Set([
  "bienes-raices",
  "clases",
  "comunidad",
  "mascotas-y-perdidos",
  "busco",
]);

export function isListingRowPublicDetailEligible(row: Record<string, unknown>, nowMs: number = Date.now()): boolean {
  const status = String(row.status ?? "");
  if (status === "removed") return false;
  if (status !== "active" && status !== "sold") return false;
  const category = String(row.category ?? "")
    .trim()
    .toLowerCase();

  if (category === "rentas") return isRentasRowPubliclyVisible(row, nowMs);

  if (PUBLISHED_TRUE_CATEGORIES.has(category)) {
    if (row.is_published !== true) return false;
  } else if (row.is_published === false) {
    return false;
  }

  if (category === "bienes-raices" && typeof row.expires_at === "string" && row.expires_at.trim()) {
    const ms = new Date(row.expires_at).getTime();
    if (Number.isFinite(ms) && ms <= nowMs) return false;
  }
  return true;
}
