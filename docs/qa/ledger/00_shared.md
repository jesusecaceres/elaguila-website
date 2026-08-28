# Gate 0 Baseline — SHARED Application Standards (Items 1-124)

Scope: SHARED (consumed by Servicios / Restaurantes / Comida Local)
Source: contract `docs/qa/LEONIX_BUSINESS_APPLICATION_AND_FULL_CYCLE_EXECUTION_CONTRACT.md` §3
Doctrine: SOURCE VERIFIED = code was inspected. RUNTIME VERIFIED = FALSE for every row below (no browser/manual QA has run yet — that is Gate 6/A6). CURRENT STATUS below is the raw source-level finding; per contract doctrine, any RUNTIME-REQUIRED row counts as FALSE for final certification until runtime-verified.

Legend: T=TRUE, F=FALSE, RR=RUNTIME-REQUIRED (source looks correct, behavior unproven)

## 3.1 Existing filled application protection (1-15)

| ID | Requirement | Status | Evidence | Defect/Fix | Notes |
|---|---|---|---|---|---|
| 1 | Servicios existing app hydrates w/o refill | T | serviciosPublishedToApplicationDraft.ts:269-384 | None | Maps full DB profile_json |
| 2 | Restaurantes existing app hydrates w/o refill | T | dashboard/restaurantes/page.tsx:271-322 | None | Fetch by owner+id, merge |
| 3 | Comida Local existing app hydrates w/o refill | T | ComidaLocalApplicationClient.tsx:215-276 | None | fetchOwnerComidaLocalListingForEdit |
| 4 | Hard refresh preserves text values | T | clasificadosServiciosStorage.ts:37-73; restauranteDraftStorage.ts:14-93; comidaLocalDraftPersistence.ts:174-300 | None | All 3 round-trip via storage |
| 5 | Hard refresh preserves selections/chips | T | serviciosPublishedToApplicationDraft.ts:335-342; restauranteListingApplicationModel.ts:367; comidaLocalDraftPersistence.ts:188-210 | None | |
| 6 | Hard refresh preserves hours | T | serviciosPublishedToApplicationDraft.ts:84-103; restauranteListingApplicationModel.ts:81-92; comidaLocalDraftPersistence.ts:136-147 | None | |
| 7 | Hard refresh preserves photos/media | T | clasificadosServiciosDraftMediaIdb.ts; restauranteDraftMediaIdb.ts; comidaLocalDraftPersistence.ts:262-267 | None | IndexedDB offload |
| 8 | Hard refresh preserves video URLs | **F** | comidaLocalPublishValidation.ts:227; comidaLocalTypes.ts:130-179 | Comida Local has no video field at all (maxExternalVideos:0) — clarify contract intent (N/A vs gap) | Servicios/Restaurantes OK |
| 9 | Hard refresh preserves socials/additional links | T | serviciosPublishedToApplicationDraft.ts:349-362; restauranteListingApplicationModel.ts:305-333; comidaLocalDraftPersistence.ts:243-245,261 | None | |
| 10 | Hard refresh preserves coupons/flyer where applicable | T | serviciosPublishedToApplicationDraft.ts:288-306,366; restauranteListingApplicationModel.ts:110-138,368-373 | None | Comida Local N/A (no coupon feature) |
| 11 | Hard refresh preserves category-specific values | T | restauranteListingApplicationModel.ts:375-377; serviciosPublishedToApplicationDraft.ts:374-383; comidaLocalTypes.ts:134-179 | None | |
| 12 | Locale changes don't mutate canonical values | T | useRestauranteDraft.ts:80-92; RestauranteApplicationClient.tsx:171-176 | None | lang only selects UI copy |
| 13 | Locale changes don't create new identity | T | createEmptyRestauranteDraft.ts:47-53; comidaLocalDraftPersistence.ts:226; serviciosPublishedToApplicationDraft.ts:390-394 | None | ID generated once, reused |
| 14 | Preview → Edit returns to same canonical draft/listing | T | ComidaLocalPreviewClient.tsx:79,234-279; RestaurantePreviewClient.tsx:119-317 | None | |
| 15 | IDs not duplicated by edit/preview/locale | T | publish/route.ts (servicios/restaurantes/comida-local) — UPDATE-if-found else INSERT | None | |

## 3.2 Unsaved-change protection (16-20)

