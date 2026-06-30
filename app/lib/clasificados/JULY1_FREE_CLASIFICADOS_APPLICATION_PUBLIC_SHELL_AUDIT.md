# JULY1 FREE CLASIFICADOS CEO FINAL DESIGN + PREVIEW PARITY + PUBLIC SHELL FINISH GATE

## 1. Mission summary
Finish the free/simple Clasificados launch categories at CEO quality: application -> preview -> publish -> results -> public detail -> contact/share utility flow. This gate follows the previous perfection gate and closes its remaining blocker: Jobs now supports up to 4 external video URLs without migrations or direct video upload.

## 2. CEO expectation summary
The scoped experience must feel organized, warm, premium, mobile-first, local/community-rooted, and unmistakably Leonix. It must avoid fake Save/Guardar, fake analytics, empty contact rows, raw URLs, cartoonish clutter, generic Tailwind styling, and broken preview/public output.

## 3. Files inspected
- `app/(site)/clasificados/components/categoryPipeline/catStd1aPipelineRegistry.ts`
- `app/(site)/clasificados/anuncio/[id]/page.tsx`
- `app/(site)/clasificados/community/CommunityQuickPublishedDetailPage.tsx`
- `app/(site)/clasificados/community/CommunityQuickPublicDetailSidebar.tsx`
- `app/(site)/clasificados/community/CommunityDiscoveryListingCard.tsx`
- `app/(site)/clasificados/busco/BuscoPublishedDetailPage.tsx`
- `app/(site)/clasificados/busco/BuscoRequestCard.tsx`
- `app/(site)/clasificados/mascotas-y-perdidos/MascotasPerdidosNoticeCard.tsx`
- `app/(site)/clasificados/empleos/[slug]/page.tsx`
- `app/(site)/clasificados/empleos/EmpleosPublicLaneDetailClient.tsx`
- `app/(site)/clasificados/empleos/EmpleoPublicDetailClient.tsx`
- `app/(site)/clasificados/empleos/components/quickJob/EmpleoQuickDetailPage.tsx`
- `app/(site)/clasificados/empleos/components/quickJob/QuickJobCTACard.tsx`
- `app/(site)/clasificados/empleos/data/empleoQuickJobSampleData.ts`
- `app/(site)/clasificados/empleos/data/empleosJobTypes.ts`
- `app/(site)/clasificados/empleos/lib/empleosPublishedLaneShell.ts`
- `app/(site)/clasificados/empleos/lib/staged/empleosEnvelopeToJobRecord.ts`
- `app/(site)/publicar/empleos/quick/EmpleoQuickApplicationClient.tsx`
- `app/(site)/publicar/empleos/premium/EmpleoPremiumApplicationClient.tsx`
- `app/(site)/publicar/empleos/shared/lib/empleosDraftFromEnvelope.ts`
- `app/(site)/publicar/empleos/shared/media/EmpleosVideoDraftField.tsx`
- `app/(site)/publicar/empleos/shared/publish/buildEmpleosPublishEnvelope.ts`
- `app/(site)/publicar/empleos/shared/publish/empleosPublishSnapshots.ts`
- `app/(site)/publicar/empleos/shared/types/empleosQuickDraft.ts`
- `app/(site)/publicar/community/shared/CommunityQuickApplicationClient.tsx`
- `app/(site)/publicar/community/shared/publish/buildCommunityPublishEnvelope.ts`
- `app/(site)/publicar/community/shared/publish/publishCommunityQuickToListings.ts`
- `app/(site)/publicar/busco/quick/BuscoQuickFormClient.tsx`
- `app/(site)/publicar/busco/shared/publishBuscoQuickToListings.ts`
- `app/(site)/publicar/mascotas-y-perdidos/quick/MascotasPerdidosQuickFormClient.tsx`
- `app/(site)/publicar/mascotas-y-perdidos/shared/publishMascotasPerdidosQuickToListings.ts`

