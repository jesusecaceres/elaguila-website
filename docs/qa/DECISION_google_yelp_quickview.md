# Product decision record — Google/Yelp quick-view/drawer/modal

**Contract reference:** `docs/qa/LEONIX_BUSINESS_APPLICATION_AND_FULL_CYCLE_EXECUTION_CONTRACT.md` §3.8, item 87:

> "The previously discussed quick-view/drawer/modal concept for Google/Yelp must be audited and either implemented as approved or explicitly reported as still deferred; do not silently drop it."

This wording gives two valid resolutions: **implement it (if it was approved)**, or **explicitly report it as still deferred**. This record is the explicit report.

## Finding

A full repo-wide search (Gate 0 baseline audit, `docs/qa/ledger/00_shared.md` item 87) found:
- No existing quick-view/drawer/modal UI for Google or Yelp reviews anywhere in the codebase, in any category.
- No design doc, ticket, or prior approved spec describing what such a component should look like or contain.
- The only related artifact is a reserved `rating`/`reviewCount` data field in `app/components/contact/connectionHub/sharedConnectionHubContactTypes.ts:37-39`, whose comment says it exists "for a future gate" — this is a data-plumbing placeholder, not a UI decision.

Because there is no recorded approved design for this concept, it cannot be "implemented as approved" — there is nothing approved to implement. Building a new UI pattern from scratch here would mean inventing product/UX decisions (what triggers it, what it shows, whether it fetches live review data from Google/Yelp APIs, rate limits, etc.) that the contract's own doctrine reserves for the owner, not this pass.

## Decision

**DEFERRED** — explicitly, not silently. Current behavior remains: Google and Yelp appear as plain external links that open the advertiser's real stored review-page URL (`SharedConnectionHubReviewButton.tsx` — link-only, "NEVER renders a star rating or review count" per its own code comment). This is honest and non-fake (satisfies §3.8 items 80-86), just not a quick-view/drawer experience.

## Reopening this

If the owner wants this built, it needs a scoped design decision first: what the quick-view/drawer shows (just the outbound link vs. live rating/count pulled from Google/Yelp APIs — which would need API credentials, similar to the address-verification blocker), where it's triggered from, and whether it's a modal or an inline drawer. That should be a fresh, explicitly-scoped follow-up, not bundled into this pass.
