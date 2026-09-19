# LEONIX QUICK CLASSIFIEDS — FINAL BUILD / PREVIEW / CERTIFICATION

Mission: Simple on-ramp + Staff Quick Applications master build (Phase 1 — Classifieds).
Branch: `claude/quick-classifieds-master-build-0j5p30` (from `origin/main` @ `fd909499`, still 0 behind at close).
Companion documents: `LEONIX_QUICK_CLASSIFIEDS_EXECUTION_BLUEPRINT.md`, `LEONIX_QUICK_CLASSIFIEDS_CATEGORY_MATRIX.md`.

## 1. What shipped

| Scope item | Delivered as |
| --- | --- |
| One shared Quick Intake framework | `app/lib/quickClassifieds/*` (types, metadata registry, routes, ES/EN copy, validation) + `app/(site)/publicar/rapido/*` (chooser → essentials → ≥1 photo → review → existing preview) |
| En Venta / Varios | live adapter → `persistEnVentaPreviewHandoffAsync("pro")` → `/clasificados/en-venta/preview?plan=pro` |
| Rentas (private lane) | live adapter → `saveRentasPrivadoDraft` → `/clasificados/rentas/preview/privado` (existing paid preview) |
| Empleos (standard paid post) | **BLOCKED_BY_EXISTING_MEDIA_OUTPUT** — uploaded photos are dropped by the existing envelope mapper; Quick lists it honestly and links the existing standard application only |
| Autos (private lane) | live adapter → `saveAutosPrivadoDraftResolved` + namespace hint → `/clasificados/autos/privado/preview` (existing paid preview) |
| Bienes Raíces (FSBO lane) | live adapter → `saveBienesRaicesPrivadoDraft` → `/clasificados/bienes-raices/preview/privado` (existing paid preview) |
| Clases / Comunidad | live adapters → shared community session draft → existing `/publicar/{clases,comunidad}/quick/preview` |
| Busco / Mascotas | live adapters → their canonical session keys → existing quick previews |
| Existing customer auth | inherited from `app/(site)/publicar/layout.tsx` (`PublishAuthGateLayout`) — logged-out customers go to the existing login and return to the exact Quick route |
| Safe staff-assisted publishing | no classified publish route accepts a staff identity (verified); the launchpad offers Copy / Share / Open-with-customer, the customer signs in with their own account; the existing Create-for-Client handoff is linked for business customers |
| Staff Quick Applications area | `QuickApplicationsLaunchpad.tsx`, rendered directly under the Concierge header inside the ONE Business Concierge PWA (no new manifest) |
| Customer Quick-link entry | "⚡ Versión rápida / Quick version" link on the existing `/publicar` gateway |
| Copy / native Share for staff | reuses `copyToClipboard` / `tryWebShare` from `app/components/cta/ctaLaunchers.ts` |
| Lightweight "My Ad" control | `/publicar/rapido/mi-anuncio` — View / Edit / End (category wording) / Renew (only where canonical) / Help, all links into existing owner surfaces |
| Edit / End / Renew wording | from the registry lifecycle adapter: Ya se vendió (En Venta, BR), Ya se rentó (Rentas), Vehículo vendido (Autos), Puesto ocupado (Empleos), Finalizar (community family); renew only for Rentas / Autos / BR |
| Existing Admin management | untouched; Quick rows are canonical rows |
| ES / EN | every Quick string is a `{es,en}` pair; staff surface uses inline "ES / EN" pairs |
| Mobile / PWA first | 390px-first shell, ≥44px targets, camera capture on the media step |

## 2. Locks — proof

