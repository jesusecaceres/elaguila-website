/**
 * LEONIX — complete translation parity source gate.
 *
 * Scope: every canonical Clasificados pipeline/lane, application ES/EN surfaces, private prospect
 * Preview, published-detail Translate Ad wiring, result-route language propagation, and the shared
 * privacy/exclusion contract. No network, DB, Stripe, Supabase, or translation-provider call.
 *
 * Run:
 *   npx tsx scripts/verify-translation-parity-all-classifieds-01.ts
 */
import { strict as assert } from "node:assert";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const read = (rel: string) => readFileSync(path.join(ROOT, rel), "utf8");

let checks = 0;
const failures: string[] = [];
const passed: string[] = [];

function check(name: string, fn: () => void) {
  checks += 1;
  try {
    fn();
    passed.push(name);
  } catch (error) {
    failures.push(`${name}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

const PIPELINES = [
  "restaurantes",
  "servicios",
  "bienes_raices_negocio",
  "bienes_raices_privado",
  "autos_negocios",
  "autos_privado",
  "rentas_negocio",
  "rentas_privado",
  "empleos",
  "en_venta",
  "comida_local",
  "ofertas_locales",
  "busco",
  "clases",
  "comunidad",
  "mascotas_y_perdidos",
  "viajes",
] as const;

const LANE_ROUTES: Record<string, string> = {
  empleos_quick: "/publicar/empleos/quick",
  empleos_premium: "/publicar/empleos/premium",
  empleos_feria: "/publicar/empleos/feria",
  viajes_negocios: "/publicar/viajes/negocios",
  viajes_privado: "/publicar/viajes/privado",
  en_venta_pro: "/clasificados/publicar/en-venta/pro",
  en_venta_free: "/clasificados/publicar/en-venta/free",
  en_venta_storefront: "/clasificados/publicar/en-venta/storefront",
};

const APPLICATION_PROOFS: Record<string, string> = {
  restaurantes: "app/(site)/publicar/restaurantes/RestauranteApplicationClient.tsx",
  servicios: "app/(site)/clasificados/publicar/servicios/components/ClasificadosServiciosApplication.tsx",
  comida_local: "app/(site)/publicar/comida-local/ComidaLocalApplicationClient.tsx",
  autos_negocios: "app/(site)/publicar/autos/negocios/components/AutosNegociosApplication.tsx",
  autos_privado: "app/(site)/publicar/autos/privado/components/AutosPrivadoApplication.tsx",
  bienes_raices_negocio:
    "app/(site)/clasificados/publicar/bienes-raices/negocio/agente-individual/application/AgenteIndividualResidencialApplication.tsx",
  bienes_raices_privado: "app/(site)/clasificados/publicar/bienes-raices/privado/application/BienesRaicesPrivadoForm.tsx",
  rentas_negocio: "app/(site)/clasificados/publicar/rentas/negocio/application/RentasNegocioForm.tsx",
  rentas_privado: "app/(site)/publicar/rentas/privado/page.tsx",
  empleos_quick: "app/(site)/publicar/empleos/quick/EmpleoQuickApplicationClient.tsx",
  empleos_premium: "app/(site)/publicar/empleos/premium/EmpleoPremiumApplicationClient.tsx",
  empleos_feria: "app/(site)/publicar/empleos/feria/EmpleoFeriaApplicationClient.tsx",
  en_venta_pro: "app/(site)/clasificados/publicar/en-venta/pro/application/LeonixEnVentaProApplication.tsx",
  en_venta_storefront:
    "app/(site)/clasificados/publicar/en-venta/storefront/application/LeonixEnVentaStorefrontApplication.tsx",
  busco: "app/(site)/publicar/busco/quick/BuscoQuickFormClient.tsx",
  clases: "app/(site)/publicar/clases/quick/ClasesQuickApplication.tsx",
  comunidad: "app/(site)/publicar/comunidad/quick/ComunidadQuickApplication.tsx",
  mascotas_y_perdidos: "app/(site)/publicar/mascotas-y-perdidos/quick/MascotasPerdidosQuickFormClient.tsx",
  viajes_negocios: "app/(site)/publicar/viajes/negocios/components/ViajesNegociosApplicationShell.tsx",
  viajes_privado: "app/(site)/publicar/viajes/privado/components/ViajesPrivadoApplicationShell.tsx",
  ofertas_locales: "app/(site)/publicar/ofertas-locales/OfertasLocalesApplicationClient.tsx",
};

const RESULT_SURFACES: Record<string, string> = {
  restaurantes: "app/(site)/clasificados/restaurantes/resultados/RestaurantesResultsShell.tsx",
  servicios: "app/(site)/clasificados/servicios/resultados/page.tsx",
  bienes_raices: "app/(site)/clasificados/bienes-raices/resultados/BienesRaicesResultsClient.tsx",
  autos: "app/(site)/clasificados/autos/components/public/AutosPublicResultsShell.tsx",
  rentas: "app/(site)/clasificados/rentas/results/RentasResultsClient.tsx",
  empleos: "app/(site)/clasificados/empleos/components/EmpleosResultsView.tsx",
  en_venta: "app/(site)/clasificados/en-venta/results/EnVentaResultsClient.tsx",
  ofertas_locales: "app/(site)/clasificados/ofertas-locales/OfertasLocalesPublicSearchClient.tsx",
  busco: "app/(site)/clasificados/busco/BuscoResultsClient.tsx",
  clases_comunidad: "app/(site)/clasificados/community/CommunityListingsResultsClient.tsx",
  mascotas_y_perdidos: "app/(site)/clasificados/mascotas-y-perdidos/MascotasPerdidosResultsClient.tsx",
  viajes: "app/(site)/clasificados/viajes/components/ViajesResultsShell.tsx",
};

function main() {
  const registry = read("app/lib/listingIdentity/categoryRouteRegistry.ts");

  check("matrix: exactly the 17 canonical pipeline declarations are present", () => {
    const found = [...registry.matchAll(/pipeline:\s*"([^"]+)"/g)]
      .map((m) => m[1])
      .filter((value, index, all) => all.indexOf(value) === index)
      .filter((value) => (PIPELINES as readonly string[]).includes(value))
      .sort();
    assert.deepEqual(found, [...PIPELINES].sort());
  });

  for (const pipeline of PIPELINES) {
    check(`matrix[${pipeline}]: canonical pipeline is registered`, () => {
      assert.ok(registry.includes(`pipeline: "${pipeline}"`));
    });
  }

  for (const [lane, route] of Object.entries(LANE_ROUTES)) {
    check(`lane[${lane}]: repository route is locked`, () => {
      assert.ok(registry.includes(`laneKey: "${lane}"`), `missing lane ${lane}`);
      assert.ok(registry.includes(`applicationRoute: "${route}"`), `missing route ${route}`);
    });
  }

  check("shared translator: exactly one TranslateAdControl implementation", () => {
    const hits = execFileSync(
      "grep",
      ["-rl", "export function TranslateAdControl", "app", "--include=*.tsx", "--include=*.ts"],
      { encoding: "utf8" },
    )
      .trim()
      .split("\n")
      .filter(Boolean);
    assert.deepEqual(hits, ["app/components/translation/TranslateAdControl.tsx"]);
  });

  check("shared translator: exactly one translate-ad API route", () => {
    const routes = execFileSync("find", ["app/api", "-path", "*translate*", "-name", "route.ts", "-print"], {
      encoding: "utf8",
    })
      .trim()
      .split("\n")
      .filter(Boolean);
    assert.deepEqual(routes, ["app/api/translate-ad/route.ts"]);
  });

  check("shared translator: request wrapper posts only to /api/translate-ad", () => {
    const src = read("app/lib/translation/requestAdTranslation.ts");
    assert.ok(src.includes('fetch("/api/translate-ad"'));
    assert.equal(/fetch\(["']\/api\/(?!translate-ad)/.test(src), false);
  });

  check("privacy: API only admits narrative field keys and rejects raw contact strings", () => {
    const src = read("app/api/translate-ad/route.ts");
    const allowed = src.slice(src.indexOf("ALLOWED_FIELD_KEYS"), src.indexOf("MAX_TOTAL_CHARS"));
    for (const key of [
      "title",
      "description",
      "serviceLabel",
      "customServiceText",
      "details",
      "highlights",
      "body",
      "shareText",
      "locationNote",
      "financeTeaser",
    ]) {
      assert.ok(allowed.includes(`"${key}"`), `missing allowed narrative key ${key}`);
    }
    for (const forbidden of ["phone", "email", "vin", "address", "zip", "price", "license", "accountId"]) {
      assert.ok(!allowed.includes(`"${forbidden}"`), `forbidden API field admitted: ${forbidden}`);
    }
    assert.ok(src.includes("containsUnmaskedSensitiveContent"));
    assert.ok(src.includes("UNMASKED_EMAIL_RE"));
    assert.ok(src.includes("UNMASKED_PHONE_RE"));
    assert.ok(src.includes("UNMASKED_URL_RE"));
  });

  check("privacy: generic Anuncio detail pairs exclude contact/price/address/VIN/map machine fields", () => {
    const src = read("app/lib/translation/anuncioTranslateAd.ts");
    for (const token of ["phone", "email", "whatsapp", "precio", "price", "address", "vin", "mapa"]) {
      assert.ok(src.toLowerCase().includes(token), `generic exclusion contract must name ${token}`);
    }
    assert.ok(src.includes("EXCLUDED_DETAIL_LABEL_RE"));
  });

  check("privacy: Ofertas translation remains offer-prose-only; OCR/product item fields stay out", () => {
    const src = read("app/lib/ofertas-locales/ofertasLocalesTranslateAd.ts").replace(/\/\*[\s\S]*?\*\//g, "");
    assert.ok(src.includes("offer.description"));
    assert.ok(src.includes("offer.membershipNote"));
    for (const forbidden of ["itemName", "normalizedItemName", "priceText", "priceAmount", "sourceBbox"]) {
      assert.ok(!src.includes(forbidden), `Ofertas OCR/product field leaked: ${forbidden}`);
    }
  });

  for (const [name, file] of Object.entries(APPLICATION_PROOFS)) {
    check(`application[${name}]: rendered source exists and participates in locale/copy wiring`, () => {
      assert.ok(existsSync(file), file);
      const src = read(file);
      assert.ok(
        /\blang\b|copyLang|Locale|Copy|copy\b/.test(src),
        `${file} has no locale/copy wiring evidence`,
      );
    });
  }

  check("application[en_venta_pro]: Suspense loading state is ES/EN parity-safe", () => {
    const src = read("app/(site)/clasificados/publicar/en-venta/pro/page.tsx");
    assert.ok(src.includes('copyLang === "en" ? "Loading…" : "Cargando…"'));
    assert.ok(!/>\s*Cargando…\s*</.test(src), "must not hardcode Spanish-only loading chrome");
  });

  check("application[en_venta_free]: parked/included lane redirects to Pro while preserving lang", () => {
    const src = read("app/(site)/clasificados/publicar/en-venta/free/page.tsx");
    assert.ok(src.includes("withClasificadosPublishLang"));
    assert.ok(src.includes("routeLang"));
    assert.ok(src.includes("redirect("));
  });

  for (const [name, file] of Object.entries(RESULT_SURFACES)) {
    check(`results[${name}]: rendered result client has language propagation`, () => {
      assert.ok(existsSync(file), file);
      const src = read(file);
      assert.ok(/lang|language|Locale|locale/.test(src), `${file} lacks language propagation evidence`);
    });
  }

  check("results[comida-local]: discovery surface has application-language wiring", () => {
    const file = "app/(site)/clasificados/comida-local/page.tsx";
    assert.ok(existsSync(file));
    assert.ok(/lang|language|Locale|locale/.test(read(file)));
  });

  const sharedAnuncio = read("app/(site)/clasificados/anuncio/[id]/page.tsx");
  check("published[generic]: shared Anuncio shell mounts the one control and request wrapper", () => {
    assert.ok(sharedAnuncio.includes("useAnuncioListingTranslation"));
    assert.ok(sharedAnuncio.includes("<TranslateAdControl"));
    assert.ok(sharedAnuncio.includes("requestTranslation={requestAdTranslation}"));
  });

  for (const token of [
    'listing.category === "bienes-raices"',
    "useEnVentaPublishedDetail",
    'listing.category === "busco"',
    'listing.category === "mascotas-y-perdidos"',
    'listing.category === "clases" || listing.category === "comunidad"',
  ]) {
    check(`published[generic branch]: ${token} is rendered inside the translated generic detail shell`, () => {
      assert.ok(sharedAnuncio.includes(token), token);
      assert.ok(sharedAnuncio.includes("translateControl"), "generic shell missing Translate Ad control");
      assert.ok(sharedAnuncio.includes("proseListing"), "generic shell missing translated listing overlay");
    });
  }

  const dedicatedPublished: Record<string, [string, string[]]> = {
    restaurantes: [
      "app/(site)/clasificados/restaurantes/shell/RestauranteAdStoryPreview.tsx",
      ["TranslateAdControl", "requestAdTranslation"],
    ],
    servicios: [
      "app/(site)/servicios/components/ServiciosPublicTranslationLayer.tsx",
      ["TranslateAdControl", "requestServiciosAdTranslation"],
    ],
    autos: [
      "app/(site)/clasificados/autos/vehiculo/[id]/AutosListingTranslationLayer.tsx",
      ["TranslateAdControl", "requestAdTranslation"],
    ],
    rentas: [
      "app/(site)/clasificados/rentas/listing/[id]/RentasListingDetailClient.tsx",
      ["TranslateAdControl", "requestAdTranslation"],
    ],
    empleos: [
      "app/(site)/clasificados/empleos/components/EmpleosJobTranslationLayer.tsx",
      ["TranslateAdControl", "requestAdTranslation"],
    ],
    comida_local: [
      "app/(site)/clasificados/comida-local/lib/useComidaLocalPublicTranslation.tsx",
      ["TranslateAdControl", "requestComidaLocalAdTranslation"],
    ],
    ofertas_locales: [
      "app/(site)/clasificados/ofertas-locales/lib/useOfertasLocalesPublicTranslation.tsx",
      ["TranslateAdControl", "requestOfertasLocalesAdTranslation"],
    ],
    viajes: [
      "app/(site)/clasificados/viajes/components/ViajesOfferTranslationLayer.tsx",
      ["TranslateAdControl", "requestAdTranslation"],
    ],
  };

  for (const [name, [file, needles]] of Object.entries(dedicatedPublished)) {
    check(`published[${name}]: shared Translate Ad system is mounted`, () => {
      const src = read(file);
      for (const needle of needles) assert.ok(src.includes(needle), `${file}: missing ${needle}`);
      assert.equal(src.includes('fetch("/api/translate'), false, `${file}: second translator API forbidden`);
    });
  }

  check("published[bienes negocio]: category-specific builder/hook exists and generic shell renders its lane", () => {
    const hook = read("app/(site)/clasificados/bienes-raices/lib/useBienesNegocioShellTranslation.ts");
    assert.ok(hook.includes("buildBienesNegocioTranslatableContent"));
    assert.ok(sharedAnuncio.includes("<BienesRaicesNegocioLiveDetailShell"));
    assert.ok(sharedAnuncio.includes("<BienesRaicesPrivadoLiveDetailShell"));
  });

  check("private Preview: lang query controls refusal, chrome, translator target, and shell", () => {
    const src = read("app/(site)/vista-previa/[category]/page.tsx");
    assert.ok(src.includes("const lang = previewLang(query.lang)"));
    assert.ok(src.includes("<SafeRefusal lang={lang} />"));
    assert.ok(src.includes("siteLocale={lang}"));
    assert.ok(src.includes("lang={lang}"));
    assert.ok(src.includes('lang === "en" ? descriptor.labelEn : descriptor.labelEs'));
    assert.ok(!src.includes("{descriptor.labelEs} / {descriptor.labelEn}"));
    assert.ok(!src.includes("No publicado / Not published"));
  });

  check("private Preview: same shared control/API, no auto-translation on render", () => {
    const src = read("app/(site)/vista-previa/[category]/ProspectPreviewTranslateAd.tsx");
    assert.ok(src.includes("TranslateAdControl"));
    assert.ok(src.includes("requestAdTranslation"));
    assert.ok(src.includes("data-prospect-preview-translate-ad"));
    assert.equal(src.includes("useEffect"), false);
    assert.equal(src.includes('fetch("/api/translate-ad"'), false);
  });

  check("private Preview: business/display names never enter title translation", () => {
    const src = read("app/(site)/vista-previa/[category]/ProspectPreviewTranslateAd.tsx");
    assert.ok(src.includes("authoredTitle !== businessName"));
  });

  check("application[bienes privado]: English locale is not forced back to Spanish", () => {
    const src = read("app/(site)/clasificados/publicar/bienes-raices/privado/application/BienesRaicesPrivadoForm.tsx");
    assert.equal(src.includes('lang="es"'), false);
    assert.ok(src.includes('brPrivateUi(lang, "Categoría", "Category")'));
    assert.ok(src.includes('TIPO_PROPIEDAD_LABEL_EN'));
    assert.ok(src.includes('COMERCIAL_TIPO_LABEL_EN'));
    assert.ok(src.includes('TERRENO_TIPO_LABEL_EN'));
  });

  check("application[rentas negocio]: shared contact section and residual form copy honor lang", () => {
    const src = read("app/(site)/clasificados/publicar/rentas/negocio/application/RentasNegocioForm.tsx");
    assert.equal(src.includes('lang="es"'), false);
    assert.ok(src.includes('lang={lang}'));
    assert.ok(src.includes('rentasUiLabel(lang, "Videos por enlace (opcional)", "Videos by link (optional)")'));
  });

  check("application[rentas privado]: video action labels honor lang", () => {
    const src = read("app/(site)/clasificados/publicar/rentas/privado/application/RentasPrivadoForm.tsx");
    assert.ok(src.includes("addLabel={RENTAS_PRIVADO_UI[lang].addVideo}"));
    assert.ok(src.includes("removeLabel={RENTAS_PRIVADO_UI[lang].removeVideo}"));
    assert.ok(src.includes("const RENTAS_PRIVADO_UI: Record<OfficialLocale"));
  });

  check("results: loading fallbacks do not expose the wrong application language", () => {
    const jobs = read("app/(site)/clasificados/empleos/resultados/page.tsx");
    const enVenta = read("app/(site)/clasificados/en-venta/results/page.tsx");
    assert.equal(jobs.includes('aria-label="Cargando empleos"'), false);
    assert.equal(enVenta.includes("Loading…"), false);
    assert.ok(jobs.includes('aria-busy="true"'));
    assert.ok(enVenta.includes('aria-busy="true"'));
  });

  check("staff eight-category source gate remains present as the proven Negocios/assisted reference", () => {
    const src = read("scripts/verify-staff-eight-category-translation-01.ts");
    for (const family of [
      "rentas",
      "empleos",
      "autos-privado",
      "servicios",
      "restaurantes",
      "comida-local",
      "autos",
      "bienes-raices",
    ]) {
      assert.ok(src.includes(family), family);
    }
  });

  console.log(`\n${passed.length}/${checks} passed`);
  for (const name of passed) console.log(`  OK   ${name}`);
  if (failures.length) {
    console.error(`\n${failures.length} FAILED`);
    for (const failure of failures) console.error(`  FAIL ${failure}`);
    process.exit(1);
  }
  console.log("\nverify-translation-parity-all-classifieds-01: ALL CHECKS EXECUTED AND PASSED");
}

main();
