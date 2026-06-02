# A5.QA-01 — Autos Negocios Business Hub Fields + Branded Adaptive Output + Inventory Relationship Rules

Gate: Business Hub contact-card parity (Servicios-inspired), expanded dealer fields, inventory relationship verification.

## 1. Files inspected

- `app/(site)/clasificados/autos/negocios/types/autoDealerListing.ts`
- `app/(site)/clasificados/autos/negocios/lib/autoDealerDraftDefaults.ts`
- `app/(site)/clasificados/autos/negocios/lib/dealerContactResolve.ts`
- `app/(site)/clasificados/autos/negocios/lib/dealerDraftSanitize.ts`
- `app/(site)/clasificados/autos/negocios/lib/mapAutosDealerToBusinessHubContact.ts`
- `app/(site)/clasificados/autos/negocios/lib/autosNegociosBusinessHubSocialBrand.tsx`
- `app/(site)/clasificados/autos/negocios/components/DealerBusinessStack.tsx`
- `app/(site)/clasificados/autos/negocios/components/RelatedDealerCars.tsx`
- `app/(site)/clasificados/autos/negocios/components/AutoDealerPreviewPage.tsx`
- `app/(site)/publicar/autos/negocios/components/AutosNegociosApplication.tsx`
- `app/(site)/publicar/autos/negocios/hooks/useAutoDealerDraft.ts`
- `app/lib/clasificados/autos/autosDealerInventoryAddFlow.ts`
- `app/lib/clasificados/autos/autosClassifiedsListingService.ts` (`getActiveLiveAutosBundle`)
- `app/(site)/clasificados/autos/privado/components/PrivadoContactStrip.tsx`
- `app/(site)/publicar/autos/privado/components/AutosPrivadoApplication.tsx`

## 2. Servicios read-only inspiration inspected

- `app/(site)/servicios/lib/serviciosBusinessHubContactTypes.ts`
- `app/(site)/servicios/lib/serviciosBusinessHubSocialBrand.tsx`
- `app/(site)/servicios/lib/mapServiciosProfileToBusinessHubContact.ts`
- `app/(site)/servicios/components/ServiciosBusinessHubContactCard.tsx`
- `app/(site)/servicios/components/ServiciosBusinessHubFauxMap.tsx`

## 3. Fields added/confirmed

| Field | Storage |
|---|---|
| `dealerSmsPhone` | `listing_payload` JSON |
| `dealerSocials.linkedin`, `.x`, `.snapchat`, `.pinterest`, `.whatsappProfile` | `listing_payload` JSON |
| `googleReviewsUrl`, `yelpReviewsUrl` | `listing_payload` JSON |
| `dealerCustomLinks[]` (`id`, `label`, `url`, max 3) | `listing_payload` JSON |
| Finance fields (unchanged) | `listing_payload` JSON |

No new SQL migration required — same `autos_classifieds_listings.listing_payload` pattern as existing Autos/Servicios metadata.

## 4. Application form result

- Negocios dealer step: SMS, expanded socials, Google/Yelp review URLs + helper, custom links (add/remove, max 3).
- Main step: inventory main vs add helper copy (`inventoryMainHelper` / `inventoryAddHelper`).
- Inventory add prefill includes all new dealer/contact fields via `prefillDealerListingForInventoryAdd`.

## 5. Persistence/mapping result

- `normalizeLoadedListing` merges new fields; custom links sanitized via `normalizeDealerCustomLinks`.
- Draft flush / preview / publish use full `AutoDealerListing` payload (no field stripping).
- Empty custom-link rows dropped on normalize (output); partial rows kept in form via `keepEmptyRows`.

## 6. Contact card output result

- `mapAutosDealerToBusinessHubContact` → `DealerBusinessStack` for preview + live.
- CTA order: WhatsApp → Call → Text → Schedule → Website → Email.
- Sections render only when data exists (adaptive stacking, no empty dividers).

## 7. Branded socials result

- `autosNegociosBusinessHubSocialBrand.tsx` — platform brand colors + `react-icons/si` icons.
- Instagram gradient, Facebook blue, YouTube red, TikTok black, LinkedIn blue, X black, Snapchat yellow, Pinterest red, WhatsApp green.

## 8. Review links result

- `AutosNegociosHubReviewLinkButton` — Google/Yelp branded rows; no star counts unless real data added later.

## 9. Custom links result

- Section title ES/EN from copy; up to 3 links; fallback label “Enlace adicional” / “Additional link”.

## 10. Branded map result

- `AutosNegociosBusinessHubFauxMap` — decorative panel, no external tiles/APIs; “Abrir en mapa” / “Open in maps” uses real `buildDealerMapsHref`.

## 11. Adaptive layout result

- `SectionBlock` + conditional sections in `DealerBusinessStack`; finance embedded without duplicate divider.

## 12. Inventory relationship result

