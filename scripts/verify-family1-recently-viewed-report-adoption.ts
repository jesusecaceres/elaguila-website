/**
 * Globalization Build D, Family 1 (Servicios/Restaurantes/Comida Local) — targeted verifier for
 * the Recently Viewed + Report adoption sweep. Both features are composed behind one small
 * shared client mount (RecentlyViewedAndReportMount.tsx) that reuses the EXISTING shared
 * contracts (addListingView from app/lib/recentlyViewed.ts, LeonixInlineListingReport.tsx) —
 * no new engine, no new storage model, no per-category Report flow.
 *
 * Run from repo root:
 *   npx tsx scripts/verify-family1-recently-viewed-report-adoption.ts
 *
 * These are structural source checks (no live Next.js render available in a pure-logic script),
 * each reading the real current file contents on disk — not a fabricated pass.
 */
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const REPO_ROOT = join(__dirname, "..");
const read = (rel: string) => readFileSync(join(REPO_ROOT, rel), "utf8");

let failures = 0;
let checks = 0;

function check(label: string, fn: () => void): void {
  checks += 1;
  try {
    fn();
    console.log(`  ok  - ${label}`);
  } catch (err) {
    failures += 1;
    console.error(`  FAIL - ${label}`);
    console.error(`         ${err instanceof Error ? err.message : String(err)}`);
  }
}

function main(): void {
  console.log("verify-family1-recently-viewed-report-adoption: starting");

  const mountSrc = read("app/(site)/clasificados/components/RecentlyViewedAndReportMount.tsx");

  check("RecentlyViewedAndReportMount reuses the real shared addListingView (no reimplementation)", () => {
    assert.match(mountSrc, /import\s*\{\s*addListingView\s*\}\s*from\s*"@\/app\/lib\/recentlyViewed"/);
  });

  check("RecentlyViewedAndReportMount reuses the real canonical LeonixInlineListingReport (no per-category Report flow)", () => {
    assert.match(mountSrc, /import\s*\{\s*LeonixInlineListingReport\s*\}\s*from\s*"@\/app\/clasificados\/components\/LeonixInlineListingReport"/);
  });

  check("RecentlyViewedAndReportMount does not render if listingId is empty (no report CTA if impossible)", () => {
    assert.match(mountSrc, /if\s*\(!listingId\.trim\(\)\)\s*return null/);
  });

  const pages: Array<{ label: string; path: string; requiresLiveGate?: boolean }> = [
    { label: "Servicios", path: "app/(site)/clasificados/servicios/[slug]/page.tsx", requiresLiveGate: true },
    { label: "Restaurantes", path: "app/(site)/clasificados/restaurantes/[slug]/page.tsx" },
    { label: "Comida Local", path: "app/(site)/clasificados/comida-local/[slug]/page.tsx" },
  ];

  for (const page of pages) {
    const src = read(page.path);
    check(`${page.label} public detail page imports RecentlyViewedAndReportMount`, () => {
      assert.match(src, /import\s*\{\s*RecentlyViewedAndReportMount\s*\}\s*from\s*"@\/app\/clasificados\/components\/RecentlyViewedAndReportMount"/);
    });
    check(`${page.label} public detail page actually renders <RecentlyViewedAndReportMount`, () => {
      assert.match(src, /<RecentlyViewedAndReportMount\s/);
    });
    if (page.requiresLiveGate) {
      check(`${page.label} gates the mount on isPublishedLive (no draft/preview contamination)`, () => {
        assert.match(src, /isPublishedLive\s*\?\s*\(\s*<div[^>]*>\s*<RecentlyViewedAndReportMount/);
      });
    }
  }

  // Confirm the queries backing Restaurantes/Comida Local's detail pages already filter to
  // published-only rows server-side, so an unconditional render there is safe (no separate
  // isPublishedLive gate needed, unlike Servicios which serves paused/pending/rejected rows too).
  const restaurantesQuerySrc = read(
    "app/(site)/clasificados/restaurantes/lib/restaurantesPublicListingsServer.ts",
  );
  check("Restaurantes detail query filters status='published' server-side", () => {
    assert.match(restaurantesQuerySrc, /\.eq\("status",\s*"published"\)/);
  });

  const comidaLocalQuerySrc = read("app/lib/clasificados/comida-local/comidaLocalPublicQueries.ts");
  check("Comida Local detail query filters to the published-only constant server-side", () => {
    assert.match(comidaLocalQuerySrc, /\.eq\("status",\s*COMIDA_LOCAL_PUBLIC_STATUS_PUBLISHED\)/);
  });

  console.log(
    `\nverify-family1-recently-viewed-report-adoption: ${checks - failures}/${checks} checks passed`,
  );
  if (failures > 0) {
    process.exitCode = 1;
  }
}

main();