| ID | Requirement | Status | Evidence | Defect/Fix | Notes |
|---|---|---|---|---|---|
| 16 | Real unsaved changes trigger leave/reload warning | T | useBusinessApplicationLeaveGuard.ts:35-63 | None | Shared hook, all 3 wire it |
| 17 | Cancel/Stay preserves all data | T | useBusinessApplicationLeaveGuard.ts:49-54 | None | Native beforeunload, no state mutation on cancel |
| 18 | Successful save w/ nothing dirty doesn't keep warning | **F** | ClasificadosServiciosApplication.tsx:566-567; RestauranteApplicationClient.tsx:203-204; ComidaLocalApplicationClient.tsx:191-192 | `isDirty` never compares to last-saved snapshot in any of the 3 — warning re-fires after a clean save. Fix: track `lastSavedSnapshot` and diff. | Confirmed bug, all 3 categories |
| 19 | Preview → Edit doesn't wrongly trigger destructive warning | T | publishFlowLifecycleClient.ts:14-32,61-69; useBusinessApplicationLeaveGuard.ts:17-25 | None | Suppression flag set before nav |
| 20 | Explicit discard requires deliberate confirmation | T | ClasificadosServiciosApplication.tsx:607-608; RestauranteApplicationClient.tsx:2605-2609; ComidaLocalApplicationClient.tsx:498-521 | None | window.confirm gate |

## 3.3 Languages input shared standard (21-39)

| ID | Requirement | Status | Evidence | Defect/Fix | Notes |
|---|---|---|---|---|---|
| 21 | One shared language-entry component | T | LanguagesInput.tsx used by all 3 clients | None | |
| 22 | Fixed/suggested languages selectable | T | LanguagesInput.tsx:69-80 | None | |
| 23 | Existing saved languages hydrate correctly | **F** | serviciosPublishedToApplicationDraft.ts:325-327 | Servicios restores `languageIds` but not `languageOtherLines` (custom chips) on edit-hydration — fix hydration mapper | |
| 24 | Custom field accepts normal typing | RR | LanguagesInput.tsx:115-120 | Runtime confirm | Plain controlled input |
| 25 | Spacebar works | RR | LanguagesInput.tsx:121-126 | Runtime confirm | onKeyDown only intercepts Enter |
| 26 | Backspace works | RR | LanguagesInput.tsx:115-120 | Runtime confirm | |
| 27 | Cursor editing works | RR | LanguagesInput.tsx:115-120 | Runtime confirm | |
| 28 | Paste works | RR | LanguagesInput.tsx:115-120 | Runtime confirm | No paste handler, likely fine |
| 29 | Explicit Add/Accept action works | T | LanguagesInput.tsx:122-134 | None | |
| 30 | Added custom language becomes chip | T | LanguagesInput.tsx:86-104 | None | |
| 31 | Chip removable independently | T | LanguagesInput.tsx:93-100 | None | |
| 32 | Blank/whitespace blocked | T | all 3 clients trim + early-return | None | |
| 33 | Duplicates handled cleanly | **F** | ComidaLocalApplicationClient.tsx:1050-1055 | Comida Local has no dedupe check (Servicios/Restaurantes do) — add dedupe | |
| 34 | Multiple custom languages coexist | T | LanguagesInput.tsx:85-104 | None | |
| 35 | No arbitrary max-3 cap | T | restauranteFormCleanupConfig.ts:14 (cap=8, not 3) | None | Servicios/Comida uncapped |
| 36 | Spanish labels correct | T | spot-checked across all 3 taxonomy files | None | |
| 37 | English labels correct | **F** | restauranteHoursPreview.ts:21-105; mapRestauranteDraftToShell.ts:680-691 | `computeShellHoursPreview` hardcodes Spanish strings, called without `lang` — English viewers see Spanish "Cerrado hoy" etc. Fix: thread lang through | This is an Hours-section bug surfacing under the Languages label-check; real defect is R-level hours i18n |
| 38 | Stored identifiers language-neutral | T | key-based enums (lang_es/en/otro, es/en/other_lang, es/en/otro) | None | |
| 39 | Same language can't duplicate via locale naming | **F** | restauranteFormCleanupConfig.ts:102-118 | Dedupe is literal lowercase string match only — "Français" vs "French" both allowed. Needs semantic/canonical mapping | |

## 3.4 Hours — Restaurant quality as shared standard (40-53)

