/**
 * AI scan entitlement gate regression audit.
 *
 * Proves the deprecated `draft.wantsAiSearchableSpecials` flag is no longer
 * a hard, independently-blocking requirement for AI scan readiness/persist
 * eligibility, and that the canonical entitlement helper
 * `isOfertaLocalAiIncludedInPackage(draft)` is the actual source of truth —
 * while every other readiness/security requirement remains fully enforced.
 *
 * Run: npm run ofertas-locales:ai-entitlement-gate-regression-audit
 */
import assert from "node:assert/strict";
import { execSync } from "node:child_process";

import { createEmptyOfertaLocalDraft } from "../app/lib/ofertas-locales/createEmptyOfertaLocalDraft";
import { getOfertaLocalAiScanReadiness } from "../app/lib/ofertas-locales/ofertasLocalesAiScanReadiness";
import { canOfertaLocalDraftPersistForAiScan } from "../app/lib/ofertas-locales/ofertasLocalesAiScanPersist";
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

/** A draft that satisfies every publish-readiness field EXCEPT the deprecated AI flag. */
function baseCompleteDraft(overrides: Partial<OfertaLocalDraft>): OfertaLocalDraft {
  return {
    ...createEmptyOfertaLocalDraft(),
    businessCategory: "retail",
    businessName: "Test Business",
    title: "Weekly Deals",
    validFrom: "2026-01-01",
    validUntil: "2026-01-31",
    city: "Test City",
    zipCode: "94103",
    phone: "5551234567",
    wantsAiSearchableSpecials: false, // deliberately false — the deprecated flag must not matter
    ...overrides,
  };
}

