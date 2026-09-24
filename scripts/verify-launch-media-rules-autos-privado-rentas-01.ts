/**
 * SAN JOSE LAUNCH - Autos Privado + Rentas media rules (2026-09-24).
 *
 * Pins two owner-facing decisions with source assertions AND executed pure checks:
 *
 *  AUTOS PRIVADO  One rule, input -> preview -> publish: flat-priced product (autos_privado_30d),
 *                 NO Quick/Full split, photos uncapped, external https video links up to
 *                 AUTOS_MAX_EXTERNAL_VIDEO_URLS, at least one photo OR video for preview/publish,
 *                 no local video / data: / blob: transport. The dead AUTOS_FREE/PRO_PRIVATE_* constants
 *                 are NON-AUTHORITATIVE and imported by nothing. The Quick 3-image / no-video limit
 *                 (a Dealer package signal read from ?plan=quick) can never reach a private seller.
 *
 *  RENTAS         External video links (up to 4) are a SUPPORTED feature of BOTH lanes: the forms take
 *                 them, the persist step stores them as Leonix:rent:video_url[_2..4] detail pairs, the
 *                 public page reads them and the publish media contract now agrees (was 0 / registry 1).
 *                 "Rentas Negocio" is not a separate assisted product: the assisted launcher is one
 *                 flat Rentas product (rentas_30d) opening the canonical privado application.
 *
 * Run: node node_modules/tsx/dist/cli.mjs --tsconfig scripts/lib/tsconfig.harness.json scripts/verify-launch-media-rules-autos-privado-rentas-01.ts
 */
import { strict as assert } from "node:assert";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { LANE_MEDIA_REGISTRY } from "../app/lib/media/listingMediaConfigs";
import { REVENUE_V1_PACKAGE_MATRIX } from "../app/lib/listingPlans/revenuePricingMatrix";
import { AUTOS_MAX_EXTERNAL_VIDEO_URLS } from "../app/lib/clasificados/autos/autosExternalVideoUrlValidation";
import { sanitizeAutosListingPayloadForPersistence } from "../app/lib/clasificados/autos/autosListingPayloadPersistence";
import { getAutosPreviewCompletenessIssues } from "../app/(site)/clasificados/autos/shared/lib/autosPreviewCompleteness";
import {
  RENTAS_MAX_EXTERNAL_VIDEO_URLS,
  rentasVideoUrls,
} from "../app/(site)/clasificados/rentas/lib/rentasMachineDetailPairs";
import {
  buildRentasNegocioListingParams,
  buildRentasPrivadoListingParams,
} from "../app/(site)/clasificados/lib/leonixPublishRealEstateFromDraftState";
import {
  createEmptyRentasNegocioFormState,
  mergePartialRentasNegocioState,
} from "../app/(site)/clasificados/publicar/rentas/negocio/schema/rentasNegocioFormState";
import {
  createEmptyRentasPrivadoFormState,
  mergePartialRentasPrivadoState,
} from "../app/(site)/clasificados/publicar/rentas/privado/schema/rentasPrivadoFormState";
import { QUICK_SALES_CATEGORIES, QUICK_SALES_CATEGORY_MAP } from "../app/lib/sales/quickSalesCategories";
import { staffLauncherItem, staffLauncherHasQuickFull } from "../app/lib/sales/staffMasterLauncher";

const failures: string[] = [];
function check(name: string, fn: () => void) {
  try {
    fn();
    console.log(`OK: ${name}`);
  } catch (e) {
    failures.push(`${name}: ${e instanceof Error ? e.message : String(e)}`);
    console.error(`FAIL: ${name}\n  ${e instanceof Error ? e.message : String(e)}`);
  }
}
const raw = (rel: string) => readFileSync(rel, "utf8").replace(/\r\n/g, "\n");

/* ---------------------------------------------------------------------------------------------
 * AUTOS PRIVADO
 * ------------------------------------------------------------------------------------------- */

const MEDIA_MANAGER = "app/(site)/publicar/autos/negocios/components/AutosNegociosMediaManager.tsx";
const PRIVADO_APP = "app/(site)/publicar/autos/privado/components/AutosPrivadoApplication.tsx";
const DEALER_STEPS = "app/(site)/publicar/autos/negocios/components/AutosNegociosVehicleApplicationSteps.tsx";
const AUTOS_LISTINGS_ROUTE = "app/api/clasificados/autos/listings/route.ts";
const FREE_CONTRACT = "app/(site)/clasificados/autos/free/contracts/autosFreePrivateContract.ts";
const PRO_CONTRACT = "app/(site)/clasificados/autos/pro/contracts/autosProPrivateContract.ts";

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name === ".next") continue;
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, out);
    else if (/\.(ts|tsx)$/.test(name)) out.push(p);
  }
  return out;
}

