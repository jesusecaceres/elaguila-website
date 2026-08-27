/**
 * Final Completion item 21 — Community Trust (BR Negocio / Rentas Negocio) selftest.
 * No network, no Supabase, no browser. Run from repo root:
 *   npx tsx scripts/final-item21-community-trust-selftest.ts
 *
 * Covers: registry correctness for the two new categories, target-type resolution, the
 * not-yet-live readiness gate, a private-lane exclusion static check (BR/Rentas Privado never
 * import the Community Trust surfaces), a static check of the prepared (not applied) migration
 * SQL, and a regression check proving Servicios/Restaurantes are completely unaffected.
 */
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import {
  getLeonixEndorsementDefinitions,
  isValidLeonixEndorsementKey,
  isLeonixEndorsementCategory,
  isLeonixEndorsementCategoryLive,
  leonixEndorsementTargetTypeForCategory,
} from "../app/lib/leonixCommunityTrust/leonixEndorsementRegistry";

const REPO_ROOT = join(__dirname, "..");

/* ------------------------------------------------------------------------------------------ *
 * A — Registry correctness for the two new categories, curated vocabulary as approved.
 * ------------------------------------------------------------------------------------------ */
{
  const brDefs = getLeonixEndorsementDefinitions("bienes_raices_negocio");
  const brKeys = brDefs.map((d) => d.key);
  assert.deepEqual(
    brKeys,
    ["respuesta_rapida", "comunicacion_clara", "informacion_precisa", "proceso_sencillo", "conocimiento_area"],
    "A: BR Negocio endorsement keys match the approved vocabulary, in order",
  );
  const conocimiento = brDefs.find((d) => d.key === "conocimiento_area");
  assert.equal(conocimiento?.es, "Conocimiento del área", "A: BR Negocio ES label matches approved copy");
  assert.equal(conocimiento?.en, "Knows the area", "A: BR Negocio EN label matches approved copy");

  const rentasDefs = getLeonixEndorsementDefinitions("rentas_negocio");
  const rentasKeys = rentasDefs.map((d) => d.key);
  assert.deepEqual(
    rentasKeys,
    ["respuesta_rapida", "mantenimiento_tiempo", "trato_justo", "proceso_renta_sencillo", "propiedad_como_descrita"],
    "A: Rentas Negocio endorsement keys match the approved vocabulary, in order",
  );
  const propiedad = rentasDefs.find((d) => d.key === "propiedad_como_descrita");
  assert.equal(propiedad?.es, "Propiedad como se describe", "A: Rentas Negocio ES label matches approved copy");
  assert.equal(propiedad?.en, "Property as described", "A: Rentas Negocio EN label matches approved copy");

  assert.ok(isValidLeonixEndorsementKey("bienes_raices_negocio", "respuesta_rapida"), "A: real BR key validates");
  assert.ok(!isValidLeonixEndorsementKey("bienes_raices_negocio", "not_a_real_key"), "A: bogus key is rejected");
  assert.ok(isValidLeonixEndorsementKey("rentas_negocio", "trato_justo"), "A: real Rentas key validates");
  assert.ok(isLeonixEndorsementCategory("bienes_raices_negocio"), "A: bienes_raices_negocio is a recognized category");
  assert.ok(isLeonixEndorsementCategory("rentas_negocio"), "A: rentas_negocio is a recognized category");
  assert.ok(!isLeonixEndorsementCategory("bienes_raices_privado"), "A: BR Privado is NOT a recognized endorsement category");

  console.log("A (registry correctness) OK");
}

/* ------------------------------------------------------------------------------------------ *
 * B — Target-type resolution: BR/Rentas Negocio resolve to the new durable-identity target
 * types, never a disposable listing id target type.
 * ------------------------------------------------------------------------------------------ */
{
  assert.equal(
    leonixEndorsementTargetTypeForCategory("bienes_raices_negocio"),
    "bienes_raices_negocio_identity",
    "B: BR Negocio resolves to the durable-identity target type",
  );
  assert.equal(
    leonixEndorsementTargetTypeForCategory("rentas_negocio"),
    "rentas_negocio_identity",
    "B: Rentas Negocio resolves to the durable-identity target type",
  );
  console.log("B (target-type resolution) OK");
}

/* ------------------------------------------------------------------------------------------ *
 * C — Readiness gate: BR/Rentas Negocio are correctly NOT live yet (migration prepared, not
 * applied); Servicios/Restaurantes are unaffected and still live.
 * ------------------------------------------------------------------------------------------ */
{
  assert.equal(isLeonixEndorsementCategoryLive("bienes_raices_negocio"), false, "C: BR Negocio not live until migration applied");
  assert.equal(isLeonixEndorsementCategoryLive("rentas_negocio"), false, "C: Rentas Negocio not live until migration applied");
  assert.equal(isLeonixEndorsementCategoryLive("servicios"), true, "C: Servicios regression — still live");
  assert.equal(isLeonixEndorsementCategoryLive("restaurantes"), true, "C: Restaurantes regression — still live");
  console.log("C (readiness gate) OK");
}

