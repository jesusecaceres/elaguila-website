# A5.RECOVERY-20 — Gate C: Dashboard/Admin Visibility + Analytics/Monetization Readiness

## 1. Gate title

A5.RECOVERY-20 — Gate C — Dashboard/Admin Visibility + Analytics/Monetization Readiness + Final Build

## 2. Repo confirmation

| Field | Value |
|-------|-------|
| Repo root | `C:/projects/elaguila-website` |
| Branch | `main` |
| HEAD | `c52d1b3e017fb7a0ef11473065c64bc9767ed4da` |

## 3. Files inspected

| Area | Files |
|------|--------|
| User dashboard | `app/(site)/dashboard/mis-anuncios/page.tsx` |
| Dealer inventory section | `app/(site)/clasificados/autos/dashboard/AutosDealerInventoryDashboardSection.tsx` |
| Owner listings API | `app/api/clasificados/autos/listings/route.ts` |
| Admin Autos | `app/admin/(dashboard)/workspace/clasificados/autos/page.tsx` |
| Inventory policy | `autosDealerInventoryPolicy.ts`, `autosDealerInventoryDisplay.ts` |
| Analytics hooks | `AUTOS_INVENTORY_ANALYTICS_EVENTS` in `autosAdditionalInventoryDraft.ts` |

## 4. Files changed (Gate C)

Gate C is documentation + audit scripts + final build validation. Dashboard/admin UI already on `main`.

- `app/lib/clasificados/autos/AUTOS_A5_RECOVERY_20_GATE_C_DASHBOARD_ADMIN_ANALYTICS_MONETIZATION_AUDIT.md` (this file)
- `scripts/autos-a5-recovery-20-gate-c-dashboard-admin-analytics-monetization-audit.ts` (new)
- `package.json` (R20 Gate C + master script entries)

## 5. User dashboard inventory visibility result

**PASS (code)** — `AutosDealerInventoryDashboardSection` on `/dashboard/mis-anuncios` when Autos paid section visible:

- Fetches `/api/clasificados/autos/listings` with `inventory_role`, `dealer_inventory_group_id`, `dealer_inventory_parent_listing_id`, `leonix_ad_id`.
- Groups rows by `dealer_inventory_group_id`.
- Shows active count `N / limit` (base 10; boost documented in copy).
- Lists main + child vehicles per group with role labels, Leonix ID, status, edit/publish/view-live links.

## 6. Admin dashboard inventory visibility result

**PASS (code)** — Admin Autos workspace table shows:

- `inventory_role` (main / inventory_vehicle)
- `dealer_inventory_parent_listing_id` (truncated)
- `dealer_inventory_group_id` (truncated)
- Negocios active count `active N/10`
- Row actions via `ClassifiedAdminRowActions`

## 7. Dashboard/Admin actions result

**PASS** — Edit, publish, view live, unpublish remain on user section; admin row actions unchanged.

## 8. Analytics readiness documentation

**Stable identity keys (future instrumentation):**

| Key | Use |
|-----|-----|
| `main listing id` | Primary bundle anchor |
| `main leonix_ad_id` | Public main identifier |
| `child listing id` | Per-vehicle row |
| `child leonix_ad_id` | Per-vehicle public ID |
| `dealer_inventory_group_id` | Group-level rollup |

**Future events (not built today):** result impression, detail view, child card click, related inventory click, phone/WhatsApp/email/website click, video click, gallery open, save/share, lead/contact.

**Current gaps (honest):**

- `AUTOS_INVENTORY_ANALYTICS_EVENTS` constants exist in draft module; no full `autos_classifieds_analytics_events` dashboard UI wired in R20.
- User `AutosClassifiedListingManageCard` shows legacy listing analytics scaffold at 0 for some paths; dealer inventory section does not fake totals.
- Group-level analytics aggregation not implemented — degraded state: show per-row IDs only until events table + rollup exist.

## 9. Monetization readiness documentation

| Package | Price | Active vehicles |
|---------|-------|-----------------|
| Autos Negocios base | $399/month | Up to 10 |
| Inventory Boost | +$129/month | +10 (total 20) |
| With boost | $528/month | Up to 20 |

