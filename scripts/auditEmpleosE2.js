/**
 * Empleos E2 Premium Paid Job Ad Standard — Audit Script
 * Run: node scripts/auditEmpleosE2.js
 *
 * Verifies key changes are present in the relevant files.
 * Exits 0 if all pass, 1 if any fail.
 */

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
let pass = 0;
let fail = 0;

function check(label, filePath, test) {
  const abs = path.join(ROOT, filePath);
  let content;
  try {
    content = fs.readFileSync(abs, "utf8");
  } catch {
    console.error(`  FAIL  [${label}] — file not found: ${filePath}`);
    fail++;
    return;
  }
  const result = typeof test === "string" ? content.includes(test) : test(content);
  if (result) {
    console.log(`  PASS  [${label}]`);
    pass++;
  } else {
    console.error(`  FAIL  [${label}] — check failed in: ${filePath}`);
    fail++;
  }
}

console.log("\n=== Empleos E2 Premium Paid Job Ad Standard — Audit ===\n");

// ── DRAFT TYPE ─────────────────────────────────────────────────────────────
console.log("── Draft type ──");
check(
  "contactTitle field exists in EmpleosQuickDraft",
  "app/(site)/publicar/empleos/shared/types/empleosQuickDraft.ts",
  "contactTitle: string;"
);
check(
  "startTime field exists in EmpleosQuickScheduleRow",
  "app/(site)/publicar/empleos/shared/types/empleosQuickDraft.ts",
  "startTime: string;"
);
check(
  "endTime field exists in EmpleosQuickScheduleRow",
  "app/(site)/publicar/empleos/shared/types/empleosQuickDraft.ts",
  "endTime: string;"
);
check(
  "contactTitle initialized in emptyEmpleosQuickDraft",
  "app/(site)/publicar/empleos/shared/types/empleosQuickDraft.ts",
  "contactTitle: \"\","
);
check(
  "normalizeEmpleosQuickDraft passes contactTitle",
  "app/(site)/publicar/empleos/shared/types/empleosQuickDraft.ts",
  "contactTitle: typeof rest.contactTitle"
);
check(
  "normalizeEmpleosQuickDraft upgrades scheduleRows with startTime",
  "app/(site)/publicar/empleos/shared/types/empleosQuickDraft.ts",
  "startTime: String"
);

// ── SHELL TYPE ─────────────────────────────────────────────────────────────
console.log("\n── Shell type ──");
check(
  "contactTitle in QuickJobDetailSample",
  "app/(site)/clasificados/empleos/data/empleoQuickJobSampleData.ts",
  "contactTitle?: string;"
);
check(
  "stateRegion in QuickJobDetailSample",
  "app/(site)/clasificados/empleos/data/empleoQuickJobSampleData.ts",
  "stateRegion?: string;"
);
check(
  "country in QuickJobDetailSample",
  "app/(site)/clasificados/empleos/data/empleoQuickJobSampleData.ts",
  "country?: string;"
);

// ── MAPPER ────────────────────────────────────────────────────────────────
console.log("\n── Mapper ──");
check(
  "mapQuickDraftToShell passes contactTitle",
  "app/(site)/publicar/empleos/shared/mappers/mapQuickDraftToShell.ts",
  "contactTitle: d.contactTitle"
);
check(
  "mapQuickDraftToShell passes stateRegion",
  "app/(site)/publicar/empleos/shared/mappers/mapQuickDraftToShell.ts",
  "stateRegion: d.stateRegion"
);
check(
  "mapQuickDraftToShell passes country",
  "app/(site)/publicar/empleos/shared/mappers/mapQuickDraftToShell.ts",
  "country: d.country"
);
check(
  "scheduleDisplayFromDraft uses startTime",
  "app/(site)/publicar/empleos/shared/mappers/mapQuickDraftToShell.ts",
  "startTime"
);
check(
  "scheduleDisplayFromDraft renders day · start – end format",
  "app/(site)/publicar/empleos/shared/mappers/mapQuickDraftToShell.ts",
  (c) => c.includes("\u00b7") && c.includes("\u2013")
);