check("autos privado: flat product - autos_privado_30d $24.99 one-time, no Quick/Full package for private", () => {
  const p = REVENUE_V1_PACKAGE_MATRIX.find((x) => x.packageKey === "autos_privado_30d");
  assert.ok(p, "autos_privado_30d must exist");
  assert.equal(p!.priceCents, 2499);
  assert.equal(p!.billingMode, "one_time");
  assert.ok(!REVENUE_V1_PACKAGE_MATRIX.some((x) => /autos_privado.*(quick|simple)/i.test(x.packageKey)), "no Quick private package");
});

check("autos privado: registry says uncapped photos, external https video cap = Autos constant", () => {
  const r = LANE_MEDIA_REGISTRY.find((x) => x.pipeline === "autos_privado" && x.lane === "privado");
  assert.ok(r);
  assert.deepEqual(r!.images, { kind: "uncapped", min: 0 });
  assert.equal(r!.maxExternalVideos, AUTOS_MAX_EXTERNAL_VIDEO_URLS);
  assert.equal(r!.videoValidator, "autos-https-strict");
});

check("autos privado: dead free/pro constants are marked NON-AUTHORITATIVE and imported by nothing", () => {
  for (const f of [FREE_CONTRACT, PRO_CONTRACT]) {
    const src = raw(f);
    assert.ok(/NON-AUTHORITATIVE/.test(src), `${f} must be marked NON-AUTHORITATIVE`);
    assert.ok(/imported by nothing/.test(src), `${f} must say it is unimported`);
  }
  const importers = walk("app")
    .filter((p) => !/autos(Free|Pro)PrivateContract\.ts$/.test(p))
    .filter((p) => /autos(Free|Pro)PrivateContract|AUTOS_(FREE|PRO)_PRIVATE_/.test(readFileSync(p, "utf8")));
  assert.deepEqual(importers, [], `nothing may import the dead constants: ${importers.join(", ")}`);
});

check("autos privado: Quick image/video limits are Dealer-only - manager opts out for Privado", () => {
  const mgr = raw(MEDIA_MANAGER);
  assert.match(mgr, /applyBusinessPlanLimits = true/, "manager prop defaults to true (Dealer behavior unchanged)");
  assert.match(
    mgr,
    /const isQuickBusinessPlan = applyBusinessPlanLimits && businessPlanFromSearchParams\(searchParams\) === "quick";/,
  );
  assert.match(raw(PRIVADO_APP), /<AutosNegociosMediaManager[\s\S]*?applyBusinessPlanLimits=\{false\}[\s\S]*?\/>/);
  assert.ok(!/applyBusinessPlanLimits=\{false\}/.test(raw(DEALER_STEPS)), "Dealer steps must keep the Quick signal live");
  assert.ok(!/plan=quick|businessPlanFromSearchParams|isQuickBusinessPlan/.test(raw(PRIVADO_APP)), "Privado application never reads the plan signal itself");
});