| ID | Requirement | Status | Evidence | Defect/Fix | Notes |
|---|---|---|---|---|---|
| 40 | 7 days visible | T | HoursEditor.tsx:44 | None | |
| 41 | Open-first/default workflow fast | **F** | createEmptyRestauranteDraft.ts:87-93; ComidaLocalApplicationClient.tsx:342 (all-closed default) vs defaultClasificadosServiciosState.ts:30-40 (Mon-Sat open default) | Inconsistent defaults; Restaurantes/Comida require 7 manual toggles. Standardize on open-first default | |
| 42 | Closed toggle works clearly per day | T | HoursEditor.tsx:51-58 | None | |
| 43 | Time editing simple/aligned | T | HoursEditor.tsx:60-73 | None | |
| 44 | Weekday row alignment correct | T | HoursEditor.tsx:44-49 | None | |
| 45 | Closed days don't show fake hours | T | mapComidaLocalDraftToPreviewVm.ts:80-81; mapClasificadosServiciosApplicationToServiciosDraft.ts:239-283; restauranteHoursPreview.ts:31-36,101 | None | |
| 46 | Special hours addable where supported | **F** | Only Restaurantes has any field (a single note); Servicios/Comida Local HoursEditor calls pass no `specialHoursNote` at all | Add special-hours schema+UI to Servicios/Comida Local, or explicitly scope as Restaurantes-only | |
| 47 | Multiple special-hours entries coexist | **F** | HoursEditor.tsx:26-38 — `specialHoursNote` is a single string, not a list, anywhere | Needs multi-entry model (array of {date/range, note}) | |
| 48 | Special-hours fields use horizontal space | **F** | RestauranteApplicationClient.tsx:1356-1366 (single column) | Depends on fixing 47 first | |
| 49 | Open-now/closed-now computation truthful | T | computeBusinessHoursStatus.ts:54-94; restauranteHoursLogic.ts:53-111; serviciosHeroHoursStatus.ts:204-298 | None | 3 separate impls, each individually truthful |
| 50 | "Open today until…" snapshot preserved | **F** | restauranteHoursPreview.ts:55-60 has it; mapComidaLocalDraftToPreviewVm.ts:274-275 only exposes boolean, no "until" text | Add snapshot text to Comida Local preview mapper | |
| 51 | Legacy schedules hydrate non-destructively | **F** | clasificadosServiciosApplicationNormalize.ts:163-166 (all-or-nothing discard unless length 7); comidaLocalDraftPersistence.ts:136-147 (drops non-conforming days) vs createEmptyRestauranteDraft.ts:162-170 (gentle) | Make Servicios/Comida normalizers non-destructive like Restaurantes | |
| 52 | Spanish weekday labels correct | T | defaultClasificadosServiciosState.ts:152-160; restauranteApplicationUiCopy.ts:30-38; ComidaLocalApplicationClient.tsx:94-98 | None | |
| 53 | English weekday labels correct | T | same files, `en:` fields | None | |

## 3.5 Phone and WhatsApp (54-63)