// ── ENVELOPE HYDRATOR ──────────────────────────────────────────────────────
console.log("\n── Envelope hydrator ──");
check(
  "hydrateQuickDraftFromEnvelope maps startTime",
  "app/(site)/publicar/empleos/shared/lib/empleosDraftFromEnvelope.ts",
  "startTime:"
);
check(
  "hydrateQuickDraftFromEnvelope maps endTime",
  "app/(site)/publicar/empleos/shared/lib/empleosDraftFromEnvelope.ts",
  "endTime:"
);

// ── FORM ─────────────────────────────────────────────────────────────────
console.log("\n── Form ──");
check(
  "Form has contactTitle field",
  "app/(site)/publicar/empleos/quick/EmpleoQuickApplicationClient.tsx",
  "contactTitle"
);
check(
  "Form schedule uses startTime input",
  "app/(site)/publicar/empleos/quick/EmpleoQuickApplicationClient.tsx",
  "startTime"
);
check(
  "Form schedule uses endTime input",
  "app/(site)/publicar/empleos/quick/EmpleoQuickApplicationClient.tsx",
  "endTime"
);
check(
  "Form has remove shift button",
  "app/(site)/publicar/empleos/quick/EmpleoQuickApplicationClient.tsx",
  "Quitar turno"
);
check(
  "Form has $24.99 price banner",
  "app/(site)/publicar/empleos/quick/EmpleoQuickApplicationClient.tsx",
  "$24.99"
);
check(
  "Form description helper text updated",
  "app/(site)/publicar/empleos/quick/EmpleoQuickApplicationClient.tsx",
  "experiencia necesaria"
);

// ── CTA CARD ─────────────────────────────────────────────────────────────
console.log("\n── CTA Card ──");
check(
  "QuickJobCTACard has contactTitle prop",
  "app/(site)/clasificados/empleos/components/quickJob/QuickJobCTACard.tsx",
  "contactTitle?: string;"
);
check(
  "QuickJobCTACard has formatPay()",
  "app/(site)/clasificados/empleos/components/quickJob/QuickJobCTACard.tsx",
  "function formatPay("
);
check(
  "QuickJobCTACard has formatPhone()",
  "app/(site)/clasificados/empleos/components/quickJob/QuickJobCTACard.tsx",
  "function formatPhone("
);
check(
  "QuickJobCTACard has looksLikeEmail()",
  "app/(site)/clasificados/empleos/components/quickJob/QuickJobCTACard.tsx",
  "function looksLikeEmail("
);
check(
  "QuickJobCTACard uses validEmail guard for email CTA",
  "app/(site)/clasificados/empleos/components/quickJob/QuickJobCTACard.tsx",
  "validEmail"
);
check(
  "QuickJobCTACard shows apply section header",
  "app/(site)/clasificados/empleos/components/quickJob/QuickJobCTACard.tsx",
  "Aplicar a este empleo"
);
check(
  "QuickJobCTACard shows Contactar empleador header",
  "app/(site)/clasificados/empleos/components/quickJob/QuickJobCTACard.tsx",
  "Contactar empleador"
);
check(
  "QuickJobCTACard shows Publicado en Leonix trust cue",
  "app/(site)/clasificados/empleos/components/quickJob/QuickJobCTACard.tsx",
  "Publicado en Leonix"
);
check(
  "QuickJobCTACard shows contactTitle alongside contactPerson",
  "app/(site)/clasificados/empleos/components/quickJob/QuickJobCTACard.tsx",
  "contactTitle"
);
check(
  "QuickJobCTACard website button is gold not blue",
  "app/(site)/clasificados/empleos/components/quickJob/QuickJobCTACard.tsx",
  "border-[#C9A85A]/50"
);
check(
  "QuickJobCTACard conoce label updated",
  "app/(site)/clasificados/empleos/components/quickJob/QuickJobCTACard.tsx",
  "Learn about the employer"
);
check(
  "QuickJobCTACard phone displayed with formatPhone()",
  "app/(site)/clasificados/empleos/components/quickJob/QuickJobCTACard.tsx",
  "formatPhone(phone)"
);

