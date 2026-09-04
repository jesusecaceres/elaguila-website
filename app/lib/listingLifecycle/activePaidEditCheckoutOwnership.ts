/**
 * Globalization Build C (RED #14) — server-side ownership/expiry checkout guard for the three
 * one-time active-paid-edit lanes that had neither the shared subscription entitlement guard
 * (revenueActiveEntitlementGuard.ts, subscriptions only by design) nor a dedicated validator:
 * Autos Privado (autos_privado_30d), Bienes Raíces FSBO (br_fsbo_45d), Empleos job post
 * (empleos_job_post_paid). Modeled directly on validateRentasRenewalCheckoutOwnership /
 * validateOfertasLocalesCheckoutOwnership — same auth -> ownership -> lifecycle-state shape —
 * but reuses the ONE shared resolveListingLifecycle() decision engine via a single generic
 * function, since the three lanes live in three different tables with three different status
 * vocabularies (confirmed by direct inspection of autosClassifiedsListingService.ts,
 * revenueBienesFsboFulfillment.ts, empleosPublicListingsDbServer.ts) and forcing one physical
 * reader across them would be a false consolidation, not a real one.
 *
 * Two of the three lanes (Autos Privado, Empleos) have no `expires_at` column at all — expiry is
 * computed at read time from `published_at + durationDays` (the same fixed duration already
 * locked in revenuePricingMatrix.ts), never invented, never persisted. Bienes FSBO already has a
 * real `expires_at` column (same `listings` table shape as Rentas) and uses it directly.
 *
 * Purpose: block a checkout call carrying a listingId that is ALREADY active/paid (no double
 * charge) while allowing it for a fresh pending/draft row (first purchase) or a genuinely
 * expired one (repurchase). None of these three packages has a renewalPackageKey — there is no
 * "renew the same row" concept here, only "don't recharge a row that's already active."
 */

// Deliberately NOT `import "server-only"` — matches the precedent set by
// revenueActiveEntitlementGuard.ts: this module is only ever imported from an API route, never a
// client component, and omitting the marker is what lets
// scripts/verify-active-paid-edit-checkout-ownership.ts import and exercise the real exported
// validators directly via plain `tsx` (the `server-only` package throws unconditionally on import
// outside a Next.js/webpack build).
import type { SupabaseClient } from "@supabase/supabase-js";
import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";
import { addUtcDays, resolveListingLifecycle } from "./resolveListingLifecycle";
import type { ListingLifecycleConfig } from "./listingLifecycleTypes";

/** Test-only injection seam — mirrors the `deps?.supabase` pattern already used by
 * revenueActiveEntitlementGuard.ts so scripts/verify-*.ts can exercise the real exported
 * functions against an in-memory fake instead of a live DB. Production call sites never pass it. */
export type ActivePaidEditCheckoutOwnershipDeps = { supabase?: Pick<SupabaseClient, "from"> };

export type ActivePaidEditCheckoutOwnershipResult =
  | { ok: true; ownerUserId: string | null }
  | { ok: false; status: number; code: string; message: string };

type ActivePaidEditLaneSpec = {
  table: string;
  ownerColumn: string;
  statusColumn: string;
  selectColumns: string;
  /** False means the row exists but isn't actually this lane (e.g. dealer row, agent row). */
  matchesLane: (row: Record<string, unknown>) => boolean;
  /** Set when the lane's table has a real expires_at column (e.g. Bienes FSBO). */
  expiresAtColumn?: string | null;
  /** Set when expiry must be computed from published_at + durationDays (no expires_at column). */
  publishedAtColumn?: string | null;
  durationDays: number;
  lifecycleConfig: ListingLifecycleConfig;
  wrongLaneMessage: string;
};

