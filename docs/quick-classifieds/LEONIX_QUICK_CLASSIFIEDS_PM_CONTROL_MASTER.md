# LEONIX QUICK CLASSIFIEDS — PM / CHIEF ENGINEER CONTROL MASTER

Status: **ACTIVE PROJECT CONTROL**
Owner: Leonix Global LLC
Program: Quick Classifieds Phase 1
Current feature branch: `claude/quick-classifieds-master-build-0j5p30`
Baseline main at mission start: `fd9094994aa2a63fdcea49f24b2435300a7b49a4`

---

## 1. North Star

Leonix Quick Classifieds exists to make publishing radically easier **without redesigning, replacing, or weakening the existing Leonix classified products**.

Canonical doctrine:

> **We are not creating simplified ads. We are creating simplified intake into the existing ads.**

Quick must feed the same canonical category system that Full already uses:

```
QUICK INTAKE
→ EXISTING CANONICAL DRAFT
→ EXISTING PREVIEW
→ EXISTING PAYMENT IF APPLICABLE
→ EXISTING PUBLISHER
→ EXISTING CANONICAL ROW
→ EXISTING PUBLIC OUTPUT
→ EXISTING ADMIN
→ EXISTING LIFECYCLE
```

The existing full applications, previews, public detail pages, result cards, prices, Revenue OS, analytics, admin queues, and category lifecycles remain the authority.

Quick may ask less.
Quick may route faster.
Quick may expose less management UI.

Quick does **not** create a parallel product.

---

## 2. Product Vision

Quick is for people who want to post an ad with the minimum friction possible, including people who are not comfortable with large forms, dashboards, or complex account workflows.

The desired customer experience is:

```
Choose category
→ answer only the essentials
→ upload at least 1 real image
→ review
→ existing preview
→ existing payment if required
→ publish
→ simple control of the ad
```

The desired staff experience is:

```
Open existing Business Concierge PWA
→ immediately see QUICK APPLICATIONS
→ choose:
   FULL BUSINESS PROFILE
   CREATE QUICK CLASSIFIED
   SEND QUICK LINK
   MANAGE AD
→ deeper Business Concierge remains available underneath
```

Staff must not have to hunt through Notes, Research, Meetings, Creative Studio, Follow-up, Opportunities, or other deep Concierge modules simply to help someone publish.

---

## 3. Non-Negotiable Protection Rules

These rules are owner-locked.

### Never redesign or replace

Do not redesign:

- existing full category applications
- existing previews
- existing public listing/profile pages
- existing result cards
- existing dashboards
- existing Business Hub
- existing admin queues
- existing category pricing
- Revenue OS
- existing payment fulfillment
- existing lifecycle logic
- existing analytics
- existing canonical IDs
- existing media systems

### Never create parallel architecture

Do not create:

- a Quick listing database
- Quick-specific public detail templates
- Quick-specific result cards
- a second customer auth system
- a second PWA
- a second owner dashboard
- Quick-specific Stripe products in Phase 1
- synthetic/fake customer owners
- staff-as-customer ownership
- duplicate lifecycle engines
- duplicate admin queues

### Media lock

Every Quick ad must have **at least one real image before Quick handoff/publication**.

- Video is optional.
- Video does not satisfy the one-image minimum.
- Use the existing category media pipeline.
- No generated substitute images.
- Do not alter existing Full media requirements merely to match Quick.

---

## 4. Phase 1 Scope

Quick Classifieds Phase 1 covers:

1. En Venta / Varios
2. Rentas — private/classified lane
3. Empleos — standard job post
4. Autos — private lane
5. Bienes Raíces — private / FSBO
6. Clases
7. Comunidad / Eventos
8. Busco / Se Busca
9. Mascotas y Perdidos

Phase 1 also includes:

- shared Quick framework
- customer auth return
- minimum-image enforcement
- category adapters
- staff Quick Applications launchpad inside existing Business Concierge PWA
- customer Quick link
- copy/native-share link behavior
- simple My Ad doorway/control
- View / Edit / End / Renew where canonical lifecycle supports them
- ES / EN
- mobile-first behavior
- regression protection

---

## 5. Explicitly Out of Scope Until Phase 2

Do not build Quick Business in this Phase 1 branch for:

- Servicios
- Restaurantes
- Comida Local
- Autos Dealer
- Bienes Raíces Negocio / Agent
- Viajes
- Iglesias
- Negocios Locales
- Ofertas Locales

These categories will be handled only after Quick Classifieds is proven.

Important structural distinctions remain:

