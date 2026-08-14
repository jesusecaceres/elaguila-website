/**
 * Gate I.4.4C — behavioral self-test closing the final known scalable dashboard action-link
 * prefetch gap: `BrNegocioListingInventoryActions.tsx`'s "manage inventory pack" link. Same
 * source-text-assertion pattern established in the I.4.4/I.4.4B self-tests — no React render
 * harness exists in this project's plain-`tsx` self-test convention. Also re-confirms I.4.4's
 * shared action bar and I.4.4B's dedicated-card coverage are still intact, so this test doubles
 * as the "all currently wired category action links are now covered" proof. No network, no
 * Supabase, no browser. Run from repo root:
 *   npx tsx scripts/gate-i4-4c-br-inventory-final-prefetch-gap-selftest.ts
 */
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const REPO_ROOT = join(__dirname, "..");
function src(...parts: string[]): string {
  return readFileSync(join(REPO_ROOT, ...parts), "utf8");
}

const brInventoryActionsSrc = src(
  "app",
  "(site)",
  "clasificados",
  "bienes-raices",
  "dashboard",
  "BrNegocioListingInventoryActions.tsx",
);

function countLinks(text: string): number {
  return (text.match(/<Link\b/g) ?? []).length;
}
/** Counts real JSX `prefetch={false}` attribute usages, excluding any backtick-quoted mention of
 * the same text inside an explanatory comment (e.g. `DashboardListingActionBar.tsx`'s own Gate
 * I.4.4 comment references the literal text as documentation, not as a second attribute). */
function countPrefetchFalse(text: string): number {
  return (text.match(/(?<!`)prefetch=\{false\}(?!`)/g) ?? []).length;
}

/* ------------------------------------------------------------------------------------------ *
 * 1/2/3 — the remaining link now disables prefetch; href expression and entitlement/upgrade
 * visibility condition are unchanged.
 * ------------------------------------------------------------------------------------------ */

assert.match(brInventoryActionsSrc, /import Link from "next\/link";/, "must still use next/link's <Link>");
// Globalization Package B Gate B4 added the per-child "Editar propiedad" and "Ver pública"
// links (direct child dashboard actions) — the coverage rule stays: every action <Link> in
// this file disables prefetch, so the two counts must remain equal.
assert.equal(countLinks(brInventoryActionsSrc), 3, "must render exactly 3 <Link> elements (manage pack + child edit + child public)");
assert.equal(countPrefetchFalse(brInventoryActionsSrc), 3, "every Link in this file must have prefetch={false}");

assert.match(
  brInventoryActionsSrc,
  /\{upgradeActive \? \(\s*<Link\s*\n\s*href=\{inventoryEditHref\}\s*\n\s*prefetch=\{false\}/,
  "the link must remain gated behind the exact same `upgradeActive` condition, with href={inventoryEditHref} unchanged",
);
assert.match(
  brInventoryActionsSrc,
  /\) : \(\s*<button\s*\n\s*type="button"\s*\n\s*disabled=\{checkoutBusy \|\| entitlementActive === null\}/,
  "the else-branch checkout button (entitlement-gated) must remain unchanged",
);

/* ------------------------------------------------------------------------------------------ *
 * 6/7 — no lifecycle/inventory behavior or unrelated structure changed: the value-drawer
 * triggers and inventory-count computation are untouched.
 * ------------------------------------------------------------------------------------------ */
assert.match(brInventoryActionsSrc, /computeBrPropertyInventoryCounts/, "inventory count computation must remain unchanged");
assert.match(brInventoryActionsSrc, /<BrPropertyInventoryValueDrawerTrigger/, "value-drawer triggers must remain unchanged");

/* ------------------------------------------------------------------------------------------ *
 * 4/5/8 — re-confirm Gate I.4.4's shared action bar and Gate I.4.4B's dedicated-card coverage
 * are still intact, completing full known-catalog coverage.
 * ------------------------------------------------------------------------------------------ */

const actionBarSrc = src("app", "(site)", "dashboard", "components", "DashboardListingActionBar.tsx");
assert.equal(countLinks(actionBarSrc), 1, "the shared action bar must still render exactly one <Link> call site");
assert.equal(countPrefetchFalse(actionBarSrc), 1, "the shared action bar's per-listing Link must still disable prefetch");

const dedicatedCards: Array<[string[], number]> = [
  [["app", "(site)", "clasificados", "en-venta", "dashboard", "EnVentaListingManageCard.tsx"], 5],
  [["app", "(site)", "dashboard", "components", "LeonixRealEstateListingManageCard.tsx"], 3],
  // Package E Build E2, Gate 4 — real Autos Privado Edit link added, prefetch-disabled like
  // every other per-listing action; 1 -> 2.
  [["app", "(site)", "clasificados", "autos", "dashboard", "AutosClassifiedListingManageCard.tsx"], 2],
  [["app", "(site)", "clasificados", "bienes-raices", "dashboard", "BrPropertyInventoryDashboardSection.tsx"], 1],
];
for (const [pathParts, expected] of dedicatedCards) {
  const text = src(...pathParts);
  assert.equal(countPrefetchFalse(text), expected, `${pathParts[pathParts.length - 1]} must still have ${expected} prefetch-disabled link(s)`);
}

const comidaLocalSrc = src("app", "lib", "clasificados", "comida-local", "ComidaLocalDashboardListings.tsx");
assert.equal(countPrefetchFalse(comidaLocalSrc), 2, "Comida Local must still have its 2 per-listing links prefetch-disabled");

const misAnunciosSrc = src("app", "(site)", "dashboard", "mis-anuncios", "page.tsx");
{
  const startIdx = misAnunciosSrc.indexOf("const catLower = (x.category");
  assert.ok(startIdx >= 0, "the generic Clases/Comunidad/Busco inline card block must still exist");
  const endIdx = misAnunciosSrc.indexOf("{t.archiveAd}", startIdx);
  assert.ok(endIdx > startIdx, "the generic inline card's archive-button marker must still be present");
  const block = misAnunciosSrc.slice(startIdx, endIdx + "{t.archiveAd}".length);
  // Package E Build E2, Gate 4 — real Edit link added for Clases/Comunidad/Busco; 6 -> 7.
  assert.equal(countPrefetchFalse(block), 7, "the generic inline card must still have all 7 links prefetch-disabled");
}

// No primary navigation link was touched by this gate.
const shellSrc = src("app", "(site)", "dashboard", "components", "LeonixDashboardShell.tsx");
const shellLinkBlocks = shellSrc.match(/<Link\b[\s\S]*?<\/Link>/g) ?? [];
assert.ok(shellLinkBlocks.length >= 2, "the shell must still render its primary nav/publish <Link> elements");
for (const block of shellLinkBlocks) {
  assert.doesNotMatch(block, /prefetch=\{false\}/, "primary shell navigation links must remain on default prefetch");
}

console.log(`gate-i4-4c-br-inventory-final-prefetch-gap-selftest: OK`);
