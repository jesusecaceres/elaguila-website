# A5.QA-08C — Autos Supabase Inventory Backing + Published Inventory Output Proof Audit

**Gate type:** Supabase/schema proof + publish/output verification (no visual polish).

**Platform:** Cursor with Claude Sonnet

---

## 1. Repo/source confirmation

| Field | Value |
|-------|-------|
| Repo root | `C:/projects/elaguila-website` |
| Remote | `https://github.com/jesusecaceres/elaguila-website.git` |
| Branch | `main` |
| HEAD (gate run) | `c71449aff8f0226c953aed5d9cd47e79125d34e3` |

---

## 2. Initial git status/diff

**08C gate deliverables (this stack):** this audit file, audit script, single `package.json` npm script entry (`autos:a5-qa-08c-supabase-inventory-backing-output-proof-audit`).

**Repo at finalization (2026-06-06):** 08C deliverables are untracked + one `package.json` line; **no Autos app/runtime files changed for this gate.** Unrelated parallel WIP may exist (e.g. Comida Local L8A, Bienes Raíces BR-INV-A) — out of 08C scope; commit or stash separately.

---

## 3. Autos audits/policies inspected

- `AUTOS_SHARED_IMPACT_POLICY.md`
- `AUTOS_A5_QA_08P_PRIVADO_CROSS_IMPACT_AUDIT.md`
- `AUTOS_A5_QA_08B_QA_PUBLISH_MULTI_LISTING_RESULTS_AUDIT.md`
- `AUTOS_A5_QA_08A3_FINANCE_IMAGE_UPLOAD_URL_AUDIT.md`
- `AUTOS_A5_QA_08A2_VEHICLE_ONLY_INVENTORY_DRAWER_AUDIT.md`
- `AUTOS_A5_QA_08A1_OPEN_INVENTORY_CTA_DRAWER_AUDIT.md`
- `AUTOS_A5_QA_07_APPLICATION_PERSISTENCE_INVENTORY_TRUTH_AUDIT.md`
- `AUTOS_A5_VDATA_C_STARTER_SEED_FINAL_VALIDATION_AUDIT.md`
- `AUTOS_A5_FINISH_01_REPO_FIRST_E2E_STABILIZATION_AUDIT.md`
- `AUTOS_A4_0_DEALER_INVENTORY_SQL_CONTRACT_AUDIT.md`

---

## 4. Supabase/schema backing result

| Needed field/relationship | Exists today? | Where? | Missing? | Action |
|---|---|---|---|---|
| Listing id | Yes | `autos_classifieds_listings.id` (uuid PK) | No | Use existing |
| Leonix Ad ID | Yes | Column + insert trigger (`20260506150000_leonix_ad_id_all_classifieds.sql`) | No | Use existing |
| Detail URL/route | Yes | `/clasificados/autos/vehiculo/[id]` via `autosLiveVehiclePath(id)` | No slug column — architecture uses UUID | Use existing |
| Owner/seller ID | Yes | `owner_user_id` → `auth.users` | No | Use existing |
| Category/listing type | Yes | `lane` (`negocios` \| `privado`) | No | Use existing |
| Dealer inventory group ID | Yes | `dealer_inventory_group_id` (`20260518124700_autos_dealer_inventory_grouping.sql`) | No | Use existing |
| Parent listing ID | Yes | `dealer_inventory_parent_listing_id` + FK to same table | No | Use existing |
| Inventory role main/additional | Yes | `inventory_role` check (`main`, `inventory_vehicle`) | No | Use existing |
| Child inherits dealer data | Yes | `mapInheritedDealerPreviewListing` → denormalized `listing_payload` on child row | No | Use existing |
| Media/gallery per listing | Yes | `listing_payload.mediaImages` per row | No | Use existing |
| Status active/draft/pending | Yes | `status` enum on table | No | Use existing |

**Conclusion:** Required Supabase backing already exists from A4.0 + Phase 5 Leonix IDs. **No new migration required.**