async function validateOneTimeActivePaidEditCheckoutOwnership(
  input: { listingId: string; bearerUserId: string | null },
  spec: ActivePaidEditLaneSpec,
  deps?: ActivePaidEditCheckoutOwnershipDeps,
): Promise<ActivePaidEditCheckoutOwnershipResult> {
  if (!input.bearerUserId?.trim()) {
    return { ok: false, status: 401, code: "auth_required", message: "Authentication required for checkout." };
  }
  const listingId = input.listingId.trim();
  if (!listingId) {
    return { ok: false, status: 400, code: "listing_id_required", message: "listingId is required for checkout." };
  }
  if (!deps?.supabase && !isSupabaseAdminConfigured()) {
    return { ok: false, status: 503, code: "supabase_not_configured", message: "Supabase admin is not configured." };
  }

  const { data, error } = await (deps?.supabase ?? getAdminSupabase())
    .from(spec.table)
    .select(spec.selectColumns)
    .eq("id", listingId)
    .maybeSingle();

  if (error || !data) {
    return { ok: false, status: 404, code: "listing_not_found", message: "Listing not found." };
  }
  const row = data as unknown as Record<string, unknown>;
  if (!row.id) {
    return { ok: false, status: 404, code: "listing_not_found", message: "Listing not found." };
  }

  if (String(row[spec.ownerColumn] ?? "").trim() !== input.bearerUserId.trim()) {
    return { ok: false, status: 403, code: "listing_owner_mismatch", message: "Listing does not belong to the authenticated user." };
  }

  if (!spec.matchesLane(row)) {
    return { ok: false, status: 422, code: "wrong_lane", message: spec.wrongLaneMessage };
  }

  const publishedAt = spec.publishedAtColumn && typeof row[spec.publishedAtColumn] === "string"
    ? (row[spec.publishedAtColumn] as string)
    : null;
  const expiresAt = spec.expiresAtColumn && typeof row[spec.expiresAtColumn] === "string"
    ? (row[spec.expiresAtColumn] as string)
    : publishedAt
      ? addUtcDays(publishedAt, spec.durationDays)
      : null;

  const lifecycle = resolveListingLifecycle(
    {
      category: spec.lifecycleConfig.category,
      packageKey: spec.lifecycleConfig.packageKey,
      status: String(row[spec.statusColumn] ?? ""),
      expiresAt,
    },
    spec.lifecycleConfig,
  );

  if (lifecycle.lifecycleState === "active" || lifecycle.lifecycleState === "expiring_soon") {
    return {
      ok: false,
      status: 409,
      code: "already_active_no_recharge",
      message: "This listing is already active and paid — no additional charge is needed.",
    };
  }

  return { ok: true, ownerUserId: String(row[spec.ownerColumn] ?? "").trim() || null };
}

export const AUTOS_PRIVADO_LIFECYCLE_CONFIG: ListingLifecycleConfig = {
  category: "autos",
  packageKey: "autos_privado_30d",
  durationType: "fixed_days",
  durationDays: 30,
  renewalPackageKey: null,
  renewalPriceCents: null,
  renewalEligibleBeforeExpiryDays: null,
  expirationRequired: true,
  hasAddons: false,
  publicVisibilityRequiresActiveLifecycle: true,
  reminderScheduleDays: [],
  sourceTable: "autos_classifieds_listings",
  activeStatuses: ["active"],
  pendingPaymentStatuses: ["draft", "pending_payment"],
  pausedStatuses: [],
  suspendedStatuses: [],
};

export async function validateAutosPrivadoActiveEditCheckoutOwnership(
  input: { listingId: string; bearerUserId: string | null },
  deps?: ActivePaidEditCheckoutOwnershipDeps,
): Promise<ActivePaidEditCheckoutOwnershipResult> {
  return validateOneTimeActivePaidEditCheckoutOwnership(
    input,
    {
      table: "autos_classifieds_listings",
      ownerColumn: "owner_user_id",
      statusColumn: "status",
      selectColumns: "id, owner_user_id, lane, status, published_at",
      matchesLane: (row) => row.lane === "privado",
      publishedAtColumn: "published_at",
      durationDays: 30,
      lifecycleConfig: AUTOS_PRIVADO_LIFECYCLE_CONFIG,
      wrongLaneMessage: "Listing is not an Autos Privado row.",
    },
    deps,
  );
}

