/**
 * Focused tests for the Gate BCO-3R-B.2 contact-foundation completion (capabilities, preferred
 * response method, expanded contact labels, Snapchat/Pinterest, custom business links). Same
 * repo convention as the other verify-business-*.ts scripts — no jest/vitest, hand-rolled
 * node:assert + check(). The new finalize_business_identity_v3 RPC and migration were NOT
 * executed against a live Postgres instance (no DB/CLI access was available) — checks against it
 * are limited to static structural review of the SQL file, clearly labeled below; live behavior
 * (atomicity, rollback, RLS enforcement) needs real staging verification before this is trusted.
 * Run from repo root: npx tsx scripts/verify-business-identity-contact-foundation-01.ts
 */
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import path from "node:path";

import {
  CONTACT_CAPABILITIES,
  CONTACT_CAPABILITY_VALUES,
  CONTACT_LABELS,
  CONTACT_LABEL_VALUES,
  CUSTOM_LINK_TYPES,
  DIGITAL_PROFILE_PLATFORMS,
  PREFERRED_RESPONSE_METHODS,
} from "../app/lib/business/constants";
import { validateContact, validateCustomLink, validatePreferredResponseMethod } from "../app/lib/business/validation";
import { formatUsPhoneForDisplay, isPlatformHomepageOnly } from "../app/(site)/dashboard/business-tools/onboarding/_steps/Step6ContactsProfiles";

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

console.log("Business Identity contact foundation (Gate BCO-3R-B.2) — focused tests\n");

// --- contact labels (7 values, ES/EN, safe migration of "support") -----------------------------
check("CONTACT_LABEL_VALUES: exactly the 7 approved values, customer_service replaces support", () => {
  assert.deepEqual([...CONTACT_LABEL_VALUES].sort(), ["billing", "booking", "customer_service", "main", "other", "quotes", "sales"].sort());
  assert.ok(!(CONTACT_LABEL_VALUES as readonly string[]).includes("support"), "old 'support' value must not remain selectable");
});
check("CONTACT_LABELS: every label has a non-empty ES and EN label", () => {
  for (const l of CONTACT_LABELS) {
    assert.ok(l.es.trim().length > 0, `${l.value} missing es`);
    assert.ok(l.en.trim().length > 0, `${l.value} missing en`);
  }
});

// --- contact capabilities ------------------------------------------------------------------------
check("CONTACT_CAPABILITY_VALUES: exactly calls/sms/whatsapp", () => {
  assert.deepEqual([...CONTACT_CAPABILITY_VALUES].sort(), ["calls", "sms", "whatsapp"]);
});
check("CONTACT_CAPABILITIES: every capability has a non-empty ES and EN label", () => {
  for (const c of CONTACT_CAPABILITIES) {
    assert.ok(c.es.trim().length > 0, `${c.value} missing es`);
    assert.ok(c.en.trim().length > 0, `${c.value} missing en`);
  }
});
check("validateContact: capabilities pass through for a phone contact", () => {
  const r = validateContact({ contactType: "phone", rawValue: "4088021531", preferredChannel: false, channelKind: null, isPrimary: false, capabilities: ["calls", "whatsapp"] });
  assert.equal(r.ok, true);
  if (r.ok) assert.deepEqual([...r.value.capabilities].sort(), ["calls", "whatsapp"]);
});
check("validateContact: capabilities are silently dropped (not an error) for a non-phone contact", () => {
  const r = validateContact({ contactType: "email", rawValue: "owner@example.com", preferredChannel: false, channelKind: null, isPrimary: false, capabilities: ["calls"] });
  assert.equal(r.ok, true);
  if (r.ok) assert.deepEqual(r.value.capabilities, []);
});
check("validateContact: an invalid capability value is rejected for a phone contact", () => {
  const r = validateContact({ contactType: "phone", rawValue: "4088021531", preferredChannel: false, channelKind: null, isPrimary: false, capabilities: ["fax" as never] });
  assert.equal(r.ok, false);
});
check("validateContact: an invalid/empty phone value is rejected (never fabricates a number)", () => {
  const r = validateContact({ contactType: "phone", rawValue: "", preferredChannel: false, channelKind: null, isPrimary: false, capabilities: [] });
  assert.equal(r.ok, false);
});

// --- US / international phone display formatting --------------------------------------------------
check("formatUsPhoneForDisplay: bare 10-digit US number formats, international numbers are preserved untouched", () => {
  assert.equal(formatUsPhoneForDisplay("4088021531"), "(408) 802-1531");
  assert.equal(formatUsPhoneForDisplay("+525512345678"), "+525512345678"); // Mexico, has its own country code — never assumed US
  assert.equal(formatUsPhoneForDisplay("+442071234567"), "+442071234567"); // UK
});

