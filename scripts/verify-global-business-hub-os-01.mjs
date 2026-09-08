// Global Business Hub OS — verifier for the REVISED surgical architecture: shared contract +
// shared safe primitives + surgical adoption + truth fixes. Does NOT assert wholesale renderer
// adoption (FullBusinessHubCard/ListingContactCard) for Servicios/Restaurantes/Autos Dealer/BR
// Negocio — none of those were replaced; see docs/global-business-hub/ADOPTION_PLAYBOOK.md.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

function read(rel) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}
function exists(rel) {
  return fs.existsSync(path.join(root, rel));
}

const checks = [];
function assert(name, condition, detail) {
  checks.push({ name, ok: Boolean(condition), detail });
}

// ---------------------------------------------------------------------------------------
// Shared contract — additive fields present
// ---------------------------------------------------------------------------------------
{
  const types = read("app/components/contact/connectionHub/sharedConnectionHubContactTypes.ts");
  assert("contract: bookingHref present", /bookingHref\?:/.test(types), "Expected SharedConnectionHubContactActions.bookingHref.");
  assert("contract: isApproximate present", /isApproximate\?:\s*boolean/.test(types), "Expected SharedConnectionHubLocation.isApproximate.");
  assert("contract: hours type present", /SharedConnectionHubHours/.test(types), "Expected SharedConnectionHubHours type.");
  assert("contract: trustCues type present", /SharedConnectionHubTrustCue/.test(types), "Expected SharedConnectionHubTrustCue type.");
  assert("contract: mode field present and required", /mode:\s*SharedConnectionHubMode;/.test(types), "Expected required `mode` field.");
  assert(
    "contract: rating/reviewCount documented as reserved, never invented",
    /never owner-typed, never invented/.test(types),
    "Expected the doc comment guarding rating/reviewCount.",
  );
}

// ---------------------------------------------------------------------------------------
// Shared safe primitives
// ---------------------------------------------------------------------------------------
{
  const model = read("app/components/contact/connectionHub/sharedConnectionHubContactModel.ts");
  assert(
    "isSafeExternalHref rejects non-http(s)",
    /protocol === "https:" \|\| u\.protocol === "http:"/.test(model),
    "Expected the http(s)-only guard.",
  );
}
assert(
  "SharedConnectionHubReviewButton exists",
  exists("app/components/contact/connectionHub/renderers/SharedConnectionHubReviewButton.tsx"),
  "Missing shared review button.",
);
{
  const btn = read("app/components/contact/connectionHub/renderers/SharedConnectionHubReviewButton.tsx");
  // Strip comments/JSDoc before checking — the file legitimately documents why rating/reviewCount
  // are never read, which would otherwise false-positive a naive substring search.
  const btnCode = btn.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
  assert(
    "review button never reads link.rating/link.reviewCount",
    !/link\.rating|link\.reviewCount/.test(btnCode),
    "Expected zero rating/reviewCount references in the Level-A review button's actual code.",
  );
  assert(
    "review button has no literal 'undefined'/'null' in template strings",
    !/\$\{[^}]*\}(undefined|null)/.test(btn),
    "Expected no stray undefined/null leaking into rendered text.",
  );
}
assert(
  "sharedConnectionHubLocationHelpers.ts exists",
  exists("app/(site)/clasificados/shared/constants/sharedConnectionHubLocationHelpers.ts"),
  "Missing shared location helper module.",
);
{
  const loc = read("app/(site)/clasificados/shared/constants/sharedConnectionHubLocationHelpers.ts");
  assert(
    "shared map embed uses the no-API-key formula",
    /google\.com\/maps\?q=.*output=embed/.test(loc),
    "Expected the google.com/maps?q=...&output=embed pattern.",
  );
}
{
  const cta = read("app/components/cta/ctaLaunchers.ts");
  assert(
    "copyToClipboard helper exists in ctaLaunchers.ts",
    /export async function copyToClipboard/.test(cta),
    "Expected the new shared clipboard helper.",
  );
}

