/**
 * Saved Search 02B — makes Autos public-results eligibility a type-enforced precondition of the
 * matcher, not merely a documented one.
 *
 * The real eligibility gate for a listing to appear in public Autos results
 * (`listActiveAutosClassifiedsRows`, `app/lib/clasificados/autos/autosClassifiedsListingService.ts:466-494`)
 * is:
 *   1. `status === "active"`
 *   2. for a dealer inventory child (`inventory_role === "inventory_vehicle"`), its
 *      `dealer_inventory_parent_listing_id` must resolve to a parent row that is itself
 *      `lane === "negocios"`, `inventory_role === "main"`, owned by the same `owner_user_id`,
 *      and `status === "active"` — enforced by the existing pure predicate
 *      `isAutosChildParentGateSatisfied`
 *      (`app/lib/clasificados/autos/autosPublicChildParentVisibility.ts:40-62`), reused verbatim
 *      here, never reimplemented.
 *
 * This module performs no I/O and issues no query — it is not a second visibility engine, only a
 * type-level certification wrapper over the one that already exists. The caller (a future
 * server-side matcher job, which already has to fetch the active pool + parent map to run
 * `listActiveAutosClassifiedsRows` in the first place) supplies the raw row and parent map;
 * nothing here reaches into Supabase.
 */
import { autosClassifiedsRowToPublicListing } from "@/app/lib/clasificados/autos/mapAutosClassifiedsToPublic";
import type { AutosClassifiedsListingRow } from "@/app/lib/clasificados/autos/autosClassifiedsTypes";
import {
  isAutosChildParentGateSatisfied,
  type AutosPublicParentCandidate,
} from "@/app/lib/clasificados/autos/autosPublicChildParentVisibility";
import type { AutosPublicListing } from "@/app/clasificados/autos/data/autosPublicSampleTypes";

/**
 * Branded/nominal type: structurally an `AutosPublicListing`, but the `__autosPublicEligible`
 * property makes a plain `AutosPublicListing` (or any object literal) NOT assignable to this type
 * without an explicit unsafe cast — TypeScript will reject passing a raw/draft/unpublished
 * listing to anything requiring this type. The only legitimate way to obtain one is
 * `certifyAutosPublicEligibleListing` below.
 */
export type AutosPublicEligibleListing = AutosPublicListing & {
  readonly __autosPublicEligible: true;
};

/**
 * The sole constructor. Re-runs the exact same two-part eligibility gate the live public results
 * pipeline uses against the raw row's own fields — it does not trust a caller's claim that a
 * listing is eligible. Returns `null` (never a fabricated/partial listing) when the row fails
 * either check; callers must treat `null` as "not eligible for matching," never skip the check.
 *
 * `parentsById` must be built the same way `listActiveAutosClassifiedsRows` builds it (a map of
 * the currently-active row pool, keyed by id) — this function cannot and does not fetch it.
 */
export function certifyAutosPublicEligibleListing(
  row: AutosClassifiedsListingRow,
  parentsById: ReadonlyMap<string, AutosPublicParentCandidate>,
): AutosPublicEligibleListing | null {
  if (row.status !== "active") return null;

  const gateOk = isAutosChildParentGateSatisfied(
    {
      id: row.id,
      inventory_role: row.inventory_role ?? null,
      dealer_inventory_parent_listing_id: row.dealer_inventory_parent_listing_id ?? null,
      owner_user_id: row.owner_user_id ?? null,
    },
    parentsById,
  );
  if (!gateOk) return null;

  const publicListing = autosClassifiedsRowToPublicListing(row);
  return { ...publicListing, __autosPublicEligible: true };
}
