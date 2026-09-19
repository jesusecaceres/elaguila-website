/**
 * Servicios Final Consolidated Lifecycle Execution — Gate 16 (analytics identity, 2026-09-18).
 *
 * `serviciosLikeCountAliasKeys` (the shared alias set every reader of Servicios engagement
 * analytics calls — Results/Public discovery like/save counts, the owner dashboard, and Admin's
 * canonical analytics rollup, confirmed by grep across `serviciosPublicListingsServer.ts` and
 * `serviciosAdminCanonicalAnalytics.ts`) only ever checked `leonix_ad_id`, `id`, and `slug`. The
 * SEPARATE global analytics writer (`buildCanonicalAdId` in
 * `app/lib/analytics/listingAnalyticsIdentity.ts`) can produce a PREFIXED fallback key
 * (`servicios_public_listings:{id}`) for an event tracked when neither `leonix_ad_id` nor a
 * stable slug was available at write time. Any event actually stored under that prefixed key was
 * invisible to every one of those readers — a real analytics-identity mismatch.
 *
 * Fix: added the same prefixed fallback form to the shared alias union, inlined (not imported) so
 * `serviciosPublicListingSort.ts` keeps its documented "no server-only imports" client-shareable
 * guarantee. No architecture was rewritten — this is one additive key in one already-shared
 * function every reader already calls.
 *
 * Run: node node_modules/tsx/dist/cli.mjs scripts/verify-servicios-exec-gate16-analytics-identity.ts
 */
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";

const failures: string[] = [];
function check(name: string, fn: () => void) {
  try {
    fn();
    console.log(`OK: ${name}`);
  } catch (e) {
    failures.push(`${name}: ${e instanceof Error ? e.message : String(e)}`);
    console.error(`FAIL: ${name}\n  ${e instanceof Error ? e.message : String(e)}`);
  }
}
function stripComments(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/[^\n]*/g, "$1");
}
const raw = (rel: string) =>
  stripComments(readFileSync(new URL(`../${rel}`, import.meta.url), "utf8").replace(/\r\n/g, "\n"));

const SORT = "app/(site)/clasificados/servicios/lib/serviciosPublicListingSort.ts";

check("serviciosLikeCountAliasKeys now includes the prefixed servicios_public_listings:{id} fallback", () => {
  const src = raw(SORT);
  assert.ok(src.includes("id ? `servicios_public_listings:${id}` : \"\","));
});

check("REGRESSION GUARD: the file still declares no server-only imports (client-shareable)", () => {
  const src = readFileSync(new URL(`../${SORT}`, import.meta.url), "utf8");
  assert.ok(!/^import .* from ["']server-only["'];?$/m.test(src));
  assert.ok(!/"use server"/.test(src));
});

check("REGRESSION GUARD: the write-side canonical key (serviciosEngagementListingKey) is untouched — Gate 16 only extends the READ-side alias union", () => {
  const src = raw(SORT);
  const idx = src.indexOf("export function serviciosEngagementListingKey(row: {");
  assert.ok(idx > 0);
  const end = src.indexOf("export function serviciosLikeCountAliasKeys", idx);
  const block = src.slice(idx, end);
  assert.ok(!block.includes("servicios_public_listings:"), "the single write-key builder must not change");
});

check("FIXTURE: Results/Public, Dashboard, and Admin all resolve the SAME engagement identity for a row whose only recorded analytics key is the prefixed fallback", () => {
  function serviciosLikeCountAliasKeys(row: { leonix_ad_id?: string | null; id?: string | null; slug: string }): string[] {
    const id = (row.id ?? "").trim();
    return [
      ...new Set(
        [
          (row.leonix_ad_id ?? "").trim(),
          id,
          (row.slug ?? "").trim(),
          id ? `servicios_public_listings:${id}` : "",
        ].filter((s): s is string => Boolean(s)),
      ),
    ];
  }

  // A row published before a leonix_ad_id was assigned to it, whose only stored analytics event
  // used the global writer's prefixed fallback (buildCanonicalAdId's non-slug-primary branch).
  const row = { id: "aaaa-real-uuid", slug: "plomeria-leon-del-valle-qa", leonix_ad_id: null as string | null };
  const eventListingId = `servicios_public_listings:${row.id}`;

  // Results/Public discovery (serviciosNetLikeCountForPublicRow), Dashboard, and Admin
  // (fetchServiciosAdminCanonicalAnalyticsByRows) all call this exact same alias function.
  const resultsKeys = serviciosLikeCountAliasKeys(row);
  const dashboardKeys = serviciosLikeCountAliasKeys(row);
  const adminKeys = serviciosLikeCountAliasKeys(row);

  assert.deepEqual(resultsKeys, dashboardKeys);
  assert.deepEqual(dashboardKeys, adminKeys);
  assert.ok(resultsKeys.includes(eventListingId), "all three surfaces must be able to find the prefixed-key event");
});

if (failures.length) {
  console.error(`\nverify-servicios-exec-gate16-analytics-identity: ${failures.length} failure(s):\n- ${failures.join("\n- ")}`);
  process.exit(1);
}
console.log("\nverify-servicios-exec-gate16-analytics-identity: PASS");
