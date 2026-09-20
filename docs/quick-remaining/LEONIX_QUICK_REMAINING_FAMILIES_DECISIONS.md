# LEONIX QUICK — Remaining Family Coverage: Pricing/Product Truth + Per-Family Decisions

Companion to the architecture matrix. Records pricing/product truth (Gate 2) and the individual
forensic decision for each family (Gates 3-8), including the specific doctrine warning each decision
honors.

## Gate 2 — Pricing / Product Truth

Source of truth checked directly in code, not assumed:

- `app/lib/listingPlans/revenuePricingMatrix.ts`
- `app/lib/clasificados/ofertas-locales/ofertasLocalesConstants.ts`
- `app/lib/listingIdentity/categoryRouteRegistry.ts`

| Family | Registered Package(s) | Amount (matrix) | Notes |
|---|---|---|---|
| Comida Local | `comida_local_base_monthly` | $129.00/mo | `customerType: "food_business"`, comment marks it distinct from Restaurantes (Quick Business) |
| Ofertas Locales (flyer) | `ofertas_locales_flyer_30d` | $399.00 one-time / 30 days | matches checkout consent copy |
| Ofertas Locales (coupon) | `ofertas_locales_coupons_30d` | $199.00 one-time / 30 days | **CLOSED** in the Cursor closeout: client constant `$0` and checkout consent `$399` were aligned to this server package. Flyer remains `$399`. See `LEONIX_OFERTAS_LOCALES_PRICING_RECONCILIATION.md`. |
| Negocios Locales | none | — | Confirms it is not a monetized product |
| Viajes (business) | `viajes_business_monthly` | $399.00/mo, flagged `unresolvedOwnerDecision: "Viajes business monthly pricing final lock"` | Owner has not finalized this price |
| Viajes (affiliate) | `viajes_affiliate` | $0 | |
| Iglesias | none | — | Confirmed free |
| Recursos | none | — | Confirmed not a product |

No pricing, package, or Stripe SKU was created, changed, or touched by the Remaining Families
intake work. The later Cursor closeout aligned stale Ofertas coupon *client* constants and
checkout consent to the existing server package — it did not create a price or SKU. Comida Local
Quick form surfaces the existing `comida_local_base_monthly` amount read live via
`getRevenuePackagePriceCents` — never a hardcoded number.

## Gates 3-8 — Individual Family Decisions

### Gate 3 — Comida Local → A. QUICK_INTAKE_BUILT

Decision: build a genuinely new, minimum-truthful Quick intake at `/publicar/comida-local/rapido`
that feeds the **existing** `ComidaLocalDraft` → existing validator → existing preview → existing
publish route, unmodified. Not a new product, not a new schema, not a new price.

Doctrine honored: reused the exact canonical draft shape (`createEmptyComidaLocalDraft()` spread with
narrow overrides), the exact strict validator (`validateComidaLocalDraftForFuturePublish`), and handed
off through the existing default-key `saveComidaLocalDraftToStorage` so the existing preview page picks
it up with zero changes to that page.

Architectural constraint honored: Comida Local could not be added as a 5th Quick Business category
because `QUICK_BUSINESS_CATEGORY_KEYS` is a closed, certified union with a hard verifier assertion
(`assert.equal(status live count, 4)`). Built as a fully standalone Quick feature instead of widening
that certified registry.

Media exception (the one deliberate, narrowly-scoped exception in the whole Quick program): Comida
Local's publish route rejects any `data:`/`blob:`/oversized-string media value
(`detectHeavyMedia` in `app/api/clasificados/comida-local/publish/route.ts`), so the deferred-upload
pattern every other Quick form uses cannot reach this product. `ComidaLocalQuickIntakeClient.tsx` is
the **only** file in the entire Quick program that calls an upload function
(`uploadComidaLocalDraftImage`, an existing helper called from a file the certified verifier does not
track) — documented in the file's header comment.

### Gate 4 — Ofertas Locales → C. DIRECT_CANONICAL_LINK (both lanes)

Decision: staff opens `/publicar/ofertas-locales` directly with the customer. No Quick wrapper for
either lane.

Doctrine honored: the flyer lane runs mandatory AI review before publish — a Quick wrapper cannot
shorten a step that is a content-safety gate, and doing so would silently change product behavior.
The coupon lane shares the same form and previously had a three-way pricing conflict (matrix $199,
client constant $0, consent $399). That defect is **CLOSED** in the Cursor closeout by aligning
client constants and consent copy to the existing server coupon package (`$199 / 30 days`); flyer
stays `$399`. DIRECT_CANONICAL_LINK remains the correct Quick action because the flyer lane still
requires mandatory AI review.

### Gate 5 — Negocios Locales → D. NOT_AN_AD_PRODUCT_NO_QUICK_FORM

Decision: staff opens `/negocios-locales` and copies/shares its URL. No form, no new table.

Doctrine honored explicitly: "NEGOCIOS LOCALES must NOT be turned into a generic duplicate
business-listing table." Confirmed via `categoryRouteRegistry.ts` that this family has no
`CategoryRouteAdapter` of its own — it is a pure sector index whose cards already point to each
sector's own existing, already-covered application (Servicios, Restaurantes, Comida Local, etc.).
Inventing a generic listing table here would duplicate categories this mission and Quick Business Core
already cover correctly.

### Gate 6 — Viajes → C. DIRECT_CANONICAL_LINK

Decision: staff opens `/publicar/viajes` directly. No Quick wrapper.

Doctrine honored: Viajes pricing is explicitly owner-unresolved
(`unresolvedOwnerDecision: "Viajes business monthly pricing final lock"`) and submissions go into a
team review queue rather than an instant paid-publish flow. A Quick form cannot honestly promise
"pay and you're live" when neither the price nor the instant-publish behavior exists. Viajes was
explicitly kept out of Quick Classifieds, per the mission's own warning not to force it there.

### Gate 7 — Iglesias → C. DIRECT_CANONICAL_LINK

Decision: staff opens `/iglesias/registrar` directly. No Quick wrapper, no fake preview step.

Doctrine honored explicitly: "Iglesias has its own CMS/submission architecture and must NOT be forced
into generic classifieds." Iglesias has no shared draft/preview/payment abstraction for a Quick form
to write into safely. The only way to attach a Quick form would be to POST directly to
`/api/iglesias/applications`, which breaks the certified, verifier-enforced rule that Quick code never
calls an API directly or inserts a row (`verify-quick-business-core-01.ts` §5) — a blanket
architectural invariant, honored here even though Iglesias itself carries no payment risk. No
one-off carve-out to that invariant was created, and no fabricated preview step was invented to work
around it.

### Gate 8 — Recursos → D. NOT_AN_AD_PRODUCT_NO_QUICK_FORM

Decision: staff opens `/recursos-comunitarios` and copies/shares its URL. No form.

Doctrine honored explicitly: "If there is no user-submission product: DO NOT BUILD A QUICK FORM."
Recursos is confirmed editorial content maintained by the Leonix team — there is no submission surface
of any kind to shorten.

## Summary — No Blocked Decisions

No family required **E. BLOCKED_REQUIRES_OWNER_PRODUCT_DECISION**. Every classification above was
determinable from the family's real, current architecture. The Ofertas Locales coupon pricing
inconsistency is **CLOSED** (client constants + consent aligned to the existing `$199` server
package). DIRECT_CANONICAL_LINK remains the correct Quick action.