// ---------------------------------------------------------------------------------------
// Servicios — surgical adoption (Class B)
// ---------------------------------------------------------------------------------------
{
  const card = read("app/(site)/servicios/components/ServiciosBusinessHubContactCard.tsx");
  assert(
    "Servicios: fake hero rating badge removed",
    !/rating\.toFixed\(1\)/.test(card),
    "Expected the owner-typed rating/reviewCount badge to be gone.",
  );
  assert(
    "Servicios: review button swapped to the shared component",
    /SharedConnectionHubReviewButton/.test(card),
    "Expected adoption of the new shared review button.",
  );
  assert(
    "Servicios: clipboard uses the shared helper",
    /copyToClipboard\(value\)/.test(card),
    "Expected CopyChip to call the shared clipboard helper.",
  );
}
{
  const mapEmbed = read("app/(site)/servicios/lib/serviciosBusinessHubMapEmbed.ts");
  assert(
    "Servicios: map embed builder re-exports the shared helper",
    /export \{ buildSharedConnectionHubMapEmbedSrc as buildServiciosGoogleMapsEmbedSrc \}/.test(mapEmbed),
    "Expected a thin re-export.",
  );
}

// ---------------------------------------------------------------------------------------
// Restaurantes — surgical adoption (Class B)
// ---------------------------------------------------------------------------------------
for (const [file, needle] of [
  ["app/(site)/clasificados/restaurantes/shell/RestauranteProfileHeader.tsx", "trustRating.average.toFixed"],
  ["app/(site)/clasificados/restaurantes/shell/RestaurantePreviewCard.tsx", "StarRow rating="],
  ["app/(site)/clasificados/restaurantes/shell/RestauranteAdStoryPreview.tsx", "data.trustRating!.average"],
  ["app/(site)/clasificados/restaurantes/resultados/RestauranteResultsClient.tsx", "externalRatingValue.toFixed"],
]) {
  assert(`Restaurantes: fake rating removed from ${file}`, !read(file).includes(needle), `Expected "${needle}" to be gone.`);
}
{
  const hub = read("app/(site)/clasificados/restaurantes/application/buildRestaurantContactHub.ts");
  assert(
    "Restaurantes: showExactAddress threaded into the location payload",
    /showExactAddress:\s*showStreet/.test(hub),
    "Expected the location object to expose showExactAddress.",
  );
}
{
  const contactHub = read("app/(site)/clasificados/restaurantes/shell/RestaurantContactHub.tsx");
  assert(
    "Restaurantes: real map embed gated on showExactAddress",
    /hub\.location!\.showExactAddress/.test(contactHub),
    "Expected the real-map-vs-faux-map branch to check showExactAddress.",
  );
  assert(
    "Restaurantes: clipboard uses the shared helper",
    /copyToClipboard\(value\)/.test(contactHub),
    "Expected CopyChip to call the shared clipboard helper.",
  );
}

// ---------------------------------------------------------------------------------------
// Autos Privado — structural leak fix (Class B, surgical fix not full Mode B renderer)
// ---------------------------------------------------------------------------------------
{
  const strip = read("app/(site)/clasificados/autos/privado/components/PrivadoContactStrip.tsx");
  assert(
    "Autos Privado: never reads dealerSocials",
    !/data\.dealerSocials/.test(strip),
    "Expected zero references to data.dealerSocials.",
  );
  assert(
    "Autos Privado: never reads dealerWebsite",
    !/data\.dealerWebsite/.test(strip),
    "Expected zero references to data.dealerWebsite.",
  );
  assert(
    "Autos Privado: never reads dealer/business address fields",
    !/data\.dealerAddress/.test(strip),
    "Expected zero references to data.dealerAddress*.",
  );
  assert(
    "Autos Privado: location stays vehicle city/state/zip only",
    /formatCityStateZipLine\(data\.city, data\.state, data\.zip\)/.test(strip),
    "Expected the coarse vehicle-location line to remain.",
  );
}

