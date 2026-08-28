/**
 * Scanner client-dispatch regression audit.
 *
 * Covers two fixes:
 * 1. Owner-scoped browser draft storage — a global (non-owner-scoped) localStorage
 *    key previously let one authenticated account silently inherit another
 *    account's in-progress Ofertas draft (business fields, uploaded flyer refs,
 *    canonical listing id) on a shared browser. A different owner signing in must
 *    reset to a blank draft rather than inherit it; an anonymous (unclaimed)
 *    draft may still be claimed by the first account that signs in.
 * 2. Readiness messaging — the AI-scan-not-ready blocker was a single generic
 *    sentence ("Completa los datos del negocio...") with no indication of which
 *    field was actually missing. It now surfaces the specific missing field(s).
 *
 * Run: npm run ofertas-locales:scanner-client-dispatch-regression-audit
 */
import assert from "node:assert/strict";
import fs from "node:fs";

// Minimal localStorage polyfill so the real storage functions run for real,
// not just structurally — this repo's plain `tsx` audit scripts have no DOM.
class MemoryStorage {
  private store = new Map<string, string>();
  getItem(key: string): string | null {
    return this.store.has(key) ? this.store.get(key)! : null;
  }
  setItem(key: string, value: string): void {
    this.store.set(key, value);
  }
  removeItem(key: string): void {
    this.store.delete(key);
  }
  clear(): void {
    this.store.clear();
  }
}
(globalThis as unknown as { window: unknown }).window = {
  localStorage: new MemoryStorage(),
  sessionStorage: new MemoryStorage(),
};

import { createEmptyOfertaLocalDraft } from "../app/lib/ofertas-locales/createEmptyOfertaLocalDraft";
import { getOfertaLocalAiScanReadiness } from "../app/lib/ofertas-locales/ofertasLocalesAiScanReadiness";
import {
  clearOfertaLocalDraftStorage,
  readOfertaLocalDraftOwnerStamp,
  writeOfertaLocalDraftOwnerStamp,
} from "../app/lib/ofertas-locales/ofertasLocalesDraftPersistence";
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
    flyerAssets: [flyerAsset()],
    ...overrides,
  };
}

function run() {
  // --- Case H: owner A's draft must not be silently inherited by owner B ---
  clearOfertaLocalDraftStorage();
  writeOfertaLocalDraftOwnerStamp("owner-a");
  assert.equal(readOfertaLocalDraftOwnerStamp(), "owner-a", "CASE H FAILED: stamp write/read round-trip broken");
  assert.notEqual(
    readOfertaLocalDraftOwnerStamp(),
    "owner-b",
    "CASE H FAILED: owner B must not read owner A's stamp as their own"
  );
  console.log("Case H (owner stamp round-trip, no cross-owner match) passed.");

  // --- CASE H2: an unclaimed (anonymous) draft has no stamp — safe to claim ---
  clearOfertaLocalDraftStorage();
  assert.equal(readOfertaLocalDraftOwnerStamp(), null, "CASE H2 FAILED: fresh storage must start unclaimed");
  writeOfertaLocalDraftOwnerStamp("owner-b");
  assert.equal(readOfertaLocalDraftOwnerStamp(), "owner-b", "CASE H2 FAILED: anonymous draft must be claimable");
  console.log("Case H2 (anonymous draft claimable on first sign-in) passed.");

  // --- Structural proof: useOfertasLocalesDraft resets + re-stamps on owner mismatch ---
  const hookSrc = fs.readFileSync("app/lib/ofertas-locales/useOfertasLocalesDraft.ts", "utf8");
  assert.match(
    hookSrc,
    /if \(stamp && stamp !== ownerId\)/,
    "regression: owner-mismatch guard missing from useOfertasLocalesDraft"
  );
  assert.match(
    hookSrc,
    /clearOfertaLocalDraftStorage\(\);\s*\n\s*writeActiveOfertaLocalApplicationSessionId\(empty\.applicationSessionId\);\s*\n\s*saveOfertaLocalDraftToStorage\(empty\);\s*\n\s*writeOfertaLocalDraftOwnerStamp\(ownerId\);/,
    "regression: owner-mismatch branch must clear storage and re-stamp for the new owner"
  );
  assert.match(
    hookSrc,
    /if \(ownerId\) writeOfertaLocalDraftOwnerStamp\(ownerId\);/,
    "regression: explicit resetDraft() (start-over) must also re-stamp the current owner"
  );
  console.log("Structural proof (useOfertasLocalesDraft owner reconciliation) passed.");

  const clientSrc = fs.readFileSync(
    "app/(site)/publicar/ofertas-locales/OfertasLocalesApplicationClient.tsx",
    "utf8"
  );
  assert.match(
    clientSrc,
    /useOfertasLocalesDraft\(\{\s*\n?\s*ownerId,/,
    "regression: OfertasLocalesApplicationClient must pass ownerId into useOfertasLocalesDraft"
  );
  assert.match(
    clientSrc,
    /setOwnerId\(data\.session\?\.user\?\.id \?\? null\)/,
    "regression: ownerId must be captured from the real Supabase session, not hardcoded"
  );
  console.log("Structural proof (ownerId wired from auth session) passed.");

  // --- Case: readiness surfaces the specific missing field, not a generic sentence ---
  const missingNameDraft = scanReadyDraft({ businessName: "" });
  const missingNameReadiness = getOfertaLocalAiScanReadiness(missingNameDraft, {
    signedIn: true,
    ofertaLocalId: null,
    lang: "es",
  });
  assert.ok(
    missingNameReadiness.missingPrerequisites.some((m) => m.includes("nombre del negocio")),
    "FAILED: missing businessName must surface a specific message, not the generic Steps 2-4 sentence"
  );
  assert.ok(
    !missingNameReadiness.missingPrerequisites.some((m) => m.includes("Pasos 2")),
    "regression: generic Steps 2-4 sentence should not appear when a specific field message is available"
  );

  const missingContactDraft = scanReadyDraft({ phone: "", whatsapp: "", websiteUrl: "" });
  const missingContactReadiness = getOfertaLocalAiScanReadiness(missingContactDraft, {
    signedIn: true,
    ofertaLocalId: null,
    lang: "en",
  });
  assert.ok(
    missingContactReadiness.missingPrerequisites.some((m) => m.toLowerCase().includes("phone")),
    "FAILED: missing contact channel must surface a specific English message"
  );
  console.log("Case (readiness specific-field messaging) passed.");

  // --- Ready case still works end-to-end with the message changes in place ---
  const readyDraft = scanReadyDraft({});
  const readyReadiness = getOfertaLocalAiScanReadiness(readyDraft, { signedIn: true, ofertaLocalId: null });
  assert.equal(readyReadiness.ready, true, "FAILED: a fully-complete draft must still compute ready=true");
  assert.equal(
    readyReadiness.missingPrerequisites.length,
    0,
    "FAILED: a fully-complete draft must have zero missing prerequisites"
  );
  console.log("Case (fully ready draft unaffected) passed.");

  console.log("Ofertas Locales scanner client-dispatch regression audit passed.");
}

run();
