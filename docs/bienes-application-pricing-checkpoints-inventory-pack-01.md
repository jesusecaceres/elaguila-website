# Bienes Application Pricing Checkpoints + Inventory Pack — Gate 01

## Executive Summary

This gate adds Restaurante-style pricing checkpoint UX to the Bienes Raíces **negocio / agente individual** publish flow. Users see **Agent Showcase $399/month** and optional **Inventory Pack +$99/month** (up to 4 additional properties) on the start page, inside the application before adding child inventory, and on the final step before preview. Preview and Stripe/Revenue OS checkout remain unchanged.

## Task Classification

**SCOPED GATED BUILD** — Bienes application checkpoint UX only. No Stripe, webhooks, Supabase schema, auth, admin, dashboard, or unrelated categories.

## Files Inspected

- `app/(site)/clasificados/publicar/bienes-raices/page.tsx`
- `app/(site)/clasificados/publicar/bienes-raices/BienesRaicesPublicarHubClient.tsx`
- `app/(site)/clasificados/publicar/bienes-raices/shared/brAgenteApplicationPricingCopy.ts`
- `app/(site)/clasificados/publicar/bienes-raices/shared/brAgenteApplicationPricingHelpers.ts`
- `app/(site)/clasificados/publicar/bienes-raices/shared/BrAgenteShowcaseSeeMoreDrawer.tsx`
- `app/(site)/clasificados/publicar/bienes-raices/negocio/agente-individual/application/AgenteIndividualResidencialApplication.tsx`
- `app/(site)/clasificados/publicar/bienes-raices/negocio/agente-individual/schema/agenteIndividualResidencialFormState.ts`
- `app/(site)/clasificados/publicar/bienes-raices/negocio/application/sections/shared/BrNegocioPrePublishInventoryShell.tsx`
- `app/(site)/clasificados/publicar/bienes-raices/negocio/application/sections/shared/BrAgenteInventoryPackCheckpoint.tsx`
- `app/(site)/clasificados/publicar/bienes-raices/negocio/application/sections/shared/BrAgenteApplicationPricingSummary.tsx`
- `app/(site)/clasificados/publicar/bienes-raices/negocio/application/sections/shared/BrAgenteApplicationConfirmations.tsx`
- `app/lib/listingPlans/publishCheckoutCheckpoint.ts` (read-only constants)

## Files Changed

- Start hub client + page (pricing card + See more drawer)
- Shared pricing copy, helpers, drawer
- Form state (`inventoryPackAccepted`, payment/inventory confirmation flags)
- Inventory shell (checkpoint gating)
- Agente individual application (pricing summary, confirmations, preview gating)
- This document + verifier script

## Start Page Checkpoint Result

Business card shows **Agent Showcase / Vitrina de agente — $399/month**, optional **Inventory Pack +$99/month**, and **Publish as agent / See more** actions. Private card unchanged.

## See More Drawer Result

Drawer explains base showcase and inventory pack in EN/ES. Closes via button, Escape, and backdrop click. Payment note: after preview only.

## Inventory Pack Accept/Decline Result

Before child inventory opens, users see accept (+$99, unlock add) or decline (main property only). Accepted state shows X of 4 and $498/month total. Cancel pack clears children after confirmation.

## Inventory Count Rule

- 0 children → base $399/month on final summary
- 1–4 children → +$99 pack, $498/month total
- 5th child blocked with EN/ES message

## Final Step Pricing Summary Result

Monthly pricing card on step 10 (preview gate) with correct totals and “payment after preview” note.

## Final Step Confirmation Checkbox Result

Four required boxes always; fifth inventory box when `childCount >= 1`. Preview CTA disabled until all required boxes checked. Label: **Continue to preview / Continuar a vista previa**.

## Preview Handoff Result

`openPreview` → `saveAgenteResPreviewDraft` / `saveAgenteResPreviewReturnDraft` → `BR_PREVIEW_NEGOCIO` unchanged. Checkout in preview untouched.

## Stripe/Revenue OS Not Touched

No changes to checkout routes, webhooks, or `REVENUE_OS_BR_INVENTORY_PACK_SUPPORTED`.

## Draft Persistence Safety

`inventoryPackAccepted`, confirmations, and `additionalInventoryProperties` persist via existing `persistAgenteResApplicationDraftQuiet`. Rehydrate infers pack accepted when children exist. Cancel pack with children requires confirm before clearing drafts.

## ES/EN Copy

Centralized in `brAgenteApplicationPricingCopy.ts`.

## Manual QA Checklist

- [ ] Open Bienes publish start page in EN
- [ ] Confirm Business card shows $399/month and +$99/month optional inventory pack
- [ ] Click See more; confirm drawer explains both
- [ ] Switch ES; confirm Spanish copy
- [ ] Start Business/Agent application
- [ ] Go to inventory section
- [ ] Confirm Inventory Pack checkpoint appears before add inventory opens
- [ ] Click Continue with main property only; confirm inventory remains closed
- [ ] Continue to final step; confirm total is $399/month
- [ ] Check required boxes; confirm Preview enables
- [ ] Return/back/edit
- [ ] Go back to inventory
- [ ] Accept Inventory Pack
- [ ] Add 1 child
- [ ] Confirm accepted state says +$99/month and X of 4
- [ ] Final step shows $498/month
- [ ] Inventory checkbox appears and gates preview
- [ ] Remove child / cancel inventory pack; confirm total returns to $399/month
- [ ] Try adding 5th child; confirm blocked
- [ ] Hard refresh during application; confirm parent/children still safe
- [ ] Preview opens only after boxes checked

## Remaining Risks / Deferred Work

- Generic `ResumenPublicarNegocioSection` keeps legacy inventory shell (no checkpoint) until that lane is scoped.
- Stripe inventory pack line item remains deferred (`REVENUE_OS_BR_INVENTORY_PACK_SUPPORTED=false`).
- Accepted pack with zero children after refresh: `inventoryPackAccepted` persists in draft when saved; otherwise checkpoint reappears.
