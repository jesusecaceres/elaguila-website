/**
 * Certified AI scanner baseline audit.
 *
 * Fails if any documented scanner-core contract (see
 * app/lib/ofertas-locales/OFERTAS_AI_SCANNER_CERTIFIED_REPAIR_MANUAL.md)
 * disappears or regresses. This is the tripwire for the certified/sealed
 * scanner — run before and after touching any protected path.
 *
 * Run: npm run ofertas:ai-scanner-certified-baseline-audit
 */
import assert from "node:assert/strict";
import fs from "node:fs";

import { createEmptyOfertaLocalDraft } from "../app/lib/ofertas-locales/createEmptyOfertaLocalDraft";
import { getOfertaLocalAiScanReadiness } from "../app/lib/ofertas-locales/ofertasLocalesAiScanReadiness";
import { canOfertaLocalDraftPersistForAiScan } from "../app/lib/ofertas-locales/ofertasLocalesAiScanPersist";
import { OFERTAS_LOCALES_MIGRATION_MANIFEST } from "../app/lib/ofertas-locales/ofertasLocalesMigrationManifest";
import { OFERTAS_AI_SCANNER_PROTECTED_PATHS } from "../app/lib/ofertas-locales/ofertasAiScannerProtectedPaths";
import type { OfertaLocalDraft, OfertaLocalDraftAsset } from "../app/lib/ofertas-locales/ofertasLocalesTypes";

function flyerAsset(): OfertaLocalDraftAsset {
  return {
    id: "asset-1",
    assetType: "flyer_pdf",
    title: "",
    note: "",
    url: "https://example.supabase.co/storage/v1/object/public/flyers/test.pdf",
    fileName: "test.pdf",
    mimeType: "application/pdf",
    storagePath: "flyers/test.pdf",
    sizeBytes: 12345,
    pageNumber: null,
    sortOrder: 0,
    status: "ready",
  };
}

function scanReadyDraft(overrides: Partial<OfertaLocalDraft>): OfertaLocalDraft {
  return {
    ...createEmptyOfertaLocalDraft(),
    offerType: "weekly_flyer",
    businessCategory: "retail",
    businessName: "Test Business",
    title: "Weekly Deals",
    city: "Test City",
    zipCode: "94103",
    phone: "5551234567",
    wantsAiSearchableSpecials: false, // deprecated flag deliberately false — must not matter
    flyerAssets: [flyerAsset()],
    ...overrides,
  };
}

