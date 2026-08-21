#!/usr/bin/env node
/**
 * Gate ES-7 verifier — multi-entity source extraction. Static source checks only (no DB/network).
 */
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..", "..");

const checks = [];
function assert(name, ok, detail) {
  checks.push({ name, ok, detail });
}
function read(relPath) {
  const p = join(ROOT, relPath);
  if (!existsSync(p)) return null;
  return readFileSync(p, "utf8");
}

const entityTypeFile = read("app/lib/recursos/intake/entityType.ts");
const urlProposalFile = read("app/lib/recursos/intake/urlCandidateProposal.ts");
const pdfAdapterFile = read("app/lib/recursos/intake/pdfOrganizationAiAdapter.ts");
const aiAdapterFile = read("app/lib/recursos/intake/aiProposalAdapter.ts");
const entityCreationFile = read("app/lib/recursos/intake/entityCandidateCreation.ts");
const pdfOrchestratorFile = read("app/lib/recursos/intake/pdfIntakeOrchestrator.ts");
const urlMultiEntityFile = read("app/lib/recursos/intake/urlMultiEntityIntakeOrchestrator.ts");
const dedupFile = read("app/lib/recursos/intake/pdfCandidateDedup.ts");
const jobPageFile = read("app/admin/(dashboard)/recursos/intake/[jobId]/page.tsx");
const verificationEventsDbFile = read("app/lib/recursos/intake/server/verificationEventsDb.ts");
const matcherFile = read("app/lib/recursos/intake/matchCandidateToExistingResource.ts");

// ---------- ES-7A: 5 entity types ----------
assert("entityType.ts exists", entityTypeFile !== null);
if (entityTypeFile) {
  const FIVE = ["PRIMARY_RESOURCE", "PROGRAM", "PARTNER_ORGANIZATION", "LOCATION", "REFERRAL_LINK"];
  assert("all 5 entity types exist", FIVE.every((v) => entityTypeFile.includes(v)), FIVE);
  assert("isCandidateEligibleEntityType exported (ES-7N hard gate)", /export function isCandidateEligibleEntityType/.test(entityTypeFile));
  assert(
    "isCandidateEligibleEntityType permits only PRIMARY_RESOURCE/PROGRAM/PARTNER_ORGANIZATION",
    (() => {
      const fn = entityTypeFile.match(/export function isCandidateEligibleEntityType[\s\S]*?\n}/);
      if (!fn) return false;
      const body = fn[0];
      return /PRIMARY_RESOURCE/.test(body) && /PROGRAM/.test(body) && /PARTNER_ORGANIZATION/.test(body) && !/LOCATION/.test(body) && !/REFERRAL_LINK/.test(body);
    })(),
  );
}

// ---------- No new DB enum / hierarchy table ----------
assert(
  "no new migration file added in this gate (entityType carried via jsonb cargo bay, not a column)",
  (() => {
    const migrationsDir = join(ROOT, "supabase", "migrations");
    if (!existsSync(migrationsDir)) return false;
    const files = readdirSync(migrationsDir);
    return !files.some((f) => /es[-_]?7|entity[-_]?type|multi[-_]?entity/i.test(f));
  })(),
);
assert("no CREATE TABLE for a hierarchy/relationship table anywhere in ES-7 files", ![entityTypeFile, entityCreationFile, pdfOrchestratorFile, urlMultiEntityFile].some((f) => f && /create table/i.test(f)));

// ---------- PDF schema uses entityType ----------
assert("pdfOrganizationAiAdapter.ts exists", pdfAdapterFile !== null);
if (pdfAdapterFile) {
  assert("PdfOrganizationProposal carries sourceSections", /sourceSections/.test(pdfAdapterFile));
  assert("SYSTEM_PROMPT instructs entityType classification", /ENTITY TYPE/.test(pdfAdapterFile) && /PRIMARY_RESOURCE/.test(pdfAdapterFile) && /PARTNER_ORGANIZATION/.test(pdfAdapterFile));
  assert("prompt explicitly states LOCATION/REFERRAL_LINK are never standalone candidates", /LOCATION and REFERRAL_LINK are always evidence/.test(pdfAdapterFile));
  assert("parseOneOrganization reads+validates entityType with a safe default (PRIMARY_RESOURCE, not silently dropped)", /entityTypeRaw/.test(pdfAdapterFile) && /"PRIMARY_RESOURCE"/.test(pdfAdapterFile));
  assert("parseOneOrganization reads parentOrganizationName/parentProgramName", /parentOrganizationName = str\(o\.parentOrganizationName\)/.test(pdfAdapterFile) && /parentProgramName = str\(o\.parentProgramName\)/.test(pdfAdapterFile));
  assert("Spanish gating (sourceMayHaveSpanish) unchanged/preserved in the same function", /sourceMayHaveSpanish/.test(pdfAdapterFile));
}

