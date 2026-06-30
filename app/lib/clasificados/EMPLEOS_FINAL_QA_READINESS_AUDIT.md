# EMPLEOS FINAL QA READINESS TRUTH AUDIT — BRANDING + PUBLISH + ANALYTICS

## 1. Mission summary
Verify Empleos is ready for manual QA across the full En Venta/Varios doctrine: checkpoint → form → preview → volver a editar → publish → public detail → results → owner dashboard → admin → analytics. Confirm Leonix branding, truthful CTAs, real analytics or hidden metrics, Supabase table wiring, and no Stripe/fake-tool regressions.

## 2. Product decision summary
Public launch remains two paths only:
- **Paid job ad** — `$24.99 for 30 days`, Quick shell/form, Stripe deferred, QA publish allowed without fake paid status
- **Free job fair** — Feria shell/form, no payment, organizer-contact event output (Job Fair free)
- **Premium** — preserved internally, not a public launch card

## 3. Files inspected
- `app/(site)/publicar/empleos/EmpleosPublicarHubClient.tsx`
- `app/(site)/publicar/empleos/quick/EmpleoQuickApplicationClient.tsx`
- `app/(site)/publicar/empleos/feria/EmpleoFeriaApplicationClient.tsx`
- `app/(site)/publicar/empleos/shared/publish/buildEmpleosPublishEnvelope.ts`
- `app/(site)/publicar/empleos/shared/publish/empleosPaymentHandoff.ts`
- `app/(site)/publicar/empleos/shared/copy/empleosPublishSharedCopy.ts`
- `app/(site)/clasificados/empleos/quick-preview/EmpleoQuickPreviewClient.tsx`
- `app/(site)/clasificados/empleos/feria-preview/EmpleoFeriaPreviewClient.tsx`
- `app/(site)/clasificados/empleos/components/quickJob/EmpleoQuickDetailPage.tsx`
- `app/(site)/clasificados/empleos/components/jobFair/EmpleoJobFairDetailPage.tsx`
- `app/(site)/clasificados/empleos/EmpleosPublicLaneDetailClient.tsx`
- `app/(site)/clasificados/empleos/components/EmpleosJobResultCard.tsx`
- `app/(site)/clasificados/empleos/components/EmpleosClasificadosEngagementRow.tsx`
- `app/(site)/clasificados/empleos/lib/empleosCtaTracking.ts`
- `app/(site)/clasificados/empleos/lib/recordEmpleosGlobalAnalytics.ts`
- `app/(site)/clasificados/empleos/lib/empleosPublicListingsDbServer.ts`
- `app/api/clasificados/empleos/listings/route.ts`
- `app/api/clasificados/empleos/applications/route.ts`
- `app/(site)/dashboard/empleos/page.tsx`
- `app/(site)/dashboard/empleos/[listingId]/page.tsx`
- `app/admin/(dashboard)/workspace/clasificados/empleos/page.tsx`
- `e2e/empleos/manual-qa-sample-content.ts`

## 4. Files changed (this gate)
- `app/(site)/clasificados/empleos/EmpleosPublicLaneDetailClient.tsx`
- `app/(site)/clasificados/empleos/quick-preview/EmpleoQuickPreviewClient.tsx`
- `app/(site)/clasificados/empleos/feria-preview/EmpleoFeriaPreviewClient.tsx`
- `app/(site)/clasificados/empleos/components/jobFair/JobFairSecondaryDetails.tsx`
- `app/(site)/dashboard/empleos/[listingId]/page.tsx`
- `app/lib/clasificados/EMPLEOS_FINAL_QA_READINESS_AUDIT.md`
- `scripts/verify-empleos-final-qa-readiness.mjs`
- `package.json`

## 5. Route/flow map

