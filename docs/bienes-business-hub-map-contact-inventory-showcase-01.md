# Bienes Raíces — Business Hub Map + Google/Yelp Contact + Inventory Showcase

Scoped UI/data polish build (Gates 2–6). Preserves parent/child inventory persistence.

## Goals

1. Map embed matches Ofertas Locales free Google Maps pattern
2. Application collects Google Business, Google Reviews, Yelp URLs
3. Preview/public Business Hub shows those links when present
4. Inventory preview uses horizontal showcase cards
5. No inventory persistence / pricing logic changes

## Key files

- `app/(site)/clasificados/publicar/bienes-raices/shared/BrLeonixPreviewMiniMap.tsx`
- Agente application: `steps04-09.tsx`, `agenteIndividualResidencialFormState.ts`
- Agente preview: `BrAgenteResContactSidebar.tsx`, `AgenteIndividualResidencialPreviewPage.tsx`
- Negocio form/preview: `bienesRaicesNegocioFormState.ts`, `ContactoCtasNegocioSection.tsx`, `mapBienesRaicesNegocioStateToPreviewVm.ts`, `BienesRaicesNegocioPreviewView.tsx`
- Inventory showcase: `BrNegocioPrePublishInventoryCard.tsx`, `BrNegocioPrePublishInventoryPreview.tsx`

## Verifier

`npm run verify:bienes-business-hub-map-contact-inventory-showcase-01`
