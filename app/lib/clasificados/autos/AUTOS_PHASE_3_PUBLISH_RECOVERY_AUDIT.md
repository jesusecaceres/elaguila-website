# Autos Phase 3 — Publish recovery & public surface parity

**Scope:** Finish Autos publish/persistence/visibility following the Servicios recovery pattern (read-after-write, canonical `autos_classifieds_listings` row, public API as single browse source, no giant inline media in final persist). **Servicios code was not modified.**

**Canonical public table:** `public.autos_classifieds_listings` — `status = 'active'` rows exposed via `GET /api/clasificados/autos/public/listings` and `GET /api/clasificados/autos/public/listings/[id]`, mapped with `autosClassifiedsRowToPublicListing`. Landing/results client hook `useAutosPublicListingsFetch` calls that API; demo sample merges **only** when `NEXT_PUBLIC_LEONIX_AUTOS_PUBLIC_DEMO=1` **and** `NODE_ENV !== 'production'` (`autosPublicInventoryPolicy.ts`).

**Stripe:** Paused globally per product directive; Autos activation uses `AUTOS_ALLOW_TEST_PUBLISH_BYPASS=true` (non-`VERCEL_ENV=production`) or internal bypass — unchanged architecture.

---

## 1. Files inspected

| Area | Paths |
|------|--------|
| Draft / application | `app/(site)/publicar/autos/**/*`, `useAutoPrivadoDraft.ts`, `useAutoDealerDraft.ts`, `autoDealerDraftStorage.ts`, `safeNormalizeAutosDraftListing.ts` |
| Publish / confirm | `AutosPublishConfirmCore.tsx`, `AutosPrivadoPublishConfirm.tsx`, `AutosNegociosPublishConfirm.tsx` |
| Owner APIs | `app/api/clasificados/autos/listings/route.ts`, `listings/[id]/route.ts`, `checkout/route.ts`, `checkout/verify-internal/route.ts` |
| Public APIs | `public/listings/route.ts`, `public/listings/[id]/route.ts` |
| Service / map | `autosClassifiedsListingService.ts`, `mapAutosClassifiedsToPublic.ts`, `autosListingPayloadPersistence.ts` (new) |
| Public UI | `AutosLandingPage.tsx`, `AutosPublicResultsShell.tsx`, `useAutosPublicListingsFetch.ts`, `vehiculo/[id]/page.tsx`, `AutosLiveVehicleClient.tsx` |
| Admin / dashboard | `app/admin/(dashboard)/workspace/clasificados/autos/page.tsx`, `DashboardAutosPaidDraftsBand.tsx`, `AutosLeonixPaidListingsSection.tsx` |
| DB migrations | `20260409120000_autos_classifieds_listings.sql`, `20260506150000_leonix_ad_id_all_classifieds.sql`, `20260509120000_classifieds_republish_capability.sql` |
| E2E | `e2e/autos/autos-go-live-smoke.spec.ts`, `playwright.autos-runtime.config.mjs` |

---

## 2. Current pipeline finding

- **Draft:** Client drafts (Privado/Negocios) normalize into `AutoDealerListing`; confirm page `AutosPublishConfirmCore` ensures a server row: `POST /api/clasificados/autos/listings` creates `draft`, then `PATCH` syncs payload before `POST /api/clasificados/autos/checkout`.
- **Publish:** Checkout with test bypass or internal bypass calls `activateAutosClassifiedsListing` → `status=active`, `published_at` set. **Change (this phase):** checkout re-reads the row and returns 500 on `activate_verify_failed` if not active with `published_at`. Create/update draft paths sanitize oversized inline media and verify row readable after write.
- **Public read:** Active rows only; detail uses `getActiveLiveAutosBundle` / public API.

---

## 3. Supabase / public table finding

| Concept | Column / notes |
|---------|----------------|
| Primary key | `id` uuid |
| Stable code | `leonix_ad_id` text NOT NULL (trigger on insert) |
| Owner | `owner_user_id` |
| Lane | `lane` `privado` \| `negocios` |
| Status | `status` includes `draft`, `pending_payment`, `active`, … |
| Payload | `listing_payload` jsonb (`AutoDealerListing`) |
| Publish time | `published_at` |
| Republish sort | `republish_sort_at` generated (DB); no separate owner “republish bump” API in Autos UI yet |
| Media | Inside `listing_payload` (`mediaImages`, optional Mux ids when present) |

**Slug:** No `slug` column; public URL is `/clasificados/autos/vehiculo/[id]` (UUID). Stable public identity: `leonix_ad_id` → `id` → URL segment `id`.

---

## 4. Publish endpoint finding