// --- preferred response method compatibility ------------------------------------------------------
const phoneWithCalls = { contactType: "phone", capabilities: ["calls"] };
const phoneWithWhatsapp = { contactType: "phone", capabilities: ["whatsapp"] };
const phoneWithSms = { contactType: "phone", capabilities: ["sms"] };
const emailContact = { contactType: "email", capabilities: [] };

check("validatePreferredResponseMethod: null method always passes (no preference set)", () => {
  assert.equal(validatePreferredResponseMethod({ method: null, contacts: [] }).ok, true);
});
check("validatePreferredResponseMethod: each method matches its compatible contact", () => {
  assert.equal(validatePreferredResponseMethod({ method: "phone_call", contacts: [phoneWithCalls] }).ok, true);
  assert.equal(validatePreferredResponseMethod({ method: "whatsapp", contacts: [phoneWithWhatsapp] }).ok, true);
  assert.equal(validatePreferredResponseMethod({ method: "sms", contacts: [phoneWithSms] }).ok, true);
  assert.equal(validatePreferredResponseMethod({ method: "email", contacts: [emailContact] }).ok, true);
});
check("validatePreferredResponseMethod: rejects a method with no matching/capable contact", () => {
  assert.equal(validatePreferredResponseMethod({ method: "whatsapp", contacts: [phoneWithCalls] }).ok, false);
  assert.equal(validatePreferredResponseMethod({ method: "email", contacts: [phoneWithCalls] }).ok, false);
  assert.equal(validatePreferredResponseMethod({ method: "sms", contacts: [] }).ok, false);
});
check("PREFERRED_RESPONSE_METHODS: exactly whatsapp/phone_call/sms/email, all labeled", () => {
  assert.deepEqual(
    PREFERRED_RESPONSE_METHODS.map((m) => m.value).sort(),
    ["email", "phone_call", "sms", "whatsapp"],
  );
  for (const m of PREFERRED_RESPONSE_METHODS) {
    assert.ok(m.es.trim().length > 0);
    assert.ok(m.en.trim().length > 0);
  }
});

// --- digital profiles: Snapchat, Pinterest ----------------------------------------------------
check("DIGITAL_PROFILE_PLATFORMS: includes snapchat and pinterest with ES/EN labels", () => {
  const snap = DIGITAL_PROFILE_PLATFORMS.find((p) => p.value === "snapchat");
  const pin = DIGITAL_PROFILE_PLATFORMS.find((p) => p.value === "pinterest");
  assert.ok(snap && snap.es.trim().length > 0 && snap.en.trim().length > 0);
  assert.ok(pin && pin.es.trim().length > 0 && pin.en.trim().length > 0);
});
check("isPlatformHomepageOnly: flags bare Snapchat/Pinterest homepages", () => {
  assert.equal(isPlatformHomepageOnly("snapchat", "snapchat.com"), true);
  assert.equal(isPlatformHomepageOnly("snapchat", "https://www.snapchat.com/add/mynegocio"), false);
  assert.equal(isPlatformHomepageOnly("pinterest", "pinterest.com"), true);
  assert.equal(isPlatformHomepageOnly("pinterest", "https://pinterest.com/mynegocio"), false);
});

// --- custom business links ----------------------------------------------------------------------
check("CUSTOM_LINK_TYPES: exactly the 7 approved types, all labeled ES/EN", () => {
  assert.deepEqual(
    CUSTOM_LINK_TYPES.map((t) => t.value).sort(),
    ["booking", "menu_catalog", "order_online", "other", "portfolio", "request_quote", "reviews"],
  );
  for (const t of CUSTOM_LINK_TYPES) {
    assert.ok(t.es.trim().length > 0);
    assert.ok(t.en.trim().length > 0);
  }
});
check("validateCustomLink: every non-'other' type accepts a valid URL without requiring a custom label", () => {
  for (const t of CUSTOM_LINK_TYPES.filter((o) => o.value !== "other")) {
    const r = validateCustomLink({ linkType: t.value, customLabel: null, rawUrl: "mynegocio.com/booking" });
    assert.equal(r.ok, true, `expected ${t.value} to validate`);
  }
});
check("validateCustomLink: 'other' requires a non-empty custom label", () => {
  const missing = validateCustomLink({ linkType: "other", customLabel: "", rawUrl: "mynegocio.com/x" });
  assert.equal(missing.ok, false);
  const present = validateCustomLink({ linkType: "other", customLabel: "Seasonal catalog", rawUrl: "mynegocio.com/x" });
  assert.equal(present.ok, true);
});
check("validateCustomLink: normalizes a bare domain to an https URL", () => {
  const r = validateCustomLink({ linkType: "booking", customLabel: null, rawUrl: "mynegocio.com/reservar" });
  assert.equal(r.ok, true);
  if (r.ok) {
    assert.equal(r.value.displayUrl, "https://mynegocio.com");
    assert.equal(r.value.normalizedUrl, "mynegocio.com");
  }
});
check("validateCustomLink: rejects a malformed URL rather than saving it raw", () => {
  const r = validateCustomLink({ linkType: "booking", customLabel: null, rawUrl: "not a url at all" });
  assert.equal(r.ok, false);
});
check("validateCustomLink: rejects an unknown link type", () => {
  const r = validateCustomLink({ linkType: "not_a_real_type", customLabel: null, rawUrl: "mynegocio.com" });
  assert.equal(r.ok, false);
});

