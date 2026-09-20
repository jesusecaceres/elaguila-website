# LEONIX QUICK CLASSIFIEDS — EXECUTION BLUEPRINT

Mission: **Simple on-ramp + Staff Quick Applications master build (Phase 1 — Classifieds only).**

Doctrine: *We are not creating simplified ads. We are creating simplified intake into the existing ads.*

Cold-read against `origin/main` @ `fd9094994aa2a63fdcea49f24b2435300a7b49a4` (2026-09-19). Nothing in this document is
assumed from prior chat history; every claim cites a repository path.

---

## 0. Gate -1 — Isolated worktree (as executed)

The owner's prompt names Windows paths (`C:\projects\elaguila-website-quick-classifieds`) and a
`feature/quick-classifieds-onramp-2026-09` branch. This build ran in the **remote isolated container** for
the session, which is the isolation the gate requires: a fresh clone of `origin/main`, no other worktree,
no other agent's files. The designated push branch for this session is
`claude/quick-classifieds-master-build-0j5p30` (the harness-assigned equivalent of the feature branch).

| Item | Value |
| --- | --- |
| Worktree | `/home/user/elaguila-website` (session container, fresh clone) |
| Branch | `claude/quick-classifieds-master-build-0j5p30` |
| Starting HEAD | `fd9094994aa2a63fdcea49f24b2435300a7b49a4` = `origin/main` |
| Ahead / behind origin/main at start | 0 / 0 |
| Tracked dirty files at start | 0 |
| Main tree / Concierge worktree / Production touched | No |

---

## 1. Current-state forensics — cross-cutting truth

### 1.1 One PWA, one staff home

- `app/manifest.ts` — the single installable "Leonix Business Concierge" manifest, `start_url: /admin/businesses`,
  `scope: /admin/`. **No second manifest is created by this mission.**
- `app/admin/(dashboard)/businesses/page.tsx` renders `<StaffCommandCenter …/>` first, then the
  `#businesses-inventory` section. `StaffCommandCenter.tsx` opens with the Leonix header + install banner, then
  "Hoy / Today", "Necesita atención", "Asesor", "Entrega al Dueño", the OS link groups
  (`app/admin/_lib/staffOperatingSystem.ts`), recent businesses and upcoming meetings.
- Existing Quick Actions ("Crear anuncio / Create Ad" → `buildConciergeInventoryHref("create_listing")`) live in
  `staffOperatingSystem.ts` → `clientWork`. They are **not moved, removed or altered**.
- Existing intents: `app/admin/_lib/conciergeIntent.ts` — `create_listing, business_profile, note, follow_up,
  meeting, research, creative_studio`. Unchanged.
- Verifier contracts that guard these files (all presence-based, additive-safe):
  `scripts/verify-staff-command-center-gate1-01.ts`, `scripts/verify-bilingual-staff-experience-01.ts`
  (requires inline "Español / English" pairs, `min-h-[44px]`, `sm:flex-row`, no i18n libs, no
  `useLanguage|LanguageContext` in the businesses page), `scripts/verify-staff-operating-system-01.ts`,
  `scripts/verify-concierge-assisted-publishing-01.ts`, `scripts/verify-p0-*.ts`.

### 1.2 Customer authentication (reused, never duplicated)

- `app/(site)/login/page.tsx` — Supabase Auth; `signInWithOtp` (magic link, `emailRedirectTo: /auth/callback`),
  password login, OAuth. Modes: `login | signup | post | reset`. With `?redirect=<same-origin path>` the page
  returns the customer to that exact path after any successful sign-in (`router.replace(redirectTo)`);
  `mode=post` only changes the fallback (`/dashboard/perfil?require=post`) when **no** redirect is supplied.
- `app/lib/auth/publishLoginRedirect.ts` → `buildPublishLoginHref(returnPath, lang)` =
  `/login?mode=post&lang=…&redirect=<encoded returnPath>`.