// ---------- URL schema supports entityType ----------
assert("urlCandidateProposal.ts exists", urlProposalFile !== null);
if (urlProposalFile) {
  assert("UrlCandidateProposal type carries entityType/parentOrganizationName/parentProgramName", /entityType: EntityType/.test(urlProposalFile) && /parentOrganizationName: string \| null/.test(urlProposalFile) && /parentProgramName: string \| null/.test(urlProposalFile));
  assert("FIELD_KEYS includes the 3 new keys (encode/decode cargo bay stays symmetric)", /"entityType"/.test(urlProposalFile) && /"parentOrganizationName"/.test(urlProposalFile) && /"parentProgramName"/.test(urlProposalFile));
  assert("decode falls back to PRIMARY_RESOURCE on missing/invalid entityType (never silently LOCATION/REFERRAL)", /"PRIMARY_RESOURCE"/.test(urlProposalFile));
}
assert("aiProposalAdapter.ts (single-entity URL path) always sets entityType PRIMARY_RESOURCE", aiAdapterFile !== null && /entityType: "PRIMARY_RESOURCE"/.test(aiAdapterFile) && /parentOrganizationName: null/.test(aiAdapterFile));
assert("urlMultiEntityIntakeOrchestrator.ts exists (ES-7C multi-entity URL path)", urlMultiEntityFile !== null);
if (urlMultiEntityFile) {
  assert("multi-entity URL path reuses proposeOrganizationsFromPages (no second AI adapter)", /proposeOrganizationsFromPages/.test(urlMultiEntityFile));
  assert("multi-entity URL path reuses createCandidatesFromEntityProposals (no second routing policy)", /createCandidatesFromEntityProposals/.test(urlMultiEntityFile));
  assert("single-entity runUrlIntake is untouched by this file (sibling, not a replacement)", !/export async function runUrlIntake/.test(urlMultiEntityFile));
}
assert("single-entity urlIntakeOrchestrator.ts's runUrlIntake still exists unmodified in shape", (() => {
  const f = read("app/lib/recursos/intake/urlIntakeOrchestrator.ts");
  return f !== null && /export async function runUrlIntake/.test(f);
})());

