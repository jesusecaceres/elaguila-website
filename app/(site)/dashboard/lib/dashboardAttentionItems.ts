/**
 * Work Package I.8A — one shared, additive, pure attention-item resolver for the owner-facing
 * Mis Anuncios dashboard. Pure derivation only: no I/O, no mutation, no background jobs, no
 * notifications. Every item is derived strictly from data the caller already has (a resolved
 * display status, known route hrefs, and — only where the category already has real lifecycle
 * data, e.g. Rentas — a real renewal-eligibility flag). Nothing here invents a payment/renewal
 * state from client JSON; callers must only pass `renewal`/`addon` facts backed by real
 * server-verified reads they already perform elsewhere (see `dashboardOwnerStatusDisplay.ts`'s
 * and `dashboardPackageEntitlementBadges.ts`'s doc comments for what "real" means here).
 */
import type { ListingLifecycleStatus } from "@/app/lib/clasificados/listingLifecycleDomain";

export type OwnerAttentionSeverity = "info" | "warn" | "urgent";

export type OwnerAttentionReasonKey =
  | "payment_required"
  | "not_public"
  | "suspended"
  | "expired"
  | "missing_edit_route"
  | "missing_public_route"
  | "child_needs_parent"
  | "addon_inactive"
  | "renewal_available"
  | "status_unknown"
  | "unsupported_pipeline";

export type OwnerAttentionItem = {
  id: string;
  category: string;
  severity: OwnerAttentionSeverity;
  reasonKey: OwnerAttentionReasonKey;
  labelEs: string;
  labelEn: string;
  /** Only set when a real, working route/action exists — never fabricated. */
  href?: string | null;
};

export type OwnerAttentionRowInput = {
  id: string;
  category: string;
  /** Canonical status key already resolved by the caller (via `resolveOwnerDashboardStatusDisplay`
   * for Empleos/Viajes, or the existing `resolveListingUiStatus`/`listingUiStatusLabel` pipeline
   * for shared-`listings` categories, mapped down to the same `ListingLifecycleStatus | "unknown"`
   * shape). This function trusts nothing about the raw DB status itself — only this resolved key. */
  statusDisplayKey: ListingLifecycleStatus | "unknown";
  isPublished?: boolean | null;
  /** `undefined` = caller did not evaluate this route (no claim either way, no attention item).
   * `null` = caller confirmed no safe route exists. A real href string = confirmed present. */
  editHref?: string | null;
  /** Same `undefined` vs `null` vs real-href distinction as `editHref`. */
  publicHref?: string | null;
  isInventoryChild?: boolean;
  /** For a child row: whether it is genuinely linked to a real, resolvable parent listing. */
  hasParentLink?: boolean;
  /** Only pass this when the caller has real, already-computed lifecycle/renewal truth (e.g.
   * Rentas' `resolveListingLifecycle().isRenewalEligible` + the real onRenew handler's href/action
   * marker). Omit entirely for any category without a real renewal path — never default to true. */
  renewal?: { isRenewalEligible: boolean; hasRealAction: boolean } | null;
  /** Only pass this when the caller has a real, server-verified addon/entitlement read (e.g.
   * `restaurantCouponAddonStatus`/`serviciosOffersAddonActive`). */
  addon?: { active: boolean; labelEs: string; labelEn: string } | null;
  /** True when `classifyOwnerDashboardRow()` (or equivalent evidence) confirmed this row's
   * category/pipeline is genuinely unmodeled — used so a row that has no tab/card family of its
   * own still surfaces here instead of silently disappearing. */
  isUnsupportedPipeline?: boolean;
};

function item(
  id: string,
  category: string,
  severity: OwnerAttentionSeverity,
  reasonKey: OwnerAttentionReasonKey,
  labelEs: string,
  labelEn: string,
  href?: string | null,
): OwnerAttentionItem {
  return { id, category, severity, reasonKey, labelEs, labelEn, href: href ?? null };
}

/**
 * Derive the (possibly empty) list of attention items for one dashboard row. Order is
 * deterministic (severity roughly descending) but callers should not depend on exact ordering
 * beyond "urgent items exist somewhere in the array".
 */
