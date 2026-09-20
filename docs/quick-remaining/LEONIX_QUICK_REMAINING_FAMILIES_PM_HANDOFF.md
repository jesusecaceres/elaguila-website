# LEONIX QUICK — Remaining Family Coverage: PM Handoff

## What shipped

One new Quick front door — **Comida Local** (`/publicar/comida-local/rapido`) — feeding the existing
Comida Local product end to end with zero changes to its canonical draft, validator, preview, or
payment. Staff can now create a Comida Local profile with a customer in ~7 questions + 1 photo instead
of the full ~39-field form.

The other five lower-priority families (Ofertas Locales, Negocios Locales, Viajes, Iglesias, Recursos)
were cold-mapped and each was found to already have the correct entry point for what it actually is —
a paid AI-reviewed form, a discovery directory, an owner-unresolved-pricing moderation queue, a free
moderated directory, and editorial content, respectively. None of them needed or got a new Quick form.
All six now appear in a new "Más Opciones / More Options" section on the staff Quick Applications
launchpad, each with the truthful action for its real product (create-with-customer, open-application,
or open-directory), Copy/Share, and a manage link where one genuinely exists.

## What this unblocks

- Staff can onboard a Comida Local vendor in the same launchpad flow already used for Servicios,
  Restaurantes, Autos Dealer, and Bienes Negocio — without leaving the Business Concierge PWA.
- Every one of Leonix's 19 families now has one, explicit, source-grounded entry strategy recorded in
  `docs/quick-remaining/LEONIX_QUICK_ALL_FAMILIES_COVERAGE_MATRIX.md` — no more ad hoc guessing about
  which categories "should" get a Quick form.

## What this does NOT change

- No new pricing, package, or Stripe SKU. Comida Local Quick reads the existing
  `comida_local_base_monthly` price live.
- No new database table, migration, or API route.
- No redesign of any Full experience.
- The certified Quick Classifieds and Quick Business Core trees are content-unchanged versus the
  certified SHA `b66322ba01482dcf433220de0a1855d6824f54c4`.

## Open items for the PM / owner

1. **Ofertas Locales coupon pricing defect (pre-existing, found during this mission's cold-mapping, not
   caused or fixed by it).** Three disagreeing numbers exist today: the pricing matrix says $199, a
   constants file says $0, and the checkout consent copy hardcodes $399 (the flyer's price). This is a
   live, customer-facing bug independent of Quick — recommend a dedicated fix task. (This session's
   `spawn_task` tool was unavailable to file it automatically; it needs to be filed manually.)
2. **Viajes pricing is still owner-unresolved** (`unresolvedOwnerDecision` flag in the pricing matrix).
   Until the owner locks a price, Viajes correctly stays DIRECT_CANONICAL_LINK — a Quick form cannot be
   built on top of a price that doesn't exist yet.
3. **A repo verifier permission question** came up while re-proving the certified core (see
   REQUIRED TECHNICAL BLOCKERS in the final report): two pre-existing verifier scripts needed a one-line
   allowlist widening (adding the new `comida-local/` sibling directory, mirroring the existing
   `negocio-rapido/` precedent already in those same files) to stay accurate. One of the two edits could
   be executed and reverified; the other's re-run was blocked by this session's own permission
   classifier and needs a human or a differently-permissioned session to confirm it passes.

## Recommended next PM gate

Owner/PM review of the Comida Local Quick form's live behavior on a Preview deployment (deferred by
this mission's resource constraints — no Preview build was run here), followed by a decision on the
Ofertas Locales pricing defect fix, is the natural next gate. No further Quick-family work is currently
blocked or pending beyond those two items.
