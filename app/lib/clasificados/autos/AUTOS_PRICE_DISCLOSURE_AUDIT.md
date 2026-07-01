# AUTOS PRICE DISCLOSURE AUDIT

## Objective

Add clear Autos pricing disclosure before users start the Autos Privado or Autos Negocios/Dealer application. This gate is product-truth and UX only — no Stripe wiring, no promo codes, no checkout changes, no payment enforcement, no placement entitlement.

## Pricing doctrine

- User account plan is separate from listing/ad plan.
- Listing/ad plan is category-specific (Autos Privado vs Dealer de Autos).
- Stripe proves payment later; admin/entitlement decides placement later.
- No fake paid status, discounts, placement, or premium partner promises.

## Pricing displayed

| Lane | Price | Notes |
|------|-------|-------|
| Autos Privado | $24.99 / 30 days | One private-seller vehicle listing |
| Dealer de Autos | $399 / month | Dealer/business inventory package |
| Additional inventory | Hidden from public pre-start UI | Repo uses $129 Inventory Boost internally; +$149 not confirmed for public disclosure |

## Files inspected

- `app/(site)/clasificados/autos/landing/AutosLandingPage.tsx`
- `app/(site)/clasificados/autos/components/public/AutosLaneCrossNav.tsx`
- `app/(site)/clasificados/autos/components/public/AutosPublicResultsShell.tsx`
- `app/(site)/publicar/autos/page.tsx`
- `app/(site)/publicar/autos/PublicarAutosBranchClient.tsx`
- `app/(site)/publicar/autos/autosBranchCopy.ts`
- `app/(site)/publicar/autos/privado/components/AutosPrivadoApplication.tsx`
- `app/(site)/publicar/autos/negocios/components/AutosNegociosApplication.tsx`
- `app/(site)/publicar/autos/shared/components/AutosPublishApplicationHeader.tsx`
- `app/(site)/publicar/autos/shared/components/AutosPublishConfirmCore.tsx`
- `app/lib/clasificados/autos/autosDealerInventoryCopy.ts` (read-only — $399 base confirmed)
- `app/lib/clasificados/autos/autosPricingCopy.ts` (new canonical display copy)

## Files changed

- `app/lib/clasificados/autos/autosPricingCopy.ts` (new)
- `app/lib/clasificados/autos/AUTOS_PRICE_DISCLOSURE_AUDIT.md` (this file)
- `app/(site)/publicar/autos/autosBranchCopy.ts`
- `app/(site)/publicar/autos/PublicarAutosBranchClient.tsx`
- `app/(site)/publicar/autos/shared/components/AutosPricingBadge.tsx` (new)
- `app/(site)/publicar/autos/shared/components/AutosPricingPlanBanner.tsx` (new)
- `app/(site)/publicar/autos/shared/components/AutosPublishApplicationHeader.tsx`
- `app/(site)/publicar/autos/shared/components/AutosPublishConfirmCore.tsx`
- `app/(site)/publicar/autos/privado/components/AutosPrivadoApplication.tsx`
- `app/(site)/publicar/autos/negocios/components/AutosNegociosApplication.tsx`
- `app/(site)/clasificados/autos/components/public/AutosLaneCrossNav.tsx`
- `app/(site)/clasificados/autos/landing/AutosLandingPage.tsx`
- `app/(site)/clasificados/autos/components/public/AutosPublicResultsShell.tsx` (lang prop only)
- `scripts/autos-price-disclosure-audit.ts` (new)
- `package.json` (autos:price-disclosure-audit script only)

## Where prices are displayed

1. **Landing cross-nav** — sell + dealer publish cards show price badge before app start.
2. **`/publicar/autos` lane selection** — Privado and Negocios cards show price badge, body, and CTA before entering application.
3. **Application top** — `AutosPricingPlanBanner` on Privado and Negocios first screen.
4. **Confirm page** — plan, plan price, payment status summary + Leonix payment system footnote (no Stripe session added).

## Privado pricing result

**PASS** — $24.99 / 30 days shown on landing sell card, branch selection, application banner, and confirm summary.

## Negocios pricing result

**PASS** — $399 / month shown on landing dealer publish card, branch selection, application banner, and confirm summary.

## Additional inventory decision

**LOCKED** — Not shown on public pre-start disclosure. Internal repo confirms $399 base and $129 Inventory Boost in dealer modules only; +$149/month for 10 vehicles not presented as final public truth.

## Stripe / promo exclusion

- No Stripe wiring added in this gate.
- No promo code wiring added in this gate.
- No webhook or checkout implementation changes.
- Confirm page uses existing `publishConfirmMode` for honest QA vs Stripe status text only.

## No fake paid status

Confirm summary uses deferred/QA wording when bypass active; never marks listing as paid.

## No fake placement

No featured/premium partner claims added in pricing disclosure surfaces.

## Account plan separation

Pricing copy sourced from `autosPricingCopy.ts` only; no `membership_tier`, `business_lite`, or `business_premium` used as Autos listing plan truth.

## Mobile/PWA check (390px code inspection)

Mobile / PWA layout reviewed at 390px width by code inspection.

- Price badges use `text-xs`/`text-[13px]`, rounded-full, inline-flex — readable without overflow.
- Lane cards remain single-column on mobile; CTAs keep `min-h-[40px]`/`min-h-[48px]`.
- Application banner uses compact padding; no horizontal scroll introduced.
- Branch grid is `grid-cols-1` on mobile.

## Build result

`npm run build` — exit 0 (passed during Gate 11 validation).

## Final release decision

READY TO COMMIT AND PUSH: YES (pending Chuy review — no commit/push performed in this gate).

---

| Requirement | PASS/FIXED/BLOCKED | Evidence |
|---|---|---|
| Privado price shown before app start | FIXED | Landing sell card + `/publicar/autos` Privado card |
| Negocios price shown before app start | FIXED | Landing dealer publish card + `/publicar/autos` Negocios card |
| Privado app top shows price reminder | FIXED | `AutosPricingPlanBanner` in `AutosPrivadoApplication` |
| Negocios app top shows price reminder | FIXED | `AutosPricingPlanBanner` in `AutosNegociosApplication` |
| Confirm page shows truthful plan summary if safe | FIXED | `AutosPublishConfirmCore` plan/price/status rows |
| No Stripe wiring added | PASS | No checkout/API changes |
| No promo code wiring added | PASS | No promo UI added |
| No fake paid status added | PASS | QA/deferred status copy only |
| No fake placement/premium claims added | PASS | No featured claims in disclosure |
| Account plan not used as Autos listing plan | PASS | `autosPricingCopy.ts` only |
| Pricing copy is Autos-scoped | PASS | `app/lib/clasificados/autos/autosPricingCopy.ts` |
| Mobile pricing UI is readable | PASS | Badge + single-column cards |
| Privado preserved | PASS | No dealer-only features added |
| Negocios preserved | PASS | Inventory modules untouched |
| Build passed | PASS | npm run build exit 0 |
| No unrelated categories touched | PASS | Autos paths only |
| No staged files | PASS | Gate 11 |
| No commit created | PASS | Gate 11 |
| No push attempted | PASS | Gate 11 |
