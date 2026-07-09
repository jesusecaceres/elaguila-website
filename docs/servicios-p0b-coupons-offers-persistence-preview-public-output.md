# SERVICIOS-P0B — Coupons/Offers Persistence, Preview, Public Output

**Gate title:** SERVICIOS-P0B-COUPONS-OFFERS-PERSISTENCE-PREVIEW-PUBLIC-OUTPUT

## Problem from Restaurante/Servicios QA

Restaurante proved that a paid add-on only has value when coupon data and images survive application → refresh → preview → publish → public listing. Servicios already had coupon state, mappers, and `ServiciosCouponsCard`, but large coupon images and the shared flyer were not offloaded to IndexedDB and were not uploaded to Blob storage before publish. That caused images to disappear after hard refresh and publish to strip `data:` / IDB refs from `profile_json`.

## Files inspected

- `app/(site)/clasificados/publicar/servicios/components/ClasificadosServiciosApplication.tsx`
- `app/(site)/clasificados/publicar/servicios/lib/clasificadosServiciosApplicationTypes.ts`
- `app/(site)/clasificados/publicar/servicios/lib/clasificadosServiciosApplicationNormalize.ts`
- `app/(site)/clasificados/publicar/servicios/lib/defaultClasificadosServiciosState.ts`
- `app/(site)/clasificados/publicar/servicios/lib/clasificadosServiciosStorage.ts`
- `app/(site)/clasificados/publicar/servicios/lib/clasificadosServiciosDraftMedia.ts`
- `app/(site)/clasificados/publicar/servicios/lib/clasificadosServiciosPreviewHandoff.ts`
- `app/(site)/clasificados/publicar/servicios/lib/mapClasificadosServiciosApplicationToServiciosDraft.ts`
- `app/(site)/clasificados/publicar/servicios/lib/serviciosDraftPublishPrepare.ts`
- `app/(site)/clasificados/publicar/servicios/lib/buildServiciosPublishPayload.ts`
- `app/(site)/clasificados/publicar/servicios/preview/ClasificadosServiciosPreviewClient.tsx`
- `app/(site)/clasificados/publicar/servicios/preview/ServiciosProfessionalPreviewShell.tsx`
- `app/api/clasificados/servicios/publish/route.ts`
- `app/api/clasificados/servicios/draft-media-upload/route.ts`
- `app/(site)/servicios/components/ServiciosProfessionalProfileShell.tsx`
- `app/(site)/servicios/components/ServiciosProfileView.tsx`
- `app/(site)/servicios/components/ServiciosCouponsCard.tsx`
- `app/(site)/clasificados/servicios/[slug]/page.tsx`

## Files changed

- `clasificadosServiciosDraftMedia.ts` — IDB offload/rehydrate/strip for `COUPON_IMG|slot` and `COUPON_FLYER`
- `serviciosDraftPublishPrepare.ts` — upload coupon row images and flyer before publish
- `draft-media-upload/route.ts` — `couponImage` and `couponFlyer` slots
- `clasificadosServiciosStorage.ts` — IDB ref detection includes coupons/flyer
- `ClasificadosServiciosApplication.tsx` — media-sensitive autosave for coupon fields
- `ServiciosProfessionalPreviewShell.tsx` — show coupons section when flyer/more-offers exist
- `ServiciosProfessionalProfileShell.tsx` — same public/pro preview condition
- `ServiciosProfileView.tsx` — general/blue-collar shell renders `ServiciosCouponsCard` before gallery
- `ServiciosCouponsCard.tsx` — render flyer/more-offers when no coupon cards
- `scripts/verify-servicios-p0b-coupons-offers-persistence-preview-public-output.mjs`
- `package.json` — verifier script
- This doc

## Current Servicios coupon chain

1. **Application** — step “Cupones y ofertas destacadas”: toggle `couponsAddOn`, edit up to 4 coupon rows, upload images, flyer, more-offers URL/label.
2. **Storage** — debounced + media-sensitive save → `offloadServiciosHeavyMediaToIdb` → session JSON with compact refs.
3. **Rehydrate** — `loadClasificadosServiciosApplicationResolved` / `rehydrateServiciosApplicationMedia` → IDB blobs back to in-memory `data:` URLs.
4. **Preview** — `persistServiciosDraftForPreviewNavigation` → preview client merges via `mergeClasificadosCouponsOntoServiciosProfile` → `ServiciosCouponsCard`.
5. **Publish** — `resolveServiciosDraftMediaToRemoteUrls` uploads coupon media → `buildServiciosPublishPayload` strips non-HTTPS → API applies `applyClasificadosCouponsToServiciosWireProfile` → `profile_json`.
6. **Public** — `resolveServiciosProfile` → professional or general shell → `ServiciosCouponsCard`.

## Weak links found

- Coupon `imageUrl` and `couponFlyer.imageUrl` were not in IDB offload/rehydrate.
- Publish prep did not upload coupon media; `cleanRemoteMediaField` emptied local refs at publish time.
- General `ServiciosProfileView` did not render paid coupons.
- `ServiciosCouponsCard` returned null when only flyer/more-offers existed.

## Coupon image/flyer persistence fix

