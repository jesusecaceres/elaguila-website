# EMPLEOS TWO-PATH REROUTE + PREVIEW PERFECTION GATE

## 1. Mission summary
Finalize Empleos before Stripe with a clean public checkpoint that offers two launch paths: a paid job ad and a free job fair. Polish the forms, preview/public output, owner dashboard, and admin lane truth without touching Stripe, migrations, or unrelated categories.

## 2. Product decision summary
The final public model is:

- paid job ad: `$24.99 for 30 days`, one local job ad, simplified Quick shell/form, later Stripe gate
- free job fair: free job fair/community hiring event, existing Feria shell/form, no Stripe/payment requirement
- premium preserved for later: route/code remain available internally but are not promoted as a public launch card

## 3. Files inspected
- `app/(site)/publicar/empleos/EmpleosPublicarHubClient.tsx`
- `app/(site)/publicar/empleos/quick/EmpleoQuickApplicationClient.tsx`
- `app/(site)/publicar/empleos/feria/EmpleoFeriaApplicationClient.tsx`
- `app/(site)/publicar/empleos/shared/constants/empleosPublishRoutes.ts`
- `app/(site)/publicar/empleos/shared/types/empleosQuickDraft.ts`
- `app/(site)/publicar/empleos/shared/types/empleosFeriaDraft.ts`
- `app/(site)/publicar/empleos/shared/media/EmpleosVideoDraftField.tsx`
- `app/(site)/publicar/empleos/shared/publish/buildEmpleosPublishEnvelope.ts`
- `app/(site)/clasificados/empleos/quick-preview/EmpleoQuickPreviewClient.tsx`
- `app/(site)/clasificados/empleos/feria-preview/EmpleoFeriaPreviewClient.tsx`
- `app/(site)/clasificados/empleos/components/quickJob/EmpleoQuickDetailPage.tsx`
- `app/(site)/clasificados/empleos/components/jobFair/EmpleoJobFairDetailPage.tsx`
- `app/(site)/clasificados/empleos/components/jobFair/JobFairInfoSection.tsx`
- `app/(site)/clasificados/empleos/components/jobFair/JobFairDetailsCard.tsx`
- `app/(site)/clasificados/empleos/components/EmpleosJobResultCard.tsx`
- `app/(site)/clasificados/empleos/components/EmpleosResultsView.tsx`
- `app/(site)/clasificados/empleos/EmpleosPublicLaneDetailClient.tsx`
- `app/(site)/dashboard/empleos/page.tsx`
- `app/admin/(dashboard)/workspace/clasificados/empleos/page.tsx`
- `scripts/verify-empleos-simplification-qa-alignment.mjs`
- `package.json`

## 4. Files changed
- `app/(site)/publicar/empleos/EmpleosPublicarHubClient.tsx`
- `app/(site)/publicar/empleos/feria/EmpleoFeriaApplicationClient.tsx`
- `app/(site)/publicar/empleos/shared/types/empleosQuickDraft.ts`
- `app/(site)/publicar/empleos/shared/types/empleosFeriaDraft.ts`
- `app/(site)/clasificados/empleos/components/jobFair/EmpleoJobFairDetailPage.tsx`
- `app/(site)/clasificados/empleos/components/jobFair/JobFairInfoSection.tsx`
- `app/(site)/clasificados/empleos/components/jobFair/JobFairDetailsCard.tsx`
- `app/(site)/clasificados/empleos/components/EmpleosJobResultCard.tsx`
- `app/(site)/dashboard/empleos/page.tsx`
- `app/admin/(dashboard)/workspace/clasificados/empleos/page.tsx`
- `app/lib/clasificados/EMPLEOS_TWO_PATH_REROUTE_PREVIEW_AUDIT.md`
- `scripts/verify-empleos-two-path-reroute-preview.mjs`
- `scripts/verify-empleos-simplification-qa-alignment.mjs`
- `package.json`

