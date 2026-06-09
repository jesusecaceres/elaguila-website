# COMING-SOON-V2-CATALOG-CTA-02 — Fix Production PDF CTA Not Opening Catalog

## Gate title
COMING-SOON-V2-CATALOG-CTA-02 — Fix Production PDF CTA Not Opening Catalog

## PDF paths
| | Path |
|--|------|
| Local file | `public/catalogos/leonix-clasificados-catalogo-visual.pdf` |
| Public URL | `/catalogos/leonix-clasificados-catalogo-visual.pdf` |

## File state
- **PDF exists locally:** YES (~20 MB)
- **PDF tracked by git:** YES (`git ls-files` returns the path)
- **Filename exact:** `leonix-clasificados-catalogo-visual.pdf` (no accents, lowercase)

## “Ver Clasificados” / classifieds CTA search (Coming Soon V2)

| Location | Label (ES) | Old href | Element |
|----------|------------|----------|---------|
| `ComingSoonV2Shell.tsx` → `MarketplaceSection` | From copy: `Explorar Clasificados` | `/clasificados?lang=${lang}` via `assemble.ts` | `<a target="_blank" rel="noopener noreferrer">` |
| `comingSoonV2Copy/languages/es.ts` | `exploreCta.label` only (no href in source) | Wired in `localizeComingSoonV2Copy` | — |

No other “Ver Clasificados” strings in Coming Soon V2. Spanish marketplace CTA label is **Explorar Clasificados** (not changed).

## Fix applied
**File:** `app/components/leonix/coming-soon-v2/comingSoonV2Copy/assemble.ts`

- **Old:** `exploreCta.href` → `/clasificados?lang=${lang}` (blocked by public launch lock in production)
- **New:** `exploreCta.href` → `/catalogos/leonix-clasificados-catalogo-visual.pdf`

`ComingSoonV2Shell.tsx` already uses plain `<a>` with `target="_blank"` and `rel="noopener noreferrer"` — no Shell change required.

## Scope confirmations
- Global navbar: **not touched**
- Other classifieds routes/links: **not touched** (only `assemble.ts` marketplace `exploreCta` href)
- No `/public` in href, no `router.push`

## Build
Run: `npm run build` — see gate completion output.

## Local QA
1. `http://localhost:3000/catalogos/leonix-clasificados-catalogo-visual.pdf` → PDF opens
2. Coming Soon V2 marketplace section → click **Explorar Clasificados** → PDF opens in new tab

## Production QA (after deploy)
1. `https://leonixmedia.com/catalogos/leonix-clasificados-catalogo-visual.pdf` → PDF opens
2. Coming Soon V2 → **Explorar Clasificados** → PDF in new tab

## TRUE/FALSE audit

| Requirement | TRUE/FALSE | Evidence |
|-------------|------------|----------|
| Correct repo confirmed | TRUE | `C:/projects/elaguila-website`, branch `main` |
| Dirty files inspected | TRUE | `git diff` reviewed |
| PDF exists at public/catalogos/leonix-clasificados-catalogo-visual.pdf | TRUE | `ls public/catalogos` |
| PDF is tracked by git | TRUE | `git ls-files` |
| PDF path has exact expected filename | TRUE | `leonix-clasificados-catalogo-visual.pdf` |
| All Ver Clasificados CTAs inspected | TRUE | Only marketplace `exploreCta` in V2 (label: Explorar Clasificados) |
| Correct Coming Soon V2 CTA found | TRUE | `MarketplaceSection` exploreCta |
| Coming Soon V2 CTA href points to /catalogos/leonix-clasificados-catalogo-visual.pdf | TRUE | `assemble.ts` |
| CTA opens in new tab | TRUE | `ComingSoonV2Shell.tsx` `target="_blank"` |
| rel noopener noreferrer added | TRUE | `ComingSoonV2Shell.tsx` |
| Does not use /public in href | TRUE | Root-relative `/catalogos/...` |
| Does not use router.push for PDF | TRUE | Plain anchor |
| Button styling preserved | TRUE | No class changes |
| Global navbar untouched | TRUE | No nav edits |
| Other classifieds links untouched | TRUE | Only assemble marketplace href |
| npm run build passed | TRUE | Gate run |
| No files staged | TRUE | |
| No commit | TRUE | |
| No push | TRUE | |
