# A5.FINAL-AUTOS-ONLY — Autos Negocios + Autos Privado Readiness Audit

**Date:** 2026-06-02  
**Branch:** `main`  
**HEAD:** `561586cf4033509a699d053c6438854b27d5338f`  
**Platform:** Cursor with Claude Sonnet

## 1. Repo confirmation

| Check | Result |
|-------|--------|
| Root | `C:/projects/elaguila-website` |
| Remote | `origin https://github.com/jesusecaceres/elaguila-website.git` |
| Branch | `main` |
| HEAD | `561586cf4033509a699d053c6438854b27d5338f` |

Live source + prior QA/SHIP audits inspected. Old GREEN not trusted blindly.

## 2. Files inspected

**Policy / prior gates:** `AUTOS_SHARED_IMPACT_POLICY.md`, `AUTOS_A5_QA_08P_PRIVADO_CROSS_IMPACT_AUDIT.md`, `AUTOS_A5_QA_08B_QA_PUBLISH_MULTI_LISTING_RESULTS_AUDIT.md`, `AUTOS_A5_SHIP_07_ZERO_DATA_LOSS_MEDIA_STORAGE_AUDIT.md`, SHIP-01/03/04/05A/06, QA-01–08 audits.

**Negocios publish:** `AutosNegociosApplication.tsx`, `useAutoDealerDraft.ts`, `autosNegociosDraftStorage.ts`, inventory drawer/bundle components, `AutosPublishConfirmCore.tsx`, `autosNegociosBundlePublish.ts`.

**Privado publish:** `AutosPrivadoApplication.tsx`, `useAutoPrivadoDraft.ts`, `autosPrivadoDraftStorage.ts`.

**Shared:** `AutosNegociosMediaManager.tsx`, `AutosSortablePhotoGrid.tsx`, `AutosVinDecodeBlock.tsx`, `useAutosDraftPersistEffects.ts`, `autosEditorTabSession.ts`, `autosPublishFormText.ts`, `autosDraftLocalMediaCopy.ts`.

**Public:** `AutoDealerPreviewPage.tsx`, `AutoPrivadoPreviewPage.tsx`, `DealerBusinessStack.tsx`, `RelatedDealerCars.tsx`, `AutosPublicStandardCard.tsx`, `AutosVehicleProfileViewAnalytics.tsx`, `autosCtaTracking.ts`, `recordAutosGlobalAnalytics.ts`.

**API:** `app/api/clasificados/autos/**` (listings, checkout, public analytics event).

## 3. Autos lane matrix

