# Varios Final Stacked Launch Completion — Gates 2K + 2L + 2M + 2P

## 1. Files inspected
- `publicar/en-venta/free/application/sections/PhotosSection.tsx`
- `publicar/en-venta/pro/application/LeonixEnVentaProApplication.tsx`
- `en-venta/publish/enVentaPublishFromDraft.ts`
- `en-venta/moderation/enVentaFamilySafety.ts`
- `en-venta/moderation/enVentaPolicyCopy.ts`
- `en-venta/listing/EnVentaListingReportDrawer.tsx`
- `en-venta/listing/EnVentaAnuncioLayout.tsx`
- `en-venta/report/submitEnVentaListingReport.ts`
- `api/clasificados/en-venta/report/route.ts`
- `clasificados/anuncio/[id]/page.tsx`
- `en-venta/results/EnVentaResultListingCard.tsx`
- `en-venta/results/EnVentaResultsClient.tsx`
- `en-venta/results/EnVentaResultsEmpty.tsx`
- `en-venta/dashboard/EnVentaListingManageCard.tsx`
- `dashboard/mis-anuncios/page.tsx`
- `app/lib/clasificados/enVentaContentDefaults.ts`
- `en-venta/shared/constants/enVentaPublicLabels.ts`
- `en-venta/taxonomy/categories.ts`
- `en-venta/EnVentaHubPageClient.tsx`
- `app/admin/_lib/adminAdSearch.ts`
- `app/admin/_lib/adminAdIdentity.ts`
- `app/admin/_lib/adminDashboardData.ts`
- `app/admin/_lib/adminOpsReportsSearch.ts`
- `app/admin/actions.ts`

## 2. Files changed
- `app/lib/clasificados/enVentaContentDefaults.ts` — landing copy polish (Gate 2P, earlier in session)
- `app/(site)/clasificados/en-venta/results/EnVentaResultListingCard.tsx` — card declutter (Gate 2P)
- `app/(site)/clasificados/en-venta/results/EnVentaResultsClient.tsx` — header trust note (Gate 2P)
- `app/(site)/clasificados/en-venta/AUDIT_VARIOS_FINAL_STACK_2K_2L_2M_2P.md` — this audit file
- `scripts/varios-final-stack-2k-2l-2m-2p-audit.ts` — audit script
- `package.json` — `varios:final-stack-audit` script

## 3. Gate 2K — Image safety result

### Current image flow
1. User selects local photos (object URLs) in `PhotosSection.tsx`.
2. Preview uses local blob URLs — no server upload yet.
3. On publish (`enVentaPublishFromDraft.ts`):
   - Insert row as `status: "draft"`, `is_published: false`
   - Upload each photo to Supabase Storage bucket `listing-images`
   - If upload fails → mark listing `status: "removed"`, not made public
   - If upload succeeds → update listing `status: "active"`, `is_published: true`

### Image moderation status
**No image/media moderation exists.** No AI provider, no NSFW detection, no image scanning webhook is wired in this repository. Images go from upload directly to public activation.

### Safe hold path
The two-phase publish (`draft` → upload → `active`) means images are only public after explicit activation. A future image moderation gate can be inserted between steps 2 and 3:
- After upload, before `status: "active"`: call image moderation API
- If flagged: keep `status: "draft"` or set `status: "pending_review"`
- The `status` column accepts arbitrary string values

### Honest documentation
**Image moderation is deferred.** No fake image scanning was added. The safe insertion point is documented above. Text moderation (`evaluateEnVentaFamilySafetyFromState`) runs before preview/publish and blocks unsafe text content.

## 4. Gate 2L — Report/admin/email result

### Report CTA
`EnVentaListingReportDrawer` is rendered in `EnVentaAnuncioLayout.tsx` on every published En Venta detail page.

### Report reasons (all 8 present)
| Code | Spanish | English |
|---|---|---|
| policy | Va contra las reglas | Against policy |
| offensive | Contenido ofensivo | Offensive content |
| prohibited | Artículo prohibido | Prohibited item |
| scam | Posible estafa | Possible scam |
| misleading | Información falsa o engañosa | False or misleading |
| wrong_category | Categoría incorrecta | Wrong category |
| sold_unavailable | Ya vendido / no disponible | Sold / unavailable |
| other | Otro | Other |

### Disclaimer
Present in `EN_VENTA_REPORT_DISCLAIMER` — matches required wording exactly.

### Persistence
Reports insert to `listing_reports` table via `POST /api/clasificados/en-venta/report` → `submitEnVentaListingReport`.

### Admin visibility
- `adminDashboardData.ts` counts pending reports from `listing_reports`
- `adminOpsReportsSearch.ts` queries reports by listing UUID
- `app/admin/actions.ts` can update report status

### Admin email
`submitEnVentaListingReport` sends email via `sendLeonixResendEmail` for high-severity codes (offensive, prohibited, scam) when `RESEND_API_KEY` is configured. Email includes listing ID, Leonix Ad ID, title, reason, reporter, and admin link.

## 5. Gate 2M — Leonix Ad ID result

### Generation
`leonix_ad_id` is a column on the `listings` table. It is auto-populated at DB level (not assigned in client-side publish code).

### Public detail
Displayed at `anuncio/[id]/page.tsx` line 1399–1403: "Leonix Ad ID # {id}" when available.

