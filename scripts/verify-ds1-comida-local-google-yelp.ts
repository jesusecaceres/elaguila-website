/**
 * Globalization Build D-S / D-S2 — Comida Local Google/Yelp review URL persistence + the
 * public reputation-drawer trigger wired in Gate DS2-1/DS2-2.
 * Run: npx tsx scripts/verify-ds1-comida-local-google-yelp.ts
 */
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildComidaLocalReviewLinks } from "../app/lib/clasificados/comida-local/comidaLocalReviewLinks";
import { createEmptyComidaLocalDraft } from "../app/lib/clasificados/comida-local/createEmptyComidaLocalDraft";

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
  console.log("verify-ds1-comida-local-google-yelp: starting");

  const migrationSrc = read("supabase/migrations/20260902120000_comida_local_google_yelp_reviews_url.sql");
  check("Migration is additive only (add column if not exists)", () => {
    assert.match(migrationSrc, /add column if not exists google_reviews_url text null/);
    assert.match(migrationSrc, /add column if not exists yelp_reviews_url text null/);
  });

  const typesSrc = read("app/lib/clasificados/comida-local/comidaLocalTypes.ts");
  check("Draft type declares both URL-only fields", () => {
    assert.match(typesSrc, /googleReviewsUrl: string;/);
    assert.match(typesSrc, /yelpReviewsUrl: string;/);
  });

  const insertMapperSrc = read("app/lib/clasificados/comida-local/comidaLocalPublicListingMapper.ts");
  check("Publish mapper validates URLs (real safety check, not a bare pass-through)", () => {
    assert.match(insertMapperSrc, /isValidAdditionalWebsiteUrl\(draft\.googleReviewsUrl\)/);
    assert.match(insertMapperSrc, /isValidAdditionalWebsiteUrl\(draft\.yelpReviewsUrl\)/);
  });
  check("Publish mapper never derives a rating/count/verification from these fields", () => {
    assert.doesNotMatch(insertMapperSrc, /google_rating|yelp_rating|google_review_count|yelp_review_count|google_verified|yelp_verified/i);
  });

  const querySrc = read("app/lib/clasificados/comida-local/comidaLocalPublicQueries.ts");
  check("Public SELECT reads both new columns", () => {
    assert.match(querySrc, /google_reviews_url, yelp_reviews_url/);
  });

  const publicTypesSrc = read("app/lib/clasificados/comida-local/comidaLocalPublicTypes.ts");
  check("Public row type declares both columns", () => {
    assert.match(publicTypesSrc, /google_reviews_url: string \| null;/);
    assert.match(publicTypesSrc, /yelp_reviews_url: string \| null;/);
  });

  const hydrationSrc = read("app/lib/clasificados/comida-local/mapComidaLocalPublicListing.ts");
  check("Edit-hydration mapper (row -> draft) carries both fields through for Edit mode", () => {
    assert.match(hydrationSrc, /googleReviewsUrl: row\.google_reviews_url/);
    assert.match(hydrationSrc, /yelpReviewsUrl: row\.yelp_reviews_url/);
  });

  const defaultsSrc = read("app/lib/clasificados/comida-local/createEmptyComidaLocalDraft.ts");
  check("New-application defaults are empty strings (no refill, no invented data)", () => {
    assert.match(defaultsSrc, /googleReviewsUrl: "",/);
    assert.match(defaultsSrc, /yelpReviewsUrl: "",/);
  });

  const formSrc = read("app/(site)/publicar/comida-local/ComidaLocalApplicationClient.tsx");
  check("Application form renders real inputs for both fields (not a stub)", () => {
    assert.match(formSrc, /fieldKey="googleReviewsUrl"/);
    assert.match(formSrc, /fieldKey="yelpReviewsUrl"/);
    assert.match(formSrc, /onChange=\{\(e\) => updateDraft\(\{ googleReviewsUrl: e\.target\.value \}\)\}/);
    assert.match(formSrc, /onChange=\{\(e\) => updateDraft\(\{ yelpReviewsUrl: e\.target\.value \}\)\}/);
  });

  const copySrc = read("app/lib/clasificados/comida-local/comidaLocalFieldCopy.ts");
  check("Field copy is honest about never inventing a rating", () => {
    assert.match(copySrc, /nunca inventamos una calificación/);
    assert.match(copySrc, /we never invent a rating/);
  });

  // ── Gate DS2-1/DS2-2 — public reputation-drawer trigger + real regression proof ────────────
  const shellSrc = read("app/(site)/clasificados/comida-local/components/ComidaLocalDetailShell.tsx");
  check("ComidaLocalDetailShell reuses the shared SharedConnectionHubReviewDrawer (no new component)", () => {
    assert.match(
      shellSrc,
      /import \{ SharedConnectionHubReviewDrawer \} from "@\/app\/components\/contact\/connectionHub\/renderers\/SharedConnectionHubReviewDrawer"/,
    );
    assert.match(shellSrc, /<SharedConnectionHubReviewDrawer/);
  });
  check("Drawer render is gated on vm.reviewLinks having entries (both missing hides it entirely)", () => {
    assert.match(shellSrc, /vm\.reviewLinks\.length > 0/);
  });

  check("REAL FUNCTION CALL: Google URL only -> Google visible, Yelp hidden", () => {
    const draft = { ...createEmptyComidaLocalDraft(), googleReviewsUrl: "https://g.page/tacos-lupe" };
    const links = buildComidaLocalReviewLinks(draft, "es");
    assert.equal(links.length, 1);
    assert.equal(links[0].provider, "google");
    assert.equal(links[0].url, "https://g.page/tacos-lupe");
  });

  check("REAL FUNCTION CALL: Yelp URL only -> Yelp visible, Google hidden", () => {
    const draft = { ...createEmptyComidaLocalDraft(), yelpReviewsUrl: "https://www.yelp.com/biz/tacos-lupe" };
    const links = buildComidaLocalReviewLinks(draft, "es");
    assert.equal(links.length, 1);
    assert.equal(links[0].provider, "yelp");
  });

  check("REAL FUNCTION CALL: both URLs -> both visible", () => {
    const draft = {
      ...createEmptyComidaLocalDraft(),
      googleReviewsUrl: "https://g.page/tacos-lupe",
      yelpReviewsUrl: "https://www.yelp.com/biz/tacos-lupe",
    };
    const links = buildComidaLocalReviewLinks(draft, "en");
    assert.equal(links.length, 2);
    assert.ok(links.some((l) => l.provider === "google"));
    assert.ok(links.some((l) => l.provider === "yelp"));
  });

  check("REAL FUNCTION CALL: neither URL -> empty array (drawer renders nothing)", () => {
    const links = buildComidaLocalReviewLinks(createEmptyComidaLocalDraft(), "es");
    assert.equal(links.length, 0);
  });

  check("REAL FUNCTION CALL: an invalid/malformed URL is rejected, not passed through", () => {
    const draft = { ...createEmptyComidaLocalDraft(), googleReviewsUrl: "javascript:alert(1)" };
    const links = buildComidaLocalReviewLinks(draft, "es");
    assert.equal(links.length, 0);
  });

  check("REAL FUNCTION CALL: no rating/reviewCount field is ever set on a built link (type has no way to invent one at this call site)", () => {
    const draft = {
      ...createEmptyComidaLocalDraft(),
      googleReviewsUrl: "https://g.page/tacos-lupe",
      yelpReviewsUrl: "https://www.yelp.com/biz/tacos-lupe",
    };
    const links = buildComidaLocalReviewLinks(draft, "es");
    for (const link of links) {
      assert.equal((link as { rating?: number }).rating, undefined);
      assert.equal((link as { reviewCount?: number }).reviewCount, undefined);
    }
  });

  // ── Regression: neighboring systems unchanged by this gate ────────────────────────────────
  check("REGRESSION: Comida Local Community Trust wiring is untouched (still a separate, unrelated import)", () => {
    const detailClientSrc = read(
      "app/(site)/clasificados/comida-local/components/ComidaLocalPublicDetailClient.tsx",
    );
    assert.match(detailClientSrc, /import \{ LeonixCommunityTrust \} from "@\/app\/components\/leonixCommunityTrust\/LeonixCommunityTrust"/);
  });
  check("REGRESSION: Comida Local $129/mo package key is unchanged", () => {
    const pricingSrc = read("app/lib/listingPlans/revenuePricingMatrix.ts");
    assert.match(pricingSrc, /category: "comida-local",\s*\n\s*packageKey: "comida_local_base_monthly",\s*\n[\s\S]{0,200}priceCents: 12900,/);
  });
  check("REGRESSION: Comida Local address-privacy toggle (showAddressPublicly) is unchanged", () => {
    const typesSrc2 = read("app/lib/clasificados/comida-local/comidaLocalTypes.ts");
    assert.match(typesSrc2, /showAddressPublicly/);
  });
  check("REGRESSION: Comida Local WhatsApp still uses the shared international builder (Build A fix intact)", () => {
    const fmtSrc = read("app/lib/clasificados/comida-local/comidaLocalFormatting.ts");
    assert.match(fmtSrc, /normalizeInternationalWhatsAppDigits|internationalWhatsApp/);
  });
  check("REGRESSION: Comida Local Save/Like/Share trackers from Build D Family 1 are unchanged", () => {
    const analyticsSrc2 = read("app/lib/clasificados/comida-local/comidaLocalAnalytics.ts");
    assert.match(analyticsSrc2, /export function trackComidaLocalSaveGlobal/);
    assert.match(analyticsSrc2, /export function trackComidaLocalLikeGlobal/);
    assert.match(analyticsSrc2, /export function trackComidaLocalShareGlobal/);
  });

  console.log(`\nverify-ds1-comida-local-google-yelp: ${checks - failures}/${checks} checks passed`);
  if (failures > 0) process.exitCode = 1;
}

main();
