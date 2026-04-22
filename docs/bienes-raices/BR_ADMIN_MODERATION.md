# BR — admin visibility & moderation notes

## Admin workspace

- **URL:** `/admin/workspace/clasificados`
- **Server loader:** `app/admin/(dashboard)/workspace/clasificados/page.tsx` uses `fetchListingsForAdminWorkspaceFiltered` + optional client-side refinement on `leonix_branch`, `leonix_operation`, `leonix_propiedad` parsed from `detail_pairs`.
- **Table UI:** `AdminListingsTable.tsx` — for `category === "bienes-raices"` renders machine facet summary (`parseLeonixMachineFacetRead`) for operational scanning.

## Moderation / reporting (public)

- Listing detail (`/clasificados/anuncio/[id]`) includes report submission via `submitListingReportAction` (server action in `app/admin/actions`).

## Reduced mode

- If `detail_pairs` column is missing in DB, admin page shows reduced-mode copy from `detailPairsAvailable` flag — BR-specific filters are skipped until migrations align.
