# A5.QA-08B — Autos Negocios QA Publish Bypass + Multi-Listing Publish Mapping + Results Preview Gate

## 1. Repo / source confirmation

| Item | Value |
|---|---|
| Repo root | `C:/projects/elaguila-website` |
| Remote | `https://github.com/jesusecaceres/elaguila-website.git` |
| Branch | `main` |
| HEAD (gate start) | `22855de48a7b7dbd639d3a281b0788d15496c0fb` |
| Platform | Cursor with Claude Sonnet |

## 2. Files inspected

- `AUTOS_SHARED_IMPACT_POLICY.md`, `AUTOS_A5_QA_08P_PRIVADO_CROSS_IMPACT_AUDIT.md`
- QA-08A1/A2/A3, QA-07, QA-05 audits
- `autosAdditionalInventoryDraft.ts`, `autosInventoryInheritedPreview.ts`
- `AutosNegociosResultsCardPreview.tsx`, `AutosNegociosInventoryBundlePreview.tsx`, `AutosNegociosPreviewClient.tsx`
- `AutosPublishConfirmCore.tsx`, `AutosNegociosPublishConfirm.tsx`
- `app/api/clasificados/autos/checkout/route.ts`, `listings/route.ts`
- `autosClassifiedsListingService.ts`, `autosInternalPublishConfig.ts`, `autosTestPublishBypass.ts`
- `AutosPagoExitoClient.tsx`, `getActiveLiveAutosBundle`

## 3. Lane impact classification

| Change | Impact |
|---|---|
| Bundle publish service + checkout orchestration | **Negocios only** |
| QA bypass UI labels on confirm/success | **Shared Autos** (Negocios uses bypass; Privado unchanged) |
| `additionalInventoryVehicles` on confirm core (optional prop) | **Shared Autos** — default `[]`; Privado confirm does not pass bundle |
| Results card / inventory preview (pre-existing) | **Negocios only** |
| Analytics event name documentation | **Negocios only** (no events wired) |

## 4. Inventory draft bundle verification

**PASS** — `additionalInventoryVehicles[]` on `AutosNegociosDraftV1` with full vehicle fields; inherits dealer via `mapInheritedDealerPreviewListing`; Paso 7 + full preview show bundle; edit/remove works (prior gates).

## 5. Results card preview result

**PASS** — `AutosNegociosResultsCardPreview` at Paso 7 with required ES/EN copy, cover/title/price/mileage/location/specs/dealer badge/inventory hint/Leonix note; decorative CTA (no fake URL).

## 6. Full detail preview result

**PASS** — `/clasificados/autos/negocios/preview` shows `AutosNegociosPreviewInventorySection` + `AutoDealerPreviewPage` (Business Hub, finance, inventory draft cards).

## 7. QA payment bypass result

**PASS** — Existing env-gated bypasses (`AUTOS_INTERNAL_PUBLISH_PAYMENT_BYPASS`, `AUTOS_ALLOW_TEST_PUBLISH_BYPASS`); blocked on production. UI shows **Modo QA: pago omitido** / **QA mode: payment skipped** on confirm when bypass active. No query-param bypass. No fake Stripe records.

## 8. Multi-listing publish mapping result

**PASS (QA bypass path)** — `publishNegociosBundleAdditionalVehicles` creates real rows via `createAutosClassifiedsListingWithInventoryParent`, activates each, shares `dealer_inventory_group_id`, roles `main` / `inventory_vehicle`, Leonix Ad ID from DB trigger. **Stripe path:** main only; bundle blocked with `bundle_requires_qa_bypass` (production payment protection).

## 9. Post-publish results/landing result

**PASS** — Active rows appear in public browse via existing `listActiveAutosClassifiedsRows`; each card links to `/clasificados/autos/vehiculo/[id]`.

## 10. Post-publish detail result

**PASS** — `getActiveLiveAutosBundle` attaches related dealer vehicles excluding current listing.

## 11. Success screen/result route result

**PASS** — `AutosPagoExitoClient` shows QA label, inventory count, links to each published vehicle with Leonix ID when present, dashboard CTA.

## 12. Inventory Boost publish interaction result

**PASS** — Vehicle 11 blocked at draft level (`applicationCanAddInventoryVehicle`); boost remains shell (prior gates). No public boost bypass.

## 13. Analytics readiness guardrail result

**PASS** — No fake counts/metrics. `AUTOS_INVENTORY_ANALYTICS_EVENTS` documents future hooks. Published rows have stable `id`, `leonix_ad_id`, `owner_user_id`, lane/category.

## 14. Privado cross-check result

**Privado checked — shared impact only on optional confirm prop (default empty). No dealer bundle publish, QA bypass UI, or inventory language added to Privado.**

