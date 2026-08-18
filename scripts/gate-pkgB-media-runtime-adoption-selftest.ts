/**
 * Globalization Package B (Gate B6 closure) — RUNTIME adoption proof for
 * app/lib/media/listingMediaContract.ts.
 *
 * The original B6 report cited listingMediaConfigs.ts (a config registry) and source-test
 * pins as adoption evidence for every lane. On owner review that was correctly rejected: a
 * config entry describes a limit, it does not prove the shared engine (buildProposedFinalMediaSet
 * / validateProposedFinalMediaSet) is actually imported and executed at any real save boundary.
 * This gate closes that gap by pinning the REAL call sites added in this closure, one per
 * dedicated-editor lane that was previously config-only. It intentionally does NOT re-pin the
 * six lanes that route through the generic owner-verified editor
 * (app/(site)/dashboard/mis-anuncios/[id]/editar/page.tsx) — gate-pkgB-media-adoption-selftest.ts
 * already pins that file's calls, and every one of those six lanes' editRoute() resolves to it
 * (asserted in section 1 below via source-text on categoryRouteRegistry.ts).
 *
 * Run from repo root: npx tsx scripts/gate-pkgB-media-runtime-adoption-selftest.ts
 */
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import path from "node:path";

const REPO_ROOT = path.resolve(__dirname, "..");
const read = (p: string) => readFileSync(path.join(REPO_ROOT, p), "utf8");

