/**
 * Work Package I.8A — one shared, display-only status normalization helper for the owner-facing
 * Mis Anuncios dashboard. Wraps the existing `getStatusLabel`/`ListingLifecycleStatus` table
 * (`app/lib/clasificados/listingLifecycleDomain.ts`) with per-category raw-status mapping,
 * extending it to Empleos (activating the previously-unused `mapEmpleosStatusToCanonical`) and
 * Viajes (a new mapper against the real `ViajesStagedLifecycleStatus` enum). Never writes to the
 * database, never changes write behavior — display only. Always preserves the original raw
 * status string and category alongside the normalized label, and never shows an unrecognized
 * raw status as "active"/"published" — unmapped values fall closed into an attention-flavored
 * "unknown" display state instead of guessing.
 */
import type { Lang } from "@/app/clasificados/config/clasificadosHub";
import {
  getStatusLabel,
  isValidLifecycleStatus,
  mapEmpleosStatusToCanonical,
  type ListingLifecycleStatus,
} from "@/app/lib/clasificados/listingLifecycleDomain";

export type OwnerDashboardStatusTone = "neutral" | "positive" | "warn" | "danger";

export type OwnerDashboardStatusDisplay = {
  /** The canonical status this raw value was mapped to, or "unknown" when unmapped. */
  displayKey: ListingLifecycleStatus | "unknown";
  labelEs: string;
  labelEn: string;
  tone: OwnerDashboardStatusTone;
  /** Original, unmodified raw status string from the DB — never discarded. */
  rawStatus: string;
  /** Category this status was resolved for — kept alongside the label for context/debugging. */
  category: string;
};

const POSITIVE: ReadonlySet<ListingLifecycleStatus> = new Set(["published", "active"]);
const WARN: ReadonlySet<ListingLifecycleStatus> = new Set([
  "draft",
  "preview_ready",
  "publish_ready",
  "pending_payment",
  "pending_review",
  "paused",
  "paused_unpublished",
  "unpublished",
]);
const DANGER: ReadonlySet<ListingLifecycleStatus> = new Set(["suspended", "expired", "removed", "cancelled", "rejected", "payment_failed"]);
// "sold" and "archived" are terminal-but-not-alarming — neutral tone.

function toneForCanonical(status: ListingLifecycleStatus): OwnerDashboardStatusTone {
  if (POSITIVE.has(status)) return "positive";
  if (DANGER.has(status)) return "danger";
  if (WARN.has(status)) return "warn";
  return "neutral";
}

/** Real `ViajesStagedLifecycleStatus` enum (`viajesStagedListingTypes.ts`). Only values with a
 * confident 1:1 canonical match are mapped; "changes_requested" has no equivalent canonical
 * state and is deliberately left unmapped rather than guessed (falls to "unknown"/attention,
 * raw status still shown). */
const VIAJES_STATUS_MAP: Record<string, ListingLifecycleStatus> = {
  draft: "draft",
  submitted: "pending_review",
  in_review: "pending_review",
  approved: "published",
  rejected: "rejected",
  expired: "expired",
  unpublished: "unpublished",
};

/** Work Package I.8B — confirmed real `restaurantes_public_listings.status` CHECK constraint
 * (migration `20260508150000_restaurantes_status_archived.sql`): exactly
 * `'published' | 'suspended' | 'archived'`. Previously shown as the raw, untranslated string in
 * a hardcoded-emerald pill on the generic `DashboardCategoryListingCard` — a suspended or
 * archived restaurant listing was displayed in the same "success" green as a live one. */
const RESTAURANTES_STATUS_MAP: Record<string, ListingLifecycleStatus> = {
  published: "published",
  suspended: "suspended",
  archived: "archived",
};

function mapCategoryStatusToCanonical(category: string, raw: string): ListingLifecycleStatus | null {
  const cat = category.trim().toLowerCase();
  const status = raw.trim();
  if (!status) return null;

  if (cat === "empleos") {
    // mapEmpleosStatusToCanonical() defaults unknown input to "draft" (never throws) — only
    // trust that default when the raw value is genuinely unrecognized is what we want here too,
    // so route it through the shared "unknown" fallback instead when it isn't one of the real
    // EmpleosListingLifecycleDb values.
    const known = new Set(["draft", "pending_review", "published", "paused", "archived", "rejected"]);
    if (!known.has(status)) return null;
    return mapEmpleosStatusToCanonical(status);
  }

  if (cat === "viajes") {
    return VIAJES_STATUS_MAP[status] ?? null;
  }

  if (cat === "restaurantes") {
    return RESTAURANTES_STATUS_MAP[status] ?? null;
  }

  if (cat === "servicios") {
    // Work Package I.8B — confirmed real `servicios_public_listings.listing_status` CHECK
    // constraint (migration `20260713153000_servicios_pending_payment_status_and_published_at.sql`)
    // already uses the exact same vocabulary as `ListingLifecycleStatus` — no separate mapping
    // table needed, only validation that the raw value is one of the real, confirmed members.
    return isValidLifecycleStatus(status) ? status : null;
  }

  // Rentas/BR/En Venta/Clases/Comunidad/Busco/Mascotas (shared `listings` table) already have
  // their own established display pipeline (`resolveListingUiStatus` + `listingUiStatusLabel`) —
  // this helper intentionally does not re-implement that path; callers for those categories
  // should keep using the existing helpers. Autos already has a real canonical mapper
  // (`mapAutosStatusToCanonical`) wired elsewhere. This function only fills the gaps that had
  // none: Empleos, Viajes, Restaurantes, Servicios.
  return null;
}

/**
 * Resolve a truthful, display-only status for a dedicated-table dashboard row (currently:
 * Empleos, Viajes). Returns an "unknown" display (never "active"/"published") for any raw value
 * this function cannot confidently map, while still preserving the raw string for the caller.
 */
export function resolveOwnerDashboardStatusDisplay(category: string, rawStatus: string | null | undefined): OwnerDashboardStatusDisplay {
  const raw = String(rawStatus ?? "").trim();
  const canonical = mapCategoryStatusToCanonical(category, raw);

  if (!canonical) {
    return {
      displayKey: "unknown",
      labelEs: "Requiere atención",
      labelEn: "Needs attention",
      tone: "warn",
      rawStatus: raw,
      category,
    };
  }

  return {
    displayKey: canonical,
    labelEs: getStatusLabel(canonical, "es" as Lang),
    labelEn: getStatusLabel(canonical, "en" as Lang),
    tone: toneForCanonical(canonical),
    rawStatus: raw,
    category,
  };
}

export function ownerDashboardStatusLabel(display: OwnerDashboardStatusDisplay, lang: Lang): string {
  return lang === "es" ? display.labelEs : display.labelEn;
}
