/**
 * Gate G.2.2 — pure Bienes Raíces Negocio category adapter onto the global owner lifecycle
 * contract, built through the Gate G.2.1 Business Profile Family adapter. No I/O, no Supabase,
 * no React, no browser globals — same purity guarantee as the family/global layers it consumes.
 *
 * COMPLETELY READ-ONLY THIS GATE: every lifecycle capability produced here stays at the family
 * adapter's safe all-false default (see `businessProfileLifecycleAdapter.ts`), and no navigation
 * href is ever supplied — Gate D's `resolveDashboardActions` remains the only navigation-action
 * source for BR. This file exists to resolve normalized status + attention only.
 *
 * STATUS MAPPING (evidence-bounded — see the Gate G.2A audit Table A): only the six BR
 * `listings.status` values this repository is confirmed to actually reach are mapped explicitly.
 * Anything else — including a currently-unreachable value, a null/empty status, or the
 * inconsistent combination `status="active"` with `is_published=false` — fails closed to
 * `"draft"`, matching `resolveOwnerFacingStatus`'s own fallback semantics (Gate G.1). This file
 * does not invent `payment_issue`, `rejected`, `changes_requested`, `expired`, or `scheduled`
 * mappings — no trustworthy BR signal for any of those exists today.
 */

import type { AddonLifecycleStatus } from "@/app/lib/listingPlans/addonLifecycle";
import { BR_INVENTORY_PACK_PACKAGE_KEY } from "@/app/lib/listingPlans/publishCheckoutCheckpoint";
import { buildBusinessProfileEligibilityInput, type BusinessProfileFamilyInput } from "./businessProfileLifecycleAdapter";
import type { OwnerFacingStatusKey, OwnerLifecycleEligibilityInput } from "./ownerLifecycleTypes";
import type { InventoryRole } from "./types";

/**
 * Pure, category-neutral-shaped input a caller (dashboard card) builds from a real BR row.
 * `internalStatus`/`isPublished`/`inventoryRole` are the raw, already-fetched column values —
 * this file never queries Supabase to obtain them.
 */
export type BienesRaicesLifecycleInput = {
  canonicalListingId: string | null;
  ownerVerified: boolean;
  internalStatus: string | null | undefined;
  isPublished: boolean | null | undefined;
  /** Raw `inventory_role` column value ("main" | "inventory_property" | null). */
  inventoryRole: string | null | undefined;
  /**
   * Real, already-resolved `br_inventory_pack_monthly` lifecycle status, when the caller already
   * has it. Omit entirely when unavailable — never guessed here. Deliberately unused by the
   * Gate G.2.2 live dashboard wiring (the current card's prop tree does not carry this signal;
   * see `buildBrPaidModules` below for why `"not_purchased"` specifically must never be forwarded
   * even when this field IS supplied by a future caller).
   */
  inventoryEntitlementStatus?: AddonLifecycleStatus;
  /** Explicit "now" — this file never calls `Date.now()`/`new Date()` itself. */
  now: Date;
};

/**
 * The only six BR `listings.status` values with confirmed, reachable evidence (Gate G.2A Table
 * A): `pending` (setBrListingPendingPayment), `active` (paid activation), `paused`/`removed`
 * (generic Mis Anuncios mutations), `sold` (markStatus), `flagged` (admin moderation action).
 */
function resolveBrOwnerFacingStatus(
  internalStatus: string | null | undefined,
  isPublished: boolean | null | undefined,
): OwnerFacingStatusKey {
  const status = String(internalStatus ?? "").trim().toLowerCase();
  if (status === "active" && isPublished !== false) return "live";
  if (status === "pending") return "awaiting_payment";
  if (status === "paused") return "paused";
  if (status === "removed") return "archived";
  if (status === "sold") return "discontinued";
  if (status === "flagged") return "suspended";
  // Unknown/legacy/inconsistent (including "active" with is_published===false) — fail closed.
  return "draft";
}

function resolveBrInventoryRole(raw: string | null | undefined): InventoryRole | null {
  if (raw === "main") return "main";
  if (raw === "inventory_property") return "inventory_property";
  return null;
}

/** Only the statuses BR can reach are considered; matches Gate G.1's own per-status table for
 * exactly these seven keys (draft/awaiting_payment/live/paused editable; archived/discontinued/
 * suspended not editable). Kept as a small pure function rather than a duplicated data table. */
function isBrStatusEditable(status: OwnerFacingStatusKey): boolean {
  return status !== "archived" && status !== "discontinued" && status !== "suspended";
}

/**
 * `"not_purchased"` is deliberately never forwarded to the global contract: it would map to
 * `"inactive"` (via the family adapter's paid-module mapper) and trigger a false
 * `entitlement_inactive` attention reason for a business that simply never bought the module —
 * the exact false-warning this gate's attention-mapping rules forbid. Only a real
 * active/scheduled/expired/revoked signal is ever surfaced.
 */
function buildBrPaidModules(
  inventoryEntitlementStatus: AddonLifecycleStatus | undefined,
): Readonly<Record<string, AddonLifecycleStatus>> | undefined {
  if (!inventoryEntitlementStatus || inventoryEntitlementStatus === "not_purchased") return undefined;
  return { [BR_INVENTORY_PACK_PACKAGE_KEY]: inventoryEntitlementStatus };
}

/**
 * Builds a valid `OwnerLifecycleEligibilityInput` for a Bienes Raíces Negocio row, through the
 * Business Profile Family adapter (never bypassing it). Capabilities and navigation hrefs are
 * never supplied here — this pilot is read-only by construction, not by omission convention.
 */
export function buildBienesRaicesEligibilityInput(input: BienesRaicesLifecycleInput): OwnerLifecycleEligibilityInput {
  const normalizedStatus = resolveBrOwnerFacingStatus(input.internalStatus, input.isPublished);

  const familyInput: BusinessProfileFamilyInput = {
    canonicalListingId: input.canonicalListingId,
    categoryKey: "bienes_raices_negocio",
    ownerVerified: input.ownerVerified,
    normalizedStatus,
    internalStatus: input.internalStatus ?? null,
    publicVisibility: normalizedStatus === "live",
    editable: isBrStatusEditable(normalizedStatus),
    paidOrFree: "paid",
    // No trustworthy BR signal for either beyond `internalStatus` itself — both stay false so
    // the global resolver's status-driven attention rules (e.g. "suspended" -> listing_suspended)
    // are the only source of truth, never duplicated here.
    paymentIssue: false,
    moderationIssue: false,
    role: resolveBrInventoryRole(input.inventoryRole),
    paidModules: buildBrPaidModules(input.inventoryEntitlementStatus),
    // No capabilities, no navigationHrefs — family adapter's safe all-false default applies
    // untouched; Gate D remains the only navigation-action source for BR.
    now: input.now,
  };

  return buildBusinessProfileEligibilityInput(familyInput);
}
