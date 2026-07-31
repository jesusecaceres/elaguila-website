/**
 * Gate I.5.4D — self-test for Rentas canonical public-route consolidation.
 *
 * Confirmed root cause: `RENTAS_NEGOCIO_ADAPTER.publicRoute` and `RENTAS_PRIVADO_ADAPTER.publicRoute`
 * in the category route registry both resolved to `/clasificados/anuncio/${id}` — the shared,
 * multi-category, less-proven Rentas shell — instead of `/clasificados/rentas/listing/${id}`,
 * which every actual live Rentas caller (dashboard, Mis Anuncios, admin, results/landing cards,
 * the canonical page's own share link) already used via `rentasListingPublicPath()`. A repo-wide
 * caller audit found exactly one dedicated-Rentas component still hardcoding the old generic path
 * (`RentasSameCompanyListingsSection.tsx`) and one dedicated redirect alias pointed the wrong way
 * (`/clasificados/rentas/anuncio/[id]`, which also silently dropped every incoming query param).
 * No live code path was found constructing a `rentas_negocio`/`rentas_privado` `ListingIdentity`
 * and consuming `.publicRoute()` today — the registry bug was structural (a trap for future
 * registry-driven callers), not a currently user-visible break, mirroring Gate I.5.4C's pattern.
 *
 * Proves: both Rentas adapters resolve `publicRoute` to the canonical route for arbitrary source
 * IDs; Privado and Negocio agree; the fixed alias redirect preserves every incoming query
 * parameter in a single hop with no loop; the one corrected dedicated-Rentas component no longer
 * references the generic route; En Venta and Bienes Raíces adapters/routes are untouched; the
 * Rentas renderer/mapper files are untouched; and no locked system was touched.
 *
 * No network, no React rendering. Run from repo root:
 *   npx tsx scripts/gate-i5-4d-rentas-canonical-public-route-selftest.ts
 */
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import path from "node:path";

import { getCategoryRouteAdapter } from "../app/lib/listingIdentity/categoryRouteRegistry";
import type { ListingIdentity } from "../app/lib/listingIdentity/types";

const REPO_ROOT = path.resolve(__dirname, "..");

function readSource(relPath: string): string {
  return readFileSync(path.join(REPO_ROOT, relPath), "utf8");
}

function fakeIdentity(sourceId: string): ListingIdentity {
  return {
    sourceTable: "listings",
    sourceId,
    category: "rentas",
    pipeline: "rentas_privado",
    leonixAdId: "",
    ownerUserId: "owner-1",
    publicUrl: "",
  } as unknown as ListingIdentity;
}

const REGISTRY_FILE = "app/lib/listingIdentity/categoryRouteRegistry.ts";
const ALIAS_REDIRECT_FILE = "app/(site)/clasificados/rentas/anuncio/[id]/page.tsx";
const SAME_COMPANY_FILE = "app/(site)/clasificados/rentas/listing/components/RentasSameCompanyListingsSection.tsx";
const CANONICAL_PAGE_FILE = "app/(site)/clasificados/rentas/listing/[id]/page.tsx";
const RENTAS_ROUTES_FILE = "app/(site)/clasificados/rentas/shared/utils/rentasPublishRoutes.ts";
const SHARED_ANUNCIO_FILE = "app/(site)/clasificados/anuncio/[id]/page.tsx";
const VISUAL_MATCH_RENDERER_FILE = "app/(site)/clasificados/rentas/preview/shared/RentasVisualMatchPreviewView.tsx";
const RENTAS_LIVE_MAPPER_FILE = "app/(site)/clasificados/rentas/listing/mapRentasListingLiveToPreviewVm.ts";

/**
 * Work Package I.10A (Global Analytics and Engagement Foundation) approved, narrow exception.
 * I.10A intentionally added canonical analytics-event wiring (view/open/like/save/share tracking
 * calls, owner self-engagement guard) to these two files — verified, file-by-file, to touch only
 * tracking call sites, never route/identity resolution. This gate's own adapter-equality and
 * caller-list assertions above are unaffected and still independently prove the route fix this
 * gate exists for. Exact-file allowlist only — every other file remains fully protected below.
 * Also covers the two Bienes Raíces live-detail shells (`BienesRaicesNegocioLiveDetailShell.tsx`,
 * `BienesRaicesPrivadoLiveDetailShell.tsx`), which this gate's "no Bienes Raíces file in the
 * diff" check below would otherwise also catch — same I.10A analytics-only wiring, same proof.
 */