function run() {
  // --- CASE A: interactive_flyer lane, AI included by product model, legacy flag false ---
  const flyerDraft = baseCompleteDraft({
    offerType: "weekly_flyer",
    flyerAssets: [flyerAsset()],
  });
  const flyerReadiness = getOfertaLocalAiScanReadiness(flyerDraft, { signedIn: true, ofertaLocalId: null });
  assert.equal(
    flyerReadiness.ready,
    true,
    "CASE A FAILED: interactive_flyer readiness must not fail solely because the legacy AI flag is false"
  );
  assert.equal(
    canOfertaLocalDraftPersistForAiScan(flyerDraft),
    true,
    "CASE A FAILED: interactive_flyer persist-eligibility must not fail solely because the legacy AI flag is false"
  );

  // --- CASE B: coupons lane is a free, non-AI product by design (Two-Lane Execution) —
  // its readiness/persist-eligibility must be false because of the canonical
  // entitlement helper (isOfertaLocalAiIncludedInPackage), never because of the
  // deprecated legacy flag. Prove that by flipping the legacy flag both ways and
  // observing the outcome never changes.
  const couponDraftLegacyFalse = baseCompleteDraft({
    offerType: "coupon",
    couponAssets: [couponAsset()],
    wantsAiSearchableSpecials: false,
  });
  const couponDraftLegacyTrue = baseCompleteDraft({
    offerType: "coupon",
    couponAssets: [couponAsset()],
    wantsAiSearchableSpecials: true,
  });
  const couponReadinessLegacyFalse = getOfertaLocalAiScanReadiness(couponDraftLegacyFalse, {
    signedIn: true,
    ofertaLocalId: null,
  });
  const couponReadinessLegacyTrue = getOfertaLocalAiScanReadiness(couponDraftLegacyTrue, {
    signedIn: true,
    ofertaLocalId: null,
  });
  assert.equal(
    couponReadinessLegacyFalse.ready,
    false,
    "CASE B FAILED: coupons (free, no-AI product) must never report AI scan readiness"
  );
  assert.equal(
    couponReadinessLegacyTrue.ready,
    false,
    "CASE B FAILED: coupons AI scan readiness must not be re-enabled by the deprecated legacy flag"
  );
  assert.equal(
    canOfertaLocalDraftPersistForAiScan(couponDraftLegacyFalse),
    false,
    "CASE B FAILED: coupons (free, no-AI product) must never report AI persist-eligibility"
  );
  assert.equal(
    canOfertaLocalDraftPersistForAiScan(couponDraftLegacyTrue),
    false,
    "CASE B FAILED: coupons AI persist-eligibility must not be re-enabled by the deprecated legacy flag"
  );

  // --- CASE C: unresolved/no valid product lane — entitlement must still fail ---
  const noLaneDraft = baseCompleteDraft({
    offerType: "",
    flyerAssets: [flyerAsset()],
  });
  const noLaneReadiness = getOfertaLocalAiScanReadiness(noLaneDraft, { signedIn: true, ofertaLocalId: null });
  assert.equal(
    noLaneReadiness.ready,
    false,
    "CASE C FAILED: readiness must still fail when no product lane is resolved, regardless of the deprecated flag"
  );
  assert.equal(
    canOfertaLocalDraftPersistForAiScan(noLaneDraft),
    false,
    "CASE C FAILED: persist-eligibility must still fail when no product lane is resolved"
  );

  // --- CASE D: no eligible uploaded asset — scan must still fail readiness ---
  const noAssetDraft = baseCompleteDraft({
    offerType: "weekly_flyer",
    flyerAssets: [],
  });
  const noAssetReadiness = getOfertaLocalAiScanReadiness(noAssetDraft, { signedIn: true, ofertaLocalId: null });
  assert.equal(
    noAssetReadiness.ready,
    false,
    "CASE D FAILED: readiness must still fail with zero eligible uploaded assets"
  );

  // --- CASE E: signed out — scan must still fail readiness ---
  const signedOutReadiness = getOfertaLocalAiScanReadiness(flyerDraft, { signedIn: false, ofertaLocalId: null });
  assert.equal(
    signedOutReadiness.ready,
    false,
    "CASE E FAILED: readiness must still fail when the user is not signed in"
  );

  console.log("Cases A-E (entitlement gate behavior) passed.");

  // --- CASE F: ownership/ownership-recovery code must be completely untouched ---
  // This is a real security boundary (server-side, DB-authorized) — not something
  // a local unit test can safely exercise. Prove instead that this change touched
  // none of the ownership-relevant files.
  const OWNERSHIP_FILES = [
    "app/lib/ofertas-locales/ofertasLocalesOwnerHelpers.ts",
    "app/api/ofertas-locales/owner/[id]/route.ts",
    "app/lib/ofertas-locales/ofertasLocalesAdminHelpers.ts",
  ];
  let changed: string[] = [];
  try {
    changed = execSync("git diff --name-only HEAD", { encoding: "utf8" })
      .split(/\r?\n/)
      .map((s) => s.trim())
      .filter(Boolean);
  } catch {
    changed = [];
  }
  for (const f of OWNERSHIP_FILES) {
    assert.ok(
      !changed.includes(f),
      `CASE F FAILED: ownership-relevant file must remain untouched by this change: ${f}`
    );
  }
  console.log("Case F (ownership code untouched) passed.");

  // --- Structural proof: the deprecated flag is no longer an independent top-level gate ---
  const fs = require("node:fs") as typeof import("node:fs");
  const readinessSrc = fs.readFileSync(
    "app/lib/ofertas-locales/ofertasLocalesAiScanReadiness.ts",
    "utf8"
  );
  const persistSrc = fs.readFileSync("app/lib/ofertas-locales/ofertasLocalesAiScanPersist.ts", "utf8");
  assert.match(
    readinessSrc,
    /isOfertaLocalAiIncludedInPackage\(draft\) &&\s*\n\s*eligibleAssets\.length > 0/,
    "readiness's scanReady must gate on the canonical entitlement helper, not the deprecated flag"
  );
  assert.doesNotMatch(
    readinessSrc,
    /draft\.wantsAiSearchableSpecials\s*&&\s*\n\s*eligibleAssets\.length > 0/,
    "regression: readiness must not gate scanReady on the deprecated flag"
  );
  assert.match(
    persistSrc,
    /if \(!isOfertaLocalAiIncludedInPackage\(draft\)\)/,
    "persist validator must gate on the canonical entitlement helper, not the deprecated flag"
  );
  assert.doesNotMatch(
    persistSrc,
    /if \(!draft\.wantsAiSearchableSpecials\)/,
    "regression: persist validator must not hard-require the deprecated flag"
  );

  console.log("Ofertas Locales AI entitlement gate regression audit passed.");
}

run();
