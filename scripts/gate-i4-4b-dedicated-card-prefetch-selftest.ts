/**
 * Gate I.4.4B — behavioral self-test for the complete dashboard action-link prefetch coverage:
 * every dedicated per-category card component that renders its own `<Link>`s outside the shared
 * `DashboardListingActionBar` (already covered by Gate I.4.4). Same source-text-assertion pattern
 * established in the I.4.4 self-test — these are React components with no natural pure-function
 * extraction point, and this repo's plain-`tsx` self-test convention has no React render harness.
 * No network, no Supabase, no browser. Run from repo root:
 *   npx tsx scripts/gate-i4-4b-dedicated-card-prefetch-selftest.ts
 */
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const REPO_ROOT = join(__dirname, "..");
function src(...parts: string[]): string {
  return readFileSync(join(REPO_ROOT, ...parts), "utf8");
}

const enVentaSrc = src("app", "(site)", "clasificados", "en-venta", "dashboard", "EnVentaListingManageCard.tsx");
const brCardSrc = src("app", "(site)", "dashboard", "components", "LeonixRealEstateListingManageCard.tsx");
const autosCardSrc = src("app", "(site)", "clasificados", "autos", "dashboard", "AutosClassifiedListingManageCard.tsx");
const comidaLocalSrc = src("app", "lib", "clasificados", "comida-local", "ComidaLocalDashboardListings.tsx");
const brInventorySrc = src("app", "(site)", "clasificados", "bienes-raices", "dashboard", "BrPropertyInventoryDashboardSection.tsx");
const misAnunciosSrc = src("app", "(site)", "dashboard", "mis-anuncios", "page.tsx");
const actionBarSrc = src("app", "(site)", "dashboard", "components", "DashboardListingActionBar.tsx");
const shellSrc = src("app", "(site)", "dashboard", "components", "LeonixDashboardShell.tsx");

function countLinks(text: string): number {
  return (text.match(/<Link\b/g) ?? []).length;
}
function countPrefetchFalse(text: string): number {
  return (text.match(/prefetch=\{false\}/g) ?? []).length;
}

/* ------------------------------------------------------------------------------------------ *
 * 1/3 — every per-listing Link in every dedicated card now disables prefetch, and every one is
 * still a real next/link <Link> (unchanged click/navigation behavior).
 * ------------------------------------------------------------------------------------------ */

for (const [name, text, expectedPerListingLinks] of [
  ["EnVentaListingManageCard.tsx", enVentaSrc, 5],
  ["LeonixRealEstateListingManageCard.tsx", brCardSrc, 3],
  // Package E Build E2, Gate 4 — added a real, confirmed-live Autos Privado Edit link
  // (previously unwired), matching the same "add editHref prop, gate on it" pattern every
  // other dedicated card already used. 1 -> 2, prefetch={false} on the new link too.
  ["AutosClassifiedListingManageCard.tsx", autosCardSrc, 2],
  ["BrPropertyInventoryDashboardSection.tsx", brInventorySrc, 1],
] as const) {
  assert.match(text, /import Link from "next\/link";/, `${name} must still import next/link's <Link>`);
  assert.equal(countLinks(text), expectedPerListingLinks, `${name} must still render exactly ${expectedPerListingLinks} <Link> element(s)`);
  assert.equal(
    countPrefetchFalse(text),
    expectedPerListingLinks,
    `${name}: every <Link> must now have prefetch={false} (${expectedPerListingLinks} expected)`,
  );
}

// Comida Local: 3 total <Link> elements, but only the 2 per-listing ones (inside the .map loop)
// get prefetch={false} — the empty-state "Publish" CTA (rendered once, not per listing) must
// stay on default prefetch, matching the "Publish/Create CTA" exemption class.
{
  assert.equal(countLinks(comidaLocalSrc), 3, "ComidaLocalDashboardListings.tsx must still render exactly 3 <Link> elements");
  assert.equal(countPrefetchFalse(comidaLocalSrc), 2, "only the 2 per-listing links (inside the .map loop) must have prefetch disabled");
  assert.match(
    comidaLocalSrc,
    /href=\{`\/publicar\/comida-local\?\$\{q\}`\}\s*\n\s*className="mt-4 inline-flex/,
    "the empty-state 'Publish Comida Local' CTA must remain untouched (not per-listing, not prefetch-disabled)",
  );
}

/* ------------------------------------------------------------------------------------------ *
 * 2 — href expressions are byte-identical to before this gate (only `prefetch={false}` added).
 * ------------------------------------------------------------------------------------------ */

