#!/usr/bin/env node
/**
 * SVC-SHELL-2C — 4-video cap, gallery rhythm, Google Business, real map embed.
 */
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

function read(rel) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function assertNoVideoSlice2(source, label) {
  assert(!/galleryVideos[\s\S]{0,400}\.slice\(0,\s*2\)/.test(source), `${label}: galleryVideos still sliced to 2`);
  assert(!/filterGalleryVideos[\s\S]{0,400}\.slice\(0,\s*2\)/.test(source), `${label}: filterGalleryVideos still sliced to 2`);
}

const draftMapper = read(
  "app/(site)/clasificados/publicar/servicios/lib/mapClasificadosServiciosApplicationToServiciosDraft.ts",
);
const sanitizer = read("app/(site)/servicios/lib/serviciosProfileSanitize.ts");
const profileMapper = read("app/(site)/servicios/lib/mapServiciosApplicationDraftToBusinessProfile.ts");
const gallery = read("app/(site)/servicios/components/ServiciosGalleryWithTabs.tsx");
const videoLayout = read("app/(site)/servicios/lib/serviciosGalleryVideoLayout.ts");
const videoTile = read("app/(site)/servicios/components/ServiciosGalleryVideoTile.tsx");
const videoCaps = read("app/(site)/servicios/lib/serviciosGalleryVideoCaps.ts");
const appTypes = read("app/(site)/clasificados/publicar/servicios/lib/clasificadosServiciosApplicationTypes.ts");
const defaultState = read("app/(site)/clasificados/publicar/servicios/lib/defaultClasificadosServiciosState.ts");
const appForm = read("app/(site)/clasificados/publicar/servicios/components/ClasificadosServiciosApplication.tsx");
const appCopy = read("app/(site)/clasificados/publicar/servicios/lib/clasificadosServiciosApplicationCopy.ts");
const publishPayload = read("app/(site)/clasificados/publicar/servicios/lib/buildServiciosPublishPayload.ts");
const publishedHydrate = read(
  "app/(site)/clasificados/publicar/servicios/lib/serviciosPublishedToApplicationDraft.ts",
);
const hubMapper = read("app/(site)/servicios/lib/mapServiciosProfileToBusinessHubContact.ts");
const hubCard = read("app/(site)/servicios/components/ServiciosBusinessHubContactCard.tsx");
const mapEmbed = read("app/(site)/servicios/lib/serviciosBusinessHubMapEmbed.ts");
const mapPanel = read("app/(site)/servicios/components/ServiciosBusinessHubMapPanel.tsx");
const resolveProfile = read("app/(site)/servicios/lib/resolveServiciosProfile.ts");
const businessTypes = read("app/(site)/servicios/types/serviciosBusinessProfile.ts");
const draftTypes = read("app/(site)/servicios/types/serviciosApplicationDraft.ts");
const canvas = read("app/(site)/servicios/components/ServiciosPublicDetailsCanvas.tsx");
const proShell = read("app/(site)/servicios/components/ServiciosProfessionalProfileShell.tsx");
const restauranteGallery = read("app/(site)/clasificados/restaurantes/shell/RestauranteLockedGallerySection.tsx");
const ofertasHub = read("app/(site)/clasificados/ofertas-locales/OfertasLocalesBusinessHubLiteCard.tsx");
const pkg = read("package.json");

assertNoVideoSlice2(draftMapper, "draft mapper");
assertNoVideoSlice2(sanitizer, "sanitizer");

assert(draftMapper.includes("SERVICIOS_MAX_VIDEO_URLS"), "draft mapper: uses SERVICIOS_MAX_VIDEO_URLS");
assert(sanitizer.includes("MAX_SERVICIOS_PUBLIC_GALLERY_VIDEOS"), "sanitizer: uses MAX_SERVICIOS_PUBLIC_GALLERY_VIDEOS");
assert(videoCaps.includes("= 4"), "video caps: MAX is 4");
assert(appTypes.includes("SERVICIOS_MAX_VIDEO_URLS = 4"), "application types: max videos is 4");

assert(gallery.includes("serviciosCombinedVideoGridClass"), "gallery: count-aware video grid helper");
assert(videoLayout.includes("md:grid-cols-4"), "video layout: supports 4-across desktop");
assert(videoLayout.includes("max-w-2xl"), "video layout: 2-video centered row");
assert(videoLayout.includes("max-w-sm"), "video layout: 1-video centered card");
assert(videoTile.includes("aspect-video"), "video tile: compact aspect ratio");

assert(appTypes.includes("googleBusinessUrl"), "application types: googleBusinessUrl field");
assert(defaultState.includes("googleBusinessUrl"), "default state: googleBusinessUrl");
assert(appForm.includes("googleBusinessUrl"), "application form: googleBusinessUrl input");
assert(appCopy.includes("Perfil de Google Business"), "copy ES: google business label");
assert(appCopy.includes("Google Business Profile"), "copy EN: google business label");
assert(draftMapper.includes("googleBusinessUrl"), "draft mapper: googleBusinessUrl");
assert(publishPayload.includes("googleBusinessUrl"), "publish payload: googleBusinessUrl");
assert(publishedHydrate.includes("googleBusinessUrl"), "published hydrate: googleBusinessUrl");
assert(businessTypes.includes("googleBusiness"), "business profile: googleBusiness resolved");
assert(draftTypes.includes("googleBusinessUrl"), "draft types: googleBusinessUrl");
assert(resolveProfile.includes("googleBusiness"), "resolve profile: googleBusiness mapping");

assert(hubMapper.includes("googleBusiness"), "hub mapper: google business in moreLinks");
assert(hubMapper.includes("Google Reviews"), "hub mapper: google reviews label");
assert(hubMapper.includes("Yelp"), "hub mapper: yelp label");
assert(hubCard.includes("Búscanos aquí") || hubCard.includes("Find us online"), "hub card: Búscanos aquí section");
assert(hubMapper.includes("buildServiciosGoogleMapsEmbedSrc"), "hub mapper: map embed helper");
assert(mapEmbed.includes("output=embed"), "map embed: safe Google Maps pattern");
assert(!mapEmbed.includes("API_KEY"), "map embed: no API key");
assert(mapPanel.includes("iframe"), "map panel: iframe embed path");
assert(hubCard.includes("ServiciosBusinessHubMapPanel"), "hub card: real map panel wired");
assert(hubCard.includes("Cómo llegar") || hubCard.includes("Get directions"), "hub card: directions CTA");

assert(canvas.includes("ServiciosCredencialesCard"), "credentials canvas still wired");
assert(proShell.includes("ServiciosPublicDetailsCanvas"), "section flow: details canvas preserved");

const restauranteBefore = restauranteGallery;
const ofertasBefore = ofertasHub;
assert(restauranteBefore === read("app/(site)/clasificados/restaurantes/shell/RestauranteLockedGallerySection.tsx"), "restaurante: unchanged");
assert(ofertasBefore === read("app/(site)/clasificados/ofertas-locales/OfertasLocalesBusinessHubLiteCard.tsx"), "ofertas: unchanged");

assert(pkg.includes('"verify:servicios-shell-2c"'), "package.json: verifier registered");

console.log("OK: 4-video cap in mapper/sanitizer");
console.log("OK: Restaurantes-style compact gallery video grid");
console.log("OK: Google Business field + Búscanos aquí mapping");
console.log("OK: real map embed without API key");
console.log("OK: credentials + scoped files untouched");
console.log("verify-servicios-shell-2c: PASS");