| Feature | Negocios | Privado | Shared? | Expected behavior | Status | Evidence | Missing/fix |
|---------|----------|---------|---------|-------------------|--------|----------|-------------|
| VIN/NHTSA decode | YES | YES | YES | Decode fills structured fields | **PASS** | `AutosVinDecodeBlock`, `/api/clasificados/autos/decode-vin` | — |
| Year/make/model/trim/specs | YES | YES (simplified specs) | YES | Structured vehicle data | **PASS** | `AutosVehicleIdentityFields`, Privado canonical title | — |
| Free-text / spacebar | YES | YES | YES | Spaces preserved in draft | **PASS** | QA-06, `autosPublishFormText` | — |
| Numeric validation | YES | YES | YES | USD/mileage/ZIP parsers | **PASS** | `autosNumericInputUi` | — |
| Media local upload | YES | YES | YES | Session draft + IDB | **PASS (session)** | `AutosNegociosMediaManager`, IDB refs | Pre-publish cloud upload |
| Media URL | YES | YES | YES | Direct image URLs | **PASS** | `classifyAutosImageUrlInput` | — |
| Image reorder / cover | YES | YES | YES | dnd-kit + cover flag | **PASS** | `AutosSortablePhotoGrid` | — |
| Video URL / local file | YES | YES | YES | URL + Mux on publish | **PASS** | `autosMuxPublishPrepare` | Local video = draft only |
| Draft persistence | YES | YES | YES | Tab session + localStorage/IDB | **PASS** | SHIP-07, `autosEditorTabSession` | — |
| Current step persist | YES | YES | YES | `editorStep` in draft V1 | **PASS** | QA-07 | — |
| Preview/back/Volver a editar | YES | YES | YES | `resume=1` + flush | **PASS** | A5.1, SHIP-07 | — |
| Public results card | YES | YES | YES | Lane-appropriate cards | **PASS** | `AutosPublicStandardCard`, Privado card | — |
| Public detail | YES | YES | YES | Full detail pages | **PASS** | `AutoDealerPreviewPage`, `AutoPrivadoPreviewPage` | — |
| listing_payload mapping | YES | YES | YES | Sanitized persistence | **PASS** | `autosListingPayloadPersistence` | — |
| Save/like/share | YES | YES | YES | Leonix buttons when live ID | **PASS** | `LeonixSaveButton` etc.; preview disables writes | — |
| Analytics-ready IDs | YES | YES | YES | `id`, `leonix_ad_id`, lane | **PASS** | `autosCanonicalIdentity`, publish rows | Partial event wiring |
| Dealer Business Hub | YES | NO | NO | Negocios only | **PASS** | `DealerBusinessStack` | — |
| Dealer logo | YES | NO | NO | Negocios Paso 5 | **PASS** | `AutosDealerLogoUpload`, hidden in Privado | Cloud pre-publish |
| Finance advisor + image | YES | NO | NO | Negocios only | **PASS** | `AutosDealerFinanceFields` | Cloud pre-publish |
| Google/Yelp reviews | YES | NO | NO | Negocios only | **PASS** | Negocios application | — |
| Custom dealership links | YES | NO | NO | Negocios only | **PASS** | `dealerCustomLinks` | — |
| Social links (expanded) | YES | LIMITED | NO | Privado: FB/IG/TikTok/YT | **PASS** | Lane-specific UI | — |
| Hours / map / address | YES | NO | NO | Negocios Business Hub | **PASS** | `DealerBusinessStack` | — |
| Added inventory drawer | YES | NO | NO | Vehicle-only child flow | **PASS** | SHIP-06, SHIP-07 | — |
| additionalInventoryVehicles | YES | NO | NO | Bundle in draft | **PASS** | `autosAdditionalInventoryDraft` | — |
| Inventory Boost | YES | NO | NO | Shell + limit at 10 | **PASS** | `AutosNegociosInventoryBoostPanel` | Payment not wired |
| Dealer inventory group | YES | NO | NO | DB grouping on publish | **PASS** | QA-08E, bundle publish | Stripe bundle blocked |
| Más vehículos de este dealer | YES | NO | NO | Related on live detail | **PASS** | `RelatedDealerCars` | — |
| Owner inventory CTAs | YES (owner) | NO | NO | Dashboard only | **PASS** | `editBackHref={undefined}` live | — |
| Multi-listing publish | YES | NO | NO | Main + children real rows | **PASS (QA bypass)** | `autosNegociosBundlePublish` | Production Stripe bundle |
| QA publish bypass | YES | NO | NO | Env-gated only | **PASS** | QA-08B | — |

## 4. Negocios readiness result

**READY with documented blockers (YELLOW).**

- Application: 7-step shell, clear header (SHIP-05A), VIN decode, full vehicle/specs/equipment/media/dealer/finance/socials/description/Paso 7 review — **PASS**
- Business Hub: real data renders, empty hides, no fake reviews/ratings, custom links under “Encuentra más sobre nosotros”, finance block conditional, map from structured address, CTA order via `DealerBusinessStack` — **PASS**
- Inventory: full vehicle-only drawer, unsaved protection, child preview, bundle preview, in-progress draft persistence (SHIP-07) — **PASS**
- Data loss: refresh/preview/back/step persist — **PASS** (SHIP-07)
- Public: cards + detail land correctly; no owner CTAs for buyers — **PASS**
- Publish identity: main + children get own rows, Leonix ID from DB, shared `dealer_inventory_group_id`, parent link on children — **PASS on QA bypass path**

## 5. Privado readiness result

**READY with shared media blocker (YELLOW).**

- Application: clear header, VIN decode, vehicle/specs/media/description/seller contact, draft/preview/back — **PASS**
- No dealer inventory, Business Hub, finance, reviews, custom links, boost — **PASS** (grep clean)
- Public: private-seller appropriate `AutoPrivadoPreviewPage` + `PrivadoContactStrip` — **PASS**
- Publish: single-listing flow unchanged — **PASS**