`inventory_sort_order` not present — optional; public sort uses `published_at` / `republish_sort_at`.

---

## 5. Migration result

**None created.** Existing migrations are nullable, backward-compatible, and Autos-scoped:

- `20260409120000_autos_classifieds_listings.sql` — base table
- `20260506150000_leonix_ad_id_all_classifieds.sql` — `leonix_ad_id` + trigger
- `20260518124700_autos_dealer_inventory_grouping.sql` — inventory grouping columns

No RLS changes. No destructive SQL.

---

## 6. Draft-to-publish mapper result

**PASS** — `mapInheritedDealerPreviewListing(parent, child)` in `autosInventoryInheritedPreview.ts`:

- Merges parent dealer/contact/business/finance/social/review/custom links
- Overwrites only child vehicle slice (`inventoryVehicleDraftToListingSlice`)
- Documented field groups in `AUTOS_INVENTORY_INHERITED_FIELD_GROUPS`
- Child drawer form excludes dealer fields (`AUTOS_INVENTORY_DEALER_FIELD_BLOCKLIST`)

Bundle publish calls mapper before `createAutosClassifiedsListingWithInventoryParent`.

---

## 7. Multi-listing publish result

**PASS** — `publishNegociosBundleAdditionalVehicles` + checkout `finishAutosBypassCheckout`:

1. Activates main listing → `status = active`, `published_at` set
2. `promoteNegociosMainInventoryListing` → `inventory_role = main`, stable `dealer_inventory_group_id`
3. For each ready child draft → `createAutosClassifiedsListingWithInventoryParent` → activate
4. Each row is real `autos_classifieds_listings` record with own `id`, `leonix_ad_id`, detail URL

**Failure handling:** Returns explicit errors (`child_create_failed`, `dealer_active_limit_reached`, `activate_failed`); not fully atomic — partial child success possible; main remains active with error surfaced to client. Documented in §16.

---

## 8. QA payment bypass result

**PASS** — Protected env-gated bypasses:

- `AUTOS_INTERNAL_PUBLISH_PAYMENT_BYPASS=1` (`autosInternalPublishConfig.ts`)
- `AUTOS_ALLOW_TEST_PUBLISH_BYPASS=true` (`autosTestPublishBypass.ts`)
- Both blocked when `VERCEL_ENV === production`
- Requires authenticated owner + existing draft row
- Does not create fake Stripe session/payment records
- Bundle multi-listing blocked on Stripe path (`bundle_requires_qa_bypass` 409)
- UI labels: **Modo QA: pago omitido** / **QA mode: payment skipped**; success: **Publicado en modo QA — pago omitido**

---

## 9. Results/landing output result

**PASS** — Public API reads Supabase only:

- `GET /api/clasificados/autos/public/listings` → `listActiveAutosClassifiedsRows()` → `.eq("status", "active")`
- Each active main + child row appears as separate card via `autosClassifiedsRowToPublicListing`
- Cards link to `/clasificados/autos/vehiculo/[id]`
- No localStorage-only public listings
- Draft/pending rows excluded by status filter

---

## 10. Detail page output result

**PASS** — `GET /api/clasificados/autos/public/listings/[id]` → `getActiveLiveAutosBundle`:

- Active-only (404 if not active)
- Main + child: own vehicle data from row `listing_payload`
- Negocios: Business Hub + finance from payload
- Related pool: same `dealer_inventory_group_id` (or owner fallback), excludes current, limit 4
- Section copy: **Más vehículos de este dealer** / **More vehicles from this dealer**
- Helper: **Explora otros vehículos activos de este inventario.** / **Explore other active vehicles from this inventory.**

---

## 11. Success screen/result route result

**PASS** — `AutosPagoExitoClient` at `/clasificados/autos/pago/exito`:

- Main listing live URL via verify-internal or Stripe verify
- Bundle result from sessionStorage (`AUTOS_BUNDLE_PUBLISH_RESULT_SESSION_KEY`)
- Lists each published vehicle with link + Leonix Ad ID when present
- Inventory count e.g. `3/10` via `totalPublished` / `inventoryLimit`
- QA label when bypass used
- Dashboard CTA for owner context only