| Area | Route/component | Current behavior | QA-ready behavior | PASS/FIXED/BLOCKED |
| ---- | --------------- | ---------------- | ----------------- | ------------------ |
| Checkpoint | `/clasificados/publicar/empleos`, `EmpleosPublicarHubClient` | Two Leonix cards: paid job ad + free job fair | Same | PASS |
| Paid form | `/publicar/empleos/quick`, `EmpleoQuickApplicationClient` | `$24.99 / 30 days`, open city/state/country, videoUrls, no Save | Same | PASS |
| Paid preview | `/clasificados/empleos/quick-preview`, `mapQuickDraftToShell` → `EmpleoQuickDetailPage` | Same shell as public detail | Same | PASS |
| Paid publish | `POST /api/clasificados/empleos/listings`, `upsertEmpleosListingFromEnvelope` | Auth required; upserts `empleos_public_listings`; QA publish without Stripe | Same | PASS |
| Paid public detail | `/clasificados/empleos/[slug]`, `EmpleosPublicLaneDetailClient` quick branch | Contact CTAs + optional real internal apply for live UUID rows | Same | PASS |
| Paid results | `EmpleosJobResultCard` | Title/company/pay/location/media CTA | Same | PASS |
| Fair form | `/publicar/empleos/feria`, `EmpleoFeriaApplicationClient` | Free copy, editable city, flyer, event fields, no Save | Same | PASS |
| Fair preview | `/clasificados/empleos/feria-preview`, `mapFeriaDraftToShell` → `EmpleoJobFairDetailPage` | Free badge, event layout | Same | PASS |
| Fair publish | Same listings API, lane `feria` | Free publish, no payment handoff | Same | PASS |
| Fair public detail | Feria branch of `EmpleosPublicLaneDetailClient` | Organizer contact; no internal job apply form | FIXED — apply form hidden for feria | FIXED |
| Fair results | `EmpleosJobResultCard` feria branch | Fair badge, date, free entry, `Ver feria` | Same | PASS |
| Owner dashboard | `/dashboard/empleos` | Lane truth, edit/manage/public links | Same | PASS |
| Owner manage | `/dashboard/empleos/[id]` | Status/actions; applications only for job ads | FIXED — fair manage explains organizer contact | FIXED |
| Admin queue | `/admin/workspace/clasificados/empleos` | Local job ad / Job fair / Preserved premium labels | Same | PASS |
| Analytics | `recordEmpleosGlobalAnalyticsEvent` → `/api/analytics/events` | Uses internal UUID `source_id` + Leonix display ID | Same | PASS |
| Reportar | Empleos public surfaces | Not rendered | Hidden (no fake report CTA) | PASS |

## 6. Branding result
PASS/FIXED. Launch-path surfaces use cream/ivory `#FAF7F2` / `#FFFCF7`, burgundy `#4A1F24` paid CTAs, green `#1F6B45` / `#2E7D4A` free/trust accents, gold/bronze `#8A5A18` / `#C9A85A` highlights, and charcoal `#2A2826` text. Preview no-draft fallback links were changed from generic blue to burgundy/gold. Job fair secondary detail checks use green instead of blue. Premium/hidden legacy components may still contain blue but are not public launch paths.

## 7. Paid job ad form result
PASS. Form header shows `$24.99 por 30 días / $24.99 for 30 days` with deferred checkout wording. City/state/country accept open input (no NorCal default). Address ZIP fields remain on optional address block. Contact, image/logo, and up to four external video URLs are separated. `saveDraftCta={null}`. Publish modal uses `Publish for QA (payment later)` copy from shared publish copy. No resume upload. Internal apply is only on public detail for live job ads, not on the form.

## 8. Free job fair form result
PASS. Header and banner say `Gratis / Free`. No `$24.99` or Stripe copy. Collects title, organizer, date, time, venue, city, state, flyer, modality, free entry, industry focus, description bullets, and contact phone/email/website/link. ZIP is not in the Feria draft schema (migration locked); city/state/venue carry location truth. `saveDraftCta={null}`. Publish modal confirms free posting.

## 9. Preview/edit/publish parity result
PASS. Both lanes flush session draft before preview (`flushEmpleosDraftToSession`), preview routes use the same mappers as publish (`mapQuickDraftToShell`, `mapFeriaDraftToShell`), and `LeonixPreviewPageShell` supports volver a editar via `markPublishFlowReturningToEdit`. Publish reuses the same envelope builders (`buildEmpleosPublishEnvelopeFromQuick/Feria`) as preview mapping sources. Images, flyer, and video URLs flow through draft → preview → envelope → `listing_snapshot`.

## 10. Supabase/table readiness result