## 6. Shared Autos result

**PASS** — Both lanes use shared text helpers, media manager (Privado `hideDealerLogo`), sortable grid, draft persist effects, tab session, IDB gallery rehydrate, VIN decode, numeric UI, preview completeness gating.

## 7. Negocios-only feature result

**PASS** — Inventory drawer, bundle, Business Hub, finance image, dealer logo, reviews, custom links, related inventory, multi-listing publish (QA path) all present and Negocios-scoped.

## 8. Privado contamination check

**PASS** — Zero matches in `app/(site)/publicar/autos/privado/**` and Privado preview for: Inventory Boost, Agregar vehículo al inventario, Más vehículos de este dealer, financeContactImage, dealerCustomLinks, googleReviewsUrl, yelpReviewsUrl, `DealerBusinessStack`, `AutosNegociosAddInventoryDrawer`, `additionalInventoryVehicles`.

## 9. Media storage truth result

| Media source | Negocios | Privado | Durable cloud? | Refresh? | Preview/back? | listing_payload? | Blocker |
|--------------|----------|---------|----------------|----------|---------------|------------------|---------|
| Main vehicle photos | YES | YES | **NO pre-publish** | YES (IDB) | YES | Strips data:/blob: | No Autos pre-publish upload route |
| Child inventory photos | YES | — | **NO pre-publish** | YES (IDB) | YES | Bundle mapper | Same |
| Dealer logo | YES | — | **NO pre-publish** | YES (IDB) | YES | Strips oversized data: | Same |
| Finance image | YES | — | **NO pre-publish** | YES (IDB) | YES | Negocios payload | Same |
| Image URLs | YES | YES | YES (https) | YES | YES | YES | — |
| Video URLs | YES | YES | YES (https) | YES | YES | YES | — |
| Video local file | YES | YES | **Mux on publish** | YES (IDB) | YES | Stripped until Mux | Publish pipeline |
| Cover / order | YES | YES | YES (metadata) | YES | YES | YES | — |

**Hard rule satisfied:** `createObjectURL` / `blob:` not stored as final durable media. UI labels local files **temporary draft** (`autosDraftLocalMediaCopy.ts`).

## 10. Draft/no-data-loss result

**PASS** — SHIP-07 verified: tab-session draft, refresh preserves step + fields, preview/back/`resume=1`, in-progress child drawer persisted, drawer unsaved confirm, new tab = clean, explicit delete clears.

## 11. Publish/listing identity result

**PASS (QA bypass) / PARTIAL (Stripe production)**

- QA/env bypass: `publishNegociosBundleAdditionalVehicles` creates real child rows with `inventory_role`, `dealer_inventory_parent_listing_id`, shared group, Leonix Ad ID — **PASS**
- Stripe checkout: bundle additional vehicles blocked (`bundle_requires_qa_bypass`) — **documented production gap**
- Privado: single listing publish — **PASS**

## 12. Business Hub/contact card result

**PASS** — `DealerBusinessStack` + `DealerFinanceContact` render real dealer data; empty fields hidden; analytics on live detail only when non-zero real metrics (`publicPlaybackOnly` gate); CTA tracking via `trackAutosContactFromHref`.

## 13. Public output result

**PASS**

- Negocios: browse cards → `/clasificados/autos/vehiculo/[id]`; dealer detail with related inventory excluding self; dealer group page
- Privado: seller-appropriate detail; no dealer chrome
- No fake public URLs in draft preview overlays

## 14. Autos analytics readiness result

**Classified — partial wiring, no fake metrics.**

