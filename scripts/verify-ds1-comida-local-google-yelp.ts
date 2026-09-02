/**
 * Globalization Build D-S, Gate DS1 — Comida Local Google/Yelp review URL persistence.
 * Run: npx tsx scripts/verify-ds1-comida-local-google-yelp.ts
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

  console.log(`\nverify-ds1-comida-local-google-yelp: ${checks - failures}/${checks} checks passed`);
  if (failures > 0) process.exitCode = 1;
}

main();
