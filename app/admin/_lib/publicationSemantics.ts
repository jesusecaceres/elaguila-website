/**
 * PUBLICATION SEMANTIC CONTRACT (Gate 8) — pure adapter, NEVER a database rewrite.
 *
 * Leonix categories legitimately use different canonical vocabularies (`published`, `active`,
 * `is_published`, `approved`, `lifecycle_status`, …). This module does not unify or overwrite any of
 * them. It only READS a category-owned row and answers, consistently for Admin / Payment Tracker /
 * System Health:
 *
 *   "Is this ad live?"   →  semantic === "PUBLIC"
 *   "If not, why?"       →  semantic + a truthful, human reason
 *
 * Doctrine kept intact: PAYMENT truth ≠ LISTING LIFECYCLE truth ≠ MODERATION truth. A semantic of
 * NOT_PUBLIC_PAYMENT means "the listing is waiting for a payment that has not activated it" — it is
 * NOT a claim about the payment record itself (that stays in leonix_payment_records).
 */

export type PublicationSemantic =
  | "PUBLIC"
  | "NOT_PUBLIC_PAYMENT"
  | "NOT_PUBLIC_DRAFT"
  | "NOT_PUBLIC_MODERATION"
  | "PAUSED"
  | "EXPIRED"
  | "REMOVED"
  | "REJECTED"
  | "UNKNOWN";

export type PublicationSource =
  | "servicios_public_listings"
  | "restaurantes_public_listings"
  | "comida_local_public_listings"
  | "empleos_public_listings"
  | "autos_classifieds_listings"
  | "listings"
  | "ofertas_locales"
  | "viajes_staged_listings";

export type PublicationTruth = {
  semantic: PublicationSemantic;
  /** Operator-facing reason, never a guess: says "not stored" when the row carries no reason. */
  reason: string;
  /** The category's own raw status value, shown verbatim so nothing is hidden behind the adapter. */
  rawStatus: string | null;
  source: PublicationSource;
};

/** Payment-record `category` slug → the canonical table that owns that category's lifecycle. */
export function publicationSourceForCategory(category: string | null | undefined): PublicationSource | null {
  const c = String(category ?? "").trim().toLowerCase().replace(/_/g, "-");
  switch (c) {
    case "servicios":
      return "servicios_public_listings";
    case "restaurantes":
      return "restaurantes_public_listings";
    case "comida-local":
      return "comida_local_public_listings";
    case "empleos":
      return "empleos_public_listings";
    case "autos":
      return "autos_classifieds_listings";
    case "rentas":
    case "clases":
    case "bienes-raices":
    case "en-venta":
      return "listings";
    case "ofertas-locales":
    case "ofertas":
      return "ofertas_locales";
    case "viajes":
    case "travel":
      return "viajes_staged_listings";
    default:
      return null; // unknown category: no safe lookup — never guess a table
  }
}

/** Minimal column list per table (verified against the production schema, 2026-09-18). */
export const PUBLICATION_SOURCE_SELECT: Record<PublicationSource, string> = {
  servicios_public_listings: "id, leonix_ad_id, listing_status, published_at, suspended_reason",
  restaurantes_public_listings: "id, leonix_ad_id, status, published_at, suspended_reason",
  comida_local_public_listings: "id, leonix_ad_id, status, payment_status, published_at",
  empleos_public_listings: "id, leonix_ad_id, lifecycle_status, moderation_reason, published_at",
  autos_classifieds_listings: "id, leonix_ad_id, lane, status, published_at, expires_at, suspended_reason",
  listings: "id, leonix_ad_id, status, is_published, published_at, expires_at, suspended_reason",
  ofertas_locales: "id, leonix_ad_id, status, payment_status, entitlement_status, published_at, expires_at",
  viajes_staged_listings: "id, leonix_ad_id, lifecycle_status, is_public, moderation_reason, published_at, expires_at",
};

function s(v: unknown): string {
  return typeof v === "string" ? v.trim().toLowerCase() : "";
}
function raw(v: unknown): string | null {
  return typeof v === "string" && v.trim() ? v.trim() : null;
}
function isPast(v: unknown, now: Date): boolean {
  if (typeof v !== "string" || !v.trim()) return false;
  const t = new Date(v).getTime();
  return Number.isFinite(t) && t < now.getTime();
}

function truth(source: PublicationSource, semantic: PublicationSemantic, reason: string, rawStatus: string | null): PublicationTruth {
  return { semantic, reason, rawStatus, source };
}

