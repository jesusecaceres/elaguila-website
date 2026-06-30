# July 1 Free Clasificados Application + Public Shell Audit

## 1. Mission summary
Launch gate for the free/simple Clasificados chains: Empleos, Mascotas y Perdidos, Clases, Busco, and Comunidad/Eventos. The pass focused on input truth, media policy, preview/public parity, simple contact utilities, no Save/Guardar, and Leonix public shell polish.

## 2. User requirements summary
- No Save/Guardar/Favorites in this gate.
- Simple listings use simple contact utilities; Comunidad/Eventos can use a richer community/event hub only when real data exists.
- Images must persist through storage/publish and render in preview/detail/results where supported.
- Videos must be external URL based in these free/simple flows.
- City input must be open; NorCal is discovery/help only.
- No Stripe/payment, migrations, Coming Soon, Servicios, Restaurantes, Rentas, Autos, Bienes Raices, or En Venta edits.
- Build must pass before READY TO COMMIT can be YES.

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
- `app/(site)/clasificados/empleos/components/quickJob/EmpleoQuickDetailPage.tsx`
- `app/(site)/clasificados/empleos/components/quickJob/QuickJobCTACard.tsx`
- `app/(site)/publicar/empleos/quick/EmpleoQuickApplicationClient.tsx`
- `app/(site)/publicar/empleos/shared/media/EmpleosVideoDraftField.tsx`
- `app/(site)/publicar/empleos/shared/publish/buildEmpleosPublishEnvelope.ts`
- `app/(site)/publicar/community/shared/CommunityQuickApplicationClient.tsx`
- `app/(site)/publicar/community/shared/publish/buildCommunityPublishEnvelope.ts`
- `app/(site)/publicar/community/shared/publish/publishCommunityQuickToListings.ts`
- `app/(site)/publicar/busco/quick/BuscoQuickFormClient.tsx`
- `app/(site)/publicar/busco/shared/publishBuscoQuickToListings.ts`
- `app/(site)/publicar/mascotas-y-perdidos/quick/MascotasPerdidosQuickFormClient.tsx`
- `app/(site)/publicar/mascotas-y-perdidos/shared/publishMascotasPerdidosQuickToListings.ts`

## 4. Files changed
- `app/(site)/clasificados/community/CommunityQuickPublicDetailSidebar.tsx`
- `app/(site)/clasificados/community/CommunityQuickPublishedDetailPage.tsx`
- `app/(site)/clasificados/empleos/components/quickJob/EmpleoQuickDetailPage.tsx`
- `app/(site)/clasificados/empleos/components/quickJob/QuickJobCTACard.tsx`
- `app/(site)/publicar/busco/quick/BuscoQuickFormClient.tsx`
- `app/(site)/publicar/community/shared/publish/buildCommunityPublishEnvelope.ts`
- `app/(site)/publicar/empleos/quick/EmpleoQuickApplicationClient.tsx`
- `app/(site)/publicar/empleos/shared/media/EmpleosVideoDraftField.tsx`
- `app/(site)/publicar/mascotas-y-perdidos/quick/MascotasPerdidosQuickFormClient.tsx`
- `app/lib/clasificados/JULY1_FREE_CLASIFICADOS_APPLICATION_PUBLIC_SHELL_AUDIT.md`
- `scripts/july1-free-clasificados-application-public-shell-audit.ts`
- `package.json`