- Iglesias is not to be forced into generic classifieds.
- Negocios Locales is not to be turned into a generic listing table.
- Autos Dealer and Bienes Negocio structured inventory remain protected.
- Servicios and Restaurantes full Business Hub products remain protected.

---

## 6. Current Verified Feature-Branch State

The current remote feature branch exists:

`claude/quick-classifieds-master-build-0j5p30`

Independent GitHub comparison against `main` verified:

- branch was independently verified ahead of main with **0 commits behind**; exact ahead count must be re-checked at each gate because this control file itself is versioned on the branch
- merge base is `fd9094994aa2a63fdcea49f24b2435300a7b49a4`
- no merge to main has occurred

The branch contains additive Quick work including:

- `app/lib/quickClassifieds/*`
- `app/(site)/publicar/rapido/*`
- category adapters
- `QuickApplicationsLaunchpad.tsx`
- additive insertion into `StaffCommandCenter.tsx`
- additive Quick entry on `PublicarGatewayClient.tsx`
- project blueprint
- category matrix
- certification
- mission verifier

No Production merge is authorized by this control document.

---

## 7. Current Implementation Summary

The current feature branch reports and structurally shows:

### Shared framework

A common Quick framework exists under:

`app/lib/quickClassifieds/`

It owns:

- Quick category metadata
- Quick copy
- Quick validation
- Quick route generation
- Quick type contracts

It must remain a thin intake/orchestration layer.

### Quick routes

Public Quick entry exists under:

`/publicar/rapido`

with category-specific entry under:

`/publicar/rapido/[category]`

and a lightweight My Ad doorway under:

`/publicar/rapido/mi-anuncio`

### Category adapters currently present

Adapters exist for:

- En Venta
- Rentas Privado
- Autos Privado
- Bienes Raíces Privado / FSBO
- Clases
- Comunidad
- Busco
- Mascotas

### Staff launchpad

A high-visibility Quick Applications launcher has been added to the existing Business Concierge staff surface.

The launchpad must remain additive.

The full Concierge remains underneath and unchanged.

---

## 8. Known Blockers / Exceptions

These are not to be hidden or papered over.

### A. Empleos media blocker

Current forensic result:

**Empleos Quick is not considered complete.**

Reason reported:

The current Empleos job-post publishing path drops uploaded photos and the public output falls back to stock imagery.

That violates the owner-locked Quick requirement that the customer's real image must survive into the actual ad.

Until independently repaired and re-certified:

`EMPLEOS QUICK = BLOCKED_BY_EXISTING_MEDIA_OUTPUT`

Do not mark Phase 1 fully complete while this remains unresolved.

Any repair must be tightly scoped to the real Empleos media path and must not redesign the full Empleos application or public job page.

### B. Staff-assisted custody blocker

Current forensic result:

The existing server-side staff-assisted publish-for-client custody model is proven for Servicios, but the Classifieds publish routes do not yet universally support unclaimed/staff-managed publishing.

The current safe default is:

- staff sends or opens the customer's Quick link
- customer authenticates under their own Leonix identity
- canonical customer ownership remains intact

Do not silently map staff auth IDs to customer listings.

Before claiming staff can publish Classified Quick ads on behalf of a customer without customer auth, prove a safe custody/claim architecture category by category.

---

## 9. Authentication / Ownership Doctrine

Reuse existing Leonix authentication.

Do not create another auth stack.

Quick self-service should behave as:

```
Quick route
→ existing Publish/Auth gate
→ login / email OTP / magic link when needed
→ return to exact Quick route
```

Customer should not be forced through unrelated dashboard onboarding.

Ownership rules:

- listing ID alone never authorizes mutation
- client-provided owner ID never authorizes mutation
- staff identity never becomes customer owner
- cross-owner mutation must fail closed
- assisted context must remain server verified
- category scope must remain enforced

---

## 10. Lifecycle Doctrine

The Quick management experience must reuse canonical lifecycle behavior.

Quick does not invent new states.

Examples:

- Rentas → rented/end
- En Venta → sold/end
- Autos → vehicle sold/end
- Empleos → filled/end if canonical support exists
- Comunidad → archive/end according to current contract

Renewal rules:

- only use current canonical package
- only use current Revenue OS
- same listing row
- same UUID
- same Leonix Ad ID
- preserve content/media
- never create duplicate listing merely because it renewed

If canonical renewal does not exist:
Quick should show no fake renewal.

---

## 11. Staff PWA Doctrine

There remains **one Business Concierge PWA**.

The Quick Applications area belongs inside it.

The employee should understand the opening screen within seconds.

Primary operations:

1. **Full Business Profile**
2. **Create Quick Classified**
3. **Send Quick Link**
4. **Manage Ad**
5. secondary: **Open Full Business Concierge**

The launchpad is an entry/orchestration layer.

It does not own:

- business records
- listings
- payments
- ownership
- lifecycle
- notes
- meetings
- research
- Creative Studio
- opportunities

Those remain in their current canonical systems.

---

## 12. Project Management Rules

This document is the project-control authority for PM/Chief Engineer review.

For every future Claude/agent output:

### Step 1 — Compare against this Control Master

Ask:

- Did it remain inside scope?
- Did it preserve existing Full systems?
- Did it reuse canonical pipelines?
- Did it create parallel architecture?
- Did it weaken auth or ownership?
- Did it change pricing?
- Did it claim completion without proof?
- Did it alter an out-of-scope business category?
- Did it hide a blocker?

### Step 2 — Verify evidence, not prose

Do not accept:

- "done"
- "wired"
- "works"
- "complete"
- "production ready"

without source/test evidence.

Preferred proof chain:

```
requirement
→ exact source
→ exact canonical destination
→ verifier/test
→ runtime/preview evidence
→ owner QA when subjective
```

### Step 3 — Repair in small dependency batches

When a blocker is found:

```
blocker
→ diagnose root cause
→ smallest safe repair
→ focused tests
→ no-regression verification
→ continue
```

Do not restart or redesign the project because one category has a blocker.

### Step 4 — Full build discipline

Do not run full builds repeatedly.

Use focused tests during implementation.

Use one final integrated TSC/build after repair closure.

---

## 13. Completion Gates Still Required Before Main Merge

The feature branch is **not ready to merge merely because code exists and build/typecheck passed**.

Before merge to main, PM/Chief Engineer must close these gates.

### Gate A — Branch audit

Verify current feature branch against latest origin/main.

If main advanced:
reconcile main into the feature branch safely.

### Gate B — Quick contract audit

For each in-scope category prove:

- correct Quick route
- required inputs
- minimum one image
- canonical draft
- canonical preview
- canonical payment
- canonical publish
- canonical public output
- canonical admin
- edit
- end
- expiration
- renewal where real
- same-row identity

### Gate C — Empleos decision / repair

Current state:
blocked.

Must either:

1. safely fix the existing Empleos media persistence/output path and certify it, or
2. explicitly exclude Empleos from launch.

No false PASS.

### Gate D — Staff-assisted truth

Prove exactly what staff can do today.

Separate:

- prepare/open/share link
- customer-owned publish
- true staff-managed/unclaimed publish

Do not conflate them.

### Gate E — Staff PWA usability

Owner/human QA must confirm:

- Quick Applications is immediately visible
- no hunt through deeper Concierge
- labels are obvious
- Full Business remains accessible
- deeper Concierge remains intact
- no mobile/desktop overflow

### Gate F — Customer Quick QA

Human QA must test actual flows for representative categories, including:

- free listing
- paid 30-day listing
- paid FSBO
- image upload
- login return
- preview
- payment where applicable
- publish
- live public page
- edit
- end
- renew where applicable

### Gate G — Security proof

Reconfirm:

- no cross-owner edit
- no listing-id-only authorization
- no client-side price authority
- no staff-owner substitution
- minimum-image cannot be bypassed by direct final handoff/API path
- assisted context is scoped/expiring

### Gate H — Final release audit

Only after A–G:

- reconcile latest main
- focused regression tests
- full TSC
- production build
- diff check
- exact changed-file audit
- Preview READY
- owner QA PASS
- then explicit merge/release decision

---

## 14. Remote-Work Operating Procedure

The owner may be away from the development laptop.

That is acceptable.

The durable source of truth is:

1. this PM Control Master
2. Execution Blueprint
3. Category Matrix
4. Certification
5. Git branch/source evidence
6. Claude/agent outputs pasted back to PM review

When working remotely:

- send each material Claude output back to the PM/Chief Engineer review thread
- do not independently merge to main because an agent says "complete"
- do not independently change pricing or schema
- do not create Production migrations
- do not approve out-of-scope cleanup
- keep the project on the Phase 1 mission until the merge gates above are closed

---

## 15. Decision Authority

### Claude / implementation agent may decide autonomously

- exact safe file placement within the established architecture
- small type/helper structures
- focused verifier implementation
- non-destructive refactors required solely inside new Quick code
- category adapters that preserve canonical contracts
- narrowly scoped bug fixes necessary to satisfy already-locked requirements

### PM / Chief Engineer decides

