/**
 * Gate G.2.2/G.2.3.5 — pure Bienes Raíces Negocio category adapter onto the global owner
 * lifecycle contract, built through the Gate G.2.1 Business Profile Family adapter. No I/O, no
 * Supabase, no React, no browser globals — same purity guarantee as the family/global layers it
 * consumes.
 *
 * Gate G.2.3.5 status: `canPause`/`canResume`/`canArchive`/`canDiscontinue` are now derived from
 * the row's own raw status/publication by reusing the exact pure eligibility predicates the real
 * server mutation service (`brListingLifecycleService.ts`) enforces — imported read-only from
 * `brListingLifecycleEligibility.ts` (zero imports itself, no I/O, no `"server-only"` transitive
 * dependency), never re-derived, so the descriptor-eligibility rule and the server's own
 * accept/reject rule can never silently diverge. `canRepublish` and `canRestore` stay at the
 * family adapter's safe `false` default — see the two dedicated comments below for why each is
 * deliberately excluded from this gate. No navigation href is ever supplied here — Gate D's
 * `resolveDashboardActions` remains the only navigation-action source for BR.
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
import {
  brArchiveEligible,
  brDiscontinueEligible,
  brPauseEligible,
  brResumeEligible,
} from "@/app/lib/clasificados/bienes-raices/brListingLifecycleEligibility";
import { buildBusinessProfileEligibilityInput, type BusinessProfileFamilyInput } from "./businessProfileLifecycleAdapter";
import type { OwnerFacingStatusKey, OwnerLifecycleCapabilityFlags, OwnerLifecycleEligibilityInput } from "./ownerLifecycleTypes";
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
 * Certified Gate G.2.3.5 capability set. Each flag is derived purely from the row's own raw
 * `status`/`is_published` — the exact same fields, run through the exact same pure predicate,
 * that `brListingLifecycleService.ts` uses to decide whether the real server mutation will
 * accept the transition. Applies identically to a main parent and an inventory child — role-
 * specific behavior (parent Pause cascading to children, child Resume rechecking its parent/
 * entitlement/capacity, parent Archive/Discontinue blocking on active children) is entirely the
 * server's responsibility (G.2.3.2/G.2.3.3), never re-implemented or second-guessed here.
 *
 * `canRepublish` is deliberately omitted (stays `false`): the global contract's own `"republish"`
 * lifecycle action means "reactivate an archived/expired/removed listing" (its status allowlist
 * is `archived | expired | removed`), the exact opposite of BR's real, secured Republish
 * semantics (a freshness bump available ONLY to an already-live row, which must never reactivate
 * anything — see Gate G.2.3.1's critical fix). Exposing `canRepublish` here would either render
 * nothing (status mismatch) or, worse, misrepresent what BR's Republish actually does. The
 * existing secured BR Republish control is left completely in place, outside this contract.
 *
 * `canRestore` is deliberately omitted (stays `false`): no owner Restore path exists for BR at
 * all (confirmed MISSING by the Gate G.2.3A audit) — this is a locked product decision for
 * launch, not an oversight.
 *
 * Capabilities are only ever computed for `normalizedStatus` `"live"` or `"paused"` — the two
 * statuses this gate actually certifies for owner-facing lifecycle actions. Every other reachable
 * BR status (`awaiting_payment`, `suspended`, `discontinued`, `archived`, and the fail-closed
 * `draft`) gets zero capabilities here, even where a raw per-action predicate would technically
 * allow it: `brArchiveEligible` is deliberately permissive of a flagged/pending row (matching the
 * real, already-shipped server rule that only blocks an already-`"removed"` row), and the global
 * resolver's own status table separately lists `"suspended"` as archive-eligible — but no owner
 * lifecycle action may render for a flagged (moderated) or still-unpaid row regardless of what
 * either of those two independently-correct rules would otherwise permit.
 */
function resolveBrCapabilities(
  input: BienesRaicesLifecycleInput,
  normalizedStatus: OwnerFacingStatusKey,
): OwnerLifecycleCapabilityFlags {
  if (!input.ownerVerified || !input.canonicalListingId) return {};
  if (normalizedStatus !== "live" && normalizedStatus !== "paused") return {};
  const rawRow = { status: input.internalStatus ?? null, is_published: input.isPublished ?? null };
  return {
    canPause: brPauseEligible(rawRow),
    canResume: brResumeEligible(rawRow),
    canArchive: brArchiveEligible(rawRow),
    canDiscontinue: brDiscontinueEligible(rawRow),
  };
}

/**
 * Builds a valid `OwnerLifecycleEligibilityInput` for a Bienes Raíces Negocio row, through the
 * Business Profile Family adapter (never bypassing it). No navigation href is ever supplied —
 * Gate D remains the sole navigation-action source for BR.
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
    capabilities: resolveBrCapabilities(input, normalizedStatus),
    // No navigationHrefs — family adapter's safe all-false default applies untouched; Gate D
    // remains the only navigation-action source for BR.
    now: input.now,
  };

  return buildBusinessProfileEligibilityInput(familyInput);
}