- `app/components/auth/PublishAuthGateLayout.tsx` + `PublishAuthGate.tsx` — the single choke point. **Both**
  `app/(site)/publicar/layout.tsx` and `app/(site)/clasificados/publicar/layout.tsx` wrap their whole subtree in
  it. Any new route under `/publicar/**` therefore already: (a) requires a real customer session or a
  server-verified assisted token, (b) sends a logged-out visitor to login with `redirect=` the exact current
  path + query, (c) returns them to that exact path. No new auth code is needed for "return directly to the
  Quick flow/category".
- Customer identity/contact truth used by canonical publishers is the per-category draft contact block
  (`seller.nombre/telefono/whatsapp/correo` for Rentas/BR privado, `displayName/phone/email/whatsapp` for
  En Venta, `phone/whatsapp/smsPhone/email` for the community family, `dealerPhone*/dealerWhatsapp/dealerEmail`
  for Autos privado). Quick collects exactly those, nothing else, and stores nothing new.

### 1.3 Staff-assisted publishing (what exists, exactly)

- `app/lib/auth/assistedPublishingSession.ts` — HMAC-SHA256 signed, httpOnly, 1-hour
  `leonix_assisted_publish` cookie minted **only** server-side by
  `GET /api/admin/businesses/[businessId]/application-context?category=…` after a fresh
  `requireStaffWorkspaceWriteAccess("assisted_category_publishing")`. It lets the **UI gate** render without a
  customer session. It carries `rosterId` + the staff's real `authUserId` (attribution only).
- `app/admin/(dashboard)/businesses/create-for-client/page.tsx` + `handoff/HandoffClient.tsx` — same-tab
  handoff: fetch application-context (mints cookie), write `conciergeReturnContext` (sessionStorage,
  `managementMode: "leonix_assisted"`, `customerOwner: null`), then `window.location.assign(dest)` where
  `dest = resolvePublicarGatewayDestination(category, lang)` (checkpoint → hub → application).
- `ConciergeReturnBanner` shows "who this is for" on the application/preview.
- **Server-side "publish for client / unclaimed" custody exists for ONE category only: Servicios**
  (`app/api/clasificados/servicios/publish/route.ts` assisted branch, `app/lib/business/assistedListingCustody.ts`,
  `business_listing_links.linked_by`, `listing_status = "draft"`), proven by
  `scripts/verify-p0-final-assisted-publishing-bridge-01.ts`. **None of the nine classified publish routes reads
  the assisted cookie**; each still requires a real customer Supabase bearer / session at publish time.
  `create-for-client/page.tsx` says so in its own footnote: *"category applications save and publish under the
  Leonix SITE account signed in on this device … Which custody account Leonix uses for managed listings is an
  owner decision."*
- **Classification for this mission (staff_ownership_lock):**
  - Shared architecture is SAFE and reusable (cookie + return-context + PublishAuthGate). The mission does **not**
    stop.
  - Per-category *server-side unclaimed publishing* for the nine classifieds is
    **CATEGORY_ASSISTED_MODE_BLOCKED (not wired)** for every classified category. Porting the Servicios custody
    branch into nine publish routes is an owner-level custody decision (which account, which status), so it is
    recorded, not built.
  - What the staff launchpad therefore offers, honestly: (1) **Copy / Share the customer's Quick link** so the
    customer publishes under their own identity (the safe default); (2) **Prepare with the customer**
    (assisted handoff into the Quick intake, same cookie, same banner) — final Publish still runs under the
    customer's own site login exactly as the create-for-client flow does today. Staff auth ids never become
    owner ids because no classified publish route accepts them.

### 1.4 Draft stores (extract, don't invent)

Canonical registry: `app/lib/listingDrafts/draftWorkspaceContract.ts` → `DRAFT_STORE_ADAPTERS`. Verified modules:

| Pipeline | Store | Module | Write API |
| --- | --- | --- | --- |
| en_venta (pro lane) | sessionStorage + IndexedDB | `app/(site)/clasificados/en-venta/preview/enVentaPreviewDraft.ts` | `persistEnVentaPreviewHandoffAsync("pro", state)` |
| rentas_privado | sessionStorage (+ localStorage fallback, IDB media offload) | `…/publicar/rentas/privado/application/utils/rentasPrivadoDraft.ts` (`rentas-privado-draft-v1`) | `saveRentasPrivadoDraft(state)` |
| empleos (quick lane) | sessionStorage | `EMPLEOS_SESSION_KEYS.quick = leonix_empleos_quick_draft_v1` | `flushEmpleosDraftToSession(key, normalizeEmpleosQuickDraft(state))` |
| autos_privado | sessionStorage + IndexedDB, user/anon namespaced | `…/autos/privado/lib/autosPrivadoDraftStorage.ts` | `saveAutosPrivadoDraftResolved(ns, {v:1, vehicleTitleOverride, listing})` |
| bienes_raices_privado | sessionStorage (+ localStorage fallback) | `…/publicar/bienes-raices/privado/application/utils/bienesRaicesPrivadoDraft.ts` (`br-privado-draft-v1`) | `saveBienesRaicesPrivadoDraft(state)` |
| clases | sessionStorage | `COMMUNITY_SESSION_KEYS.clases = leonix_clases_quick_draft_v1` | `flushCommunityDraftToSession(key, state, normalizeClasesQuickDraft)` |
| comunidad | sessionStorage | `COMMUNITY_SESSION_KEYS.comunidad = leonix_comunidad_quick_draft_v1` | same, `normalizeComunidadQuickDraft` |
| busco | sessionStorage | `BUSCO_QUICK_DRAFT_KEY = leonix_busco_quick_draft_v2` | `sessionStorage.setItem(key, JSON.stringify(normalizeBuscoQuickDraft(state)))` |
| mascotas_y_perdidos | sessionStorage | `MASCOTAS_PERDIDOS_QUICK_DRAFT_KEY = leonix_mascotas_perdidos_quick_draft_v2` | same, `normalizeMascotasPerdidosQuickDraft` |

All nine are **browser-local until Publish**; media is held as data URLs in the draft (uploaded by the existing
publisher). Because every store is tab-scoped, the Quick handoff must happen **in the same tab** (same rule the
Concierge handoff already documents).

### 1.5 Media (extract, don't invent)

Canonical limits: `app/lib/media/listingMediaConfigs.ts` → `LANE_MEDIA_REGISTRY`. Quick uses the lane's own
record: en_venta pro `counted 0..12` (+4 video URLs), rentas_privado `counted 1..8` (+1 video URL), empleos quick
`uncapped` (+4 video URLs, logo), autos_privado `uncapped` (+8 video URLs), bienes_raices_privado `counted 1..8`,
clases/comunidad `uncapped` (+logo, PDF flyers), busco `single optional`, mascotas `single required` (registry)
— **note** the live Mascotas draft caps at `MAX_MASCOTAS_PHOTOS = 4` (`mascotasPerdidosQuickDraft.ts`).
Quick adds exactly one rule on top: **≥ 1 real image before handoff** (Media Lock). Where the category already
requires one (rentas, BR, mascotas, empleos gate, clases/comunidad gate) this is a no-op; where the canonical
publisher tolerates zero (en-venta, autos with video-only, busco) Quick still enforces it *for Quick only*.
Existing Full applications are untouched. No new bucket, no generated images.

### 1.6 Pricing authority (cold-verified, unchanged)

`app/lib/listingPlans/revenuePricingMatrix.ts` (server price authority; the client never sends a price):

| Category | packageKey | priceCents | billingMode | durationDays |
| --- | --- | --- | --- | --- |
| rentas | `rentas_30d` | 2499 | one_time | 30 |
| autos (privado) | `autos_privado_30d` | 2499 | one_time | 30 |
| empleos (job post) | `empleos_job_post_paid` | 2499 | one_time | 30 |
| bienes-raices (FSBO) | `br_fsbo_45d` | 4999 | one_time | 45 |
| en-venta | `en_venta_free_v1` | 0 | free | null |
| clases | `clases_free` / `clases_paid_30d` | 0 / 2499 | free / one_time | null / 30 (paid publish is still blocked by `shouldBlockClasesPaidPublish`) |
| comunidad | `comunidad_free` | 0 | free | null |
| busco | `busco_free` | 0 | free | null |
| mascotas-y-perdidos | `mascotas_free` | 0 | free | null |

