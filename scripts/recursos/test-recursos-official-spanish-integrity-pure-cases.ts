/**
 * Existing Resource Official-Spanish Bridge (Gate ES-9) — pure behavioral tests for
 * checkOfficialSpanishFieldIntegrity and isHighRiskResourceForTranslation. Both modules under
 * test are pure (no "server-only", no DB, no network) — genuinely executed, not just regex-
 * matched against source text. Run with:
 *   npx tsx scripts/recursos/test-recursos-official-spanish-integrity-pure-cases.ts
 *
 * prepareOfficialSpanishProposals.ts itself imports "server-only" (throws outside a Next.js
 * server context — confirmed experimentally: plain tsx execution throws
 * "This module cannot be imported from a Client Component module"), so its DB-touching
 * orchestration (idempotency, conflict detection, partial-field support, provenance writes) is
 * covered instead by static source assertions in verify-recursos-official-spanish-bridge.mjs,
 * matching this codebase's established split between pure-case tests and static verifiers.
 */
import { checkOfficialSpanishFieldIntegrity, type OfficialSpanishStructuredFacts } from "../../app/lib/recursos/intake/translation/translationIntegrityCheck";
import { isHighRiskResourceForTranslation } from "../../app/lib/recursos/intake/resourceChangeDetection";

const checks: { name: string; ok: boolean; detail?: unknown }[] = [];
function assert(name: string, ok: boolean, detail?: unknown) {
  checks.push({ name, ok, detail });
}

function baseFacts(overrides: Partial<OfficialSpanishStructuredFacts> = {}): OfficialSpanishStructuredFacts {
  return {
    phone: "(408) 555-1111",
    crisisPhone: null,
    sms: null,
    websiteUrl: "https://example.org/",
    applicationUrl: null,
    officialSourceUrl: "https://example.org/contact",
    email: "info@example.org",
    addressLine1: "1165 Lincoln Ave. Suite 300",
    addressZip: "95125",
    ageMin: null,
    ageMax: null,
    is24Hours: false,
    relatedVerifiedEnText: null,
    ...overrides,
  };
}

// 1. known structured phone -> PASS
{
  const facts = baseFacts();
  const result = checkOfficialSpanishFieldIntegrity(facts, "Llame al (408) 555-1111 para más información.");
  assert("known structured phone number in proposed ES text -> PASS", result.ok === true, result);
}

// 2. invented phone -> FAIL
{
  const facts = baseFacts();
  const result = checkOfficialSpanishFieldIntegrity(facts, "Llame al (408) 999-8888 para más información.");
  assert("invented phone number NOT on the resource's own facts -> FAIL", result.ok === false, result);
  if (!result.ok) assert("invented phone is named in the failure detail", result.invented.some((t) => t.startsWith("phone:")), result.invented);
}

// 3. supported numeric value (ageMin/ageMax) -> PASS
{
  const facts = baseFacts({ ageMin: 2, ageMax: 25 });
  const result = checkOfficialSpanishFieldIntegrity(facts, "Servicios disponibles para edades 2 a 25 años.");
  assert("numbers matching the resource's own ageMin/ageMax -> PASS", result.ok === true, result);
}

// 4. invented numeric token -> FAIL
// (777 is deliberately absent from every field of baseFacts(), including addressLine1's own
// "Suite 300" — picking a number that doesn't accidentally already appear in the address/phone/
// zip fixture is the whole point of this case.)
{
  const facts = baseFacts({ ageMin: 2, ageMax: 25 });
  const result = checkOfficialSpanishFieldIntegrity(facts, "Servicios disponibles para hasta 777 familias por año.");
  assert("a numeric value absent from every structured fact -> FAIL", result.ok === false, result);
  if (!result.ok) assert("invented number is named in the failure detail", result.invented.includes("number:777"), result.invented);
}

// 5. 24/7 claim when resource is24Hours=false -> FAIL
{
  const facts = baseFacts({ is24Hours: false });
  const result = checkOfficialSpanishFieldIntegrity(facts, "Disponible 24/7 para emergencias.");
  assert("24/7 claim when is24Hours=false -> FAIL", result.ok === false, result);
  if (!result.ok) assert("always-open is named in the failure detail", result.invented.includes("always-open"), result.invented);
}

// 6. 24/7 claim when resource is24Hours=true -> PASS (the truthful case must not be blocked by its own raw digits)
{
  const facts = baseFacts({ is24Hours: true });
  const result = checkOfficialSpanishFieldIntegrity(facts, "Disponible 24/7 para emergencias.");
  assert("24/7 claim when is24Hours=true (truthful) -> PASS", result.ok === true, result);
}

// 7. empty/blank proposed text -> PASS (nothing proposed, nothing to invent — never a false failure on an intentionally-omitted field)
{
  const facts = baseFacts();
  assert("null proposed text -> PASS (nothing to check)", checkOfficialSpanishFieldIntegrity(facts, null).ok === true);
  assert("blank/whitespace proposed text -> PASS (nothing to check)", checkOfficialSpanishFieldIntegrity(facts, "   ").ok === true);
}

// 8. URL/email supported by structured facts -> PASS; invented URL/email -> FAIL
{
  const facts = baseFacts();
  const passResult = checkOfficialSpanishFieldIntegrity(facts, "Visite https://example.org/ o escriba a info@example.org.");
  assert("website URL and email matching structured facts -> PASS", passResult.ok === true, passResult);
  const failResult = checkOfficialSpanishFieldIntegrity(facts, "Visite https://another-site.example/ para más información.");
  assert("URL absent from structured facts -> FAIL", failResult.ok === false, failResult);
}

// 9. secondary allowed source (relatedVerifiedEnText) — a number present only in the resource's own already-verified EN text is still allowed, never invented
{
  const facts = baseFacts({ relatedVerifiedEnText: "Open since 1998, serving over 500 families per year." });
  const result = checkOfficialSpanishFieldIntegrity(facts, "Sirviendo a más de 500 familias por año desde 1998.");
  assert("number present only in the resource's own verified EN text (not a structured field) -> PASS", result.ok === true, result);
}

// 10. isHighRiskResourceForTranslation — the REAL doctrine (category OR crisisPhone OR is24Hours), reused unmodified by prepareOfficialSpanishProposals's structural high-risk guard
{
  assert("urgent-safety category alone -> high-risk", isHighRiskResourceForTranslation({ primaryCategory: "urgent-safety", crisisPhone: null, is24Hours: false }) === true);
  assert("crisisPhone present alone -> high-risk (the exact gap that mis-scoped Momentum For Health earlier in this project)", isHighRiskResourceForTranslation({ primaryCategory: "mental-health-recovery", crisisPhone: "988", is24Hours: false }) === true);
  assert("is24Hours=true alone -> high-risk", isHighRiskResourceForTranslation({ primaryCategory: "community-support", crisisPhone: null, is24Hours: true }) === true);
  assert("none of the three -> NOT high-risk (eligible for the official-Spanish bridge)", isHighRiskResourceForTranslation({ primaryCategory: "jobs-training", crisisPhone: null, is24Hours: false }) === false);
}

let passCount = 0;
for (const c of checks) {
  console.log(`${c.ok ? "PASS" : "FAIL"} — ${c.name}${c.detail !== undefined && !c.ok ? ` (${JSON.stringify(c.detail)})` : ""}`);
  if (c.ok) passCount++;
}
console.log(`\n${passCount}/${checks.length} checks passed.`);
if (passCount !== checks.length) process.exitCode = 1;
