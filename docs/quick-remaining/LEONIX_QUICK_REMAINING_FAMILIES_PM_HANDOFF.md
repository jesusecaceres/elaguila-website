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

Cursor closeout additionally:

- executed `scripts/verify-quick-business-core-01.ts` (the run Claude's session could not complete) → **OK**
- repaired the Ofertas Locales coupon pricing defect against the existing server package
  (`ofertas_locales_coupons_30d` = $199 / 30 days; flyer remains $399). See
  `docs/quick-remaining/LEONIX_OFERTAS_LOCALES_PRICING_RECONCILIATION.md`.

## What this unblocks

- Staff can onboard a Comida Local vendor in the same launchpad flow already used for Servicios,
  Restaurantes, Autos Dealer, and Bienes Negocio — without leaving the Business Concierge PWA.
- Every one of Leonix's 19 families now has one, explicit, source-grounded entry strategy recorded in
  `docs/quick-remaining/LEONIX_QUICK_ALL_FAMILIES_COVERAGE_MATRIX.md` — no more ad hoc guessing about
  which categories "should" get a Quick form.
- Remaining-family technical closeout is ready for the **FINAL ALL-QUICK INTEGRATION + FORENSIC
  CERTIFICATION** gate.

## What this does NOT change

- No new pricing, package, or Stripe SKU. Comida Local Quick reads the existing
  `comida_local_base_monthly` price live. Ofertas coupon client constants were aligned to the
  already-existing server package; flyer was not altered.
- No new database table, migration, or API route.
- No redesign of any Full experience.
- The certified Quick Classifieds and Quick Business Core trees are content-unchanged versus the
  certified SHA `b66322ba01482dcf433220de0a1855d6824f54c4`.

## Open items for the PM / owner

1. **Viajes pricing is still owner-unresolved** (`unresolvedOwnerDecision` flag in the pricing matrix).
   Until the owner locks a price, Viajes correctly stays DIRECT_CANONICAL_LINK — a Quick form cannot be
   built on top of a price that doesn't exist yet.
2. Ofertas coupon **pricing defect is CLOSED**. No remaining commercial decision is required for the
   $199 / 30-day coupon package.

## Recommended next PM gate

**FINAL ALL-QUICK INTEGRATION + FORENSIC CERTIFICATION.**

Owner QA is still forbidden until that gate is technically closed and proven. No Preview was run in
this remaining-families closeout. Merge to main and Production remain NOT AUTHORIZED.