## 5. Category pipeline map
| Category | Publish route | Preview | Results | Public detail | Contact card | Media handling | Risk |
|---|---|---|---|---|---|---|---|
| Empleos | `/clasificados/publicar/empleos`, quick lane at `/publicar/empleos/quick` | `/clasificados/empleos/quick-preview` | `/clasificados/empleos/results`, `/resultados` | `/clasificados/empleos/[slug]` | `QuickJobCTACard` simple employer contact | Image refs in envelope; external video URL only after this gate | MEDIUM |
| Mascotas y Perdidos | `/clasificados/publicar/mascotas-y-perdidos`, quick form at `/publicar/mascotas-y-perdidos/quick` | `/publicar/mascotas-y-perdidos/quick/preview` | `/clasificados/mascotas-y-perdidos/results`, `/resultados` | `/clasificados/anuncio/[id]` via `anuncio` + mascotas quick map | Shared simple sidebar utilities/contact in quick detail chain | Single image data URL uploaded to `listing-images`, then `images` column | LOW |
| Clases | `/clasificados/publicar/clases`, quick form at `/publicar/clases/quick` | `/publicar/clases/quick/preview` | `/clasificados/clases/results`, `/resultados` | `/clasificados/anuncio/[id]` via `CommunityQuickPublishedDetailPage` | Simple listing sidebar utilities; no Save after this gate | Gallery images uploaded to `listing-images`; PDF blocked from publish | LOW |
| Busco / Wanted | `/publicar/busco/quick` | `/publicar/busco/quick/preview` | `/clasificados/busco/results`, `/resultados` | `/clasificados/anuncio/[id]` via `BuscoPublishedDetailPage` | Shared simple sidebar utilities | Optional single image uploaded to `listing-images`, then `images` column | LOW |
| Comunidad/Eventos | `/clasificados/publicar/comunidad`, quick form at `/publicar/comunidad/quick` | `/publicar/comunidad/quick/preview` | `/clasificados/comunidad/results`, `/resultados` | `/clasificados/anuncio/[id]` via `CommunityQuickPublishedDetailPage` | Community/Event Hub data exists in detail pairs/social fields; sidebar utility card has no Save | Gallery images uploaded to `listing-images`; PDF blocked from publish | MEDIUM |

## 6. Application/input audit
| Category | Input/form | Media | Preview/public parity | Detail shell | Contact card | Results card | Basic analytics | Risk |
|---|---|---|---|---|---|---|---|---|
| Empleos | FIXED: CTA language and video copy corrected | FIXED: local video picker removed | PASS: lane preview/public shell inspected | PASS | FIXED: CTA sheet language respects page lang | PASS | PASS: views/engagement are real helpers | MEDIUM |
| Mascotas y Perdidos | FIXED: city no longer stripped to known list | PASS: image required and uploads | PASS | PASS | PASS | PASS | PASS: views via shared listing view/open | LOW |
| Clases | FIXED: publish envelope preserves unknown public city | PASS: images upload; PDFs blocked at publish | PASS | PASS | FIXED: Save removed from shared sidebar | PASS | PASS: views only in sidebar | LOW |
| Busco | FIXED: city no longer stripped to known list | PASS: optional image uploads | PASS | PASS | PASS | PASS | PASS: views via listing view/open | LOW |
| Comunidad/Eventos | FIXED: publish envelope preserves unknown public city | PASS: images upload; social fields normalize | PASS | PASS | FIXED: Save removed from shared sidebar | PASS | PASS: views only in sidebar | MEDIUM |

## 7. Media upload/video URL audit
- Jobs: `EmpleosVideoDraftField` now accepts external video URLs only and requires `http://` or `https://`. Local file video selection was removed from the component.
- Pets: single photo is required, uploaded to Supabase Storage bucket `listing-images`, then written to `listings.images`.
- Busco: optional photo uploads to `listing-images` and writes to `listings.images`.
- Clases/Comunidad: gallery images upload to `listing-images`; PDFs are explicitly blocked from final publish.
- BLOCKED: Jobs currently has a single `videoUrl` contract, not four video URLs. Expanding to four requires draft/envelope/public shell contract changes beyond this safe gate.

## 8. Preview/public parity audit
Preview routes and public routes use the same envelope/detail-pair contracts for Classes/Community, Busco, and Pets. Jobs quick lane uses the staged envelope and lane shell. Return-to-edit/session preservation exists through session draft helpers; browser QA is still required for same-tab refresh and full publish round trips.

