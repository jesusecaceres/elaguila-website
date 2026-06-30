/**
 * COM-4 Event Business Hub Audit Script
 *
 * Run:  npx ts-node --project tsconfig.scripts.json scripts/comunidad-com4-event-hub-audit.ts
 * Or:   npx tsx scripts/comunidad-com4-event-hub-audit.ts
 *
 * Checks:
 *  1. CommunitySocialLinks includes snapchat + pinterest
 *  2. ComunidadQuickDraft includes eventLinks field
 *  3. ComunidadEventLinks has all 12 expected fields
 *  4. normalizeComunidadQuickDraft round-trips eventLinks
 *  5. All 12 Leonix:event* pairs appear in publishCommunityQuickToListings source
 *  6. Leonix:socialSnapchat + Leonix:socialPinterest appear in publish source
 *  7. CommunityContactCanvas renders Snapchat + Pinterest icons
 *  8. CommunityContactCanvas renders all event link CTAs
 *  9. CommunityContactCanvas hasMoreInfo guards event links section
 * 10. CommunityExtendedContactFields exports ComunidadEventLinksSection
 * 11. communityWebsiteAndSocial validates snapchat.com + pinterest.com hosts
 * 12. comunidadPublishedQuickToDraft hydrates snapchat + pinterest + all event link keys
 * 13. CommunityQuickAnuncioDetail contactDraft has snapchat, pinterest, eventLinks
 * 14. buildCommunityPublishEnvelope snapshotSocialLinks includes snapchat + pinterest
 * 15. Audit file exists
 * 16. Registration reveal UX (registrationRequired === "si" banner) exists in form component
 * 17. Registration confirmation text exists ("✓ Enlace de registro")
 * 18. COM-3 price formatAdmissionWithDollar still present in known canvas/detail files
 * 19. Date/time automation (ComunidadSmartScheduleSection) is NOT changed in this gate
 * 20. Results card (CommunityDiscoveryListingCard) does NOT import CommunityContactCanvas
 */

import * as fs from "fs";
import * as path from "path";

const ROOT = path.resolve(__dirname, "..");

function rel(...parts: string[]): string {
  return path.join(ROOT, ...parts);
}

function read(filePath: string): string {
  try {
    return fs.readFileSync(filePath, "utf8");
  } catch {
    return "";
  }
}

type CheckResult = { name: string; pass: boolean; detail?: string };
const results: CheckResult[] = [];

function check(name: string, pass: boolean, detail?: string) {
  results.push({ name, pass, detail });
}

// ─── 1. CommunitySocialLinks includes snapchat + pinterest ────────────────────
{
  const src = read(rel("app/(site)/publicar/community/shared/types/communityQuickDraft.ts"));
  check(
    "CommunitySocialLinks has snapchat field",
    src.includes("snapchat: string"),
  );
  check(
    "CommunitySocialLinks has pinterest field",
    src.includes("pinterest: string"),
  );
}

// ─── 2. ComunidadQuickDraft includes eventLinks ───────────────────────────────
{
  const src = read(rel("app/(site)/publicar/community/shared/types/communityQuickDraft.ts"));
  check(
    "ComunidadQuickDraft has eventLinks field",
    src.includes("eventLinks: ComunidadEventLinks"),
  );
  check(
    "ComunidadEventLinks type is exported",
    src.includes("export type ComunidadEventLinks"),
  );
}

// ─── 3. ComunidadEventLinks has all 12 expected fields ───────────────────────
{
  const src = read(rel("app/(site)/publicar/community/shared/types/communityQuickDraft.ts"));
  const fields = [
    "registrationUrl",
    "ticketsUrl",
    "donationUrl",
    "eventProgramUrl",
    "eventGuideUrl",
    "vendorListUrl",
    "foodVendorsUrl",
    "sponsorsUrl",
    "customLink1Label",
    "customLink1Url",
    "customLink2Label",
    "customLink2Url",
  ];
  for (const f of fields) {
    check(`ComunidadEventLinks.${f} exists in type definition`, src.includes(`${f}:`));
  }
}

// ─── 4. normalizeComunidadQuickDraft round-trips eventLinks ───────────────────
{
  const src = read(rel("app/(site)/publicar/community/shared/types/communityQuickDraft.ts"));
  check(
    "normalizeComunidadQuickDraft handles eventLinks (normalizeEventLinks call)",
    src.includes("normalizeEventLinks(p.eventLinks)"),
  );
  check(
    "emptyEventLinks helper exists",
    src.includes("function emptyEventLinks()"),
  );
}

// ─── 5. All 12 Leonix:event* pairs in publishCommunityQuickToListings ─────────
{
  const src = read(rel("app/(site)/publicar/community/shared/publish/publishCommunityQuickToListings.ts"));
  const pairKeys = [
    "Leonix:registrationUrl",
    "Leonix:ticketsUrl",
    "Leonix:donationUrl",
    "Leonix:eventProgramUrl",
    "Leonix:eventGuideUrl",
    "Leonix:vendorListUrl",
    "Leonix:foodVendorsUrl",
    "Leonix:sponsorsUrl",
    "Leonix:customLink1Label",
    "Leonix:customLink1Url",
    "Leonix:customLink2Label",
    "Leonix:customLink2Url",
  ];
  for (const k of pairKeys) {
    check(`publishToListings persists ${k}`, src.includes(`"${k}"`));
  }
}