assert.match(enVentaSrc, /href=\{`\/clasificados\/anuncio\/\$\{row\.id\}\?lang=\$\{lang\}`\}/, "En Venta public-view href must be unchanged");
assert.match(enVentaSrc, /href=\{editHref\}/, "En Venta edit href must be unchanged");
assert.match(brCardSrc, /href=\{publicViewHref\}/, "BR public-view href must be unchanged");
assert.match(brCardSrc, /href=\{brDashboardEditHref\}/, "BR edit href must be unchanged");
assert.match(brCardSrc, /href=\{brDashboardPreviewHref\}/, "BR preview href must be unchanged");
assert.match(autosCardSrc, /href=\{`\/clasificados\/anuncio\/\$\{row\.id\}\?lang=\$\{lang\}`\}/, "Autos public-view href must be unchanged");
assert.match(brInventorySrc, /href=\{`\$\{leonixLiveAnuncioPath\(mainId\)\}\?lang=\$\{lang\}`\}/, "BR inventory 'view parent listing' href must be unchanged");

/* ------------------------------------------------------------------------------------------ *
 * mis-anuncios/page.tsx's inline generic card (Clases/Comunidad/Busco) — 6 per-listing links.
 * ------------------------------------------------------------------------------------------ */
{
  const startMarker = "const catLower = (x.category";
  const startIdx = misAnunciosSrc.indexOf(startMarker);
  assert.ok(startIdx >= 0, "the generic Clases/Comunidad/Busco inline card block must still exist in mis-anuncios/page.tsx");
  const endMarker = "{t.archiveAd}";
  const endIdx = misAnunciosSrc.indexOf(endMarker, startIdx);
  assert.ok(endIdx > startIdx, "the generic inline card's archive-button marker must still be present after its start");
  const block = misAnunciosSrc.slice(startIdx, endIdx + endMarker.length);
  // Package E Build E2, Gate 4 — added a real Edit link for Clases/Comunidad/Busco (the
  // existing generic listings-table editor, previously unwired for these three categories;
  // Mascotas still gets none, by design). 6 -> 7, prefetch={false} on the new link too.
  assert.equal(countLinks(block), 7, "the generic inline card must still render exactly 7 <Link> elements");
  assert.equal(countPrefetchFalse(block), 7, "every one of the generic inline card's 7 links must have prefetch disabled");
}

/* ------------------------------------------------------------------------------------------ *
 * 4/5 — lifecycle mutation buttons and primary navigation are untouched.
 * ------------------------------------------------------------------------------------------ */

// Lifecycle buttons (non-Link elements) remain byte-identical in structure.
assert.match(enVentaSrc, /<button\s*\n\s*type="button"\s*\n\s*disabled=\{visibilityRenewal\.busy\}/, "the En Venta renewal button must remain unchanged");
assert.match(brCardSrc, /brPauseAction \? \(/, "BR lifecycle pause-action gating must remain unchanged");

// Primary dashboard navigation (sidebar/publish CTA) must not have been touched by this gate —
// re-confirms Gate I.4.4's own exemption still holds after this gate's additional edits.
const shellLinkBlocks = shellSrc.match(/<Link\b[\s\S]*?<\/Link>/g) ?? [];
assert.ok(shellLinkBlocks.length >= 2, "the shell must still render its primary nav/publish <Link> elements");
for (const block of shellLinkBlocks) {
  assert.doesNotMatch(block, /prefetch=\{false\}/, "primary shell navigation links must remain on default prefetch");
}

// Category-level action links in mis-anuncios/page.tsx (categoryPanelActions — publish/results
// for the SELECTED category, not per-listing) must remain untouched, matching the "category
// navigation" exemption class, not the per-listing action class.
const categoryActionBlocks = misAnunciosSrc.match(/\{categoryPanelActions\.map\(\(action\) => \([\s\S]*?<\/Link>\s*\)\)\}/g) ?? [];
assert.ok(categoryActionBlocks.length >= 1, "categoryPanelActions rendering must still exist");
for (const block of categoryActionBlocks) {
  assert.doesNotMatch(block, /prefetch=\{false\}/, "category-level action links (not per-listing) must remain on default prefetch");
}

/* ------------------------------------------------------------------------------------------ *
 * 6 — the shared action bar (Gate I.4.4) remains covered.
 * ------------------------------------------------------------------------------------------ */
assert.equal(countLinks(actionBarSrc), 1, "the shared action bar must still render exactly one <Link> call site");
assert.match(actionBarSrc, /prefetch=\{false\}/, "the shared action bar's per-listing Link must still disable prefetch");

console.log(`gate-i4-4b-dedicated-card-prefetch-selftest: OK`);