check("autos privado: publish route applies the Quick media contract ONLY on the dealer lane", () => {
  const src = raw(AUTOS_LISTINGS_ROUTE);
  const calls = src.match(/enforceQuickBusinessPublishMedia\(/g) ?? [];
  assert.equal(calls.length, 1, "exactly one Quick contract call site");
  const guardAt = src.indexOf('if (body.lane === "negocios" && userId) {');
  const callAt = src.indexOf("enforceQuickBusinessPublishMedia(");
  assert.ok(guardAt > -1 && callAt > guardAt, "the Quick contract call sits inside the negocios-only guard");
  assert.match(src, /privado \(private-seller\) lane is a different product with no Simple\/Full split/);
  // shared seam: local video + heavy (data:/blob:) transport are refused for EVERY lane, including privado
  assert.ok(src.indexOf("detectAutosLocalVideoTransport(rawBody)") > -1 && src.indexOf("detectAutosHeavyTransport(rawBody)") > -1);
});

check("autos privado: canonical publish readiness = same preview completeness rule, no Quick contract", () => {
  const src = raw("app/lib/sales/canonicalPublishReadiness.ts");
  const start = src.indexOf("async function assessAutosPrivado(");
  const end = src.indexOf("async function assessComidaLocal(");
  const body = src.slice(start, end);
  assert.match(body, /getAutosPreviewCompletenessIssues\("privado", listing\)/);
  assert.ok(!/enforceQuickBusinessPublishMedia/.test(body), "privado readiness must not use the Quick media contract");
});

check("autos privado: persistence seam is uncapped for photos and caps/dedupes videos at the Autos constant (executed)", () => {
  const photos = Array.from({ length: 20 }, (_, i) => ({
    id: `p${i}`,
    url: `https://cdn.example.com/autos/${i}.jpg`,
    sourceType: "url" as const,
    isPrimary: i === 0,
    sortOrder: i,
  }));
  const videos = Array.from({ length: 12 }, (_, i) => `https://youtu.be/vid${i}aaaa`);
  const { listing, persistWarnings } = sanitizeAutosListingPayloadForPersistence({
    mediaImages: photos,
    videoUrls: videos,
  } as never);
  assert.equal(listing.mediaImages?.length, 20, "20 saved photos are all kept (no silent trim / no invented cap)");
  assert.equal(listing.videoUrls?.length, AUTOS_MAX_EXTERNAL_VIDEO_URLS);
  assert.ok(!persistWarnings.some((w) => /too_many_images/.test(w)), "no image-count issue from the shared contract");
});

check("autos privado: preview/publish completeness = at least one photo OR external video (executed)", () => {
  const empty = getAutosPreviewCompletenessIssues("privado", {} as never);
  assert.ok(empty.includes("media"), "no media -> media issue");
  const withPhoto = getAutosPreviewCompletenessIssues("privado", {
    mediaImages: [{ id: "a", url: "https://cdn.example.com/a.jpg", sourceType: "url", isPrimary: true, sortOrder: 0 }],
  } as never);
  assert.ok(!withPhoto.includes("media"), "one photo satisfies media");
  const manyPhotos = getAutosPreviewCompletenessIssues("privado", {
    mediaImages: Array.from({ length: 30 }, (_, i) => ({
      id: `m${i}`,
      url: `https://cdn.example.com/${i}.jpg`,
      sourceType: "url",
      isPrimary: i === 0,
      sortOrder: i,
    })),
  } as never);
  assert.ok(!manyPhotos.includes("media"), "30 photos are not refused by the preview rule");
});

/* ---------------------------------------------------------------------------------------------
 * RENTAS - VIDEO
 * ------------------------------------------------------------------------------------------- */

const PRIVADO_FORM = "app/(site)/clasificados/publicar/rentas/privado/application/RentasPrivadoForm.tsx";
const NEGOCIO_FORM = "app/(site)/clasificados/publicar/rentas/negocio/application/RentasNegocioForm.tsx";
const PUBLISH_STATE = "app/(site)/clasificados/lib/leonixPublishRealEstateFromDraftState.ts";

check("rentas video: one cap (4) across forms, persist step, registry (both lanes)", () => {
  assert.equal(RENTAS_MAX_EXTERNAL_VIDEO_URLS, 4);
  assert.match(raw(PRIVADO_FORM), /const MAX_VIDEO_URLS = 4;/);
  assert.match(raw(NEGOCIO_FORM), /const MAX_VIDEO_URLS = 4;/);
  for (const pipeline of ["rentas_privado", "rentas_negocio"] as const) {
    const r = LANE_MEDIA_REGISTRY.find((x) => x.pipeline === pipeline);
    assert.ok(r, pipeline);
    assert.equal(r!.maxExternalVideos, RENTAS_MAX_EXTERNAL_VIDEO_URLS, `${pipeline} registry video cap`);
  }
});

check("rentas video: publish contract no longer says 'videos unsupported' and is fed the persisted links", () => {
  const src = raw(PUBLISH_STATE);
  for (const fn of ["buildRentasPrivadoListingParams", "buildRentasNegocioListingParams"]) {
    const start = src.indexOf(`export function ${fn}(`);
    assert.ok(start > -1, fn);
    const next = src.indexOf("\nexport ", start + 10);
    const body = src.slice(start, next === -1 ? undefined : next);
    assert.ok(!/maxExternalVideos: 0/.test(body), `${fn} must not declare maxExternalVideos: 0`);
    assert.match(body, /externalVideoUrls: rentasVideoUrls\(state\.media\)/);
    assert.match(body, /maxExternalVideos: RENTAS_MAX_EXTERNAL_VIDEO_URLS/);
  }
});

check("rentas video: rentasVideoUrls keeps http(s) only, dedupes, caps at 4; local/blob never persist (executed)", () => {
  const out = rentasVideoUrls({
    videoUrls: ["https://a.example/1", "https://a.example/1", "blob:http://x/1", "data:video/mp4;base64,AAA", "not a url", "https://a.example/2", "http://a.example/3", "https://a.example/4", "https://a.example/5"],
  });
  assert.deepEqual(out, ["https://a.example/1", "https://a.example/2", "http://a.example/3", "https://a.example/4"]);
});

const HTTPS_PHOTO = "https://cdn.example.com/rentas/a.jpg";
const SELLER = {
  fotoDataUrl: "",
  nombre: "Seller",
  telefono: "5555550100",
  whatsapp: "",
  mensajesTexto: "",
  correo: "seller@example.com",
  notaContacto: "",
};
const SIX_VIDEOS = Array.from({ length: 6 }, (_, i) => `https://youtu.be/rentavid${i}`);

check("rentas video: Privado publish build accepts 4 links, persists them as detail pairs, never fails on video (executed)", () => {
  const state = mergePartialRentasPrivadoState({
    ...createEmptyRentasPrivadoFormState(),
    categoriaPropiedad: "residencial",
    titulo: "Casa para rentar",
    rentaMensual: "1800",
    ciudad: "San Jose",
    ubicacionLinea: "1 Main",
    descripcion: "Descripcion de prueba suficientemente larga para el anuncio.",
    media: {
      ...createEmptyRentasPrivadoFormState().media,
      photoDataUrls: [HTTPS_PHOTO],
      primaryImageIndex: 0,
      videoUrl: SIX_VIDEOS[0],
      videoUrls: SIX_VIDEOS,
    },
    seller: SELLER,
    mascotas: "permitidas",
  } as never);
  const built = buildRentasPrivadoListingParams(state, "es");
  assert.equal(built.ok, true, "video links must not block the Rentas Privado publish build");
  if (!built.ok) return;
  const labels = built.params.detailPairs.filter((p) => /^Leonix:rent:video_url/.test(p.label));
  assert.equal(labels.length, 4, "exactly 4 video links persist");
});

check("rentas video: Negocio publish build accepts 4 links and persists them (executed)", () => {
  const state = mergePartialRentasNegocioState({
    ...createEmptyRentasNegocioFormState(),
    categoriaPropiedad: "residencial",
    titulo: "Local para rentar",
    rentaMensual: "2400",
    ciudad: "San Jose",
    ubicacionLinea: "2 Main",
    descripcion: "Descripcion de prueba suficientemente larga para el anuncio.",
    media: {
      ...createEmptyRentasNegocioFormState().media,
      photoDataUrls: [HTTPS_PHOTO],
      primaryImageIndex: 0,
      videoUrl: SIX_VIDEOS[0],
      videoUrls: SIX_VIDEOS,
    },
    negocioNombre: "Realty",
    negocioEmail: "biz@example.com",
  } as never);
  const built = buildRentasNegocioListingParams(state, "es");
  assert.equal(built.ok, true, "video links must not block the Rentas Negocio publish build");
  if (!built.ok) return;
  assert.equal(built.params.detailPairs.filter((p) => /^Leonix:rent:video_url/.test(p.label)).length, 4);
});

/* ---------------------------------------------------------------------------------------------
 * RENTAS - ASSISTED LANE (GREEN: one flat Rentas product -> canonical privado application)
 * ------------------------------------------------------------------------------------------- */

check("rentas assisted: one flat Rentas product (rentas_30d $24.99), no Quick/Full, no separate Negocio lane", () => {
  const p = REVENUE_V1_PACKAGE_MATRIX.find((x) => x.packageKey === "rentas_30d");
  assert.ok(p);
  assert.equal(p!.priceCents, 2499);
  assert.equal(staffLauncherHasQuickFull("rentas"), false);
  assert.ok(!(QUICK_SALES_CATEGORIES as readonly string[]).some((c) => /rentas-negocio|rentas_negocio/.test(c)));
  const item = staffLauncherItem("rentas");
  assert.ok(item);
  assert.equal(item!.products.length, 1, "exactly one Rentas product in the launcher");
  assert.equal(item!.staffHref, "/clasificados/publicar/rentas/privado");
});

check("rentas assisted: launcher reaches the canonical fillable privado application and its save endpoint refuses negocio", () => {
  const d = QUICK_SALES_CATEGORY_MAP.rentas;
  assert.equal(d.intakePath, "/clasificados/publicar/rentas/privado");
  assert.equal(d.saveEndpoint, "/api/clasificados/rentas/listing-edit");
  assert.ok(existsSync("app/(site)/clasificados/publicar/rentas/privado/page.tsx"), "privado application page exists");
  assert.match(raw("app/api/clasificados/rentas/listing-edit/route.ts"), /staff_rentas_privado_only/);
});

if (failures.length) {
  console.error(`\nverify-launch-media-rules-autos-privado-rentas-01: ${failures.length} failure(s)`);
  process.exit(1);
}
console.log("\nverify-launch-media-rules-autos-privado-rentas-01: all checks passed");
