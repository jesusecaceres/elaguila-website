/**
 * Servicios Final Phone Destination Closeout (2026-09-17) — Gate 4 (Contact & Location section).
 *
 * ServiciosBusinessHubContactCard now exposes Llamar (principal) AND Llamar oficina (office) as two
 * genuinely independent contactActions entries — never one replacing the other — deduped only when
 * they resolve to the literal same number. Mensaje/WhatsApp/Correo are unchanged.
 *
 * Run: node node_modules/tsx/dist/cli.mjs scripts/verify-servicios-business-hub-contact-matrix.ts
 */
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { resolveServiciosProfile } from "../app/(site)/servicios/lib/resolveServiciosProfile";
import { normalizeServiciosPhoneForCompare } from "../app/(site)/servicios/lib/serviciosContactActions";
import type { ServiciosBusinessProfile } from "../app/(site)/servicios/types/serviciosBusinessProfile";

const failures: string[] = [];
function check(name: string, fn: () => void) {
  try {
    fn();
    console.log(`OK: ${name}`);
  } catch (e) {
    failures.push(`${name}: ${e instanceof Error ? e.message : String(e)}`);
    console.error(`FAIL: ${name}\n  ${e instanceof Error ? e.message : String(e)}`);
  }
}
const raw = (rel: string) => readFileSync(new URL(`../${rel}`, import.meta.url), "utf8").replace(/\r\n/g, "\n");

const HUB_CARD = "app/(site)/servicios/components/ServiciosBusinessHubContactCard.tsx";

check("SOURCE BINDING: openCall/openOfficeCall are two independent handlers, each firing cta_call_click for its own destination", () => {
  const src = raw(HUB_CARD);
  const callFnStart = src.indexOf("const openCall = () => {");
  const callFnEnd = src.indexOf("};", callFnStart);
  const callBody = src.slice(callFnStart, callFnEnd);
  assert.ok(callBody.includes("callTel"), "openCall must use the principal callTel");

  const officeFnStart = src.indexOf("const openOfficeCall = () => {");
  const officeFnEnd = src.indexOf("};", officeFnStart);
  const officeBody = src.slice(officeFnStart, officeFnEnd);
  assert.ok(officeBody.includes("officeCallTel"), "openOfficeCall must use the distinct officeCallTel");
  assert.ok(officeBody.includes('"cta_call_click"'), "office call must fire the same existing event type, not a new one");
});
check("SOURCE BINDING: both Llamar and Llamar oficina are pushed into contactActions when both resolve — no replacement", () => {
  const src = raw(HUB_CARD);
  const callPushIdx = src.indexOf('if (callTel) {\n    contactActions.push({\n      id: "call",');
  const officePushIdx = src.indexOf('if (showOfficeCall) {\n    contactActions.push({\n      id: "callOffice",');
  assert.ok(callPushIdx > 0, "principal call push block not found");
  assert.ok(officePushIdx > 0, "office call push block not found");
});
check("SOURCE BINDING: the adaptive contactActions grid (gridContactActions) still excludes only the principal 'call' id, so callOffice naturally joins Message/WhatsApp/Correo in the existing adaptive grid", () => {
  const src = raw(HUB_CARD);
  assert.ok(src.includes('const gridContactActions = contactActions.filter((a) => a.id !== "call");'));
});

type Wire = ServiciosBusinessProfile;
function wire(overrides: Partial<Wire["contact"]>): Wire {
  return {
    identity: { slug: "fixture-biz", businessName: "Fixture Business" },
    hero: {},
    contact: { ...overrides },
    quickFacts: [],
    services: [],
    gallery: [],
  } as unknown as Wire;
}

function predictHubCalls(w: Wire): { call: boolean; callOffice: boolean } {
  const profile = resolveServiciosProfile(w, "es");
  const principalTel = profile.contact.phoneTelHref?.trim();
  const officeTel = profile.contact.phoneOfficeTelHref?.trim();
  const officeDisplay = profile.contact.phoneOfficeDisplay?.trim();
  const sameCallNumber = Boolean(
    principalTel && officeTel && normalizeServiciosPhoneForCompare(principalTel) === normalizeServiciosPhoneForCompare(officeTel),
  );
  return { call: Boolean(principalTel), callOffice: Boolean(officeTel && officeDisplay && !sameCallNumber) };
}

const PRINCIPAL = "5551234567";
const OFFICE = "5559876543";

check("Llamar and Llamar oficina both render when both distinct numbers exist", () => {
  assert.deepEqual(predictHubCalls(wire({ phone: PRINCIPAL, phoneOffice: OFFICE })), { call: true, callOffice: true });
});
check("Llamar alone when only principal exists", () => {
  assert.deepEqual(predictHubCalls(wire({ phone: PRINCIPAL })), { call: true, callOffice: false });
});
check("Llamar oficina alone when only office exists", () => {
  assert.deepEqual(predictHubCalls(wire({ phoneOffice: OFFICE })), { call: false, callOffice: true });
});
check("dedup: identical normalized numbers collapse to Llamar only", () => {
  assert.deepEqual(predictHubCalls(wire({ phone: PRINCIPAL, phoneOffice: "(555) 123-4567" })), { call: true, callOffice: false });
});
check("neither destination when neither phone exists", () => {
  assert.deepEqual(predictHubCalls(wire({})), { call: false, callOffice: false });
});

if (failures.length) {
  console.error(`\nverify-servicios-business-hub-contact-matrix: ${failures.length} failure(s):\n- ${failures.join("\n- ")}`);
  process.exit(1);
}
console.log("\nverify-servicios-business-hub-contact-matrix: PASS");