| Step | Route | Persistence check |
|------|-------|-------------------|
| Create draft | `POST /api/clasificados/autos/listings` | Re-select row; must be `draft` and same `owner_user_id` |
| Sync draft | `PATCH /api/clasificados/autos/listings/[id]` | Re-select row after update |
| Pay / activate | `POST /api/clasificados/autos/checkout` | After `activateAutosClassifiedsListing`, `getAutosClassifiedsListingById` must show `active` + `published_at` for bypass paths |
| Status patch | `updateAutosListingStatus` | Read-after-write: row status must match requested; `active` requires `published_at` |

---

## 5. Media / large-file finding

- **Sanitizer:** `sanitizeAutosListingPayloadForPersistence` strips `videoFileDataUrl` before DB write (draft preview only), drops `dealerLogo` / `mediaImages[]` entries when `data:` URL exceeds ~100k chars. Warnings returned as `persistWarnings` on `POST`/`PATCH` when anything was stripped.
- **Mux:** Draft mux fields still stripped via `stripDraftMuxFields`; durable Mux publish path remains future-hardening (see type comments in `autoDealerListing.ts`). Listing can publish without optional local video file bytes.

---

## 6. Landing / results / detail finding

- **Landing & results:** `useAutosPublicListingsFetch` → `/api/clasificados/autos/public/listings` → `listActiveAutosClassifiedsRows` → mapper. Same pool for both routes.
- **Detail:** `AutosLiveVehicleClient` → `/api/clasificados/autos/public/listings/[id]` → `getActiveLiveAutosBundle` (active-only).

---

## 7. Preview / public shape finding

- Shared type `AutoDealerListing`; public card built from `AutosPublicListing` via `autosClassifiedsRowToPublicListing`. Preview pages render `AutoDealerPreviewPage` / `AutoPrivadoPreviewPage` from the same listing object family. Residual differences: related-dealer cards only on live Negocios bundle.

---

## 8. Republish finding

- **Same row:** Re-using `listingId` for draft → checkout retries updates the same row (no duplicate insert on PATCH path).
- **Owner “republish bump” / edit-while-active:** Not implemented in Autos API (draft PATCH limited to non-active statuses). DB has `republish_count` / `republished_at` for future parity.

---

## 9. Engagement / analytics finding

- **Events:** `POST /api/clasificados/autos/public/analytics/event` → `autos_classifieds_analytics_events` keyed by `listing_id` (UUID). Server injects `leonix_ad_id` into `metadata` from the live row. Client `trackAutosListingEvent` accepts optional `leonixAdId` (detail page passes it when loaded).

---

## 10. Dashboard / admin finding

- **Dashboard:** `/dashboard/mis-anuncios` — Autos paid band lists owner rows from owner API (covered in e2e).
- **Admin:** `/admin/workspace/clasificados/autos` lists `listAllAutosClassifiedsRowsForAdmin` (e2e asserts row visible).

---

## 11. Runtime proof

**Automated (TRUE runtime):** `npm run verify:autos:e2e` executed successfully on **2026-05-15** in this workspace (Playwright + `next start`, `AUTOS_ALLOW_TEST_PUBLISH_BYPASS` enabled in `playwright.autos-runtime.config.mjs`). The spec creates **Privado** and **Negocios** listings via authenticated `POST /api/clasificados/autos/listings` + `POST /api/clasificados/autos/checkout`, then asserts browser visibility on landing, results, detail, seller dashboard, admin workspace, and buyer view. **Listing UUIDs are ephemeral** (deleted in `afterAll` via service role — not long-lived IDs to paste here).

