# COMING-SOON-V2-CATALOG-CTA-01 — Make “Ver Clasificados” Open the Visual Catalog PDF

## Gate title
COMING-SOON-V2-CATALOG-CTA-01 — Make “Ver Clasificados” Open the Visual Catalog PDF

## Files changed
- `app/components/leonix/coming-soon-v2/comingSoonV2Copy/assemble.ts`
- `app/components/leonix/coming-soon-v2/ComingSoonV2Shell.tsx`

## Original CTA target
`/clasificados?lang={lang}` (marketplace `exploreCta` in Coming Soon V2)

## New CTA target
`/catalogos/leonix-clasificados-catalogo-visual.pdf`

## Scope confirmation
- Only Coming Soon V2 marketplace “Explorar Clasificados” / “Explore Classifieds” CTA changed
- Global navbar not changed
- Other classifieds links elsewhere not changed

## PDF expected path
`public/catalogos/leonix-clasificados-catalogo-visual.pdf`

## PDF exists locally
Yes (verified at gate time)

## Link behavior
- `target="_blank"`
- `rel="noopener noreferrer"`
- `aria-label` set per page language (ES/EN)

## Build result
**PASSED** (`npm run build`, exit code 0)

## TRUE/FALSE audit

| Requirement | TRUE/FALSE | Evidence |
| ----------- | ---------- | -------- |
| Correct repo confirmed | TRUE | `C:/projects/elaguila-website` on `main` |
| Dirty files inspected | TRUE | Only `public/catalogos/` untracked before edit |
| Coming Soon V2 CTA found | TRUE | `MarketplaceSection` `exploreCta` |
| Only Coming Soon V2 “Ver Clasificados” changed | TRUE | `assemble.ts` + `MarketplaceSection` only |
| CTA points to `/catalogos/leonix-clasificados-catalogo-visual.pdf` | TRUE | `LEONIX_CLASIFICADOS_CATALOG_PDF` |
| CTA opens in a new tab | TRUE | `target="_blank"` on `<a>` |
| rel noopener noreferrer added | TRUE | `rel="noopener noreferrer"` |
| Button visual styling preserved | TRUE | Same `exploreCtaClassName` classes |
| Global navbar untouched | TRUE | No navbar files changed |
| Other classifieds links untouched | TRUE | No `/clasificados` route edits |
| PDF path checked | TRUE | File present under `public/catalogos/` |
| npm run build passed | TRUE | exit code 0 |
| No files staged | TRUE | `git diff --cached --name-only` empty |
| No commit | TRUE | — |
| No push | TRUE | — |