- whether evidence is sufficient
- whether a proposed fix protects existing architecture
- whether a blocker is category-specific or systemic
- gate sequencing
- when owner QA begins
- whether the branch is technically ready for merge

### Owner decision required

- pricing changes
- new Stripe SKUs
- new customer custody model
- new schema that materially changes ownership
- reduction/removal of existing Full product capability
- Phase 2 Quick Business commercial pricing
- Production merge/deployment authorization when requested by workflow

---

## 16. Phase 2 Vision — Preserve, Do Not Build Yet

After Phase 1 is proven, Quick Business follows the same doctrine.

It should not redesign Servicios, Restaurantes, Dealer, Real Estate, etc.

The intended model remains:

```
LESS INPUT
→ SAME EXISTING BUSINESS PROFILE SHELL
→ MISSING OPTIONAL MODULES NATURALLY COLLAPSE
```

Full Business remains differentiated by depth:

- Business Hub
- structured inventory
- menus
- coupons
- deeper tools
- richer fields
- owner management
- analytics
- full business ecosystem

Quick Business will be a later controlled mission.

---

## 17. Current PM Verdict

As of this control document:

- Architecture direction: **GREEN**
- Feature branch isolation: **GREEN**
- Shared Quick framework: **BUILT — requires independent QA**
- Eight category adapters: **BUILT — requires category-by-category QA**
- Empleos: **BLOCKED**
- Staff Quick Applications launchpad: **BUILT — requires owner/human QA**
- Simple My Ad doorway: **BUILT — requires lifecycle/runtime QA**
- Pricing changes: **NONE**
- New Stripe SKUs: **NONE**
- Production mutation: **NONE**
- Merge to main: **NOT AUTHORIZED YET**

The project remains ACTIVE until all launch gates are closed.

---

## 18. Final Definition of Done

Phase 1 is truly DONE only when:

1. every launched category passes its Quick contract;
2. minimum-one-image survives to the actual live output;
3. paid categories use existing pricing/payment truth;
4. Quick uses existing canonical rows and lifecycle;
5. staff can immediately find the Quick Applications launchpad;
6. customers can publish without full-dashboard complexity;
7. customers/staff have a safe way to end/manage the ad;
8. ownership cannot be bypassed;
9. existing Full experiences remain unchanged;
10. out-of-scope business categories remain protected;
11. Preview is healthy;
12. owner/human QA passes;
13. final branch is reconciled with latest main;
14. PM/Chief Engineer issues a merge-ready verdict;
15. Production release occurs only after explicit release decision.

---


## 19. Ultimate Coverage Lock — All Leonix Ads

The owner's ultimate product vision is broader than Phase 1:

> **Every Leonix ad family should eventually have a true two-minute Quick intake where technically and commercially appropriate, built by extracting from the ad system that already exists.**

Current execution remains intentionally phased:

### Phase 1 — current branch

Quick Classifieds:

- En Venta / Varios
- Rentas
- Empleos
- Autos Privado
- Bienes Raíces Privado / FSBO
- Clases
- Comunidad / Eventos
- Busco / Se Busca
- Mascotas y Perdidos

### Phase 2 — later controlled branch after Phase 1 proof

Quick Business / other ad families:

- Servicios
- Restaurantes
- Comida Local
- Autos Dealer
- Bienes Raíces Negocio / Agent
- Viajes
- Iglesias
- Negocios Locales
- Ofertas Locales

The Phase 2 implementation must follow the same extraction doctrine.

No existing ad should be redesigned merely to gain Quick.

For every future category:

```
EXISTING CATEGORY
→ identify the minimum useful customer inputs
→ map those inputs into the existing canonical data model
→ use the existing preview
→ use the existing payment/lifecycle
→ use the existing public output
```

The Quick experience is a two-minute **front door**, not a second house.

---

## 20. Owner-Locked Form Interaction / Wiring Contract

A Quick form is not accepted merely because the fields render.

Every field must be genuinely usable by a normal customer on desktop and mobile.

### Text-entry acceptance

Every text-like field must support normal human typing, including:

- multi-word values with spaces
- repeated spaces while the user is still typing
- backspace/delete
- cursor movement
- selecting/replacing text
- copy/paste
- mobile keyboard entry
- Spanish accents and ñ where relevant
- apostrophes, hyphens and ordinary punctuation where valid
- phone-number entry without destructive per-keystroke rewriting
- email entry without destructive per-keystroke rewriting
- multiline description entry with natural spaces and line breaks

No controlled input may behave as if each keystroke is a final submitted value.

Do not trim, normalize, slugify, parse, coerce or rewrite user text destructively on every keystroke if doing so prevents natural typing.

Normalization belongs at the appropriate boundary:

- blur,
- step transition,
- review,
- canonical adapter,
- or final validation,

according to the existing category contract.

### Selection/control acceptance

Buttons, chips, selects, radios, checkboxes, date/time inputs, image controls and optional fields must:

- respond to click/tap
- visibly reflect the selected value
- persist when moving forward/back between Quick steps
- preserve valid state across auth return where the existing draft architecture supports it
- write the exact intended canonical value
- not silently reset unrelated fields

### Wiring acceptance

For every Quick field, prove:

```
VISIBLE CONTROL
→ USER CAN ENTER/SELECT VALUE
→ QUICK STATE UPDATES
→ VALUE PERSISTS
→ CATEGORY ADAPTER MAPS IT
→ CANONICAL DRAFT RECEIVES IT
→ EXISTING PREVIEW READS IT
→ EXISTING PUBLISHER USES IT
→ EXISTING PUBLIC OUTPUT SURFACES IT WHEN THAT MODULE IS SUPPORTED
```

A field that looks correct but does not survive this chain is **NOT DONE**.

### Required interaction test cases

At minimum, field-level QA must include representative strings such as:

- `San Jose`
- `East San Jose`
- `Joe's Landscaping`
- `María López`
- `2 bedroom apartment`
- `Call after 5 pm`

These are intended to catch broken controlled inputs, whitespace stripping, punctuation issues and accidental per-keystroke normalization.

### Media interaction

The owner-locked minimum-one-real-image rule remains.

The image must not merely preview inside Quick. It must survive:

```
SELECT FILE
→ QUICK MEDIA STATE
→ CANONICAL MEDIA DRAFT
→ EXISTING PREVIEW
→ EXISTING PUBLISH
→ ACTUAL PUBLIC AD
```

This is especially important for Empleos, which remains blocked until its real customer image survives the canonical publish/output path.

---

## 21. Claude Operating Protocol for This Project

The owner supplied a standing Claude workflow protocol. Apply it to all future prompts and implementation-review cycles for this project.

### Resource control

Multiple Leonix worktrees may be active simultaneously.

Normal implementation gates use:

- source inspection
- targeted search/grep
- focused file reads
- file-scoped or focused lint/type checks when supported
- existing targeted tests

Normal implementation gates do **not** run:

- background TypeScript checks
- background builds
- detached validation
- watch mode
- dev servers merely for confidence
- full-repo test suites
- full production builds

Before any potentially heavy command:

1. check whether a Node/TypeScript/build/test process is already active for that worktree;
2. if one is active, do not start another;
3. keep implementation moving with lightweight source proof.

Only an explicitly designated integration/release gate may run:

- full typecheck
- full production build
- broader test pass

Use **one heavy validation stream at a time**.

Never leave a heavy validation task running in the background while continuing other work.

If heavy validation is deferred, the Claude result must contain:

`DEFERRED TO INTEGRATION GATE:`

### Prompt architecture

For substantial Claude build/audit prompts:

- use clear XML-style sections such as `<context>`, `<instructions>`, `<scope>`, `<verification_criteria>`, `<return_format>`;
- state the desired action directly;
- use current code/source as truth instead of assumptions;
- use high adaptive effort for long-horizon architecture/build work and lower effort for narrow repairs;
- do not rely on deprecated assistant-response prefilling;
- avoid blanket anti-laziness language that causes unnecessary subagents or tool calls;
- damp overengineering and over-verification;
- use subagents only for genuinely independent workstreams;
- preserve progress in durable repo files and git rather than relying on chat memory.

### Long-context grounding

When a task depends on large documents or prior artifacts:

- read the relevant source first;
- ground decisions in exact source evidence;
- for a forensic/audit task, extract the relevant evidence before drawing conclusions;
- do not speculate about code that has not been opened.

### Implementation style

Prefer the minimum correct change.

Do not:

- clean unrelated code,
- create speculative abstractions,
- create helper systems for hypothetical future needs,
- modify tests merely to obtain a PASS,
- hard-code around a verifier instead of fixing the real product behavior.

Tests verify the implementation; they do not define a fake implementation.

### PM handoff format

Every material Claude output returns to the PM / Chief Engineer for review.

The PM determines:

- whether the claim is actually proven,
- whether another focused repair is required,
- whether the project advances to the next gate,
- whether integration validation is authorized.

Claude does not self-authorize a main merge or Production release.

---

**Control statement**

> Leonix Quick Classifieds must make publishing easier without making Leonix architecture weaker. Simplicity belongs in the intake and staff doorway; truth, ownership, payment, lifecycle, and public output remain canonical.