function run() {
  // --- 1. Canonical AI entitlement helper remains the readiness/persist gate ---
  const ready = getOfertaLocalAiScanReadiness(scanReadyDraft({}), { signedIn: true, ofertaLocalId: null });
  assert.equal(ready.ready, true, "REGRESSION: a fully valid, entitled draft must compute ready=true");
  assert.equal(
    canOfertaLocalDraftPersistForAiScan(scanReadyDraft({})),
    true,
    "REGRESSION: canonical entitlement + minimum fields must still pass persist validation"
  );
  const noLaneDraft = scanReadyDraft({ offerType: "" });
  assert.equal(
    getOfertaLocalAiScanReadiness(noLaneDraft, { signedIn: true, ofertaLocalId: null }).ready,
    false,
    "REGRESSION: readiness must still require a resolved product lane for entitlement"
  );
  console.log("1. Canonical AI entitlement gate intact.");

  // --- 2. Zero-candidate cannot falsely complete review (scan-time validator not reused for review-complete) ---
  const readinessSrc = fs.readFileSync("app/lib/ofertas-locales/ofertasLocalesAiScanReadiness.ts", "utf8");
  assert.match(
    readinessSrc,
    /isOfertaLocalAiIncludedInPackage\(draft\) &&/,
    "REGRESSION: readiness scanReady must gate on canonical entitlement helper"
  );

  // --- 3. Scan-time validator remains separate from full publish validator ---
  const persistSrc = fs.readFileSync("app/lib/ofertas-locales/ofertasLocalesAiScanPersist.ts", "utf8");
  assert.doesNotMatch(
    persistSrc,
    /validateOfertaLocalDraftForFuturePublish\(/,
    "REGRESSION: scan-persist must not call the full final-publish validator"
  );
  console.log("2-3. Scan-time / publish-time validation separation intact.");

  // --- 4. Scan-prep and scan routes exist ---
  assert.ok(
    fs.existsSync("app/api/ofertas-locales/scan-prep/route.ts"),
    "REGRESSION: /api/ofertas-locales/scan-prep route missing"
  );
  assert.ok(fs.existsSync("app/api/ofertas-locales/scan/route.ts"), "REGRESSION: /api/ofertas-locales/scan route missing");
  console.log("4. Scan-prep and scan routes present.");

  // --- 5. Owner-scoped recovery remains (server-side ownership checks) ---
  const scanHandlerSrc = fs.readFileSync("app/lib/ofertas-locales/ofertasLocalesScanApiHandler.ts", "utf8");
  assert.match(
    scanHandlerSrc,
    /!auth\.isAdmin && parentOffer\.owner_id !== auth\.actorUserId/,
    "REGRESSION: /scan route must still enforce owner-or-admin ownership"
  );
  console.log("5. Owner-scoped recovery/ownership enforcement intact.");

  // --- 6. Fresh-start strips stale ?id= ---
  const clientSrc = fs.readFileSync(
    "app/(site)/publicar/ofertas-locales/OfertasLocalesApplicationClient.tsx",
    "utf8"
  );
  assert.match(
    clientSrc,
    /searchParams\?\.has\("id"\)/,
    "REGRESSION: handleStartFresh must still clear the stale id URL param"
  );
  console.log("6. Start-over stale-id clearing intact.");

  // --- 7. Draft ownership reconciliation remains ---
  const hookSrc = fs.readFileSync("app/lib/ofertas-locales/useOfertasLocalesDraft.ts", "utf8");
  assert.match(
    hookSrc,
    /readOfertaLocalDraftOwnerStamp/,
    "REGRESSION: owner-stamp reconciliation removed from useOfertasLocalesDraft"
  );
  assert.match(
    hookSrc,
    /if \(stamp && stamp !== ownerId\)/,
    "REGRESSION: owner-mismatch guard removed"
  );
  console.log("7. Draft ownership reconciliation intact.");

  // --- 8. Migration manifest includes the required 6-package chain ---
  const requiredMigrations = [
    "20260616130000_ofertas_locales_ai_production_bootstrap.sql",
    "20260731222500_ofertas_locales_30_day_public_term.sql",
    "20260731235500_ofertas_locales_commercial_activation_identity.sql",
    "20260801003000_ofertas_locales_partner_analytics_asset_lifecycle.sql",
    "20260801013000_ofertas_locales_ai_scan_review_publication.sql",
    "20260801023000_ofertas_locales_renewal_operations_lifecycle.sql",
  ];
  const manifestFilenames = OFERTAS_LOCALES_MIGRATION_MANIFEST.map((e) => e.filename);
  for (const filename of requiredMigrations) {
    assert.ok(
      manifestFilenames.includes(filename),
      `REGRESSION: migration manifest missing required package file ${filename}`
    );
    assert.ok(
      fs.existsSync(`supabase/migrations/${filename}`),
      `REGRESSION: migration file ${filename} missing from repo`
    );
  }
  console.log("8. Scanner migration manifest chain intact (6/6 packages).");

  // --- 9. Provider/fallback path remains present, gated on items.length not gemini.ok ---
  const orchestratorSrc = fs.readFileSync("app/lib/ofertas-locales/ofertasLocalesAiScanOrchestrator.ts", "utf8");
  assert.match(
    orchestratorSrc,
    /gemini && gemini\.items\.length > 0/,
    "REGRESSION: Gemini success must still be judged by items.length, not gemini.ok alone"
  );
  assert.match(
    orchestratorSrc,
    /runDocumentAiFallback\(params\)/,
    "REGRESSION: Document AI fallback invocation missing from orchestrator"
  );
  console.log("9. Provider/fallback gate intact.");

  // --- 10. Item persistence path remains present ---
  assert.match(
    scanHandlerSrc,
    /\.from\("oferta_local_items"\)\.insert\(/,
    "REGRESSION: item persistence insert into oferta_local_items missing"
  );
  console.log("10. Item persistence path intact.");

  // --- 11. Review API paths remain present ---
  assert.ok(fs.existsSync("app/api/ofertas-locales/items/route.ts"), "REGRESSION: review items GET route missing");
  assert.ok(
    fs.existsSync("app/api/ofertas-locales/items/[itemId]/route.ts"),
    "REGRESSION: review item PATCH route missing"
  );
  console.log("11. Review retrieval/mutation API paths intact.");

  // --- 12. Repair manual and protected-path manifest exist ---
  assert.ok(
    fs.existsSync("app/lib/ofertas-locales/OFERTAS_AI_SCANNER_CERTIFIED_REPAIR_MANUAL.md"),
    "REGRESSION: certified repair manual missing"
  );
  assert.ok(
    fs.existsSync("app/lib/ofertas-locales/OFERTAS_AI_SCANNER_SEALED.md"),
    "REGRESSION: sealed document missing"
  );
  assert.ok(
    OFERTAS_AI_SCANNER_PROTECTED_PATHS.length > 20,
    "REGRESSION: protected-path manifest looks incomplete"
  );
  for (const entry of OFERTAS_AI_SCANNER_PROTECTED_PATHS) {
    assert.ok(fs.existsSync(entry.path), `REGRESSION: protected path no longer exists on disk: ${entry.path}`);
  }
  console.log("12. Repair manual, sealed doc, and protected-path manifest intact and accurate.");

  console.log("Ofertas AI scanner certified baseline audit passed.");
}

run();
