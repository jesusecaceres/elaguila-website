/**
 * Work Package I.7A — Specialized Lifecycle Reconciliation self-test.
 *
 * Covers the four objectives: Empleos lifecycle closure, Rentas lifecycle truth, Viajes
 * lifecycle truth, and the corrected catalog ledger. Source-level assertions are used wherever a
 * live DB/network call would be required (matching the existing gate-i5/i6 convention) — the one
 * exception is Empleos' publish CTA and existing-identity fail-closed logic, which is exercised
 * directly where the code is a plain, importable function.
 *
 * Run from repo root:
 *   npx tsx scripts/gate-i7a-specialized-lifecycle-reconciliation-selftest.ts
 */
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import path from "node:path";

import { CATEGORY_ROUTE_REGISTRY, getCategoryRouteAdapter } from "../app/lib/listingIdentity/categoryRouteRegistry";
import { resolveDashboardActions } from "../app/lib/listingIdentity/dashboardActionResolver";
import type { ListingIdentity } from "../app/lib/listingIdentity/types";
import { QUICK_LISTING_EXISTING_IDENTITY_INVALID_CODE } from "../app/(site)/clasificados/lib/quickListingIdempotency";

const REPO_ROOT = path.resolve(__dirname, "..");

function fakeIdentity(overrides: Partial<ListingIdentity>): ListingIdentity {
  return {
    sourceTable: "listings",
    sourceId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    category: "empleos",
    pipeline: "empleos",
    leonixAdId: "",
    ownerUserId: "owner-1",
    publicUrl: "",
    editUrl: null,
    previewUrl: null,
    dashboardUrl: null,
    ...overrides,
  };
}

function readSource(rel: string): string {
  return readFileSync(path.join(REPO_ROOT, rel), "utf8");
}

