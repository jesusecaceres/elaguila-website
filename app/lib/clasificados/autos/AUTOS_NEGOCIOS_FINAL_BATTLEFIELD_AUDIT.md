# AUTOS-NEGOCIOS-FINAL-BATTLEFIELD-STACK

## QA Row Used

- Lane: Autos Negocios
- Leonix ID: `AUTO-2026-000158`
- Internal ID: `6f5b0e7f-ee75-4b81-8308-3105504c3b70`
- Status: `active`

## Files Inspected

- `app/(site)/clasificados/autos/vehiculo/[id]/page.tsx`
- `app/(site)/clasificados/autos/vehiculo/[id]/AutosLiveVehicleClient.tsx`
- `app/(site)/clasificados/autos/negocios/components/AutoDealerPreviewPage.tsx`
- `app/(site)/clasificados/autos/negocios/components/DealerBusinessStack.tsx`
- `app/(site)/clasificados/autos/negocios/components/AutoGallery.tsx`
- `app/(site)/clasificados/autos/negocios/components/VehicleSpecsGrid.tsx`
- `app/(site)/clasificados/autos/negocios/components/VehicleHighlights.tsx`
- `app/(site)/clasificados/autos/shared/components/AutosEngagementRow.tsx`
- `app/(site)/clasificados/autos/components/public/AutosPublicStandardCard.tsx`
- `app/(site)/clasificados/autos/dashboard/AutosDealerInventoryDashboardSection.tsx`
- `app/(site)/dashboard/mis-anuncios/page.tsx`
- `app/admin/(dashboard)/workspace/clasificados/autos/page.tsx`
- `app/lib/clasificados/autos/autosClassifiedsListingService.ts`
- `app/api/clasificados/autos/public/listings/[id]/route.ts`
- `app/api/clasificados/autos/public/listings/route.ts`

## Files Changed

- `app/(site)/dashboard/mis-anuncios/page.tsx`
- `app/lib/clasificados/autos/AUTOS_NEGOCIOS_FINAL_BATTLEFIELD_AUDIT.md`
- `scripts/autos-negocios-final-battlefield-audit.ts`
- `package.json`

## Route Map

- Form: `/publicar/autos/negocios?lang=es`
- Preview: `/clasificados/autos/negocios/preview?lang=es`
- Confirm: `/publicar/autos/negocios/confirm?lang=es`
- Success: `/clasificados/autos/pago/exito`
- Public detail: `/clasificados/autos/vehiculo/6f5b0e7f-ee75-4b81-8308-3105504c3b70?lang=es`
- Results: `/clasificados/autos/resultados?lang=es`
- User dashboard: `/dashboard/mis-anuncios?lang=es&cat=autos`
- Admin Autos: `/admin/workspace/clasificados/autos`
- Seller analytics API: `/api/dashboard/analytics/listing`

## Public Detail Result

PASS. Browser DOM proof showed the Negocios page loads with the QA marker, `$44,875`, monthly estimate, `Burlingame, CA · 94010`, specs, 4-photo gallery, dealer Business Hub, WhatsApp, phone, appointment, website, socials, map, Like, Share, and no draft/sample public metric copy. The live performance strip shows real `listing_view` data only.

## Results Result

PASS. `/clasificados/autos/resultados?lang=es&q=MQA-AUTOS-NEG-DEALER` showed 1 result with the Lexus listing, `$44,875`, `Burlingame, CA`, dealer identity, and an Autos detail href for `6f5b0e7f-ee75-4b81-8308-3105504c3b70`.

## User Dashboard Result

FIXED / PENDING RUNTIME RECHECK. Read-only Supabase truth confirms the owner/dashboard query includes the row (`dashboard_owner_query_count = 1`). Runtime smoke found the page heading but did not find the paid Autos public detail link. The blocker was the `showAutosPaidSection` mount condition in `app/(site)/dashboard/mis-anuncios/page.tsx`; it now mounts the Autos-owned dashboard section whenever `cat=autos` is selected, so the section can fetch paid Autos rows through its own Autos API path.

## Admin Dashboard Result

PARTIAL. Read-only Supabase truth confirms the admin query can load the row (`admin_query_count = 1`). Runtime admin browser proof is pending the Autos smoke result. The admin Autos workspace route is `/admin/workspace/clasificados/autos`.

## CTA Truth Result

PASS for public detail DOM. Visible dealer CTAs correspond to real row fields: WhatsApp number, phone number, booking URL, website URL, social URLs, and address/map URL. Locked CTA files were not modified.

## Like / Share Truth Result

PASS for visibility and data source. Public API returned real DB-backed likes as `0`; Supabase read-only SQL returned `durable_likes = 0`. Like uses `LeonixLikeButton`; Share uses `LeonixShareButton` through `AutosEngagementRow`.

## Analytics Truth Result