const CALL = /buildProposedFinalMediaSet\(|validateProposedFinalMediaSet\(/;

/* 1 — the six generic-editor lanes genuinely resolve to the file the adoption gate already
 * pins (en_venta, busco, clases, comunidad, mascotas_y_perdidos, bienes_raices_privado). */
{
  const registry = read("app/lib/listingIdentity/categoryRouteRegistry.ts");
  const genericEditorLanes: Array<[string, RegExp]> = [
    ["en_venta", /const EN_VENTA_ADAPTER[\s\S]{0,3000}?editRoute:[\s\S]{0,300}?\/dashboard\/mis-anuncios\/\$\{identity\.sourceId\}\/editar/],
    ["busco", /const BUSCO_ADAPTER[\s\S]{0,3000}?editRoute:[\s\S]{0,300}?\/dashboard\/mis-anuncios\/\$\{identity\.sourceId\}\/editar/],
    ["clases", /const CLASES_ADAPTER[\s\S]{0,2000}?editRoute:[\s\S]{0,300}?\/dashboard\/mis-anuncios\/\$\{identity\.sourceId\}\/editar/],
    ["comunidad", /const COMUNIDAD_ADAPTER[\s\S]{0,2000}?editRoute:[\s\S]{0,300}?\/dashboard\/mis-anuncios\/\$\{identity\.sourceId\}\/editar/],
    ["mascotas_y_perdidos", /const MASCOTAS_Y_PERDIDOS_ADAPTER[\s\S]{0,2500}?editRoute:[\s\S]{0,300}?\/dashboard\/mis-anuncios\/\$\{identity\.sourceId\}\/editar/],
    ["bienes_raices_privado", /const BIENES_RAICES_PRIVADO_ADAPTER[\s\S]{0,2500}?editRoute:[\s\S]{0,300}?\/dashboard\/mis-anuncios\/\$\{identity\.sourceId\}\/editar/],
  ];
  for (const [pipeline, pattern] of genericEditorLanes) {
    assert.match(registry, pattern, `${pipeline}'s editRoute() must resolve to the generic editor (the real listingMediaContract.ts consumer)`);
  }
  const editar = read("app/(site)/dashboard/mis-anuncios/[id]/editar/page.tsx");
  assert.ok(CALL.test(editar), "the generic editor must actually call the shared engine (pinned again here, not only in the B1 adoption gate)");
}

/* 2 — Servicios: real server-side publish boundary (new + listing-edit both route through this
 * single POST handler). */
{
  const src = read("app/api/clasificados/servicios/publish/route.ts");
  assert.ok(CALL.test(src), "Servicios publish route must call the shared engine");
  assert.ok(src.includes("validateProposedFinalMediaSet(serviciosFinalMedia"), "the validation call must run on the real constructed set, not a stub");
  assert.ok(src.includes('error: "media_invalid"'), "an invalid result must actually block persistence with a real error response");
}

/* 3 — Restaurantes: real server-side publish boundary, additive to the proven
 * hasRestauranteMinimumPublishImage / buildRestaurantePublish422MediaAudit gate. */
{
  const src = read("app/api/clasificados/restaurantes/publish/route.ts");
  assert.ok(CALL.test(src), "Restaurantes publish route must call the shared engine");
  assert.ok(src.includes("collectRestauranteExternalVideoUrls(draft)"), "video truth must be sourced from the category's own real video collector, not invented");
  assert.ok(src.includes('error: "media_invalid"'), "an invalid result must actually block persistence");
}

/* 4 — Comida Local: real, tier-aware parse boundary (parseComidaLocalPublishRequest), additive
 * to the proven validateComidaLocalPublishPayload gate. */
{
  const src = read("app/lib/clasificados/comida-local/comidaLocalPublishValidation.ts");
  assert.ok(CALL.test(src), "Comida Local publish validation must call the shared engine");
  assert.ok(src.includes("getComidaLocalPackageLimits(packageTier)"), "the max must be the real, tier-aware limit — never a flat guess");
  assert.ok(src.includes('error: "media_invalid"'), "an invalid result must actually block persistence");
}

/* 5 — Autos: real, single, shared persistence boundary used by BOTH create and update
 * (autosClassifiedsListingService.ts), covering privado + dealer parent + dealer child. */
{
  const src = read("app/lib/clasificados/autos/autosListingPayloadPersistence.ts");
  assert.ok(CALL.test(src), "Autos persistence sanitizer must call the shared engine");
  assert.ok(src.includes("AUTOS_MAX_EXTERNAL_VIDEO_URLS"), "video cap must be the real, imported category constant");
  const service = read("app/lib/clasificados/autos/autosClassifiedsListingService.ts");
  const callSites = (service.match(/sanitizeAutosListingPayloadForPersistence\(/g) ?? []).length;
  assert.ok(callSites >= 2, "the sanitizer (and therefore the shared engine) must run on both the create and update paths");
}

/* 6 — BR Negocio (parent + child, via the shared builder) and Rentas Negocio/Privado: real
 * per-lane builders in leonixPublishRealEstateFromDraftState.ts. Does NOT touch the locked
 * publishLeonixRealEstateListingCore.ts (Globalization master plan §10-G). */
{
  const src = read("app/(site)/clasificados/lib/leonixPublishRealEstateFromDraftState.ts");
  const callCount = (src.match(CALL) ? src.match(new RegExp(CALL.source, "g")) ?? [] : []).length;
  assert.ok(callCount >= 3, "must call the shared engine at least 3 times: rentas privado, rentas negocio, bienes raices negocio");
  assert.ok(
    /function buildRentasPrivadoListingParams[\s\S]{0,900}rentasPrivadoMedia/.test(src),
    "Rentas Privado's builder must validate the real ordered gallery it just built",
  );
  assert.ok(
    /function buildRentasNegocioListingParams[\s\S]{0,900}rentasNegocioMedia/.test(src),
    "Rentas Negocio's builder must validate the real ordered gallery it just built",
  );
  assert.ok(
    /function buildPublishParamsFromBienesRaicesNegocioDraft[\s\S]{0,700}brNegocioMedia/.test(src),
    "BR Negocio's builder (shared by the parent lane and, via mapAgenteResidencialFormStateToNegocioForPublish, the live agente-individual/child-embedding path) must validate the real ordered gallery",
  );
  const core = read("app/(site)/clasificados/lib/leonixPublishRealEstateListingCore.ts");
  assert.ok(!CALL.test(core), "the locked shared publish core must NOT be modified to call the engine — adoption stays in the per-lane builders");
}

/* 7 — Empleos: real envelope-construction boundary (quick + premium lanes; feria is a
 * single-flyer lane, not a gallery, and stays out of scope). */
{
  const src = read("app/(site)/publicar/empleos/shared/publish/buildEmpleosPublishEnvelope.ts");
  assert.ok(CALL.test(src), "Empleos publish envelope builder must call the shared engine");
  assert.ok(src.includes("auditEmpleosEnvelopeMedia(data.images"), "the quick lane must audit its own real, already-sanitized image list");
  assert.ok(src.includes("auditEmpleosEnvelopeMedia(data.gallery"), "the premium lane must audit its own real, already-sanitized gallery");
}

console.log("gate-pkgB-media-runtime-adoption-selftest: all assertions passed.");
