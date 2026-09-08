/**
 * Gate I.5.7C — behavioral self-test for the Bienes Raíces results route-authority cutover.
 *
 * Gate I.5.7B-R (read-only reconciliation) proved that `BR_RESULTS` in `brPublishRoutes.ts` was
 * the actively-imported constant behind essentially all internal BR results navigation (dashboard
 * links, landing "Browse All", filter/sort/pagination state, clear-all, empty-state CTAs), but its
 * value was the legacy English-slug `/clasificados/bienes-raices/results` — which then bounced
 * every one of those internal navigations through the `next.config.ts` permanent redirect back to
 * `/resultados` on every interaction. Gate I.5.7C repoints the constant's VALUE only; every caller
 * inherits the fix automatically because they all import this same symbol.
 *
 * This test proves, at the source level (no browser/DOM dependency):
 *   1. `BR_RESULTS` now equals the canonical `/resultados` path.
 *   2. The legacy `/results` string is no longer exported as `BR_RESULTS`'s value.
 *   3. `next.config.ts` still contains the untouched compatibility redirect
 *      (`/results` -> `/resultados`, permanent).
 *   4. The compatibility wrapper page and the canonical page both still exist on disk.
 *   5. No live runtime caller (outside next.config.ts / the wrapper / this test / docs/audit
 *      files) still hardcodes the legacy `/clasificados/bienes-raices/results` literal.
 *   6. A representative multi-parameter URL built through the real `mergeBrResultsHref` helper
 *      (the same function the canonical results page uses for every filter/sort/pagination
 *      interaction) lands on `/resultados` with every parameter intact.
 *   7. No redirect loop: the redirect's own destination is not itself a source of another
 *      redirect entry.
 *
 * Run from repo root:
 *   npx tsx scripts/gate-i5-7c-br-results-canonical-constant-selftest.ts
 */
import { strict as assert } from "node:assert";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import { BR_RESULTS } from "../app/(site)/clasificados/bienes-raices/shared/constants/brPublishRoutes";
import { mergeBrResultsHref } from "../app/(site)/clasificados/bienes-raices/resultados/lib/brResultsUrlState";

const REPO_ROOT = path.resolve(__dirname, "..");
const CANONICAL = "/clasificados/bienes-raices/resultados";
const LEGACY = "/clasificados/bienes-raices/results";

/* ------------------------------------------------------------------------------------------ *
 * 1/2 — BR_RESULTS now points at the canonical path, not the legacy one.
 * ------------------------------------------------------------------------------------------ */
assert.equal(BR_RESULTS, CANONICAL, "BR_RESULTS must equal the canonical /resultados path");
assert.notEqual(BR_RESULTS, LEGACY, "BR_RESULTS must no longer equal the legacy /results path");

/* ------------------------------------------------------------------------------------------ *
 * 3 — next.config.ts still carries the untouched compatibility redirect.
 * ------------------------------------------------------------------------------------------ */
const nextConfigSrc = readFileSync(path.join(REPO_ROOT, "next.config.ts"), "utf8");
const redirectBlockMatch = nextConfigSrc.match(
  /source:\s*"\/clasificados\/bienes-raices\/results"\s*,\s*destination:\s*"\/clasificados\/bienes-raices\/resultados"\s*,\s*permanent:\s*true\s*,/,
);
assert.ok(
  redirectBlockMatch,
  "next.config.ts must still contain the untouched /results -> /resultados permanent redirect",
);

/* ------------------------------------------------------------------------------------------ *
 * 4 — both physical pages still exist; neither was deleted by this gate.
 * ------------------------------------------------------------------------------------------ */
assert.ok(
  existsSync(path.join(REPO_ROOT, "app/(site)/clasificados/bienes-raices/results/page.tsx")),
  "the compatibility wrapper page must still exist",
);
assert.ok(
  existsSync(path.join(REPO_ROOT, "app/(site)/clasificados/bienes-raices/resultados/page.tsx")),
  "the canonical resultados page must still exist",
);

