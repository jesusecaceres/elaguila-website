# Package E — Build E2: User Dashboard Global Command Center Closure

**Starting HEAD:** `dc597fd5` (Package D, verified on remote, `integration/lifecycle-foundation-2026-07`)
**Scope class:** Scoped gated build — install real, existing commercial/data truth into the dashboard shell that already exists; no new checkout, subscription, auth, or admin architecture; no migrations.

## Gate 1 — global commercial-state badge adoption

**Reused, not rebuilt:** `resolveCommercialStateBadges()` (`app/lib/listingPlans/commercialStateBadges.ts`) — the only change to this file is a new pure adapter, `commercialStateBadgesToLifecycleNote()`, that converts its output into the single `{text, tone}` shape the existing `DashboardCategoryListingCard`'s `lifecycleNote` prop already supported. No new resolver.

Threaded the already-fetched `subscriptionStates` (previously fetched but never rendered for these categories) into card render calls in `mis-anuncios/page.tsx`:

| Category | Card | Mechanism |
|---|---|---|
| Restaurantes | `DashboardCategoryListingCard` | `lifecycleNote` sourced from existing `subscriptionStates` fetch, zero new queries |
| Servicios | `DashboardCategoryListingCard` | same |
| Autos Dealer | `AutosDealerInventoryDashboardSection.tsx` (parent group header) | new, single batched entitlement fetch scoped to Negocios PARENT rows only (component manages its own data independently of `mis-anuncios/page.tsx`) |
| Bienes Negocio | `BrPropertyInventoryDashboardSection.tsx` (parent group header) | subscription state read from the SAME response as the pre-existing Inventory Pack entitlement fetch — zero new network calls |
| Rentas | `LeonixRealEstateListingManageCard` | unchanged, preserved exactly as before |

No account-tier inference anywhere. No duplicate commercial resolver created.

## Gate 2 — Business Tools real capability gate

`app/(site)/dashboard/business-tools/page.tsx` now calls the canonical `/api/dashboard/listing-package-entitlements` route (via `fetchDashboardListingPackageEntitlementBadges`) for the owner's Restaurantes/Servicios listings and renders a real "Capacidades por anuncio" section showing Included/Not included per listing, using `dashboardHasCapabilityForKey(..., "coupons_offers")` — the only real package-gated capability model in the codebase today. The 5 pre-existing marketing cards (WhatsApp/Profile/Social/SEO/Concierge) and the profile-completeness section are unchanged — they made no false ownership claims before and needed no fix. Profile completeness and account tier are never used as entitlement truth.

## Gate 3 — Autos Dealer + Bienes Negocio parent subscription management

**Read-only commercial-state visibility:** delivered as part of Gate 1 (same code, same parent-scoped fetch).

**NAMED BLOCKER (confirmed, not fabricated):** No Renew/Manage-subscription action was built for either category's $399/mo parent subscription. Exhaustive search confirmed **no Stripe Billing Portal integration exists anywhere in the app** — no portal-session API route, and `NEXT_PUBLIC_STRIPE_CUSTOMER_PORTAL_URL` is unset (the existing Profile page's Billing card already honestly renders a disabled "Portal not configured" state for this exact reason). Rentas' own "Renew" button is a one-time-purchase Stripe Checkout Session for a `billingMode: "one_time"` package — structurally incompatible as a template for a `billingMode: "monthly_subscription"` renewal action. Building a real renewal action requires a new Stripe Billing Portal (or equivalent) integration, which is Package C subscription architecture, explicitly locked for E2. Per the build's own stop condition, this is reported rather than faked.

Children (Autos vehicle inventory rows, Bienes property inventory rows) never render any independent base-subscription state or renewal control — unaffected, since no renewal UI was added anywhere. Boost (+$129/mo) and Inventory Pack (+$99/mo) checkout remain fully separate from base-subscription display.

## Gate 4 — My Listings category action truth

