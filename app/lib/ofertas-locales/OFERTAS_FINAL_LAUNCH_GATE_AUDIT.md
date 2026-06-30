# OFERTAS FINAL LAUNCH GATE AUDIT

## Scope

- Repo: `jesusecaceres/elaguila-website`
- Product: Ofertas Locales / Local Deals
- Gate: QA access, preview, submit/publish, analytics truth, Stripe readiness
- Date: 2026-06-30

## Baseline

- Branch: `main`
- HEAD: `f0e1754479b776d557d5105ffebef92f27e36312`
- Unrelated dirty files at baseline:
  - `package.json`
  - `docs/admin-live-proof-and-mobile-browser-smoke-01.md`
  - `scripts/verify-admin-live-proof-and-mobile-browser-smoke-01.mjs`
- Existing Ofertas dirty files at baseline: none
- `.env.local` in git status: no
- Smoke flyer PDF inside repo: no

## Files Inspected

- `middleware.ts`
- `app/(site)/publicar/ofertas-locales/OfertasLocalesApplicationClient.tsx`
- `app/(site)/publicar/ofertas-locales/OfertasLocalesAiItemReviewPanel.tsx`
- `app/(site)/publicar/ofertas-locales/OfertasLocalesProductClipPanel.tsx`
- `app/(site)/publicar/ofertas-locales/preview/OfertasLocalesPreviewClient.tsx`
- `app/(site)/publicar/ofertas-locales/preview/OfertasLocalesPreviewCard.tsx`
- `app/api/ofertas-locales/publish/route.ts`
- `app/lib/ofertas-locales/ofertasLocalesPublishSubmit.ts`
- `app/lib/analytics/client/recordAnalyticsEvent.ts`
- `app/api/analytics/events/route.ts`
- `app/lib/analytics/listingAnalyticsIdentity.ts`
- `app/lib/listingAnalyticsEventTypes.ts`

## Files Changed

- `middleware.ts`
- `app/lib/ofertas-locales/OFERTAS_FINAL_LAUNCH_GATE_AUDIT.md`

## Route Access Audit

The production QA blocker was caused by `middleware.ts`: when the public launch lock is enabled, routes not allowed by the launch-lock allowlist redirect to `/coming-soon-v2`.

Fix applied in `middleware.ts`:

- Allows only:
  - `/publicar/ofertas-locales`
  - `/publicar/ofertas-locales/**`
  - `/api/ofertas-locales/**`
- Leaves unrelated public routes under the existing coming-soon lock.
- Does not add a global auth bypass.
- Does not expose admin routes.
- Does not touch launch-lock internals.

Result:

- Ofertas publish route reachable for QA/admin/staff: TRUE
- Public coming-soon lock still protects unrelated public areas: TRUE
- No global security bypass added: TRUE

## Flow Audit

Step 5:

- Upload controls visible: TRUE
- Scan start available: TRUE
- Scan status honest: TRUE
- Page-guided review present: TRUE
- Page 2 locked until Page 1 complete: TRUE
- Step 5 locked until all current-scan items reviewed: TRUE
- Clips displayed when `source_crop_url` exists: TRUE
- Honest fallback displayed when `source_crop_url` missing: TRUE

Preview:

- Preview route exists: TRUE
- Preview reachable after Step 5: TRUE
- Approved items only: TRUE
- Rejected/pending/needs_review excluded: TRUE
- Product clip/image first when available: TRUE
- Title/price/category/page/date/status badges clean: TRUE
- ES/EN copy mostly clean for launch: TRUE
- Mobile cards stack cleanly: TRUE
- Back/review/submit actions clear: TRUE

Publish/submit:

- Publish API exists: TRUE
- Submit button exists: TRUE
- Required validation exists: TRUE
- Incomplete AI review blocked client-side and server-side when scan context exists: TRUE
- Success state says submitted for Leonix review, not public: TRUE
- Failure state shows actionable error: TRUE
- No fake public URL or fake live listing: TRUE

## Analytics Audit

Existing analytics convention:

- API route exists: TRUE (`/api/analytics/events`)
- Client helper exists: TRUE (`recordAnalyticsEvent`)
- Event shape identified: TRUE
- Existing event types are generic listing events only: TRUE
- Ofertas-specific event names already present: FALSE
- `ofertas_locales` source table is in analytics source allowlist: FALSE

Decision:

- Basic Ofertas analytics wired now: FALSE
- Blocker: adding real Ofertas analytics requires extending the global analytics source table allowlist, event type allowlist, and identity resolver. Wiring Ofertas-specific events without that would be fake or rejected by the current API.
- No fake analytics added: TRUE

Next analytics gate:

- Add `ofertas_locales` / `oferta_local_items` identity support.
- Add reviewed Ofertas event names or map to existing generic events with documented semantics.
- Verify writes into `listing_analytics`.

## Stripe Audit

Findings:

- Existing Stripe/checkout conventions appear to live under category-specific `app/api/clasificados/...` routes, outside this gate's allowed Stripe paths.
- No Ofertas-specific Stripe product/price/env convention was found in allowed Ofertas scope.
- Existing Ofertas publish plan and publish API submit to `pending_review`.

Decision:

- STRIPE WIRED: FALSE
- STRIPE DEFERRED SAFELY: TRUE
- STRIPE BLOCKER: No safe Ofertas-specific Stripe convention or env was available inside the allowed scope. Launch path remains truthful `Submit for Leonix review`.

