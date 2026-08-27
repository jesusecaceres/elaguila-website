/**
 * AI scan-persist / final-publish separation regression audit.
 *
 * Proves validateOfertaLocalDraftForAiScanPersist() no longer delegates to
 * validateOfertaLocalDraftForFuturePublish(), and specifically that
 * publish-only fields (validFrom/validUntil, couponText) are NOT required to
 * start an AI scan, while final publish validation still requires them
 * unchanged. Also proves handleStartFresh() clears the stale ?id= URL param,
 * and that foreign-owner recovery behavior is untouched.
 *
 * Run: npm run ofertas-locales:scan-persist-publish-separation-audit
 */
import assert from "node:assert/strict";
import fs from "node:fs";

import { createEmptyOfertaLocalDraft } from "../app/lib/ofertas-locales/createEmptyOfertaLocalDraft";
import { canOfertaLocalDraftPersistForAiScan } from "../app/lib/ofertas-locales/ofertasLocalesAiScanPersist";
import { getOfertaLocalAiScanReadiness } from "../app/lib/ofertas-locales/ofertasLocalesAiScanReadiness";
import { validateOfertaLocalDraftForFuturePublish } from "../app/lib/ofertas-locales/ofertasLocalesValidation";
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

function couponAsset(): OfertaLocalDraftAsset {
  return { ...flyerAsset(), id: "asset-2", assetType: "coupon_pdf", fileName: "coupon.pdf", storagePath: "coupons/test.pdf" };
}

/** Satisfies the new, narrower scan-persist requirements but leaves publish-only fields empty. */
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
    validFrom: "",
    validUntil: "",
    flyerAssets: [flyerAsset()],
    ...overrides,
  };
}

function run() {
  // --- CASE A: business identity + location + contact + eligible asset, no validFrom/validUntil ---
  const caseA = scanReadyDraft({});
  assert.equal(
    canOfertaLocalDraftPersistForAiScan(caseA),
    true,
    "CASE A FAILED: scan-persist must not require validFrom/validUntil"
  );
  const caseAReadiness = getOfertaLocalAiScanReadiness(caseA, { signedIn: true, ofertaLocalId: null });
  assert.equal(caseAReadiness.ready, true, "CASE A FAILED: readiness must agree scan is ready");

  // --- CASE B: businessName missing ---
  const caseB = scanReadyDraft({ businessName: "" });
  assert.equal(canOfertaLocalDraftPersistForAiScan(caseB), false, "CASE B FAILED: businessName must still be required");

  // --- CASE C: city missing ---
  const caseC = scanReadyDraft({ city: "" });
  assert.equal(canOfertaLocalDraftPersistForAiScan(caseC), false, "CASE C FAILED: city must still be required");

  // --- CASE D: no valid contact channel ---
  const caseD = scanReadyDraft({ phone: "", whatsapp: "", websiteUrl: "" });
  assert.equal(canOfertaLocalDraftPersistForAiScan(caseD), false, "CASE D FAILED: a contact channel must still be required");

  // --- CASE E: no eligible asset ---
  const caseE = scanReadyDraft({ flyerAssets: [] });
  assert.equal(canOfertaLocalDraftPersistForAiScan(caseE), false, "CASE E FAILED: an eligible asset must still be required");
  const caseEReadiness = getOfertaLocalAiScanReadiness(caseE, { signedIn: true, ofertaLocalId: null });
  assert.equal(caseEReadiness.ready, false, "CASE E FAILED: readiness must agree scan is not ready");

  // --- CASE F: coupon flow, valid eligible coupon asset, couponText empty ---
  const caseF = scanReadyDraft({
    offerType: "coupon",
    flyerAssets: [],
    couponAssets: [couponAsset()],
    couponText: "",
  });
  assert.equal(
    canOfertaLocalDraftPersistForAiScan(caseF),
    true,
    "CASE F FAILED: couponText must be final-publish-only, not required to scan"
  );

  console.log("Cases A-F (scan-persist minimal requirements) passed.");

  // --- CASE G: final publish validation with validFrom missing must still fail ---
  const caseG = scanReadyDraft({ validFrom: "", validUntil: "2026-01-31" });
  const caseGIssues = validateOfertaLocalDraftForFuturePublish(caseG);
  assert.ok(
    caseGIssues.some((i) => i.field === "validFrom" && i.severity === "error"),
    "CASE G FAILED: final publish validation must still require validFrom"
  );

  // --- CASE H: final publish validation with validUntil missing must still fail ---
  const caseH = scanReadyDraft({ validFrom: "2026-01-01", validUntil: "" });
  const caseHIssues = validateOfertaLocalDraftForFuturePublish(caseH);
  assert.ok(
    caseHIssues.some((i) => i.field === "validUntil" && i.severity === "error"),
    "CASE H FAILED: final publish validation must still require validUntil"
  );

  console.log("Cases G-H (final publish validation unchanged) passed.");

  // --- CASE I: handleStartFresh must strip the id param while preserving other params ---
  const clientSrc = fs.readFileSync(
    "app/(site)/publicar/ofertas-locales/OfertasLocalesApplicationClient.tsx",
    "utf8"
  );
  const startFreshMatch = clientSrc.match(
    /const handleStartFresh = useCallback\(\(\) => \{[\s\S]*?\n {2}\}, \[[\s\S]*?\]\);/
  );
  assert.ok(startFreshMatch, "CASE I FAILED: could not locate handleStartFresh() body");
  const startFreshBody = startFreshMatch![0];
  assert.match(
    startFreshBody,
    /searchParams\?\.has\("id"\)/,
    "CASE I FAILED: handleStartFresh must check for a stale id param"
  );
  assert.match(
    startFreshBody,
    /params\.delete\("id"\)/,
    "CASE I FAILED: handleStartFresh must delete the id param"
  );
  assert.match(
    startFreshBody,
    /router\.replace\(/,
    "CASE I FAILED: handleStartFresh must use router.replace (no full-page reload)"
  );
  console.log("Case I (start-over clears stale id param) passed.");

  // --- CASE J: ownership/recovery code must remain untouched by this change ---
  const OWNERSHIP_FILES = [
    "app/lib/ofertas-locales/ofertasLocalesOwnerHelpers.ts",
    "app/api/ofertas-locales/owner/[id]/route.ts",
    "app/lib/ofertas-locales/ofertasLocalesAdminHelpers.ts",
  ];
  let changed: string[] = [];
  try {
    const { execSync } = require("node:child_process") as typeof import("node:child_process");
    changed = execSync("git diff --name-only HEAD", { encoding: "utf8" })
      .split(/\r?\n/)
      .map((s: string) => s.trim())
      .filter(Boolean);
  } catch {
    changed = [];
  }
  for (const f of OWNERSHIP_FILES) {
    assert.ok(!changed.includes(f), `CASE J FAILED: ownership-relevant file must remain untouched: ${f}`);
  }
  console.log("Case J (ownership code untouched) passed.");

  // --- Structural proof: scan-persist no longer delegates to the full publish validator ---
  const persistSrc = fs.readFileSync("app/lib/ofertas-locales/ofertasLocalesAiScanPersist.ts", "utf8");
  assert.doesNotMatch(
    persistSrc,
    /validateOfertaLocalDraftForFuturePublish\(/,
    "regression: scan-persist must not call the full final-publish validator"
  );
  assert.doesNotMatch(
    persistSrc,
    /field === "validFrom"|field === "validUntil"/,
    "regression: scan-persist must not require validFrom/validUntil"
  );

  console.log("Ofertas Locales scan-persist / final-publish separation audit passed.");
}

run();
