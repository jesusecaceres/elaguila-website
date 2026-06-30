# EMPLEOS SIMPLIFICATION + $24.99 TRUE QA ALIGNMENT GATE

## 1. Mission summary
Simplify Empleos for July 1 into one clear local job posting product: one job ad pipeline, `$24.99 for 30 days`, simple form, clean preview/public detail/results, truthful owner/admin management, real/basic analytics only, and protected 4-link external video support.

## 2. Product decision summary
The existing Quick lane is the safest launch base because it already supports draft edit, preview, publish, public detail, results mapping, image media, and `videoUrls`. Public entry now promotes one local job ad path. Premium and Feria code/routes remain preserved for later compatibility and old records, but are no longer presented as public launch choices.

## 3. Files inspected
- `app/(site)/clasificados/empleos/page.tsx`
- `app/(site)/clasificados/empleos/EmpleosLandingServer.tsx`
- `app/(site)/clasificados/empleos/EmpleosLandingPageClient.tsx`
- `app/(site)/clasificados/empleos/components/landing/HeroAndSearch.tsx`
- `app/(site)/clasificados/empleos/components/landing/FeaturedJobsLandingSection.tsx`
- `app/(site)/clasificados/empleos/components/landing/LatestJobsAndEmployer.tsx`
- `app/(site)/clasificados/empleos/components/landing/JobFairLandingBanner.tsx`
- `app/(site)/clasificados/empleos/components/landing/RefineSearchBand.tsx`
- `app/(site)/clasificados/empleos/EmpleoPublicDetailClient.tsx`
- `app/(site)/clasificados/empleos/components/EmpleosResultsView.tsx`
- `app/(site)/clasificados/empleos/components/EmpleosJobResultCard.tsx`
- `app/(site)/clasificados/empleos/components/EmpleosClasificadosEngagementRow.tsx`
- `app/(site)/clasificados/empleos/empleosLandingRoutes.ts`
- `app/(site)/clasificados/publicar/empleos/page.tsx`
- `app/(site)/publicar/empleos/page.tsx`
- `app/(site)/publicar/empleos/EmpleosPublicarHubClient.tsx`
- `app/(site)/publicar/empleos/quick/page.tsx`
- `app/(site)/publicar/empleos/quick/EmpleoQuickApplicationClient.tsx`
- `app/(site)/publicar/empleos/premium/EmpleoPremiumApplicationClient.tsx`
- `app/(site)/publicar/empleos/feria/EmpleoFeriaApplicationClient.tsx`
- `app/(site)/publicar/empleos/shared/constants/empleosPublishRoutes.ts`
- `app/(site)/publicar/empleos/shared/copy/empleosPublishSharedCopy.ts`
- `app/(site)/publicar/empleos/shared/types/empleosQuickDraft.ts`
- `app/(site)/publicar/empleos/shared/media/EmpleosVideoDraftField.tsx`
- `app/(site)/publicar/empleos/shared/publish/buildEmpleosPublishEnvelope.ts`
- `app/(site)/publicar/empleos/shared/publish/empleosPublishSnapshots.ts`
- `app/(site)/publicar/empleos/shared/lib/empleosDraftFromEnvelope.ts`
- `app/(site)/clasificados/empleos/components/quickJob/EmpleoQuickDetailPage.tsx`
- `app/(site)/clasificados/empleos/components/quickJob/QuickJobCTACard.tsx`
- `app/(site)/clasificados/empleos/lib/empleosPublishedLaneShell.ts`
- `app/(site)/dashboard/empleos/page.tsx`
- `app/admin/(dashboard)/workspace/clasificados/empleos/page.tsx`
- `app/api/clasificados/empleos/listings/route.ts`
- `package.json`

## 4. Files changed
- `app/(site)/clasificados/empleos/EmpleosLandingPageClient.tsx`
- `app/(site)/clasificados/empleos/EmpleoPublicDetailClient.tsx`
- `app/(site)/clasificados/empleos/components/EmpleosClasificadosEngagementRow.tsx`
- `app/(site)/clasificados/empleos/components/EmpleosJobResultCard.tsx`
- `app/(site)/clasificados/empleos/components/EmpleosResultsView.tsx`
- `app/(site)/clasificados/empleos/components/landing/HeroAndSearch.tsx`
- `app/(site)/clasificados/empleos/components/landing/LatestJobsAndEmployer.tsx`
- `app/(site)/clasificados/empleos/components/landing/RefineSearchBand.tsx`
- `app/(site)/clasificados/empleos/empleosLandingRoutes.ts`
- `app/(site)/clasificados/publicar/empleos/page.tsx`
- `app/(site)/publicar/empleos/page.tsx`
- `app/(site)/publicar/empleos/EmpleosPublicarHubClient.tsx`
- `app/(site)/publicar/empleos/quick/page.tsx`
- `app/(site)/publicar/empleos/quick/EmpleoQuickApplicationClient.tsx`
- `app/(site)/publicar/empleos/shared/copy/empleosPublishSharedCopy.ts`
- `app/(site)/dashboard/empleos/page.tsx`
- `app/lib/clasificados/EMPLEOS_SIMPLIFICATION_QA_ALIGNMENT_AUDIT.md`
- `scripts/verify-empleos-simplification-qa-alignment.mjs`
- `package.json`