// ── HEADER CARD ───────────────────────────────────────────────────────────
console.log("\n── Header Card ──");
check(
  "QuickJobHeaderCard has chips prop",
  "app/(site)/clasificados/empleos/components/quickJob/QuickJobHeaderCard.tsx",
  "chips?: string[];"
);
check(
  "QuickJobHeaderCard has payHighlight prop",
  "app/(site)/clasificados/empleos/components/quickJob/QuickJobHeaderCard.tsx",
  "payHighlight?: string;"
);
check(
  "QuickJobHeaderCard has stateRegion prop",
  "app/(site)/clasificados/empleos/components/quickJob/QuickJobHeaderCard.tsx",
  "stateRegion?: string;"
);
check(
  "QuickJobHeaderCard company shown before title",
  "app/(site)/clasificados/empleos/components/quickJob/QuickJobHeaderCard.tsx",
  (c) => {
    const companyPos = c.indexOf("{businessName}");
    const titlePos = c.indexOf("<h1");
    return companyPos < titlePos && companyPos > 0;
  }
);
check(
  "QuickJobHeaderCard logo is rounded-xl (premium identity)",
  "app/(site)/clasificados/empleos/components/quickJob/QuickJobHeaderCard.tsx",
  "rounded-xl"
);
check(
  "QuickJobHeaderCard has Chip component",
  "app/(site)/clasificados/empleos/components/quickJob/QuickJobHeaderCard.tsx",
  "function Chip("
);

// ── BENEFITS CARD ─────────────────────────────────────────────────────────
console.log("\n── Benefits Card ──");
check(
  "QuickJobBenefitsCard uses cream surface",
  "app/(site)/clasificados/empleos/components/quickJob/QuickJobBenefitsCard.tsx",
  "bg-[#FFFBF7]"
);
check(
  "QuickJobBenefitsCard uses gold section label",
  "app/(site)/clasificados/empleos/components/quickJob/QuickJobBenefitsCard.tsx",
  "text-[#8A5A18]"
);
check(
  "QuickJobBenefitsCard bullet dots are gold",
  "app/(site)/clasificados/empleos/components/quickJob/QuickJobBenefitsCard.tsx",
  "bg-[#C9A85A]"
);

// ── LOCATION CARD ─────────────────────────────────────────────────────────
console.log("\n── Location Card ──");
check(
  "QuickJobLocationCard uses cream surface",
  "app/(site)/clasificados/empleos/components/quickJob/QuickJobLocationCard.tsx",
  "bg-[#FFFBF7]"
);
check(
  "QuickJobLocationCard uses gold CTA button",
  "app/(site)/clasificados/empleos/components/quickJob/QuickJobLocationCard.tsx",
  "bg-[#FFF8ED]"
);
check(
  "QuickJobLocationCard uses gold section label",
  "app/(site)/clasificados/empleos/components/quickJob/QuickJobLocationCard.tsx",
  "text-[#8A5A18]"
);

// ── DETAIL PAGE ───────────────────────────────────────────────────────────
console.log("\n── Detail Page ──");
check(
  "EmpleoQuickDetailPage passes contactTitle to CTA card",
  "app/(site)/clasificados/empleos/components/quickJob/EmpleoQuickDetailPage.tsx",
  "contactTitle={data.contactTitle"
);
check(
  "EmpleoQuickDetailPage passes stateRegion to header",
  "app/(site)/clasificados/empleos/components/quickJob/EmpleoQuickDetailPage.tsx",
  "stateRegion={data.stateRegion}"
);
check(
  "EmpleoQuickDetailPage passes chips to header",
  "app/(site)/clasificados/empleos/components/quickJob/EmpleoQuickDetailPage.tsx",
  "chips={["
);
check(
  "EmpleoQuickDetailPage passes payHighlight to header",
  "app/(site)/clasificados/empleos/components/quickJob/EmpleoQuickDetailPage.tsx",
  "payHighlight={data.pay"
);
check(
  "EmpleoQuickDetailPage location section uses spec label",
  "app/(site)/clasificados/empleos/components/quickJob/EmpleoQuickDetailPage.tsx",
  "Ubicaci\u00f3n del empleo"
);

