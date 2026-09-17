# LEONIX BUSINESS CONCIERGE — FINAL OWNER QA AND FIVE-BUSINESS PILOT PACKET

**This document does not claim Human QA has already passed.** It is the packet PM/Owner uses to *run* that QA. Every technical/objective precondition below is proven in the companion `BUSINESS_CONCIERGE_FINAL_RELEASE_EVIDENCE_DOSSIER.md` — this document only sets up the human session.

---

## Release identity

- **RELEASE SHA:** `6e8f7d4af11cb6b7012c793edac07d489f039486`
- **PREVIEW URL:** `leonix-media-no116zdiq-jesus-caceres-projects.vercel.app`
- **DEPLOYMENT ID:** `dpl_Bz6b58M5MPGW3Md2hyBFWw62jGHr` — READY
- **DATABASE:** Staging only (`cgeehvnfyrdoperdotdh`). **Never Production** (`xuieateniufcrsfdomwl`).
- **LOGIN PRECONDITION:** a real staff roster login is required for every route below except the Growth Plan dev fixture harness. This agent cannot perform that login on your behalf (credential entry is out of scope for it by policy) — Owner/staff must sign in themselves for this QA pass.

---

## One full staff journey (run this in order)

1. Open the Preview URL, sign in with a real staff/manager roster account.
2. From Staff Command Center, open (or open the Staging test business `Staging Cert Test Prospect 2026-09`, id `23944316-b067-4f5d-8343-5496337187b0`).
3. **Outreach:** open the business dashboard → `#outreach`. Add a contact attempt via "Agregar una nota / Add a note", selecting a channel (e.g. Call) and one of the new outcomes (Spoke with decision maker / Meeting requested / etc.). Confirm it appears in the new **"Contact attempt history"** sub-section, and separately in the general notes feed below it.
4. **Growth Plan:** scroll to Growth Plan. If no assessment exists, run "Analizar negocio / Analyze Business." Review a solution card and confirm the new Readiness/Capacity/Life-alignment/Lion-Code badge row appears with a plain-language explanation.
5. **Outcomes:** if a campaign exists in `live`/`measuring`/`complete` status, use "Registrar resultado / Record outcome" under Measurement to record a metric, and confirm it appears listed against that campaign.
6. Continue the rest of the already-certified journey (Health, Meetings, Recommendations, Opportunities, Proposals, Commitments) as previously QA'd — unchanged by this repair.

## Client Discovery journey

Unchanged by this session — follow the existing Client Discovery certification's own QA path (Discovery → Architecture → Blueprint → Approval → Project → QA → Client Review → Launch → Handoff).

## Viewport QA

- **1440px:** full desktop pass of the journey above.
- **768px:** tablet pass — confirm no cramped/overlapping controls in Growth Plan and Outreach.
- **390px:** mobile pass — confirm no horizontal scroll anywhere in the journey (Growth Plan surface already objectively confirmed clean at 390px; confirm this holds for the authenticated Outreach/Outcomes surfaces too, which this agent could not browser-test without a login).

## Language QA

- **ES:** read every screen in the journey in Spanish first; confirm nothing reads as machine-translated or awkward.
- **EN:** repeat in English.

## Subjective questions only (answer these — do not re-verify technical mechanics, those are already proven)

- Does the hierarchy feel obvious?
- Can I immediately tell where I am?
- Is the next action visually obvious?
- Does it feel like one product (not several bolted together)?
- Does mobile feel comfortable to use with a thumb?
- Is information density appropriate (not cramped, not sparse)?
- Does the bilingual copy feel natural, not translated?
- Does the Leonix branding feel intentional?
- Is anything cluttered, confusing, or repetitive?
- Do actions feel safe to click before clicking (is it clear what will happen)?

---

## Five-business pilot

**Objective finding:** Staging currently has only 2 `businesses` rows, neither matching any of the 5 required categories below. No fixture was created in this pass (out of scope for this agent to do unprompted). Exact fixtures needed are listed per category.

| # | Business type | Staging fixture | Journey to test | Specialized domain | Failure condition |
|---|---|---|---|---|---|
| 1 | Restaurant | **Needed** — none exists. Create a `businesses` row with `broad_business_type='food_hospitality'`, `business_stage='operating'` | Full staff journey + a "menu/hours/online ordering" -type Growth solution | Food/hospitality-specific Growth categories, Outreach with a Call/Meeting-requested outcome | Health Map or Growth assessment crashes or fabricates a finding not traceable to real facts |
| 2 | Professional Service | **Needed** — none exists. Create with `broad_business_type` matching a professional-service category (e.g. legal/accounting/consulting) | Discovery → Blueprint → Project Creation | `external_professional_required` provider class solutions (e.g. licensing) | A solution routed to Leonix execution when it should require an external professional |
| 3 | Real Estate/Home | **Needed** — none exists | Growth Plan with a `leonix_coordinates_partner` solution (e.g. radio/print) | Partner-coordination provider class | Solution silently treated as `leonix_provides` |
| 4 | Automotive | **Needed** — none exists | Outreach contact-attempt log with multiple channels | Outreach/contact-attempt full lifecycle | An outcome value not in the canonical Bible §12 set appears selectable |
| 5 | Wellness/Community | **Needed** — none exists. `Staging Cert Test Prospect 2026-09` (category "other") could be relabeled for this, or a new row created | Outcomes/Measurement full loop: campaign → record outcome → evidence/reflection | The new `growth_campaign_id` linkage end-to-end | Recorded outcome does not read back on cold page reload |

**PASS STANDARD:** no critical/major journey defect remains after the pilot.

## Defect capture format

| SCREEN | ROUTE | VIEWPORT | ACTION | EXPECTED | ACTUAL | SCREENSHOT | SEVERITY |
|---|---|---|---|---|---|---|---|
| (fill per defect) | | | | | | | Critical / Major / Minor |