## 5. Current route map
| Area | Route/component | Current behavior | Required final behavior | Risk |
| ---- | --------------- | ---------------- | ----------------------- | ---- |
| Public checkpoint | `/clasificados/publicar/empleos`, `/publicar/empleos`, `EmpleosPublicarHubClient` | Two-card Leonix product choice after this gate | Paid job ad + free job fair only; no card-level language selector | LOW |
| Paid job ad form | `/publicar/empleos/quick`, `EmpleoQuickApplicationClient` | Simplified paid job ad shell with `$24.99 / 30 days` and videoUrls | Keep clean job ad form; Stripe deferred | LOW |
| Job fair form | `/publicar/empleos/feria`, `EmpleoFeriaApplicationClient` | Free event/fair application shell | Free job fair; no payment language; no Save CTA | LOW |
| Paid preview | `/clasificados/empleos/quick-preview` | Handoff preview maps draft into public job detail shell | Preserve preview/public parity, images, videos, contact | LOW |
| Job fair preview | `/clasificados/empleos/feria-preview` | Handoff preview maps draft into job fair detail shell | Free badge, event title/date/location/organizer/contact | LOW |
| Public detail | `/clasificados/empleos/[slug]`, `EmpleosPublicLaneDetailClient` | Lane-based shell for quick/premium/feria records | Paid job ad and fair shells remain distinct | LOW |
| Results | `EmpleosResultsView`, `EmpleosJobResultCard` | Shared result card | Feria rows display as fairs with date/free/event CTA | MEDIUM |
| Owner dashboard | `/dashboard/empleos` | Owner rows and truthful actions | Quick = local job ad; Feria = job fair; Premium preserved | LOW |
| Admin queue | `/admin/workspace/clasificados/empleos` | Queue/live rows with raw lane values | Human lane truth; no fake payment/applicant features | LOW |
| Video | `EmpleosVideoDraftField`, draft/publish mapper | Up to four external `videoUrls` | Protect external URL-only contract | LOW |
| Stripe | No checkout in this gate | Deferred | No job fair payment requirement; paid job ad awaits future Stripe | LOW |

## 6. Final two-path checkpoint result
FIXED. The checkpoint now shows exactly two launch choices: `Publicar empleo / Post a job` with `$24.99 por 30 días / $24.99 for 30 days`, and `Publicar feria de empleo / Post a job fair` marked `Gratis / Free`. The card-level language selector was removed. The paid card routes to `/publicar/empleos/quick?lang=...`; the free card routes to `/publicar/empleos/feria?lang=...`.

## 7. Paid job ad form result
PASS/FIXED. The paid job ad form keeps `$24.99 / 30 days`, explains payment will activate in the final launch checkout, keeps image/logo/video sections separate, keeps `videoUrls` up to four external links, hides Save draft, and now starts new drafts with a blank city rather than the internal NorCal filter label.

## 8. Free job fair form result
FIXED. The Feria form now says `Publicar feria de empleo / Post a job fair`, includes a free publication note, uses editable city, removes the rendered Save draft CTA, and uses free job-fair-specific final review and confirmation modal copy. It focuses on event title, organizer, date/time, venue, city/state, flyer, description/details, and real organizer contact. No ZIP field was added because the existing Feria draft schema does not support it and migrations are locked.

## 9. Preview result
FIXED. Paid job ad preview remains aligned with the public job detail shell and preserves images, contact, and video links. Job fair preview uses the existing fair detail shell with event title, date/time/location, organizer, flyer, details, contact actions, and a natural free badge.

## 10. Public detail/result result
FIXED. Paid job ad public detail/results stay free of Quick/Premium clutter and Save. Job fair detail reads as a free community hiring event. Results now recognize `publicationLane === "feria"` and show organizer, date/time, free-entry/fair language, and `Ver feria / View fair` instead of a generic paid job CTA.

## 11. Dashboard/admin result
FIXED. Owner dashboard labels `quick` as `Empleo local / Local job ad`, `feria` as `Feria de empleo / Job fair`, and `premium` as preserved. Admin queue now displays `Local job ad`, `Job fair`, or `Preserved premium` while retaining the raw lane underneath. No fake applicant, message, resume, analytics, or payment status was added.

## 12. Stripe deferral result
PASS. Stripe deferred to next gate. No checkout session, payment intent, payment enforcement, Stripe file, or migration was added. Paid job ad payment remains a future checkout requirement.

## 13. Job fair no-payment result
PASS. Free job fair has no Stripe/payment requirement. Its public checkpoint, form header, final step, and publish modal all say free/no payment.

## 14. videoUrls protection result
PASS. Jobs `videoUrls` protection remains: `videoUrls: string[]`, old `videoUrl` maps to the first URL, publish envelope still slices to four, and the video field remains external URL only.

## 15. No Save/Guardar confirmation
PASS. Public Empleos detail still has no Save button, paid job ad form renders `saveDraftCta={null}`, and Feria now also renders `saveDraftCta={null}`.