// --- data dictionary completeness for v3 fields --------------------------------------------------
const dictPath = path.resolve(__dirname, "../docs/business-identity-data-dictionary-01.md");
const dictText = readFileSync(dictPath, "utf8");
const V3_FIELD_KEYS = ["capabilities", "preferredResponseMethod", "linkType", "customLabel", "displayUrl", "normalizedUrl", "sortOrder"];
check("data dictionary: every Gate BCO-3R-B.2 field key is documented", () => {
  const missing = V3_FIELD_KEYS.filter((key) => !dictText.includes(`\`${key}\``) && !dictText.includes(key));
  assert.deepEqual(missing, [], `missing field keys: ${missing.join(", ")}`);
});
check("data dictionary: business_custom_links table is documented", () => {
  assert.ok(dictText.includes("business_custom_links"));
});

// --- migration structural review (static — not executed against a live database) -----------------
const migrationPath = path.resolve(__dirname, "../supabase/migrations/20260718120000_business_identity_contact_foundation_v3.sql");
const migrationText = readFileSync(migrationPath, "utf8");
check("migration: finalize_business_identity_v3 is SECURITY DEFINER with a fixed search_path (same contract as v1/v2)", () => {
  assert.ok(migrationText.includes("SECURITY DEFINER"));
  assert.ok(migrationText.includes("SET search_path = public"));
});
check("migration: RPC requires an authenticated caller via auth.uid(), never a client-supplied id", () => {
  assert.ok(migrationText.includes("v_user_id uuid := auth.uid()"));
  assert.ok(migrationText.includes("requires an authenticated caller"));
});
check("migration: preferred_response_method is validated against entered contacts before any row is written", () => {
  const validationIdx = migrationText.indexOf("preferred_response_method does not match");
  const firstInsertIdx = migrationText.indexOf("INSERT INTO public.businesses");
  assert.ok(validationIdx > -1 && firstInsertIdx > -1 && validationIdx < firstInsertIdx, "preference validation must run before the first INSERT");
});
check("migration: draft deletion happens only after all writes, at the end of the function", () => {
  const draftDeleteIdx = migrationText.indexOf("DELETE FROM public.business_onboarding_drafts");
  const lastInsertIdx = migrationText.lastIndexOf("INSERT INTO public.business_custom_links");
  assert.ok(draftDeleteIdx > lastInsertIdx, "draft delete must come after custom-link inserts, not before");
});
check("migration: label remap (support -> customer_service) runs before the new CHECK constraint is added", () => {
  const updateIdx = migrationText.indexOf("UPDATE public.business_contacts SET label = 'customer_service'");
  const constraintIdx = migrationText.indexOf("business_contacts_label_chk CHECK (label IN ('main', 'sales', 'customer_service'");
  assert.ok(updateIdx > -1 && constraintIdx > -1 && updateIdx < constraintIdx, "existing 'support' rows must be remapped before the stricter CHECK could reject them");
});
check("migration: v1 and v2 finalize functions are not dropped or redefined (coexistence, not replacement)", () => {
  assert.ok(!migrationText.includes("DROP FUNCTION public.finalize_business_identity("));
  assert.ok(!migrationText.includes("DROP FUNCTION public.finalize_business_identity_v2"));
});

console.log(`\n${passed} check(s) passed.`);
if (process.exitCode) {
  console.error("\nSome checks FAILED.");
} else {
  console.log("\nAll checks passed.");
}