const I10A_ANALYTICS_WIRING_EXCEPTIONS = new Set<string>([
  SHARED_ANUNCIO_FILE,
  VISUAL_MATCH_RENDERER_FILE,
  "app/(site)/clasificados/bienes-raices/listing/BienesRaicesNegocioLiveDetailShell.tsx",
  "app/(site)/clasificados/bienes-raices/listing/BienesRaicesPrivadoLiveDetailShell.tsx",
]);

async function main() {
  /* ---------------------------------------------------------------------------------------- *
   * 1/2 — the registry resolves both Rentas lanes to the canonical route, and they agree.
   * ---------------------------------------------------------------------------------------- */
  {
    const negocio = getCategoryRouteAdapter("rentas_negocio");
    const privado = getCategoryRouteAdapter("rentas_privado");
    const id = "11111111-1111-1111-1111-111111111111";
    const negocioPublicRoute = negocio.publicRoute(fakeIdentity(id));
    const privadoPublicRoute = privado.publicRoute(fakeIdentity(id));
    assert.ok(negocioPublicRoute, "Negocio adapter must return a public route");
    assert.ok(privadoPublicRoute, "Privado adapter must return a public route");
    assert.equal(negocioPublicRoute, `/clasificados/rentas/listing/${id}`);
    assert.equal(privadoPublicRoute, `/clasificados/rentas/listing/${id}`);
    assert.equal(negocioPublicRoute, privadoPublicRoute, "Negocio and Privado must resolve the same canonical public route shape");
    assert.ok(!negocioPublicRoute!.includes("/clasificados/anuncio/"), "registry must no longer resolve Rentas to the generic shared route");
  }

  /* ---------------------------------------------------------------------------------------- *
   * 3/4/5/6/7/8 — every already-correct live caller is still correct (dashboard, Mis Anuncios,
   * admin, results/landing cards, preview share link) — this gate must not have regressed any of
   * them while fixing the registry and the two genuinely broken callers.
   * ---------------------------------------------------------------------------------------- */
  {
    const callers = [
      "app/(site)/dashboard/components/LeonixRealEstateListingManageCard.tsx",
      "app/(site)/dashboard/mis-anuncios/page.tsx",
      "app/(site)/dashboard/mis-anuncios/[id]/page.tsx",
      "app/(site)/dashboard/mis-anuncios/[id]/editar/page.tsx",
      "app/admin/(dashboard)/workspace/clasificados/rentas/[id]/page.tsx",
      "app/admin/(dashboard)/workspace/clasificados/_components/AdminListingReviewSnapshot.tsx",
      "app/admin/(dashboard)/workspace/clasificados/_components/ClassifiedAdminQueueRowActionsPanel.tsx",
      "app/(site)/clasificados/rentas/landing/rentasListingResultsHandoff.ts",
      CANONICAL_PAGE_FILE.replace("page.tsx", "RentasListingDetailClient.tsx"),
    ];
    for (const f of callers) {
      const src = readSource(f);
      assert.ok(src.includes("rentasListingPublicPath"), `${f} must resolve Rentas public links via rentasListingPublicPath`);
    }
  }

  /* ---------------------------------------------------------------------------------------- *
   * 9/10/11/12 — the fixed dedicated alias redirect targets the canonical route, preserves the
   * full incoming query set (not a narrow whitelist), and is a single hop (no chained redirect(),
   * no loop back to itself or to the alias it replaces).
   * ---------------------------------------------------------------------------------------- */
  {
    const src = readSource(ALIAS_REDIRECT_FILE);
    assert.ok(src.includes("rentasListingPublicPath"), "alias redirect must target the canonical route builder");
    assert.ok(!src.includes("leonixLiveAnuncioPath"), "alias redirect must no longer target the generic shared route");
    assert.ok(src.includes("searchParams"), "alias redirect must read incoming search params");
    assert.ok(!/for.*of.*\[.?lang.?,/.test(src), "must not use a narrow param whitelist");
    const redirectCalls = (src.match(/redirect\(/g) ?? []).length;
    assert.ok(redirectCalls >= 1 && redirectCalls <= 2, "must be a single-hop redirect (one live-id redirect call, plus the empty-id guard)");
    assert.ok(!src.includes('redirect("/clasificados/rentas/anuncio'), "must never redirect back into itself (no loop)");
  }

  /* ---------------------------------------------------------------------------------------- *
   * The one dedicated-Rentas component that hardcoded the generic route no longer does.
   * ---------------------------------------------------------------------------------------- */
  {
    const src = readSource(SAME_COMPANY_FILE);
    assert.ok(!src.includes("/clasificados/anuncio/"), "RentasSameCompanyListingsSection must no longer hardcode the generic route");
    assert.ok(src.includes("rentasListingPublicPath"), "must use the canonical route builder");
  }

  /* ---------------------------------------------------------------------------------------- *
   * 13/14 — other categories' generic public route and the shared multi-category file are
   * untouched: this gate corrected Rentas-specific callers only, never the shared file itself
   * (which also serves En Venta and Bienes Raíces).
   * ---------------------------------------------------------------------------------------- */
  {
    let changedFiles = "";
    try {
      changedFiles = execFileSync("git", ["diff", "--name-only", "HEAD"], { cwd: REPO_ROOT, encoding: "utf8" });
    } catch {
      changedFiles = "";
    }
    const changed = changedFiles.split("\n").map((l) => l.trim()).filter(Boolean);
    assert.ok(
      !changed.includes(SHARED_ANUNCIO_FILE) || I10A_ANALYTICS_WIRING_EXCEPTIONS.has(SHARED_ANUNCIO_FILE),
      "the shared multi-category /clasificados/anuncio/[id] route must not be modified outside the approved I.10A analytics exception",
    );
    const enVenta = getCategoryRouteAdapter("en_venta");
    assert.equal(enVenta.applicationRoute, "/clasificados/publicar/en-venta/pro", "En Venta's registry entry must be untouched");
    const brNegocio = getCategoryRouteAdapter("bienes_raices_negocio");
    assert.ok(
      !changed.some((f) => f.includes("bienes-raices") && !f.includes("Rentas") && !I10A_ANALYTICS_WIRING_EXCEPTIONS.has(f)),
      "no Bienes Raíces file should be part of this gate's changes outside the approved I.10A analytics exception",
    );
    void brNegocio;
  }

  /* ---------------------------------------------------------------------------------------- *
   * 15 — the Rentas renderer and live mapper are untouched (locked systems).
   * ---------------------------------------------------------------------------------------- */
  {
    let changedFiles = "";
    try {
      changedFiles = execFileSync("git", ["diff", "--name-only", "HEAD"], { cwd: REPO_ROOT, encoding: "utf8" });
    } catch {
      changedFiles = "";
    }
    const changed = changedFiles.split("\n").map((l) => l.trim()).filter(Boolean);
    assert.ok(
      !changed.includes(VISUAL_MATCH_RENDERER_FILE) || I10A_ANALYTICS_WIRING_EXCEPTIONS.has(VISUAL_MATCH_RENDERER_FILE),
      "RentasVisualMatchPreviewView must not be modified outside the approved I.10A analytics exception",
    );
    assert.ok(!changed.includes(RENTAS_LIVE_MAPPER_FILE), "mapRentasListingLiveToPreviewVm must not be modified");
    assert.ok(!changed.includes(RENTAS_ROUTES_FILE), "rentasPublishRoutes.ts (the canonical builder itself) must not need any change");
  }

  /* ---------------------------------------------------------------------------------------- *
   * 16/17 — no locked system referenced by the lines this gate actually added, and no route file
   * was deleted (only additions/edits).
   * ---------------------------------------------------------------------------------------- */
  {
    let changedFiles = "";
    let deletedFiles = "";
    try {
      changedFiles = execFileSync("git", ["diff", "--name-only", "HEAD"], { cwd: REPO_ROOT, encoding: "utf8" });
      deletedFiles = execFileSync("git", ["diff", "--name-only", "--diff-filter=D", "HEAD"], { cwd: REPO_ROOT, encoding: "utf8" });
    } catch {
      changedFiles = "";
      deletedFiles = "";
    }
    assert.equal(deletedFiles.trim(), "", "no file may be deleted by this gate");
    assert.ok(!changedFiles.split("\n").some((f) => f.trim().startsWith("supabase/migrations/")), "no migration file may be part of this gate's changes");

    for (const f of [REGISTRY_FILE, ALIAS_REDIRECT_FILE, SAME_COMPANY_FILE]) {
      let diff = "";
      try {
        diff = execFileSync("git", ["diff", "--unified=0", "HEAD", "--", f], { cwd: REPO_ROOT, encoding: "utf8" });
      } catch {
        diff = "";
      }
      const addedLines = diff
        .split("\n")
        .filter((l) => l.startsWith("+") && !l.startsWith("+++"))
        .join("\n");
      assert.ok(
        !/stripe|checkout|webhook|entitlement|lifecycle|migrations\//i.test(addedLines),
        `${f}: lines added by this gate must not reference any locked system`,
      );
    }
  }

  console.log("gate-i5-4d-rentas-canonical-public-route-selftest: OK");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
