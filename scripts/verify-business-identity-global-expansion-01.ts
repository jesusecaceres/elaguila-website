/**
 * Focused tests for the Gate BCO-3R global Business Identity expansion (backend/schema layer).
 * Same repo convention and "server-only" import constraint as the other verify-business-*.ts
 * scripts (see verify-business-identity-core-01.ts's header comment for the full rationale).
 * Run from repo root: npx tsx scripts/verify-business-identity-global-expansion-01.ts
 */
import { strict as assert } from "node:assert";

import { isValidCountryCode, countryLabel, COUNTRIES } from "../app/lib/business/countries";
import { validateAuthorization, validateCountryField, validateDigitalProfile, validateOperatingModels } from "../app/lib/business/validation";
import {
  emptyWizardPayload,
  emptyWizardPayloadV2,
  isLegacyV1Payload,
  migrateDraftV1ToV2,
  newContactDraft,
  newContactDraftV2,
} from "../app/(site)/dashboard/business-tools/onboarding/wizardTypes";

let passed = 0;
function check(name: string, fn: () => void): void {
  try {
    fn();
    passed += 1;
    console.log(`  PASS  ${name}`);
  } catch (e) {
    console.error(`  FAIL  ${name}`);
    console.error(e);
    process.exitCode = 1;
  }
}

console.log("Business Identity global expansion (BCO-3R) — focused tests\n");

// --- countries -----------------------------------------------------------------------------
check("isValidCountryCode: accepts a real code, rejects garbage", () => {
  assert.equal(isValidCountryCode("US"), true);
  assert.equal(isValidCountryCode("MX"), true);
  assert.equal(isValidCountryCode("ZZ-NOT-REAL"), false);
  assert.equal(isValidCountryCode(null), false);
});
check("countryLabel: returns the correct es/en label", () => {
  assert.equal(countryLabel("MX", "es"), "México");
  assert.equal(countryLabel("MX", "en"), "Mexico");
});
check("COUNTRIES: not limited to US/MX/LatAm — includes non-Americas markets", () => {
  const codes = COUNTRIES.map((c) => c.code);
  assert.ok(codes.includes("ES"));
  assert.ok(codes.includes("FR"));
  assert.ok(codes.includes("IN"));
  assert.ok(codes.includes("JP"));
  assert.ok(codes.includes("NG"));
  assert.ok(codes.includes("AU"));
});

// --- validators ------------------------------------------------------------------------------
check("validateCountryField: rejects unknown country", () => {
  const r = validateCountryField("NOTACOUNTRY");
  assert.equal(r.ok, false);
});
check("validateOperatingModels: rejects empty selection", () => {
  const r = validateOperatingModels([]);
  assert.equal(r.ok, false);
});
check("validateOperatingModels: filters out invalid tags, keeps valid ones", () => {
  const r = validateOperatingModels(["fixed_location", "not_a_real_model"]);
  assert.equal(r.ok, true);
  if (r.ok) assert.deepEqual(r.value, ["fixed_location"]);
});
check("validateAuthorization: owner role with confirmation passes", () => {
  const r = validateAuthorization({ confirmed: true, role: "owner", representativeRelationship: "", representativeContactEmail: "" });
  assert.equal(r.ok, true);
});
check("validateAuthorization: unconfirmed fails", () => {
  const r = validateAuthorization({ confirmed: false, role: "owner", representativeRelationship: "", representativeContactEmail: "" });
  assert.equal(r.ok, false);
});
check("validateAuthorization: authorized_representative requires a relationship", () => {
  const r = validateAuthorization({ confirmed: true, role: "authorized_representative", representativeRelationship: "", representativeContactEmail: "" });
  assert.equal(r.ok, false);
});
check("validateAuthorization: authorized_representative with relationship passes", () => {
  const r = validateAuthorization({ confirmed: true, role: "authorized_representative", representativeRelationship: "Store manager", representativeContactEmail: "" });
  assert.equal(r.ok, true);
});
check("validateDigitalProfile: rejects unknown platform", () => {
  const r = validateDigitalProfile({ platform: "not_a_platform", handleOrUrl: "@business" });
  assert.equal(r.ok, false);
});
check("validateDigitalProfile: valid platform + handle passes", () => {
  const r = validateDigitalProfile({ platform: "instagram", handleOrUrl: "@business" });
  assert.equal(r.ok, true);
});