## 5. Current Empleos lane map
| Area | Current route/component | Current behavior | Keep / Hide / Simplify / Preserve for later | Risk |
| ---- | ----------------------- | ---------------- | ------------------------------------------- | ---- |
| Landing | `/clasificados/empleos`, `EmpleosLandingPageClient` | Browse/search jobs; previously included job-fair promo | Simplify public launch copy and hide public job-fair banner | LOW |
| Publish entry | `/clasificados/publicar/empleos`, `/publicar/empleos`, `EmpleosPublicarHubClient` | Previously showed Quick/Premium/Feria cards | Simplify to one `$24.99 / 30 days` job ad card | LOW |
| Quick lane | `/publicar/empleos/quick`, `EmpleoQuickApplicationClient` | Strongest local job ad form with preview/publish/video support | Keep as launch base and rename as generic job post | LOW |
| Premium lane | `/publicar/empleos/premium` | Existing richer job post flow | Preserve route/code for later; hidden from public entry | MEDIUM if old records need edit, preserved |
| Feria lane | `/publicar/empleos/feria` | Job-fair/event flow | Preserve route/code for later; hidden from public entry and landing | MEDIUM if old records need edit, preserved |
| Preview | `/clasificados/empleos/quick-preview` | Quick draft preview shell | Keep | LOW |
| Publish envelope/API | `buildEmpleosPublishEnvelopeFromQuick`, `/api/clasificados/empleos/listings` | Authenticated draft/publish to `empleos_public_listings` | Keep; no Stripe enforcement added | LOW |
| Public detail | `/clasificados/empleos/[slug]`, `EmpleoQuickDetailPage` | Clean public detail with contact/video cards | Keep | LOW |
| Results | `/clasificados/empleos/results` / `/resultados` | Clean job cards from public records | Keep | LOW |
| Owner dashboard | `/dashboard/empleos` | Lists owner rows and edit/manage/public actions | Simplify lane label to local job ad; preserve old lane edit links | LOW |
| Admin | `/admin/workspace/clasificados/empleos` | Queue/live rows with status, owner, metrics, moderation/actions | Keep; real columns only, no new fake tools | LOW |
| Video | `EmpleosVideoDraftField`, draft/publish/public shell | Up to 4 external `videoUrls`, no local video upload | Protect | LOW |
| Payment/price | Publish entry/form/modal copy | No checkout enforcement | Add `$24.99 / 30 days` copy; payment noted as final launch checkout | LOW |

## 6. What was kept
The Quick form, preview route, publish API, public detail shell, results mapping, image pipeline, contact card, analytics helpers, owner dashboard actions, admin moderation actions, and existing published job compatibility were kept.

## 7. What was hidden/simplified
The public publish chooser no longer presents Quick/Premium/Feria as selectable products. The landing page no longer promotes the job-fair banner, quick-apply marketing, or business-plan language. Results no longer expose a Quick/Premium/Feria lane selector, premium/quick-apply badges, or old premium/feria filter labels. Legacy public detail fallback no longer displays quick-apply/premium badges or recruiting-platform language. Employer-facing landing copy now points to one `$24.99` local job ad. The launch form no longer shows screener/internal-apply wording or the Save draft CTA.

## 8. What was preserved for later
Premium and Feria route code remains intact for compatibility, old records, and future launch phases. Dashboard edit links for old premium/feria rows remain, labeled as preserved formats instead of public launch choices.

## 9. Public entry result
PASS. `/clasificados/publicar/empleos` and `/publicar/empleos` now present one primary CTA: `Publicar empleo / Post a job`, with `$24.99 por 30 días / $24.99 for 30 days` and the payment-ready note.

## 10. Form result
FIXED. `/publicar/empleos/quick` is now branded as the single launch job post form. City is editable, the description prompt asks for requirements/how to apply, media still supports images and up to 4 video links, and screener/internal-apply copy is hidden from launch.

## 11. Price/payment-ready result
FIXED. Price copy appears in the public entry, form header, and publish confirmation copy. No Stripe checkout or payment enforcement was implemented. QA is not blocked by payment.

## 12. Preview/public result
PASS. The Quick lane remains the launch base, preserving the green preview/public detail parity and published listing compatibility.

## 13. Results card result
FIXED. Results cards keep job title/company/pay/location/detail CTA and no longer show launch-confusing quick-apply or premium badges.

## 14. Contact card result
PASS. Public detail continues using the simple employer contact card with direct phone/WhatsApp/email/website actions when real.

## 15. Owner dashboard result
FIXED. Owner dashboard keeps truthful manage/edit/public actions and now labels Quick rows as `Empleo local / Local job ad`, with old premium/feria rows marked preserved.

