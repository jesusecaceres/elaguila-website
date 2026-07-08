#!/usr/bin/env node
/**
 * SVC-SHELL-2 — Servicios public output truth + canvas shell gate.
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

const lightbox = read("app/(site)/servicios/components/ServiciosMediaLightbox.tsx");
const gallery = read("app/(site)/servicios/components/ServiciosGalleryWithTabs.tsx");
const visualProof = read("app/(site)/servicios/components/ServiciosVisualProofRow.tsx");
const featuredMedia = read("app/(site)/servicios/lib/serviciosFeaturedMedia.ts");
const canvas = read("app/(site)/servicios/components/ServiciosPublicDetailsCanvas.tsx");
const credCard = read("app/(site)/servicios/components/ServiciosCredencialesCard.tsx");
const proShell = read("app/(site)/servicios/components/ServiciosProfessionalProfileShell.tsx");
const stdShell = read("app/(site)/servicios/components/ServiciosProfileView.tsx");
const appCopy = read("app/(site)/clasificados/publicar/servicios/lib/clasificadosServiciosApplicationCopy.ts");
const caps = read("app/(site)/clasificados/publicar/servicios/lib/serviciosSelectionCaps.ts");
const profileCopy = read("app/(site)/servicios/copy/serviciosProfileCopy.ts");
const resolveProfile = read("app/(site)/servicios/lib/resolveServiciosProfile.ts");
const pkg = read("package.json");

assert(lightbox.includes("Fotos") && lightbox.includes("Photos"), "Lightbox uses Fotos/Photos labels");
assert(lightbox.includes("Videos"), "Lightbox uses Videos tab");
assert(!lightbox.includes("Comida"), "Lightbox must not use Comida label");
assert(!lightbox.includes("Interior"), "Lightbox must not use Interior label");
assert(!lightbox.includes("Exterior"), "Lightbox must not use Exterior label");

assert(gallery.includes("ServiciosMediaLightbox"), "Gallery uses ServiciosMediaLightbox drawer");
assert(!gallery.includes("GalleryModal"), "Legacy photos-only GalleryModal removed");

assert(featuredMedia.includes("getFeaturedVisualProofImages"), "Featured media helper exists");
assert(visualProof.includes("getFeaturedVisualProofImages"), "Visual proof row uses featured helper");
assert(featuredMedia.includes("hasSelectedDestacadaImages"), "Destacada-only visual proof guard");

assert(canvas.includes("ServiciosCredencialesCard"), "Details canvas wires credentials card");
assert(canvas.includes("data-servicios-public-details-canvas"), "Details canvas marker present");
assert(credCard.includes("data-servicios-credenciales"), "Credentials card marker present");
assert(
  profileCopy.includes("Licencia, seguro y certificaciones") &&
    profileCopy.includes("License, insurance & certifications"),
  "Credentials section title updated",
);

assert(!appCopy.includes("Técnico certificado"), "Mechanic-specific certification placeholder removed");
assert(!appCopy.includes("Certified technician"), "Mechanic-specific EN certification placeholder removed");
assert(appCopy.includes("certificationsHint"), "Generic certification helper present");

assert(caps.includes("MAX_REASONS_SELECTION = 6"), "Reasons cap increased");
assert(caps.includes("MAX_QUICK_FACTS_SELECTION = 5"), "Quick facts cap increased");

assert(proShell.includes("ServiciosPublicDetailsCanvas"), "Professional shell uses details canvas");
assert(proShell.includes("ServiciosVisualProofRow"), "Professional shell uses visual proof row");
assert(!proShell.includes("ServiciosLicense"), "Professional shell no longer uses generic license badges only");

assert(stdShell.includes("ServiciosPublicDetailsCanvas"), "Standard shell uses details canvas");
assert(stdShell.includes("ServiciosVisualProofRow"), "Standard shell uses visual proof row");
assert(!stdShell.includes("ServiciosLicense"), "Standard shell no longer uses generic license badges only");

assert(resolveProfile.includes("splitFeaturedGallery"), "Destacada mapping preserved in profile resolver");

const restauranteGallery = read("app/(site)/clasificados/restaurantes/shell/RestauranteLockedGallerySection.tsx");
assert(!gallery.includes("Comida"), "Servicios gallery must not import restaurant tab labels");

assert(pkg.includes('"verify:servicios-shell-2"'), "package.json verifier registered");

console.log("OK: Servicios drawer uses Fotos/Videos (no restaurant labels)");
console.log("OK: Destacada visual proof + credentials canvas wired");
console.log("OK: Generic certification copy + safe pill caps");
console.log("verify-servicios-shell-2: PASS");