Quick creates **no** SKU, promotion, product or price. Payment happens on the existing preview → existing checkout.

### 1.7 Route truth (registry)

`app/lib/listingIdentity/categoryRouteRegistry.ts` (`applicationRoute` / `checkpointRoute` / `hubRoute` /
`dashboardRoute`), consumed by `app/(site)/publicar/publicarGatewayResolver.ts`:

| Pipeline | checkpoint / hub | applicationRoute | preview | dashboardRoute |
| --- | --- | --- | --- | --- |
| en_venta | `/publicar/en-venta` (QuickLaneCheckpointClient) | `/clasificados/publicar/en-venta/pro` | `/clasificados/en-venta/preview?plan=pro` | `/dashboard/mis-anuncios` |
| rentas_privado | `/clasificados/publicar/rentas` | `/publicar/rentas/privado` | `/clasificados/rentas/preview/privado?propiedad=…` | `/dashboard/mis-anuncios` |
| empleos (quick) | `/publicar/empleos` hub | `/publicar/empleos/quick` | `/clasificados/empleos/quick-preview?from=publicar` | `/dashboard/empleos` |
| autos_privado | `/publicar/autos` hub | `/publicar/autos/privado` | `/clasificados/autos/privado/preview` | `/dashboard/mis-anuncios` |
| bienes_raices_privado | `/clasificados/publicar/bienes-raices` | `/publicar/bienes-raices/privado` | `/clasificados/bienes-raices/preview/privado?propiedad=…` | `/dashboard/mis-anuncios` |
| clases | `/publicar/clases` | `/publicar/clases/quick` | `/publicar/clases/quick/preview?from=publicar` | null (generic Mis Anuncios) |
| comunidad | `/publicar/comunidad` | `/publicar/comunidad/quick` | `/publicar/comunidad/quick/preview?from=publicar` | null |
| busco | `/publicar/busco` | `/publicar/busco/quick` | `/publicar/busco/quick/preview?from=publicar` | `/dashboard/mis-anuncios` |
| mascotas_y_perdidos | `/publicar/mascotas-y-perdidos` | `/publicar/mascotas-y-perdidos/quick` | `/publicar/mascotas-y-perdidos/quick/preview?from=publicar` | null |

**Important existing fact:** five categories (Empleos, Clases, Comunidad, Busco, Mascotas) already ship a route
literally named `quick` — and that route **is** their canonical (only) application. The new shared Quick intake
therefore never duplicates them; it fills their canonical session draft and hands off to their existing preview
(or, where their preview gate demands more than the essentials, to their existing application pre-filled).

### 1.8 Owner control surface (existing)

- `/dashboard/mis-anuncios` (list) and `/dashboard/mis-anuncios/[id]` (detail with `DashboardListingActionBar`:
  public link, edit, lifecycle actions, renewal where `capabilities.lifecycle.renew === "supported"`).
- Generic owner editor `/dashboard/mis-anuncios/[id]/editar` with `categoryLifecycleAdapters.ts` for
  en-venta, busco, clases, comunidad, mascotas-y-perdidos (strict field contracts).
- Empleos owns `/dashboard/empleos`; Autos privado / Rentas / BR privado cards render inside Mis Anuncios via
  their own manage cards (`AutosClassifiedListingManageCard`, `LeonixRealEstateListingManageCard`).
- Quick's "My Ad" control is a **doorway** into these, never a second dashboard.

---

## 2. Architectural answer

**CAN ONE SHARED QUICK INTAKE FRAMEWORK SAFELY FEED THESE NINE EXISTING CANONICAL PIPELINES THROUGH CATEGORY
ADAPTERS?**

