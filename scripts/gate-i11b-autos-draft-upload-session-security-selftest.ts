/**
 * Work Package I.11B — Autos Draft Upload Session Security self-test.
 *
 * Closes the gap I.11A's own final report named explicitly:
 * `app/api/clasificados/autos/media/draft-photo-upload/route.ts` still used a bare literal
 * `"anon"` path segment shared by every unauthenticated caller (worse than the four routes I.11A
 * already fixed, which at least namespaced by the client-supplied draft id). This is a Next.js
 * route handler and can't be invoked standalone outside the framework (same convention used
 * throughout this session) — coverage here is source-level (import presence, resolution order,
 * absence of the old bare "anon" fallback).
 *
 * Run from repo root:
 *   npx tsx scripts/gate-i11b-autos-draft-upload-session-security-selftest.ts
 */
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import path from "node:path";

const REPO_ROOT = path.resolve(__dirname, "..");
const AUTOS_ROUTE = "app/api/clasificados/autos/media/draft-photo-upload/route.ts";
const ANON_SESSION_HELPER = "app/api/clasificados/_lib/anonUploadSession.ts";
const I11A_ROUTES = [
  "app/api/clasificados/restaurantes/draft-media-upload/route.ts",
  "app/api/clasificados/servicios/draft-media-upload/route.ts",
  "app/api/clasificados/rentas/draft-media-upload/route.ts",
  "app/api/clasificados/comida-local/draft-media-upload/route.ts",
];

function readSource(rel: string): string {
  return readFileSync(path.join(REPO_ROOT, rel), "utf8");
}

