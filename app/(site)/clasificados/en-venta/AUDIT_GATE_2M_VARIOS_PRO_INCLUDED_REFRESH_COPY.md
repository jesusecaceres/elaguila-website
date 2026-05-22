# Gate 2M — Varios rebrand + Pro included free + hide Free/Boost

## Files inspected
- `app/(site)/clasificados/en-venta/**` (hub, results, listing, preview, publish, dashboard card, labels)
- `app/(site)/clasificados/publicar/en-venta/**`
- `app/lib/clasificados/enVentaContentDefaults.ts`
- `app/(site)/clasificados/config/categoryConfig.ts`, `clasificadosHubCopy.ts`
- `app/(site)/dashboard/page.tsx`, `mis-anuncios/page.tsx`

## Files changed
- `shared/constants/enVentaPublicLabels.ts` (new)
- `app/lib/clasificados/enVentaContentDefaults.ts`
- `config/categoryConfig.ts`, `clasificadosHubCopy.ts`
- `publicar/en-venta/page.tsx`, `free/page.tsx`, `EnVentaPublishHubClient.tsx`
- `publicar/en-venta/pro/application/LeonixEnVentaProApplication.tsx`
- `shared/components/EnVentaPlanIntakeCallout.tsx`
- `publish/EnVentaPublishWizard.tsx`, `EnVentaPublishSubmitBar.tsx`
- `EnVentaHubPageClient.tsx`, `seo/enVentaMetadata.ts`
- `results/EnVentaResultsClient.tsx`, `EnVentaResultsEmpty.tsx`
- `listing/*`, `moderation/enVentaFamilySafety.ts`, `admin/EnVentaModerationFields.tsx`
- `preview/EnVentaPreviewShell.tsx`, `EnVentaPreviewPage.tsx`, `buildEnVentaPreviewModel.ts`
- `dashboard/EnVentaListingManageCard.tsx`
- `app/(site)/dashboard/page.tsx`, `mis-anuncios/page.tsx`

## Spanish label changes
- Public category: **Varios** (was En Venta)
- Pro lane: **Varios Pro** — included sin costo
- Refresh action: **Refrescar anuncio** (dashboard mis-anuncios + manage card)
- Removed public **destacados / boost / visibilidad renovada (Pro)** buyer copy where surfaced

## English labels preserved
- **For Sale** / **For Sale Pro** (not “Various”)

## Public publish path
- `/clasificados/publicar/en-venta` → **redirects to** `/clasificados/publicar/en-venta/pro`
- `/clasificados/publicar/en-venta/free` → **redirects to Pro** (Free application files preserved)

## Free lane parked
- `LeonixEnVentaFreeApplication.tsx` and route constants **not deleted**
- Public hub no longer shows Free vs Pro grid (redirect + fallback single Pro CTA)

## Pro included-free copy
- Plan intake callout, Pro application header, publish hub defaults, preview/publish CTAs

## Boost/Impulsar wording
- Public buyer/results copy: replaced destacado/featured visibility with **recién refrescados / recently refreshed**
- Internal `boosts/` types unchanged (no schema rename)

## Refrescar anuncio
- **Wired:** dashboard `mis-anuncios` republish for `en-venta` uses existing `republished_at` flow; label **Refrescar anuncio**
- Helper copy on plan callout describes moving among recent listings (same listing id)

## Payment/Stripe
- **Untouched** — no checkout, no $9.99 in public publish path

## Build result
- Run `npm run build` after gate (see gate report)

## Remaining risks
- `app/(site)/clasificados/anuncio/[id]/page.tsx` still has inline `"En Venta"` for category chip (outside allowed edit scope)
- Storefront publish lane still references “En Venta plans” (separate product, low traffic)
- Free application source still contains parked “Gratis” strings if loaded without redirect

## TRUE/FALSE audit table
See `scripts/en-venta-gate-2m-varios-pro-included-audit.ts`
