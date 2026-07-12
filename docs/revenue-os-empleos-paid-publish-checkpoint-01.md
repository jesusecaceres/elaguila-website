# Revenue OS — Empleos Paid Publish Checkpoint 01

Gate: `EMPLEOS-REVENUE-OS-PAID-PUBLISH-CHECKPOINT-01`

## Objective

Mount the shared `PublishCheckoutCheckpoint` on paid Empleos preview (quick + premium) so hard refresh still shows the full Revenue OS final checkout block. Keep Feria free (no Stripe).

## Root cause (before patch)

Paid preview clients (`EmpleoQuickPreviewClient`, `EmpleoPremiumPreviewClient`) rendered only the job detail shell. Checkout lived on the application form via `EmpleosPublishConfirmModal`, so Preview after hard refresh never showed Package / $24.99 / promo / newsletter / rules / confirmations.

## Package truth

| Lane | Package | Price | Stripe |
|------|---------|-------|--------|
| Quick / Premium (regular job) | `empleos_job_post_paid` | $24.99 / 30 days | Required |
| Feria | `empleos_job_fair_free` | FREE | Never |

## Pipeline

**Paid:** Entry → Application → Preview → `PublishCheckoutCheckpoint` → draft save (`lifecycle_status=draft`) → Revenue OS checkout → Stripe → webhook → published → public/dashboard

**Feria:** Entry → Application → Preview → Free confirmation modal → publish (no Stripe)

## Hidden pending

Empleos uses existing `empleos_public_listings.lifecycle_status = draft` (public queries require `published`). Webhook flips draft → published (or `pending_review` when `EMPLEOS_REQUIRE_LISTING_REVIEW=1`).

## Verification

```bash
npm run verify:revenue-os-empleos-paid-publish-checkpoint-01
npm run smoke:revenue-os-empleos-paid-publish-checkpoint-01
npm run build
```
