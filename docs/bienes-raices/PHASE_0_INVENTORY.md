# Phase 0 — Bienes Raíces current state inventory

**Repo:** `elaguila-website` · **Branch:** `main` (clean at audit) · **Assumption:** all uncommitted BR work from pre-crash is lost; this reflects **only** what exists in git.

## PRESENT (verified in tree)

| Area | Evidence |
|------|-----------|
| Public landing | `app/(site)/clasificados/bienes-raices/page.tsx` → `BienesRaicesLandingHub` → `landing/BienesRaicesLandingView.tsx` |
| Resultados | `app/(site)/clasificados/bienes-raices/resultados/page.tsx` + `BienesRaicesResultsClient.tsx` |
| URL / filter contract | `resultados/lib/brResultsUrlState.ts`, `brResultsFilters.ts`, `shared/brFilterContract.ts` |
| Publish hub (clasificados) | `app/(site)/clasificados/publicar/bienes-raices/page.tsx` |
| Privado application + preview | `publicar/bienes-raices/privado/`, `bienes-raices/preview/privado/` + `BienesRaicesPrivadoPreviewClient` → `publishLeonixListingFromBienesRaicesPrivadoDraft` |
| Negocio application + preview | `publicar/bienes-raices/negocio/`, `bienes-raices/preview/negocio/` + `publishLeonixListingFromBienesRaicesNegocioDraft` |
| Supabase publish core | `clasificados/lib/leonixPublishRealEstateListingCore.ts` (insert `listings`, storage `listing-images`, RLS/missing-column hints) |
| Draft → publish mapping | `clasificados/lib/leonixPublishRealEstateFromDraftState.ts` |
| Live listing card mapping | `resultados/lib/mapBrListingRowToCard.ts` |
| Canonical live detail | `leonixLiveAnuncioPath` → `/clasificados/anuncio/[id]` (shared anuncio client handles live Supabase rows) |
| Dashboard BR cards | `dashboard/mis-anuncios` uses `LeonixRealEstateListingManageCard` for Leonix `detail_pairs` branches |
| Admin clasificados queue | `app/admin/(dashboard)/workspace/clasificados/page.tsx` + `AdminListingsTable.tsx` with `category`, `leonix_branch`, `leonix_operation`, `leonix_propiedad` filters |
| BR-scoped lint script | `package.json` → `lint:br` |
| Repo selftest (no DB) | `npm run verify:br` → `scripts/br-launch-selftest.ts` |

## MISSING (vs full go-live proof — cannot be TRUE without external runtime)

| Item | Notes |
|------|--------|
| **Authenticated live publish smoke** | Requires real Supabase project, valid `NEXT_PUBLIC_*` keys, RLS allowing `authenticated` insert into `listings`, storage bucket `listing-images`, signed-in browser session. |
| **Signed-in admin smoke** | Requires admin credentials + server `SUPABASE_SERVICE_ROLE` path used by admin workspace. |
| **Moderation outcome proof** | Reporting exists on anuncio client; operational “moderator acted” proof is workflow + DB state outside repo-only verification. |

## UNKNOWN (needs environment / manual confirmation)

| Item | Why unknown from repo alone |
|------|------------------------------|
| Production Supabase insert success rate | Depends on migrations, RLS, and keys on target project. |
| Full-repo `npm run lint` | Fails on unrelated packages (see `LAUNCH_GATE.md`); does not indicate BR-specific ESLint failure. |

## Checkpoint

- **Phase 0 note:** `PRESENT` / `MISSING` / `UNKNOWN` as above — no coding assumptions beyond this file for lost work.