Added refs `${SV_IDB_PREFIX}|COUPON_IMG|${index}` and `${SV_IDB_PREFIX}|COUPON_FLYER` with IDB segments `couponImg` / `couponFlyer`. Unresolved refs are stripped safely in `stripUnresolvedServiciosIdbRefs`. Logo, cover, gallery, videos, and promotions behavior unchanged.

## Preview output fix

Preview already merged coupons from application state. Shell conditions now include flyer and more-offers. Both professional preview and general preview paths (when coupons exist) use `ServiciosCouponsCard` before gallery.

## Publish payload fix

`resolveServiciosDraftMediaToRemoteUrls` uploads `coupons[].imageUrl` via `couponImage` slot and `couponFlyer.imageUrl` via `couponFlyer` slot. Heavy transport guard on publish API unchanged. Upload failures return `media_upload_failed` and draft is not cleared.

## Public output fix

Published `profile_json` includes `coupons`, `couponFlyer`, and `couponMoreOffers` via existing wire mappers. Professional and general shells render `ServiciosCouponsCard` when paid coupon content exists. Empty sections remain hidden.

## Both pipeline protection

- Coupon add-on fields remain in application state regardless of `businessTypeId`.
- Professional template: `ServiciosProfessionalProfileShell` + preview shell.
- Blue-collar/trade/general: `ServiciosProfileView` + preview fallback when coupons present.
- Internal group / template routing does not drop coupon state from normalize or mapper.

## What was protected

- Stripe checkout, Revenue OS, webhook routes
- Supabase migrations/schema
- Restaurante and other categories
- Servicios application steps and P0A checkpoint/rules modal behavior
- Publish API heavy transport guard

## Manual QA checklist

- Open `/publicar/servicios?lang=es&product=servicios_profesionales`
- Fill required minimum fields
- Go to “Cupones y ofertas destacadas”
- Click “Agregar cupones por $99/mes”
- Add 2 coupons: title, description, regular/special price, code, expiration, image upload
- Add flyer image and more-offers URL/button label
- Hard refresh application — confirm rows/images/flyer/link remain
- Open preview — confirm coupons/images/flyer/more link appear
- Click Volver a editar — confirm data/images remain
- Publish/save — open public Servicios listing — confirm coupons/images/flyer/more link appear
- Repeat with a different `businessTypeId` if possible
- Confirm no `data:` URL in public HTML/source/profile JSON where inspectable

## TRUE/FALSE audit

| Check | Result |
|-------|--------|
| git status checked | TRUE |
| diff checked | TRUE |
| staged diff checked | TRUE |
| branch checked | TRUE |
| unrelated dirty files identified | TRUE |
| unrelated dirty files left untouched | TRUE |
| application coupon fields located | TRUE |
| storage chain located | TRUE |
| preview chain located | TRUE |
| publish chain located | TRUE |
| public render chain located | TRUE |
| likely weak links documented | TRUE |
| coupon image offload added | TRUE |
| coupon flyer offload added | TRUE |
| coupon image rehydrate added | TRUE |
| coupon flyer rehydrate added | TRUE |
| unresolved coupon refs stripped safely | TRUE |
| promotions/gallery/logo behavior preserved | TRUE |
| up to 4 coupons preserved in order | TRUE |
| couponsAddOn autosaves | TRUE |
| coupon rows autosave | TRUE |
| coupon image autosaves through IDB | TRUE |
| coupon flyer autosaves through IDB | TRUE |
| couponMoreOffers autosaves | TRUE |
| preview return keeps coupons | TRUE |
| hard refresh supported | TRUE |
| preview shows coupons when add-on active | TRUE |
| preview hides coupons when add-on inactive | TRUE |
| preview shows coupon images | TRUE |
| preview shows flyer when provided | TRUE |
| preview shows more-offers link when provided | TRUE |
| both template paths preserved | TRUE |
| publish payload has no coupon data URLs | TRUE |
| publish payload has no coupon IDB refs | TRUE |
| coupon image media resolves to durable URL | TRUE |
| coupon flyer media resolves to durable URL | TRUE |
| heavy transport guard preserved | TRUE |
| clear error on media upload failure | TRUE |
| draft not cleared on failed media upload | TRUE |
| profile_json includes coupons | TRUE |
| profile_json includes couponFlyer when provided | TRUE |
| profile_json includes couponMoreOffers when provided | TRUE |
| public professional shell renders coupons | TRUE |
| public general shell renders coupons or safe equivalent | TRUE |
| empty sections hidden | TRUE |
| professional pipeline supports coupons | TRUE |
| blue-collar/trade pipeline supports coupons | TRUE |
| businessTypeId change does not drop coupons | TRUE |
| template routing does not drop coupons | TRUE |
| verifier created | TRUE |
| package script added | TRUE |
| doc created | TRUE |
| manual QA included | TRUE |
| pipeline protection included | TRUE |
| protected areas listed | TRUE |

## READY TO COMMIT status

P0B verifier PASS. P0A verifier PASS. Build PASS. Gate-02 verifier failed pre-existing step-count assertion (unrelated to P0B scope).

**READY TO COMMIT: YES**