## 16. Mobile 390px result
PASS by static/layout review. The checkpoint uses stacked mobile cards with full-width tappable CTAs, `overflow-x-hidden`, compact spacing, and responsive grids that collapse before 390px.

## 17. Manual QA checklist
- Visit `/clasificados/publicar/empleos?lang=es`; confirm exactly two cards, no embedded language selector, burgundy paid CTA, green free CTA, and trust row.
- Tap `Publicar empleo`; confirm route is `/publicar/empleos/quick?lang=es` and the form shows `$24.99 por 30 días`.
- Tap `Publicar feria gratis`; confirm route is `/publicar/empleos/feria?lang=es` and the form says `Gratis`.
- On `/publicar/empleos/quick?lang=es`, confirm city starts blank for a fresh draft, state/ZIP/contact/media fields are clear, video allows up to four external URLs, and no Save/Guardar button appears.
- On `/publicar/empleos/feria?lang=es`, fill event title, organizer, date, time, venue, city, state, flyer, description/details, and contact; confirm no payment or Save CTA appears.
- Preview paid job ad; confirm it resembles public detail, includes job title/company/pay/location/contact/images/videos, and no Save/fake applicant tools.
- Preview job fair; confirm flyer, title, date/time/location, organizer, free badge, readable details, and truthful organizer contact.
- Inspect public Empleos results; confirm paid rows read as jobs and fair rows read as fairs/events.
- Inspect `/dashboard/empleos`; confirm local job ad/job fair/preserved premium lane labels and truthful actions.
- Inspect admin Empleos queue; confirm lane truth and no fake paid status for job fair.
- Repeat checkpoint and both forms at 390px.

## 18. Remaining risks
Manual browser QA with live auth/storage/publish is still required. The Feria draft does not include ZIP because this gate is locked against migrations and broader schema expansion. Payment checkout is intentionally deferred, so production payment activation remains a later gate.

## 19. READY TO COMMIT THIS GATE: NO
NO. Validation is pending at the time this audit was created.

## PASS/FIXED/BLOCKED table
| Requirement | PASS/FIXED/BLOCKED | Evidence |
| ------------------------------------------- | ------------------ | -------- |
| Empleos checkpoint inspected | PASS | `EmpleosPublicarHubClient` inspected and changed |
| Card-level language selector removed | FIXED | `langToggle`, English/Español checkpoint control removed |
| Checkpoint uses Leonix brand colors | FIXED | Burgundy paid CTA, green fair CTA, ivory/warm card shell |
| Paid job ad card exists | FIXED | `Publicar empleo / Post a job` card |
| Paid job ad says $24.99 / 30 days | FIXED | Card and paid form include `$24.99` copy |
| Free job fair card exists | FIXED | `Publicar feria de empleo / Post a job fair` card |
| Job fair is marked free | FIXED | `Gratis / Free` badge and free form copy |
| Quick/Premium/Feria confusion is not public | FIXED | No three-choice chooser, no Premium public card |
| Premium remains preserved for later | PASS | Premium route/code untouched; dashboard/admin label preserved |
| Paid job ad routes to simplified form | PASS | Card href uses `EMPLEOS_PUBLISH_ROUTES.quick` |
| Job fair routes to feria/job fair form | PASS | Card href uses `EMPLEOS_PUBLISH_ROUTES.feria` |
| Paid job ad form cleaned | FIXED | Blank city default, no Save, price/payment-deferred copy retained |
| Job fair form cleaned | FIXED | Free header/final/modal copy, editable city, no Save |
| Preview inspected and polished | FIXED | Feria preview gets free badge through fair detail shell |
| Public detail/results inspected | FIXED | Fair result rows display event/free language |
| Dashboard/admin truth inspected | FIXED | Owner/admin lane labels updated |
| Stripe is deferred to next gate | PASS | No Stripe/checkout/payment enforcement changed |
| Job fair has no Stripe/payment requirement | PASS | Feria form/modal says free/no payment |
| Jobs videoUrls protected | PASS | `videoUrls` draft/envelope/video field checks retained |
| No Mux/direct upload introduced | PASS | Video field remains URL-only |
| No Save/Guardar reintroduced | PASS | Empleos public detail and paid/fair forms render no Save CTA |
| No fake applicants/messages/resume tools | PASS | No new fake tools or promises added |
| Mobile 390px clean | PASS | Static responsive review of cards/forms |
| No unrelated categories edited | PASS | Empleos/audit/scripts/package only |
| Audit script passed | BLOCKED | Pending validation |
| npm run build passed | BLOCKED | Pending validation |