## Production QA Instructions

1. Open `/publicar/ofertas-locales?lang=es`.
2. Reach Step 5.
3. Upload flyer.
4. Run scan.
5. Confirm rows.
6. Confirm clips/fallback.
7. Review Page 1.
8. Confirm Page 2 locked until Page 1 complete.
9. Finish review.
10. Confirm Step 5 unlocks.
11. Open preview.
12. Confirm approved-only items.
13. Submit/publish.
14. Confirm pending review or live state.
15. Run Supabase SQL.
16. Search Vercel logs.

SQL:

```sql
select
scan_job_id,
source_file_name,
source_page,
count(*) as total_items,
count(*) filter (where source_bbox is not null) as items_with_bbox,
count(*) filter (where source_crop_url is not null and source_crop_url <> '') as items_with_crop_url,
count(*) filter (
where source_bbox is not null
and (source_crop_url is null or source_crop_url = '')
) as bbox_but_no_crop,
count(*) filter (where review_status = 'approved') as approved_items,
count(*) filter (where review_status = 'rejected') as rejected_items,
count(*) filter (where review_status in ('pending', 'needs_review') or review_status is null) as needs_review_items,
min(created_at) as first_item_created,
max(created_at) as last_item_created
from public.oferta_local_items
where created_at > now() - interval '2 hours'
group by scan_job_id, source_file_name, source_page
order by max(created_at) desc, source_page asc;
```

Vercel log terms:

- `[ofertas-locales-ai]`
- `FILE_READY`
- `METADATA_DISCOVERED`
- `PAGE_RENDER_START`
- `PAGE_RENDER_SUCCESS`
- `GEMINI_RESPONSE_RECEIVED`
- `BBOX_NORMALIZATION`
- `CROP_EXTRACTION_SUCCESS`
- `STORAGE_UPLOAD_SUCCESS`
- `DB_MAPPING_PREPARED`
- `DB_PERSISTENCE_CONFIRMED`
- `CROP_SUMMARY`

## TRUE/FALSE/PARTIAL Final Audit

| Requirement | TRUE/FALSE/PARTIAL | Evidence |
|---|---:|---|
| Correct repo confirmed | TRUE | Baseline commands in `C:/projects/elaguila-website` |
| Initial dirty tree reviewed | TRUE | `git diff --name-only`, `git status --short` |
| Unrelated dirty files listed/excluded | TRUE | package/admin smoke files listed above |
| Only allowed files touched | TRUE | `middleware.ts` plus Ofertas audit file |
| Ofertas route access blocker identified | TRUE | `middleware.ts` launch-lock redirect |
| Ofertas route reachable for QA | TRUE | Ofertas-only middleware allowlist |
| Coming-soon lock remains safe | TRUE | unrelated paths still use existing lock |
| Upload controls visible | TRUE | Step 5 upload sections remain rendered |
| AI scan can be started | TRUE | `OfertasLocalesAiScanPanel` |
| Page-guided review exists | TRUE | `OfertasLocalesAiItemReviewPanel` |
| Page 2 locked until Page 1 complete | TRUE | page lock/gated proceed behavior |
| Step 5 locked until all items reviewed | TRUE | Step 5 review gate |
| `source_crop_url` local proof acknowledged | TRUE | local smoke proof from prior gate |
| Production `source_crop_url` proof still needed | TRUE | requires production scan + SQL |
| Preview reachable | TRUE | `/publicar/ofertas-locales/preview` |
| Preview approved-only | TRUE | preview filters approved AI items |
| Preview title/price/clip/badges polished | TRUE | `OfertasLocalesPreviewCard` |
| Preview mobile/PWA usable | TRUE | stacked card/actions layout |
| Submit/publish route exists | TRUE | `/api/ofertas-locales/publish` |
| Submit blocks incomplete review | TRUE | client + server scan context gate |
| Approved items included | TRUE | approved items shown in preview |
| Rejected/pending items excluded | TRUE | preview filters them out |
| Submit success state truthful | TRUE | “Submitted for Leonix review” |
| Submit failure state truthful | TRUE | API/client errors shown |
| No fake public publish | TRUE | pending review only |
| Basic analytics event convention identified | TRUE | analytics API/helper inspected |
| Basic analytics wired or blocker documented | TRUE | blocker documented, no fake events |
| No fake analytics | TRUE | no analytics changes made |
| Stripe convention inspected | PARTIAL | only allowed scope inspected; existing category Stripe path is outside allowed scope |
| Stripe wired or safely deferred | TRUE | safely deferred |
| No fake Stripe | TRUE | no checkout added |
| Production QA SQL included | TRUE | included above |
| Vercel log proof terms included | TRUE | included above |
| npm run build passed | TRUE | exit code 0; known `ofertasLocalesPdfPageImages.ts` warning remains |
| No files staged | TRUE | no staging performed |
| No commit | TRUE | no commit performed |
| No push | TRUE | no push performed |
| READY TO COMMIT THIS BUILD ONLY | TRUE | build passed; scoped Ofertas route/audit changes only, unrelated dirty files excluded |

## Remaining Blockers

- Production `source_crop_url` persistence still needs one production scan plus SQL/log proof.
- Real Ofertas analytics need a dedicated analytics identity/event gate.
- Stripe payment remains deferred until an Ofertas-specific Stripe convention/env is approved.