/* ------------------------------------------------------------------------------------------ *
 * 5 — no live runtime caller outside the allowed set still hardcodes the legacy literal.
 * ------------------------------------------------------------------------------------------ */
const ALLOWED_LEGACY_LITERAL_FILES = new Set<string>([
  "next.config.ts",
  "app/(site)/clasificados/bienes-raices/results/page.tsx",
  "scripts/gate-i5-7c-br-results-canonical-constant-selftest.ts",
  "scripts/clasificados-route-smoke-audit.ts",
  "app/(site)/clasificados/components/categoryPipeline/catStd1aPipelineRegistry.ts",
  // Doc-comment mentions only (not a runtime value): brPublishRoutes.ts documents the alias in
  // its own header comment; categoryRouteRegistry.ts documents the historical duplicate finding.
  "app/(site)/clasificados/bienes-raices/shared/constants/brPublishRoutes.ts",
  "app/lib/listingIdentity/categoryRouteRegistry.ts",
]);

let grepOutput = "";
try {
  grepOutput = execFileSync(
    "git",
    ["grep", "-l", "-F", LEGACY, "--", "*.ts", "*.tsx"],
    { cwd: REPO_ROOT, encoding: "utf8" },
  );
} catch (err: any) {
  // git grep exits 1 when there are no matches at all — treat that as an empty result set.
  if (err && typeof err.status === "number" && err.status === 1) {
    grepOutput = "";
  } else {
    throw err;
  }
}

const hits = grepOutput
  .split("\n")
  .map((l) => l.trim())
  .filter(Boolean)
  .filter((f) => !f.startsWith("app/lib/website-audit/"))
  .filter((f) => !f.startsWith("docs/"))
  .filter((f) => !f.includes("website-audit"));

const unexpected = hits.filter((f) => !ALLOWED_LEGACY_LITERAL_FILES.has(f.replace(/\\/g, "/")));

assert.deepEqual(
  unexpected,
  [],
  `unexpected files still hardcode the legacy "/clasificados/bienes-raices/results" literal (should now only ever be reached via the BR_RESULTS constant or the allowed compatibility set): ${unexpected.join(", ")}`,
);

/* ------------------------------------------------------------------------------------------ *
 * 6 — a representative multi-param URL built through the real filter-merge helper lands on
 * /resultados with every parameter intact (this is the exact function the canonical results
 * page calls on every filter/sort/pagination interaction).
 * ------------------------------------------------------------------------------------------ */
const currentParams = new URLSearchParams({
  q: "casa",
  city: "San Jose",
  state: "CA",
  zip: "95112",
  propertyType: "house",
  sellerType: "business",
  sort: "price_asc",
  page: "2",
});

const href = mergeBrResultsHref(currentParams, {}, "en");
const [hrefPath, hrefQuery] = href.split("?");

assert.equal(hrefPath, CANONICAL, "mergeBrResultsHref must build hrefs against the canonical path");

const resultParams = new URLSearchParams(hrefQuery);
assert.equal(resultParams.get("lang"), "en");
assert.equal(resultParams.get("q"), "casa");
assert.equal(resultParams.get("city"), "San Jose");
assert.equal(resultParams.get("state"), "CA");
assert.equal(resultParams.get("zip"), "95112");
assert.equal(resultParams.get("propertyType"), "house");
assert.equal(resultParams.get("sellerType"), "business");
assert.equal(resultParams.get("sort"), "price_asc");
assert.equal(resultParams.get("page"), "2");

/* ------------------------------------------------------------------------------------------ *
 * 7 — no redirect loop: the redirect's destination must not itself appear as another
 * redirect's source.
 * ------------------------------------------------------------------------------------------ */
const allSources = [...nextConfigSrc.matchAll(/source:\s*"([^"]+)"/g)].map((m) => m[1]);
assert.ok(
  !allSources.includes(CANONICAL),
  "the canonical destination must never itself appear as a redirect source (would create a loop)",
);

console.log("gate-i5-7c-br-results-canonical-constant-selftest: OK");
