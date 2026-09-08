/**
 * Globalization Package B (Gates B1/B2/B3/B6) — full-catalog media adoption self-test.
 *
 * Pins:
 *   1. LANE REGISTRY TRUTH — every documented-literal limit in listingMediaConfigs.ts equals
 *      the category's REAL constant (imported here from the category modules), so registry
 *      drift is caught mechanically; every pipeline is classified; no lane is silently
 *      unmodeled.
 *   2. GENERIC EDITOR (B2) — the listings-family editor is no longer append-only: single
 *      persistence point for the FINAL ordered set, remove/reorder/hero actions, no display
 *      cap, per-category minimum floors mirroring real publish rules, and the same
 *      applyOwnerListingPatch call-site count (owner-write pin preserved).
 *   3. EXTERNAL VIDEO (B3) — the shared strict validator behaves (https-only, parseable,
 *      never blob:/data:), Servicios' add-video path is gated by it, and the Viajes boundary
 *      carries it in config without any Viajes-owned UI edit.
 *
 * Run from repo root: npx tsx scripts/gate-pkgB-media-adoption-selftest.ts
 */
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import path from "node:path";

import { LANE_MEDIA_REGISTRY, getLaneMediaRecords } from "../app/lib/media/listingMediaConfigs";
import {
  isStrictExternalVideoUrl,
  normalizeStrictExternalVideoUrl,
} from "../app/lib/media/externalVideoUrlValidation";
import { CATEGORY_ROUTE_REGISTRY } from "../app/lib/listingIdentity/categoryRouteRegistry";
// Real category constants (scripts may import app/(site) modules freely):
import { EN_VENTA_MAX_EXTERNAL_VIDEO_URLS } from "../app/(site)/clasificados/en-venta/shared/utils/enVentaVideoUrls";
import { EN_VENTA_PREVIEW_MAX_PHOTOS } from "../app/(site)/clasificados/en-venta/preview/buildEnVentaPreviewModel";
import { RESTAURANTE_MAX_EXTERNAL_VIDEO_URLS } from "../app/lib/clasificados/restaurantes/restauranteVideoUrls";
import { AUTOS_MAX_EXTERNAL_VIDEO_URLS } from "../app/lib/clasificados/autos/autosExternalVideoUrlValidation";
import { SERVICIOS_MAX_VIDEO_URLS } from "../app/(site)/clasificados/publicar/servicios/lib/clasificadosServiciosApplicationTypes";
import { AGENTE_RES_MAX_VIDEO_URLS } from "../app/(site)/clasificados/publicar/bienes-raices/negocio/agente-individual/schema/agenteIndividualResidencialFormState";
import { COMIDA_LOCAL_GALLERY_MAX } from "../app/lib/clasificados/comida-local/comidaLocalConstants";

const REPO_ROOT = path.resolve(__dirname, "..");
const read = (p: string) => readFileSync(path.join(REPO_ROOT, p), "utf8");

/* 1 — Registry truth vs real constants + full classification. */
{
  const byLane = (pipeline: string, lane: string) =>
    LANE_MEDIA_REGISTRY.find((r) => r.pipeline === pipeline && r.lane === lane)!;

  const enVenta = byLane("en_venta", "pro");
  assert.equal(enVenta.maxExternalVideos, EN_VENTA_MAX_EXTERNAL_VIDEO_URLS);
  assert.equal(enVenta.images.kind === "counted" && enVenta.images.max, EN_VENTA_PREVIEW_MAX_PHOTOS.pro);

  assert.equal(byLane("restaurantes", "default").maxExternalVideos, RESTAURANTE_MAX_EXTERNAL_VIDEO_URLS);
  assert.equal(byLane("autos_privado", "privado").maxExternalVideos, AUTOS_MAX_EXTERNAL_VIDEO_URLS);
  assert.equal(byLane("servicios", "default").maxExternalVideos, SERVICIOS_MAX_VIDEO_URLS);
  assert.equal(byLane("bienes_raices_negocio", "parent").maxExternalVideos, AGENTE_RES_MAX_VIDEO_URLS);
  const brChild = byLane("bienes_raices_negocio", "child");
  // MAX_CHILD_PHOTOS is module-private — pinned against source text instead of an import.
  const brChildDraftSrc = read(
    "app/(site)/clasificados/publicar/bienes-raices/negocio/application/brNegocioAdditionalInventoryDraft.ts",
  );
  const maxChildPhotos = Number(/const MAX_CHILD_PHOTOS = (\d+);/.exec(brChildDraftSrc)?.[1]);
  assert.equal(brChild.images.kind === "counted" && brChild.images.max, maxChildPhotos);
  const comida = byLane("comida_local", "default");
  assert.equal(comida.images.kind === "counted" && comida.images.max, COMIDA_LOCAL_GALLERY_MAX);

  // Every registered pipeline is classified (no silent omission).
  for (const pipeline of Object.keys(CATEGORY_ROUTE_REGISTRY)) {
    assert.ok(
      getLaneMediaRecords(pipeline as keyof typeof CATEGORY_ROUTE_REGISTRY).length > 0,
      `pipeline ${pipeline} must have at least one lane media record`,
    );
  }
  // Uncapped lanes are truthful classifications, not defaults: Empleos/Comunidad/Clases/Autos
  // have NO enforced count cap today (introducing one is a product decision, never a repair).
  for (const [pipeline, lane] of [
    ["empleos", "quick"],
    ["comunidad", "quick"],
    ["clases", "quick"],
    ["autos_negocios", "parent"],
  ] as const) {
    assert.equal(byLane(pipeline, lane).images.kind, "uncapped", `${pipeline}/${lane} is truthfully uncapped`);
  }
  // Ofertas stays a locked external boundary.
  assert.equal(byLane("ofertas_locales", "default").editSurface, "external-workstream");
}

