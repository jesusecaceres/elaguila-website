# Site page blocks — foundation (Gate 1)

## Why this table exists

Leonix admin today uses **structured CMS** patterns: mostly `site_section_content` (one JSON `payload` per `section_key`) plus **code-level merge** for defaults on public routes (`mergeHomeMarketing`, `mergeIglesiasPagePayload`, etc.).

The owner wants **reusable ordered blocks** (add / edit / hide / reorder / delete) without replacing the whole site in one release. `public.site_page_blocks` stores **many rows per page** with a stable `page_key`, `locale`, `sort_index`, allowlisted `block_type`, and a small JSON `payload` per row.

This keeps block data **separate from** legacy `site_section_content` rows until a page is explicitly wired to read blocks—so **no hardcoded public content is removed** in this gate.

## Why Iglesias is the first recommended page (later gate)

- **Narrow surface:** `/iglesias` is a transitional landing with a small editor today (`iglesias_page` in `site_section_content`).
- **Lower risk than Home:** `/home` is brand-critical, module-heavy, and already has a full `home_marketing` editor; it should adopt blocks only after the pipeline is proven.
- **Clear fallback story:** Public pages can later do “if blocks exist, render blocks; else existing merge + client” without deleting merge modules.

## Supported block types (`block_type`)

Allowlisted in TypeScript (`app/lib/siteBlocks/blockTypes.ts`):

| `block_type`   | Role |
|----------------|------|
| `hero`         | Headlines, optional CTAs, optional hero image fields |
| `rich_text`    | Long-form body ES/EN |
| `image_text`   | Image + titles + body + optional CTA |
| `cta_strip`    | Short primary/secondary CTA strip |
| `card_group`   | Section titles + `cards[]` (title, body, imageUrl, ctaLabel, ctaHref) |
| `announcement` | Short message strip ES/EN + optional variant string |
| `spacer`       | Vertical gap (`heightRem`, bounded in validation) |

Unknown types are **rejected on save** by `validatePageBlocksForSave`.

## Locales (`locale`)

`es`, `en`, or `neutral` — enforced in SQL `CHECK` and in `validateBlocks.ts`.

## What this gate does

- **Migration:** `supabase/migrations/20260507143000_site_page_blocks.sql` — table, indexes, constraints, RLS enabled **without** broad policies (same service-role posture as `site_section_content`).
- **Types:** `app/lib/siteBlocks/blockTypes.ts`
- **Validation:** `app/lib/siteBlocks/validateBlocks.ts` — `normalizePageBlockInput`, `validatePageBlocksForSave`, max **50** blocks per page, bounded card group size.
- **Data access:** `app/lib/siteBlocks/sitePageBlocksData.ts` — `listPageBlocks`, `listVisiblePageBlocks`, `replacePageBlocks` (delete all for `page_key` + `locale`, then insert; `updated_at` set in application on insert).

## What this gate does **not** do

- No admin UI (no block list/editor screens).
- No public page wiring (`/iglesias` unchanged).
- No changes to `websiteEditingTruthMatrix.ts` statuses.
- No removal or rewrite of legacy merge payloads or `site_section_content` keys.
- No database trigger for `updated_at` (not used for `site_section_content` in this repo either); timestamps are set on write in application code.

## Next gate (recommended)

**Read-only admin block list for Iglesias** under the existing workspace route (e.g. a tab or sub-route under `app/admin/(dashboard)/workspace/iglesias/content/`), calling `listPageBlocks('iglesias', 'es')` / `en` only—still no public render until a dedicated gate.

## Security note

Reads and writes are intended for **trusted server code** using the **Supabase service role**, consistent with `getSiteSectionPayload` / `upsertSiteSectionPayload`. Do not add anon `SELECT` policies without a full security review.