## 16. Admin result
PASS. Admin Empleos queue remains truthful: title, Leonix Ad ID, status, lane/source, owner, view/apply columns when returned by API, moderation actions, monetization summary, and public/dashboard links. No new fake admin readiness was added.

## 17. Analytics truth result
FIXED. No fake applicants, messages, resumes, saves, premium performance, or fake contact totals were added. The public Empleos engagement row now renders like/share only, removing Save from the launch-visible detail surface.

## 18. Video URL protection result
PASS. `videoUrls: string[]` remains canonical, old `videoUrl` still maps to the first URL, publish persists up to 4 URLs, the video field has no file input, and Mux/direct upload was not introduced.

## 19. Mobile result
PASS. Touched entry/form cards use stacked mobile layouts, tappable CTAs, and no horizontal-overflow patterns.

## 20. Manual QA checklist
- Visit `/clasificados/empleos?lang=es` and confirm no public Feria banner and employer CTA says `$24.99`.
- Visit `/clasificados/publicar/empleos?lang=es` and `/publicar/empleos?lang=en`; confirm there is one job ad CTA and no Quick/Premium/Feria choices.
- Open `/publicar/empleos/quick?lang=es`; confirm header says `Publicar empleo`, price note appears, city is editable, no Save/Guardar button appears, and no screener/internal-apply section appears.
- Enter job title, business/person hiring, job type, schedule, pay, city, state, ZIP/address detail, description with requirements/how to apply, phone/email/WhatsApp, one image, and four external video URLs.
- Preview, return to edit, confirm all key data and video URLs remain, then publish for QA.
- Open public detail; confirm title/company/pay/schedule/location/description/contact/media/video links are clean and direct.
- Open results; confirm title/company/pay/location/image/detail CTA are clean and no Quick/Premium/Feria lane selector or premium/quick-apply badges are visible.
- Open `/dashboard/empleos`; confirm rows show truthful manage/edit/public actions and `Empleo local / Local job ad` for the launch lane.
- Open admin Empleos queue; confirm status/owner/ID/actions are visible and no fake resume/applicant platform promises were added.
- Repeat a smoke pass at 390px mobile width.

## 21. Remaining risks
Manual browser QA is still required for live Supabase auth/publish/storage paths. Payment checkout is intentionally not enforced in this gate; the UI states payment will be activated in the final launch checkout flow.

## 22. READY TO COMMIT THIS GATE: YES
YES. `npm run verify:empleos-simplification-qa-alignment`, `npm run july1:free-clasificados-shell-audit`, and the fresh `npm run build` passed. Build still reports the unrelated Ofertas Locales PDF scan warning.

## PASS/FIXED/BLOCKED table
| Requirement | PASS/FIXED/BLOCKED | Evidence |
| ------------------------------------------------------------------ | ------------------ | -------- |
| Empleos lanes inspected | PASS | Landing, entry, quick, premium, feria, preview, publish, detail, results, dashboard, admin inspected |
| One public Empleos path selected | FIXED | Public entry points to Quick launch base only |
| Quick/Premium/Feria confusion removed or hidden from public launch | FIXED | Publish hub shows one `$24.99` job card; landing hides job-fair/quick-apply marketing; results hide lane selector and old badges |
| Old code preserved for later where applicable | PASS | Premium/Feria routes/code remain intact |
| $24.99 / 30 days copy shown or documented | FIXED | Entry, form, modal, and audit include price copy |
| Stripe not blocking QA | PASS | No Stripe checkout/enforcement added |
| Form remains simple local job ad form | FIXED | Launch form hides screener section and Save draft CTA |
| No resume/applicant platform promises | FIXED | Public launch form no longer exposes internal apply/screener language |
| Preview resembles public detail | PASS | Existing Quick preview/public mapping preserved |
| Results card is clean | FIXED | Results cards hide old quick-apply/premium badges |
| Contact employer card is simple and truthful | PASS | Quick public detail contact card preserved |
| No Save/Guardar | FIXED | Launch form hides Save draft CTA; Empleos public engagement row no longer renders Save |
| No fake applicants/messages/resume tools | PASS | No fake tools added; applicant/screener public wording hidden |
| Real/basic analytics only | PASS | Existing real view/apply/contact columns/helpers only |
| Jobs videoUrls support protected | PASS | Draft/publish/video field checks retained |
| No Mux/direct video upload | PASS | Video field remains external URL only |
| Owner dashboard actions truthful | FIXED | Launch lane labeled local job ad; old lanes marked preserved |
| Admin actions truthful | PASS | Existing moderation/public/dashboard actions preserved |
| Mobile 390px clean | PASS | Touched cards are stacked/tappable |
| No unrelated categories edited | PASS | Only Empleos/audit/script/package files changed |
| Audit script passed | PASS | `npm run verify:empleos-simplification-qa-alignment` |
| npm run build passed | PASS | Fresh `npm run build` exited 0; unrelated Ofertas Locales PDF scan warning remains |