**YES.** Every pipeline is (a) browser-draft-first, (b) exposes a public normalize/merge function that repairs a
partial draft into a full canonical shape, (c) exposes a public "required for preview" gate, (d) exposes a public
preview route that reads the same draft, and (e) publishes from that preview through its existing publisher.
The Quick framework only needs, per category: a field list, a mapper into the canonical draft shape, the
canonical write call, the canonical gate call, and the canonical handoff URL. No renderer, publisher, table,
price, lifecycle or admin surface is touched.

Per-category feasibility is recorded in `LEONIX_QUICK_CLASSIFIEDS_CATEGORY_MATRIX.md`:

| Category | Verdict | Handoff after Quick review |
| --- | --- | --- |
| En Venta / Varios | READY_BY_EXTRACTION | existing preview `/clasificados/en-venta/preview?plan=pro` (its "Publicar" nav returns to the existing application's publish bar) |
| Rentas privado | NEEDS_THIN_ADAPTER | existing preview `/clasificados/rentas/preview/privado?propiedad=…` (owns pending insert + checkout) |
| Empleos | NEEDS_THIN_ADAPTER (repaired in Tier-1 mission) | existing preview `/clasificados/empleos/quick-preview?from=publicar` (checkout now hosts local photos in `listing-images` before the unchanged envelope mapper) |
| Autos privado | NEEDS_THIN_ADAPTER | existing preview `/clasificados/autos/privado/preview` (draft mode via namespace hint; owns checkout) |
| Bienes Raíces privado | NEEDS_THIN_ADAPTER | existing preview `/clasificados/bienes-raices/preview/privado?propiedad=…` (owns pending insert + checkout) |
| Clases | READY_BY_EXTRACTION | existing preview `/publicar/clases/quick/preview?from=publicar` |
| Comunidad | READY_BY_EXTRACTION | existing preview `/publicar/comunidad/quick/preview?from=publicar` |
| Busco | READY_BY_EXTRACTION | existing preview `/publicar/busco/quick/preview?from=publicar` |
| Mascotas y Perdidos | NEEDS_THIN_ADAPTER | existing preview `/publicar/mascotas-y-perdidos/quick/preview?from=publicar` |

Confirmation checkboxes: every canonical draft already stores them (`confirmListingAccurate/…` or
`publishConfirmations.*`). Quick's review step renders the **same existing components**
(`ListingRulesConfirmationSection`, `CommunityPublishConfirmationSection`) and stores the customer's real ticks in
those canonical fields — never pre-ticked, never silent. That is what lets every live category hand off straight
to its existing preview.

Staff-assisted rendering: `/publicar/rapido/**` sits under `app/(site)/publicar/layout.tsx`, so the existing
assisted cookie + `ConciergeReturnBanner` apply with zero Quick code. Because no classified publish route accepts a
staff identity, the launchpad's primary staff verbs are Copy link / Share link / Open with the customer (the
customer signs in with their own account on the existing gate); the business-scoped Create-for-Client handoff is
linked as-is for customers who have a Business record.

---

## 3. Target architecture (Gate 1)

Location: `app/lib/quickClassifieds/` (framework, framework-owned copy/config) +
`app/(site)/publicar/rapido/` (routes) + `app/admin/(dashboard)/businesses/QuickApplicationsLaunchpad.tsx`
(staff launchpad, additive).

```
app/lib/quickClassifieds/
  quickClassifiedTypes.ts        QuickClassifiedDefinition / FieldDefinition / MediaContract / LifecycleAdapter
  quickClassifiedRegistry.ts     ONE registry — nine definitions (copy ES/EN, fields, media rule, pricing posture, lifecycle wording)
  quickClassifiedRoutes.ts       /publicar/rapido, /publicar/rapido/[category], quick-link builder (customer + staff)
  quickClassifiedValidation.ts   shared validation (required, phone digits, email, NorCal city, ≥1 image)
  quickClassifiedCopy.ts         ES/EN framework copy (shell, progress, review, media, login)
  adapters/                      one thin adapter per category — mapQuickToCanonical + writeCanonicalDraft + gate + handoffHref
    enVentaQuickAdapter.ts   rentasPrivadoQuickAdapter.ts   empleosQuickAdapter.ts   autosPrivadoQuickAdapter.ts
    bienesRaicesPrivadoQuickAdapter.ts   clasesQuickAdapter.ts   comunidadQuickAdapter.ts   buscoQuickAdapter.ts
    mascotasQuickAdapter.ts
  quickClassifiedAdapterRegistry.ts   category → adapter (client module; adapters import canonical stores)

app/(site)/publicar/rapido/
  page.tsx                        category chooser (SELECT CATEGORY)
  [category]/page.tsx             QuickIntakeClient (ESSENTIAL QUESTIONS → ≥1 IMAGE → REVIEW → handoff)
  _components/QuickIntakeClient.tsx, QuickCategoryChooser.tsx, QuickMediaStep.tsx, QuickReviewStep.tsx, QuickMyAdDoorway.tsx
```

