#!/usr/bin/env node
/**
 * SVC-SHELL-2F — Restaurante-style payment brand badges in Pagos y beneficios chips.
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
const chipVisual = read("app/(site)/servicios/lib/serviciosPaymentChipVisual.ts");
const chipMarker = read("app/(site)/servicios/components/ServiciosPaymentChipMarker.tsx");
const shellTokens = read("app/(site)/servicios/lib/serviciosShellSectionTokens.ts");
const restauranteMarker = read("app/(site)/clasificados/restaurantes/components/RestaurantePublishChipMarker.tsx");
const pkg = read("package.json");

assert(chipVisual.includes("ServiciosPaymentChipLeading"), "chip visual: leading type");
assert(chipVisual.includes("resolveServiciosPaymentChipLeading"), "chip visual: resolver");
assert(chipMarker.includes("ServiciosPaymentChipMarker"), "chip marker: component");

assert(chipMarker.includes("bg-[#6D1ED4]"), "marker: zelle color");
assert(chipMarker.includes("bg-[#008CFF]"), "marker: venmo color");
assert(chipMarker.includes("bg-[#00D632]"), "marker: cash_app color");
assert(chipMarker.includes("bg-[#003087]"), "marker: paypal color");
assert(chipMarker.includes("bg-[#1A1F71]"), "marker: visa color");
assert(chipMarker.includes("bg-[#EB001B]"), "marker: mastercard color");
assert(chipMarker.includes("bg-[#2E77BC]"), "marker: amex color");
assert(chipMarker.includes("bg-[#4A4AF4]"), "marker: affirm color");
assert(chipMarker.includes("bg-[#004977]"), "marker: capital_one color");

assert(chipVisual.includes("bg-neutral-900"), "chip visual: Apple Pay pill");
assert(chipVisual.includes("bg-[#4285F4]"), "chip visual: Google Pay pill");

assert(chipMarker.includes("text-[9px]"), "marker: compact badge text-[9px]");
assert(shellTokens.includes("text-[10px]"), "shell tokens: compact chip text-[10px]");
assert(pagosSection.includes("SVC_PAGOS_BENEFICIOS_GRID"), "pagos section: thirds grid preserved");
assert(shellTokens.includes("lg:grid-cols-3"), "shell tokens: lg:grid-cols-3");
assert(!pagosSection.includes("xl:grid-cols-6"), "pagos section: no xl:grid-cols-6");

assert(pagosSection.includes("ServiciosPaymentChipMarker"), "pagos section: renders chip marker");
assert(pagosSection.includes("resolveServiciosPaymentChipLeading"), "pagos section: resolves leading");

assert(restauranteMarker === read("app/(site)/clasificados/restaurantes/components/RestaurantePublishChipMarker.tsx"), "restaurante marker unchanged");

assert(pkg.includes('"verify:servicios-shell-2f"'), "package.json: verifier registered");

console.log("OK: branded payment chip markers restored");
console.log("OK: 3-column layout preserved");
console.log("verify-servicios-shell-2f: PASS");