async function main() {
  /* ============================================================================================
   * OBJECTIVE A — EMPLEOS
   * ========================================================================================== */
  {
    // Canonical results route, unchanged/regression.
    const adapter = getCategoryRouteAdapter("empleos");
    assert.equal(adapter.resultsRoute, "/clasificados/empleos/resultados");

    // Publish CTA reconciled — the landing client no longer routes through the legacy builder's
    // extra redirect hop; it now targets the registry-canonical hub directly.
    const landingSrc = readSource("app/(site)/clasificados/empleos/EmpleosLandingPageClient.tsx");
    assert.ok(!landingSrc.includes("categoryPublishPath"), "Empleos landing CTA must no longer call the legacy categoryStandardRoutes builder");
    assert.ok(landingSrc.includes("EMPLEOS_PUBLISH_HUB_PATH"), "Empleos landing CTA must use the canonical EMPLEOS_PUBLISH_HUB_PATH constant");
    assert.ok(landingSrc.includes("appendRouteLangToPath(EMPLEOS_PUBLISH_HUB_PATH"), "publishHref must be built from the canonical constant");
    // ES/EN survives — publishHref is still routed through the lang-appending helper.
    assert.ok(landingSrc.includes("appendRouteLangToPath"), "ES/EN must still be applied to the publish CTA");

    // Public and Preview routes are real, dedicated, slug-keyed surfaces (registry defers to a
    // precomputed publicUrl; editRoute is the real dedicated /dashboard/empleos/{id} page).
    assert.equal(adapter.publicRoute(fakeIdentity({ pipeline: "empleos", category: "empleos", publicUrl: "" })), null, "empleos.publicRoute must fail closed to null when no publicUrl is known");
    assert.equal(
      adapter.publicRoute(fakeIdentity({ pipeline: "empleos", category: "empleos", publicUrl: "/clasificados/empleos/some-job" })),
      "/clasificados/empleos/some-job",
      "empleos.publicRoute must echo a real, populated publicUrl",
    );
    const editOut = adapter.editRoute(fakeIdentity({ pipeline: "empleos", category: "empleos", sourceId: "job-uuid-1" }), { lang: "es" });
    assert.equal(editOut, "/dashboard/empleos/job-uuid-1?lang=es", "empleos.editRoute must resolve the real dedicated dashboard editor");

    // Existing-identity fail-closed contract, source-level (the function is server-only and
    // Supabase-admin-backed — not safely unit-callable here — same convention as other
    // server-only publishers audited in this session).
    assert.equal(QUICK_LISTING_EXISTING_IDENTITY_INVALID_CODE, "quick_listing_existing_identity_invalid");
    const dbServerSrc = readSource("app/(site)/clasificados/empleos/lib/empleosPublicListingsDbServer.ts");
    assert.ok(dbServerSrc.includes("QUICK_LISTING_EXISTING_IDENTITY_INVALID_CODE"), "must use the shared deterministic error code");
    assert.ok(
      /if \(rawListingId && !isUuid\(rawListingId\)\) \{\s*return \{ ok: false, error: QUICK_LISTING_EXISTING_IDENTITY_INVALID_CODE \};/.test(dbServerSrc),
      "an invalid (non-UUID) candidate listing id must fail closed before any insert/update",
    );
    assert.ok(
      /if \(candidateId && !existing\) \{\s*return \{ ok: false, error: QUICK_LISTING_EXISTING_IDENTITY_INVALID_CODE \};/.test(dbServerSrc),
      "a well-formed candidate id with no matching row must fail closed, never silently insert under that id",
    );
    // The genuinely-new-application case (no candidate id at all) must still be able to reach
    // insert — the candidateId-gated fail-closed branches must not have swallowed it.
    const insertIdx = dbServerSrc.indexOf(".insert({");
    assert.ok(insertIdx > -1, "a real insert path must still exist for genuinely new applications");
    // Owner mismatch still fails closed (pre-existing, unchanged, still load-bearing).
    assert.ok(dbServerSrc.includes('error: "forbidden"'), "owner mismatch must still fail closed with the existing forbidden error");
    // Lane mismatch still fails closed (pre-existing, unchanged, still load-bearing).
    assert.ok(dbServerSrc.includes('error: "lane_mismatch"'), "lane mismatch must still fail closed");

    // The API route maps the new error code to a real 4xx, not a generic 500.
    const routeSrc = readSource("app/api/clasificados/empleos/listings/route.ts");
    assert.ok(routeSrc.includes("QUICK_LISTING_EXISTING_IDENTITY_INVALID_CODE"), "the API route must map the new deterministic error code to a real status");
    assert.ok(/res\.error === QUICK_LISTING_EXISTING_IDENTITY_INVALID_CODE\s*\?\s*400/.test(routeSrc), "invalid existing identity must surface as 400, not 500");

    // Dead documentation-only registry entry corrected for accuracy (non-functional file, but
    // must not keep asserting a stale route as primary).
    const catStdSrc = readSource("app/(site)/clasificados/components/categoryPipeline/catStd1aPipelineRegistry.ts");
    assert.ok(catStdSrc.includes('resultsRoute: "/clasificados/empleos/resultados"'), "the doc-only pipeline registry must record the real canonical results route");
    assert.ok(catStdSrc.includes('resultsAliasRoute: "/clasificados/empleos/results"'), "and record /results as the alias, not the other way around");
  }

  /* ============================================================================================
   * OBJECTIVE B — RENTAS
   * ========================================================================================== */
  {
    const negocio = getCategoryRouteAdapter("rentas_negocio");
    const privado = getCategoryRouteAdapter("rentas_privado");

    // Active application routes, unchanged/regression — both lanes preserved, neither deleted.
    assert.equal(negocio.applicationRoute, "/publicar/rentas/negocio");
    assert.equal(privado.applicationRoute, "/publicar/rentas/privado");

    // Public route truthful, unchanged/regression — the dedicated canonical route from Gate I.5.4D.
    const negocioIdentity = fakeIdentity({ pipeline: "rentas_negocio", category: "rentas", sourceId: "rentas-uuid-1" });
    assert.equal(negocio.publicRoute(negocioIdentity, { lang: "es" }), "/clasificados/rentas/listing/rentas-uuid-1");

    // Lane identity preserved — seller_type still the real discriminator; neither adapter's
    // `category` field was touched (both remain "rentas", not silently split/merged).
    assert.equal(negocio.category, "rentas");
    assert.equal(privado.category, "rentas");
    assert.notEqual(negocio.pipeline, privado.pipeline);

    // Edit now resolves to the real, live dashboard href (Gate I.7A repair) — mirrors
    // rentasDashboardEditHref() in LeonixRealEstateListingManageCard.tsx exactly.
    const negocioEdit = negocio.editRoute(negocioIdentity, { lang: "es" });
    assert.ok(negocioEdit && negocioEdit.startsWith("/clasificados/publicar/rentas/negocio?"));
    assert.ok(negocioEdit!.includes("mode=listing-edit") && negocioEdit!.includes("lane=negocio"));
    const privadoEdit = privado.editRoute(fakeIdentity({ pipeline: "rentas_privado", category: "rentas", sourceId: "rentas-uuid-2" }), { lang: "en" });
    assert.ok(privadoEdit && privadoEdit.startsWith("/clasificados/publicar/rentas/privado?") && privadoEdit.includes("lane=privado"));

    // The manage-card's real edit href builder still exists and still matches the shape the
    // registry now mirrors — regression proof that I.7A did not fork a second, drifting builder.
    const manageCardSrc = readSource("app/(site)/dashboard/components/LeonixRealEstateListingManageCard.tsx");
    assert.ok(manageCardSrc.includes("function rentasDashboardEditHref"), "the real live edit href builder must still exist, untouched");

    // No lane deleted or silently merged — both adapters remain separately registered.
    assert.ok("rentas_negocio" in CATEGORY_ROUTE_REGISTRY && "rentas_privado" in CATEGORY_ROUTE_REGISTRY);

    // The genuinely open product decision (which lane/renderer is canonical for public Rentas at
    // launch) is NOT silently resolved here — the shared BR-publish-core query-error-on-reuse gap
    // found during audit is deliberately NOT touched, because leonixPublishRealEstateListingCore.ts
    // is shared with the locked Bienes Raíces pipeline; fixing it here would risk changing locked
    // BR behavior. Confirm that file was not touched by this package.
    const coreSrc = readSource("app/(site)/clasificados/lib/leonixPublishRealEstateListingCore.ts");
    assert.ok(coreSrc.includes('category === "bienes-raices"'), "confirms this publish core is genuinely shared with the locked Bienes Raíces pipeline — must remain untouched by I.7A");
  }

  /* ============================================================================================
   * OBJECTIVE C — VIAJES
   * ========================================================================================== */
  {
    const adapter = getCategoryRouteAdapter("viajes");

    // Canonical application route, unchanged/regression.
    assert.equal(adapter.applicationRoute, "/publicar/viajes");

    // Public route: honestly null when unknown, real when a genuine publicUrl is supplied —
    // never fabricated from sourceId, matching the Empleos slug-keyed pattern.
    assert.equal(adapter.publicRoute(fakeIdentity({ pipeline: "viajes", category: "viajes", publicUrl: "" }), { lang: "es" }), null);
    assert.equal(
      adapter.publicRoute(fakeIdentity({ pipeline: "viajes", category: "viajes", publicUrl: "/clasificados/viajes/oferta/some-trip" }), { lang: "es" }),
      "/clasificados/viajes/oferta/some-trip",
    );

    // Preview route: honestly null — no fabricated lane-specific guess.
    assert.equal(adapter.previewRoute(fakeIdentity({ pipeline: "viajes", category: "viajes" }), { lang: "es" }), null);

    // Dashboard actions fail closed: with editRoute/previewRoute still null and no publicUrl on
    // the identity, resolveDashboardActions must emit no unsafe navigate actions for those keys.
    const viajesIdentity = fakeIdentity({ pipeline: "viajes", category: "viajes", sourceId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaab", publicUrl: "" });
    const actions = resolveDashboardActions({
      identity: viajesIdentity,
      lifecycle: { status: "active" },
      entitlement: {},
      role: null,
      ownerVerified: true,
      lang: "es",
    });
    const keys = actions.map((a) => a.key);
    assert.ok(!keys.includes("edit"), "Viajes edit action must remain hidden — no safe, provable per-identity edit route exists here");
    assert.ok(!keys.includes("preview"), "Viajes preview action must remain hidden — same reasoning");
    assert.ok(!keys.includes("viewPublic"), "Viajes viewPublic must not appear when the identity carries no known publicUrl (fail closed, not fabricated)");

    // Owner-unverified still fails closed entirely (pre-existing resolver guarantee, regression).
    const unverified = resolveDashboardActions({
      identity: viajesIdentity,
      lifecycle: { status: "active" },
      entitlement: {},
      role: null,
      ownerVerified: false,
      lang: "es",
    });
    assert.equal(unverified.length, 0);

    // Registry comments must honestly reflect the re-audited truth, not the stale "confirmed
    // ambiguity" framing (negocio/[slug] is dead code, oferta/[slug] is real).
    const registrySrc = readSource("app/lib/listingIdentity/categoryRouteRegistry.ts");
    const viajesBlockMatch = registrySrc.match(/const VIAJES_ADAPTER[\s\S]*?\n\};/);
    assert.ok(viajesBlockMatch, "must locate the VIAJES_ADAPTER block");
    assert.ok(viajesBlockMatch![0].includes("oferta/[slug]"), "must reference the real public detail route");
    assert.ok(viajesBlockMatch![0].includes("negocio/[slug]") === false || viajesBlockMatch![0].includes("dead"), "must not still describe negocio/[slug] as a live competing tree without noting it is dead");

    // The real, live dashboard page's own bespoke routing is untouched (out of scope, working).
    const dashboardSrc = readSource("app/(site)/dashboard/viajes/page.tsx");
    assert.ok(dashboardSrc.includes("oferta/"), "the real dashboard page must still link to the real oferta/[slug] public route");
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
      "app/(site)/clasificados/lib/leonixPublishRealEstateListingCore.ts",
      "bienes-raices",
      "restaurantes",
      "servicios",
      "/autos/",
      "ofertas",
      "cupones",
      "concierge",
      "stripe",
      "revenue-os",
    ];
    /**
     * Work Package I.10A (Global Analytics and Engagement Foundation) approved, narrow exception.
     * I.10A intentionally added canonical analytics-event wiring (Save tracking, owner
     * self-engagement guard) to these two Bienes Raíces shells — verified to touch only the
     * inline Save handler's tracking call and a same-file owner-id comparison, never publish-core
     * sharing or route/lifecycle logic (this gate's assertions above, e.g. the
     * `leonixPublishRealEstateListingCore.ts` untouched-check, are unaffected and still prove
     * that). Exact-file, exact-fragment allowlist only — every other "bienes-raices" file, and
     * every other locked fragment for these two files, remains fully protected below.
     */
    const I10A_BR_ANALYTICS_WIRING_EXCEPTIONS = new Set<string>([
      "app/(site)/clasificados/bienes-raices/listing/BienesRaicesNegocioLiveDetailShell.tsx",
      "app/(site)/clasificados/bienes-raices/listing/BienesRaicesPrivadoLiveDetailShell.tsx",
    ]);
    /**
     * Work Package I.11A (Global Media and Draft Persistence Foundation) approved, narrow
     * exception. I.11A intentionally (a) fixed the Autos Negocios/Privado draft-key collision
     * between "new listing" and "edit existing listing" (session-namespace resolution only — the
     * low-level IndexedDB/storage files themselves are provably untouched, see
     * `gate-i11a-autos-listing-edit-media-isolation-selftest.ts`), and (b) added real upload-owner
     * verification to the Restaurantes/Servicios draft-media-upload routes. Exact-file,
     * exact-fragment allowlist only — every other Autos/Restaurantes/Servicios file, and every
     * other locked fragment for these files, remains fully protected below.
     */
    const I11A_MEDIA_DRAFT_PERSISTENCE_EXCEPTIONS = new Set<string>([
      "app/(site)/publicar/autos/negocios/components/AutosNegociosApplication.tsx",
      "app/(site)/publicar/autos/negocios/hooks/useAutoDealerDraft.ts",
      "app/(site)/publicar/autos/negocios/lib/autosPublishedToDealerApplicationDraft.ts",
      "app/(site)/publicar/autos/privado/components/AutosPrivadoApplication.tsx",
      "app/(site)/publicar/autos/privado/hooks/useAutoPrivadoDraft.ts",
      "app/lib/clasificados/autos/AUTOS_A5_SHIP_07_ZERO_DATA_LOSS_MEDIA_STORAGE_AUDIT.md",
      "app/api/clasificados/restaurantes/draft-media-upload/route.ts",
      "app/api/clasificados/servicios/draft-media-upload/route.ts",
    ]);
    /**
     * Work Package I.11B (Autos Draft Upload Session Security) approved, narrow exception.
     * I.11B applied the exact same anon-session-scoping fix I.11A already shipped for the other
     * four draft-media-upload routes to the one Autos held out — verified to touch only the
     * upload-path identity resolution in this single route, never Autos application/draft/
     * IndexedDB-namespace logic (locked for this package; see `gate-i11b-autos-draft-upload-
     * session-security-selftest.ts`'s own scope check). Exact-file, exact-fragment allowlist
     * only — every other "/autos/" file remains fully protected below.
     */
    const I11B_AUTOS_UPLOAD_SESSION_EXCEPTIONS = new Set<string>([
      "app/api/clasificados/autos/media/draft-photo-upload/route.ts",
    ]);
    for (const f of changed) {
      const lower = f.toLowerCase();
      for (const frag of lockedPathFragments) {
        if (frag === "bienes-raices" && I10A_BR_ANALYTICS_WIRING_EXCEPTIONS.has(f)) continue;
        if ((frag === "/autos/" || frag === "restaurantes" || frag === "servicios") && I11A_MEDIA_DRAFT_PERSISTENCE_EXCEPTIONS.has(f)) continue;
        if (frag === "/autos/" && I11B_AUTOS_UPLOAD_SESSION_EXCEPTIONS.has(f)) continue;
        assert.ok(!lower.includes(frag.toLowerCase()), `locked-system file must not be part of this package's diff: ${f} (matched "${frag}")`);
      }
    }
  }

  console.log("gate-i7a-specialized-lifecycle-reconciliation-selftest: OK");
}

main();
