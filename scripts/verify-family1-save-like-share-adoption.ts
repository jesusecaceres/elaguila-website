/**
 * Globalization Build D, Family 1 — targeted verifier for the Save/Like/Share adoption gap
 * closed this pass: Servicios Save (Like/Share were already adopted; Save was the missing cell —
 * the `serviciosGlobalSaveRecorder` analytics function already existed but was never wired to a
 * button), and Comida Local Save/Like/Share (all three were missing; new tracker functions added
 * to comidaLocalAnalytics.ts mirror the existing enVentaGlobalAnalytics.ts reference pattern).
 *
 * Run from repo root:
 *   npx tsx scripts/verify-family1-save-like-share-adoption.ts
 *
 * Structural source checks (no live Next.js render available in a pure-logic script), each
 * reading real current file contents on disk.
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
  console.log("verify-family1-save-like-share-adoption: starting");

  // ── Servicios Save ──────────────────────────────────────────────────────────────────────
  const profileViewSrc = read("app/(site)/servicios/components/ServiciosProfileView.tsx");
  check("ServiciosProfileView renders LeonixSaveButton in the hero engagement slot", () => {
    assert.match(profileViewSrc, /<LeonixSaveButton/);
  });
  check("ServiciosProfileView's Save button reuses the existing serviciosGlobalSaveRecorder (no new engine)", () => {
    assert.match(profileViewSrc, /recordSaveEvent=\{globalListing \? serviciosGlobalSaveRecorder\(globalListing\) : undefined\}/);
  });
  check("ServiciosProfileView prefers the real listing UUID for the save key (resolveListingsTableSavedListingKey)", () => {
    assert.match(profileViewSrc, /savedListingKey=\{resolveListingsTableSavedListingKey\(sourceId, lxListingId\)\}/);
  });

  const proShellSrc = read("app/(site)/servicios/components/ServiciosProfessionalProfileShell.tsx");
  check("ServiciosProfessionalProfileShell (the professional-template variant) also renders LeonixSaveButton", () => {
    assert.match(proShellSrc, /<LeonixSaveButton/);
  });
  check("ServiciosProfessionalProfileShell's Save button reuses the existing serviciosGlobalSaveRecorder", () => {
    assert.match(proShellSrc, /recordSaveEvent=\{globalListing \? serviciosGlobalSaveRecorder\(globalListing\) : undefined\}/);
  });

  // ── Comida Local Save/Like/Share ────────────────────────────────────────────────────────
  const analyticsSrc = read("app/lib/clasificados/comida-local/comidaLocalAnalytics.ts");
  check("comidaLocalAnalytics exports the 3 new engagement trackers", () => {
    assert.match(analyticsSrc, /export function trackComidaLocalLikeGlobal/);
    assert.match(analyticsSrc, /export function trackComidaLocalSaveGlobal/);
    assert.match(analyticsSrc, /export function trackComidaLocalShareGlobal/);
  });
  check("trackComidaLocalSaveGlobal resolves an access token before recording (auth-required event)", () => {
    assert.match(analyticsSrc, /resolveAccessTokenIfNeeded\(true\)/);
  });
  check("New trackers use the real generic listing_save/listing_like/listing_share event types", () => {
    assert.match(analyticsSrc, /event_type: isSave \? "listing_save" : "listing_unsave"/);
    assert.match(analyticsSrc, /event_type: isLike \? "listing_like" : "listing_unlike"/);
    assert.match(analyticsSrc, /event_type: "listing_share"/);
  });

  const engagementRowSrc = read(
    "app/(site)/clasificados/comida-local/components/ComidaLocalEngagementRow.tsx",
  );
  check("ComidaLocalEngagementRow reuses the 3 shared Leonix engagement buttons (no reimplementation)", () => {
    assert.match(engagementRowSrc, /import \{ LeonixLikeButton \}/);
    assert.match(engagementRowSrc, /import \{ LeonixSaveButton \}/);
    assert.match(engagementRowSrc, /import \{ LeonixShareButton \}/);
  });
  check("ComidaLocalEngagementRow wires all 3 new trackers, not the constrained contact-event tracker", () => {
    assert.match(engagementRowSrc, /trackComidaLocalLikeGlobal/);
    assert.match(engagementRowSrc, /trackComidaLocalSaveGlobal/);
    assert.match(engagementRowSrc, /trackComidaLocalShareGlobal/);
  });

  const pageSrc = read("app/(site)/clasificados/comida-local/[slug]/page.tsx");
  check("Comida Local detail page renders ComidaLocalEngagementRow with a real ownerUserId for self-engagement suppression", () => {
    assert.match(pageSrc, /<ComidaLocalEngagementRow/);
    assert.match(pageSrc, /ownerUserId=\{row\.owner_user_id\}/);
  });

  const publicTypesSrc = read("app/lib/clasificados/comida-local/comidaLocalPublicTypes.ts");
  check("ComidaLocalPublicListingRow now declares owner_user_id (public-safe UUID, not PII)", () => {
    assert.match(publicTypesSrc, /owner_user_id:\s*string \| null;/);
  });

  const publicQueriesSrc = read("app/lib/clasificados/comida-local/comidaLocalPublicQueries.ts");
  check("COMIDA_LOCAL_PUBLIC_LISTING_SELECT actually selects owner_user_id", () => {
    assert.match(publicQueriesSrc, /"id, slug, leonix_ad_id, owner_user_id,/);
  });

  console.log(`\nverify-family1-save-like-share-adoption: ${checks - failures}/${checks} checks passed`);
  if (failures > 0) {
    process.exitCode = 1;
  }
}

main();