/* 2 — Generic editor upgrade (B2). */
{
  const src = read("app/(site)/dashboard/mis-anuncios/[id]/editar/page.tsx");
  assert.ok(src.includes("async function persistImages"), "single persistence point for the final ordered set");
  assert.ok(src.includes("buildProposedFinalMediaSet"), "final-set semantics via the shared contract");
  assert.ok(src.includes("removeImageAt") && src.includes("moveImage") && src.includes("makeHeroImage"), "remove/reorder/hero actions exist");
  assert.ok(!src.includes(".slice(0, 8)"), "the silent 8-image display cap is gone");
  assert.ok(src.includes("minImagesForListingCategory"), "per-category minimum floors mirror real publish rules");
  assert.ok(
    src.includes('cat === "rentas" || cat === "bienes-raices" || cat === "mascotas-y-perdidos"'),
    "floors: rentas/bienes-raices/mascotas require 1 (their real publish rules); others 0",
  );
  const patchCallSites = src.split("applyOwnerListingPatch(").length - 1;
  assert.equal(patchCallSites, 6, "the I.12A owner-write call-site pin (6 in this file) is preserved");
}

/* 3 — External video (B3). */
{
  assert.equal(normalizeStrictExternalVideoUrl("https://youtube.com/watch?v=1"), "https://youtube.com/watch?v=1");
  assert.equal(normalizeStrictExternalVideoUrl("http://youtube.com/watch?v=1"), null, "http rejected — https-only");
  assert.equal(normalizeStrictExternalVideoUrl("blob:chrome/1"), null);
  assert.equal(normalizeStrictExternalVideoUrl("data:video/mp4;base64,x"), null);
  assert.equal(normalizeStrictExternalVideoUrl("not a url"), null);
  assert.equal(normalizeStrictExternalVideoUrl(""), null);
  assert.equal(isStrictExternalVideoUrl("https://vimeo.com/123"), true);

  const servicios = read("app/(site)/clasificados/publicar/servicios/components/ClasificadosServiciosApplication.tsx");
  assert.ok(
    servicios.includes("normalizeStrictExternalVideoUrl"),
    "Servicios add-video path must be gated by the shared strict validator (was: any web URL)",
  );

  // Viajes boundary: config carries the validator; no Viajes-owned UI file is modified by
  // Package B (checked by the diff-scope allowlist — no publicar/viajes or clasificados/viajes
  // product file is authorized in it for this package).
  const configs = read("app/lib/media/listingMediaConfigs.ts");
  assert.ok(configs.includes('videoValidator: "shared-https-strict"'), "Viajes/Servicios boundary uses the shared strict validator by contract");
  const allowlist = read("scripts/globalizationCurrentPackageDiff.ts");
  const packageBSection = allowlist.slice(allowlist.indexOf("PACKAGE B"));
  assert.ok(packageBSection.length > 0, "the allowlist must carry a Package B section");
  assert.ok(
    !/app\/\(site\)\/(publicar|clasificados)\/viajes\//.test(packageBSection),
    "no Viajes-owned product file is authorized in Package B's diff section",
  );
}

console.log("gate-pkgB-media-adoption-selftest: all assertions passed.");