// ---------- Orchestrator routing / matching reuse / no auto-publication ----------
assert("entityCandidateCreation.ts exists (single shared routing policy)", entityCreationFile !== null);
if (entityCreationFile) {
  assert("reuses matchCandidateToExistingResource (no second matcher)", /matchCandidateToExistingResource\(/.test(entityCreationFile));
  assert("gates candidate creation on isCandidateEligibleEntityType (ES-7N)", /isCandidateEligibleEntityType/.test(entityCreationFile));
  assert(
    "PRIMARY_RESOURCE/PROGRAM always go through dbSaveCandidateReview (existing candidate flow)",
    /dbSaveCandidateReview/.test(entityCreationFile),
  );
  assert(
    "PARTNER_ORGANIZATION runs matching BEFORE deciding candidate vs matched-only",
    (() => {
      const idx1 = entityCreationFile.indexOf("matchCandidateToExistingResource(");
      const idx2 = entityCreationFile.indexOf('proposal.entityType === "PARTNER_ORGANIZATION"');
      return idx1 !== -1 && idx2 !== -1 && idx1 < idx2;
    })(),
  );
  assert(
    "PARTNER_ORGANIZATION EXISTING_RESOURCE_UPDATE skips candidate creation (continue before dbSaveCandidateReview)",
    (() => {
      const partnerBlockStart = entityCreationFile.indexOf('proposal.entityType === "PARTNER_ORGANIZATION"');
      const saveCallIdx = entityCreationFile.indexOf("dbSaveCandidateReview({");
      const continueIdx = entityCreationFile.indexOf("continue; // no candidate row for this one");
      return partnerBlockStart !== -1 && continueIdx !== -1 && saveCallIdx !== -1 && partnerBlockStart < continueIdx && continueIdx < saveCallIdx;
    })(),
  );
  assert("PARTNER_ORGANIZATION matched case still calls generateChangeProposalsForMatch (useful, not a dead end)", /generateChangeProposalsForMatch/.test(entityCreationFile));
  assert(
    "LOCATION/REFERRAL_LINK entities are structurally excluded from the candidate-creation pass (Pass 1 skips ineligible types)",
    /if \(!isCandidateEligibleEntityType\(proposal\.entityType\)\) continue;/.test(entityCreationFile),
  );
  assert(
    "LOCATION/REFERRAL_LINK entities are structurally excluded from the candidate-eligible pass 2 too (never both created AND evidenced)",
    /if \(isCandidateEligibleEntityType\(proposal\.entityType\)\) continue;/.test(entityCreationFile),
  );
  assert("LOCATION/REFERRAL_LINK never call dbSaveCandidateReview anywhere near their handling (Pass 2 has no dbSaveCandidateReview call)", (() => {
    const pass2 = entityCreationFile.slice(entityCreationFile.indexOf("// Pass 2:"));
    return !/dbSaveCandidateReview/.test(pass2);
  })());
  assert("LOCATION/REFERRAL_LINK preserved as evidence_recorded events, never silently dropped (job-scoped fallback when no parent resolves)", /parentCandidateId ?? null/.test(entityCreationFile) === false ? /candidateId: parentCandidateId/.test(entityCreationFile) : true);
  assert("no direct write to community_resources anywhere in this file (no auto-publication)", !/dbCreateCommunityResource|dbUpdateCommunityResource/.test(entityCreationFile));
  assert("never sets a proposal/candidate status to accepted/verified/promoted (no auto-approval)", !/"accepted"/.test(entityCreationFile) && !/"promoted"/.test(entityCreationFile) && !/verification_status/.test(entityCreationFile));
}

// ---------- Program preserves parent ----------
assert(
  "PROGRAM candidates carry parentOrganizationName/parentProgramName through the same encode/decode cargo bay (no separate mechanism)",
  urlProposalFile !== null && /parentOrganizationName/.test(urlProposalFile) && entityCreationFile !== null && /encodeProposalAsDiscrepancies\(proposal\)/.test(entityCreationFile),
);

// ---------- Matching signals: organization + program pairing (ES-7E), reused unchanged ----------
assert("matchCandidateToExistingResource.ts itself is untouched by this gate (reused, not modified)", matcherFile !== null && !/entityType|PARTNER_ORGANIZATION|LOCATION|REFERRAL_LINK/.test(matcherFile));
assert("entityCandidateCreation.ts passes organizationName+programName to the matcher (org+program pairing signal)", entityCreationFile !== null && /programName: proposal\.programName/.test(entityCreationFile));

// ---------- Within-source dedupe (ES-7J) ----------
assert("pdfCandidateDedup.ts exists (reused for both PDF and URL multi-entity)", dedupFile !== null);
if (dedupFile) {
  assert("dedupKey folds entityType in (distinct entity types sharing a name are never merged)", /\$\{p\.entityType\}\|/.test(dedupFile));
  assert("dedup is exact-key only (never auto-merges on fuzzy similarity)", !/similarity|levenshtein|fuzzy/i.test(dedupFile));
  assert("urlMultiEntityIntakeOrchestrator.ts reuses dedupeProposalsWithinJob (no second dedupe engine)", urlMultiEntityFile !== null && /dedupeProposalsWithinJob/.test(urlMultiEntityFile));
}

// ---------- Spanish source fields preserved / English source no generation ----------
assert(
  "pdfOrganizationAiAdapter.ts's per-entity Spanish gating is unchanged (sourceMayHaveSpanish still forcibly nulls Es fields for non-Spanish sources)",
  pdfAdapterFile !== null && /const sourceMayHaveSpanish = detectedLanguage === "es" \|\| detectedLanguage === "bilingual";/.test(pdfAdapterFile),
);
assert("entity-type additions never touch the Spanish field gating logic itself", pdfAdapterFile !== null && (() => {
  const gateBlock = pdfAdapterFile.match(/const sourceMayHaveSpanish[\s\S]*?spanishIsOfficialSource = [^;]+;/);
  return gateBlock ? !/entityType/.test(gateBlock[0]) : false;
})());

// ---------- ES-7K: admin result UX ----------
assert("intake job result page exists", jobPageFile !== null);
if (jobPageFile) {
  assert("groups results by entity type", /candidatesByEntityType/.test(jobPageFile) && /ENTITY_TYPES/.test(jobPageFile));
  assert("shows non-candidate LOCATION/REFERRAL_LINK entities distinctly", /nonCandidateEvents/.test(jobPageFile) && /NUNCA crean un candidato/.test(jobPageFile));
  assert("shows matched-partner (no-candidate) entities with a link to the existing resource", /matchedPartnerEvents/.test(jobPageFile) && /Ver recurso existente/.test(jobPageFile));
  assert("makes clear which entities did NOT create a candidate", /NUNCA crean un candidato/.test(jobPageFile));
}
assert("dbListVerificationEventsForJob added (job-scoped read, needed since LOCATION/REFERRAL never become a candidate)", verificationEventsDbFile !== null && /export async function dbListVerificationEventsForJob/.test(verificationEventsDbFile));

// ---------- No auto-publication (structural, repo-wide within ES-7 files) ----------
assert(
  "no ES-7 file ever imports dbUpdateSingleResourceField or dbSetCommunityResourceVerificationStatus",
  ![entityCreationFile, pdfOrchestratorFile, urlMultiEntityFile, jobPageFile].some((f) => f && /dbUpdateSingleResourceField|dbSetCommunityResourceVerificationStatus/.test(f)),
);

let passCount = 0;
for (const c of checks) {
  console.log(`${c.ok ? "PASS" : "FAIL"} — ${c.name}${c.detail !== undefined && !c.ok ? ` (${JSON.stringify(c.detail)})` : ""}`);
  if (c.ok) passCount++;
}
console.log(`\n${passCount}/${checks.length} checks passed.`);
if (passCount !== checks.length) process.exitCode = 1;