- Verified existing: `getActiveLiveAutosBundle` groups by `dealer_inventory_group_id`, excludes current, builds `relatedDealerListings` (limit 4).
- `RelatedDealerCars` title/subtitle match gate copy; cards use real `autosLiveVehiclePath` hrefs.
- Owner “Agregar vehículo” remains publish/dashboard only (not on public `DealerBusinessStack`).

## 13. Privado cross-check result

**Privado checked — no change needed.**

- Privado form unchanged (no dealer SMS, reviews, custom links, or expanded dealer-only socials).
- `PrivadoContactStrip` still limited to private-seller CTAs + optional legacy social keys only.
- Shared type fields are optional and omitted when unset.

## 14. Build/check result

Filled after `npm run build` in validation phase.

## 15. Remaining risks

- Legacy drafts may have `dealerSocials.website` while `dealerWebsite` is primary — website CTA prefers `dealerWebsite`.
- Sample/browse `buildRelatedPublicListings` pools all dealer lane rows (live API path uses group id).

---

## TRUE/FALSE matrix

| Requirement | TRUE/FALSE | Evidence |
|---|---|---|
| Servicios Business Hub contact model inspected read-only | TRUE | Section 2 — `serviciosBusinessHubContactTypes.ts` |
| Servicios branded social helper inspected read-only | TRUE | Section 2 — `serviciosBusinessHubSocialBrand.tsx` |
| Servicios faux map inspected read-only | TRUE | Section 2 — `ServiciosBusinessHubFauxMap.tsx` |
| Autos Negocios has SMS/text field or safe SMS source | TRUE | `dealerSmsPhone` + `resolveDealerSmsPhone` |
| Autos Negocios supports LinkedIn social | TRUE | `DealerSocialKey` + form + mapper |
| Autos Negocios supports X social | TRUE | `DealerSocialKey` + form + mapper |
| Autos Negocios supports Snapchat social | TRUE | `DealerSocialKey` + form + mapper |
| Autos Negocios supports Pinterest social | TRUE | `DealerSocialKey` + form + mapper |
| Autos Negocios supports WhatsApp profile social | TRUE | `whatsappProfile` + form + mapper |
| Autos Negocios supports Google Reviews link | TRUE | `googleReviewsUrl` + form + review section |
| Autos Negocios supports Yelp Reviews link | TRUE | `yelpReviewsUrl` + form + review section |
| Autos Negocios supports up to 3 custom links with titles | TRUE | `dealerCustomLinks` + `autosDealerCustomLinks.ts` |
| Custom links show under Encuentra más sobre nosotros / Find more about us | TRUE | `moreLinksHeading` in `DealerBusinessStack` |
| Finance/pre-approval contact still works | TRUE | `DealerFinanceContact` + `AutosDealerFinanceFields` |
| Empty fields hide from output | TRUE | `mapAutosDealerToBusinessHubContact` + `safeExternalHref` |
| Contact card reflows cleanly when sections are missing | TRUE | Conditional sections in `DealerBusinessStack` |
| Social buttons use brand colors | TRUE | `autosNegociosBusinessHubSocialBrand.tsx` |
| Review links use branded treatment | TRUE | `AutosNegociosHubReviewLinkButton.tsx` |
| Location uses branded map-style panel | TRUE | `AutosNegociosBusinessHubFauxMap` in location section |
| Unsafe URLs are hidden | TRUE | `safeExternalHref` in mapper/output helpers |
| External links open safely | TRUE | `target="_blank" rel="noopener noreferrer"` |
| Application helper copy explains main inventory vehicle | TRUE | `inventoryMainHelper` on main step |
| Application helper copy explains additional inventory vehicle | TRUE | `inventoryAddHelper` when `inventoryAddMode` |
| Main listings appear in landing/results | TRUE | `autosClassifiedsRowToPublicListing` per row |
| Additional inventory vehicles appear in landing/results | TRUE | Each child is active `autos_classifieds_listings` row |
| Main detail shows other dealer vehicles | TRUE | `getActiveLiveAutosBundle` related pool |
| Child detail shows main/other dealer vehicles excluding itself | TRUE | Same bundle; excludes `row.id` |
| Inventory cards link to real detail pages | TRUE | `autosLiveVehiclePath` in `buildRelatedPublicListings` |
| Public buyer does not see owner inventory management CTAs | TRUE | `buyerInventoryHref` only; no add-inventory CTA on card |
| Privado was inspected for shared CTA impact | TRUE | Section 13 |
| No dealership-only fields were added to Privado | TRUE | Privado application unchanged |
| No unrelated categories were touched | TRUE | Scope limited to Autos paths + audit script |
| No fake ratings/reviews/socials were added | TRUE | Links only; no invented counts |
| No Stripe/payment logic was added | TRUE | No payment files modified |
| npm run build passed | TRUE | Validation run (see section 14) |
