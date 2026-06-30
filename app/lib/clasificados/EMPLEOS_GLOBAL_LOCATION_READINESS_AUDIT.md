# EMPLEOS GLOBAL LOCATION READINESS AUDIT

## 1. Mission summary
Implement worldwide/open location support for Empleos paid job ads and free Job Fair posts before manual QA.

## 2. Product decision summary
Leonix Media Empleos is open globally. Empleos must not hard-block to NorCal, California, USA, or predefined city/state/postal lists.

## 3. Files inspected
Inspected paid Quick form, Feria form, draft types, preview/publish envelopes, edit hydration, public mappers, public details, results search, owner dashboard, admin queue, analytics identity helpers, and Supabase row adapters under Empleos paths.

## 4. Files changed
- `app/(site)/publicar/empleos/quick/EmpleoQuickApplicationClient.tsx`
- `app/(site)/publicar/empleos/feria/EmpleoFeriaApplicationClient.tsx`
- `app/(site)/publicar/empleos/shared/types/empleosQuickDraft.ts`
- `app/(site)/publicar/empleos/shared/types/empleosFeriaDraft.ts`
- `app/(site)/publicar/empleos/shared/publish/empleosPublishSnapshots.ts`
- `app/(site)/publicar/empleos/shared/publish/buildEmpleosPublishEnvelope.ts`
- `app/(site)/publicar/empleos/shared/lib/empleosDraftFromEnvelope.ts`
- `app/(site)/publicar/empleos/shared/lib/empleosGlobalLocation.ts`
- Empleos public/result/dashboard/admin display and search files
- `scripts/verify-empleos-global-location-readiness.mjs`
- `package.json`

## 5. Field inventory
| Flow | Field | Current behavior | Required global behavior | PASS/FIXED/BLOCKED |
| ---- | ----- | ---------------- | ------------------------ | ------------------ |
| Paid job ad | address line 1 | Existing optional `addressLine1` | Optional public exact address | PASS |
| Paid job ad | address line 2 | Missing | Optional `addressLine2` persisted and displayed | FIXED |
| Paid job ad | city | Open input | Open city input for any city | PASS |
| Paid job ad | state/province/region | `state` label implied State | Open global `stateRegion` mirrored to legacy `state` | FIXED |
| Paid job ad | postal code | Legacy `addressZip` | International `postalCode` mirrored to legacy `addressZip` | FIXED |
| Paid job ad | country | Missing | Required open country input | FIXED |
| Job Fair | venue | Existing open venue | Worldwide venue | PASS |
| Job Fair | address line 1 | Missing | Optional public address | FIXED |
| Job Fair | address line 2 | Missing | Optional public address line 2 | FIXED |
| Job Fair | city | Open input | Open city input for any city | PASS |
| Job Fair | state/province/region | `state` label implied State | Open global `stateRegion` mirrored to legacy `state` | FIXED |
| Job Fair | postal code | Missing | International `postalCode` | FIXED |
| Job Fair | country | Missing | Required open country input | FIXED |

## 6. Paid job ad location result
FIXED. Paid job ads now collect `addressLine1`, `addressLine2`, open `city`, open `stateRegion`, international `postalCode`, and open `country`. The $24.99 / 30 days copy, no Save/Guardar behavior, images, contact, and `videoUrls` are preserved.

## 7. Free job fair location result
FIXED. Job Fair remains free and now supports venue plus address line 1/2, open city, open state/province/region, international postal code, and country. No Stripe/payment requirement was added.

## 8. Draft/preview/edit/publish result
FIXED. Draft session state, preview handoff, Volver a editar hydration, publish envelopes, and JSON snapshots carry the global fields while preserving legacy `state`, `addressState`, and `addressZip` compatibility.

## 9. Public detail/results result
FIXED. Public detail and results render compact clean location lines with country/state/region/postal support, no raw JSON, no empty commas, and no fake map link. Map links only render from real location text.

## 10. Landing/results search/filter result
FIXED. Keyword and location search include city, state/province/region, postal code, country, venue, and public address text. State/region is open text and postal code accepts international values.

## 11. Dashboard/admin result
FIXED. Owner dashboard and admin queue show clean location lines; admin search includes the computed global location text.

## 12. Analytics/source identity result
PASS. Existing analytics identity continues to use internal listing/source IDs and Leonix IDs. No fake analytics were added.

## 13. Supabase/storage result
PASS. Existing columns still receive `city`, `state`, and `postal_code`; full global fields are stored in existing `listing_snapshot` JSON. No SQL migration is required.

## 14. Mobile 390px result
PASS. Forms and result/dashboard cards keep single-column mobile layouts with no fixed-width location UI.

## 15. Manual QA checklist
- Paid: publish Quick with Mexico/Canada/EU address, preview, volver a editar, publish, public detail, results search by country/postal.
- Feria: publish free fair with venue and global address, preview, volver a editar, publish, public detail, results search by country/postal.
- Dashboard: confirm location line includes city/region/country.
- Admin: confirm location line/search includes city/region/postal/country.
- Confirm no Save/Guardar, no Quick/Premium/Feria public confusion, and Jobs `videoUrls` still work.

## 16. SQL proposal if blocked
NONE. Existing JSON snapshot storage is safe for full global location fields.

## 17. Blockers/open questions
NONE.

## 18. READY FOR MANUAL QA: YES

## 19. READY TO COMMIT THIS GATE: YES

| Requirement                                  | PASS/FIXED/BLOCKED | Evidence |
| -------------------------------------------- | ------------------ | -------- |
| Paid job ad location fields inspected        | PASS | Quick draft/form/publish inspected |
| Job Fair location fields inspected           | PASS | Feria draft/form/publish inspected |
| City is open input                           | PASS | Quick/Feria city inputs are text fields |
| State/province/region is open/global         | FIXED | `stateRegion` text input and mapping |
| Postal code supports global values           | FIXED | `normalizePostalCode` and unrestricted input |
| Country field exists or was implemented      | FIXED | Quick/Feria `country` fields |
| Address line 2 exists where address exists   | FIXED | Quick/Feria `addressLine2` |
| NorCal is not a hard-coded fake city         | PASS | Empty drafts remain blank |
| No NorCal/California/USA hard block remains  | FIXED | Search filters use open text |
| Paid job draft preserves location            | FIXED | Quick draft type/session includes fields |
| Job Fair draft preserves location            | FIXED | Feria draft type/session includes fields |
| Preview displays clean location              | FIXED | Published shell mappers include fields |
| Volver a editar restores location            | FIXED | Hydration maps fields from envelope |
| Publish payload includes location            | FIXED | Publish snapshots include fields |
| Public detail displays clean location        | FIXED | Detail cards format global location |
| Results card displays clean location         | FIXED | Results location helper includes country |
| Landing/results search includes city         | PASS | Search text includes city |
| Landing/results search includes state/region | FIXED | Search text includes `stateRegion` |
| Landing/results search includes postal code  | FIXED | Search text includes global postal |
| Landing/results search includes country      | FIXED | Search text includes country |
| Dashboard displays clean location            | FIXED | Owner dashboard location line |
| Admin displays clean location                | FIXED | Admin location line/search |
| Analytics identity not broken                | PASS | Source ID path unchanged |
| No Stripe touched                            | PASS | No Stripe files changed |
| No unrelated categories edited               | PASS | Empleos-only app changes |
| Verifier passed                              | PASS | `npm run verify:empleos-global-location-readiness` |
| Build passed                                 | PASS | `npm run build` |
