import { strict as assert } from "node:assert";
import { existsSync, readFileSync } from "node:fs";

const read = (p: string) => readFileSync(p, "utf8");
let checks = 0;
function check(name: string, fn: () => void) {
  checks += 1;
  fn();
  console.log(`OK: ${name}`);
}

const negocioPath = "app/(site)/publicar/viajes/negocios/components/ViajesNegociosApplicationShell.tsx";
const privadoPath = "app/(site)/publicar/viajes/privado/components/ViajesPrivadoApplicationShell.tsx";
const translationPath = "app/(site)/clasificados/viajes/components/ViajesOfferTranslationLayer.tsx";
const registryPath = "app/lib/listingIdentity/categoryRouteRegistry.ts";

for (const p of [negocioPath, privadoPath, translationPath, registryPath]) {
  assert.ok(existsSync(p), `missing ${p}`);
}

const negocio = read(negocioPath);
const privado = read(privadoPath);
const translation = read(translationPath);
const registry = read(registryPath);

check("Viajes Negocio uses canonical ES/EN publish-language resolver", () => {
  assert.ok(negocio.includes("resolveClasificadosPublishLang"));
  assert.ok(negocio.includes("copyLang: lang"));
  assert.ok(negocio.includes("getPublicarViajesNegociosCopy(lang)"));
});

check("Viajes Privado uses canonical ES/EN publish-language resolver", () => {
  assert.ok(privado.includes("resolveClasificadosPublishLang"));
  assert.ok(privado.includes("copyLang: lang"));
  assert.ok(privado.includes("getPublicarViajesPrivadoCopy(lang)"));
});

check("both lanes preserve same staged record on owner edit", () => {
  for (const src of [negocio, privado]) {
    assert.ok(src.includes("stagedIdFromUrl"));
    assert.ok(src.includes("/api/clasificados/viajes/staged-owner"));
    assert.ok(src.includes("stagedListingId: stagedIdFromUrl"));
  }
});

check("both lanes submit through one canonical Viajes endpoint with explicit lane", () => {
  assert.ok(negocio.includes('fetch("/api/clasificados/viajes/submit"'));
  assert.ok(negocio.includes('lane: "business"'));
  assert.ok(privado.includes('fetch("/api/clasificados/viajes/submit"'));
  assert.ok(privado.includes('lane: "private"'));
});

check("both lanes expose their canonical Preview route", () => {
  assert.ok(negocio.includes('"/clasificados/viajes/preview/negocios"'));
  assert.ok(privado.includes('"/clasificados/viajes/preview/privado"'));
});

check("both lanes keep media in the existing durable/local media path", () => {
  assert.ok(negocio.includes("viajesDraftMediaPut"));
  assert.ok(negocio.includes("VIAJES_NEGOCIOS_GALLERY_MAX"));
  assert.ok(privado.includes("viajesDraftMediaPut"));
  assert.ok(privado.includes("VIAJES_PRIVADO_GALLERY_MAX"));
});

check("published Viajes uses the one shared Translate Ad control/API", () => {
  assert.ok(translation.includes("TranslateAdControl"));
  assert.ok(translation.includes("requestAdTranslation"));
  assert.ok(translation.includes('category="viajes"'));
  assert.equal(translation.includes('fetch("/api/translate'), false);
});

check("category registry keeps both Viajes application lanes", () => {
  assert.ok(registry.includes('laneKey: "viajes_negocios"'));
  assert.ok(registry.includes('applicationRoute: "/publicar/viajes/negocios"'));
  assert.ok(registry.includes('laneKey: "viajes_privado"'));
  assert.ok(registry.includes('applicationRoute: "/publicar/viajes/privado"'));
});

console.log(`verify-viajes-application-source-01: ${checks}/${checks} PASS`);