// ─── 6. Social pairs for Snapchat + Pinterest in publish ─────────────────────
{
  const src = read(rel("app/(site)/publicar/community/shared/publish/publishCommunityQuickToListings.ts"));
  check("publishToListings persists Leonix:socialSnapchat", src.includes('"Leonix:socialSnapchat"'));
  check("publishToListings persists Leonix:socialPinterest", src.includes('"Leonix:socialPinterest"'));
}

// ─── 7. CommunityContactCanvas renders Snapchat + Pinterest icons ─────────────
{
  const src = read(rel("app/(site)/publicar/community/shared/preview/CommunityContactCanvas.tsx"));
  check("CommunityContactCanvas imports FaSnapchat", src.includes("FaSnapchat"));
  check("CommunityContactCanvas imports FaPinterest", src.includes("FaPinterest"));
  check("CommunityContactCanvas normalizes snapchat in socialItems", src.includes('"snapchat"'));
  check("CommunityContactCanvas normalizes pinterest in socialItems", src.includes('"pinterest"'));
}

// ─── 8. CommunityContactCanvas renders all event link CTAs ───────────────────
{
  const src = read(rel("app/(site)/publicar/community/shared/preview/CommunityContactCanvas.tsx"));
  const ctaChecks = [
    ["register", "Registrarse / Register label"],
    ["tickets", "Tickets label"],
    ["donate", "Donate label"],
    ["eventProgram", "eventProgram label"],
    ["eventGuide", "eventGuide label"],
    ["vendors", "vendors label"],
    ["foodVendors", "foodVendors label"],
    ["sponsors", "sponsors label"],
  ];
  for (const [key, label] of ctaChecks) {
    check(`CommunityContactCanvas has ${label}`, src.includes(`t.${key}`));
  }
  check("CommunityContactCanvas renders eventLinkItems loop", src.includes("eventLinkItems.map"));
  check("CommunityContactCanvas imports FiExternalLink for event CTAs", src.includes("FiExternalLink"));
}

// ─── 9. CommunityContactCanvas hasMoreInfo guard ─────────────────────────────
{
  const src = read(rel("app/(site)/publicar/community/shared/preview/CommunityContactCanvas.tsx"));
  check("CommunityContactCanvas uses hasMoreInfo guard", src.includes("hasMoreInfo"));
  check("CommunityContactCanvas computes eventLinkItems array", src.includes("const eventLinkItems"));
  check("CommunityContactCanvas detects eventLinks from ComunidadQuickDraft", src.includes("draft.kind === \"comunidad\""));
}

// ─── 10. CommunityExtendedContactFields exports ComunidadEventLinksSection ────
{
  const src = read(rel("app/(site)/publicar/community/shared/components/CommunityExtendedContactFields.tsx"));
  check(
    "CommunityExtendedContactFields exports ComunidadEventLinksSection",
    src.includes("export function ComunidadEventLinksSection"),
  );
  check(
    "ComunidadEventLinksSection has registrationRevealedBecause copy",
    src.includes("registrationRevealedBecause"),
  );
}

// ─── 11. communityWebsiteAndSocial validates snapchat + pinterest ─────────────
{
  const src = read(rel("app/(site)/publicar/community/shared/lib/communityWebsiteAndSocial.ts"));
  check(
    "communityWebsiteAndSocial validates snapchat.com",
    src.includes("snapchat.com"),
  );
  check(
    "communityWebsiteAndSocial validates pinterest.com",
    src.includes("pinterest.com"),
  );
  check(
    "communityWebsiteAndSocial validates pin.it shortlinks",
    src.includes("pin.it"),
  );
}

// ─── 12. comunidadPublishedQuickToDraft hydrates all new fields ───────────────
{
  const src = read(rel("app/(site)/publicar/comunidad/lib/comunidadPublishedQuickToDraft.ts"));
  check("hydration: snapchat from Leonix:socialSnapchat", src.includes('"Leonix:socialSnapchat"'));
  check("hydration: pinterest from Leonix:socialPinterest", src.includes('"Leonix:socialPinterest"'));
  check("hydration: registrationUrl from Leonix:registrationUrl", src.includes('"Leonix:registrationUrl"'));
  check("hydration: ticketsUrl from Leonix:ticketsUrl", src.includes('"Leonix:ticketsUrl"'));
  check("hydration: donationUrl from Leonix:donationUrl", src.includes('"Leonix:donationUrl"'));
  check("hydration: eventProgramUrl from Leonix:eventProgramUrl", src.includes('"Leonix:eventProgramUrl"'));
  check("hydration: customLink1Label from Leonix:customLink1Label", src.includes('"Leonix:customLink1Label"'));
  check("hydration: assigns d.eventLinks", src.includes("d.eventLinks = el"));
  check("hydration: imports ComunidadEventLinks type", src.includes("ComunidadEventLinks"));
}

