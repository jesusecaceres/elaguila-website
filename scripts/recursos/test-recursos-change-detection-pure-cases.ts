/**
 * Recursos Intake OS — Gate 5V pure edge-case tests for the field-comparison and matching
 * engines. No DB, no network — both modules under test are pure. Run with:
 *   npx tsx scripts/recursos/test-recursos-change-detection-pure-cases.ts
 */
import { detectResourceFieldChanges } from "../../app/lib/recursos/intake/resourceChangeDetection";
import { matchCandidateToExistingResource } from "../../app/lib/recursos/intake/matchCandidateToExistingResource";
import type { ResourceRecord } from "../../app/lib/recursos/types";
import type { UrlCandidateProposal } from "../../app/lib/recursos/intake/urlCandidateProposal";

const checks: { name: string; ok: boolean; detail?: unknown }[] = [];
function assert(name: string, ok: boolean, detail?: unknown) {
  checks.push({ name, ok, detail });
}

function baseResource(overrides: Partial<ResourceRecord> = {}): ResourceRecord {
  return {
    id: "r1",
    slug: "test-org",
    organizationName: "Test Org",
    programName: null,
    organizationType: "nonprofit",
    shortDescriptionEs: "",
    shortDescriptionEn: "A test org.",
    detailsEs: null,
    detailsEn: null,
    primaryCategory: "community-support",
    secondaryCategories: [],
    urgencyLevel: "i-need-help",
    ageMin: null,
    ageMax: null,
    audienceTags: [],
    serviceTags: [],
    languages: ["English"],
    costModel: "free",
    eligibilityEs: null,
    eligibilityEn: null,
    serviceArea: "Santa Clara County",
    contact: {
      phone: "(408) 555-1111",
      crisisPhone: null,
      sms: null,
      whatsapp: null,
      email: null,
      websiteUrl: "https://example.org/",
      applicationUrl: null,
      address: { line1: "123 Main St", city: "San Jose", state: "CA", zip: "95112" },
      mapsSearchHref: null,
      hoursNoteEs: null,
      hoursNoteEn: null,
      weeklyHours: null,
      is24Hours: false,
    },
    verification: { officialSourceUrl: null, lastVerifiedAt: null, nextVerificationAt: null, verificationStatus: "verified", active: true },
    internal: { partnerStatus: "none", featured: false, printEligible: false, internalNotes: null },
    ...overrides,
  } as ResourceRecord;
}

function baseProposal(overrides: Partial<UrlCandidateProposal> = {}): UrlCandidateProposal {
  return {
    organizationName: "Test Org",
    programName: null,
    organizationType: "nonprofit",
    suggestedDescriptionEn: null,
    suggestedPrimaryCategory: "community-support",
    suggestedUrgencyLevel: "i-need-help",
    phone: "408-555-1111",
    crisisPhone: null,
    sms: null,
    email: null,
    websiteUrl: "https://example.org",
    addressLine1: null,
    addressCity: null,
    addressState: null,
    addressZip: null,
    addressWithheldForSafety: false,
    serviceArea: null,
    eligibilityEn: null,
    languages: [],
    costModel: null,
    hoursNoteEn: null,
    is24Hours: false,
    officialSourceUrl: "https://example.org",
    confidenceNote: null,
    ...overrides,
  };
}

// 1. same phone, different formatting -> unchanged
{
  const changes = detectResourceFieldChanges(baseProposal({ phone: "(408) 555-1111" }), baseResource());
  assert("same phone different formatting = unchanged", changes.length === 0, changes);
}

// 2. same URL, trailing slash -> unchanged
{
  const changes = detectResourceFieldChanges(baseProposal({ websiteUrl: "https://example.org/" }), baseResource());
  assert("same URL trailing slash = unchanged", !changes.some((c) => c.field === "websiteUrl"), changes);
}

// 3. null vs empty proposal value -> never proposed (treated as "no info", not a change)
{
  const changes = detectResourceFieldChanges(baseProposal({ email: null }), baseResource({ contact: { ...baseResource().contact, email: null } }));
  assert("null vs empty (both absent) = unchanged", !changes.some((c) => c.field === "email"), changes);
}

// 4. actual phone change -> proposal
{
  const changes = detectResourceFieldChanges(baseProposal({ phone: "408-555-2222" }), baseResource());
  const phoneChange = changes.find((c) => c.field === "phone");
  assert("actual phone change = proposal generated", Boolean(phoneChange) && phoneChange!.oldValue === "(408) 555-1111" && phoneChange!.proposedValue === "408-555-2222", changes);
}

// 5. actual website domain change -> proposal
{
  const changes = detectResourceFieldChanges(baseProposal({ websiteUrl: "https://newdomain.org" }), baseResource());
  assert("actual website domain change = proposal generated", changes.some((c) => c.field === "websiteUrl"), changes);
}

// 6. is24Hours change -> safety-sensitive
{
  const changes = detectResourceFieldChanges(baseProposal({ is24Hours: true }), baseResource());
  const c = changes.find((c) => c.field === "is24Hours");
  assert("is24Hours change is safety-sensitive", Boolean(c) && c!.safetySensitive === true, changes);
}

// 7. address change -> safety-sensitive
{
  const changes = detectResourceFieldChanges(baseProposal({ addressLine1: "456 Other Ave", addressZip: "95113" }), baseResource());
  const c = changes.find((c) => c.field === "addressLine1");
  assert("address change is safety-sensitive", Boolean(c) && c!.safetySensitive === true, changes);
}

// 8. duplicate candidate match (two resources share exact domain) -> POSSIBLE_DUPLICATE
{
  const r1 = baseResource({ id: "r1", organizationName: "Org One" });
  const r2 = baseResource({ id: "r2", organizationName: "Org Two" });
  const match = matchCandidateToExistingResource({ organizationName: "Some New Org", websiteUrl: "https://example.org", phone: null, crisisPhone: null }, [r1, r2]);
  assert("multiple exact domain matches = POSSIBLE_DUPLICATE", match.classification === "POSSIBLE_DUPLICATE", match);
}

// 9. exact single domain match -> EXISTING_RESOURCE_UPDATE, not silently NEW
{
  const r1 = baseResource({ id: "r1", organizationName: "Org One" });
  const match = matchCandidateToExistingResource({ organizationName: "Org One Renamed", websiteUrl: "https://example.org", phone: null, crisisPhone: null }, [r1]);
  assert("exact single domain match = EXISTING_RESOURCE_UPDATE", match.classification === "EXISTING_RESOURCE_UPDATE" && match.matchedResourceId === "r1", match);
}

// 10. genuinely no signal match -> NEW
{
  const r1 = baseResource({ id: "r1" });
  const match = matchCandidateToExistingResource({ organizationName: "Totally Different Org", websiteUrl: "https://unrelated.org", phone: "555-000-9999", crisisPhone: null }, [r1]);
  assert("no exact signal match = NEW", match.classification === "NEW", match);
}

let passCount = 0;
for (const c of checks) {
  console.log(`${c.ok ? "PASS" : "FAIL"} — ${c.name}${c.detail !== undefined && !c.ok ? ` (${JSON.stringify(c.detail)})` : ""}`);
  if (c.ok) passCount++;
}
console.log(`\n${passCount}/${checks.length} checks passed.`);
if (passCount !== checks.length) process.exitCode = 1;
