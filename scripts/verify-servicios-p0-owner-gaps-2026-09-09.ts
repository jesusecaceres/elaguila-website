/**
 * Globalization Full Program Integration Enforcement — Servicios P0 owner-visible gap fixes.
 *
 * Proves, at the source level, the 6 real defects found by rigorous end-to-end tracing of
 * Servicios (the proven live owner-QA category) against current HEAD:
 *
 *   1. G47 dashboard-edit data loss — Quick Facts silently wiped on every edit.
 *   2. G47 dashboard-edit data loss — "Reasons to choose you" lost + mis-routed into Business
 *      Highlights.
 *   3. G16 WhatsApp — Servicios' own normalizer now delegates to the shared international-safe
 *      module instead of maintaining a parallel copy.
 *   4. G15 Websites/Socials — "Additional websites" list now actually renders on the public page,
 *      not just persisted-and-discarded.
 *   5. G14 Hours/Open Now — the live public page computes a real open/closed status instead of
 *      a publish-time-frozen static "Today" label.
 *   6. G23 Address Verifier — the shared BusinessAddressVerifiedInput picker is actually mounted
 *      in the Servicios application form, with a full round-trip (state -> draft -> wire type ->
 *      persistence -> reverse mapper) for verificationStatus/provider/providerPlaceId.
 *
 * Source-level checks only (string/AST-light inspection of the real files) — these are NOT a
 * substitute for the owner's browser QA re-run, which remains OWNER_QA_REQUIRED.
 */
import { readFileSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
let pass = 0;
let fail = 0;

function read(rel: string): string {
  return readFileSync(path.join(ROOT, rel), "utf8");
}

function check(label: string, condition: boolean): void {
  if (condition) {
    pass += 1;
    console.log(`  ok  - ${label}`);
  } else {
    fail += 1;
    console.error(`  FAIL - ${label}`);
  }
}

console.log("verify-servicios-p0-owner-gaps-2026-09-09: starting");

// --- 1/2: reverse-mapper data-loss fixes ---
const reverse = read(
  "app/(site)/clasificados/publicar/servicios/lib/serviciosPublishedToApplicationDraft.ts",
);
check(
  "REASONS 1: mapSelectedBusinessHighlightIds no longer merges profile.trust into the wrong field",
  /function mapSelectedBusinessHighlightIds[\s\S]{0,300}/.exec(reverse)![0].includes("profile?.businessHighlights") &&
    !/function mapSelectedBusinessHighlightIds[\s\S]{0,400}/.exec(reverse)![0].includes("profile?.trust"),
);
check(
  "REASONS 2: a dedicated mapSelectedReasonIds function restores preset reasons via the trust_ prefix",
  reverse.includes("function mapSelectedReasonIds") && reverse.includes('/^trust_(.+)$/'),
);
check(
  "REASONS 3: mapCustomReason restores the single custom_reason entry",
  reverse.includes("function mapCustomReason") && reverse.includes('"custom_reason"'),
);
check(
  "REASONS 4: returned state actually sets selectedReasonIds/customReasonLabel/customReasonIncluded",
  reverse.includes("selectedReasonIds: mapSelectedReasonIds(profile, businessTypeId)") &&
    reverse.includes("customReasonLabel: mapCustomReason(profile).label") &&
    reverse.includes("customReasonIncluded: mapCustomReason(profile).included"),
);
check(
  "QUICKFACTS 1: mapCustomQuickFacts function exists and reads profile.quickFacts",
  reverse.includes("function mapCustomQuickFacts") && reverse.includes("profile?.quickFacts"),
);
check(
  "QUICKFACTS 2: returned state actually sets customQuickFacts (previously never set at all)",
  reverse.includes("customQuickFacts: mapCustomQuickFacts(profile)"),
);

// --- 3: WhatsApp consolidation ---
const wa = read("app/(site)/servicios/lib/serviciosWhatsAppHref.ts");
check(
  "WHATSAPP 1: normalizeServiciosWhatsAppDigits delegates to the shared international-safe module",
  wa.includes('from "@/app/lib/whatsapp/internationalWhatsApp"') &&
    /function normalizeServiciosWhatsAppDigits[\s\S]{0,120}return normalizeInternationalWhatsAppDigits\(raw\);/.test(
      wa,
    ),
);
check(
  "WHATSAPP 2: no duplicate ad-hoc digit-strip regex logic remains in the Servicios-owned normalizer",
  !/let d = stripServiciosWhatsAppDigits/.test(wa),
);

// --- 4: Additional Websites rendering ---
const contactMap = read("app/(site)/servicios/lib/mapServiciosProfileToBusinessHubContact.ts");
check(
  "ADDITIONALWEBSITES 1: mapServiciosProfileToBusinessHubContact now reads profile.contact.additionalWebsites",
  contactMap.includes("profile.contact.additionalWebsites"),
);
check(
  "ADDITIONALWEBSITES 2: pushed into moreLinks, the same array the live Contact Card renders",
  /for \(const row of profile\.contact\.additionalWebsites[\s\S]{0,200}moreLinks\.push/.test(contactMap),
);

// --- 5: Hours/Open Now real computation ---
const hoursComponent = read("app/(site)/servicios/components/ServiciosHours.tsx");
check(
  "HOURS 1: ServiciosHours imports the real open/closed computation function",
  hoursComponent.includes('import { buildServiciosHeroHoursPill } from "./serviciosHeroHoursStatus"'),
);
check(
  "HOURS 2: the live pill badge now renders the computed pillText, not the frozen openNowLabel",
  hoursComponent.includes("const pill = buildServiciosHeroHoursPill(hours, lang)") &&
    hoursComponent.includes("{pillText ? (") &&
    !/\{hours\.openNowLabel \? \(/.test(hoursComponent),
);

// --- 6: Address verifier mount + round-trip ---
const applicationForm = read(
  "app/(site)/clasificados/publicar/servicios/components/ClasificadosServiciosApplication.tsx",
);
check(
  "ADDRESSVERIFIER 1: BusinessAddressVerifiedInput is imported and actually rendered in the Servicios application",
  applicationForm.includes('import { BusinessAddressVerifiedInput } from "@/app/components/forms/BusinessAddressVerifiedInput"') &&
    applicationForm.includes("<BusinessAddressVerifiedInput"),
);
check(
  "ADDRESSVERIFIER 2: a real suggestion pick (user_confirmed) auto-fills city/region/postal/country",
  /verificationStatus === "user_confirmed"[\s\S]{0,300}physicalAddressCity: next\.city/.test(applicationForm),
);

const draftType = read("app/(site)/clasificados/publicar/servicios/lib/clasificadosServiciosApplicationTypes.ts");
check(
  "ADDRESSVERIFIER 3: application state type carries verification metadata",
  draftType.includes("physicalVerificationStatus:") &&
    draftType.includes("physicalProvider: string | null") &&
    draftType.includes("physicalProviderPlaceId: string | null"),
);

const normalize = read(
  "app/(site)/clasificados/publicar/servicios/lib/clasificadosServiciosApplicationNormalize.ts",
);
check(
  "ADDRESSVERIFIER 4: the allowlist normalizer does not silently drop verification metadata on every publish (the exact class of bug this file structurally invites)",
  normalize.includes("physicalVerificationStatus:") && normalize.includes("physicalProvider:"),
);

const draftMapper = read(
  "app/(site)/clasificados/publicar/servicios/lib/mapClasificadosServiciosApplicationToServiciosDraft.ts",
);
check(
  "ADDRESSVERIFIER 5: state -> draft mapper carries verification metadata forward",
  draftMapper.includes("contact.physicalVerificationStatus = state.physicalVerificationStatus"),
);

const wireMapper = read("app/(site)/servicios/lib/mapServiciosApplicationDraftToBusinessProfile.ts");
check(
  "ADDRESSVERIFIER 6: draft -> persisted wire profile mapper carries verification metadata forward",
  wireMapper.includes("contact.physicalVerificationStatus = c.physicalVerificationStatus"),
);

const wireType = read("app/(site)/servicios/types/serviciosBusinessProfile.ts");
check(
  "ADDRESSVERIFIER 7: the persisted wire type declares the 3 new fields (no silent `any`/untyped write)",
  wireType.includes("physicalVerificationStatus?:") && wireType.includes("physicalProviderPlaceId?:"),
);
check(
  "ADDRESSVERIFIER 8: reverse mapper (dashboard edit hydration) restores verification metadata",
  reverse.includes("physicalVerificationStatus: contact.physicalVerificationStatus ?? \"unverified\""),
);

console.log(`\nverify-servicios-p0-owner-gaps-2026-09-09: ${pass}/${pass + fail} checks passed`);
if (fail > 0) process.exit(1);