| Category | Fix | Mechanism |
|---|---|---|
| Restaurantes | Removed the stale "Agregar cupones +$99/mes" upsell CTA | Coupons are already included at $399/mo with no real paid add-on backend (`startRestauranteDashboardCouponAddonCheckout` does a free capability-enable, no Stripe checkout) — the CTA falsely implied a paid upgrade. `onCouponUpgrade`/`couponUpgradeBusy` removed from the call site; `buildInventoryListingActions`'s existing `opts?.onCouponUpgrade` guard means the button no longer renders. `onCouponEdit` (editing already-active coupon content) is untouched. |
| Restaurantes | Pause/resume/archive | **NAMED BLOCKER** — confirmed zero owner-facing lifecycle mutation exists anywhere for Restaurantes (only an admin-only PATCH route). Not built in E2; documented, not faked. |
| Servicios | Pause + Resume wired onto the unified My Listings card | Reuses the existing owner-verified `/api/clasificados/servicios/manage` route (previously only wired on the separate `/dashboard/servicios` page) — no new mutation API. |
| Empleos | Pause + Archive + Resume (via re-publish) wired onto the unified card | Reuses the existing owner-verified `PATCH /api/clasificados/empleos/listings/{id}` route (previously only wired on the `/dashboard/empleos/[listingId]` detail page) — no new mutation API, no new state-machine gating beyond what the route already enforces. |
| Autos Privado | Real edit route wired | `/publicar/autos/privado?edit=1&source=dashboard&listingId={id}` — the confirmed real, live route (`AUTOS_PRIVADO_ADAPTER.editRoute`), previously unwired on the dashboard card. |
| Comunidad / Clases / Busco | Real edit route wired | `/dashboard/mis-anuncios/{id}/editar` — the existing generic owner-verified listings-table editor. |
| Mascotas | No edit — unchanged | Confirmed by design: no safe edit route exists for this category. Not a gap; left exactly as before. |
| Viajes, Comida Local | Unchanged | No E1-proven gap in scope for E2. |

## Gate 5 — real Messages inbox

`/dashboard/mensajes` now queries the real `messages` table (`receiver_id = auth.uid()`, RLS-scoped), resolves listing context only for UUID-shaped `listing_id`s against the shared `listings` table (non-resolvable ids get a generic label, never a broken link), and supports mark-as-read via the real "receiver can update own messages" RLS policy. No reply/send UI — confirmed via exhaustive search that no reply capability exists in the underlying data model (only 2 real INSERT call-sites app-wide, both buyer→seller, never reversed). `DASHBOARD_INTERNAL_INBOX_READY` flipped to `true` only after this real implementation landed.

## Gate 6 — real Saved listings page

`/dashboard/guardados` now calls `listSavedListingIdsForUser()` + `resolveSavedListingsForDashboard()` — both real, previously-built-but-unwired functions (`app/lib/savedListingsRuntime.ts`, `app/lib/savedListingsDashboardResolve.ts`). Displays real saved listings only (title/price/city/category/thumbnail/link when real), with a real remove-from-saved mutation. Truthful empty and error states. `DASHBOARD_SAVED_LISTINGS_READY` flipped to `true` only after this real implementation landed.

## Gate 7 — notification / Overview commercial attention states

Added a new derived feed item kind, `payment_attention`, to `derivedDashboardFeed.ts` (`app/(site)/dashboard/lib/derivedDashboardFeed.ts`) — sourced from the SAME `resolveCommercialStateBadges()` + `/api/dashboard/listing-package-entitlements` route every dashboard card already uses (one batched lookup covering Bienes Negocio, Restaurantes, Servicios, and Autos Dealer parents; no second implementation, no notifications table). Only real grace/suspended/disputed/cancels-at-period-end/canceled states surface — a plain "active" state never generates a notification. Best-effort: any lookup failure is swallowed so the rest of the feed is never blocked.

Surfaced on Overview (`app/(site)/dashboard/page.tsx`) as a small alert banner reading directly from `derivedFeed` — this closes a **pre-existing, unrelated gap** found in the process: the Overview page already fetched `derivedDashboardFeed` into state but never rendered any of it. The fix here is scoped to rendering only the new `payment_attention` items (the "high-priority commercial alerts" this gate asked for); the rest of the feed's items remain rendered only on the dedicated Notifications page, unchanged.

