# Recursos candidate-to-verified workflow

This document is for Coach/staff turning a **candidate** record (extracted from a source document like the 2023 Santa Clara County Community Resource Guide) into a real, publicly-eligible `community_resources` row. It is a manual, one-record-at-a-time, current-source-first process. It happens in two distinct stages with two distinct safety gates — never one combined step.

A candidate is not a fact. It is a lead pointing at what a county PDF said in 2023. Everything below exists to turn that lead into something we can stand behind **today**, and to make sure nothing unverified ever reaches the public.

## The durable pipeline

```
PDF candidate (data/recursos/candidates/scc-community-resource-guide-2023.json — immutable, never written to)
  → candidate review: current-source evidence saved to
    Supabase public.community_resource_candidate_reviews
    (admin: /admin/recursos/candidatos/[candidateId])
  → disposition = "ready_for_promotion"
  → PROMOTE (app/admin/recursosCandidateActions.ts → promoteCandidateAction)
    creates a community_resources row: active=false, verification_status="needs_review"
  → staff field review/correction on that record via the existing
    /admin/recursos/[id] RecursoForm, same as any manually-entered resource
  → EXISTING setVerificationStatusAction (app/admin/recursosActions.ts) — the ONLY
    route from needs_review to verified, unchanged, still enforcing
    validateResourceForVerification() for help-now records
  → verified + lastVerifiedAt/nextVerificationAt stamped
  → eligible for future public reads WHILE STILL FRESH
    (app/lib/recursos/server/communityResourcesPublicQueries.ts re-checks
    active + verified + isEffectivelyVerified() on every read — not just at write time)
```

Two separate safety gates on purpose: `app/lib/recursos/verificationEvidence.ts` evaluates whether a **candidate's** review evidence is strong enough to promote; `app/lib/recursos/urgentResourceValidation.ts` (unchanged) evaluates the **promoted resource itself** before it can be marked verified. Passing the first never bypasses the second.

## Stage 1 — Candidate review (`/admin/recursos/candidatos`)

1. **Start with the PDF candidate.** Open it from the queue, grouped Priority 1 → 2 → 3. The candidate JSON, the review CSV, and the verification queue JSON are all read-only references — none of them are ever edited by this workflow.
2. **Open the current official source.** Prefer the organization's or government agency's own website. The PDF's `websiteUrl` is a lead, not a confirmed source — verify it's still the right domain and still live.
3. **Confirm the organization/program still exists.** Some 2023 listings may have merged, renamed, or shut down — if so, use **Drop (obsolete)** instead of forcing a promotion. Dropping never deletes the historical PDF evidence.
4. **Confirm the phone number(s), website, service area, languages (if publicly documented), eligibility, and hours** against the current source — record which fields you actually confirmed via the evidence form's checkboxes.
5. **Confirm 24/7 only if the current official source explicitly says so.** Never infer round-the-clock availability from a hotline appearing on an emergency-resources page, and never carry a PDF "24/7" claim forward without a fresh, explicit confirmation.
6. **Confirm the address, or confirm it should be withheld for safety** (e.g. a domestic-violence shelter's physical address should generally not be published).
7. **Record discrepancies from the PDF, not just the current answer** — if the 2023 PDF phone number no longer works, say so in the notes; don't just silently overwrite it.
8. **Set disposition to "Ready for promotion"** only once you're confident in what you found. Saving evidence at any disposition never publishes or creates a resource by itself.

**Priority-1 (help-now) candidates need more**: organization confirmed active, a current source that's a government or official-org-site page (a phone call alone is not sufficient evidence for a help-now candidate — it leaves no durable citation), at least one contact method (phone/crisis-phone/SMS) confirmed, and — if the record claims 24/7 — an explicit confirmation of that specific claim. `isEvidenceSufficientForPriority1()` enforces this before Promote unlocks.

## Stage 2 — Promotion (still not public)

Promoting a `ready_for_promotion` candidate creates exactly one `community_resources` row, **always** `active: false`, `verification_status: "needs_review"`, `lastVerifiedAt: null` — regardless of how strong the evidence was. The `officialSourceUrl` on the new record comes from the evidence's `currentSourceUrl` — the source you actually checked today — never blindly copied from the PDF. Double-promotion is refused at the database layer, not just in the UI.

This record is now visible only in the admin `/admin/recursos` list, exactly like any manually-typed-in resource. Nothing about its PDF origin gives it a shortcut through the next stage.

## Stage 3 — Final verification (unchanged, existing chokepoint)

15. **Assign the final Leonix category/tags and correct any fields** using the existing `RecursoForm` — the promoted draft is a starting point, not a decision.
16. **Move `needs_review` → `verified`** through the existing admin action `setVerificationStatusAction` (`app/admin/recursosActions.ts`). For `help-now` records this still runs `validateResourceForVerification()` and refuses the transition without an official source + direct phone/crisis-phone/SMS.
17. **Set `active: true`** (via `setResourceActiveAction`) only once verified and ready to be public-eligible.
18. **Schedule the next review** — `nextVerificationAt` (stamped automatically on verify via `addDaysIso`/`DEFAULT_VERIFICATION_REVIEW_DAYS`) drives when this record must be re-checked. `resolveEffectiveVerificationStatus()`/`isEffectivelyVerified()` automatically stop treating it as public-eligible once that date passes — this happens at **every public read**, not just at write time, so a stale record silently stops surfacing rather than requiring someone to notice and manually deactivate it. Reverification restores eligibility only after a real, successful re-verify.
19. **Deactivate obsolete programs instead of deleting them.** `dbSetCommunityResourceActive(id, false, ...)` preserves the historical record and audit trail.

## What counts as an official source

An official source is the organization's own website, a government agency's own site, or a direct phone call to the organization confirming current information. **Social media pages, Google Business listings, and Yelp/review-site pages are not sufficient verification on their own** when an official source exists — they can supplement, but they don't replace a real official-source check. For Priority-1 candidates specifically, a phone call alone is not sufficient either — it must be paired with a citable government or official-org-site URL.

## Never

- Never write review state, evidence, or disposition back into the candidate JSON files under `data/recursos/candidates/` — that data is immutable source evidence, permanently. All review state lives in `public.community_resource_candidate_reviews`.
- Never promote a candidate straight to `verified` or `active` — promotion always lands `needs_review`/`inactive`; only Stage 3's existing action can change that.
- Never invent a phone number, address, eligibility rule, or "24/7" claim to fill a gap the source didn't provide — leave the field empty and note it instead.
- Never bulk-import the candidate JSON or the `prepare-candidate-import.ts` draft-preview output directly into `community_resources` — that script has no Supabase client and is a preview tool only, by design. The only real write path is the promotion action above, one candidate at a time.
- Never treat a `verification_status = 'verified'` database value as permanently true — the public query layer re-checks `nextVerificationAt` freshness on every read, and so should you when reviewing a record.