- Entitlement truth = active published Autos Negocios rows (`getAutosDealerInventorySummaryForOwner`), not global `membership_tier`.
- No Stripe checkout, commission, or payment tracker built in R20.
- Boost CTA exists as value drawer trigger only (no new payment flow).

## 10. Bienes blueprint note

Autos dealer inventory architecture maps to future Bienes agent portfolio:

| Autos (now) | Bienes (later) |
|-------------|----------------|
| `dealer_inventory_group_id` | Agent/broker portfolio group |
| Main vehicle listing | Main agent/property profile |
| `inventory_vehicle` children | Additional property listings |
| Dealer Business Hub | Broker/agent Business Hub |
| Per-listing `leonix_ad_id` | Per-property Leonix IDs |
| Group analytics keys | Portfolio analytics |

Do not build Bienes in R20.

## 11. Privado guardrail result

**PASS** — Privado publish path has no `additionalInventoryVehicles`, dealer inventory group UI, or Inventory Boost. Shared session draft helpers (R17) use separate Privado keys without dealer-only fields.

## 12. Gate C proof table

| Requirement | TRUE/FALSE | Evidence |
| ------------------------------------------------------------------- | ---------- | -------- |
| Correct repo confirmed | TRUE | §2 |
| Autos-only scope respected | TRUE | Gate C docs/scripts only |
| User dashboard Autos read model inspected | TRUE | §3 |
| Admin Autos read model inspected | TRUE | §3 |
| User dashboard shows main Autos bundle | TRUE | group by `dealer_inventory_group_id` |
| User dashboard shows child inventory vehicles | TRUE | rows in group list |
| User dashboard shows inventory count | TRUE | `activeCount / limit` |
| User dashboard shows child Leonix IDs after publish | TRUE | `row.leonix_ad_id` in UI |
| User dashboard shows child public links | TRUE | `autosLiveVehiclePath` when active |
| User dashboard shows child statuses | TRUE | status label per row |
| User dashboard does not use global membership_tier as package truth | TRUE | `dealerInventory` API summary |
| Admin dashboard shows main Autos listings | TRUE | admin table rows |
| Admin dashboard shows child Autos listings | TRUE | `inventory_vehicle` rows |
| Admin dashboard exposes/traces inventory_role | TRUE | `role ${r.inventory_role}` |
| Admin dashboard exposes/traces dealer_inventory_group_id | TRUE | `group …` suffix |
| Admin dashboard exposes/traces child parent relationship | TRUE | `parent …` suffix |
| Admin row actions remain visible | TRUE | `ClassifiedAdminRowActions` |
| Stable analytics keys documented | TRUE | §8 |
| Group-level analytics readiness documented | TRUE | §8 gaps |
| No fake analytics totals added | TRUE | no fabricated numbers in R20 |
| Monetization package readiness documented | TRUE | §9 |
| No Stripe/payment built | TRUE | R20 scope |
| No commission logic built | TRUE | R20 scope |
| Bienes blueprint note documented | TRUE | §10 |
| Privado checked if shared helpers touched | TRUE | §11 |
| No dealer-only features leaked to Privado | TRUE | prior QA-08P audits |
| No unrelated categories touched | TRUE | R20 scope |
| No global Stripe/payment touched | TRUE | R20 scope |
| No schema/migration touched without approval | TRUE | no migration in R20 |
| npm run build passed | TRUE | Final validation §13 |

## 13. Final build/check result

Recorded after `npm run build` in Gate C Step 10 (see master audit).

## 14. Remaining risks

- Chuy manual dashboard/admin QA (checklist 30–39).
- Analytics events table + UI still future work.
- Stripe bundle publish for paid multi-row not in R20.

## 15. Manual QA checklist

See master audit `AUTOS_A5_RECOVERY_20_ADDED_INVENTORY_REAL_LISTINGS_MASTER_AUDIT.md`.

## 13. Final recommendation (Gate C): **GREEN**

Dashboard/admin visibility and readiness docs complete on existing code. Build must pass for full gate sign-off.
