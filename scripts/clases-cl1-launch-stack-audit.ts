/**
 * CL-1 Audit Script — Clases Full Launch Stack
 *
 * Verifies all CL-1 gate requirements are present in the codebase.
 * Run with: npx tsx scripts/clases-cl1-launch-stack-audit.ts
 */

import * as fs from "fs";
import * as path from "path";

const ROOT = path.resolve(__dirname, "..");

let passed = 0;
let failed = 0;
const failures: string[] = [];

function check(label: string, condition: boolean): void {
  if (condition) {
    console.log(`  ✅  ${label}`);
    passed++;
  } else {
    console.error(`  ❌  ${label}`);
    failed++;
    failures.push(label);
  }
}

function readFile(rel: string): string {
  const abs = path.join(ROOT, rel);
  if (!fs.existsSync(abs)) return "";
  return fs.readFileSync(abs, "utf8");
}

function fileExists(rel: string): boolean {
  return fs.existsSync(path.join(ROOT, rel));
}

// ── A: Types ────────────────────────────────────────────────────────────────
console.log("\n── A: ClasesClassLinks type ──");
const draftTypes = readFile("app/(site)/publicar/community/shared/types/communityQuickDraft.ts");
check("ClasesClassLinks type exported", draftTypes.includes("export type ClasesClassLinks ="));
check("registrationUrl in ClasesClassLinks", draftTypes.includes("registrationUrl: string;") && draftTypes.includes("ClasesClassLinks"));
check("paymentUrl in ClasesClassLinks", draftTypes.includes("paymentUrl: string;"));
check("classMaterialsUrl in ClasesClassLinks", draftTypes.includes("classMaterialsUrl: string;"));
check("syllabusUrl in ClasesClassLinks", draftTypes.includes("syllabusUrl: string;"));
check("classGuideUrl in ClasesClassLinks", draftTypes.includes("classGuideUrl: string;"));
check("instructorPageUrl in ClasesClassLinks", draftTypes.includes("instructorPageUrl: string;"));
check("studentPortalUrl in ClasesClassLinks", draftTypes.includes("studentPortalUrl: string;"));
check("classLinks field in ClasesQuickDraft", draftTypes.includes("classLinks: ClasesClassLinks;"));
check("emptyClassLinks function defined", draftTypes.includes("function emptyClassLinks()"));
check("normalizeClassLinks function defined", draftTypes.includes("function normalizeClassLinks("));
check("emptyClasesQuickDraft includes classLinks", draftTypes.includes("classLinks: emptyClassLinks()"));
check("normalizeClasesQuickDraft includes classLinks", draftTypes.includes("classLinks: normalizeClassLinks("));

// ── B: Snapshot type ────────────────────────────────────────────────────────
console.log("\n── B: ClasesQuickPublishSnapshot ──");
const snapshots = readFile("app/(site)/publicar/community/shared/publish/communityPublishSnapshots.ts");
check("ClasesClassLinks imported in snapshots", snapshots.includes("ClasesClassLinks"));
check("classLinks in ClasesQuickPublishSnapshot", snapshots.includes("classLinks: ClasesClassLinks"));
check("addressLine2 in ClasesQuickPublishSnapshot", snapshots.includes("addressLine2: string;"));
check("country in ClasesQuickPublishSnapshot", snapshots.includes("country: string;"));

// ── C: Publish envelope builder ─────────────────────────────────────────────
console.log("\n── C: buildCommunityPublishEnvelope ──");
const envelope = readFile("app/(site)/publicar/community/shared/publish/buildCommunityPublishEnvelope.ts");
check("snapshotClassLinks function defined", envelope.includes("function snapshotClassLinks("));
check("classLinks: snapshotClassLinks in snapshot builder", envelope.includes("classLinks: snapshotClassLinks("));

