# Viajes Globalization Dependency Handoff

## Source

- Recorded from: `integration/lifecycle-foundation-2026-07` (Globalization), Package F Build F2, Gate 18.
- Isolated Viajes worktree: `C:\projects\elaguila-website-viajes`, branch `integration/viajes-launch-qa-2026-08`.
- This branch already carries a base copy of the Viajes route tree (it is not fully isolated); the dedicated Viajes worktree carries a small additional delta on top of it. Nothing in Viajes' own internals was edited from this branch during F2 — this document is read-only findings, per the F2 build's locked-files rule (Viajes product internals are out of scope for Globalization).

## Mandatory Ownership Rule

Globalization does not own Viajes-internal routing or product decisions. The three items below were discovered while auditing shared SEO/indexing/legacy-route patterns across every category (Gates 3, 4, 10 of this build) and are handed off for the Viajes branch to resolve on its own timeline, using the same patterns Globalization already applied to every other category it owns.

## Item 1 — Preview routes have zero noindex signal

- Exact files: `app/(site)/clasificados/viajes/preview/page.tsx`, `app/(site)/clasificados/viajes/preview/negocios/page.tsx`, `app/(site)/clasificados/viajes/preview/privado/page.tsx`.
- Confirmed (re-verified during this build): all three export no `metadata`/`generateMetadata` at all — no `robots: { index: false, follow: false }`, nothing. Protection today is `robots.txt`-only, which does not prevent indexing of a bare URL that gets externally linked.
- Established fix pattern (already applied by Globalization to every other category's equivalent preview routes in this same build — En Venta, Autos Privado, Autos Negocios, Restaurantes, Servicios pending/rejected states): import `PREVIEW_NOINDEX_METADATA` from `app/lib/seo/previewRouteMetadata.ts` and spread it into each page's `metadata` export.
- Suggested change (illustrative only, not applied):
  ```ts
  import type { Metadata } from "next";
  import { PREVIEW_NOINDEX_METADATA } from "@/app/lib/seo/previewRouteMetadata";

  export const metadata: Metadata = { ...PREVIEW_NOINDEX_METADATA };
  ```
- Acceptance test: preview pages carry `<meta name="robots" content="noindex,nofollow">` (or equivalent header), no other metadata behavior changes.

## Item 2 — Dead legacy route: `viajes/negocio/[slug]`

- Exact file: `app/(site)/clasificados/viajes/negocio/[slug]/page.tsx`.
- Confirmed dead in production: `viajesAllowCuratedDemoCatalog()` gates every branch of this page (`generateStaticParams`, `generateMetadata`, and the page body itself all call `notFound()`/return empty when it's false), and that function is hard-`false` in production — this route never resolves to real content for any real visitor.
- The real, live route is `/clasificados/viajes/oferta/[slug]`.
- Recommendation (not applied, Viajes' call): retire this route (delete, or replace with a `redirect()` to the results/oferta equivalent) at the Viajes branch's own merge, since it lives entirely within Viajes' owned directory tree.

## Item 3 — `/results` vs `/resultados` duplicate content

- Confirmed this build: `app/(site)/clasificados/viajes/results/page.tsx` is a literal `export { default } from "../resultados/page"` re-export — `/resultados` (Spanish) is the real canonical content, `/results` is a duplicate alias, same shape as the ~10 other categories Globalization already fixed in this build via `next.config.ts` redirects (Gate 4).
- No `next.config.ts` redirect entry exists for this pair today — intentionally not added by Globalization, since Viajes' real live-CTA authority (which internal callers actually link to `/results` vs `/resultados`) was not independently re-verified for this category, and Gate 4's own rule was "do not assume Spanish resultados for every case without verifying current public CTA/runtime authority."
- Recommendation: before F3, the Viajes branch (or Globalization, if asked) should verify real internal callers the same way Gate 4 did for every other category, then either add the two matching `next.config.ts` redirect entries or request that addition from Globalization as a small follow-up.

## What the Viajes branch must prove before F3

1. Preview noindex closed (Item 1) — verifiable via a live head request to each of the 3 preview URLs.
2. Legacy dead route resolved (Item 2) — either deleted/redirected, or explicitly deferred with a documented reason.
3. `/results` vs `/resultados` canonicalization resolved (Item 3) — real-caller verification done, redirect added if warranted.
4. Confirm the Viajes admin analytics "mock data" label (already self-identified and honestly rendered per Package D's gate script) still renders live and honest — this was already proven as a pinned regression, just needs a live re-confirmation post-merge, no code change expected.
5. Standard cross-workstream integration check: confirm no shared-boundary file conflicts were introduced by the Viajes branch's own 3-commit delta (mirroring the reconciliation Ofertas already completed for Package 11 — see `docs/OFERTAS_PACKAGE_11_GLOBALIZATION_DEPENDENCY_HANDOFF.md` for the reference shape of that kind of handoff).

## Safety

- No Production.
- No main.
- No edits to any Viajes-owned file from this branch.
- Read-only findings only.