## Gate 8 — Ofertas Locales dashboard boundary

Added a real, summary-only card to `mis-anuncios/page.tsx` (visible whenever the owner has at least one submission) using the existing, real `/api/ofertas-locales/owner` route — shows a live count and links out to the dedicated `/dashboard/ofertas-locales` management surface. Ofertas' application/public/AI-flyer internals were not touched. Standalone Cupones needed no separate integration — it already rides the same `ofertas_locales` pipeline and the same dedicated dashboard surface.

## Gate 9 — mobile + UX polish

All new UI added in this build uses existing `LX_DASH` design tokens and wrap-safe layout (`flex-wrap`, `min-w-0`, `break-words`, `shrink-0`) consistent with surrounding code. Code-level review confirms no fixed-width or overflow-prone elements were introduced. **Live 390px browser verification could not be completed this pass** — the Browser pane tool was unresponsive (repeated navigation timeouts unrelated to application code) during the verification window. This is a real, disclosed limitation, not a claimed-complete step.

## Terminal category matrix

Allowed values only: **IMPLEMENTED** (runtime-provable), **INTENTIONAL N/A** (exact reason), **NAMED BLOCKER** (exact reason).

| Lane | Reader | Card | Public view | Edit | Pause | Resume | Archive | Republish | Renew sub. | Add inventory | Analytics | Leads/Messages | Commercial state | Terminal status |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| En Venta | IMPLEMENTED | IMPLEMENTED | IMPLEMENTED | IMPLEMENTED | IMPLEMENTED | IMPLEMENTED | IMPLEMENTED | IMPLEMENTED | INTENTIONAL N/A (Pro republish only, unchanged) | INTENTIONAL N/A (not a paid inventory lane) | IMPLEMENTED | IMPLEMENTED (Messages, Gate 5) | INTENTIONAL N/A (no subscription lane) | IMPLEMENTED — untouched in E2, already complete |
| Rentas | IMPLEMENTED | IMPLEMENTED | IMPLEMENTED | IMPLEMENTED | IMPLEMENTED | IMPLEMENTED | IMPLEMENTED | IMPLEMENTED | IMPLEMENTED (one-time renewal, pre-existing) | INTENTIONAL N/A | IMPLEMENTED | IMPLEMENTED (Messages, Gate 5) | IMPLEMENTED — preserved exactly | IMPLEMENTED — untouched in E2, already complete |
| Bienes Privado | IMPLEMENTED | IMPLEMENTED | IMPLEMENTED | IMPLEMENTED | IMPLEMENTED | IMPLEMENTED | IMPLEMENTED | INTENTIONAL N/A | INTENTIONAL N/A (no subscription) | INTENTIONAL N/A | IMPLEMENTED | IMPLEMENTED (Messages, Gate 5) | INTENTIONAL N/A | IMPLEMENTED — untouched in E2, already complete |
| Bienes Negocio/Agente | IMPLEMENTED | IMPLEMENTED (parent/child) | IMPLEMENTED | IMPLEMENTED (parent) | IMPLEMENTED (child visibility) | IMPLEMENTED (child visibility) | INTENTIONAL N/A (parent lifecycle is subscription-governed) | INTENTIONAL N/A | **NAMED BLOCKER — no Stripe Billing Portal integration exists** (Gate 3) | IMPLEMENTED (Inventory Pack +$99/mo, pre-existing) | IMPLEMENTED | IMPLEMENTED (Messages, Gate 5) | IMPLEMENTED (Gate 1) | Real commercial-state visibility now live; renewal action is a confirmed, reported blocker |
| Servicios | IMPLEMENTED | IMPLEMENTED | IMPLEMENTED | IMPLEMENTED | IMPLEMENTED (Gate 4) | IMPLEMENTED (Gate 4) | INTENTIONAL N/A (no archive backend confirmed; not requested by E1) | INTENTIONAL N/A | INTENTIONAL N/A (own $399/mo lane, no renewal UI requested) | INTENTIONAL N/A | IMPLEMENTED | IMPLEMENTED (Messages, Gate 5) | IMPLEMENTED (Gate 1) | IMPLEMENTED |
| Autos Privado | IMPLEMENTED | IMPLEMENTED | IMPLEMENTED | IMPLEMENTED (Gate 4) | INTENTIONAL N/A | INTENTIONAL N/A | IMPLEMENTED | INTENTIONAL N/A | INTENTIONAL N/A | INTENTIONAL N/A | IMPLEMENTED | IMPLEMENTED (Messages, Gate 5) | INTENTIONAL N/A | IMPLEMENTED |
| Autos Dealer | IMPLEMENTED | IMPLEMENTED (parent/child) | IMPLEMENTED | IMPLEMENTED (parent) | INTENTIONAL N/A (unpublish/restore instead) | IMPLEMENTED (child visibility, pre-existing) | INTENTIONAL N/A | INTENTIONAL N/A | **NAMED BLOCKER — no Stripe Billing Portal integration exists** (Gate 3) | IMPLEMENTED (Boost +$129/mo, pre-existing) | IMPLEMENTED | IMPLEMENTED (Messages, Gate 5) | IMPLEMENTED (Gate 1) | Real commercial-state visibility now live; renewal action is a confirmed, reported blocker |
| Restaurantes | IMPLEMENTED | IMPLEMENTED | IMPLEMENTED | IMPLEMENTED | **NAMED BLOCKER — no owner-facing lifecycle backend exists** | **NAMED BLOCKER** (same) | **NAMED BLOCKER** (same) | INTENTIONAL N/A | INTENTIONAL N/A | INTENTIONAL N/A (coupons included, no separate add-on) | INTENTIONAL N/A (unproven) | IMPLEMENTED (Messages, Gate 5) | IMPLEMENTED (Gate 1) | Stale coupon-upgrade CTA removed (Gate 4); pause/resume/archive is a confirmed, reported blocker |
| Comida Local | IMPLEMENTED | IMPLEMENTED | IMPLEMENTED | INTENTIONAL N/A (own flow, unchanged) | IMPLEMENTED (pre-existing lifecycle API) | IMPLEMENTED (pre-existing) | IMPLEMENTED (pre-existing) | INTENTIONAL N/A | INTENTIONAL N/A | INTENTIONAL N/A | INTENTIONAL N/A (unproven) | IMPLEMENTED (Messages, Gate 5) | INTENTIONAL N/A (not in E2 scope) | IMPLEMENTED — untouched in E2, preserved |
| Empleos | IMPLEMENTED | IMPLEMENTED | IMPLEMENTED | IMPLEMENTED | IMPLEMENTED (Gate 4) | IMPLEMENTED (Gate 4, via Publish) | IMPLEMENTED (Gate 4) | INTENTIONAL N/A | INTENTIONAL N/A | INTENTIONAL N/A | IMPLEMENTED | IMPLEMENTED (Messages, Gate 5) | INTENTIONAL N/A (free/flat-fee lane) | IMPLEMENTED |
| Viajes | IMPLEMENTED | IMPLEMENTED | IMPLEMENTED | IMPLEMENTED | INTENTIONAL N/A (not in E2 scope; isolated product) | INTENTIONAL N/A | INTENTIONAL N/A | INTENTIONAL N/A | INTENTIONAL N/A | INTENTIONAL N/A | IMPLEMENTED | IMPLEMENTED (Messages, Gate 5) | INTENTIONAL N/A | IMPLEMENTED — untouched in E2, preserved |
| Comunidad | IMPLEMENTED | IMPLEMENTED (generic card) | IMPLEMENTED | IMPLEMENTED (Gate 4) | INTENTIONAL N/A | INTENTIONAL N/A | IMPLEMENTED | INTENTIONAL N/A | INTENTIONAL N/A | INTENTIONAL N/A | INTENTIONAL N/A (unproven) | IMPLEMENTED (Messages, Gate 5) | INTENTIONAL N/A (free) | IMPLEMENTED |
| Clases | IMPLEMENTED | IMPLEMENTED (generic card) | IMPLEMENTED | IMPLEMENTED (Gate 4) | INTENTIONAL N/A | INTENTIONAL N/A | IMPLEMENTED | INTENTIONAL N/A | INTENTIONAL N/A | INTENTIONAL N/A | INTENTIONAL N/A (unproven) | IMPLEMENTED (Messages, Gate 5) | INTENTIONAL N/A (free) | IMPLEMENTED |
| Busco | IMPLEMENTED | IMPLEMENTED (generic card) | IMPLEMENTED | IMPLEMENTED (Gate 4) | INTENTIONAL N/A | INTENTIONAL N/A | IMPLEMENTED | INTENTIONAL N/A | INTENTIONAL N/A | INTENTIONAL N/A | INTENTIONAL N/A (unproven) | IMPLEMENTED (Messages, Gate 5) | INTENTIONAL N/A (free) | IMPLEMENTED |
| Mascotas | IMPLEMENTED | IMPLEMENTED (generic card) | IMPLEMENTED | **INTENTIONAL N/A — no safe edit route exists by design** | INTENTIONAL N/A | INTENTIONAL N/A | IMPLEMENTED | INTENTIONAL N/A | INTENTIONAL N/A | INTENTIONAL N/A | INTENTIONAL N/A (unproven) | IMPLEMENTED (Messages, Gate 5) | INTENTIONAL N/A (free) | IMPLEMENTED — untouched in E2, preserved |
| Ofertas Locales | IMPLEMENTED (Gate 8, summary card) | INTENTIONAL N/A (own dedicated surface, by design) | IMPLEMENTED (own surface) | INTENTIONAL N/A (isolated product) | INTENTIONAL N/A | INTENTIONAL N/A | INTENTIONAL N/A | INTENTIONAL N/A | INTENTIONAL N/A | INTENTIONAL N/A | INTENTIONAL N/A (isolated) | INTENTIONAL N/A (isolated) | INTENTIONAL N/A (isolated) | IMPLEMENTED boundary — represented, not absorbed |
| Cupones (local_coupons) | IMPLEMENTED (rides Ofertas Locales pipeline) | INTENTIONAL N/A (same surface as Ofertas) | IMPLEMENTED (own surface) | INTENTIONAL N/A | INTENTIONAL N/A | INTENTIONAL N/A | INTENTIONAL N/A | INTENTIONAL N/A | INTENTIONAL N/A | INTENTIONAL N/A | INTENTIONAL N/A | INTENTIONAL N/A | INTENTIONAL N/A | IMPLEMENTED — no separate pipeline needed |