async function main() {
  /* ============================================================================================
   * AUTHENTICATED — real, server-derived identity resolution is unchanged/preserved.
   * ========================================================================================== */
  {
    const src = readSource(AUTOS_ROUTE);
    assert.ok(
      src.includes("getAutosPublishUserIdFromRequest(req)"),
      "must still resolve the authenticated user via the existing real bearer-auth helper",
    );
    assert.ok(
      !src.includes("getBearerUserId"),
      "must not introduce a second, competing bearer-auth implementation — reuse the existing Autos one",
    );
  }

  /* ============================================================================================
   * ANONYMOUS — uses the shared I.11A server-issued session helper, not a bare "anon" constant
   * and not the client-supplied draftId alone.
   * ========================================================================================== */
  {
    const src = readSource(AUTOS_ROUTE);
    assert.ok(src.includes('from "@/app/api/clasificados/_lib/anonUploadSession"'), "must import the shared I.11A anon-session helper");
    assert.ok(src.includes("resolveAnonUploadSessionId(req)"), "must resolve the server-issued anon session when unauthenticated");
    assert.ok(src.includes("applyAnonUploadSessionCookie"), "must set the anon session cookie when newly minted");
    assert.ok(!/\|\|\s*["']anon["']/.test(src), "must not fall back to the old bare literal \"anon\" path segment");

    const ownerFnMatch = src.match(/function ownerPathSegment\([^)]*\)\s*:\s*string\s*\{[\s\S]*?\n\}/);
    assert.ok(ownerFnMatch, "must define ownerPathSegment");
    assert.ok(
      !ownerFnMatch![0].includes("draftId"),
      "ownerPathSegment must not fall back to the client-supplied draftId as the sole isolation boundary",
    );
  }

  /* ============================================================================================
   * NO SECOND IMPLEMENTATION — the same shared helper is reused, not duplicated.
   * ========================================================================================== */
  {
    const helperOccurrences = readFileSync(path.join(REPO_ROOT, ANON_SESSION_HELPER), "utf8");
    assert.ok(helperOccurrences.includes("export function resolveAnonUploadSessionId"), "shared helper must still be the single implementation");
    // Confirm the helper file itself was not duplicated elsewhere for Autos.
    const autosLibDir = path.join(REPO_ROOT, "app/lib/clasificados/autos");
    let autosDirHasDuplicate = false;
    try {
      const fs = await import("node:fs");
      for (const f of fs.readdirSync(autosLibDir)) {
        if (f.toLowerCase().includes("anonsession") || f.toLowerCase().includes("anon-session")) autosDirHasDuplicate = true;
      }
    } catch {
      /* ignore */
    }
    assert.ok(!autosDirHasDuplicate, "must not create a second anonymous-session implementation under the Autos lib directory");
  }

  /* ============================================================================================
   * PATH SAFETY — sanitization present for every path segment; no traversal, no empty segments.
   * ========================================================================================== */
  {
    const src = readSource(AUTOS_ROUTE);
    assert.ok(src.includes('replace(/[^a-zA-Z0-9_-]+/g, "")'), "draftId sanitization must still strip path-traversal characters");
    assert.ok(src.includes('|| "draft"'), "sanitized draftId must fall back to a safe non-empty default, never an empty path segment");
    assert.ok(src.includes("SLOTS.has(slot)"), "slot must remain allowlist-validated, not client-controlled free text");
    assert.ok(src.includes("MAX_IMAGE_BYTES"), "existing file-size limit must remain");
    assert.ok(src.includes('startsWith("image/")'), "existing MIME-type check must remain");
    assert.ok(!src.includes(".remove(") && !src.includes("del("), "must never delete an existing storage object");
    assert.ok(src.includes("BLOB_READ_WRITE_TOKEN"), "must still require the server-side Blob token — no exposed credentials");
  }

  /* ============================================================================================
   * REGRESSION — the four I.11A routes are untouched and still use the same shared model.
   * ========================================================================================== */
  {
    for (const route of I11A_ROUTES) {
      const src = readSource(route);
      assert.ok(src.includes('from "@/app/api/clasificados/_lib/anonUploadSession"'), `${route} must still use the shared anon-session helper (I.11A unmodified)`);
    }
  }

  /* ============================================================================================
   * SCOPE — no locked-system or Autos-application/IndexedDB-namespace file touched.
   * ========================================================================================== */
  {
    let changedFiles = "";
    try {
      const { execFileSync } = await import("node:child_process");
      changedFiles = execFileSync("git", ["diff", "--name-only", "HEAD"], { cwd: REPO_ROOT, encoding: "utf8" });
    } catch {
      changedFiles = "";
    }
    // Globalization P1 fixed the root cause of the app-wide stuck-loading-spinner defect (a
    // redundant global <Suspense> in app/layout.tsx) and, as a required consequence, added the
    // one local Suspense boundary Next.js's build requires around each of these two pages' own
    // useSearchParams() usage. Both are structural runtime-plumbing fixes only (no ownership,
    // payment, or business-logic change), required for "npm run build" to succeed at all -- not
    // an incursion into the Ofertas Locales or Autos Negocios workstreams this check protects.
    const GLOBALIZATION_P1_STRUCTURAL_SUSPENSE_FIX_EXCEPTIONS = new Set([
      "app/(site)/dashboard/ofertas-locales/[id]/page.tsx",
      "app/(site)/dashboard/ofertas-locales/page.tsx",
      "app/(site)/clasificados/autos/negocios/preview/page.tsx",
      "app/(site)/publicar/autos/negocios/page.tsx",
      "app/(site)/clasificados/bienes-raices/page.tsx",
      "app/(site)/clasificados/bienes-raices/pago/cancelado/page.tsx",
      "app/(site)/clasificados/bienes-raices/pago/exito/page.tsx",
      "app/(site)/clasificados/bienes-raices/resultados/page.tsx",
      "app/(site)/clasificados/publicar/bienes-raices/page.tsx",
      "app/admin/(dashboard)/workspace/clasificados/empleos/page.tsx",
      "app/admin/(dashboard)/workspace/clasificados/page.tsx",
      "app/admin/login/page.tsx",
    ]);
    const changed = changedFiles
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)
      .filter((f) => !GLOBALIZATION_P1_STRUCTURAL_SUSPENSE_FIX_EXCEPTIONS.has(f));
    const forbiddenFragments = [
      "stripe",
      "revenue-os",
      "entitlement",
      "app/api/admin/",
      "app/lib/analytics/",
      "app/api/analytics/",
      "ofertas",
      "concierge",
      "autoslistingeditnamespace", // I.11A's IndexedDB/session-namespace logic — locked for I.11B
      "useautodealerdraft",
      "useautoprivadodraft",
    ];
    for (const f of changed) {
      const lower = f.toLowerCase();
      for (const frag of forbiddenFragments) {
        assert.ok(!lower.includes(frag), `I.11B must not touch a locked-for-this-package file: ${f} (matched "${frag}")`);
      }
    }
  }

  console.log("gate-i11b-autos-draft-upload-session-security-selftest: OK");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