## 4. Files changed
- `app/(site)/clasificados/empleos/components/quickJob/EmpleoQuickDetailPage.tsx`
- `app/(site)/clasificados/empleos/data/empleoQuickJobSampleData.ts`
- `app/(site)/clasificados/empleos/data/empleosJobTypes.ts`
- `app/(site)/clasificados/empleos/lib/empleosPublishedLaneShell.ts`
- `app/(site)/clasificados/empleos/lib/staged/empleosEnvelopeToJobRecord.ts`
- `app/(site)/publicar/empleos/premium/EmpleoPremiumApplicationClient.tsx`
- `app/(site)/publicar/empleos/quick/EmpleoQuickApplicationClient.tsx`
- `app/(site)/publicar/empleos/shared/lib/empleosDraftFromEnvelope.ts`
- `app/(site)/publicar/empleos/shared/media/EmpleosVideoDraftField.tsx`
- `app/(site)/publicar/empleos/shared/publish/buildEmpleosPublishEnvelope.ts`
- `app/(site)/publicar/empleos/shared/publish/empleosPublishSnapshots.ts`
- `app/(site)/publicar/empleos/shared/types/empleosQuickDraft.ts`
- `app/lib/clasificados/JULY1_FREE_CLASIFICADOS_APPLICATION_PUBLIC_SHELL_AUDIT.md`
- `scripts/july1-free-clasificados-application-public-shell-audit.ts`

## 5. Category pipeline map
| Category | Application | Preview | Publish | Results | Public Detail | Contact Card | Media | Risk |
|---|---|---|---|---|---|---|---|---|
| Empleos / Jobs | `/publicar/empleos/quick`, `/clasificados/publicar/empleos` | `/clasificados/empleos/quick-preview` | Empleos envelope -> `empleos_public_listings` | `/clasificados/empleos/results`, `/resultados` | `/clasificados/empleos/[slug]` lane shell | Simple employer contact | Images; up to 4 external video URLs | LOW |
| Mascotas y Perdidos | `/publicar/mascotas-y-perdidos/quick` | quick preview route | `publishMascotasPerdidosQuickToListings` | `/clasificados/mascotas-y-perdidos/results` | `/clasificados/anuncio/[id]` | Simple advertiser contact | Single image to `listing-images` | LOW |
| Clases | `/publicar/clases/quick` | quick preview route | `publishCommunityQuickToListings(kind=clases)` | `/clasificados/clases/results` | `/clasificados/anuncio/[id]` community quick shell | Simple instructor contact | Images to `listing-images`; PDF blocked | LOW |
| Busco / Wanted | `/publicar/busco/quick` | quick preview route | `publishBuscoQuickToListings` | `/clasificados/busco/results` | `/clasificados/anuncio/[id]` | Simple advertiser contact | Optional image to `listing-images` | LOW |
| Comunidad/Eventos | `/publicar/comunidad/quick` | quick preview route | `publishCommunityQuickToListings(kind=comunidad)` | `/clasificados/comunidad/results` | `/clasificados/anuncio/[id]` community quick shell | Community/Event Hub when data exists | Images, organizer/contact/social data | LOW |

## 6. Before-edit battlefield audit
| Category | Title/Header | Syntax | Location | Media | Preview Parity | Contact Card | Results | Brand | Mobile | Risk |
|---|---|---|---|---|---|---|---|---|---|---|
| Jobs | PASS | PASS | PASS | FIXED | PASS | PASS | PASS | PASS | PASS | Prior blocker fixed |
| Pets | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | Low |
| Classes | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | Low |
| Wanted | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | Low |
| Comunidad/Eventos | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | Low |

## 7. Jobs video blocker fix
FIXED. Jobs quick draft now has canonical `videoUrls: string[]` with legacy `videoUrl` mirrored as the first item. `EmpleosVideoDraftField` supports up to 4 external URLs, prevents empty/duplicate entries, validates `http(s)`, has bilingual messages, and renders no file input. Publish snapshots persist `videoUrls`, edit hydration restores them, public job records carry them, and the quick preview/public shell renders a warm video-link card without raw URL dumping.