---

## 12. Dashboard/admin backing result

**PASS (inspected, not expanded):**

- `AutosDealerInventoryDashboardSection` — active count, limit, remaining slots, add/manage CTAs, per-row status/links, group by `dealer_inventory_group_id`
- `listAllAutosClassifiedsRowsForAdmin` — id, leonix_ad_id, status, inventory columns for admin workspace
- No fake counts wired — reads real Supabase rows

**Remaining:** Full admin inventory group count column polish deferred; not blocking publish proof.

---

## 13. Privado cross-check result

**Privado checked — no shared impact.** No code changes. Privado publish does not pass `additionalInventoryVehicles`; no QA bypass UI; no dealer inventory language in `AutosPrivadoApplication.tsx`.

---

## 14. Analytics readiness result

**PASS (documented only, not implemented):**

`AUTOS_INVENTORY_ANALYTICS_EVENTS` in `autosAdditionalInventoryDraft.ts` documents future hooks including `inventory_bundle_publish_started`, `inventory_bundle_publish_completed`, `result_card_click`, `detail_view`, CTA clicks, `inventory_vehicle_click`.

Published rows expose: `id`, `leonix_ad_id`, `owner_user_id`, `lane`, `dealer_inventory_group_id`, `inventory_role` for future event attachment.

No fake metrics, no localStorage analytics, no fake dashboard numbers added.

---

## 15. Build/check result

| Check | Result |
|-------|--------|
| `npm run autos:a5-qa-08c-supabase-inventory-backing-output-proof-audit` | PASS |
| `npm run autos:a5-qa-08b-qa-publish-multi-listing-results-audit` | PASS |
| `npm run autos:a5-qa-08p-privado-cross-impact-audit` | PASS |
| `npm run autos:a5-qa-08a3-finance-image-upload-url-audit` | PASS |
| `npm run autos:a5-qa-08a2-vehicle-only-inventory-drawer-audit` | PASS |
| `npm run autos:a5-qa-07-application-persistence-inventory-truth-audit` | PASS |
| `npm run autos:a5-vdata-c-starter-seed-final-validation-audit` | PASS |
| `npm run autos:enforce-smoke` | PASS |
| `npm run build` | PASS |

---

## 16. Remaining risks

- Bundle publish is not a single DB transaction — partial child failure may leave main + some children active; client receives error code
- Stripe production path publishes main only; additional inventory requires post-publish dashboard add or QA bypass
- Live Supabase row proof requires env with admin credentials + QA bypass flags (static gate proves wiring)
- `inventory_sort_order` not in schema — sort by publish date only
- Admin inventory group aggregate UI not fully polished

---

## 17. Manual QA checklist for Chuy

### Supabase / publish proof (QA bypass env required)

- [ ] Set `AUTOS_INTERNAL_PUBLISH_PAYMENT_BYPASS=1` or `AUTOS_ALLOW_TEST_PUBLISH_BYPASS=true` (non-production)
- [ ] Complete Negocios application with main vehicle + 2 added inventory vehicles
- [ ] Publish → confirm **Modo QA: pago omitido** on confirm
- [ ] Success screen lists 3 vehicles with individual links
- [ ] Query Supabase `autos_classifieds_listings`: 3 active rows, shared `dealer_inventory_group_id`, roles `main` + `inventory_vehicle`, distinct `leonix_ad_id`
- [ ] Each detail URL `/clasificados/autos/vehiculo/[id]` loads real data
- [ ] Autos results shows all 3 cards
- [ ] Main detail shows other 2 in **Más vehículos de este dealer**
- [ ] Child detail shows main + sibling, excludes self
- [ ] Public buyer sees no owner “Agregar vehículo al inventario”

### Stripe path (optional)

- [ ] Publish main only via Stripe — additional vehicles blocked with bundle message
- [ ] Add child via dashboard inventory flow after main is active

### Privado regression