The framework OWNS: ES/EN Quick copy, field ordering, validation, ≥1-image rule, progress, login return (inherited
from `PublishAuthGateLayout` via `/publicar/layout.tsx`), category selection, staff-assisted context (reads the
existing `conciergeReturnContext`), mapping into the existing canonical draft, route handoff, management doorway.

The framework does NOT own: canonical listing data, renderers, result cards, price, Revenue OS, entitlement,
lifecycle, analytics, admin queues.

### 3.1 Core interaction (390 px first)

`/publicar/rapido?lang=` → pick category → `/publicar/rapido/<slug>` →
step 1 essentials → step 2 photos (≥1) → step 3 review → **existing preview** (or existing application pre-filled
when the canonical gate needs more) → existing payment when the category is paid → existing publish → existing
success → "My Ad" doorway (`/publicar/rapido/mi-anuncio`) → existing dashboard.

### 3.2 Safe defaults / never-fabricated values

SAFE (visible, editable, or semantically neutral): `state = CA` and `country = United States` where the canonical
application already defaults them (Autos privado `withPrivadoLocationDefaults`, En Venta, Rentas/BR draft
defaults, community `COMMUNITY_DEFAULT_STATE`); `primaryCta` derived from which contact the customer typed;
`autosLane: "privado"`, `seller_kind: "individual"`, `posterType: "owner_private"` (the lane's identity, not a
fact about the customer); `isMain` on the first image; `previewListingId` (client UUID, same helper the canonical
draft uses).

NEVER FABRICATED: addresses, ZIP, prices, VIN, mileage, year/make/model, emails, phones, availability dates,
event dates, schedules, credentials, business names, reward amounts, pet identity, confirmations checkboxes
(the customer ticks them on the existing preview/application exactly as today).

---

## 4. Implementation sequence (executed in this order)

1. Gate 0 — this blueprint + category matrix (docs only).
2. Gate 1 — `app/lib/quickClassifieds/*` types, registry, validation, copy, routes; `/publicar/rapido` chooser
   + `[category]` intake client + media + review; adapter registry.
3. Gate 2 — adapters category-by-category, each proven by a focused `node:assert` source-contract check
   (no full build per category): en-venta → rentas privado → empleos → autos privado → bienes raíces privado →
   clases → comunidad → busco → mascotas.
4. Gate 3 — `QuickApplicationsLaunchpad.tsx` inserted directly under the Concierge header inside
   `StaffCommandCenter.tsx` (one additive line): "APLICACIONES RÁPIDAS / QUICK APPLICATIONS" — nine big
   category buttons, each with Copy link / Share link (native share via existing `tryWebShare` /
   `copyToClipboard` from `app/components/cta/ctaLaunchers.ts`) and "Preparar con el cliente" (existing
   assisted handoff, `/admin/businesses/create-for-client/handoff?…` when a business is selected, otherwise the
   plain Quick link). Also one small additive "Versión rápida" entry on the public `/publicar` gateway
   (customer Quick-link entry).
5. Gate 4 — `/publicar/rapido/mi-anuncio` doorway: View / Edit / End (category wording) / Renew (only when the
   canonical category supports it) / Get help — all links into existing dashboard + lifecycle routes.