| Table/view/helper | Used for | Required fields | Present in code? | Risk |
| ----------------- | -------- | --------------- | ---------------- | ---- |
| `empleos_public_listings` | Insert/update/list/detail/dashboard/admin | `id`, `slug`, `leonix_ad_id`, `lane`, `owner_user_id`, `lifecycle_status`, `title`, `company_name`, `city`, `state`, `postal_code`, `listing_snapshot`, counters | YES — `empleosPublicListingsDbServer.ts` | LOW |
| `upsertEmpleosListingFromEnvelope` | Publish/draft from envelope | UUID `listingId`, owner match, lane guard | YES | LOW |
| `POST /api/clasificados/empleos/listings` | Browser publish | Bearer auth + envelope | YES | LOW |
| `empleos_applications` | Real internal apply (job ads only) | `listing_id`, applicant fields | YES — applications API | LOW |
| `POST /api/analytics/events` | Views/clicks/likes/shares | `source_table`, `source_id` UUID | YES — global analytics client | LOW |
| `fetchEmpleosPublishedJobRecords` | Results/public | `lifecycle_status = published` | YES | LOW |

**internal UUID** for writes: publish upsert uses `crypto.randomUUID()` or existing listing UUID; analytics writes use `empleos_public_listings.id` as `source_id`.

**Leonix ID for display:** detail banner and admin queue show `leonix_ad_id`; analytics sends `canonical_ad_id` derived from Leonix Ad ID when present.

No missing table/column blocked publish in code review. **No migration created in this gate.**

## 11. Analytics truth result
The analytics truth table below documents every visible CTA and metric on launch surfaces.

| CTA / metric | Real action? | Analytics event | Hidden when missing? |
| ------------ | ------------ | --------------- | -------------------- |
| Like | YES | `listing_like` / `listing_unlike` via global pipeline | Only on live rows with engagement key |
| Share | YES | `listing_share` | Same |
| Save/Guardar | REMOVED | — | Not rendered |
| Profile view | YES | `listing_view` + legacy `public-view` counter | Live published rows only |
| Result card click | YES | `result_card_click` | Live UUID rows |
| Phone / WhatsApp / Email / Website | YES | `phone_click`, `whatsapp_click`, `email_click`, `website_click` | QuickJobCTACard hides empty contacts |
| Directions / maps | YES | `directions_click` | When location present |
| Internal apply | YES (job ads) | `apply_started`, `apply_submitted` | Live UUID job ads only; hidden on feria |
| Dashboard view/apply counts | YES when returned by DB | Column-backed | Shows zero/empty truthfully |
| Fake saves/messages/resumes | NONE | — | Not shown |

## 12. Report/admin truth result
PASS. **Reportar** is not exposed on Empleos public detail/results in this launch scope — no fake report button. Admin Empleos queue shows truthful lane labels, Leonix Ad ID, lifecycle status, real application health columns from API, and moderation actions. Job fair rows are not marked payment-required. Paid job ads are not marked paid unless payment exists (payment handoff remains `paymentState: "none"`).

## 13. Dashboard/admin truth result
PASS/FIXED. Owner list shows `Empleo local`, `Feria de empleo`, or preserved premium. Manage page for job ads shows real applications when present. Manage page for feria now explains organizer-contact model and hides applicant tooling. Public/results links only when `lifecycle_status === "published"`. Admin monetization summary uses existing read model without fake Stripe activation.

## 14. Mobile 390px result
PASS by static/layout review. Checkpoint uses stacked cards; forms use single-column inputs; preview/public shells use `overflow-x-hidden`, tappable `min-h-11` CTAs, and responsive grids.

## 15. Manual QA test data
Reference fixtures live in `e2e/empleos/manual-qa-sample-content.ts`:
- Quick marker: `MQA-CH-BAYVIEW` — restaurant job with images, logo, 3 contact methods, address ZIP `94103`
- Feria marker: `MQA-JF-NORCAL` — job fair with flyer, date/time, venue, organizer contact
- Use authenticated test account with Supabase configured locally or staging

Suggested quick manual fill (without seed script):
- **Paid job ad:** title `QA Barista Modesto`, business `Café Leonix`, city `Modesto`, state `CA`, country `Estados Unidos`, pay `$18–$20/hr`, one image URL, two YouTube video URLs, phone + email
- **Job fair:** title `Feria Comunitaria QA`, organizer `Leonix Workforce`, date `Sábado 12 Julio`, time `10 AM – 2 PM`, venue `Centro cívico`, city `Modesto`, state `CA`, flyer URL, free entry checked

