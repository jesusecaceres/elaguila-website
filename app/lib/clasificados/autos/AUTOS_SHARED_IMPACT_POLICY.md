# Autos shared impact policy

Every Autos change must declare lane impact before merge:

| Classification | Meaning |
|---|---|
| **Negocios only** | Dealer / inventory / boost features; must not appear in Privado UI or preview. |
| **Privado only** | Private-seller simplifications; must not remove Negocios dealer capabilities. |
| **Shared Autos** | Both lanes must be checked (publish, preview, draft, media). |
| **No impact** | Docs, unrelated paths, or read-only verification. |

## Shared Autos (check both Negocios and Privado)

- Text input helpers: `autosPublishFormText.ts` (`autosDraftTextValue`, `autosDraftUrlValue`)
- Vehicle identity: `AutosVehicleIdentityFields`, `AutosVehicleEngineField` (Negocios specs step)
- Media: `AutosNegociosMediaManager`, `AutosSortablePhotoGrid`, `readFileAsDataUrl`, `classifyAutosImageUrlInput`
- Draft persistence: `useAutosDraftPersistEffects`, `autosEditorTabSession`, lane storage (`autosNegociosDraftStorage`, `autosPrivadoDraftStorage`)
- IndexedDB asset offload/rehydrate: `autosNegociosDraftIdbRefs` (gallery, logo — Privado uses gallery path; logo hidden in Privado via `hideDealerLogo`)
- Preview completeness / step shell: `autosPreviewCompleteness`, `AutosApplicationSteppedShell`, `AutosApplicationReviewStep`
- Numeric UI: `autosNumericInputUi` (price, mileage)
- Phone formatting: shared servicios phone UI where imported
- Public display helpers: `autosListingDisplayIdentity`, gallery/specs/highlights components reused in Privado preview

## Negocios only (never add to Privado)

- Dealer Business Hub: structured address, hours, booking URL, expanded socials (LinkedIn, X, Snapchat, Pinterest, WhatsApp profile)
- Dealer logo upload (`AutosDealerLogoUpload`)
- Finance advisor block + finance image/logo upload (`AutosDealerFinanceFields`, `AutosDealerFinanceImageUpload`, `DealerFinanceContact`)
- Google / Yelp review links, custom dealership links (`dealerCustomLinks`)
- Inventory drawer + `additionalInventoryVehicles[]`
- Inventory Boost panel / checkout shell
- Dealer inventory group relationship, “Más vehículos de este dealer”, owner inventory CTAs
- `DealerBusinessStack` and dealer-branded preview chrome

## Privado only

- Canonical auto title from year/make/model/trim (`applyPrivadoCanonicalTitle`)
- Simplified specs step (no engine/MPG/doors/seats in publish form)
- Seller contact step (limited socials: Facebook, Instagram, TikTok, YouTube)
- `PrivadoContactStrip` / `AutoPrivadoPreviewPage` (no dealer Business Hub card)
- Privado draft namespace / storage keys

## Rules for future Autos prompts

1. **Lane impact check required** — state Negocios / Privado / Shared / No impact in the PR or gate summary.
2. **Shared fixes** — if you change shared input, media, or draft code, verify **both** `AutosNegociosApplication` and `AutosPrivadoApplication`, plus preview surfaces.
3. **Dealer-only guardrail** — do not import Negocios Business Hub, finance image upload, inventory drawer, or Inventory Boost into Privado paths.
4. **Type sharing** — `AutoDealerListing` is a shared type; optional dealer fields may exist on the type but Privado UI must not surface them.
5. **No fake backend** — local image preview via data URL / IndexedDB is draft-only for both lanes until a real upload pipeline exists.

## Quick contamination grep (Privado publish)

These strings must **not** appear under `app/(site)/publicar/autos/privado/**`:

- `Inventory Boost`, `Agregar vehículo al inventario`, `Más vehículos de este dealer`
- `financeContactImage`, `AutosDealerFinanceImageUpload`, `DealerFinanceContact`, `DealerBusinessStack`
- `dealerCustomLinks`, `googleReviewsUrl`, `yelpReviewsUrl`
- `AutosNegociosAddInventoryDrawer`, `additionalInventoryVehicles`