/** Shared lane vocabulary used by servicios / restaurantes / comida-local (`status` strings). */
function classifyLaneStatus(
  source: PublicationSource,
  status: string,
  rawStatus: string | null,
  suspendedReason: string | null,
): PublicationTruth {
  switch (status) {
    case "published":
      return truth(source, "PUBLIC", "Live: published.", rawStatus);
    case "pending_payment":
      return truth(source, "NOT_PUBLIC_PAYMENT", "Saved, waiting for payment to activate it (the paid webhook flips this to published).", rawStatus);
    case "draft":
      return truth(source, "NOT_PUBLIC_DRAFT", "Draft — never submitted for publication.", rawStatus);
    case "pending_review":
      return truth(source, "NOT_PUBLIC_MODERATION", "Awaiting Leonix review before it can go live.", rawStatus);
    case "suspended":
      return suspendedReason === "payment"
        ? truth(source, "PAUSED", "Suspended because of a payment problem (grace expired or chargeback).", rawStatus)
        : truth(source, "NOT_PUBLIC_MODERATION", suspendedReason ? `Suspended by staff (${suspendedReason}).` : "Suspended by staff — no reason is stored on the listing.", rawStatus);
    case "paused_unpublished":
    case "paused":
      return truth(source, "PAUSED", "Paused / unpublished by the owner or staff.", rawStatus);
    case "rejected":
      return truth(source, "REJECTED", "Rejected in review.", rawStatus);
    case "archived":
    case "removed":
    case "cancelled":
    case "canceled":
      return truth(source, "REMOVED", "Archived / removed.", rawStatus);
    default:
      return truth(source, "UNKNOWN", `Unrecognized status "${rawStatus ?? "—"}" for this category.`, rawStatus);
  }
}