// ---------------------------------------------------------------------------------------
// Media contract — pilot-lane video cap 4 -> 8 (Autos, Restaurantes, Servicios, BR Negocio only)
// ---------------------------------------------------------------------------------------
const PILOT_VIDEO_CONSTANTS = [
  ["app/lib/clasificados/autos/autosExternalVideoUrlValidation.ts", "AUTOS_MAX_EXTERNAL_VIDEO_URLS = 8"],
  ["app/lib/clasificados/restaurantes/restauranteVideoUrls.ts", "RESTAURANTE_MAX_EXTERNAL_VIDEO_URLS = 8"],
  ["app/(site)/clasificados/publicar/servicios/lib/clasificadosServiciosApplicationTypes.ts", "SERVICIOS_MAX_VIDEO_URLS = 8"],
  ["app/(site)/servicios/lib/serviciosGalleryVideoCaps.ts", "MAX_SERVICIOS_PUBLIC_GALLERY_VIDEOS = 8"],
  [
    "app/(site)/clasificados/publicar/bienes-raices/negocio/agente-individual/schema/agenteIndividualResidencialFormState.ts",
    "AGENTE_RES_MAX_VIDEO_URLS = 8",
  ],
];
for (const [file, needle] of PILOT_VIDEO_CONSTANTS) {
  assert(`video cap: ${file} is 8`, read(file).includes(needle), `Expected "${needle}".`);
}
assert(
  "video cap: BR Negocio LIVE display cap raised (not the dead monolith literal)",
  /\.slice\(0, 8\)/.test(read("app/(site)/clasificados/bienes-raices/listing/BienesRaicesNegocioLiveDetailShell.tsx")),
  "Expected the real live-display video slice to be 8.",
);
{
  const registry = read("app/lib/media/listingMediaConfigs.ts");
  const eightCount = (registry.match(/maxExternalVideos: 8,/g) || []).length;
  assert(
    "video cap: exactly 7 pilot lane entries raised to 8 (parent+child counted separately for autos_negocios/bienes_raices_negocio)",
    eightCount === 7,
    `Expected 7 lanes at maxExternalVideos: 8, found ${eightCount}.`,
  );
}
assert(
  "video cap: En Venta NOT touched (deferred category)",
  /maxExternalVideos: 4,/.test(read("app/lib/media/listingMediaConfigs.ts")),
  "Expected at least one deferred-category lane (En Venta/Empleos) to remain at 4.",
);

// ---------------------------------------------------------------------------------------
// Deferred adoption playbook
// ---------------------------------------------------------------------------------------
assert(
  "adoption playbook doc exists",
  exists("docs/global-business-hub/ADOPTION_PLAYBOOK.md"),
  "Expected the classification doc.",
);
{
  const playbook = read("docs/global-business-hub/ADOPTION_PLAYBOOK.md");
  for (const cls of ["Class A", "Class B", "Class C"].map((s) => s.replace("Class ", ""))) {
    assert(`playbook mentions classification ${cls}`, playbook.includes(` ${cls} `) || playbook.includes(`| ${cls} `), `Expected class ${cls} referenced.`);
  }
}

// ---------------------------------------------------------------------------------------
// No wholesale renderer adoption was fabricated (guard against a future false claim)
// ---------------------------------------------------------------------------------------
assert(
  "FullBusinessHubCard/ListingContactCard were NOT built this pass (by design)",
  !exists("app/components/contact/connectionHub/renderers/FullBusinessHubCard.tsx") &&
    !exists("app/components/contact/connectionHub/renderers/ListingContactCard.tsx"),
  "This pass is surgical-only; a future pass may build these against a real Class A candidate.",
);

// ---------------------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------------------
const failed = checks.filter((c) => !c.ok);
for (const c of checks) {
  console.log(c.ok ? `✓ ${c.name}` : `✗ ${c.name}: ${c.detail}`);
}
console.log(`\n${checks.length - failed.length}/${checks.length} checks passed.`);
if (failed.length > 0) process.exit(1);