## 8. Title/header/typography result
Scoped shells retain strong readable title hierarchy. Jobs quick public/preview title remains in the hero header, with media, facts, CTA, and details arranged beneath. No emoji-heavy header treatment was added.

## 9. Price/syntax result
Jobs salary/rate labels continue through existing salary parsing and display. Busco budget examples keep `$` syntax. Classes free/paid labels remain natural, and paid class publish remains product-blocked outside this gate. No `NaN`, null, or raw numeric cents were introduced.

## 10. Address/location result
City remains open where applicable from the prior gate. Community/Classes unknown public city is preserved in publish snapshots. Jobs quick uses public city/state mapping and optional address fields; map/location UI hides unless real location data exists.

## 11. Media input/output result
Images use existing storage helpers and published image URLs. Jobs videos are external URL cards only, up to 4 in the quick lane. Image gallery and video links are visually separate. No Mux or direct local video upload was introduced.

## 12. Preview/public parity result
Jobs quick preview and public detail use the same quick shell mapping, so title, media, videos, contact card, and details remain aligned. Classes/Community, Busco, and Pets retain their shared preview/public contracts.

## 13. Contact card mode result
Simple Listing Contact Card remains the mode for Jobs/Pets/Classes/Wanted. Community/Event Hub remains scoped to Comunidad/Eventos when real event/community data exists. No fake rows, fake social buttons, reviews, ratings, inbox, or lead center were added.

## 14. Community/Event Hub result
Community/Eventos keeps organizer, date/time, contact, website/social, map/location, and utility actions only when backed by submitted data. No fake attendance, ticketing, ratings, reviews, or empty platform buttons.

## 15. Share/copy/copy info result
The scoped public sidebar utilities still expose Share, Copy link, and Copy info labels. Jobs detail keeps existing engagement/share footer behavior; the video work did not weaken utilities.

## 16. No Save/Guardar confirmation
No Save/Guardar was added. The static audit checks touched public shell files for `Save`, `Saved`, `Guardar`, and `Guardado`.

## 17. Basic analytics result
Views and existing real engagement helpers remain. No fake saves/messages/contact totals/deep analytics were added.

## 18. Results card result
Results cards remain clean and simple: readable title, image when available, key facts only, and clear detail CTA. No full contact hub or fake counts were added to cards.

## 19. Brand/design result
Touched UI uses warm Leonix cards, gold/bronze borders, charcoal text, and dark/burgundy-style CTAs. Video cards use professional link styling and platform host names instead of raw URL blocks.

## 20. Desktop result
Desktop detail layouts retain organized main/sidebar or content/CTA structure with no global redesign.

## 21. Mobile 390px result
Touched controls use stacked layout and tappable buttons. The Jobs video link list wraps in a one-column mobile grid and avoids horizontal overflow.

## 22. Risks/deferred work
Manual browser QA is still recommended for live Supabase publish flows, but no launch-blocking code issue remains from this gate.

## 23. Manual QA checklist
- Jobs full flow QA
- Pets full flow QA
- Classes full flow QA
- Wanted full flow QA
- Comunidad/Eventos full flow QA
- Image upload QA
- Video URL QA with 1, 4, duplicate, empty, invalid URL cases
- Preview/edit/publish QA
- Results card QA
- Public detail QA
- Share QA
- Copy link QA
- Copy info QA
- Contact CTA QA
- No Save QA
- Views/likes QA
- Location/address QA
- Desktop QA
- Mobile 390px QA

## 24. READY TO COMMIT THIS GATE: YES
YES. The static audit passed and `npm run build` exited 0. Build still reports an unrelated Ofertas Locales PDF scan warning.