| Lock | Evidence |
| --- | --- |
| Owner lock (no redesign) | `git diff origin/main --stat` on tracked files: 3 files, 13 insertions, all additive; verifier §2 asserts no protected canonical path changed |
| Media lock (≥1 real image) | `QuickClassifiedMediaContract.minImages: 1` (type-level), `validateQuickMedia`, review button disabled at 0 photos; no generated / stock images (verifier §5) |
| Auth lock | no auth code in the Quick tree (verifier §3); gate inherited from the existing layout |
| Staff ownership lock | Quick never reads/writes `owner_id` / `owner_user_id` / `rosterId` / `authUserId`, never inserts rows, never calls a publish API, never uploads media (verifier §4) |
| Pricing lock | only existing package keys named; amounts read from `revenuePricingMatrix` at render; no Stripe / promo code (verifier §6) |
| Staff PWA lock | exactly one manifest (`app/manifest.ts`, unchanged); launchpad is an additive section inside `StaffCommandCenter` above "Hoy / Today" (verifier §1) |
| One framework | one registry, one adapter per live category, each through the category's own store + gate + preview (verifier §7) |

## 3. Certification runs (this worktree, 2026-09-19)

| Step | Result |
| --- | --- |
| Gate -1 isolation | fresh container clone of `origin/main` @ `fd909499`, 0/0, 0 dirty |
| Focused ESLint (`--max-warnings 0`) on all new files + launchpad + StaffCommandCenter | clean |
| `npm run verify:quick-classifieds-onramp` | OK |
| Existing guard verifiers (staff command center, bilingual staff, staff OS, concierge assisted publishing, p0 sales flow, p0 staff-assisted access, p0 final bridge, gateway selftest) | all OK |
| `gate-pkgA-checkpoints-selftest`, `verify-checkpoint-first-routes.mjs`, `verify-paid-publish-entry-checkpoints.mjs` | FAIL — reproduced identically on pristine `origin/main` (pre-existing drift, not introduced here) |
| `npm run build` (prebuild dup-guard + `next build`, placeholder public Supabase env) | **✓ Compiled successfully in 3.2 min, exit 0**; routes `/publicar/rapido`, `/publicar/rapido/[category]`, `/publicar/rapido/mi-anuncio` present as dynamic routes |
| `tsc --noEmit` (full, before `next-env.d.ts` existed) | 12 errors, all `Cannot find module '…logo.png'` — environmental (image-module declarations live in the gitignored `next-env.d.ts`), none in new code |
| `tsc --noEmit` (full, after build generated `next-env.d.ts`) | **0 errors, exit 0** |

Runtime QA: the container has no `.env.local` (Supabase / Stripe / Blob), so real-browser flows were not exercised
here. Owner's first-run checklist is in §5.

## 4. Known blockers / non-goals recorded

- **Empleos**: BLOCKED_BY_EXISTING_MEDIA_OUTPUT (`buildEmpleosPublishEnvelope.ts` drops `data:`/`blob:` image
  URLs; public page substitutes a stock hero). Fixing it is an Empleos media-output change, outside this mission.
- **Server-side staff-assisted (unclaimed) publishing** exists only for Servicios; not wired for any classified
  category. Left as an owner custody decision (which account, which status), exactly as
  `create-for-client/page.tsx` already states.
- **Clases paid lane** cannot publish today (`shouldBlockClasesPaidPublish`); Quick pins `gratis` (visible, changeable in
  the existing application).
- **Autos privado active rows are not editable** (pre-existing); the doorway says so instead of pretending.
- Three pre-existing verifier failures and one pre-existing unused import in `PublicarGatewayClient.tsx` were left
  untouched (out of scope).

## 5. Owner first-run checklist (next step, ~30 min on a phone)

1. Staff: open `/admin/businesses` → tap "⚡ Aplicaciones Rápidas" → Copy link for En Venta → paste in a new tab.
2. Customer: log in on the existing login (magic link), confirm return to `/publicar/rapido/en-venta`.
3. Fill the essentials, add one photo from the camera, tick the three rule boxes, tap "Ver mi anuncio" → confirm the
   existing En Venta preview opens with the photo and the pro plan.
4. Repeat for Rentas (expect the existing paid preview with checkout), Comunidad (expect the existing community
   preview) and Mascotas (expect ≥1 photo enforced).
5. Empleos card → confirms it opens the standard hub, no Quick CTA.
6. `/publicar/rapido/mi-anuncio` → Rentas → confirm links land on Mis Anuncios.