export function classifyPublication(
  source: PublicationSource,
  row: Record<string, unknown> | null | undefined,
  ctx: { now?: Date; paymentCleared?: boolean } = {},
): PublicationTruth {
  const now = ctx.now ?? new Date();
  if (!row) return truth(source, "UNKNOWN", "Listing row not found in its canonical table.", null);

  switch (source) {
    case "servicios_public_listings":
      return classifyLaneStatus(source, s(row.listing_status), raw(row.listing_status), raw(row.suspended_reason));
    case "restaurantes_public_listings":
      return classifyLaneStatus(source, s(row.status), raw(row.status), raw(row.suspended_reason));
    case "comida_local_public_listings": {
      const t = classifyLaneStatus(source, s(row.status), raw(row.status), null);
      return t.semantic === "PUBLIC" && s(row.payment_status) && s(row.payment_status) !== "paid"
        ? truth(source, "NOT_PUBLIC_PAYMENT", "Marked published but payment_status is not paid.", raw(row.status))
        : t;
    }
    case "empleos_public_listings": {
      const st = s(row.lifecycle_status);
      const rawStatus = raw(row.lifecycle_status);
      if (st === "published") return truth(source, "PUBLIC", "Live: published.", rawStatus);
      if (st === "draft") return truth(source, "NOT_PUBLIC_PAYMENT", "Draft — a paid job post stays draft until its payment activates it.", rawStatus);
      if (st === "pending_review") return truth(source, "NOT_PUBLIC_MODERATION", raw(row.moderation_reason) ?? "Awaiting Leonix review (paid, but review is required before it goes live).", rawStatus);
      if (st === "paused") return truth(source, "PAUSED", raw(row.moderation_reason) ?? "Paused.", rawStatus);
      if (st === "rejected") return truth(source, "REJECTED", raw(row.moderation_reason) ?? "Rejected — no reason stored.", rawStatus);
      if (st === "archived") return truth(source, "REMOVED", "Archived.", rawStatus);
      return truth(source, "UNKNOWN", `Unrecognized lifecycle_status "${rawStatus ?? "—"}".`, rawStatus);
    }
    case "autos_classifieds_listings": {
      const st = s(row.status);
      const rawStatus = raw(row.status);
      if (st === "active") {
        return s(row.lane) === "privado" && isPast(row.expires_at, now)
          ? truth(source, "EXPIRED", "Private-seller listing past its 30-day term.", rawStatus)
          : truth(source, "PUBLIC", "Live: active.", rawStatus);
      }
      if (st === "pending_payment") return truth(source, "NOT_PUBLIC_PAYMENT", "Waiting for payment to activate it.", rawStatus);
      if (st === "payment_failed") return truth(source, "NOT_PUBLIC_PAYMENT", "Payment failed or was suspended for payment.", rawStatus);
      if (st === "draft") return truth(source, "NOT_PUBLIC_DRAFT", "Draft — never submitted for payment.", rawStatus);
      if (st === "suspended") return truth(source, "NOT_PUBLIC_MODERATION", raw(row.suspended_reason) ?? "Suspended — no reason stored.", rawStatus);
      if (st === "removed" || st === "cancelled" || st === "canceled") {
        return s(row.suspended_reason) === "moderation"
          ? truth(source, "NOT_PUBLIC_MODERATION", "Removed by staff moderation (owner cannot restore it).", rawStatus)
          : truth(source, "REMOVED", "Removed / cancelled (owner unpublish, archive, or a staff removal recorded before moderation reasons were stored).", rawStatus);
      }
      return truth(source, "UNKNOWN", `Unrecognized status "${rawStatus ?? "—"}".`, rawStatus);
    }
    case "listings": {
      const st = s(row.status);
      const rawStatus = raw(row.status);
      const published = row.is_published !== false; // null/undefined → treat as published-flag-unknown, only false blocks
      if (st === "active") {
        if (isPast(row.expires_at, now)) return truth(source, "EXPIRED", "Past its listing term.", rawStatus);
        if (!published) return truth(source, "PAUSED", "Active but hidden (is_published = false).", rawStatus);
        return truth(source, "PUBLIC", "Live: active and published.", rawStatus);
      }
      if (st === "pending") {
        return ctx.paymentCleared === false
          ? truth(source, "NOT_PUBLIC_PAYMENT", "Pending — waiting for payment to activate it.", rawStatus)
          : truth(source, "NOT_PUBLIC_DRAFT", "Pending — not yet activated (payment or review outstanding).", rawStatus);
      }
      if (st === "flagged") return truth(source, "NOT_PUBLIC_MODERATION", raw(row.suspended_reason) ?? "Flagged by staff — no reason is stored on the listing.", rawStatus);
      if (st === "removed") return truth(source, "REMOVED", "Removed.", rawStatus);
      if (st === "unpublished" || st === "sold") return truth(source, "PAUSED", st === "sold" ? "Marked sold." : "Unpublished.", rawStatus);
      return truth(source, "UNKNOWN", `Unrecognized status "${rawStatus ?? "—"}".`, rawStatus);
    }
    case "ofertas_locales": {
      const st = s(row.status);
      const rawStatus = raw(row.status);
      if (st === "approved") {
        if (isPast(row.expires_at, now)) return truth(source, "EXPIRED", "Approved offer past its end date.", rawStatus);
        return raw(row.published_at)
          ? truth(source, "PUBLIC", "Live: approved and published.", rawStatus)
          : truth(source, "NOT_PUBLIC_MODERATION", "Approved but not published (no published_at).", rawStatus);
      }
      if (st === "draft") return truth(source, "NOT_PUBLIC_DRAFT", "Draft.", rawStatus);
      if (st === "submitted" || st === "pending_review") return truth(source, "NOT_PUBLIC_MODERATION", "Awaiting Leonix review.", rawStatus);
      if (st === "rejected") return truth(source, "REJECTED", "Rejected in review.", rawStatus);
      if (st === "archived") return truth(source, "REMOVED", "Archived.", rawStatus);
      if (st === "expired") return truth(source, "EXPIRED", "Offer past its end date.", rawStatus);
      return truth(source, "UNKNOWN", `Unrecognized status "${rawStatus ?? "—"}".`, rawStatus);
    }
    case "viajes_staged_listings": {
      const st = s(row.lifecycle_status);
      const rawStatus = raw(row.lifecycle_status);
      if (st === "approved") {
        if (row.is_public !== true) return truth(source, "PAUSED", "Approved but not public (is_public = false).", rawStatus);
        return isPast(row.expires_at, now)
          ? truth(source, "EXPIRED", "Past its end date.", rawStatus)
          : truth(source, "PUBLIC", "Live: approved and public.", rawStatus);
      }
      if (st === "submitted" || st === "in_review" || st === "changes_requested") return truth(source, "NOT_PUBLIC_MODERATION", raw(row.moderation_reason) ?? "In staff review.", rawStatus);
      if (st === "rejected") return truth(source, "REJECTED", raw(row.moderation_reason) ?? "Rejected — no reason stored.", rawStatus);
      if (st === "unpublished") return truth(source, "PAUSED", "Unpublished.", rawStatus);
      if (st === "expired") return truth(source, "EXPIRED", "Expired.", rawStatus);
      return truth(source, "UNKNOWN", `Unrecognized lifecycle_status "${rawStatus ?? "—"}".`, rawStatus);
    }
  }
}
