# LEONIX OWNER COMMAND CENTER
## MASTER WIRING + CONSTRUCTION BIBLE
### Version: 2026-09-09 (reconciled post-integration revision — same day)
### Purpose: Persistent source-of-truth for Claude / ChatGPT / Leonix engineering execution

> **RECONCILIATION NOTE**: This revision reconciles the Bible to the ACTUAL, CERTIFIED,
> COMMITTED, PUSHED, and PREVIEW-DEPLOYED source — checkpoint `ea99e57c1695138ec433766f33835830361b6ba7`.
> Every historical "current state" statement below has been either updated in place or explicitly
> marked HISTORICAL. See §33.1-§33.3 for the current canonical source record, the completed gate
> ledger, and the mandatory SOURCE CERTIFIED vs RUNTIME OWNER QA distinction. Doctrine/architecture
> sections (§1-§29, §34-§49) remain valid and are preserved; only current-state sections were
> reconciled.

---

# 1. PURPOSE

This document is the persistent operating contract for the **Leonix Owner Command Center / User Dashboard**.

It exists so future Claude sessions do not have to reconstruct the project from hundreds of chat messages.

The operating model is:

> **The systems already exist. The job now is to organize, connect, reconcile, and finish the wiring without cutting working cables or rebuilding canonical engines.**

This is a **network-rack integration problem**, not a greenfield dashboard build.

The Owner Command Center must organize the existing Leonix platform into one truthful, actionable owner experience.

The Owner Command Center must answer, quickly and clearly:

1. What do I own?
2. What needs my attention?
3. How are my listings/businesses performing?
4. What can I edit or manage?
5. What category-specific tools are available?
6. What is my payment / entitlement / lifecycle state?
7. What should I do next?
8. What does Leonix understand about my business?
9. What help can Leonix provide?
10. What happened after I took action?

---

# 2. CURRENT SOURCE-OF-TRUTH WORKTREES

## 2.1 Owner Command Center

**Worktree**

`C:\projects\elaguila-website-owner-command-center`

**Branch**

`integration/owner-command-center-globalization-2026-08`

**Pre-integration baseline commit (HISTORICAL — superseded below)**

`4cdbfb3abde7a6a57a5d610287bb04c654d6677b`

Commit message:

`feat(owner-dashboard): organize command center capability wiring`

**CERTIFIED CHECKPOINT — current canonical HEAD**

`ea99e57c1695138ec433766f33835830361b6ba7`

Commit message:

`feat(owner-dashboard): integrate owner command center control plane`

Pushed to `origin/integration/owner-command-center-globalization-2026-08` (origin HEAD confirmed
identical to local HEAD). Vercel Preview built and READY:
`https://leonix-media-o5ca0sah9-jesus-caceres-projects.vercel.app`. `main` and Production
untouched. Full certification evidence: §33.1-§33.3.

This branch is the canonical execution lane for:

- global owner dashboard shell
- `/dashboard`
- `/dashboard/mis-anuncios`
- owner entity workspaces
- owner category capability wiring
- owner-facing Business Tools presentation
- dashboard navigation
- category action organization
- owner commercial-state presentation
- owner analytics and lifecycle presentation

Do not move this work into the Concierge worktree.

---

## 2.2 Business Concierge

**Worktree**

`C:\projects\elaguila-website-concierge`

**Branch**

`feature/business-concierge-systemic-repair-2026-09`

**Latest saved Concierge commit**

`dbfa1fc3ba886e60dfe58087fd9e8653b9484920`

Commit message:

`feat(business-concierge): add owner-safe business home bridge`

This branch is the canonical execution lane for:

- Business Identity intelligence
- Living Business Book
- Health Map
- Next Right Move
- DIY Concierge / Action Plan
- Advisor / Needs Attention
- Approval Center
- Service Requests
- Outcomes
- Assistant readiness
- Promise Keeper
- Proposals
- Creative Studio owner-safe review paths
- owner-safe Concierge APIs and projections

Do not copy/paste these systems into Owner Command Center as parallel engines.

The Owner Command Center must **consume** them through owner-safe bridges.

**STATUS (checkpoint `ea99e57c`)**: the owner-safe dependency closure needed for
`/dashboard/business-tools` has already been reconciled and ported into the Owner Command Center
worktree (51 files: advisor, assistant, diyConcierge, healthMap, livingBook, outcomes, proposals,
stewardship, repositories, plus the composition route and access gate — zero staff/admin `.tsx`
files). This Concierge worktree/branch remains the source of truth for ongoing staff-side
Concierge engine development. Do not re-port files already reconciled (§33.1-§33.2); only port a
genuinely NEW owner-safe capability the Concierge branch adds later that Owner Command Center does
not yet consume.

---

# 3. CANONICAL ARCHITECTURE

The locked architecture is:

```text
GLOBAL DASHBOARD SHELL
        +
GLOBAL OWNER PRODUCT PAGE FRAME
        +
GLOBAL OWNER ENTITY WORKSPACE
        +
CANONICAL CAPABILITY TRUTH
        +
SMALL CATEGORY ADAPTERS
        =
COMPLETE OWNER EXPERIENCE
```

No category-specific dashboard islands.

No duplicate Business Concierge dashboard.

No separate analytics dashboard engine.

No duplicate entitlement logic.

No duplicate business identity.

No fake business-health or recommendation layer.

---

# 4. NETWORK-RACK WIRING DIAGRAM

```text
PUBLIC PRODUCT / BUSINESS PROCESS
              │
              ▼
      CANONICAL IDENTITY
  user / business / listing / parent-child
              │
              ▼
       CANONICAL DOMAIN TRUTH
 analytics / revenue / lifecycle / media /
 trust / contact / concierge / search
              │
              ▼
 OWNER-SAFE API / RESOLVER / PROJECTION
              │
              ▼
      OWNER COMMAND CENTER
              │
    ┌─────────┼──────────┐
    ▼         ▼          ▼
 /dashboard   /mis-anuncios   /business-tools
    │              │               │
 account       owner library     business intelligence
 command           │               │
 center            ▼               ▼
              ENTITY WORKSPACE   Concierge bridge
                    │
        ┌───────────┼─────────────┐
        ▼           ▼             ▼
    analytics    lifecycle    specialized tools
        │           │             │
        ▼           ▼             ▼
       real       same row      category-specific
      metrics     actions       capabilities
```

Everything visible in the owner UI must terminate in a real source.

Nothing should be a decorative or disconnected control.

---

# 5. GLOBAL OWNER DASHBOARD SHELL

Canonical shared shell already exists.

Key known components:

- `LeonixDashboardShell`
- `LX_DASH`
- `OwnerProductPageFrame`
- `OwnerEntityWorkspace`
- `ownerEntityCapabilityRegistry.ts`

The shell owns:

- sidebar / mobile drawer
- account identity
- page width
- responsive workbench
- page header grammar
- spacing grammar
- section hierarchy
- CTA semantic colors
- loading / empty / error presentation
- desktop / tablet / mobile behavior

No second dashboard shell should be created.

---

# 6. ACCOUNT COMMAND CENTER — `/dashboard`

Purpose:

> **What do I own, what needs attention, and what should I do now?**

Existing composition is expected to center around:

1. account identity / greeting
2. Needs Your Attention
3. truthful account performance
4. owned listings / businesses
5. recent real activity
6. business/growth capability

Known existing modules include:

- `OwnerAccountCommandCenter`
- `OwnerNeedsAttention`
- `OwnerAccountPerformance`
- `OwnerManagedEntitiesPreview`
- `OwnerRecentActivity`
- `OwnerBusinessGrowthEntry`

Rules:

- no fake KPIs
- no proxy counts presented as truth
- no unexplained "needs review" cards
- no stale numbers from unrelated sources
- attention items must explain cause where evidence exists
- owner should always know where to click next

---

# 7. OWNER ATTENTION TRUTH CONTRACT

Every actionable owner issue should answer:

1. **WHAT happened?**
2. **WHY is this being surfaced?**
3. **WHAT triggered it?**
4. **WHAT evidence supports it?**
5. **HOW serious is it?**
6. **WHAT should the owner do next?**
7. **WHAT happens if ignored, when knowable?**

If cause or evidence is not yet known:

- return `NEEDS_TRIAGE`
- do not fabricate a reason
- provide a clear investigation / next-step path