// ── D: Persistence to detail_pairs ──────────────────────────────────────────
console.log("\n── D: Persistence (detail_pairs) ──");
const publish = readFile("app/(site)/publicar/community/shared/publish/publishCommunityQuickToListings.ts");
check("Leonix:clsRegistrationUrl pair persisted", publish.includes("Leonix:clsRegistrationUrl"));
check("Leonix:clsPaymentUrl pair persisted", publish.includes("Leonix:clsPaymentUrl"));
check("Leonix:clsMaterialsUrl pair persisted", publish.includes("Leonix:clsMaterialsUrl"));
check("Leonix:clsSyllabusUrl pair persisted", publish.includes("Leonix:clsSyllabusUrl"));
check("Leonix:clsGuideUrl pair persisted", publish.includes("Leonix:clsGuideUrl"));
check("Leonix:clsInstructorUrl pair persisted", publish.includes("Leonix:clsInstructorUrl"));
check("Leonix:clsStudentPortalUrl pair persisted", publish.includes("Leonix:clsStudentPortalUrl"));
check("Leonix:clsVendorsUrl pair persisted", publish.includes("Leonix:clsVendorsUrl"));
check("Leonix:clsFoodVendorsUrl pair persisted", publish.includes("Leonix:clsFoodVendorsUrl"));
check("Leonix:clsSponsorsUrl pair persisted", publish.includes("Leonix:clsSponsorsUrl"));
check("Leonix:clsCustom1Label pair persisted", publish.includes("Leonix:clsCustom1Label"));
check("Leonix:clsCustom2Label pair persisted", publish.includes("Leonix:clsCustom2Label"));

// ── E: Hydration in clasesPublishedQuickToDraft ──────────────────────────────
console.log("\n── E: Hydration (clasesPublishedQuickToDraft) ──");
const hydrate = readFile("app/(site)/publicar/clases/lib/clasesPublishedQuickToDraft.ts");
check("snapchat hydrated from pairs", hydrate.includes("Leonix:socialSnapchat"));
check("pinterest hydrated from pairs", hydrate.includes("Leonix:socialPinterest"));
check("clsRegistrationUrl hydrated", hydrate.includes("Leonix:clsRegistrationUrl"));
check("clsPaymentUrl hydrated", hydrate.includes("Leonix:clsPaymentUrl"));
check("clsMaterialsUrl hydrated", hydrate.includes("Leonix:clsMaterialsUrl"));
check("classLinks assigned on draft", hydrate.includes("d.classLinks = cl;"));

// ── F: contactDraft adapter (CommunityQuickAnuncioDetail) ────────────────────
console.log("\n── F: contactDraft adapter ──");
const adapter = readFile("app/(site)/clasificados/community/CommunityQuickAnuncioDetail.tsx");
check("classLinks object in contactDraft", adapter.includes("classLinks: {"));
check("Leonix:clsRegistrationUrl in adapter", adapter.includes("Leonix:clsRegistrationUrl"));
check("Leonix:clsPaymentUrl in adapter", adapter.includes("Leonix:clsPaymentUrl"));
check("Leonix:clsInstructorUrl in adapter", adapter.includes("Leonix:clsInstructorUrl"));
check("Leonix:clsCustom1Label in adapter", adapter.includes("Leonix:clsCustom1Label"));

// ── G: CommunityContactCanvas kind-awareness ─────────────────────────────────
console.log("\n── G: CommunityContactCanvas kind-awareness ──");
const canvas = readFile("app/(site)/publicar/community/shared/preview/CommunityContactCanvas.tsx");
check("UI_CLASES defined", canvas.includes("const UI_CLASES ="));
check("UI_COMUNIDAD defined", canvas.includes("const UI_COMUNIDAD ="));
check("contactTitle: Contacto del instructor (es)", canvas.includes("Contacto del instructor"));
check("locationTitle: Lugar de la clase (es)", canvas.includes("Lugar de la clase"));
check("moreTitle: Más información de la clase (es)", canvas.includes("M\u00e1s informaci\u00f3n de la clase"));
check("Instructor contact (en)", canvas.includes("Instructor contact"));
check("Class location (en)", canvas.includes("Class location"));
check("ClasesClassLinks imported in canvas", canvas.includes("ClasesClassLinks"));
check("classLinks const reads from draft", canvas.includes("draft.kind === \"clases\" ? (draft as ClasesQuickDraft).classLinks"));
check("classLinkItems array built", canvas.includes("const classLinkItems"));
check("allLinkItems used in render", canvas.includes("allLinkItems.map("));
check("register label for Clases (es)", canvas.includes("register: \"Registrarse\""));
check("pay label for Clases (es)", canvas.includes("pay: \"Pagar\""));
check("materials label (es)", canvas.includes("materials: \"Materiales\""));
check("syllabus label (es)", canvas.includes("syllabus: \"Programa / temario\""));
check("instructorPage label (es)", canvas.includes("instructorPage: \"P\u00e1gina del instructor\""));
check("studentPortal label (es)", canvas.includes("studentPortal: \"Portal del estudiante\""));

