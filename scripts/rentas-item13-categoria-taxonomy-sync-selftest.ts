/**
 * Item 13 fix — Rentas categoriaPropiedad/tipoDeRenta synchronization selftest.
 * No network, no Supabase, no browser. Run from repo root:
 *   npx tsx scripts/rentas-item13-categoria-taxonomy-sync-selftest.ts
 *
 * Confirmed behavioral defect this fixes: selecting tipoDeRenta="oficina" while
 * categoriaPropiedad stayed "residencial" (its independent default) rendered a
 * "RENTA RESIDENCIAL" heading for a commercial office listing — reproduced live via an
 * authenticated Staging application flow. categoriaPropiedad must never again be settable
 * independently of tipoDeRenta.
 */
import { strict as assert } from "node:assert";
import {
  RENTAS_TIPO_DE_RENTA_IDS,
  rentasRentalFlowGroupForTipo,
  rentasCategoriaPropiedadForFlowGroup,
  rentasCategoriaPropiedadForTipo,
} from "../app/(site)/clasificados/rentas/shared/rentasRentalTypeTaxonomy";

/* ------------------------------------------------------------------------------------------ *
 * A — Every one of the 16 real rental types (+ "otro") maps to exactly one canonical category,
 * matching the exact family groupings the owner-acceptance audit specified.
 * ------------------------------------------------------------------------------------------ */
{
  const EXPECTED: Record<string, "residencial" | "comercial" | "terreno_lote"> = {
    casa: "residencial",
    apartamento: "residencial",
    condominio: "residencial",
    townhome: "residencial",
    duplex_multifamiliar: "residencial",
    adu_casita: "residencial",
    estudio: "residencial",
    cuarto_recamara: "residencial",
    cuarto_compartido: "residencial",
    espacio_compartido: "residencial",
    garaje: "comercial",
    estacionamiento: "comercial",
    bodega_almacen: "comercial",
    oficina: "comercial",
    local_comercial: "comercial",
    terreno_lote: "terreno_lote",
    otro: "residencial",
  };
  for (const id of RENTAS_TIPO_DE_RENTA_IDS) {
    assert.equal(
      rentasCategoriaPropiedadForTipo(id),
      EXPECTED[id],
      `A: tipoDeRenta="${id}" must canonically map to categoriaPropiedad="${EXPECTED[id]}"`,
    );
  }
  console.log("A (full 16-type + otro canonical mapping) OK");
}

/* ------------------------------------------------------------------------------------------ *
 * B — The exact confirmed regression: Oficina must resolve to "comercial", never "residencial".
 * ------------------------------------------------------------------------------------------ */
{
  assert.equal(rentasRentalFlowGroupForTipo("oficina"), "commercial_space", "B: oficina is commercial_space flow group");
  assert.equal(
    rentasCategoriaPropiedadForTipo("oficina"),
    "comercial",
    "B: Oficina must never resolve to residencial (the confirmed live defect)",
  );
  console.log("B (confirmed regression case: Oficina -> comercial) OK");
}

/* ------------------------------------------------------------------------------------------ *
 * C — Flow-group-level mapping is total and covers every group, including "unset".
 * ------------------------------------------------------------------------------------------ */
{
  assert.equal(rentasCategoriaPropiedadForFlowGroup("unset"), "residencial", "C: unset defaults to residencial");
  assert.equal(rentasCategoriaPropiedadForFlowGroup("full_housing"), "residencial", "C: full_housing -> residencial");
  assert.equal(rentasCategoriaPropiedadForFlowGroup("room_shared"), "residencial", "C: room_shared -> residencial");
  assert.equal(rentasCategoriaPropiedadForFlowGroup("storage_parking"), "comercial", "C: storage_parking -> comercial");
  assert.equal(rentasCategoriaPropiedadForFlowGroup("commercial_space"), "comercial", "C: commercial_space -> comercial");
  assert.equal(rentasCategoriaPropiedadForFlowGroup("land_parcel"), "terreno_lote", "C: land_parcel -> terreno_lote");
  console.log("C (flow-group mapping is total) OK");
}

/* ------------------------------------------------------------------------------------------ *
 * D — Legacy mismatched combinations normalize correctly (backward-compatibility requirement):
 * a draft/listing with tipoDeRenta="terreno_lote" but a stale categoriaPropiedad="residencial"
 * must resolve to "terreno_lote" when re-derived, not preserve the stale mismatch.
 * ------------------------------------------------------------------------------------------ */
{
  const legacyMismatches: { tipoDeRenta: string; staleCategoria: string }[] = [
    { tipoDeRenta: "oficina", staleCategoria: "residencial" },
    { tipoDeRenta: "terreno_lote", staleCategoria: "residencial" },
    { tipoDeRenta: "garaje", staleCategoria: "residencial" },
    { tipoDeRenta: "cuarto_recamara", staleCategoria: "comercial" },
    { tipoDeRenta: "local_comercial", staleCategoria: "terreno_lote" },
  ];
  for (const { tipoDeRenta, staleCategoria } of legacyMismatches) {
    const derived = rentasCategoriaPropiedadForTipo(tipoDeRenta);
    assert.notEqual(
      derived,
      staleCategoria,
      `D: sanity — the test fixture's stale value must actually differ from canonical for ${tipoDeRenta}`,
    );
    assert.ok(
      derived === "residencial" || derived === "comercial" || derived === "terreno_lote",
      `D: re-derived category for legacy ${tipoDeRenta} is a valid enum value`,
    );
  }
  console.log("D (legacy mismatched combinations re-derive correctly) OK");
}

/* ------------------------------------------------------------------------------------------ *
 * E — Static check: the independent category button in both Rentas forms is now derived
 * (disabled once tipoDeRenta is set), and the shared tipoDeRenta onChange handler drives
 * categoriaPropiedad — not left as two independently-settable controls.
 * ------------------------------------------------------------------------------------------ */
{
  const fs = require("node:fs") as typeof import("node:fs");
  const path = require("node:path") as typeof import("node:path");
  const repoRoot = path.join(__dirname, "..");

  const sharedSection = fs.readFileSync(
    path.join(repoRoot, "app/(site)/clasificados/publicar/rentas/shared/RentasAnuncioFormSection.tsx"),
    "utf8",
  );
  assert.ok(
    sharedSection.includes("rentasCategoriaPropiedadForTipo(e.target.value)"),
    "E: tipoDeRenta onChange must derive categoriaPropiedad from the canonical mapping",
  );

  for (const formPath of [
    "app/(site)/clasificados/publicar/rentas/negocio/application/RentasNegocioForm.tsx",
    "app/(site)/clasificados/publicar/rentas/privado/application/RentasPrivadoForm.tsx",
  ]) {
    const src = fs.readFileSync(path.join(repoRoot, formPath), "utf8");
    assert.ok(
      src.includes("disabled={Boolean(state.tipoDeRenta)}"),
      `E: ${formPath} category buttons must be disabled once tipoDeRenta determines the category`,
    );
  }
  console.log("E (independent category selector is now derived, static check) OK");
}

console.log("\nItem 13 (Rentas categoría/tipo taxonomy sync) selftest: ALL OK");