This rule applies to:

- payment failures
- expired / suspended listings
- incomplete business profile
- pending approvals
- service requests
- lead follow-up
- publication blockers
- moderation issues
- inventory capacity
- missing required business information
- Concierge recommendations
- stale draft / unsaved work
- renewal / reactivation

---

# 8. MIS ANUNCIOS — `/dashboard/mis-anuncios`

Purpose:

> **What do I own?**

This is the owner library, not the full entity workspace.

Each card should expose:

### Primary
- `Administrar anuncio`

### Secondary
- `Ver público`
- `Analíticas`
- lifecycle overflow actions where valid

Known debt:

`mis-anuncios/page.tsx` remains very large and historically mixes library browsing with some legacy lifecycle mutation behavior.

Do not perform a broad refactor during launch completion unless a real defect requires it.

The current priority is correct routing and capability truth, not aesthetic decomposition.

---

# 9. OWNER ENTITY WORKSPACE

This is the one canonical workspace for a listing/business.

Canonical section order:

1. Identity
2. Detail / key facts
3. Performance
4. Community Trust — only where applicable
5. External reputation — only real provider truth
6. Primary owner operation
7. Quick inspection/navigation
8. Lifecycle
9. Specialized tools
10. Real activity / leads / applications
11. Related create actions where meaningful

Category data varies.

Outer shell does not.

**STATUS (checkpoint `ea99e57c`)**: item 9 ("Specialized tools") may now render as ONE OR MORE
titled groups (`OwnerEntitySpecializedGroup[]`) — e.g. a category's own tools (coupons, inventory,
applications) plus a separate "Herramientas de negocio" (Business Tools) group side by side, never
one replacing the other. `OwnerEntityWorkspace`'s `specialized` prop accepts a single group (every
pre-existing caller, unchanged, byte-identical output) or an array (new multi-group callers:
Servicios, Restaurantes, Autos Dealer, Bienes Negocio). Mobile overflow already unions every
group's actions. See §33.2, Gate: Shared Specialized Tools.

---

# 10. CTA SEMANTICS — LOCKED

## Burgundy
Main owner operation.

Examples:
- Administrar anuncio
- Editar anuncio
- Editar negocio

## Neutral / Cream
Inspection / navigation.

Examples:
- Ver público
- Vista previa
- Analíticas
- Resultados

## Green
Restore / reactivate.

Examples:
- Reactivar
- Restaurar

## Amber
Temporary lifecycle caution.

Examples:
- Pausar

## Red
Consequential or terminal operations.

Examples:
- Archivar
- Marcar vendido
- Cerrar vacante
- Eliminar where truly authorized

## Gold
Specialized Leonix capabilities.

Examples:
- Gestionar inventario
- Aplicaciones
- Solicitudes
- Ofertas / Cupones
- campaign-specific tools
- Business Concierge actions

Do not leave legacy random colors when a canonical semantic role exists.

**STATUS (checkpoint `ea99e57c`)**: `LeonixRealEstateListingManageCard.tsx` (the Bienes Raíces
library card in `mis-anuncios/page.tsx`) had "Archivar" rendering neutral gray and "Marcar
vendido" rendering gold/tan instead of the locked Red — corrected to the canonical red palette.
Pause (amber), Resume (green), and the primary "Administrar" doorway (burgundy) were already
correct. The card's own secondary "Editar" shortcut link still uses a non-canonical color
differing from its row-siblings — a softer, no-explicit-rule-violated case, deliberately left for
a future product decision (§48).

---

# 11. CATEGORY CAPABILITY MODEL

Every category uses:

```text
shared workspace
+
capability registry
+
small category adapter
```

The dashboard must not infer actions by visual convention.

Actions must come from truthful category capability logic.

---

# 12. CATEGORY OWNER ACTION MATRIX

## Servicios

Expected owner capabilities:

- edit
- public view
- analytics
- leads / quote requests
- Community Trust
- external reputation links where real
- coupons/offers
- lifecycle
- business tools

Known repair already made:

Servicios coupons/offers workspace wiring previously depended on the retired standalone offers add-on truth.

It was repaired to consume canonical package entitlement truth through the same shared pattern already used by Restaurantes.

## Restaurantes

Expected:

- edit
- public
- results
- analytics
- Community Trust
- Google/Yelp direct links where real
- coupons/offers
- lifecycle
- business tools

Current commercial truth:

`$399/month`

Coupons included in base package.

## Comida Local

Expected:

- edit
- public
- analytics
- business/contact tools where real
- location/privacy tools
- lifecycle

Current commercial truth:

`$129/month`

Preserve seller-specific privacy/current-location behavior.

## Autos Dealer

Expected:

- parent business identity
- analytics
- inventory management
- add vehicle
- edit vehicle
- capacity
- public
- lifecycle
- dealer reputation/business tools where real

Commercial truth:

`$399/month` includes 10 active vehicles.

`+$129/month` adds 10 additional active vehicles.

Each vehicle is an independent child row with its own identity/media/analytics.

Parent lifecycle gates child visibility.

Do not delete child records when parent suspends.

## Autos Privado

Expected:

- edit
- public
- analytics
- lifecycle
- expiry/renewal

Commercial truth:

`$24.99 / 30 days`

No dealer-only tools.

## Bienes Raíces Negocio

Expected:

- parent business identity
- analytics
- property inventory
- add property
- edit property
- capacity
- public
- lifecycle

Commercial truth:

`$399/month` includes 1 active property.

`+$99/month` adds 3 additional properties.

Total with one add-on: 4 active properties.

Each property is an independent child row.

## Bienes Raíces Privado / FSBO

Expected:

- edit
- public
- analytics
- lifecycle
- expiration/renewal

Commercial truth:

`$49.99 / 45 days`

## Rentas

Expected:

- edit
- public
- analytics where supported
- leads/contact where supported
- lifecycle

Commercial truth:

`$24.99 / 30 days`

## Empleos

Expected:

- edit
- public
- analytics
- applications
- close / archive
- lifecycle

Paid product truth:

`$24.99 / 30 days`

Feria/community lane can be free.

Feria should not inherit Applications if the underlying lane does not support it.

## En Venta / Varios

Expected:

- edit
- public
- analytics where real
- mark sold
- lifecycle

Free vs Pro content tier rules remain separate from payment entitlement truth.

## Clases

Expected:

- edit
- public
- analytics/contact where real
- lifecycle

Commercial truth:

Paid lane `24.99 / 30 days`

Free lane `$0`

## Comunidad / Eventos

Expected:

- edit
- public
- analytics where real
- lifecycle

Community Trust generally N/A for one-off events unless attached to a qualifying organizer/business profile.

## Busco / Se Busca

Expected:

- edit
- public
- contact / analytics where real
- lifecycle

Community Trust generally N/A.

## Mascotas / Perdidos / Adopción

Expected:

- edit
- public
- contact / analytics where real
- lifecycle

Community Trust generally N/A.

## Ofertas Locales

Protected specialized engine.

Expected:

- campaign management
- flyer/coupon management
- analytics
- public campaign view
- campaign-specific tools
- lifecycle / expiration

Commercial truth:

Flyer: `$399 / 30 days`

Coupon: `$199 / 30 days`

Do not rewrite protected Ofertas internals from the Owner Command Center.

Only converge the outer owner presentation where safe.

## Viajes

Separate workstream.

Owner Command Center may expose canonical owner navigation only where the current integration supports it.

Do not rewrite Viajes source from the dashboard worktree.

## Iglesias

No fabricated owner infrastructure.

Remain explicit future / unsupported until ownership model exists.

---

# 13. COMMERCIAL TRUTH CONTRACT

These concepts are separate and must never be collapsed:

- account identity
- business identity
- listing identity
- plan
- payment
- subscription
- package entitlement
- placement
- verification
- promotion
- coupon/offers capability
- inventory boost
- recurring consent
- courtesy / comp / partner treatment
- Business Concierge eligibility
- managed-service state

The dashboard must consume canonical truth.

It must not guess.

---

# 14. CURRENT LOCKED PRICING TRUTH