// --- v1/v2 backward compatibility -------------------------------------------------------------
check("emptyWizardPayload (v1) still produces schemaVersion 1 — existing wizard unaffected", () => {
  const p = emptyWizardPayload("es");
  assert.equal(p.schemaVersion, 1);
});
check("newContactDraft (v1) still produces the original shape (no label/visibility)", () => {
  const c = newContactDraft();
  assert.equal("label" in c, false);
  assert.equal("visibility" in c, false);
});
check("newContactDraftV2 produces the v2 shape (label/visibility present)", () => {
  const c = newContactDraftV2();
  assert.equal(c.label, "main");
  assert.equal(c.visibility, "public");
});

// --- v1 -> v2 draft migration (Gate BCO-3R Phase 14) ------------------------------------------
check("migrateDraftV1ToV2: preserves display name, legal name, and contacts", () => {
  const v1 = emptyWizardPayload("es");
  v1.basics.displayName = "Taqueria El Aguila";
  v1.basics.legalName = "El Aguila LLC";
  v1.contacts = [{ id: "c1", contactType: "phone", rawValue: "+15550001111", preferredChannel: true, channelKind: "whatsapp", isPrimary: true }];
  v1.serviceArea = { areaKind: "service_area_text", rawText: "Metro area", cityHint: null };
  v1.ownershipConfirmation = { confirmed: true, settingUpForSomeoneElse: false };

  const v2 = migrateDraftV1ToV2(v1, "es");
  assert.equal(v2.schemaVersion, 2);
  assert.equal(v2.basics.displayName, "Taqueria El Aguila");
  assert.equal(v2.basics.legalName, "El Aguila LLC");
  assert.equal(v2.contacts.length, 1);
  assert.equal(v2.contacts[0].rawValue, "+15550001111");
  assert.equal(v2.serviceArea.rawText, "Metro area");
  assert.equal(v2.ownershipAuthorization.confirmed, true);
  assert.equal(v2.ownershipAuthorization.role, "owner");
});
check("migrateDraftV1ToV2: never crashes on a completely empty v1 draft", () => {
  const v2 = migrateDraftV1ToV2(emptyWizardPayload("en"), "en");
  assert.equal(v2.schemaVersion, 2);
  assert.equal(v2.contacts.length, 0);
});
check("migrateDraftV1ToV2: unmappable legacy broadBusinessType is preserved for review, not silently discarded", () => {
  const v1 = emptyWizardPayload("es");
  v1.typeStage = { broadBusinessType: "some-legacy-free-text-value", businessStage: "active" };
  const v2 = migrateDraftV1ToV2(v1, "es");
  assert.equal(v2.typeStage.broadBusinessType, ""); // blank, not silently guessed
  assert.equal(v2.typeStage.customSpecificType, "some-legacy-free-text-value"); // preserved for owner review
});
check("migrateDraftV1ToV2: forces step back to 1 (setup language / category are new/changed)", () => {
  const v1 = emptyWizardPayload("es");
  v1.updatedByStep = 7;
  const v2 = migrateDraftV1ToV2(v1, "es");
  assert.equal(v2.updatedByStep, 1);
});
check("isLegacyV1Payload correctly discriminates v1 from v2", () => {
  assert.equal(isLegacyV1Payload(emptyWizardPayload("es")), true);
  assert.equal(isLegacyV1Payload(emptyWizardPayloadV2("es")), false);
});

console.log(`\n${passed} check(s) passed.`);
if (process.exitCode) {
  console.error("\nSome checks FAILED.");
  process.exit(1);
}
