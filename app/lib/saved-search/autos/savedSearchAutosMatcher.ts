/**
 * Saved Search 02 — pure Autos matcher.
 *
 * Answers exactly one question: "would this published, publicly-visible Autos listing belong in
 * the results this saved search represents?" Nothing else. No email, SMS, push, in-app
 * notification, outbox write, cron, Edge Function, or publish-flow hook lives here or is called
 * from here — this function is not wired into anything yet (Saved Search 03+).
 *
 * Reuses `applyAutosPublicFilters` verbatim (the exact function driving the live public Autos
 * results page — `app/(site)/clasificados/autos/components/public/autosPublicFilters.ts`) so
 * match semantics can never drift from what a user actually sees running this search themselves.
 * This file must never grow its own parallel notion of what an Autos filter means.
 *
 * Saved Search 02B — visibility is now a TYPE-enforced precondition, not just a documented one:
 * this function only accepts `AutosPublicEligibleListing`, a branded type that can only be
 * produced by `certifyAutosPublicEligibleListing`
 * (`app/lib/saved-search/autos/autosPublicEligibleListing.ts`), which re-runs the real
 * status + dealer-parent-liveness gate. A plain `AutosPublicListing` — including one built from a
 * draft/suspended/unpublished row — is not assignable to `AutosPublicEligibleListing` and will
 * not type-check here without an explicit unsafe cast, so an ineligible listing cannot
 * accidentally reach this matcher.
 */
import { applyAutosPublicFilters } from "@/app/clasificados/autos/components/public/autosPublicFilters";
import type { SavedSearchNormalizedInput } from "../savedSearchTypes";
import { savedSearchToAutosFilterState } from "./savedSearchAutosAdapter";
import type { AutosPublicEligibleListing } from "./autosPublicEligibleListing";

export function matchesAutosSavedSearch(
  listing: AutosPublicEligibleListing,
  savedSearch: SavedSearchNormalizedInput,
): boolean {
  const { filters, searchQ } = savedSearchToAutosFilterState(savedSearch);
  return applyAutosPublicFilters([listing], filters, searchQ).length > 0;
}