6. Gate 5 — reconcile with `origin/main`, run existing verifiers that guard touched files, one full
   `tsc --noEmit` + one `next build`, write the certification doc, commit, push.

Resource control: no full build per category; one typecheck + one build near the end (a second build only if a
real error is repaired).

---

## 5. Execution record (as built)

### 5.1 Files

New (framework — `app/lib/quickClassifieds/`): `quickClassifiedTypes.ts`, `quickClassifiedRegistry.ts`,
`quickClassifiedRoutes.ts`, `quickClassifiedCopy.ts`, `quickClassifiedValidation.ts`.

New (routes — `app/(site)/publicar/rapido/`): `page.tsx` (chooser), `[category]/page.tsx` (intake),
`mi-anuncio/page.tsx` (doorway), `_components/{QuickShell,QuickCategoryChooser,QuickIntakeClient,QuickFieldRenderer,
QuickMediaStep,QuickReviewStep,QuickMyAdClient}.tsx`, `_components/quickIntakeDraftStore.ts`,
`_adapters/{quickAdapterShared,enVentaQuickAdapter,rentasPrivadoQuickAdapter,autosPrivadoQuickAdapter,
bienesRaicesPrivadoQuickAdapter,communityQuickAdapters,buscoQuickAdapter,mascotasQuickAdapter,index}.ts`.

New (staff): `app/admin/(dashboard)/businesses/QuickApplicationsLaunchpad.tsx`.
New (verifier): `scripts/verify-quick-classifieds-onramp-01.ts` (+ `npm run verify:quick-classifieds-onramp`).
New (docs): this blueprint, the category matrix, the certification.

Modified (additive only, 13 inserted lines total):
- `app/admin/(dashboard)/businesses/StaffCommandCenter.tsx` — one import + `<QuickApplicationsLaunchpad />` directly
  under the Concierge header (above "Hoy / Today").
- `app/(site)/publicar/PublicarGatewayClient.tsx` — one import + one "⚡ Versión rápida / Quick version" link next to
  the existing back link (customer Quick-link entry).
- `package.json` — one verify script.

Not modified: every canonical application, preview, publisher, renderer, result card, registry, media config,
draft-store module, pricing matrix, checkout / fulfillment, lifecycle, analytics, admin queue, auth module,
API route, migration, `app/manifest.ts`.

### 5.2 Verification run in this worktree

| Check | Result |
| --- | --- |
| `verify-quick-classifieds-onramp-01` (this mission's source contract) | OK |
| `verify-staff-command-center-gate1-01` | OK |
| `verify-bilingual-staff-experience-01` | OK |
| `verify-staff-operating-system-01` | OK |
| `verify-concierge-assisted-publishing-01` | OK |
| `verify-p0-sales-ad-creation-flow-01` | OK |
| `verify-p0-staff-assisted-category-access-01` | OK |
| `verify-p0-final-assisted-publishing-bridge-01` | OK |
| `gate-i5-2-publish-gateway-selftest` | OK |
| `gate-pkgA-checkpoints-selftest` | FAIL — **pre-existing**, fails identically on pristine `origin/main` (Empleos card `paid` vs expected `free`) |
| `verify-checkpoint-first-routes.mjs` | FAIL — **pre-existing**, fails identically on pristine `origin/main` (hub route literal) |
| `verify-paid-publish-entry-checkpoints.mjs` | FAIL — **pre-existing**, fails identically on pristine `origin/main` ("Rentas privado" string) |
| ESLint (`--max-warnings 0`) on every new file + the launchpad + StaffCommandCenter | clean |
| ESLint on `PublicarGatewayClient.tsx` | one **pre-existing** unused import (`replaceLangInHref`, present in HEAD); not touched (out of scope) |
| `node scripts/dup-guard.js` (prebuild) | OK |

Runtime QA note: this container has no `.env.local` (no Supabase / Stripe / Blob credentials), so browser
end-to-end flows could not be exercised here; certification rests on source contracts, the existing verifiers,
the full TypeScript check and the production build (see certification doc). The first real-browser pass is
listed as the owner's next step.