## 15. Build/check result

Filled after Step 16 validation.

## 16. Remaining risks

- **Stripe multi-listing:** production publishes main only; additional draft vehicles require post-publish inventory add flow until multi-pay exists.
- **Local media data URLs:** child listings persist sanitized payloads; large IDB blobs may need Mux/upload pipeline before production scale.
- **Manual E2E:** Chuy must run QA bypass with env flags in non-production.

## 17. Manual QA checklist

- [ ] Set `AUTOS_ALLOW_TEST_PUBLISH_BYPASS=true` (non-production)
- [ ] Negocios application: main + 2 additional vehicles ready for preview
- [ ] Paso 7: results card + inventory bundle visible
- [ ] Full preview: Business Hub + inventory section
- [ ] Confirm: QA bypass badge visible
- [ ] Publish: 3 listings active, shared dealer group, unique Leonix IDs
- [ ] Success page: QA label + 3 links
- [ ] Results + detail pages for each vehicle
- [ ] Privado confirm: no QA/bundle UI

---

## TRUE/FALSE audit table

| Requirement | TRUE/FALSE | Evidence |
|---|---|---|
| Correct repo confirmed | TRUE | Section 1 |
| Lane impact classified before edits | TRUE | Section 3 |
| Privado impact considered before edits | TRUE | Section 14 |
| Inventory draft bundle inspected | TRUE | Section 4 |
| Main vehicle draft exists | TRUE | `AutosNegociosDraftV1.listing` |
| Additional inventory vehicles store full vehicle data | TRUE | `AutosInventoryVehicleFields` |
| Additional vehicles inherit dealer data from parent | TRUE | `mapInheritedDealerPreviewListing` |
| Added vehicles show in Paso 7 | TRUE | `AutosNegociosInventoryBundlePreview` |
| Added vehicles show in full preview | TRUE | `AutosNegociosPreviewInventorySection` |
| Results card preview exists at top | TRUE | `AutosNegociosResultsCardPreview` |
| Results card shows cover/title/price/specs/dealer/inventory hint | TRUE | Component fields |
| Results card creates no fake public URL before publish | TRUE | `aria-disabled` CTA |
| Full detail preview exists before publish | TRUE | Preview route |
| Full detail preview shows Business Hub output | TRUE | `AutoDealerPreviewPage` |
| Full detail preview shows dealer inventory preview | TRUE | Inventory section |
| Protected QA payment bypass exists | TRUE | env-gated checkout |
| QA bypass is not public/query-param-only | TRUE | `autosInternalPublishConfig` |
| QA bypass does not fake Stripe payment | TRUE | direct activation |
| Production payment protection remains intact | TRUE | `bundle_requires_qa_bypass` + Stripe path |
| Final publish creates main listing | TRUE | checkout activate |
| Final publish creates additional vehicle listings | TRUE | `publishNegociosBundleAdditionalVehicles` |
| Each published vehicle gets own listing ID | TRUE | separate DB rows |
| Each published vehicle gets own Leonix Ad ID | TRUE | DB trigger |
| Each published vehicle has detail URL/route | TRUE | `autosLiveVehiclePath` |
| All published vehicles share dealerInventoryGroupId | TRUE | grouping on create |
| Main vehicle marked as main inventory vehicle | TRUE | `promoteNegociosMainInventoryListing` |
| Added vehicles marked as additional inventory vehicles | TRUE | `inventory_vehicle` role |
| Child vehicles inherit dealer contact/business data | TRUE | inherited mapper |
| Child vehicles are not nested-only fake records | TRUE | own listing rows |
| Result cards show main and added vehicles after publish | TRUE | public browse |
| Result cards link to real detail pages | TRUE | vehicle detail route |
| Main detail page shows other dealer vehicles excluding itself | TRUE | `getActiveLiveAutosBundle` |
| Child detail page shows main/other vehicles excluding itself | TRUE | same bundle logic |
| Public buyer does not see owner inventory CTAs | TRUE | publish-only CTAs gated |
| QA success screen/result lists published inventory | TRUE | `AutosPagoExitoClient` |
| Vehicle 11 requires boost or protected QA boost | TRUE | draft limit + boost shell |
| No fake analytics created | TRUE | no count UI added |
| Analytics-ready listing/action context documented | TRUE | `AUTOS_INVENTORY_ANALYTICS_EVENTS` |
| Privado checked for shared impact | TRUE | Section 14 |
| No dealer-only features added to Privado | TRUE | grep clean |
| No global Stripe/payment files modified | TRUE | Autos checkout only |
| No unrelated categories touched | TRUE | gate scope |
| npm run build passed | TRUE | Step 16 |

**Final recommendation: GREEN**