## Locked doctrine confirmed preserved

- Account identity, listing plan, payment, package entitlement, business tools access, placement, verification, promo/grant source, subscription state, and renewal remained independent truths everywhere touched — no surface conflates them.
- Locked pricing (15% verified-intro, Restaurantes/Servicios $399/mo with coupons included and no +$79/+$99 add-on, Autos Dealer $399/mo=10+Boost, Bienes Negocio $399/mo=1+Pack, 7-day grace) was read, never modified.
- Stripe checkout/webhook architecture, Package C subscription lifecycle primitives, Package C7 capacity RPCs, Package D placement architecture, Supabase schema, and auth/admin architecture were not touched.
- No second subscription, overlapping renewal, child checkout, fake "Renew" button, new Stripe route, or new subscription lifecycle primitive was created.
- Messages and Saved were built strictly from real, pre-existing data — no fabricated conversation threading, unread counts inference beyond real `read_at`, or fake saved records.

## Named blockers (final)

1. **Autos Dealer parent subscription renewal** — no Stripe Billing Portal integration exists anywhere in the app. A real fix requires new Package C subscription-management architecture, explicitly out of scope for E2.
2. **Bienes Negocio parent subscription renewal** — same root cause as above.
3. **Restaurantes pause/resume/archive** — no owner-facing lifecycle mutation backend exists (only an admin-only PATCH route). Building it is new lifecycle architecture, out of scope for E2.

These three are the only genuine architecture gaps this build could not close within its locked boundaries; everything else E1 identified as PARTIAL or MISSING and within E2's allowed file areas was closed with real, runtime-provable implementations.