## 16. Manual QA checklist
1. Open `/clasificados/publicar/empleos?lang=es` — confirm two cards, Leonix colors, no language selector in card.
2. Paid path → `/publicar/empleos/quick?lang=es` — confirm `$24.99`, blank city default, no Save.
3. Fill paid form, preview, volver a editar — confirm all fields/media/video URLs preserved.
4. Publish signed in — confirm success redirect to public detail or pending review per env.
5. Public detail — contact CTAs work; videos/images show; no Save; apply form only for job ad.
6. Results — card shows title/company/pay/location; open detail.
7. Dashboard `/dashboard/empleos` — row appears with correct lane; public link when published.
8. Manage job ad — applications section visible (empty or real).
9. Fair path → `/publicar/empleos/feria?lang=es` — confirm `Gratis`, no payment copy.
10. Fill fair, preview, publish — public detail shows free badge, organizer contact, **no** internal apply form.
11. Fair dashboard manage — organizer-contact note, no fake applicant inbox.
12. Admin queue — row visible with lane truth and Leonix Ad ID.
13. Repeat checkpoint + one form at 390px width.

## 17. Blockers/open questions
- Live Supabase auth/storage/publish still requires manual browser verification with real credentials.
- Feria draft has no ZIP field without a future migration; venue + city + state are the location truth.
- Stripe checkout remains deferred; `$24.99` is product copy only until next gate.
- Parallel in-tree Empleos global-location work (open city/country fields) is RELATED_ALLOWED and complements QA location testing.

## 18. READY FOR MANUAL QA: YES
YES. Static/code audit complete; verifiers and build passed. Live browser publish with Supabase credentials remains the documented human confirmation step.

## 19. READY TO COMMIT THIS GATE: YES
YES. `npm run verify:empleos-final-qa-readiness`, `npm run verify:empleos-two-path-reroute-preview`, `npm run verify:empleos-simplification-qa-alignment`, `npm run july1:free-clasificados-shell-audit`, and `npm run build` passed. No files staged, no commit, no push.

## PASS/FIXED/BLOCKED table

| Requirement | PASS/FIXED/BLOCKED | Evidence |
| ------------------------------------------------ | ------------------ | -------- |
| Empleos checkpoint has two public paths | PASS | `EmpleosPublicarHubClient` two-card grid |
| Paid job ad is $24.99 / 30 days | PASS | Checkpoint + quick form pricing copy |
| Job Fair is free | PASS | Checkpoint + feria form free copy |
| Premium/corporate lane is not public launch path | PASS | No premium card on checkpoint |
| Branding matches Leonix system | FIXED | Preview links + fair secondary checks |
| Paid job form is clean | PASS | Pricing, no Save, open location |
| Job Fair form is clean | PASS | Free copy, event fields, no Save |
| City accepts open input | PASS | Quick + feria editable city |
| State/ZIP are clear | PASS | Quick state/country + address ZIP; feria state |
| Paid job image/media persists | PASS | Draft session + envelope snapshot |
| Paid job videoUrls persist | PASS | Up to 4 external URLs in draft/envelope |
| Job Fair flyer/image persists if supported | PASS | `flyerImageUrl` in draft/envelope |
| Preview resembles public detail | PASS | Shared detail shells + mappers |
| Volver a editar preserves data | PASS | Session draft + lifecycle hook |
| Publish uses preview payload | PASS | Same envelope builders |
| Publish success is truthful | PASS | QA modal copy; no fake paid status |
| Public detail displays correct data | PASS | Lane shells + contact cards |
| Results card displays correct data | PASS | Job vs fair card branches |
| Owner dashboard sees listing | PASS | `empleos_public_listings` owner query |
| Admin sees listing | PASS | Admin listings API |
| Supabase table/view usage documented | PASS | Section 10 table |
| Internal UUID used for DB writes | PASS | Publish + analytics `source_id` |
| Leonix ID used for display | PASS | Detail banner + admin column |
| Visible CTAs work or hide | PASS | CTA tracking + conditional render |
| Analytics events are real where metrics show | PASS | Global analytics pipeline |
| Fake metrics hidden | PASS | No Save; fair manage copy |
| Reportar real or hidden/documented | PASS | Not rendered on Empleos launch surfaces |
| No Save/Guardar | PASS | Forms + engagement row |
| No Mux/direct upload | PASS | URL-only `EmpleosVideoDraftField`; no Mux/direct upload |
| No fake applicants/messages/resume tools | FIXED | Feria apply hidden; no fake applicants/messages/resume tools on launch surfaces |
| Job Fair not payment-blocked | PASS | Free publish handoff |
| Stripe not touched in this gate | PASS | No Stripe files changed |
| Mobile 390px clean | PASS | Responsive layouts |
| No unrelated categories edited | PASS | Empleos-only gate changes |
| Verifier passed | PASS | `npm run verify:empleos-final-qa-readiness` |
| Build passed | PASS | `npm run build` exit 0 |