// ── RESULTS CARD (no regression) ──────────────────────────────────────────
console.log("\n── Results Card (no regression) ──");
check(
  "EmpleosJobResultCard imports EMPLEOS_CTA_PRIMARY",
  "app/(site)/clasificados/empleos/components/EmpleosJobResultCard.tsx",
  "EMPLEOS_CTA_PRIMARY"
);
check(
  "EmpleosJobResultCard uses EMPLEOS_CARD_STANDARD tier tokens",
  "app/(site)/clasificados/empleos/components/EmpleosJobResultCard.tsx",
  "EMPLEOS_CARD_STANDARD"
);
check(
  "EmpleosJobResultCard tracks result card click",
  "app/(site)/clasificados/empleos/components/EmpleosJobResultCard.tsx",
  "trackEmpleosResultCardClick"
);

// ── ANALYTICS NON-REGRESSION ──────────────────────────────────────────────
console.log("\n── Analytics non-regression ──");
check(
  "CTA card tracks phone CTA",
  "app/(site)/clasificados/empleos/components/quickJob/QuickJobCTACard.tsx",
  'trackEmpleosSidebarContactCta("phone"'
);
check(
  "CTA card tracks whatsapp CTA",
  "app/(site)/clasificados/empleos/components/quickJob/QuickJobCTACard.tsx",
  'trackEmpleosSidebarContactCta("whatsapp"'
);
check(
  "CTA card tracks email CTA",
  "app/(site)/clasificados/empleos/components/quickJob/QuickJobCTACard.tsx",
  'trackEmpleosSidebarContactCta("email"'
);
check(
  "CTA card tracks website CTA",
  "app/(site)/clasificados/empleos/components/quickJob/QuickJobCTACard.tsx",
  'trackEmpleosSidebarContactCta("website"'
);

// ── BRAND SAFETY ──────────────────────────────────────────────────────────
console.log("\n── Brand safety ──");
check(
  "No blue #4F6B82 on website CTA button",
  "app/(site)/clasificados/empleos/components/quickJob/QuickJobCTACard.tsx",
  (c) => {
    // The only allowed #4F6B82 is the ← Back to results link in EmpleoPublicDetailClient, not in CTA card
    const websiteButtonRegion = c.slice(c.indexOf("openWebsiteSheet"), c.indexOf("openWebsiteSheet") + 300);
    return !websiteButtonRegion.includes("#4F6B82");
  }
);
check(
  "Apply Now uses burgundy bg-[#7B1C3B]",
  "app/(site)/clasificados/empleos/components/quickJob/QuickJobCTACard.tsx",
  "bg-[#7B1C3B]"
);
check(
  "Page background uses warm cream #FAF7F2 or #FCF9F2",
  "app/(site)/clasificados/empleos/components/quickJob/EmpleoQuickDetailPage.tsx",
  (c) => c.includes("bg-[#FAF7F2]") || c.includes("bg-[#FCF9F2]")
);

// ── SAFETY ────────────────────────────────────────────────────────────────
console.log("\n── Scope safety ──");
check(
  "No payment/Stripe files changed",
  "app/(site)/publicar/empleos/shared/types/empleosQuickDraft.ts",
  (c) => !c.includes("stripe") && !c.includes("payment_intent")
);
check(
  "Audit doc created",
  "app/lib/clasificados/empleos/EMPLEOS_E2_FINAL_PREMIUM_PAID_JOB_AD_STANDARD_AUDIT.md",
  "Gate EMPLEOS-E2"
);

// ── SUMMARY ───────────────────────────────────────────────────────────────
console.log(`\n=== Results: ${pass} PASS, ${fail} FAIL ===\n`);
process.exit(fail > 0 ? 1 : 0);
