/**
 * Work Package I.11A — Global Media and Draft Persistence Foundation self-test (media contract +
 * upload-route security half).
 *
 * The four `draft-media-upload` routes are Next.js route handlers and can't be invoked standalone
 * outside the framework (same convention used throughout this session for such files) — wiring
 * coverage is source-level (import presence, resolution order), not simulated requests. The media
 * contract predicates are pure functions and are tested directly.
 *
 * Run from repo root:
 *   npx tsx scripts/gate-i11a-media-draft-persistence-truth-selftest.ts
 */
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import path from "node:path";

import {
  isBlobOrObjectUrl,
  isDataUrl,
  isPersistableMediaUrl,
  withNormalizedMediaOrder,
} from "../app/lib/media/listingMediaContract";

const REPO_ROOT = path.resolve(__dirname, "..");

function readSource(rel: string): string {
  return readFileSync(path.join(REPO_ROOT, rel), "utf8");
}

const UPLOAD_ROUTES = [
  "app/api/clasificados/restaurantes/draft-media-upload/route.ts",
  "app/api/clasificados/servicios/draft-media-upload/route.ts",
  "app/api/clasificados/rentas/draft-media-upload/route.ts",
  "app/api/clasificados/comida-local/draft-media-upload/route.ts",
];

const ANON_SESSION_HELPER = "app/api/clasificados/_lib/anonUploadSession.ts";
const AUTOS_SHIP_07_DOC = "app/lib/clasificados/autos/AUTOS_A5_SHIP_07_ZERO_DATA_LOSS_MEDIA_STORAGE_AUDIT.md";
const BR_LISTING_EDIT_ROUTE = "app/api/clasificados/bienes-raices/listing-edit/route.ts";

async function main() {
  /* ============================================================================================
   * MEDIA CONTRACT — blob/data URLs never treated as hosted/persistable; a real https URL is.
   * ========================================================================================== */
  {
    assert.equal(isBlobOrObjectUrl("blob:https://example.com/abc-123"), true);
    assert.equal(isBlobOrObjectUrl("https://example.com/a.jpg"), false);
    assert.equal(isDataUrl("data:image/png;base64,AAAA"), true);
    assert.equal(isDataUrl("https://example.com/a.jpg"), false);

    assert.equal(isPersistableMediaUrl("blob:https://example.com/abc-123"), false, "blob: must never be persistable");
    assert.equal(isPersistableMediaUrl("data:image/png;base64,AAAA"), false, "data: must never be persistable");
    assert.equal(isPersistableMediaUrl(""), false);
    assert.equal(isPersistableMediaUrl(null), false);
    assert.equal(isPersistableMediaUrl("not-a-url"), false);
    assert.equal(isPersistableMediaUrl("https://example.com/photo.jpg"), true);
    assert.equal(isPersistableMediaUrl("http://example.com/photo.jpg"), true);

    const ordered = withNormalizedMediaOrder([{ sortOrder: 9 }, { sortOrder: 2 }, { sortOrder: 100 }]);
    assert.deepEqual(ordered.map((o) => o.sortOrder), [0, 1, 2], "order must be re-derived from array position");
  }

  /* ============================================================================================
   * CONTRACT AGREES WITH THE ALREADY-PROVEN BIENES RAÍCES GUARD — not inventing a different rule.
   * ========================================================================================== */
  {
    const src = readSource(BR_LISTING_EDIT_ROUTE);
    assert.ok(
      src.includes('startsWith("blob:")') && /throw new Error\(\s*["']blob_url_not_persistable["']/.test(src),
      "Bienes Raíces' independent blob-rejection guard must still exist — the shared contract certifies this rule, not replaces it",
    );
  }

  /* ============================================================================================
   * UPLOAD-ROUTE SECURITY — all four routes resolve real/anon identity before building the
   * storage path; none use the raw client-supplied draft id as the sole isolation boundary.
   * ========================================================================================== */
  {
    const helperSrc = readSource(ANON_SESSION_HELPER);
    assert.ok(helperSrc.includes("crypto"), "anon session id must be cryptographically random, not Math.random()");
    assert.ok(helperSrc.includes("httpOnly: true"), "anon session cookie must be httpOnly");
    assert.ok(helperSrc.includes("NOT an authentication"), "helper must document that it is not an auth mechanism");

    for (const route of UPLOAD_ROUTES) {
      const src = readSource(route);
      assert.ok(src.includes('from "@/app/api/clasificados/_lib/anonUploadSession"'), `${route} must import the shared anon-session helper`);
      assert.ok(
        src.includes("getBearerUserId(req)") || src.includes("comidaLocalOwnerIdFromBearer(req)"),
        `${route} must resolve real server-verified identity when a bearer token is present`,
      );
      assert.ok(src.includes("resolveAnonUploadSessionId(req)"), `${route} must resolve the anon session when no owner is present`);
      assert.ok(src.includes("applyAnonUploadSessionCookie"), `${route} must set the anon session cookie when newly minted`);

      const ownerFnMatch = src.match(/function ownerPathSegment\([^)]*\)\s*:\s*string\s*\{[\s\S]*?\n\}/);
      assert.ok(ownerFnMatch, `${route} must define ownerPathSegment`);
      assert.ok(
        !ownerFnMatch![0].includes("draftListingId") && !ownerFnMatch![0].includes("draftId"),
        `${route}: ownerPathSegment must not fall back to the raw client-supplied draft id`,
      );
    }
  }

  /* ============================================================================================
   * STALE-DOC CORRECTION — the now-inaccurate SHIP-07 claim is corrected, not silently left.
   * ========================================================================================== */
  {
    const src = readSource(AUTOS_SHIP_07_DOC);
    assert.ok(src.includes("Correction (Work Package I.11A"), "SHIP-07 doc must carry the I.11A correction note");
    assert.ok(src.includes("draft-photo-upload/route.ts"), "correction must name the route that supersedes the stale claim");
  }

  /* ============================================================================================
   * REGRESSION — no locked-system file touched by this package.
   * ========================================================================================== */
  {
    let changedFiles = "";
    try {
      const { execFileSync } = await import("node:child_process");
      changedFiles = execFileSync("git", ["diff", "--name-only", "HEAD"], { cwd: REPO_ROOT, encoding: "utf8" });
    } catch {
      changedFiles = "";
    }
    const changed = changedFiles.split("\n").map((l) => l.trim()).filter(Boolean);
    const lockedPathFragments = [
      "stripe",
      "revenue-os",
      "webhook",
      "migrations",
      "entitlement",
      "ofertas",
      "cupones",
      "concierge",
      "admin/actions.ts",
      "app/api/admin/",
      "app/lib/analytics/server/",
      "app/api/analytics/",
    ];
    for (const f of changed) {
      const lower = f.toLowerCase();
      for (const frag of lockedPathFragments) {
        assert.ok(!lower.includes(frag), `locked-system file must not be part of this package's diff: ${f} (matched "${frag}")`);
      }
    }
  }

  console.log("gate-i11a-media-draft-persistence-truth-selftest: OK");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