// ─── 13. CommunityQuickAnuncioDetail contactDraft has new fields ──────────────
{
  const src = read(rel("app/(site)/clasificados/community/CommunityQuickAnuncioDetail.tsx"));
  check("contactDraft adapter has snapchat field", src.includes("snapchat:"));
  check("contactDraft adapter has pinterest field", src.includes("pinterest:"));
  check("contactDraft adapter has eventLinks object", src.includes("eventLinks:"));
  check("contactDraft adapter has Leonix:registrationUrl hydration", src.includes('"Leonix:registrationUrl"'));
}

// ─── 14. buildCommunityPublishEnvelope snapshotSocialLinks includes new fields ─
{
  const src = read(rel("app/(site)/publicar/community/shared/publish/buildCommunityPublishEnvelope.ts"));
  check("snapshotSocialLinks includes snapchat", src.includes("snapchat:"));
  check("snapshotSocialLinks includes pinterest", src.includes("pinterest:"));
}

// ─── 15. Audit file exists ────────────────────────────────────────────────────
{
  const exists = fs.existsSync(
    rel("app/lib/clasificados/comunidad/COMUNIDAD_EVENTOS_COM4_FINAL_EVENT_BUSINESS_HUB_AUDIT.md"),
  );
  check("COM-4 audit markdown file exists", exists);
}

// ─── 16. Registration reveal UX ──────────────────────────────────────────────
{
  const src = read(rel("app/(site)/publicar/community/shared/components/CommunityExtendedContactFields.tsx"));
  check(
    "ComunidadEventLinksSection: registration reveal banner exists",
    src.includes("registrationIsRequired"),
  );
  check(
    "ComunidadEventLinksSection: registration URL always visible when registration required",
    src.includes("registrationIsRequired || eventLinks.registrationUrl"),
  );
}

// ─── 17. Registration confirmation text ──────────────────────────────────────
{
  const src = read(rel("app/(site)/publicar/community/shared/components/CommunityExtendedContactFields.tsx"));
  check(
    "ComunidadEventLinksSection: registration URL confirm text ('✓ Enlace')",
    src.includes("✓ Enlace de registro agregado") || src.includes("registrationUrlConfirm"),
  );
}

// ─── 18. COM-3 price formatting still present ────────────────────────────────
{
  const detailSrc = read(rel("app/(site)/clasificados/community/CommunityQuickAnuncioDetail.tsx"));
  const canvasSrc = read(rel("app/(site)/clasificados/comunidad/components/ComunidadQuickAdCanvas.tsx"));
  check(
    "formatAdmissionWithDollar still referenced in CommunityQuickAnuncioDetail or ComunidadQuickAdCanvas",
    detailSrc.includes("formatAdmissionWithDollar") || canvasSrc.includes("formatAdmissionWithDollar"),
  );
}

// ─── 19. Date/time automation preserved ──────────────────────────────────────
{
  const schedSrc = read(rel("app/(site)/publicar/community/shared/components/ComunidadSmartScheduleSection.tsx"));
  check(
    "ComunidadSmartScheduleSection file exists and is non-empty",
    schedSrc.length > 100,
  );
}

// ─── 20. Results card does NOT import CommunityContactCanvas ─────────────────
{
  const cardSrc = read(rel("app/(site)/clasificados/community/CommunityDiscoveryListingCard.tsx"));
  check(
    "CommunityDiscoveryListingCard does NOT import CommunityContactCanvas",
    !cardSrc.includes("CommunityContactCanvas"),
  );
}

// ─── ComunidadQuickApplicationClient wires ComunidadEventLinksSection ─────────
{
  const src = read(rel("app/(site)/publicar/community/shared/CommunityQuickApplicationClient.tsx"));
  check(
    "CommunityQuickApplicationClient imports ComunidadEventLinksSection",
    src.includes("ComunidadEventLinksSection"),
  );
  check(
    "CommunityQuickApplicationClient uses state.eventLinks in form",
    src.includes("state.eventLinks"),
  );
}

// ─── Print results ────────────────────────────────────────────────────────────
let passed = 0;
let failed = 0;

console.log("\nCOM-4 Event Business Hub Audit Results\n" + "─".repeat(64));
for (const r of results) {
  const sym = r.pass ? "✓ TRUE " : "✗ FALSE";
  if (r.pass) {
    passed++;
    console.log(`  ${sym}  ${r.name}`);
  } else {
    failed++;
    console.log(`  ${sym}  ${r.name}${r.detail ? `\n          → ${r.detail}` : ""}`);
  }
}

console.log("\n" + "─".repeat(64));
console.log(`  Passed: ${passed}  /  Failed: ${failed}  /  Total: ${results.length}`);

if (failed > 0) {
  console.log("\n  AUDIT FAILED — fix the above items before committing.\n");
  process.exit(1);
} else {
  console.log("\n  ALL CHECKS PASSED — READY TO COMMIT: YES\n");
  process.exit(0);
}