| Category / Lane | Price |
|---|---:|
| Servicios | $399/month |
| Restaurantes | $399/month |
| Comida Local | $129/month |
| Rentas | $24.99/30 days |
| Autos Privado | $24.99/30 days |
| Autos Dealer | $399/month, 10 active |
| Autos Dealer inventory boost | +$129/month, +10 |
| Bienes Privado / FSBO | $49.99/45 days |
| Bienes Negocio | $399/month, 1 active |
| Bienes Negocio inventory boost | +$99/month, +3 |
| Empleos paid | $24.99/30 days |
| Ofertas Flyer | $399/30 days |
| Ofertas Coupon | $199/30 days |
| Clases paid | $24.99/30 days |
| Clases free | $0 |

Any owner-facing capability badge or upsell must match current product truth.

---

# 15. KNOWN COMMERCIAL TRUTH ISSUE CLASS

A key lesson from current work:

A dashboard may correctly call the canonical resolver but still show:

`Cupones y ofertas — No incluido`

because the listing lacks a real entitlement row.

That is not automatically a UI bug.

The correct diagnostic model is:

```text
pricing matrix says included
+
checkout/package exists
+
dashboard resolver is correct
+
listing entitlement row missing
=
provisioning/data-state question
```

Do not "fix" this by loosening entitlement rules or fabricating entitlement.

---

# 16. LIFECYCLE CONTRACT

Canonical listing lifecycle:

```text
Application
→ Preview
→ Checkout if applicable
→ Publish
→ Public
→ Dashboard
→ Edit
→ Preview/Public after edit
→ Republish
```

For active fixed-term paid listings:

- edit the same canonical row
- preserve Leonix ID
- preserve listing UUID
- preserve analytics
- preserve media
- preserve history
- preserve entitlement
- do not repeat base charge
- do not reset term

For expired fixed-term listings:

- hide from normal public discovery
- preserve row/media/ID/analytics/dashboard/admin
- renewal/reactivation required

Payment failure/grace:

- preserve content
- suspend visibility/add-ons if unresolved
- restore after payment
- never delete customer content

---

# 17. SAME-ROW / NO-RECHARGE DOCTRINE

An active entitled edit is not a new sale.

The edit path must:

- hydrate the real published listing
- preserve canonical listing ID
- preserve owner
- preserve package
- preserve media
- preserve analytics
- preserve existing child identities
- save/republish to the same row
- not trigger a new base checkout

A new checkout is appropriate only when the listing/product state truly requires renewal/reactivation/new entitlement.

---

# 18. PARENT / CHILD IDENTITY

## Autos Dealer

- parent dealer record
- child vehicle rows
- capacity enforced separately
- one vehicle cannot silently become another vehicle
- legitimate correction is allowed
- child identity/history must persist
- parent inactive/suspended gates visibility, not deletion

## Bienes Negocio

- parent real-estate business
- child property rows
- one property cannot silently become a different property
- legitimate correction allowed
- property identity/media/analytics must persist
- parent state gates child visibility

---

# 19. ANALYTICS CONTRACT

Analytics is a shared engine.

The dashboard consumes it.

It does not invent its own recorder.

Owner-facing analytics should preserve canonical identity:

- listing ID
- owner ID
- category
- event type
- sanitized metadata

Known tracked actions across the platform include:

- listing view
- listing open
- save
- like
- share
- call
- SMS
- WhatsApp
- email
- website
- directions
- lead
- application
- checkout start
- checkout success
- payment success where applicable

Rules:

- prevent self-engagement where appropriate
- avoid duplicate view emitters
- sanitize PII
- category adapters must use the same canonical event system

If one category works correctly, use it as the reference implementation for another category instead of creating another analytics stack.

---

# 20. MESSAGES / LEADS / APPLICATIONS

Owner UI must show these only when real support exists.

Examples:

Servicios:
- quote requests / leads

Empleos:
- applications

Business Concierge:
- service requests
- approvals

Do not show empty fake modules for unsupported categories.

---

# 21. COMMUNITY TRUST

Community Trust is not a generic star-rating clone.

Current doctrine:

- real persisted endorsement votes
- server-derived identity
- dedupe
- atomic toggle
- truthful zero
- no seeded fake ratings

Business-profile contexts may support it.

Private classifieds generally do not.

For launch:

- preserve the existing real endorsement/like behavior
- do not expand into a fancy new review system
- owner/Admin visualization can remain lighter if public behavior is truthful

---

# 22. GOOGLE / YELP REPUTATION

For launch:

- real direct links matter
- existing provider URLs should remain
- no fake ratings
- no fake review counts
- no owner-entered review number masquerading as provider truth

Fancy quick-view reputation drawer is deferred.

The dashboard may show provider links only when real destinations exist.

**STATUS (checkpoint `ea99e57c`)**: wired and LIVE for Servicios and Restaurantes — the only two
categories the capability registry marks `externalReviews: "supported"`. Before this checkpoint,
`OwnerEntityWorkspace`'s `externalReputation` prop and its `OwnerEntityExternalReputation`
component existed but had ZERO real callers anywhere in the repo (a real BUILT_NOT_WIRED gap, not
a doctrine violation — the component itself always did the right thing: render nothing without a
real link). Servicios reads `profile_json.contact.externalReviewLinks.{googleReviewsUrl,
yelpReviewsUrl}` (already selected server-side); Restaurantes reads the already-selected
`listing_json.googleReviewUrl`/`.yelpReviewUrl`. Both validate through the exact same URL-safety
helper their respective public pages already use — no new validation logic. No other category
exposes this CTA.

---

# 23. LEGACY SERVICIOS STAR RATING

A legacy owner-entered Servicios numeric star rating still exists in source.

Known location from prior audit:

`ServiciosProfessionalHero.tsx`

It is separate from Leonix Community Trust.

Do not silently equate it with Google/Yelp or Community Trust.

Its long-term disposition requires deliberate product handling.

Until resolved, do not expand it or use it as canonical reputation truth.

---

# 24. MEDIA CONTRACT

Shared media systems should preserve:

- selected images
- cover
- gallery
- ordering
- videos
- flyer/PDF
- draft refs
- publish refs
- active edit hydration
- republish persistence

The dashboard must not become a second media storage engine.

If media exists but an owner edit cannot hydrate it, that is a wiring defect.

If media is dropped during publish/republish, that is launch-critical.

---

# 25. CONNECTION HUB / CTA CONTRACT

Visible CTAs must point somewhere real.

Examples:

- call
- SMS
- WhatsApp
- email
- website
- directions
- additional websites
- social links
- Google
- Yelp

Rules:

- no empty href
- no fake maps
- no fake provider
- no fake open state
- no raw technical errors
- private seller behavior may differ from business seller behavior

---

# 26. SAVED SEARCH / NOTIFICATIONS / RECENT ACTIVITY

These are shared systems.

Owner Dashboard should consume existing engines.

Do not create parallel storage.

Key expectations:

Saved Search:
- creation
- storage
- filters
- category
- location
- language
- notification preference
- dashboard management
- disable/delete
- scheduler/match process where real

Notifications:
- only truthful triggers
- no fake attention
- correct owner scoping

Recent activity:
- show only real persisted activity
- honest empty state is acceptable

---

# 27. BUSINESS TOOLS — `/dashboard/business-tools`

This page must not feel like a generic directory of equal cards.

It is the owner-facing orchestration surface for Business Concierge.

Canonical hierarchy:

```text
BUSINESS IDENTITY

WHAT MATTERS NOW
├─ Next Right Move
└─ Needs Your Attention

BUSINESS HEALTH

YOUR ACTION PLAN

WHAT LEONIX UNDERSTANDS

WORK WITH LEONIX
├─ approvals
├─ service requests
└─ proposals

PROGRESS / RESULTS

ASSISTANT
only if available

LEARNING
only when real recommendation→lesson mapping exists
```

**STATUS (checkpoint `ea99e57c`)**: this hierarchy is LIVE at `/dashboard/business-tools`,
composed by `BusinessConciergeOwnerHome.tsx` from the real `GET /api/dashboard/business/home`
response. Learning renders `null`/unavailable honestly — no real recommendation→lesson mapping
exists yet (unchanged, §47). Approvals/Service Requests/Proposals render real counts and data as
plain text with an explicit read-only disclosure line when either count is nonzero (Gate 14) — no
individual review/decision action route exists anywhere in the repo yet (confirmed by search
during the CTA Truth gate). This is an honest absence of interactivity, not a fake or dead control;
a review/decision UI is future work, not a launch blocker (§48).