| ID | Requirement | Status | Evidence | Defect/Fix | Notes |
|---|---|---|---|---|---|
| 54 | Primary phone (XXX) XXX-XXXX formatting | T | phoneFormat.ts:13-19; PhoneInput used across clients | None | |
| 55 | Normal typing works | RR | PhoneInput.tsx:49-53 | Runtime confirm | |
| 56 | Backspace/editing doesn't fight user | RR | phoneFormat.ts:35-45 | Runtime confirm | Deliberate shrink-detection logic present |
| 57 | Paste works | RR | PhoneInput.tsx:54-60 | Runtime confirm | |
| 58 | Saved phone persists refresh/Preview/Edit | T | full write/read chain traced (draft storage → publish payload → dashboard edit hydrate → listing mapper) | None | |
| 59 | Call CTA uses real stored number | T | buildRestaurantContactHub.ts:173-181 | None | |
| 60 | SMS CTA uses real stored number | T | buildRestaurantContactHub.ts:182-190 | None | |
| 61 | WhatsApp separate from US-only phone formatting | T | RestauranteApplicationClient.tsx:1440 vs 1450-1458 (distinct code path) | None | |
| 62 | International WhatsApp not truncated to 10 digits | **F** | RestauranteApplicationClient.tsx:643-646 (`normalizePhoneInput` caps at 11 digits total) | International numbers with country code commonly exceed 11 digits — raise/remove cap | Confirmed truncation bug |
| 63 | WhatsApp public destination truthful | T | restauranteContactHref.ts:69-75; buildRestaurantContactHub.ts:192-201 | None | Reflects whatever is stored (subject to #62 entry-time truncation) |

## 3.6 Additional websites/social links (64-73)

| ID | Requirement | Status | Evidence | Defect/Fix | Notes |
|---|---|---|---|---|---|
| 64 | Primary website distinct | T | restauranteListingApplicationModel.ts:306 vs 327-333 | None | |
| 65 | Repeatable Title+URL+Add rows | T | RestauranteApplicationClient.tsx:1402-1434 | None | |
| 66 | Multiple coexist | T | addAdditionalWebsite (cap 8) | None | |
| 67 | Removing one preserves others | T | removeAdditionalWebsiteAt filter by index | None | |
| 68 | Survive save/refresh/Preview/Edit | T | full round trip traced | None | |
| 69 | Not hidden under vague "Ver más" | T | rendered directly, no collapse | None | |
| 70 | Empty rows don't render publicly | T | buildRestaurantContactHub.ts:269-280 filters before push | None | |
| 71 | Social links render only with real URL | T | buildRestaurantContactHub.ts:282-294 (`addSocial` requires nonEmpty + valid URL) | None | |
| 72 | Pinterest allowed where model supports | **F** | restauranteListingApplicationModel.ts:305-328; restaurantContactHubSocialBrand.tsx:14-46 | Pinterest field/brand entry entirely absent from Restaurantes (a visual category where it'd fit) | |
| 73 | Indeed not shown as customer-facing social | T | no job-board field/platform/push found anywhere | None | |

## 3.7 Rich Correo/contact modal (74-79)

| ID | Requirement | Status | Evidence | Defect/Fix | Notes |
|---|---|---|---|---|---|
| 74 | Restaurant rich Correo adopted as shared standard | **F** | ServiciosBusinessHubContactCard.tsx:298-352 uses bespoke `ContactEmailMenu` dropdown + bare `mailto:` for the plain Correo button, not the shared `CtaActionSheet` modal Restaurantes/Comida Local use | Migrate Servicios Correo button to shared `CtaActionSheet` | Restaurantes/Comida Local already share it |
| 75 | Correo only with real email | T | all 3 gate behind nonEmpty/truthy email check | None | |
| 76 | Modal uses actual configured email | T | RestaurantContactHub.tsx:242-261; ComidaLocalContactActions.tsx:56-64; ServiciosBusinessHubContactCard.tsx:251-254 | None | |
| 77 | Copy-email/message/mail-app truthful | T | CtaActionSheet.tsx:644-777; ContactEmailMenu.tsx:123-137 | None | |
| 78 | Missing email hides Correo entirely | T | same conditionals as #75 | None | |
| 79 | Correo bilingual per active locale | T | CtaActionSheet.tsx:29-167; ContactEmailMenu.tsx:11-26; buildRestaurantContactHub.ts:208 | None | |

## 3.8 Google/Yelp/Leonix trust (80-87)

| ID | Requirement | Status | Evidence | Defect/Fix | Notes |
|---|---|---|---|---|---|
| 80 | Google external reputation source | T | SharedConnectionHubReviewButton.tsx:9-14,60-77 | None | |
| 81 | Yelp external reputation source | T | same + buildRestaurantContactHub.ts:308-318; mapServiciosProfileToBusinessHubContact.ts:73-80 | None | |
| 82 | External links open real stored destinations | T | RestaurantContactHub.tsx:269-270; ServiciosBusinessHubContactCard.tsx:397-400 | None | |
| 83 | Missing Google/Yelp hides control | T | buildRestaurantContactHub.ts:296-318; mapServiciosProfileToBusinessHubContact.ts:64-80 | None | Comida Local has no Google/Yelp fields at all — trivially safe |
| 84 | Leonix trust visually separate from Google/Yelp | T | RestaurantContactHub.tsx:517-535; ServiciosBusinessHubContactCard.tsx:598-612 | None | |
| 85 | Leonix trust uses lion, not heart/star clone | T | LeonixCommunityTrust.tsx:6-7,162 (🦁 glyph) | None | |
| 86 | Real counts only, no fake seeded | T (residual note) | leonixEndorsementClient.ts:29-44; leonix-endorsements/route.ts:16-28 | `restaurantesPublicBlueprintData.ts:187-441` still carries hardcoded `rating` fields used only for internal sort — not user-visible, but should be removed/tracked | |
| 87 | Google/Yelp quick-view/drawer concept resolved or explicitly deferred | **F** | No such UI found anywhere; only a reserved `rating`/`reviewCount` data field "for a future gate" (sharedConnectionHubContactTypes.ts:37-39) | No document/comment explicitly resolves this as approved-or-deferred by name. Needs an explicit product decision recorded | |

## 3.9 Translation (88-94)

| ID | Requirement | Status | Evidence | Defect/Fix | Notes |
|---|---|---|---|---|---|
| 88 | `/api/translate-ad` intact | T | app/api/translate-ad/route.ts:129-188 | None | |
| 89 | `translation_records` cache intact | T | migrations 20260527210000; provider.ts:300-338 | None | |
| 90 | Source content preserved, no destructive overwrite | T | restaurantesTranslateAd.ts:139-183; ServiciosPublicTranslationLayer.tsx:50-62; useComidaLocalPublicTranslation.tsx:39-51 | None | |
| 91 | Shell locale vs ad-content translation separate | T | ServiciosPublicTranslationLayer.tsx:67-68 | None | |
| 92 | Restaurant translator capability not disappeared | T | RestauranteAdStoryPreview.tsx:100-115 | None | |
| 93 | Translation UX reconciled across all 3 | T | shared `TranslateAdControl` pattern used in all 3 | Minor: docs/translate-ad-gates.md doesn't log Comida Local's gate version | |
| 94 | No false "global translator" claim | T | repo-wide grep — no such claim in UI copy | None | |

## 3.10 Address UX (95-102)

| ID | Requirement | Status | Evidence | Defect/Fix | Notes |
|---|---|---|---|---|---|
| 95 | street/unit/city/state/postal/country separate | T | businessAddressContract.ts:40-66; both apps' address fields | None | Comida Local intentionally uses one free-text line (privacy-first) — not a violation |
| 96 | Existing addresses hydrate | **F** | Servicios/Comida Local hydrate from DB row; Restaurantes has **no DB fetch-by-listingId** for address — relies solely on local browser draft cache | Add server-side address hydration for Restaurantes edit flow | Cross-device/cleared-cache risk |
| 97 | CityAutocomplete is city-only, not street verification | T | CityAutocomplete.tsx:1-53 (static city list only) | None | |
| 98 | Street-level verified-address UX remains unresolved | **F** (correctly unresolved) | businessAddressProvider.ts:1-45 (`manualOnlyAddressProvider` always `no_provider_configured`) | No real provider wired anywhere — report as deferred per doctrine, do not implement in this pass without owner sign-off on a provider | |
| 99 | No fake "Verified Address" claims | T | repo-wide grep clean | None | |
| 100 | Manual address entry available | T | plain text inputs in all 3 forms | None | |
| 101 | Comida Local home-address privacy not weakened | T | mapComidaLocalDraftToPreviewVm.ts:272 (opt-in gated) | None | |
| 102 | Permanent/service-area/temporary-location distinct | T | ComidaLocalApplicationClient.tsx (635-666 vs 833-947); useRestauranteDraft.ts:57-60 | None | |

## 3.11 Media/gallery/flyer (103-112)

| ID | Requirement | Status | Evidence | Defect/Fix | Notes |
|---|---|---|---|---|---|
| 103 | Media pipeline/durable URLs intact | T | restauranteDraftPublishPrepare.ts:50-145; serviciosMediaTransport.ts:4-12; ComidaLocalImageUploadField.tsx:51-60 | None | |
| 104 | No raw base64/blob in Stripe payloads | T | revenueCategoryCheckoutPayload.ts:154-185; publish routes reject data:/blob: | None | |
| 105 | Existing media reusable, no re-upload | T | restauranteDraftPublishPrepare.ts (early-return on already-remote refs) | None | |
| 106 | Restaurant flyer/coupon viewer canonical | T (where applicable) | BusinessFlyerViewerModal.tsx used by Servicios+Restaurantes | Comida Local N/A — no coupon/flyer feature | |
| 107 | Viewer closes at normal/high zoom | T | BusinessFlyerViewerModal.tsx:50-66 | None | |
| 108 | Escape closes | T | BusinessFlyerViewerModal.tsx:36-43 | None | |
| 109 | Mobile layout usable | T | responsive classes present | None | |
| 110 | No raw image/data URL dump into new tab | T | no window.open on raw URLs found | None | |
| 111 | Photos remain visually primary | T | ServiciosPublishSortableGallery.tsx:80-135; RestauranteLockedGallerySection.tsx:103-148 | None | Comida Local has no video |
| 112 | Gallery preserves photo/video browsing | T | RestauranteLockedGallerySection.tsx:94-163 | None | |

## 3.12 Pricing/Preview handoff (113-124)

| ID | Requirement | Status | Evidence | Defect/Fix | Notes |
|---|---|---|---|---|---|
| 113 | Servicios base $399/month | T | revenuePricingMatrix.ts:244-247 | None | |
| 114 | Restaurantes base $399/month | T | revenuePricingMatrix.ts:202-205 | None | |
| 115 | Comida Local base $129/month | T | revenuePricingMatrix.ts:287-290 | None | |
| 116 | Servicios coupons included, no active +$99 | **F** | ClasificadosServiciosApplication.tsx:259,3438-3453; serviciosPublishedToApplicationDraft.ts:300 (`couponsMonthlyPrice: couponsAddOn?99:0`) | Reachable via `?edit=1&listingId=` edit-hydration path — UI shows live "+$99/mes" line and wrong total even though Stripe addon is retired server-side. Fix: strip legacy +$99 UI branch entirely | CONFIRMED live defect |
| 117 | Restaurant coupons included, no active +$99 | T | restauranteApplicationFormCopy.ts:264-268,608-612; REVENUE_OS_RESTAURANTES_OFFERS_ADDON_SUPPORTED=false | None | |
| 118 | No current-sale Comida $99/149/199/399 | T | comidaLocalPackages.ts legacy tiers unreferenced in live flow | None | |
| 119 | Final review shows truthful price breakdown | **F** | ClasificadosServiciosApplication.tsx:3427-3458 | Same root cause as #116 (Servicios edit-hydration false +$99 line/$498 total) | Restaurantes/Comida Local reviews are truthful |
| 120 | One clear Preview CTA at final step | **F** | RestauranteApplicationClient.tsx:2596-2602 and 2615-2622 both call `goPreview` | Two redundant Preview buttons in Restaurantes — remove duplicate | Servicios/Comida Local each have exactly one |
| 121 | No direct publish bypass before Preview/payment | T | ComidaLocalApplicationClient.tsx:1276-1284; Servicios/Restaurantes final steps offer only Preview for new listings | None | |
| 122 | Preview → Edit returns to final/current context | **F** | RestaurantePreviewClient.tsx:73 (`EDIT_HREF_BASE` no step context); RestauranteApplicationClient.tsx:418 (`activeSectionId` hardcoded to section-a) | Restaurantes regresses to the beginning on Preview→Edit. Servicios already fixed (resumes at persisted step); Comida Local N/A (single page) | Same root cause family as R-026/R-060 below |
| 123 | Active paid listing edit doesn't recharge base | T | revenueActiveEntitlementGuard.ts:64-70,104-179; checkout/route.ts:483 | None | |
| 124 | Active coupon editing without new charge | T | enableIncludedCapabilityClient.ts:32-70; enable-included-capability/route.ts | None | |

---

## Shared totals

TRUE: 94 · FALSE: 22 · RUNTIME-REQUIRED: 8 (of 124)

## Critical shared defects carried into Gate 1

1. **#18** — stale unsaved-changes warning after clean save (all 3 categories)
2. **#116/#119** — Servicios stale "+$99" coupon line reachable via edit-hydration (live pricing-truth defect)
3. **#122** — Restaurantes Preview → Edit resets to the beginning (also drives R-026/R-060 coupon-upgrade-focus bug)
4. **#120** — Restaurantes duplicate Preview CTA
5. **#74** — Servicios Correo not on shared rich modal
6. **#61-65 language dedupe/i18n gaps** (#33, #37, #39)
7. **#46-48** — special hours only exist (partially) for Restaurantes
8. **#62** — WhatsApp international truncation at 11 digits
9. **#96** — Restaurantes address doesn't hydrate from DB on edit
10. **#87** — Google/Yelp quick-view/drawer concept never resolved