export function resolveOwnerDashboardAttentionItems(row: OwnerAttentionRowInput): OwnerAttentionItem[] {
  const out: OwnerAttentionItem[] = [];
  const { id, category } = row;

  if (row.statusDisplayKey === "suspended") {
    out.push(item(id, category, "urgent", "suspended", "Anuncio suspendido — revisa el motivo.", "Listing suspended — review the reason.", row.editHref));
  }

  // Payment required — strictly gated on the caller's already-resolved canonical status, never
  // inferred from client JSON or guessed from an unrelated field.
  if (row.statusDisplayKey === "pending_payment") {
    out.push(item(id, category, "urgent", "payment_required", "Pago pendiente para publicar este anuncio.", "Payment pending to publish this listing.", row.editHref));
  }

  if (row.isUnsupportedPipeline) {
    out.push(
      item(
        id,
        category,
        "warn",
        "unsupported_pipeline",
        "Este anuncio es de una categoría que el panel aún no organiza — revísalo manualmente.",
        "This listing is from a category the dashboard doesn't organize yet — review it manually.",
        row.publicHref ?? null,
      ),
    );
  }

  if (row.statusDisplayKey === "unknown") {
    out.push(item(id, category, "warn", "status_unknown", "Estado desconocido — revisa este anuncio.", "Unknown status — review this listing.", row.editHref));
  }

  if (row.statusDisplayKey === "expired") {
    const hasRealRenewal = Boolean(row.renewal?.isRenewalEligible && row.renewal?.hasRealAction);
    out.push(
      item(
        id,
        category,
        "warn",
        "expired",
        hasRealRenewal ? "Anuncio expirado — puedes renovarlo." : "Anuncio expirado.",
        hasRealRenewal ? "Listing expired — you can renew it." : "Listing expired.",
        null,
      ),
    );
  }

  // "Not public" — only meaningful when the listing's own status implies it should be visible
  // (published/active) but is_published disagrees; draft/paused/etc. being non-public is expected,
  // not an attention item.
  const shouldBePublic = row.statusDisplayKey === "published" || row.statusDisplayKey === "active";
  if (shouldBePublic && row.isPublished === false) {
    out.push(item(id, category, "warn", "not_public", "Este anuncio no está visible públicamente.", "This listing is not publicly visible.", row.editHref));
  }

  if (row.editHref === null) {
    out.push(item(id, category, "info", "missing_edit_route", "No hay una forma segura de editar este anuncio todavía.", "There is no safe way to edit this listing yet.", null));
  }

  if (row.publicHref === null) {
    out.push(item(id, category, "info", "missing_public_route", "Este anuncio no tiene una página pública confirmada todavía.", "This listing does not have a confirmed public page yet.", null));
  }

  if (row.isInventoryChild && row.hasParentLink === false) {
    out.push(item(id, category, "info", "child_needs_parent", "Este vehículo/propiedad de inventario necesita gestionarse desde su anuncio principal.", "This inventory vehicle/property needs to be managed from its main listing.", null));
  }

  if (row.addon && row.addon.active === false) {
    out.push(item(id, category, "info", "addon_inactive", `${row.addon.labelEs} inactivo o expirado.`, `${row.addon.labelEn} inactive or expired.`, null));
  }

  // Renewal available is its own, separate, actionable item (distinct from the "expired" note
  // above, which fires even when no real renewal path exists) — only ever added when the caller
  // supplied a real, already-verified renewal path.
  if (row.renewal?.isRenewalEligible && row.renewal.hasRealAction) {
    out.push(item(id, category, "warn", "renewal_available", "Este anuncio puede renovarse.", "This listing is eligible for renewal.", null));
  }

  return out;
}

export function countByAttentionSeverity(items: OwnerAttentionItem[]): Record<OwnerAttentionSeverity, number> {
  const out: Record<OwnerAttentionSeverity, number> = { info: 0, warn: 0, urgent: 0 };
  for (const it of items) out[it.severity] += 1;
  return out;
}