## 9. Public detail shell audit
Scoped public detail shells are cream/warm cards with gold borders, charcoal hierarchy, and mobile stacking. Community/Classes/Busco use `CommunityQuickPublicDetailShell` with right sidebar. Jobs uses the Empleos lane detail shell. Pets/Wanted render through the shared `anuncio` detail routing.

## 10. Contact card mode decisions
Simple Listing Contact Card mode applies to Jobs, Pets, Classes, and Wanted. Community/Event Hub mode is allowed only for Comunidad/Eventos when organizer, event date/time, website, social, map, and contact data exists. No fake rows or empty social buttons are added.

## 11. Community/Event Hub decision
Community/Eventos already stores real event metadata, organizer, website, and normalized social links in `Leonix:*` detail pairs. This gate removed Save/Guardar from the shared sidebar while preserving Share, Copy link, Copy info, views, owner manage, and real organizer display.

## 12. Share/copy/copy info implementation
Community/Classes detail supports native share fallback and copy link/info. Busco uses the shared sidebar utilities. Jobs contact CTAs use direct CTA sheet helpers; broader copy-info parity for Jobs is still manual QA/deferred.

## 13. No Save/Guardar confirmation
The touched scoped sidebar now has no `Save`, `Saved`, `Guardar`, `Guardado`, or `save` matches. No Save/Guardar was added anywhere.

## 14. Basic analytics result
Allowed view/open tracking remains. Save tracking was removed from Community/Classes published detail code. No fake messages, saves, lead totals, or deep analytics were added.

## 15. Results card result
Community/Classes and Pets cards already hide empty placeholders and show uploaded image URLs when present. Jobs results use `EmpleosJobResultCard`. Busco results use `BuscoRequestCard`. No full contact hub was added to results cards.

## 16. Brand/typography result
Touched surfaces retain cream/ivory backgrounds, warm white cards, gold borders, burgundy/dark CTAs, and charcoal text. Random blue usage was not introduced. Existing platform/social icons remain only where supported and real.

## 17. Desktop result
Desktop public shells use centered max-width layouts with main content and right utility/contact/sidebar cards. No sticky sidebar was added.

## 18. Mobile result
Buttons retain 44px-ish tap targets in touched forms/sidebars. Cards stack via existing shell layouts. Manual 390px QA remains required.

## 19. Risks/deferred work
- Jobs supports one external video URL, not up to four. This is a contract expansion, so this row is BLOCKED.
- Full live publish/browser QA was not completed by the audit file creation step; final build/audit script results are recorded after validation.
- Contact utility parity for Jobs (Copy link/Copy info in the job CTA card) remains less complete than Community/Classes/Busco.

## 20. Manual QA checklist
- Jobs full flow QA
- Pets full flow QA
- Classes full flow QA
- Wanted full flow QA
- Comunidad/Eventos full flow QA
- Image upload QA
- Video URL QA
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

## 21. READY TO COMMIT THIS GATE: NO
NO because the BLOCKED Jobs four-video contract needs product/contract acceptance or implementation. `npm run build` and the optional static audit script passed.