- [ ] Privado publish unchanged — single listing, no bundle, no dealer inventory UI

---

## TRUE/FALSE table

| Requirement | TRUE/FALSE | Evidence |
|---|---|---|
| Correct repo confirmed | TRUE | §1 |
| git diff reviewed before editing | TRUE | §2 |
| Autos scope lock respected | TRUE | Gate deliverables only |
| Supabase/schema backing inspected | TRUE | §4 |
| Listing id support exists | TRUE | `autos_classifieds_listings.id` |
| Leonix Ad ID support exists | TRUE | §4 leonix migration |
| Detail URL/slug support exists | TRUE | `autosLiveVehiclePath` UUID route |
| Owner/seller ID support exists | TRUE | `owner_user_id` |
| Category/listing type support exists | TRUE | `lane` column |
| Dealer inventory group support exists or minimal migration created | TRUE | §4 A4.0 migration |
| Parent listing relationship support exists or minimal migration created | TRUE | `dealer_inventory_parent_listing_id` |
| Inventory role main/additional support exists or minimal migration created | TRUE | `inventory_role` check |
| Migration, if created, is nullable/backward-compatible | TRUE | §5 — no new migration |
| No unsafe schema rewrite performed | TRUE | §5 |
| Draft-to-publish bundle mapper exists | TRUE | §6 |
| Main listing payload created from parent draft | TRUE | checkout → create/activate main |
| Child listing payloads created from added inventory drafts | TRUE | `mapInheritedDealerPreviewListing` |
| Child listings inherit dealer data from parent | TRUE | §6 inherited field groups |
| Final publish creates main listing | TRUE | §7 |
| Final publish creates child vehicle listings | TRUE | §7 |
| Every published vehicle has own listing ID | TRUE | uuid PK per row |
| Every published vehicle has own Leonix Ad ID | TRUE | insert trigger |
| Every published vehicle has own detail URL/route | TRUE | `autosLiveVehiclePath` |
| All published vehicles share dealerInventoryGroupId | TRUE | §7 promote + create |
| Main listing marked main inventory vehicle | TRUE | `inventory_role = main` |
| Child listings marked additional inventory vehicle | TRUE | `inventory_role = inventory_vehicle` |
| Publish failure handling prevents silent partial success | TRUE | §7 error codes returned |
| Protected QA bypass exists or blocker documented | TRUE | §8 |
| QA bypass is not public/query-param-only | TRUE | §8 env + auth |
| QA bypass does not fake Stripe payment | TRUE | §8 no Stripe record |
| Production payment protection remains intact | TRUE | §8 VERCEL_ENV block |
| Results read real published listings | TRUE | §9 |
| Main and child listings appear in results after publish | TRUE | §9 active rows |
| Result cards link to real detail pages | TRUE | §9 vehiculo route |
| Detail pages read real published listings | TRUE | §10 `getActiveLiveAutosBundle` |
| Main detail shows other dealer vehicles excluding itself | TRUE | §10 related pool |
| Child detail shows main/other dealer vehicles excluding itself | TRUE | §10 same pool logic |
| Public buyer does not see owner inventory CTAs | TRUE | §10 gated CTAs |
| Success screen/result route lists published inventory | TRUE | §11 |
| Dashboard/admin backing inspected | TRUE | §12 |
| No fake dashboard counts added | TRUE | §12 |
| No fake analytics added | TRUE | §14 |
| Analytics-ready listing context documented | TRUE | §14 events list |
| Privado checked for shared impact | TRUE | §13 |
| No dealer-only features added to Privado | TRUE | §13 |
| No unrelated categories touched | TRUE | §2 |
| No global Stripe/payment files modified | TRUE | §2 |
| npm run build passed | TRUE | §15 |

---

## Final recommendation

Final recommendation: **GREEN** — Autos Negocios inventory is backed by real Supabase `autos_classifieds_listings` rows with grouping, Leonix Ad IDs, and public read paths. Multi-listing QA publish creates distinct active listings; results and detail consume live data. No schema changes required this gate.