// ── H: Form — ClasesClassLinksSection ────────────────────────────────────────
console.log("\n── H: ClasesClassLinksSection form component ──");
const extFields = readFile("app/(site)/publicar/community/shared/components/CommunityExtendedContactFields.tsx");
check("ClasesClassLinks imported in extFields", extFields.includes("ClasesClassLinks"));
check("CLASS_LINKS_COPY constant defined", extFields.includes("const CLASS_LINKS_COPY"));
check("sectionTitle: 7. Enlaces útiles de la clase (es)", extFields.includes("7. Enlaces \u00fatiles de la clase"));
check("sectionTitle: 7. Useful class links (en)", extFields.includes("7. Useful class links"));
check("registrationRevealedBecause in CLASS_LINKS_COPY", extFields.includes("registrationRevealedBecause"));
check("ClasesClassLinksSection exported", extFields.includes("export function ClasesClassLinksSection("));
check("data-testid clases-class-links-section", extFields.includes("clases-class-links-section"));
check("paymentUrl field in form", extFields.includes("paymentUrl"));
check("classMaterialsUrl field in form", extFields.includes("classMaterialsUrl"));
check("syllabusUrl field in form", extFields.includes("syllabusUrl"));
check("instructorPageUrl field in form", extFields.includes("instructorPageUrl"));
check("studentPortalUrl field in form", extFields.includes("studentPortalUrl"));

// ── I: Form client wiring ────────────────────────────────────────────────────
console.log("\n── I: CommunityQuickApplicationClient wiring ──");
const appClient = readFile("app/(site)/publicar/community/shared/CommunityQuickApplicationClient.tsx");
check("ClasesClassLinksSection imported", appClient.includes("ClasesClassLinksSection"));
check("ClasesClassLinksSection rendered", appClient.includes("<ClasesClassLinksSection"));
check("classLinks spread patch in form", appClient.includes("classLinks: { ...state.classLinks, ...p }"));

// ── J: Price formatting ──────────────────────────────────────────────────────
console.log("\n── J: Price formatting (ClasesQuickAdCanvas) ──");
const adCanvas = readFile("app/(site)/publicar/clases/components/ClasesQuickAdCanvas.tsx");
check("formattedPrice variable defined", adCanvas.includes("formattedPrice"));
check("$ prefix applied to numeric price", adCanvas.includes("/^\\d/.test(rawPrice) && !rawPrice.startsWith(\"$\")"));
check("formattedPrice used in priceSummary", adCanvas.includes("formattedPrice,"));

// ── K: Audit file exists ─────────────────────────────────────────────────────
console.log("\n── K: Audit files ──");
check("CL-1 audit MD file exists", fileExists("app/lib/clasificados/clases/CLASES_CL1_FULL_LAUNCH_STACK_AUDIT.md"));
check("CL-1 audit script exists", fileExists("scripts/clases-cl1-launch-stack-audit.ts"));

// ── L: No forbidden changes ───────────────────────────────────────────────────
console.log("\n── L: No forbidden changes ──");
const migrationsDir = path.join(ROOT, "supabase/migrations");
const migrationFiles = fs.existsSync(migrationsDir)
  ? fs.readdirSync(migrationsDir).filter((f) => f.endsWith(".sql"))
  : [];
const migrationsMentionClassLinks = migrationFiles.some((f) =>
  fs.readFileSync(path.join(migrationsDir, f), "utf8").includes("classLinks")
);
check("No schema migration references classLinks", !migrationsMentionClassLinks);
const stripeIndex = readFile("app/lib/stripe.ts");
const stripeSrv = readFile("app/lib/stripe/index.ts");
check("No Stripe file references classLinks", !stripeIndex.includes("classLinks") && !stripeSrv.includes("classLinks"));

// ── Summary ───────────────────────────────────────────────────────────────────
console.log(`\n${"─".repeat(60)}`);
console.log(`CL-1 Audit: ${passed} passed, ${failed} failed`);
if (failed > 0) {
  console.error("\nFailed checks:");
  failures.forEach((f) => console.error(`  • ${f}`));
  process.exit(1);
} else {
  console.log("\n✅  All CL-1 checks passed — Clases Full Launch Stack gate complete.");
  process.exit(0);
}
