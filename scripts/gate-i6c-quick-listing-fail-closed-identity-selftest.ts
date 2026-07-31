/**
 * Work Package I.6C — Quick Listing Fail-Closed Identity Correction self-test.
 *
 * Covers the two truth defects I.6B left open:
 *  1. Unknown/unsupported listing category no longer silently renders as En Venta — it fails
 *     closed to the shared shell's existing not-found state (`isRecognizedListingCategory` gate
 *     in `app/(site)/clasificados/anuncio/[id]/page.tsx`).
 *  2. A failed existing-listing identity verification (invalid UUID / not-found / owner-mismatch /
 *     category-mismatch / query-error) no longer falls back to a fresh INSERT for any of the four
 *     quick publishers (En Venta, Busco, Clases, Comunidad) — only a genuinely absent candidate
 *     (a truly new application) still reaches INSERT.
 *
 * Source-level only (no React/DOM) for the shell, same convention as gate-i6a/i6b — it statically
 * imports a `.png` asset and cannot be imported outside Next.js. The publisher files ARE plain
 * TS modules with no such import, so their reuse-vs-insert branching is verified both at the
 * source level (structural assertions) and behaviorally (a fake Supabase client drives
 * `verifyQuickListingReusable` itself through every failure reason, proving the shared helper's
 * contract each publisher now depends on).
 *
 * Run from repo root:
 *   npx tsx scripts/gate-i6c-quick-listing-fail-closed-identity-selftest.ts
 */
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import path from "node:path";

import {
  QUICK_LISTING_EXISTING_IDENTITY_INVALID_CODE,
  quickListingExistingIdentityInvalidMessage,
  verifyQuickListingReusable,
  type QuickListingReuseCheck,
  type QuickListingReuseFailureReason,
} from "../app/(site)/clasificados/lib/quickListingIdempotency";

const REPO_ROOT = path.resolve(__dirname, "..");
const VALID_UUID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";

function mockSupabase(row: { id: string; owner_id: string; category: string } | null | "error") {
  let eqId: string | undefined;
  return {
    from() {
      return {
        select() {
          return this;
        },
        eq(field: string, value: string) {
          if (field === "id") eqId = value;
          return this;
        },
        async maybeSingle() {
          if (row === "error") return { data: null, error: { message: "boom" } };
          if (!row || row.id !== eqId) return { data: null, error: null };
          return { data: row, error: null };
        },
      };
    },
  } as any;
}

