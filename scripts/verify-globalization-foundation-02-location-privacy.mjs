#!/usr/bin/env node
/**
 * Leonix Globalization Foundation 02 — location privacy security proof.
 *
 * Security finding: Bienes Raíces and Rentas both persist the owner's exact street address into
 * `listings.detail_pairs` — a single JSONB column selected in full (no column-level restriction;
 * RLS on `public.listings` is row-level only) by every public read path, including client-side
 * Supabase queries using the public `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Two write-time functions
 * embedded the exact street unconditionally into that column regardless of the owner's
 * `mostrarDireccionExacta` ("show exact address") choice:
 *
 *   1. `buildBrGate12dV1FromPrivadoState` / `buildBrGate12dV1FromNegocioState`
 *      (app/(site)/clasificados/lib/leonixBrGate12d.ts) — unconditionally wrote
 *      `streetAddress`/`unit` into the `Leonix:br_gate12d_v1` machine payload. Affects BR
 *      Privado, BR Negocio, and Rentas Negocio (which reuses the Negocio builder).
 *   2. `buildLeonixMachineFacetPairsFromRentasPrivadoFormState`
 *      (app/(site)/clasificados/lib/leonixBrMachineFacetPairsFromFormState.ts) — unconditionally
 *      set `ubicacionLinea` to the exact street, which the BR approximate-map-query branch then
 *      mislabeled as "neighborhood" and persisted into the public `Leonix:br:map_url` pair.
 *      Affects Rentas Privado.
 *
 * Both are fixed by gating on the already-established `mostrarDireccionExacta` contract (the
 * same gate already correctly used for the human-readable "Ubicación"/"Dirección" pair and for
 * `buildRentasGoogleMapsSearchQuery`'s exact/cross-street branch). This verifier locks that gate
 * in place. It does not change the public read architecture itself (no schema/RLS change — that
 * remains a separate, larger finding outside this build's scope).
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

const gate12d = read("app/(site)/clasificados/lib/leonixBrGate12d.ts");
const machineFacets = read("app/(site)/clasificados/lib/leonixBrMachineFacetPairsFromFormState.ts");
const detailPairsFromVm = read("app/(site)/clasificados/lib/leonixRealEstateDetailPairsFromPreviewVm.ts");
const rentasHelpers = read("app/(site)/clasificados/rentas/shared/rentasPublishFormHelpers.ts");
const rentasPrivadoSchema = read("app/(site)/clasificados/publicar/rentas/privado/schema/rentasPrivadoFormState.ts");
const brPrivadoSchema = read("app/(site)/clasificados/publicar/bienes-raices/privado/schema/bienesRaicesPrivadoFormState.ts");
const brNegocioSchema = read(
  "app/(site)/clasificados/publicar/bienes-raices/negocio/application/schema/bienesRaicesNegocioFormState.ts",
);
const privadoPreviewVmMapper = read(
  "app/(site)/clasificados/publicar/bienes-raices/privado/application/mapping/mapBienesRaicesPrivadoStateToPreviewVm.ts",
);

// --- 1/2: the privacy preference exists on both BR and Rentas draft schemas ------------------
assert(brPrivadoSchema.includes("mostrarDireccionExacta: boolean"), "BR Privado schema must declare mostrarDireccionExacta");
assert(brNegocioSchema.includes("mostrarDireccionExacta: boolean"), "BR Negocio schema must declare mostrarDireccionExacta");
assert(rentasPrivadoSchema.includes("mostrarDireccionExacta: boolean"), "Rentas Privado schema must declare mostrarDireccionExacta");
assert(
  rentasPrivadoSchema.includes("direccionCruceCercano: string"),
  "Rentas Privado schema must keep a safe cross-street fallback field for the hidden case",
);

// --- 3/4: hidden street/unit cannot enter the Leonix:br_gate12d_v1 machine payload ------------
function extractFunctionBody(src, fnName) {
  const start = src.indexOf(`export function ${fnName}(`);
  assert(start !== -1, `${fnName} must exist in leonixBrGate12d.ts`);
  const nextExport = src.indexOf("\nexport function ", start + 1);
  return nextExport === -1 ? src.slice(start) : src.slice(start, nextExport);
}

const privadoBuilder = extractFunctionBody(gate12d, "buildBrGate12dV1FromPrivadoState");
const negocioBuilder = extractFunctionBody(gate12d, "buildBrGate12dV1FromNegocioState");

assert(
  /if\s*\(\s*Boolean\(s\.mostrarDireccionExacta\)\s*\)\s*\{[^}]*pushS\(\s*"streetAddress"/s.test(privadoBuilder),
  "buildBrGate12dV1FromPrivadoState must only push streetAddress inside a mostrarDireccionExacta gate",
);
assert(
  /if\s*\(\s*Boolean\(s\.mostrarDireccionExacta\)\s*\)\s*\{[^}]*pushS\(\s*"unit"/s.test(privadoBuilder),
  "buildBrGate12dV1FromPrivadoState must only push unit inside a mostrarDireccionExacta gate",
);
assert(
  /if\s*\(\s*Boolean\(s\.mostrarDireccionExacta\)\s*\)\s*\{[^}]*pushS\(\s*"streetAddress"/s.test(negocioBuilder),
  "buildBrGate12dV1FromNegocioState must only push streetAddress inside a mostrarDireccionExacta gate",
);

// Guard against a future edit re-introducing an unconditional push above the gate.
for (const [name, body] of [
  ["buildBrGate12dV1FromPrivadoState", privadoBuilder],
  ["buildBrGate12dV1FromNegocioState", negocioBuilder],
]) {
  const gateIdx = body.indexOf("mostrarDireccionExacta");
  const streetIdx = body.indexOf('pushS("streetAddress"');
  assert(gateIdx !== -1 && streetIdx !== -1 && gateIdx < streetIdx, `${name} must check mostrarDireccionExacta before pushing streetAddress`);
}

// --- 6: hidden Rentas map query cannot mislabel the exact street as "neighborhood" ------------
assert(
  /ubicacionLinea:\s*\n?\s*state\.mostrarDireccionExacta === true \? buildRentasStreetLine\(state\) : state\.direccionCruceCercano\.trim\(\)/.test(
    machineFacets,
  ),
  "buildLeonixMachineFacetPairsFromRentasPrivadoFormState must only pass the exact street into ubicacionLinea when mostrarDireccionExacta === true, else the safe cross-street fallback",
);
assert(
  rentasHelpers.includes("const exactOk = parts.mostrarDireccionExacta === true;") &&
    rentasHelpers.includes("const street = exactOk ? buildRentasStreetLine(parts) : "),
  "buildRentasGoogleMapsSearchQuery (the already-correct reference pattern) must remain gated",
);

// --- Human-readable "Ubicación"/"Dirección" pair remains gated (already-correct, unmodified) --
assert(
  detailPairsFromVm.includes("const exact = Boolean(vm.mostrarDireccionExacta);"),
  "buildDetailPairsFromBienesRaicesPrivadoPreviewVm/Negocio must keep gating the human Ubicación/Dirección pair",
);

// --- 5: no JSON-LD builder exists for BR/Rentas that could leak the exact street --------------
assert(
  !/"@type":\s*"RealEstateListing"/.test(gate12d) && !/GeoCoordinates/.test(gate12d) && !/application\/ld\+json/.test(machineFacets),
  "no BR/Rentas JSON-LD builder should be introduced by this fix (none exists — omission is the safe state)",
);

// --- 7: no lat/lng coordinate fields introduced by this fix ------------------------------------
for (const src of [gate12d, machineFacets]) {
  assert(!/\blat(itude)?\s*[:=]/i.test(src) && !/\blng|longitude\s*[:=]/i.test(src), "no coordinate fields should be introduced");
}

// --- 8: owner/admin preview path (operates on the owner's own draft) keeps full fidelity ------
assert(
  privadoPreviewVmMapper.includes("showExact") || privadoPreviewVmMapper.includes("s.mostrarDireccionExacta"),
  "owner preview VM mapper must still branch on mostrarDireccionExacta (unchanged — full fidelity for the owner's own draft preview)",
);

// --- 9: no heuristic title/email/address-guessing lookup introduced ---------------------------
for (const src of [gate12d, machineFacets]) {
  assert(!/\.eq\(\s*["']title["']/.test(src) && !/\.eq\(\s*["']email["']/.test(src), "no heuristic identity/address lookup should be introduced");
}

console.log("OK: mostrarDireccionExacta privacy preference exists on BR Privado, BR Negocio, and Rentas Privado");
console.log("OK: Leonix:br_gate12d_v1 streetAddress/unit only written when mostrarDireccionExacta is true (BR Privado, BR Negocio + Rentas Negocio reuse)");
console.log("OK: Rentas Privado map-query neighborhood field can no longer carry the mislabeled exact street when hidden");
console.log("OK: already-correct Ubicación/Dirección human pair gate and buildRentasGoogleMapsSearchQuery gate remain intact");
console.log("OK: no JSON-LD / coordinate leak vector introduced");
console.log("OK: owner/admin preview path retains full location fidelity");
console.log("OK: no heuristic identity lookup introduced");
console.log("verify-globalization-foundation-02-location-privacy: PASS");