**STATUS (Gate 14.1 — visual hierarchy hard close)**: the "must not feel like a generic directory
of equal cards" rule above is now visually enforced, not just structurally correct. What Matters
Now (highest operational emphasis) renders in the same `LX_DASH.pageHero` treatment as the page's
own header, under a real umbrella heading; Business Health + Action Plan are grouped as the
secondary operational tier; Understands/Work With Leonix/Progress/Assistant remain the plain-panel
supporting/outcome tier. No new design system — every treatment reused an existing theme primitive.

---

# 28. BUSINESS CONCIERGE OWNER-SAFE BRIDGE

The Concierge branch has built:

`app/api/dashboard/business/home/route.ts`

and:

`app/lib/business/businessHome/access.ts`

Canonical business identity:

`public.businesses.id`

The composition endpoint uses exact business membership authorization and owner-safe shaping.

**STATUS (checkpoint `ea99e57c`)**: both files above — along with the full owner-safe dependency
closure (advisor, assistant, diyConcierge, healthMap, livingBook, outcomes, proposals,
stewardship, repositories/businessesRepo+membershipsRepo+selectShrink, supabaseUserClient,
featureFlagLogic, types — 51 files total) — are now RECONCILED and LIVE inside the Owner Command
Center worktree at these exact relative paths, not merely described from the Concierge branch.
Zero staff/admin `.tsx` files in the closure (100% `.ts` domain logic + 2 API routes:
`app/api/dashboard/business/home/route.ts`,
`app/api/dashboard/business/diy-concierge/my-businesses/route.ts`).

Known sections available from the Concierge bridge:

- Business Identity
- Next Right Move
- Business Health
- Action Plan
- What Leonix Understands
- Needs Attention
- Approvals
- Service Requests
- Proposals
- Progress / Outcomes
- Assistant readiness

Learning remains intentionally `null` until a real recommendation-to-learning mapping exists.

Promise Keeper does not yet have a dedicated owner summary route, but due/blocked commitment signals can already reach the owner through Advisor / Needs Attention.

Creative Studio has a mature owner-safe dedicated workflow and does not have to be duplicated in the Business Home summary.

---

# 29. BUSINESS CONCIERGE AUTHORIZATION RULE

For owner-facing Business Home:

- caller supplies explicit `businessId`
- authenticated user must have exact active membership
- membership proof is for exact `(businessId, userId)`
- every downstream domain read uses the verified business
- no raw staff tables
- no internal notes
- no failed recommendation candidates
- no raw AI research
- no private evidence
- no provider logs
- no raw meeting transcripts
- no internal override rationale

Owner A must never see Owner B business data.

---

# 30. OWNER COMMAND CENTER BUILD STATUS (PRE-INTEGRATION BASELINE — see §33.1 for current state)

The Owner Command Center branch already contains a substantial prior implementation.

Known built/shared pieces:

- `LeonixDashboardShell`
- `LX_DASH`
- `OwnerProductPageFrame`
- `OwnerEntityWorkspace`
- capability registry covering many category families
- Account Command Center
- Mis Anuncios library
- category workspaces
- Servicios / Restaurantes / Empleos / Autos / Bienes / Viajes / Ofertas / generic catalog adoption
- category-specific inventory adapters
- commercial entitlement presentation logic
- owner category navigation

This is not a from-scratch build.

**STATUS (checkpoint `ea99e57c`)**: all of the above remains true AND is now further completed by
the full Concierge owner-safe bridge, the canonical `OwnerAttentionItem` model, multi-group
specialized tools, and the CTA/lifecycle/cross-category repairs recorded in §33.1-§33.2. This is
now the current, certified, post-integration build — not merely "a substantial prior
implementation." See §33.1 for the exact current build status.

---

# 31. OWNER COMMAND CENTER ORGANIZATION PASS (HISTORICAL — superseded by checkpoint `ea99e57c`, see §33.1)

Saved commit:

`4cdbfb3abde7a6a57a5d610287bb04c654d6677b`

Key changes included:

- improved sidebar organization
- conditional `Mis Espacios`
- category navigation for Restaurantes / Empleos / Viajes
- removal of dead retired product upsell CTA
- Servicios coupon/offers entitlement presentation reconciliation
- verifier coverage for the organization pass

Known focused verification from that pass:

- organization verifier: `17/17 PASS`
- final reconciliation verifier: `182/182 PASS`
- no new TypeScript errors
- lint pass
- diff check pass
- final build pass

---

# 32. BUSINESS CONCIERGE GATE 2 STATUS (HISTORICAL SOURCE COMMIT — reconciled into Owner Command Center, see §33.1)

Saved commit:

`dbfa1fc3ba886e60dfe58087fd9e8653b9484920`

Known new/changed files:

- `app/lib/business/proposals/logic.ts`
- `app/lib/business/businessHome/access.ts`
- `app/api/dashboard/business/home/route.ts`
- `scripts/test-business-home-owner-safe-shaping.ts`
- `scripts/verify-business-home-owner-bridge-01.ts`

Known verification:

- owner-safe shaping: `5/5 PASS`
- owner bridge structural verifier: `18/18 PASS`
- actor safety: `156/156 PASS`
- sales workspace: `106/106 PASS`
- staff command center Gate 1: `24/24 PASS`
- business ownership claim: `23/23 PASS`
- 0 new TypeScript errors
- build pass
- no migration

---

# 33. INTEGRATION GAP STATUS: CLOSED (formerly "CURRENT INTEGRATION GAP")

The gap this section used to describe —

> Owner Command Center presentation exists, Concierge owner-safe data bridge exists, but the
> Owner Command Center has not yet been reconciled to consume the Concierge branch source.

— is **CLOSED** as of checkpoint `ea99e57c1695138ec433766f33835830361b6ba7`. All 7 steps this
section used to prescribe were completed:

1. ✅ Concierge commit dependency closure inspected (BFS from `route.ts` + `access.ts`, 52 files,
   0 unresolved)
2. ✅ minimum coherent owner-safe Concierge dependency set ported (51 files landed)
3. ✅ zero staff/admin Concierge UI in Owner Command Center (0 `.tsx` files in the closure)
4. ✅ `/dashboard/business-tools` wired to the real Business Home composition
5. ✅ exact-business authorization preserved (`(businessId, userId)` exact active membership)
6. ✅ truthful unavailable states preserved (Learning `null`, honest "no canonical business yet"
   fallback copy)