export const BR_FSBO_LIFECYCLE_CONFIG: ListingLifecycleConfig = {
  category: "bienes-raices",
  packageKey: "br_fsbo_45d",
  durationType: "fixed_days",
  durationDays: 45,
  renewalPackageKey: null,
  renewalPriceCents: null,
  renewalEligibleBeforeExpiryDays: null,
  expirationRequired: true,
  hasAddons: false,
  publicVisibilityRequiresActiveLifecycle: true,
  reminderScheduleDays: [],
  sourceTable: "listings",
  activeStatuses: ["active"],
  pendingPaymentStatuses: ["pending", "pending_payment"],
  pausedStatuses: ["paused"],
  suspendedStatuses: ["suspended", "flagged", "removed"],
};

export async function validateBrFsboActiveEditCheckoutOwnership(
  input: { listingId: string; bearerUserId: string | null },
  deps?: ActivePaidEditCheckoutOwnershipDeps,
): Promise<ActivePaidEditCheckoutOwnershipResult> {
  return validateOneTimeActivePaidEditCheckoutOwnership(
    input,
    {
      table: "listings",
      ownerColumn: "owner_id",
      statusColumn: "status",
      selectColumns: "id, owner_id, category, seller_type, status, expires_at, listing_json",
      matchesLane: (row) => {
        if (String(row.category ?? "").trim().toLowerCase() !== "bienes-raices") return false;
        if (String(row.seller_type ?? "").trim().toLowerCase() !== "personal") return false;
        const brPublish =
          row.listing_json && typeof row.listing_json === "object"
            ? (row.listing_json as { br_publish?: { lane?: string } }).br_publish
            : null;
        return brPublish?.lane === "privado";
      },
      expiresAtColumn: "expires_at",
      durationDays: 45,
      lifecycleConfig: BR_FSBO_LIFECYCLE_CONFIG,
      wrongLaneMessage: "Listing is not a Bienes Raíces FSBO row.",
    },
    deps,
  );
}

const EMPLEOS_JOB_POST_LIFECYCLE_CONFIG: ListingLifecycleConfig = {
  category: "empleos",
  packageKey: "empleos_job_post_paid",
  durationType: "fixed_days",
  durationDays: 30,
  renewalPackageKey: null,
  renewalPriceCents: null,
  renewalEligibleBeforeExpiryDays: null,
  expirationRequired: true,
  hasAddons: false,
  publicVisibilityRequiresActiveLifecycle: true,
  reminderScheduleDays: [],
  sourceTable: "empleos_public_listings",
  activeStatuses: ["published", "pending_review"],
  pendingPaymentStatuses: ["draft"],
  pausedStatuses: ["paused"],
  suspendedStatuses: ["archived", "rejected"],
};

export async function validateEmpleosJobPostActiveEditCheckoutOwnership(
  input: { listingId: string; bearerUserId: string | null },
  deps?: ActivePaidEditCheckoutOwnershipDeps,
): Promise<ActivePaidEditCheckoutOwnershipResult> {
  return validateOneTimeActivePaidEditCheckoutOwnership(
    input,
    {
      table: "empleos_public_listings",
      ownerColumn: "owner_user_id",
      statusColumn: "lifecycle_status",
      selectColumns: "id, owner_user_id, lifecycle_status, published_at",
      matchesLane: () => true,
      publishedAtColumn: "published_at",
      durationDays: 30,
      lifecycleConfig: EMPLEOS_JOB_POST_LIFECYCLE_CONFIG,
      wrongLaneMessage: "Listing is not an Empleos job post row.",
    },
    deps,
  );
}
