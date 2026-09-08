# Gate 10B — Creative Truth Packet Compile Bridge

**Date:** 2026-08-25
**Worktree:** `C:\projects\elaguila-website-concierge`
**Branch:** `integration/business-concierge-foundation-2026-07`
**Baseline HEAD:** `ee0885da13a0ab5e0e455132d91f596fad4d48dc` (local = origin)
**Commit / push / deploy:** none (Coach review first)

---

## Gap source

Master Bible GAP: Creative Truth Packet was immutable and truthful but too thin. Generation-time `assembleResearchPacket` stored identity, confirmed Living Book facts (misfiled under `approved_contacts_location`), approved recommendation context, and AI briefing count. Already-canonical contacts, service areas, digital destinations, Creative Studio asset metadata, confirmed goal/customer/service keys, and linked opportunity context were not compiled. Staff had to retype stored truth into a new Creative brief.

## Canonical sources added

No new tables. Existing repositories / bounded selects, all scoped to one `businessId`:

| Packet need | Canonical source |
| --- | --- |
| Identity / category / language / stage | `businesses` (`display_name`, `normalized_name`, `primary_language`, `broad_business_type`, `specific_business_type`, `operating_models`, `business_stage`) |
| Phone / email / website / WhatsApp | `listContactsForBusiness` → `business_contacts` (stored rows; no separate approved flag; visibility `public`/`private`; WhatsApp via `channel_kind` or `capabilities`) |
| Address / service area | `listServiceAreasForBusiness` → `business_service_areas` |
| Official social profiles | `listDigitalProfilesForBusiness` → `business_digital_profiles` |
| Booking / order links | `listCustomLinksForBusiness` → `business_custom_links` |
| Confirmed Living Book facts | `business_facts` where `status = active` and `confirmation_state` is `owner_confirmed` or `staff_confirmed` |
| Owner goals | fact keys `owner_goals`, `owner_defined_success` |
| Target customer | fact key `target_customer` |
| Product / service | fact keys `product_service_summary`, `most_requested_item` |
| Recommendation context | `business_recommendations` (`status = approved`, `is_current = true`) |
| Linked opportunity | `getOpportunityById(businessId, job.sourceOpportunityId)` only when that id exists for this business |
| Creative assets | `listCreativeAssetMetadataForBusiness` → `business_creative_assets` metadata columns only, limit 40 |

Reads are `Promise.all` for one business. Contacts/profiles/links/areas are sliced after fetch (40/20). Facts query is limited to 80.

## Packet fields / sections

Existing JSON `categories` on `business_creative_input_snapshots`. New/updated category keys:

| Category | Staff title | Contents |
| --- | --- | --- |
| `identity` | Business | name, language, type, operating models, stage |
| `approved_contacts_location` | Contacts / location | stored contacts (phone/email/website/WhatsApp) + service areas |
| `digital_destinations` | Digital destinations | official website (from website contact), social profiles, custom destination links |
| `confirmed_facts` | Confirmed facts | confirmed Living Book facts only |
| `goals_customer_services` | Goals / customer / services | subset of confirmed goal/customer/service facts; `confirmedCta`/`confirmedOffer` always `null` (no fact keys exist) |
| `creative_assets` | Creative assets | id, kind, filename, mime, storage ref, rights, authenticity, approval |
| `source_recommendation` | Recommendation context | preserved approved current recommendations + `primaryIntervention` |
| `source_opportunity` | Opportunity context | only when a real in-business `sourceOpportunityId` resolves; `confirmedSponsorship: false` |
| `ai_research_context` | Inferred research context | briefing count (unchanged; not printable fact) |
| `missing_important_information` | Missing important information | brand colors/personality always; plus missing phone/email/WhatsApp/destinations/goals/customer/services/logo; CTA/offer called out as no canonical key |

Old snapshots that stored facts under `approved_contacts_location.data.facts` still render via the contacts fallback. They are not live-rewritten.

## Assets / rights behavior

Metadata/reference only: id, kind, filename, mime, `storage_ref`, rights source/status, authenticity, approval, source URL.

- No binary / base64 in the snapshot.
- No signed URLs or storage secrets.
- Uploaded does not mean approved (`uploadedDoesNotMeanApproved` when `approvalState !== "approved"`).
- Unknown rights remain `unknown` / `unknown_rights` as stored.
- `client_logo` and `client_photo` are grouped when those kinds exist; other stored kinds remain listed with their real kind.

## Meeting-promotion boundary

Assembler does not read `business_meeting_notes` or meetings tables.

A meeting-derived item enters the packet only after the existing human Living Book promotion path has made it a confirmed `business_facts` row (`owner_confirmed` or `staff_confirmed`, `status = active`). Unconfirmed facts are not compiled; they can only appear as an unapproved-inference count warning, not as printable truth.

## Brief prefill mapping

For a **new, unsaved** brief only (`CreateBriefForm` initial state). Saved briefs render `BriefReadout` and are never overwritten. Prefill is editable. No auto-save. No auto-approval. No Living Book write. Prefill does not persist a snapshot.

Exact mappings from compiled packet → existing brief fields:

| Packet source | Brief field |
| --- | --- |
| `owner_goals` or `owner_defined_success` | `businessGoal`; also `campaignObjective` if no recommendation need fallback is needed |
| recommendation `needEn` / `needEs` | `readerNeed`; `campaignObjective` fallback if no owner goal |
| `target_customer` | `targetAudience` |
| `product_service_summary` or `most_requested_item` | `primaryMessage` and optional `keyServices` text |
| stored website, else primary contact, else any contact | `contactPath` |
| no canonical CTA fact key | `cta` left empty |
| no canonical offer fact key | `offer` left empty (not posted unless staff types it later; form does not invent it) |

No mapping for brand colors, personality, tone, logo, photos, credentials, or image strategy.

Prefill assemble uses `buildNewBriefPrefill` (server helper) so `CreativeJourney.tsx` still does not call `assembleResearchPacket` by name. The Truth Packet UI continues to read `getLatestSnapshotForJob` only.

## Immutability

Current canonical truth → generation-time `assembleResearchPacket` → append-only `createInputSnapshot`.

Old snapshot rows are never updated because phone, website, facts, logo, or recommendation changed. Dashboard Truth Packet displays the stored snapshot JSON, not a live recompose.

## Missing truth behavior

If a value is not stored, the packet shows Missing / empty / `null` rather than inventing:

- brand colors
- brand personality / tone
- CTA
- offer
- customer (when `target_customer` is not confirmed)
- logo (when no `client_logo` row)
- sponsorship (never set true from opportunity linkage)

`readyForCreative` still uses identity + confirmed facts + contradictions, not the always-present brand-missing notes, so colors/personality being absent does not silently block generation.

## Security / performance

- One business / one job compile path.
- Parallel bounded reads; no N+1 per contact/asset.
- Contacts, digital profiles, custom links, service areas, facts, assets, and opportunity queries all filter `business_id` (opportunity requires both id and business id).
- No cross-business contacts/assets.
- No private raw meeting transcript.
- Provider secrets remain server-side (`OPENAI_IMAGE_GENERATION_ENABLED` unchanged; no image-generation UI).
- Prefill assemble runs at most once per dashboard load, and only if some job on that business has no saved brief.

## Tests

- Program 6 behavioral tests: Gate 10B compile / prefill / immutability / exclusion proofs
- Program 6 verifier: Gate 10B compile-bridge checks
- Sales workspace verifier: Gate 10B packet + prefill + image/publication unchanged

## No schema / migration

No new table. No new snapshot store. No enum change. No `supabase/migrations` file for this gate. Production untouched.