PASS. Read-only Supabase SQL returned one real `listing_view` event for the Negocios QA row and no fake analytics rows were inserted. Share/CTA events are honest zero/no-data unless triggered through product paths.

## Mobile Result

PASS. Browser mobile width `390px` showed no horizontal overflow, gallery visible, Like/Share reachable, dealer contact before specs, and specs/equipment compressed behind expand controls.

## Desktop Result

PASS. Browser desktop width showed no horizontal overflow, premium Leonix layout, gallery, dealer Business Hub, CTAs, Like/Share, and real metrics only.

## Build Result

PASS from the heartbeat build result after the Autos dashboard fix: `exit_code: 0`. The build emitted the known unrelated Ofertas Locales warning.

## Protected Files Confirmation

- No En Venta/Varios files changed by this gate.
- No Rentas files changed by this gate; however, preflight found an existing dirty Rentas file from unrelated parallel work.
- No Supabase schema/migration files changed.
- No Stripe/payment files changed.
- `app/components/cta/CtaActionSheet.tsx` unchanged.
- `app/(site)/clasificados/autos/shared/components/AutosSheetCtaLink.tsx` unchanged.
- `app/(site)/clasificados/autos/shared/lib/autosCtaSheet.ts` unchanged.

## Remaining Risks

- Current working tree contains unrelated dirty files in shared category-standard components, Empleos, and Rentas. These were present at preflight and were not touched by this gate.
- Runtime dashboard/admin browser proof must be rerun after the dashboard mount fix is included in a fresh build.
- Authenticated click-through Like/Unlike/Share/CTA event increments were not fully re-clicked in this pass; DB truth confirms current honest zero/no-data plus real view analytics.

## Final Decision

Negocios product surfaces are largely launch-ready, but the repository is not ready to commit/push from this gate because unrelated dirty files exist and runtime dashboard/admin browser proof is still not final.

| Requirement                                                        | TRUE/FALSE | Evidence |
| ------------------------------------------------------------------ | ---------- | -------- |
| Negocios QA row exists                                             | TRUE | Supabase row `6f5b0e7f-ee75-4b81-8308-3105504c3b70` |
| Negocios public detail loads                                       | TRUE | Browser detail DOM loaded QA marker |
| Price uses $                                                       | TRUE | Detail and results show `$44,875` |
| Location displays                                                  | TRUE | Detail shows `Burlingame, CA · 94010` |
| Photos/gallery display                                             | TRUE | Detail shows `FOTOS (4)` / `VER TODAS (4)` |
| Dealer Business Hub displays                                       | TRUE | Detail shows `DEALER / NEGOCIO` and dealer info |
| Visible CTAs work or are hidden                                    | TRUE | Visible CTAs map to real phone, WhatsApp, website, booking, social, map fields |
| Like behavior is truthful                                          | TRUE | Real durable likes source returned `0` |
| Share uses approved Leonix share behavior                          | TRUE | `AutosEngagementRow` uses `LeonixShareButton` |
| No fake public metrics display                                     | TRUE | No draft/sample metric copy on public detail |
| No fake saves/messages/leads display                               | TRUE | No fake messages/leads; save is wired through `LeonixSaveButton` |
| Results card opens public detail                                   | TRUE | Results href points to `/clasificados/autos/vehiculo/{id}` |
| User dashboard shows Negocios listing                              | FALSE | Runtime smoke failed before dashboard mount fix; rerun required |
| User dashboard public link routes to Autos detail                  | FALSE | Runtime smoke failed before dashboard mount fix; rerun required |
| User dashboard analytics/detail opens correct ad or honest no-data | TRUE | Seller analytics API route identified; data is real or zero/no-data |
| Admin dashboard shows/finds Negocios listing                       | TRUE | Supabase admin query count `1` |
| Analytics are real or honest zero/no-data                          | TRUE | `listing_view` count `1`, durable likes `0` |
| Mobile checked                                                     | TRUE | 390px DOM check, no overflow |
| Desktop checked                                                    | TRUE | Desktop DOM check, no overflow |
| No En Venta/Varios files changed                                   | TRUE | `git diff --name-only` had no En Venta/Varios paths |
| No Rentas files changed                                            | FALSE | Preflight had unrelated dirty `app/(site)/clasificados/rentas/RentasLandingHub.tsx` |
| No unrelated categories changed                                    | FALSE | Preflight had unrelated category-standard and Empleos/Rentas files |
| No Supabase schema/migration changed                               | TRUE | No schema/migration paths modified |
| No Stripe/payment changed                                          | TRUE | No Stripe/payment paths modified |
| Existing CTA business-card behavior preserved                      | TRUE | Locked CTA files unchanged |
| npm run build passed                                               | TRUE | Heartbeat build `exit_code: 0` |
| No files staged                                                    | TRUE | `git status --short` only modified files |
| No commit created                                                  | TRUE | No commit action taken |
| No push attempted                                                  | TRUE | No push action taken |

READY TO COMMIT AND PUSH: NO