7. ✅ no duplicate Concierge engine created (confirmed by the 182-check final reconciliation
   verifier's protected-file non-touch proof)

See §33.1 for the current canonical source record and §33.2 for the full completed-gate ledger.

---

## 33.1 CURRENT CANONICAL SOURCE — CERTIFIED CHECKPOINT

```text
WORKTREE:            C:\projects\elaguila-website-owner-command-center
BRANCH:               integration/owner-command-center-globalization-2026-08
COMMITTED BASE (pre): 4cdbfb3abde7a6a57a5d610287bb04c654d6677b
CERTIFIED CHECKPOINT: ea99e57c1695138ec433766f33835830361b6ba7
CHECKPOINT MESSAGE:   feat(owner-dashboard): integrate owner command center control plane
ORIGIN STATE:         pushed — origin/integration/owner-command-center-globalization-2026-08
                      HEAD confirmed identical to local HEAD (ea99e57c)
TRACKED WORKTREE:     clean at the checkpoint (only a local-only .claude/ tooling artifact left
                      deliberately uncommitted, per policy)
VERCEL PREVIEW:       READY — https://leonix-media-o5ca0sah9-jesus-caceres-projects.vercel.app
                      (deployed commit confirmed = ea99e57c via githubCommitSha/githubCommitRef)
PRODUCTION:           untouched (no production deploy triggered)
MAIN:                 untouched (no merge, no push to main)
```

Durable state files (all committed at this checkpoint):
- `docs/owner-command-center/OWNER_COMMAND_CENTER_PROGRESS.md`
- `docs/owner-command-center/OWNER_COMMAND_CENTER_TESTS.json`
- `docs/owner-command-center/OWNER_COMMAND_CENTER_CABLE_MAP.md`

---

## 33.2 COMPLETED GATE LEDGER

| # | Gate | Outcome | Key files/systems |
|---|---|---|---|
| 1 | Concierge owner-safe bridge reconciliation | PASS | 51-file dependency closure ported (advisor, assistant, diyConcierge, healthMap, livingBook, outcomes, proposals, stewardship, repositories, supabaseUserClient, featureFlagLogic, types); `app/api/dashboard/business/home/route.ts`, `app/api/dashboard/business/diy-concierge/my-businesses/route.ts`; `/dashboard/business-tools` wired to real Business Home composition; exact `(businessId, userId)` membership authorization; 0 staff/admin `.tsx` in closure |
| 2 | Owner Attention Truth | PASS | Canonical `OwnerAttentionItem` contract (`app/(site)/dashboard/lib/ownerAttentionModel.ts`); `mapDerivedFeedItemToAttention`/`mapAdvisorSignalToAttention`; new owner-safe moderation-evidence projection (`app/api/dashboard/listing-moderation-reasons/route.ts`); PROVEN/PARTIAL/NEEDS_TRIAGE doctrine; shared `OwnerAttentionItemCard` used by both `/dashboard` and `/dashboard/business-tools`; verifier 22/22 PASS |
| 3 | Category Capability + Commercial Entitlement | PASS (verification-only, 0 source changes) | Confirmed Autos Dealer 10+10 capacity, Bienes Negocio 1+3 capacity, Servicios/Restaurantes coupons shared pattern, Feria/Applications exclusion — all already correct; found `specialized.businessTools` BUILT_NOT_WIRED (deferred to next gate: shared-component shape blocked it) |
| 4 | Shared Specialized-Tools Multi-Group | PASS | `OwnerEntityWorkspace`'s `specialized` prop now `OwnerEntitySpecializedGroup \| OwnerEntitySpecializedGroup[]` (backward-compatible); new `app/(site)/dashboard/lib/ownerBusinessToolsSpecializedGroup.ts` adapter; wired Business Tools group into Servicios, Restaurantes, Autos Dealer, Bienes Negocio without replacing their existing coupons/inventory groups; verifier 33/33 PASS |
| 5 | Lifecycle + Same-Row + No-Recharge | PASS (verification-only, 0 source changes) | Traced every category's pause/resume/archive/reactivate/markSold/renew path to a real, same-row, id-scoped server route or atomic RPC (`activateAutosDealerListingAtomic`, `activateBrNegocioListingAtomic`); no wrong recharge found; corrected a routing attribution (Autos Privado is fully handled in `AutosDealerInventoryDashboardSection.tsx`, not the generic `mis-anuncios/[id]` page) |
| 6 | Owner Actionability / CTA Truth | PASS | Repaired 2 real defects: (a) Google/Yelp `externalReputation` was 100% unwired despite the registry declaring it supported — wired for Servicios + Restaurantes using already-selected data and existing URL validators; (b) Empleos "Aplicaciones" anchor scrolled past its own content — added a real `id` to `OwnerEntityActivity`'s section and removed the stray marker |
| 7 | Cross-Category Owner Experience Consistency | PASS | Found and fixed one action-tone inconsistency: `LeonixRealEstateListingManageCard.tsx`'s Archive/Mark Sold buttons used non-canonical colors instead of the locked Red semantic — 4-line className fix, zero behavior change; confirmed no dashboard islands, no duplicate shells |
| 8 | Final Source Integration Certification | PASS | Re-ran all above verifiers (22/22, 33/33, lifecycle PASS, 182/182 whole-product reconciliation); found and fixed 1 genuine TypeScript regression from Gate 6 (servicios.tsx type-inference issue, zero behavior change); full production build PASS (86s local); 0 new lint findings across 74 accumulated files |
| 9 | Checkpoint + Preview Deployment | PASS | Committed `ea99e57c` (77 files, 12607 insertions/127 deletions); pushed to origin feature branch only; Vercel Preview built and READY in ~301s on a dedicated build machine; commit/branch verified to match exactly; Production/main untouched |
| 10 | Documentation Durability (this Bible → repo) | PASS | Copied this reconciled Bible into `docs/owner-command-center/` (byte-identical), added canonical-location pointers to progress/tests/cable-map, committed `d715d0f3` and pushed |
| 11 | Product/UX Completion | PASS, **uncommitted** | Reviewed all 16 categories against the 10-question UX Definition of Done and 8 UX dimensions. Found and repaired one real cross-category safety inconsistency: "Mark Sold"/"Archive" (same Red/terminal semantic everywhere) lacked a confirmation dialog in 3 spots (generic entity workspace Mark Sold, En Venta card Mark Sold, Empleos Archive list+detail) while BR's card already confirmed both — added the app's existing `confirm()` pattern to all 3. Investigated and deliberately did NOT rename Empleos' "Archivar anuncio" to "Cerrar vacante" (a prior audit already established no distinct close-vacancy mutation exists — the generic label is the honest one). 4 previously-deferred items re-evaluated, none promoted to blockers. See `docs/owner-command-center/OWNER_COMMAND_CENTER_PROGRESS.md` Gate 10 for full detail. **Not yet committed/pushed as of this revision.** |
| 12 | UI + Responsive Completion | PASS, **uncommitted** | Reviewed actual Tailwind/CSS composition at 390/768/1440px for every shared workspace component and every category's real usage. Confirmed `LeonixDashboardShell`, `OwnerEntityPerformance`, `DashboardListingActionBar`, `DashboardMobileActionSheet`, and `OwnerEntityHeader` were already correctly responsive by construction (single nav mechanism per breakpoint, metrics/badges flex-wrap, one tone→color mapping guaranteeing CTA semantics, scrollable full-width mobile action sheet). Found and repaired one real clipped-text defect: Autos Dealer's inventory-capacity sentences ("10 de 10 vehículos activos", "Te quedan N espacios disponibles") could truncate in `OwnerEntityDetailGrid`'s 2-column 390px cell. Fixed with a new optional `wide?: boolean` on `OwnerEntityDetailItem` (spans full row, skips truncate) — backward-compatible, every other caller unaffected. Re-evaluated the deferred real-estate "Editar" shortcut color from a pure visual-system angle: does not violate locked CTA semantics, left deferred. See `docs/owner-command-center/OWNER_COMMAND_CENTER_PROGRESS.md` Gate 11 for full detail. **Not yet committed/pushed as of this revision.** |
| 13 | FINAL SHIP-READINESS SOURCE/BUILD CERTIFICATION | PASS, **uncommitted** | Heavy validation authorized and performed on the Gate 10+11 candidate. Confirmed 10-file diff (6 app + 4 docs, 86/-10 lines) traces entirely to Gates 10-11 — no scope expansion. Re-ran all 6 focused verifiers (22/22, 33/33, OK, PASS, PASS, 182/182) — all still PASS, confirming Gate 10's Empleos edits did not disturb the multi-group specialized-tools contract. Full `tsc --noEmit` byte-identical to the established 7-error e2e-only baseline — 0 new errors. Lint: 0 new findings across the 6 changed files (the same 6 pre-existing `mis-anuncios/page.tsx` findings, already confirmed present in the committed checkpoint). `git diff --check` PASS. One full production build PASS (`NODE_OPTIONS=--max-old-space-size=12288`, exit 0, "Compiled successfully in 2.2min," all key routes present). Final regression trace confirmed lifecycle destinations, specialized mobile actions, Business Tools, external reputation, Empleos applications anchor, category adapters, and the Ofertas/Viajes boundary are all intact. **Source-fixable ship blockers: NONE.** One environment condition (a competing heavy process, 48 node workers, free memory as low as ~600KB) was correctly waited out rather than raced against, per this gate's resource-control directive. **Runtime owner QA remains NOT performed — §33.3's distinction still applies.** See `docs/owner-command-center/OWNER_COMMAND_CENTER_PROGRESS.md` Gate 12 for full detail. **Subsequently committed as `ce82252e22c9d75c815875627cfcdae6f0dd53b0` and pushed (see §33.1/PROGRESS.md Gate 13); superseded by Gates 14-15 below, which remain uncommitted on top of it.** |
| 14 | PRE-QA 100% Product Completion Pass | PASS, **uncommitted** | Coach-clarified doctrine: runtime QA locked until the product is 100% complete, not used to discover missing UX/UI. Six parallel evidence-only research passes across every owner surface found and repaired 9 real defects (Rentas showing an unsupported Mark Sold action; Autos Privado missing a reactivate action + miscolored Archive; Servicios' coupons section silently vanishing with no explanation; Bienes Negocio duplicate add-property CTAs + an always-visible "unlock" button; Business Tools' Work With Leonix counts undisclosed as read-only; the `wide` detail-grid escape hatch not propagated to 6 other long-text call sites; account panel truncation risk) across 12 files, using only existing shared components/patterns. One hypothesis (Comida Local `contactHub`/`translateAd`) investigated and found NOT a defect; one latent gap (Autos Privado's unreachable generic-page fallback) investigated and left unfixed as genuinely unreachable. See `docs/owner-command-center/OWNER_COMMAND_CENTER_PROGRESS.md` Gate 14 for full detail. |
| 14.1 | Business Tools Visual Hierarchy Hard Close | PASS, **uncommitted** | Coach flagged a real contradiction in Gate 14 (WEAK_UI open alongside "zero blockers"). Fully implemented the Master Bible §27 locked hierarchy in `BusinessConciergeOwnerHome.tsx` using only existing theme primitives — What Matters Now promoted to the existing `LX_DASH.pageHero` treatment with a real umbrella heading (activating a previously-unused copy key); Business Health + Action Plan grouped as the secondary tier; the remaining sections left as the plain-panel supporting tier. Re-confirmed Recent Activity and Business Growth entry already read as intentionally complete. See PROGRESS.md Gate 14.1 for full detail. |
| 15 | FINAL PRE-QA SOURCE/BUILD CERTIFICATION | PASS, **uncommitted** | Heavy validation on the complete Gates 14+14.1 candidate (12 app files + 4 docs). All 6 canonical verifiers re-run (22/22, 33/33, OK, PASS-with-one-explained-scope-boundary-exception, PASS, 182/182); full `tsc --noEmit` byte-identical to the 7-error e2e-only baseline (0 new); full production build PASS ("Compiled successfully in 89s"); architecture regression trace confirmed zero core/protected files touched. Resource contention (another session spiking to 47 node.exe workers) waited out twice rather than raced. **PRE-QA PRODUCT CONSTRUCTION: COMPLETE. FINAL PRE-QA SOURCE/BUILD CERTIFICATION: PASS. OWNER QA: NOT YET PERFORMED** — its purpose from here is final runtime confirmation/polish of an already-complete product. Subsequently committed as `f2508a9a`, pushed, Preview READY. See PROGRESS.md Gate 15 for full detail. |
| 16 | FINAL PRE-RELEASE PRODUCT-CONSTRUCTION AUDIT | PASS, **uncommitted** | Last construction gate before main/Production, on top of committed checkpoint `f2508a9a`. Four parallel evidence-only passes (mechanical TODO/placeholder/dead-control scan, dead/built-not-wired component scan confirming shell singularity, cognitive-load/information-architecture review, skeptical spot-check re-verification of 5 prior-gate fixes) found and repaired 5 real defects: En Venta's renewal CTA visually outranking the canonical primary doorway on the default-selected category, 3 raw error/internal-terminology leaks (Viajes ×3 sites, Restaurantes RLS/Supabase copy), an off-palette stone-gray Archive button, and a duplicate "Publicar" CTA on the Account Command Center. All 6 canonical verifiers re-run (22/22, 33/33, OK, PASS, PASS, 182/182 — Rentas verifier's protected-file guard clean this time, no Bienes files touched); full `tsc --noEmit` 0 new errors; full production build PASS ("Compiled successfully in 2.9min"). **FINAL PRODUCT CONSTRUCTION CERTIFICATION: 100% PASS.** See PROGRESS.md Gate 16 for full detail. |

---

## 33.3 SOURCE CERTIFIED vs RUNTIME OWNER QA — MANDATORY DISTINCTION

**SOURCE CERTIFIED (complete, as of `ea99e57c`)**: the code compiles, lints clean, builds clean
(locally and on Vercel), passes every focused/whole-product verifier, and has been traced
file-by-file for capability truth, lifecycle truth, CTA truth, and cross-category consistency.
This proves the SOURCE is coherent, wired, and internally consistent.

**RUNTIME OWNER QA (NOT YET PERFORMED)**: no one has yet signed in as a real owner in a browser
and clicked through the flows in §50 (Final Completion Gate) against the certified Preview. A
clean build and passing static verifiers do NOT prove: real Supabase data renders correctly,
authenticated session behavior is correct, visual/responsive behavior matches intent, or that a
runtime-only defect (a race condition, a missing env var in Preview, a data-shape mismatch only
visible with real rows) doesn't exist.

**Do not mark §50's checklist as passed, and do not tell a business owner the dashboard is ready,
until runtime QA has actually been performed on the Preview URL above.**

---

## 33.4 PRE-QA 100% PRODUCT COMPLETION — DOCTRINE AND CURRENT RECORD

**Doctrine (Coach-clarified, supersedes any earlier statement that runtime QA is "the only phase
remaining"):**

> **Owner QA is not a development phase. QA begins only after the entire Owner Command Center is
> already 100% complete in function, UX, UI, responsive behavior, navigation, states, copy,
> category coverage, owner actions, and empty/error/loading behavior. QA is reserved strictly for
> final polish/confirmation, never for discovering missing product.**

Concretely, this means:

- Runtime owner QA (§50) is **LOCKED** until this section records zero source-fixable pre-QA
  completeness blockers.
- A prior gate labeling something `SHIP_READY`, a passing verifier, a compiling build, or a route
  existing are NOT by themselves evidence of product completeness — only evidence of source
  correctness (§33.3 still applies: SOURCE CERTIFIED ≠ product-complete ≠ runtime-QA-passed; these
  are three distinct, non-substitutable claims).
- A deferred item (§48, §47) may remain deferred for launch only if its absence does not make the
  intended owner workflow feel incomplete. Being written down earlier as "deferred" is not itself a
  justification to leave it deferred forever — it must be re-examined each time this section is
  revisited.

**Current completeness record**: see `docs/owner-command-center/OWNER_COMMAND_CENTER_PROGRESS.md`
for the dated, per-surface Pre-QA Product Completeness Pass entry (surfaces reviewed, exact
COMPLETE/MISSING/INCOMPLETE/WEAK_UX/WEAK_UI/INCONSISTENT/UNWIRED/DEFERRED_TRULY_NONBLOCKING
findings per category, and every repair implemented as a result). Do not consider this phase closed
by reading this paragraph alone — read the dated PROGRESS entry for the actual evidence.

---

# 34. LIVE / LEGACY / DUPLICATE CLASSIFICATION

For any route/component/system, classify exactly one:

- `LIVE`
- `LIVE_SHARED`
- `BUILT_NOT_WIRED`
- `DUPLICATE_REFERENCED`
- `DEAD_ZERO_CONSUMER`
- `HISTORICAL`
- `UNKNOWN`

A file existing is not evidence it is live.

Follow:

```text
route
→ import
→ component
→ resolver/service
→ API/server action
→ data source
→ caller/consumer
```

Only then classify.

---

# 35. GLOBALIZATION ADOPTION RULE

A shared engine is not complete merely because it exists.

Certification questions:

A. Requirement exists?
B. Global engine historically built?
C. Global engine exists in current source?
D. Best implementation exists on main?
E. Best implementation exists on Globalization branch?
F. Category adapter exists?
G. Current route consumes it?
H. Data round-trip preserves it?
I. Public surface renders it?
J. Dashboard restores it?
K. Active edit preserves it?
L. Admin supports it?
M. Analytics records it?
N. Owner runtime QA still required?

Never collapse this into one "built/not built" answer.

---

# 36. OWNER DASHBOARD CATEGORY-ADOPTION RULE

For every category prove:

- listing reader
- route resolver
- capability resolver
- public link
- preview link where applicable
- edit link
- lifecycle actions
- analytics
- leads/messages/applications where real
- payment state
- entitlement state
- category-specific tools
- Business Tools eligibility
- parent/child tools where applicable
- same-row republish
- expiration / renewal

If a category uses a legacy silo, identify it.

If shared architecture exists but is not consumed, classify:

`BUILT_NOT_WIRED`

---

# 37. CTA TRACE CONTRACT

Every important owner CTA must be traceable through:

```text
SOURCE PAGE
→ CTA
→ DESTINATION / ACTION
→ CANONICAL ENTITY / ID
→ AUTHORIZATION
→ SERVER ACTION / API / PROVIDER
→ SUCCESS STATE
→ FAILURE STATE
→ AUDIT / ANALYTICS WHERE APPLICABLE
```

Classify:

- `WORKS`
- `PARTIAL`
- `BROKEN`
- `WRONG_DESTINATION`
- `DUPLICATE`
- `HONESTLY_DISABLED`
- `NEEDS_PROVIDER`
- `NEEDS_DATA`

The owner should never discover an internal infrastructure problem through a raw error.

---

# 38. MOBILE / RESPONSIVE RULES

## 390px

- one drawer
- no persistent sidebar
- full-width primary action
- max two important quick actions visible
- secondary actions under More/sheets
- metrics stack/wrap
- no horizontal overflow
- specialized tools stack

## 768px

- responsive navigation
- metrics wrap
- two-column layout only where safe
- action groups wrap

## 1440px

- persistent sidebar
- usable workbench width
- clear performance strip
- strong hierarchy
- no giant empty whitespace
- no random button walls

---

# 39. WHAT NOT TO BUILD AGAIN

Do not create:

- new analytics engine
- new Business Concierge engine
- new Health Map
- new recommendation engine
- new Business Identity
- new reminder/task database
- new assistant memory
- new approval engine
- new entitlement system
- new Community Trust backend
- new Connection Hub
- new category dashboards
- new payment engine
- new parent-child model
- new media engine
- new Saved Search engine

Consume and reconcile what exists.

---

# 40. PROTECTED / DEFERRED FOR LAUNCH

Do not spend launch time expanding:

- Google/Yelp quick-view drawer
- elaborate Community Trust presentation
- advanced Trust animations/polish
- cosmetic modal redesign
- advanced aesthetic refinements that do not affect function

Preserve existing working behavior.

---

# 41. LAUNCH-IMPORTANT OWNER SYSTEMS

Must remain active and truthful:

- canonical listing identity
- draft hydration/persistence
- unsaved-exit protection
- Preview consistency
- ES/EN
- Translate Ad
- address/location normalization where already integrated
- media durability
- contact CTAs
- newsletter capture
- pricing truth
- promo truth
- Stripe truth
- webhook fulfillment
- publish to correct row
- search/results
- Saved Search
- Related Listings
- User Dashboard
- Admin traceability
- same-row edit/republish
- no wrong recharge
- expiration/renewal
- parent-child inventory
- analytics continuity
- basic SEO
- privacy/security/RLS
- Business Hub
- Google/Yelp direct links
- PWA

---

# 42. OWNER COMMAND CENTER WIRING BOOK

Persistent state for this workstream should ultimately include:

- `OWNER_COMMAND_CENTER_PROGRESS.md`
- `OWNER_COMMAND_CENTER_TESTS.json`
- `OWNER_COMMAND_CENTER_CABLE_MAP.md`

This master Bible is the controlling architecture document.

The cable map should eventually record:

- SYSTEM
- OWNER_PURPOSE
- CANONICAL_ROUTE
- COMPONENT
- API / SERVER ACTION
- DATA SOURCE
- WRITE TARGET
- CANONICAL BUSINESS/LISTING ID
- CAPABILITY RESOLVER
- OWNER READ STATE
- OWNER WRITE STATE
- CATEGORY COVERAGE
- CTA DESTINATIONS
- ANALYTICS SOURCE
- PAYMENT / ENTITLEMENT SOURCE
- CONCIERGE SOURCE
- ADMIN LINK
- STATUS
- KNOWN GAPS

---

# 43. EXECUTION MODE FOR CLAUDE

Target model:

**Claude Opus 5**

Effort:

**High**

Prompt style:

- compressed
- XML structured
- one clear objective
- limited repetition
- no manual token budgets
- no assistant prefill
- avoid redundant self-check loops
- direct implementation once root cause is known
- parallelize only independent reads/searches
- no unnecessary subagents
- use Git/state files for persistence

---

# 44. CLAUDE CONTEXT-COMPACTION RULE

When a Claude thread gets heavy, compaction is acceptable.

Do not rely on conversation memory alone.

Durable state should live in:

- this Bible
- worktree state files
- verifier/test files
- Git history
- cable map
- progress ledger

After compaction Claude should re-read these artifacts before continuing.

---

# 45. IMPLEMENTATION SEQUENCE (ALL 8 PHASES ✅ COMPLETE as of checkpoint `ea99e57c` — see §33.2)

## Phase 1 — Reconcile Concierge into Owner Command Center — ✅ COMPLETE (Gate 1)

- inspect Concierge dependency closure
- bring minimum coherent owner-safe source
- wire Business Home composition
- preserve exact business authorization
- preserve staff-data boundaries

## Phase 2 — Business Tools hierarchy — ✅ COMPLETE (Gate 1)

Reorganize the current generic tool-card page into:

- Business Identity
- What Matters Now
- Business Health
- Action Plan
- What Leonix Understands
- Work With Leonix
- Progress
- Assistant
- Learning when real

## Phase 3 — Owner attention truth — ✅ COMPLETE (Gate 2)

Make attention items explain:

- what
- why
- evidence
- severity
- next action

## Phase 4 — Category capability convergence — ✅ COMPLETE (Gates 3-4, verified/repaired)

Ensure every applicable category uses the shared workspace/capability resolver.

## Phase 5 — Commercial truth convergence — ✅ COMPLETE (Gate 3, verified, 0 defects)

Verify:

- plan
- package
- entitlement
- subscription
- coupon/offers
- inventory capacity

## Phase 6 — Lifecycle convergence — ✅ COMPLETE (Gate 5, verified, 0 defects)

Verify:

- edit
- pause
- reactivate
- renew
- archive
- sold/closed
- same-row republish
- no recharge

## Phase 7 — Owner actionability — ✅ COMPLETE (Gate 6, 2 defects found and repaired)

Verify all visible CTAs go somewhere real.

## Phase 8 — Cross-category owner experience — ✅ COMPLETE (Gate 7, 1 defect found and repaired)

Ensure consistent shell and semantics across all categories.

All 8 phases were then re-certified together in Gate 8 (Final Source Integration Certification)
and shipped as checkpoint `ea99e57c` in Gate 9. **Source certification and the pre-QA checkpoint
(`ce82252e`) are complete. PRE-QA 100% PRODUCT COMPLETION (§33.4) is the current phase; runtime
owner QA (§50) remains LOCKED until that phase certifies the product complete — see §33.3, §33.4,
§50, §51.**

---

# 46. SOURCE-TRUTH VERIFICATION RULE

Before saying a capability is missing:

1. inspect current Owner Command Center source
2. inspect Concierge branch/source
3. inspect current main
4. inspect Globalization branch
5. inspect all relevant refs
6. inspect commit history
7. inspect tests/verifiers
8. inspect current consumers

Only then classify:

- NOT BUILT
- BUILT NOT WIRED
- REGRESSED
- SUPERSEDED
- HISTORICAL
- EXTERNAL BLOCK
- POLICY BLOCK

---

# 47. CURRENT KNOWN DEFERRED OWNER-SAFE BRIDGES

**Reconfirmed accurate as of checkpoint `ea99e57c`** — none of the four items below were
completed or changed by the integration; they remain genuinely deferred, not launch blockers.

These are not launch blockers for the current Owner Command Center integration:

## Promise Keeper
No standalone owner summary route.

Commitment due/blocked information already surfaces through Advisor / Needs Attention.

## Learning
No real recommendation/need-to-lesson mapping module yet.

Return unavailable/null honestly.

## Older dedicated Living Book / Health routes
Historically resolve "an active membership" rather than an explicit business selector.

The new Business Home composition uses exact business authorization.

Do not accidentally reintroduce ambiguity through the new integrated home.

## Creative Studio
Mature owner-safe dedicated route exists.

Keep it as a dedicated workflow rather than duplicating it into the summary home.

---

# 48. CURRENT KNOWN ORGANIZATIONAL DEBT

Known items that can remain after functional launch if they are not causing defects:

- very large `mis-anuncios/page.tsx`
- some legacy lifecycle code mixed into the library surface
- legacy Servicios owner-entered star rating
- richer Community Trust owner/Admin visualization
- Google/Yelp quick-view drawer
- advanced progress/outcomes visualization
- advanced Assistant surface
- sophisticated weekly owner briefing
- Business Tools "Work With Leonix" (approvals/service requests/proposals) is read-only — real
  counts/data render, but no individual review/decision action route exists yet anywhere in the
  repo (found during Gate: CTA Truth; not a fake control, just not yet interactive)
- `LeonixRealEstateListingManageCard.tsx`'s secondary "Editar" shortcut link uses a color that
  differs from its row-siblings (Ver público/Vista previa) — a soft, no-explicit-rule-violated
  cosmetic inconsistency found during Gate: Cross-Category Experience, deferred for a deliberate
  product decision (the card's real primary doorway is already correctly burgundy elsewhere)
- pre-existing, unrelated lint finding (`messagesTotal` unused parameter,
  `LeonixRealEstateListingManageCard.tsx` line 203) confirmed present since before this
  integration began — dead-code debt, not owner-facing, not repaired (out of scope)

Do not let these distract from functional truth.

---

# 49. DEFINITION OF A FINISHED OWNER COMMAND CENTER SOURCE PASS

A source pass is complete when:

1. global shell is singular and consistent
2. `/dashboard` presents truthful owner command-center information
3. `/dashboard/mis-anuncios` is a clear owner library
4. every owned entity has one canonical manage doorway
5. every category uses the shared workspace or an explicit protected adapter
6. category capabilities are truthful
7. commercial state is truthful
8. lifecycle actions use canonical identity
9. analytics use canonical identity
10. Business Tools consume real Concierge data
11. owner attention has meaningful provenance
12. visible CTAs resolve correctly
13. mobile has no broken action grammar
14. no staff-only data leaks into owner surfaces
15. cross-business isolation holds
16. no new parallel engines were created
17. no working category engine was rewritten unnecessarily
18. source-fixable launch blockers are zero

This does not mean every post-launch enhancement is finished.

**CERTIFICATION STATUS**: all 18 criteria above are **SOURCE CERTIFIED PASS** as of checkpoint
`ea99e57c` (exact verifier/build evidence: §33.1-§33.2). Source certification is NOT the same as
runtime owner QA — see §33.3 immediately above and §50 below.

---

# 50. FINAL COMPLETION GATE

**This is the RUNTIME OWNER QA script — it has NOT yet been performed as of checkpoint
`ea99e57c`.** Source certification (§33.1-§33.2) proves the code is correct, wired, and builds
cleanly. It does NOT prove the flow below actually works when a real owner clicks through it in a
browser. Do not mark any line below as passed until it has been observed, in-browser, on the
certified Preview (`https://leonix-media-o5ca0sah9-jesus-caceres-projects.vercel.app`) or an
equivalent authenticated environment.

Before eventual release, prove:

```text
Owner signs in
→ sees correct account
→ sees correct listings/businesses
→ sees truthful attention
→ sees truthful performance
→ enters one owned entity
→ sees correct category tools
→ edits same canonical listing
→ Preview/public remains correct
→ republish preserves row
→ no wrong recharge
→ analytics persist
→ entitlement remains correct
→ business tools use correct business
→ Concierge recommendation/health/action plan are owner-safe
→ cross-business access fails closed
→ mobile actions remain usable
```

No owner-facing system should require the owner to understand repository architecture.

The dashboard should make the platform feel organized even if the underlying codebase has many historical branches and systems.

---

# 51. CURRENT NEXT ENGINEERING MOVE

The current next engineering move is:

> **PM REVIEW OF THE FINAL PRODUCT-CONSTRUCTION AUDIT, THEN THE FINAL RELEASE COMMIT**

**Checkpoint `f2508a9a566216ce0bc2eba78449510ff1fc9ab3` (parent `ce82252e`) is committed, pushed to
the feature branch, and has a READY Vercel Preview.** On top of that checkpoint, Gate 16 (the
final pre-release product-construction audit — §33.2, `docs/owner-command-center/
OWNER_COMMAND_CENTER_PROGRESS.md`) found and repaired 5 real, cited defects across FUNCTION, UX,
UI, and COPY, then re-ran every canonical verifier, a full typecheck, and one production build —
all PASS. **FINAL PRODUCT CONSTRUCTION CERTIFICATION: 100% PASS**, as of this revision.

That Gate 16 repair set (5 files) is currently **uncommitted** on top of `f2508a9a`, deliberately
left for PM review before the final release commit — per that gate's own explicit instruction, it
does not create the release commit itself. The next engineering move is therefore:

1. PM reviews Gate 16's report and the 5 repaired files.
2. Create the final release commit on the feature branch (never `main` directly).
3. Only after that commit is authorized for `main` does the actual merge/Production release
   sequence begin — a separate, later gate, not this one.
4. Runtime owner QA (§50) may begin once a real owner/smoke-test credential or session is
   available (§33.3's SAFE AUTH gap remains a QA-tooling prerequisite, unrelated to product
   completeness) — QA from that point is reserved strictly for final runtime confirmation/polish,
   never for discovering missing UX/UI/function. See §33.4 for the doctrine.

`Owner Command Center ← Business Concierge owner-safe bridge reconciliation` (an earlier move this
section used to describe) is DONE — see §33 for closure and §33.2 for the full completed-gate
ledger. Do not re-run it.

---

# 52. FINAL DOCTRINE

> **If a proven tool already exists, do not redesign it. Verify whether the Owner Command Center consumes it. If not, wire it.**

> **If a category already works, preserve it.**

> **If the shared engine exists but the category is missing adoption, add the smallest adapter.**

> **If a visible owner control has no real destination, hide or repair it.**

> **If a commercial state cannot be proven, do not guess.**

> **If information comes from Concierge, use the owner-safe projection, never raw staff data.**

> **If a listing is active and entitled, edit the same row and do not recharge the base product.**

> **If multiple folders/components exist, trace the live consumer before touching anything.**

> **Organize the cables. Do not cut the working ones.**

---

# 53. CLAUDE STARTUP CHECKLIST

Every new Claude session working this project should begin by reading, in this order:

1. This Master Bible, in full
2. `docs/owner-command-center/OWNER_COMMAND_CENTER_PROGRESS.md`
3. `docs/owner-command-center/OWNER_COMMAND_CENTER_TESTS.json`
4. `docs/owner-command-center/OWNER_COMMAND_CENTER_CABLE_MAP.md`
5. The current Git HEAD of `C:\projects\elaguila-website-owner-command-center` — confirm whether
   it still matches the certified checkpoint `ea99e57c1695138ec433766f33835830361b6ba7` (§33.1),
   or note the exact delta if new commits have landed since (e.g. runtime QA fixes)

Then report:

- worktree
- branch
- HEAD (and whether it matches the certified checkpoint in §33.1)
- tracked status
- current task
- exact source of truth being integrated
- whether any active heavy process exists

Then proceed with the assigned implementation.

Do not begin with a broad re-audit unless the current task explicitly requires it.

Do not re-integrate Concierge, re-wire Business Tools, or redo any completed gate in §33.2. Verify
consumption first; if something is genuinely missing or has regressed since `ea99e57c`, repair
with the smallest adapter — do not rebuild.

If the task is "do owner QA" or similar: check §33.4 and §51 first. As of Gates 14/14.1/15,
PRE-QA 100% PRODUCT COMPLETION and FINAL PRE-QA SOURCE/BUILD CERTIFICATION have both PASSED — but
that certified candidate is still uncommitted and has no Preview of its own yet. §50 must not be
run against a stale Preview (e.g. the `ea99e57c`/`ce82252e` Preview URLs in §33.1, which predate
this candidate) and must not begin at all until: (a) the certified candidate is checkpointed and
pushed, (b) a READY Preview exists for that exact new commit, and (c) a real owner/smoke-test
credential or session is available (§33.3's SAFE AUTH gap). Do not run §50 to discover missing
product — that is a doctrine violation. Do not assume any phase already happened because a
different phase's certification passed (§33.3).

---

# END

**LEONIX OWNER COMMAND CENTER — MASTER WIRING + CONSTRUCTION BIBLE**

Canonical artifact date: **2026-09-09**