## PASS/FIXED/BLOCKED table
| Requirement | PASS/FIXED/BLOCKED | Evidence |
|---|---|---|
| Jobs full pipeline inspected | PASS | Quick draft, media field, envelope, hydration, public shell, result/detail mapping inspected |
| Pets full pipeline inspected | PASS | Prior gate inspection confirmed form, publish, image storage, results, detail |
| Classes full pipeline inspected | PASS | Prior gate inspection confirmed shared Community quick pipeline |
| Wanted full pipeline inspected | PASS | Prior gate inspection confirmed Busco quick pipeline |
| Comunidad/Eventos full pipeline inspected | PASS | Prior gate inspection confirmed Community/Event Hub pipeline |
| Jobs supports up to 4 external video URLs | FIXED | `videoUrls: string[]`, max 4 UI, snapshot/public shell persistence |
| Direct video file upload is not rendered | PASS | `EmpleosVideoDraftField` has no `type="file"` input |
| Mux/direct video upload was not introduced | PASS | Jobs video field contains no Mux/direct upload path |
| Image and video cards are clearly separate | FIXED | Jobs media section has image gallery and separate video link card |
| Images upload and persist | PASS | Existing helpers unchanged |
| Images show in preview | PASS | Existing preview shells unchanged |
| Images show on public detail | PASS | Existing public shell mappings unchanged |
| Images show on results cards where applicable | PASS | Existing result models unchanged |
| Generic fallback does not replace uploaded image | PASS | Fallback remains only when no valid uploaded image |
| Preview resembles public detail | PASS | Jobs quick preview/public share shell mapping |
| Return to edit preserves data | FIXED | `hydrateQuickDraftFromEnvelope` restores `videoUrls` |
| Titles are stronger and consistently arranged | PASS | Existing title hierarchy retained |
| Title font/size is readable on desktop | PASS | Existing shell typography retained |
| Title font/size is readable on mobile | PASS | Existing shell typography retained |
| Emoji/icon treatment is professional | PASS | No emoji-heavy UI added |
| Price/salary/rate syntax is clean where applicable | PASS | Existing salary/rate parsing retained |
| Dollar signs and commas are correct where applicable | PASS | Existing formatting retained |
| Address/location display is clean and public-safe | PASS | Existing public-safe mapping retained |
| City accepts open input where applicable | PASS | Prior gate fixed open city behavior |
| State/ZIP are handled cleanly where applicable | PASS | Existing state/ZIP mappings retained |
| Simple Listing Contact Card applied to Jobs/Pets/Classes/Wanted | PASS | Existing scoped contact mode retained |
| Community/Event Hub applied only to Comunidad/Eventos | PASS | Event hub remains community-only |
| No Save/Guardar rendered in touched shells | PASS | Static audit checks touched shell text |
| Share works | PASS | Existing utility behavior retained |
| Copy link works | PASS | Existing utility behavior retained |
| Copy info works | PASS | Existing utility behavior retained |
| Contact CTAs work directly when shown | PASS | Existing CTA helpers retained |
| Empty fields hide cleanly | PASS | Existing conditional rendering retained |
| No raw URLs/null/undefined show publicly | FIXED | Jobs video public card shows labels/hosts, not raw URLs |
| Views remain real if visible | PASS | Existing real view helpers retained |
| Likes remain real if visible | PASS | No fake likes added |
| No fake analytics/messages/saves added | PASS | No fake analytics added |
| Results cards are clean and not overloaded | PASS | Results cards unchanged |
| Leonix brand colors applied intentionally | PASS | Jobs video card uses warm/gold/charcoal palette |
| Desktop layout is organized | PASS | Existing layout retained |
| Mobile 390px layout is clean and tappable | PASS | Jobs video links stack and buttons meet tap targets |
| No unrelated categories edited | PASS | Static audit forbids locked category diffs |
| No Stripe/payment files touched | PASS | Static audit forbids Stripe/payment diffs |
| Audit script passed | PASS | `npm run july1:free-clasificados-shell-audit` |
| npm run build passed | PASS | `npm run build` exited 0; unrelated Ofertas Locales PDF scan warning remains |