### Seller dashboard
`EnVentaListingManageCard.tsx` (line 306–308) renders the Leonix Ad ID when `leonixAdId` prop is passed. `mis-anuncios/page.tsx` passes `leonix_ad_id` from the listing row.

### Admin
`adminAdSearch.ts` matches search queries against `leonix_ad_id`. `adminAdIdentity.ts` resolves Leonix Ad ID from multiple possible column names.

### Report context
`submitEnVentaListingReport.ts` fetches `leonix_ad_id` from the listing and includes it in the admin email alert.

## 6. Gate 2P — Landing/results polish result

### Landing
- Hero: "Varios" (ES) / "For Sale" (EN)
- Value prop: "Compra, vende o regala artículos locales en tu comunidad."
- Tagline: "Artículos reales · personas reales · tu comunidad local"
- Social proof: "Anuncios moderados · compradores y vendedores reales · publica en minutos"
- Trust section: "Compra y vende con cuidado" + "Reporta anuncios sospechosos"
- 12 department cards, search bar, city select, "Publicar en Varios" CTA
- Mobile sticky bar

### Results
- Per-card "Anuncio moderado" trust box removed (declutter)
- `postedAgo` always visible for all cards (both Free and Pro)
- Header shows trust note: "Comunidad Leonix · anuncios moderados · contacto directo"
- Cards show: photo, title, price, city, condition, freshness, fulfillment, seller type

### Empty state
Uses "Varios" language: "Ver todo Varios" / "Browse all For Sale" + "Publicar artículo" CTA

## 7. Build/check result
- `npm run varios:final-stack-audit` — **29/29 passed**
- `npm run build` — **exit code 0** (114s)

## 8. Remaining risks
- Image moderation: deferred (no AI provider wired)
- Seller notification email on listing hide: copy exists, mailer not wired for per-user
- Post-publish auto-hide on report threshold: admin manual only

## 9. Final one-pass QA checklist
1. Visit `/clasificados/en-venta` — "Varios" hero, new value prop, departments browsable
2. Search with synonym → results appear
3. Open a listing → "Leonix Ad ID # ..." visible, "Reportar anuncio" button works
4. Submit a report → verify success state
5. Visit `/clasificados/publicar/en-venta` → lands on Pro form (no Free/Pro choice)
6. Fill + preview → moderation blocks prohibited terms
7. Publish → success screen, same listing visible in results
8. Visit `/dashboard/mis-anuncios` → "Refrescar anuncio" + Leonix Ad ID visible
9. Refresh → listing moves to top
10. Results cards: clear title, price, city, condition, freshness (no per-card trust clutter)
11. Empty state: helpful with "Publicar artículo" CTA
12. English toggle → "For Sale", "Buy, sell, or give away local items"
13. No "$9.99", "Boost", "Impulsar", "En Venta" in public surfaces

## TRUE/FALSE table

| Requirement | TRUE/FALSE | Evidence |
|---|---|---|
| Spanish public label is Varios everywhere checked | TRUE | enVentaPublicLabels + hub + results + detail chip |
| English public label remains For Sale | TRUE | enVentaPublicLabels |
| Internal en-venta slug/folder was not renamed | TRUE | No route changes |
| Pro included-free flow remains intact | TRUE | Hub redirects to Pro; "incluido sin costo" |
| Free files remain preserved/parked | TRUE | LeonixEnVentaFreeApplication exists |
| No public $9.99 remains | TRUE | Grep confirms none |
| No Stripe/payment logic was added | TRUE | No payment edits |
| No public Boost/Impulsar wording remains | TRUE | Grep confirms none in results/listing/card |
| Refrescar remains tied to real refresh behavior | TRUE | renewEnVentaRepublish same-row update |
| Text moderation from Gate 2J remains active | TRUE | evaluateEnVentaFamilySafetyFromState blocks pre-publish |
| Image moderation is real or honestly documented as deferred | TRUE | Documented as deferred — no fake scanning |
| No fake AI/image moderation was added | TRUE | No AI claims anywhere |
| Reportar anuncio CTA exists on public detail | TRUE | EnVentaListingReportDrawer in EnVentaAnuncioLayout |
| Report reasons are complete | TRUE | 8 reasons in enVentaPolicyCopy |
| Report disclaimer exists | TRUE | EN_VENTA_REPORT_DISCLAIMER |
| Report submission persists | TRUE | listing_reports table via API |
| Admin report visibility exists | TRUE | adminDashboardData + adminOpsReportsSearch |
| Admin email alert exists | TRUE | Resend for high-severity when configured |
| Leonix Ad ID appears on public/support surfaces where available | TRUE | anuncio/[id]/page.tsx line 1399 |
| Seller dashboard/admin can reference Leonix Ad ID | TRUE | EnVentaListingManageCard + adminAdSearch |
| Buyer/seller responsibility copy exists | TRUE | EN_VENTA_PLATFORM_RESPONSIBILITY |
| Landing page feels marketplace-ready | TRUE | Polish applied this session |
| Results page feels marketplace-ready | TRUE | Decluttered cards, trust header |
| Results cards show core buyer scan fields | TRUE | title, price, city, condition, freshness, fulfillment |
| Empty state is helpful | TRUE | Suggestions + publish CTA |
| No fake boost/report/AI/admin behavior was added | TRUE | All real implementations |
| No unrelated categories were touched | TRUE | Only en-venta scope |
| npm run build passed | TRUE | exit code 0 |