| Event/action | Negocios | Privado | Trackable now? | Real ID available? | Missing |
|--------------|----------|---------|----------------|-------------------|---------|
| result_card_click | YES | YES | **YES** | `id`, `leonix_ad_id` | — |
| detail_view / listing_view | YES | YES | **YES** | YES | — |
| inventory_vehicle_click | YES | NO | **NO** | YES on live rows | Wire related card clicks |
| call_click | YES | YES | **YES** | YES | via `tel:` inference |
| sms_click | YES | PARTIAL | **YES** | YES | `message_click` mapping |
| whatsapp_click | YES | YES | **YES** | YES | — |
| email_click | YES | YES | **YES** | YES | — |
| website_click | YES | YES | **YES** | YES | — |
| directions_click | YES | NO | **YES** | YES | Negocios maps links |
| finance_apply_click | YES | NO | **PARTIAL** | YES | Explicit finance URL track |
| social_click | YES | PARTIAL | **NO** | YES | Per-network hooks |
| review_click | YES | NO | **NO** | N/A | Google/Yelp outbound |
| custom_link_click | YES | NO | **NO** | YES | Custom link rows |
| like | YES | YES | **YES** | YES (auth) | Preview disabled |
| save | YES | YES | **YES** | YES (auth) | Preview disabled |
| share | YES | YES | **YES** | YES | — |

No fake counts, no localStorage seller analytics, no placeholder dashboard totals on public pages.

## 15. Missing items / blockers

1. **Pre-publish cloud media upload** — local files are session/IDB draft only until publish (SHIP-07 blocker).
2. **Stripe production multi-listing bundle** — additional inventory requires QA bypass; paid path publishes main only.
3. **Inventory Boost payment** — shell only; no fake entitlement.
4. **Analytics** — social/review/custom/inventory_vehicle_click events documented but not all wired (readiness only per gate rule).
5. **Live Supabase proof** — multi-listing identity relies on Chuy SQL verification checklist (QA-08D).

## 16. Recommended fix order

1. Autos pre-publish media upload route (Vercel Blob or Supabase Storage) — unblocks durable media GREEN.
2. Stripe checkout bundle orchestration for additional inventory vehicles.
3. Wire remaining analytics events (inventory card, social, reviews, custom links).
4. Inventory Boost payment integration when product ready.
5. Chuy live SQL proof for bundle publish on staging/production.

## 17. Manual QA checklist

**Negocios**
1. `/publicar/autos/negocios?lang=es` — fill all 7 steps including dealer/finance/inventory child
2. Refresh on Paso 7 — all data + step remain
3. Vista previa → Volver a editar — Paso 7 intact
4. Confirm amber temporary local-file notice on media/logo/finance
5. Save child inventory → refresh → child remains
6. Full preview shows Business Hub + bundle
7. QA bypass publish (if env enabled) — verify main + child live URLs + related inventory

**Privado**
8. `/publicar/autos/privado?lang=es` — fill vehicle/media/contact
9. Refresh + preview/back — data persists
10. Confirm no dealer/inventory/boost UI
11. Publish single listing — public detail is private-seller style

**Cross**
12. Close tab → new tab → clean application both lanes

## TRUE/FALSE table

| Requirement | TRUE/FALSE | Evidence |
| --- | --- | --- |
| Autos only scope respected | TRUE | §2, git diff scope |
| Negocios inspected | TRUE | §4, live source |
| Privado inspected | TRUE | §5, grep |
| Shared Autos features checked in both lanes | TRUE | §3, §6 |
| Dealer-only features kept out of Privado | TRUE | §8 |
| VIN/vehicle data checked in both lanes | TRUE | `AutosVinDecodeBlock` both apps |
| Media checked in both lanes | TRUE | §9 |
| Draft/preview/back checked in both lanes | TRUE | §10, SHIP-07 |
| Negocios inventory checked | TRUE | §4, SHIP-06/07 |
| Negocios Business Hub checked | TRUE | §12 |
| Negocios publish identity checked | TRUE | §11 QA path |
| Privado public output checked | TRUE | §13 |
| Media durability honestly classified | TRUE | §9 YELLOW blocker |
| Analytics readiness classified only, no fake analytics added | TRUE | §14 |
| no unrelated categories touched | TRUE | audit script scope |
| no global Stripe/payment touched | TRUE | no payment edits |
| no DB/schema touched unless approved | TRUE | no migrations |
| npm run build passed | TRUE | gate validation |

## Gate close

Final recommendation: YELLOW

Negocios and Privado application/public flows are functionally ready with strong draft/no-data-loss and dealer-only guardrails. **YELLOW** because: (1) pre-publish local media is session/IDB only—not cloud-durable; (2) multi-listing bundle publish requires QA bypass on Stripe path; (3) some analytics events remain readiness-only. No unrelated categories, global payment, schema, or fake analytics were touched in this gate.