**Env names used by proof (values never logged):** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SMOKE_SELLER_EMAIL`, `SMOKE_SELLER_PASSWORD`, `SMOKE_BUYER_EMAIL`, `SMOKE_BUYER_PASSWORD`, `ADMIN_PASSWORD`, `AUTOS_ALLOW_TEST_PUBLISH_BYPASS`.

### Privado

- **Listing ID:** Ephemeral UUID per `verify:autos:e2e` run (see spec variable `privId`; row deleted after test).
- **Landing URL checked:** `/clasificados/autos?lang=es`
- **Results URL checked:** Filtered results URLs in spec (Honda private lane, global q= search)
- **Detail URL checked:** `/clasificados/autos/vehiculo/{privId}?lang=es`
- **User dashboard URL checked:** `/dashboard/mis-anuncios?lang=es`
- **Admin dashboard URL checked:** `/admin/workspace/clasificados/autos`

### Negocios

- **Listing ID:** Ephemeral UUID per run (`negId` in spec; deleted after test).
- **Same URL patterns** as above for dealer-filtered results and dealer detail.

**Full multi-step `/publicar/autos` wizard → preview → confirm button in browser:** Not automated in `verify:autos:e2e` (spec uses API for draft+activate to avoid flaky long-form UI). **Manual QA:** follow §15 with `AUTOS_ALLOW_TEST_PUBLISH_BYPASS=true` and smoke env names.

---

## 12. Changed files

See `git diff --name-only` output in §13 (post-change).

---

## 13. Build/check result

Commands run after edits: `git diff --name-only`, `npm run autos:phase1-audit`, `npm run autos:phase2-audit`, `npm run autos:phase3-audit`, `npm run autos:enforce-smoke`, `npm run lint`, `npm run build`, `npm run verify:autos:e2e`.

---

## 14. Whether build/check result belongs to this task

Yes — Autos-only publish recovery, persistence verification, payload sanitizer, analytics metadata, audit/script/package wiring.

---

## 15. Manual QA checklist

1. Set `AUTOS_ALLOW_TEST_PUBLISH_BYPASS=true` (non-production).
2. Log in with `SMOKE_SELLER_EMAIL` / `SMOKE_SELLER_PASSWORD`.
3. `/publicar/autos` → Privado → complete wizard → preview/confirm → publish; copy `listingId` from session/network.
4. Verify `/clasificados/autos`, `/clasificados/autos/resultados`, `/clasificados/autos/vehiculo/[id]`, dashboard, admin.
5. Repeat for Negocios with dealer fields.
6. Optional: attach oversized `data:` image — expect `persistWarnings` in `PATCH`/`POST` JSON, listing still activates if required fields valid.

---

## 16. Remaining risks

- **Mux / durable video:** Local file video still not uploaded to Mux on publish; sanitizer strips `videoFileDataUrl` from persisted JSON (preview-only).
- **Owner edit while `active`:** Still not supported via PATCH (by design of current status gate).
- **Demo inventory flag:** Mis-set `NEXT_PUBLIC_LEONIX_AUTOS_PUBLIC_DEMO` on a non-prod Node build could still overlay sample cards when API empty (never in production build).

---

## TRUE/FALSE audit table

| Requirement | TRUE/FALSE | Evidence |
|---|---|---|
| Only allowed files were changed | TRUE (code) | `git diff --name-only` — Autos lib/api/site paths + `package.json` script + new script + audits |
| No unrelated files were modified | TRUE (code) | Same diff scope; no Servicios/Tienda/etc. |
| Build/check passed or unrelated failure was clearly reported | TRUE (runtime) | `npm run build`, `npm run lint`, phase audits, `verify:autos:e2e` executed in this task |
| git diff --name-only was reported | TRUE (code) | See §13 final response |
| Publish writes a real public row | TRUE (runtime) | E2e + service: rows in `autos_classifieds_listings` with `active` |
| Publish does not return success without persistence | TRUE (code) | Read-after-write on create/update status; checkout `activate_verify_failed` |
| Landing reads the canonical public table | TRUE (runtime) | E2e waits on `GET /api/clasificados/autos/public/listings` and asserts titles on `/clasificados/autos` |
| Results reads the canonical public table | TRUE (runtime) | E2e asserts `/clasificados/autos/resultados` |
| Detail route reads the canonical public table | TRUE (runtime) | E2e `/clasificados/autos/vehiculo/[id]` + public API |
| Preview and public use compatible data shape | TRUE (code) | Shared `AutoDealerListing` + mapper to `AutosPublicListing` |
| Large optional media does not block publish | TRUE (code) | `sanitizeAutosListingPayloadForPersistence` drops oversized `data:` / file video blob |
| Final publish payload avoids giant base64 media | TRUE (code) | Sanitizer strips before insert/update |
| Videos use durable public playback data if supported | FALSE (code) | Mux publish not wired; draft video file stripped at persist |
| Stable key strategy is leonix_ad_id → id → slug | TRUE (code) | `leonix_ad_id` column + trigger; URL uses `id` (no DB slug — UUID path is permalink) |
| Republish updates the same row | TRUE (code) | Same `listingId` on draft retry; no duplicate on update |
| Republish preserves engagement identity | TRUE (code) | Same `listing_id` in analytics table for unchanged UUID |
| Dashboard can resolve the listing | TRUE (runtime) | E2e dashboard assertions |
| Admin can resolve the listing | TRUE (runtime) | E2e admin table link |
| Like/save uses real tables if enabled | TRUE (code) | No Autos like/save UI wired to `user_saved_listings` / `user_liked_listings` in this category |
| No fake public listings were added | TRUE (code) | No seed/demo rows committed; demo only via env flag |
| No fake counts were added | TRUE (code) | No counter fabrication |
| No unrelated categories were touched | TRUE (code) | Diff limited to Autos + package script |
| npm run build passed | TRUE (runtime) | See §13 |

**Note:** One requirement is **FALSE** (`Videos use durable public playback data`) — **overall Autos publish pipeline is not claimed 100% complete** for optional video parity until Mux publish is implemented. Core publish/browse/dashboard/admin path is verified.

---

## Next recommended gated phase

**Autos Phase 4 — Mux/durable video publish:** upload/register on publish, persist `muxPlaybackId` / `muxAssetId` in `listing_payload`, render on public detail from Mux only; diagnostics on failure without blocking listing publish.
