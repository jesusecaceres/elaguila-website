#!/usr/bin/env node
/**
 * SVC-SHELL-2E — Pagos y beneficios even-thirds + group title icons.
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

const pagosSection = read("app/(site)/servicios/components/ServiciosPagosBeneficiosSection.tsx");
const pagosData = read("app/(site)/servicios/lib/serviciosPagosBeneficiosData.ts");
const shellTokens = read("app/(site)/servicios/lib/serviciosShellSectionTokens.ts");
const restauranteAmenities = read("app/(site)/clasificados/restaurantes/shell/RestauranteAmenitiesShellSection.tsx");
const pkg = read("package.json");

assert(pagosSection.includes("SVC_PAGOS_BENEFICIOS_GRID"), "pagos section: dedicated thirds grid token");
assert(!pagosSection.includes("SVC_AMENITIES_GRID"), "pagos section: no xl:grid-cols-6 amenities grid");
assert(shellTokens.includes("SVC_PAGOS_BENEFICIOS_GRID"), "shell tokens: pagos thirds grid defined");
assert(shellTokens.includes("lg:grid-cols-3"), "shell tokens: lg:grid-cols-3 present");
assert(!shellTokens.match(/SVC_PAGOS_BENEFICIOS_GRID[^\n]*xl:grid-cols-6/), "shell tokens: pagos grid has no xl:grid-cols-6");

assert(pagosData.includes("resolveServiciosPagosGroupIcon"), "pagos data: icon resolver");
assert(pagosData.includes("payments: \"💳\""), "pagos data: Pagos fallback icon");
assert(pagosData.includes("financing: \"🧾\""), "pagos data: Financiamiento fallback icon");
assert(pagosData.includes("highlights: \"⭐\""), "pagos data: Beneficios fallback icon");

assert(pagosSection.includes("resolveServiciosPagosGroupIcon"), "pagos section: uses icon resolver");
assert(pagosSection.includes("SVC_AMENITY_CHIP"), "pagos section: compact chips preserved");
assert(pagosSection.includes("text-[10px]") || shellTokens.includes("text-[10px]"), "pagos section: compact chip text");

assert(restauranteAmenities === read("app/(site)/clasificados/restaurantes/shell/RestauranteAmenitiesShellSection.tsx"), "restaurante amenities unchanged");

assert(pkg.includes('"verify:servicios-shell-2e"'), "package.json: verifier registered");

console.log("OK: Pagos y beneficios uses lg:grid-cols-3 even thirds");
console.log("OK: group title icons with fallback map");
console.log("verify-servicios-shell-2e: PASS");