/* ------------------------------------------------------------------------------------------ *
 * D — Servicios/Restaurantes regression: existing categories are byte-for-byte unaffected by
 * the BR/Rentas additions.
 * ------------------------------------------------------------------------------------------ */
{
  const serviciosKeys = getLeonixEndorsementDefinitions("servicios").map((d) => d.key);
  assert.deepEqual(
    serviciosKeys,
    ["professional", "on_time", "friendly", "good_communication", "quality_work"],
    "D: Servicios vocabulary unchanged",
  );
  const restaurantesKeys = getLeonixEndorsementDefinitions("restaurantes").map((d) => d.key);
  assert.deepEqual(
    restaurantesKeys,
    ["clean", "friendly_staff", "great_food", "good_service", "great_atmosphere"],
    "D: Restaurantes vocabulary unchanged",
  );
  assert.equal(leonixEndorsementTargetTypeForCategory("servicios"), "servicios_profile", "D: Servicios target type unchanged");
  assert.equal(leonixEndorsementTargetTypeForCategory("restaurantes"), "restaurantes_listing", "D: Restaurantes target type unchanged");
  console.log("D (Servicios/Restaurantes regression) OK");
}

/* ------------------------------------------------------------------------------------------ *
 * E — Private-lane exclusion (static check): no BR Privado / Rentas Privado file imports the
 * Community Trust surfaces. Community Trust is professional-only.
 * ------------------------------------------------------------------------------------------ */
{
  const privadoFiles = [
    "app/(site)/clasificados/publicar/bienes-raices/privado/application/BienesRaicesPrivadoForm.tsx",
    "app/(site)/clasificados/bienes-raices/preview/privado/BienesRaicesPrivadoPreviewView.tsx",
    "app/(site)/clasificados/publicar/rentas/privado/application/RentasPrivadoForm.tsx",
    "app/(site)/clasificados/rentas/preview/privado/components/RentasPrivadoPreviewClient.tsx",
  ];
  for (const rel of privadoFiles) {
    const contents = readFileSync(join(REPO_ROOT, rel), "utf8");
    assert.ok(
      !contents.includes("BrRentasCommunityTrustSection") && !contents.includes("LeonixCommunityTrust"),
      `E: ${rel} must never import the Community Trust surface (professional-only)`,
    );
  }
  console.log("E (private-lane exclusion, static check) OK");
}

/* ------------------------------------------------------------------------------------------ *
 * F — Prepared migration SQL static check: additive-only, preserves every existing target_type/
 * category value, adds exactly the two new ones, table is additive (create if not exists).
 * ------------------------------------------------------------------------------------------ */
{
  const migrationPath = join(
    REPO_ROOT,
    "supabase/migrations/20260827180000_leonix_professional_identities_br_rentas_community_trust.sql",
  );
  const sql = readFileSync(migrationPath, "utf8");

  assert.ok(sql.includes("create table if not exists public.leonix_professional_identities"), "F: new table is additive (if not exists)");
  assert.ok(sql.includes("references auth.users (id) on delete cascade"), "F: identity table anchors to a durable auth user, not a listing");
  assert.ok(sql.includes("PREPARED MIGRATION"), "F: file self-documents as prepared/not-applied");

  // target_type CHECK: every existing value preserved + exactly the two new ones.
  const targetTypeMatch = sql.match(/leonix_endorsement_votes_target_type_check[\s\S]*?check \(target_type in \(([\s\S]*?)\)\);/);
  assert.ok(targetTypeMatch, "F: target_type CHECK block found");
  const targetTypeValues = targetTypeMatch![1];
  for (const existing of ["servicios_profile", "restaurantes_listing"]) {
    assert.ok(targetTypeValues.includes(existing), `F: existing target_type '${existing}' preserved`);
  }
  for (const added of ["bienes_raices_negocio_identity", "rentas_negocio_identity"]) {
    assert.ok(targetTypeValues.includes(added), `F: new target_type '${added}' added`);
  }

  // category CHECK: same preserve+add pattern.
  const categoryMatch = sql.match(/leonix_endorsement_votes_category_check[\s\S]*?check \(category in \(([\s\S]*?)\)\);/);
  assert.ok(categoryMatch, "F: category CHECK block found");
  const categoryValues = categoryMatch![1];
  for (const existing of ["'servicios'", "'restaurantes'"]) {
    assert.ok(categoryValues.includes(existing), `F: existing category ${existing} preserved`);
  }
  for (const added of ["'bienes_raices_negocio'", "'rentas_negocio'"]) {
    assert.ok(categoryValues.includes(added), `F: new category ${added} added`);
  }

  // No schema-level destructive statement anywhere (DROP TABLE / TRUNCATE). A scoped
  // `delete from leonix_endorsement_votes where user_id = ... and endorsement_key = ...` DOES
  // appear inside the toggle RPC body — that's the existing, already-live toggle-off mechanic
  // (byte-identical to the currently-applied function), not new destructive schema DDL.
  const forbidden = /\b(drop\s+table|truncate)\b/i;
  assert.ok(!forbidden.test(sql), "F: migration contains no destructive schema statement (drop table / truncate)");
  assert.ok(
    !/delete\s+from\s+public\.leonix_professional_identities/i.test(sql),
    "F: migration never deletes from the new identity table itself",
  );

  console.log("F (prepared migration SQL static check) OK");
}

console.log("\nFinal item 21 (Community Trust) selftest: ALL OK");