## PASS/FIXED/BLOCKED table
| Requirement | PASS/FIXED/BLOCKED | Evidence |
|---|---|---|
| Jobs full pipeline inspected | PASS | `catStd1aPipelineRegistry`, Jobs publish/preview/detail/results files inspected |
| Pets full pipeline inspected | PASS | Quick form, publish helper, results card, detail routing inspected |
| Classes full pipeline inspected | PASS | Shared Community quick form/publish/preview/detail/results inspected |
| Wanted full pipeline inspected | PASS | Busco form/publish/preview/detail/results inspected |
| Comunidad/Eventos full pipeline inspected | PASS | Shared Community quick form/publish/preview/detail/results inspected |
| Forms have clean labels/syntax | FIXED | Jobs video helper text corrected; city hard-strip removed |
| English/Spanish labels do not mix incorrectly | FIXED | Jobs CTA sheet now receives active `lang` |
| Dollar/comma syntax is clean where applicable | PASS | Busco budget placeholder uses `$`; Classes paid publish remains blocked |
| Address/location fields are clean and public-safe | FIXED | Unknown Community/Classes city now preserved in envelope |
| City accepts open input where applicable | FIXED | Removed `stripInvalidOnBlur` from Busco/Pets; Community envelope fallback fixed |
| State/ZIP are handled cleanly where applicable | PASS | Community/Classes state/zip persist to detail pairs |
| Images upload and persist | PASS | Publish helpers upload to `listing-images` and write `images` |
| Images display in preview | PASS | Preview shells read draft/session images |
| Images display on public detail | PASS | Detail pages read `images`/description markers |
| Images display on results cards where applicable | PASS | Results card models use image URLs |
| Generic fallback does not replace uploaded images | PASS | Fallback only after missing/failed image |
| Videos use external URLs only | FIXED | Jobs local video picker removed |
| Up to 4 video URLs supported where video is supported | BLOCKED | Jobs draft/envelope currently stores one `videoUrl`; contract expansion needed |
| Image and video cards are clearly separate | FIXED | Jobs video remains separate component/copy; image gallery separate |
| Preview resembles public detail | PASS | WYSIWYG/shared preview shells inspected |
| Return to edit preserves data | PASS | Session draft helpers and edit hydration inspected |
| Public title hierarchy is stronger | PASS | Existing shells use premium title hierarchy |
| Fonts/sizes are consistent and readable | PASS | Touched components retain existing scale |
| Padding/alignment feels premium | PASS | Existing Leonix shell/cards retained |
| Simple Listing Contact Card applied to non-event categories | PASS | Jobs/Pets/Classes/Busco use simple contact/utilities |
| Community/Event Hub applied to Comunidad/Eventos only | PASS | Social/event metadata only in Community quick contracts |
| No Save/Guardar rendered | FIXED | Save removed from scoped `CommunityQuickPublicDetailSidebar` |
| Share works | PASS | Community/Classes native share/fallback inspected |
| Copy link works | PASS | Sidebar copy link inspected |
| Copy info works | PASS | Sidebar copy info inspected |
| Contact CTAs work directly when shown | PASS | Jobs CTA sheet, detail contact helpers inspected |
| Empty contact fields hide cleanly | PASS | Conditional renders inspected |
| No raw URLs/null/undefined show publicly | PASS | Social URLs normalized; empty values skipped |
| Views remain real if visible | PASS | Sidebar fetches `/views`; listing open/view tracked |
| Likes remain real if visible | PASS | No fake likes added |
| No fake analytics/messages/saves added | FIXED | Save analytics removed from Community/Classes detail |
| Results cards remain clean/simple | PASS | No contact hub added to results |
| Leonix brand colors applied intentionally | PASS | Touched surfaces retain Leonix tokens/colors |
| Icons/emoji treatment is professional | PASS | No emoji-heavy UI added |
| Desktop layout is organized | PASS | Existing two-column shells retained |
| Mobile layout is clean and tappable | PASS | Existing stack/tap target classes retained |
| No unrelated categories edited | PASS | No Coming Soon/Servicios/Restaurantes/Rentas/Autos/BR/En Venta files edited |
| No Stripe/payment files touched | PASS | No Stripe/payment files edited |
| npm run build passed | PASS | Fresh final `npm run build` exited 0; unrelated Ofertas Locales PDF scan warning remains |

## Optional audit script result
`npm run july1:free-clasificados-shell-audit` passed. It verifies the audit file, required category mentions, required utility labels, no Save/Guardar text in the scoped sidebar, external-video-only Jobs video field, Community/Event Hub audit language, and forbidden modified areas.