async function main() {
  /* ============================================================================================
   * OBJECTIVE A — unknown category fails closed at the shared public shell.
   * ========================================================================================== */
  {
    const shellSrc = readFileSync(
      path.join(REPO_ROOT, "app/(site)/clasificados/anuncio/[id]/page.tsx"),
      "utf8",
    );

    // Every previously-supported category (including Mascotas, fixed in I.6B) remains accepted —
    // the allowlist itself must be byte-for-byte unchanged by this package.
    const allowlistMatch = shellSrc.match(/const CATEGORY_KEYS[\s\S]*?\[([\s\S]*?)\];/);
    assert.ok(allowlistMatch, "must locate the CATEGORY_KEYS array literal");
    const allowlistBody = allowlistMatch![1];
    for (const cat of [
      "en-venta",
      "bienes-raices",
      "rentas",
      "autos",
      "servicios",
      "empleos",
      "clases",
      "comunidad",
      "busco",
      "mascotas-y-perdidos",
      "travel",
    ]) {
      assert.ok(allowlistBody.includes(cat), `regression: "${cat}" must remain accepted after I.6C`);
    }

    // The new fail-closed guard must exist and mirror coerceCategoryKey's real-category logic.
    assert.ok(
      shellSrc.includes("function isRecognizedListingCategory"),
      "isRecognizedListingCategory guard must exist (I.6C)",
    );
    const guardMatch = shellSrc.match(/function isRecognizedListingCategory[\s\S]*?\n\}/);
    assert.ok(guardMatch, "must locate isRecognizedListingCategory");
    assert.ok(guardMatch![0].includes('s === "bienes-raices"'), "guard must recognize bienes-raices like coerceCategoryKey");
    assert.ok(guardMatch![0].includes("isEnVentaCategorySlug(s)"), "guard must recognize En Venta slugs like coerceCategoryKey");
    assert.ok(
      guardMatch![0].includes("CATEGORY_KEYS as readonly string[]).includes(s)"),
      "guard must recognize every CATEGORY_KEYS value like coerceCategoryKey",
    );
    // The guard must never itself default anything to "en-venta" — it is a pure boolean gate.
    assert.ok(!guardMatch![0].includes('"en-venta"'), "isRecognizedListingCategory must not contain an en-venta fallback");

    // The guard must run BEFORE mapDbListingRowToListing on the live-fetch path, and the failure
    // branch must reuse the exact same fail-closed pattern as the pre-existing not-found checks
    // (setFetchedListing(undefined) + setRemoteState("ready")), not a new/different code path.
    const guardCallIdx = shellSrc.indexOf("if (!isRecognizedListingCategory(row.category))");
    const mapCallIdx = shellSrc.indexOf("setFetchedListing(mapDbListingRowToListing(row))");
    assert.ok(guardCallIdx > -1, "the guard must actually be invoked against the fetched row");
    assert.ok(mapCallIdx > -1, "mapDbListingRowToListing call site must still exist");
    assert.ok(guardCallIdx < mapCallIdx, "the unknown-category guard must run BEFORE mapDbListingRowToListing");
    const guardBlock = shellSrc.slice(guardCallIdx, mapCallIdx);
    assert.ok(guardBlock.includes("setFetchedListing(undefined)"), "unknown category must reuse the existing not-found outcome");
    assert.ok(guardBlock.includes('setRemoteState("ready")'), "unknown category must reach the same ready/not-found render state");

    // coerceCategoryKey's own fallback line is untouched (still total, still narrowly scoped) —
    // I.6C makes it unreachable from the live path rather than changing its internal logic.
    const coerceMatch = shellSrc.match(/function coerceCategoryKey[\s\S]*?\n\}/);
    assert.ok(coerceMatch, "must locate coerceCategoryKey");
    assert.ok(
      coerceMatch![0].includes("CATEGORY_KEYS as readonly string[]).includes(s) ? (s as CategoryKey) : \"en-venta\""),
      "coerceCategoryKey's fallback line must remain unchanged (still total; now unreachable from the live fetch path)",
    );

    // Dispatch branches for every category remain untouched (no route redesign occurred).
    assert.ok(shellSrc.includes("useBuscoQuickDetail"), "Busco dispatch must remain unchanged");
    assert.ok(shellSrc.includes("useCommunityQuickWysiwyg"), "Clases/Comunidad dispatch must remain unchanged");
    assert.ok(shellSrc.includes("useMascotasPerdidosQuickDetail"), "Mascotas dispatch must remain unchanged");
    assert.ok(shellSrc.includes("EnVentaAnuncioLayout"), "En Venta rendering must remain unchanged");
  }

  /* ============================================================================================
   * OBJECTIVE B (behavioral) — verifyQuickListingReusable's failure reasons, driving the exact
   * contract each publisher now depends on: only "missing" (no candidate at all) is the
   * truly-new-application case; every other reason is an existing-listing intention that failed.
   * ========================================================================================== */
  {
    const missing = await verifyQuickListingReusable(mockSupabase(null), {
      candidateId: null,
      ownerUserId: "owner-1",
      expectedCategory: "en-venta",
    });
    assert.deepEqual(missing satisfies QuickListingReuseCheck, { safe: false, reason: "missing" });

    const invalid = await verifyQuickListingReusable(mockSupabase(null), {
      candidateId: "not-a-uuid",
      ownerUserId: "owner-1",
      expectedCategory: "en-venta",
    });
    assert.deepEqual(invalid, { safe: false, reason: "invalid-uuid" });

    const notFound = await verifyQuickListingReusable(mockSupabase(null), {
      candidateId: VALID_UUID,
      ownerUserId: "owner-1",
      expectedCategory: "en-venta",
    });
    assert.deepEqual(notFound, { safe: false, reason: "not-found" });

    const ownerMismatch = await verifyQuickListingReusable(
      mockSupabase({ id: VALID_UUID, owner_id: "someone-else", category: "en-venta" }),
      { candidateId: VALID_UUID, ownerUserId: "owner-1", expectedCategory: "en-venta" },
    );
    assert.deepEqual(ownerMismatch, { safe: false, reason: "owner-mismatch" });

    const categoryMismatch = await verifyQuickListingReusable(
      mockSupabase({ id: VALID_UUID, owner_id: "owner-1", category: "busco" }),
      { candidateId: VALID_UUID, ownerUserId: "owner-1", expectedCategory: "en-venta" },
    );
    assert.deepEqual(categoryMismatch, { safe: false, reason: "category-mismatch" });

    const queryError = await verifyQuickListingReusable(mockSupabase("error"), {
      candidateId: VALID_UUID,
      ownerUserId: "owner-1",
      expectedCategory: "en-venta",
    });
    assert.deepEqual(queryError, { safe: false, reason: "query-error" });

    const safe = await verifyQuickListingReusable(
      mockSupabase({ id: VALID_UUID, owner_id: "owner-1", category: "en-venta" }),
      { candidateId: VALID_UUID, ownerUserId: "owner-1", expectedCategory: "en-venta" },
    );
    assert.deepEqual(safe, { safe: true, listingId: VALID_UUID });

    // Only "missing" — a candidateId that is null/empty from the start — represents a truly new
    // application. Every other failure reason above means an existing-listing intention existed
    // but could not be verified, and must fail closed per Objective B.
    const existingIntentionFailureReasons: QuickListingReuseFailureReason[] = [
      "invalid-uuid",
      "not-found",
      "owner-mismatch",
      "category-mismatch",
      "query-error",
    ];
    assert.ok(existingIntentionFailureReasons.length === 5);
  }

  /* ============================================================================================
   * OBJECTIVE B (structural) — each of the 4 publishers now has a three-way branch: safe reuse →
   * UPDATE; existingListingId present but verification failed → fail closed, no INSERT; no
   * existingListingId at all → INSERT (truly new application, unchanged).
   * ========================================================================================== */
  {
    const publisherFiles = [
      "app/(site)/clasificados/en-venta/publish/enVentaPublishFromDraft.ts",
      "app/(site)/publicar/busco/shared/publishBuscoQuickToListings.ts",
      "app/(site)/publicar/community/shared/publish/publishCommunityQuickToListings.ts",
    ];
    for (const rel of publisherFiles) {
      const src = readFileSync(path.join(REPO_ROOT, rel), "utf8");

      assert.ok(src.includes("verifyQuickListingReusable"), `${rel} must call the shared verification helper`);
      assert.ok(src.includes("reuseCheck?.safe"), `${rel} must branch on the verified "safe" result`);
      assert.ok(
        src.includes("updateListingsRowResilient") || src.includes("updatablePayload"),
        `${rel} must use an UPDATE path when reuse is safe`,
      );

      // The new fail-closed branch must exist, must gate on existingListingId (not reuseCheck,
      // which is only non-null when existingListingId was already truthy — this documents intent
      // at the source level), must never reach an insert call, and must return the deterministic
      // sanitized error rather than a raw DB error.
      const elseIfIdx = src.indexOf("} else if (existingListingId) {");
      assert.ok(elseIfIdx > -1, `${rel} must have a dedicated "existingListingId present but unsafe" branch`);
      const finalElseIdx = src.indexOf("} else {", elseIfIdx);
      assert.ok(finalElseIdx > -1, `${rel} must retain a final truly-new-application else branch`);
      const failClosedBlock = src.slice(elseIfIdx, finalElseIdx);
      assert.ok(
        failClosedBlock.includes("quickListingExistingIdentityInvalidMessage"),
        `${rel} must return the deterministic sanitized error, not a raw DB error, on failed identity verification`,
      );
      assert.ok(
        !failClosedBlock.includes(".insert(") && !failClosedBlock.includes("insertListingsRowResilient"),
        `${rel} must never INSERT inside the failed-existing-identity branch`,
      );
      assert.ok(
        failClosedBlock.includes("logQuickListingReuseFailure"),
        `${rel} must log the internal reason (never exposed to the client) on failure`,
      );

      // The truly-new-application branch (no candidate id at all) must still INSERT, unchanged.
      const newApplicationBlock = src.slice(finalElseIdx);
      const nextBlockEnd = newApplicationBlock.indexOf("\n  }\n");
      const scopedNewApplicationBlock = newApplicationBlock.slice(0, nextBlockEnd > -1 ? nextBlockEnd : undefined);
      assert.ok(
        scopedNewApplicationBlock.includes(".insert(") || scopedNewApplicationBlock.includes("insertListingsRowResilient"),
        `${rel} must retain a real INSERT for a truly new application (no existingListingId)`,
      );

      assert.ok(src.includes("owner_id: _ownerId") || src.includes("_ownerId"), `${rel} must never overwrite owner_id on an update`);
    }
  }

  /* ============================================================================================
   * ERROR CONTRACT — deterministic, sanitized, bilingual; never a raw Supabase/Postgres error.
   * ========================================================================================== */
  {
    assert.equal(QUICK_LISTING_EXISTING_IDENTITY_INVALID_CODE, "quick_listing_existing_identity_invalid");
    const es = quickListingExistingIdentityInvalidMessage("es");
    const en = quickListingExistingIdentityInvalidMessage("en");
    assert.ok(es.length > 0 && en.length > 0 && es !== en, "message must be a real, language-distinct string");
    for (const msg of [es, en]) {
      assert.ok(!/postgres|supabase|column|constraint|relation|syntax error/i.test(msg), "message must never leak raw DB error vocabulary");
    }
  }

  console.log("gate-i6c-quick-listing-fail-closed-identity-selftest: OK");
}

main();
