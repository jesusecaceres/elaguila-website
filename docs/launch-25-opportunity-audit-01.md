# Launch 25 Opportunity Audit

Gate: **LAUNCH-25-OPPORTUNITY-AUDIT-01**

## Purpose

Make sure users do not miss the Leonix **Launch 25** opportunity at high-intent account moments (signup, dashboard, profile onboarding) before they publish. This is an **opportunity-visibility** gate — not money-path QA, not Stripe, not promo math.

All Launch 25 UI renders from the single source of truth: `app/components/leonix/LeonixLaunchCouponCard.tsx` (one design, one copy source). No new coupon card was created; the existing component is reused with account variants and source-tracked CTAs.

## Surfaces audited

| Surface | Route | Component / variant | Status |
|---------|-------|---------------------|--------|
| Signup | `/login?mode=signup` | `LeonixLaunchCouponCard variant="compact"` (rendered only in `mode === "signup"`) | **CONFIRMED + source updated** |
| Dashboard home | `/dashboard` | `LeonixLaunchCouponCard variant="dashboard"` | **CONFIRMED + source updated** |
| Profile onboarding | `/dashboard/perfil?onboarding=1` | `LeonixLaunchCouponCard variant="compact"` (rendered only when `onboarding`) | **CONFIRMED + source updated** |
| Newsletter (claim page) | `/newsletter` | `LeonixLaunchCouponCard variant="public"` + signup form | **GREEN — main claim page, preserved** |

## What was added / confirmed

- All three account surfaces already rendered the Launch 25 card; this gate **standardized their CTA `source` values** for clean admin/export tracking.
- The newsletter page already reads `source` + `sourceCta` from query params and forwards them to the subscriber save (`NewsletterPageClient.tsx`). No newsletter redesign.
- The subscribe route channel resolver (`resolveCaptureChannel`) was given a **tiny additive** mapping so the new flat source values still map to specific promo `capture_channel` values (backward compatible; old values still map).

## CTA source values

| Surface | CTA destination |
|---------|-----------------|
| Signup | `/newsletter?lang=<lang>&source=signup_launch_25&sourceCta=launch_25` |
| Dashboard | `/newsletter?lang=<lang>&source=dashboard_launch_25&sourceCta=launch_25` |
| Profile onboarding | `/newsletter?lang=<lang>&source=profile_onboarding_launch_25&sourceCta=launch_25` |

- Subscriber `source` reflects the exact origin (clean for admin inbox filters + CSV export).
- `sourceCta=launch_25` keeps the `cta:launch_25` interest tag consistent with other Launch 25 surfaces.
- Promo `metadata.capture_channel` maps: `signup_launch_25 → account_signup`, `dashboard_launch_25 → dashboard`, `profile_onboarding_launch_25 → profile_onboarding`.

## Copy / eligibility doctrine

The card copy (ES/EN) communicates 25% off **eligible website checkout products only**, and the fine print explicitly excludes printed magazine packages, magazine combos, free posts, and future renewals, and states the code does **not** guarantee placement, ranking, or verification. No surface promises print/combo/dealer/free eligibility.

## Exclusions (intentionally NOT touched)

- No Stripe checkout/session/webhook changes.
- No promo validation/discount/redemption math changes.
- No auth / magic link / provider config changes.
- No Supabase schema/migration changes.
- No dashboard analytics or data-query changes (card is static).
- No category publish flow changes.
- No direct newsletter subscriber save injected into auth/dashboard flows.

## Money-path QA status

**PENDING (intentional).** Launch 25 payment/redemption QA is deferred — Chuy will QA payment flows naturally while creating real ads. This gate is visibility-only.

## QA URLs

- https://www.leonixmedia.com/login?mode=signup&lang=es
- https://www.leonixmedia.com/dashboard?lang=es
- https://www.leonixmedia.com/dashboard/perfil?onboarding=1&lang=es
- https://www.leonixmedia.com/newsletter?lang=es

QA verifies each account surface shows the Launch 25 card, CTA opens the newsletter page, the newsletter page still works, and no page promises print/combo/dealer/free eligibility.

## Verifier

```bash
npm run verify:launch-25-opportunity-surfaces
```

## Related docs

- `docs/newsletter-promo-code-readiness.md`
- `docs/newsletter-sales-contact-ops.md`
- `docs/checkout-newsletter-checkbox-capture-01.md`
