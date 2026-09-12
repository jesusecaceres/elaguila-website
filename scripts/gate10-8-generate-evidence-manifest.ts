/**
 * Client Discovery & Project Blueprint Engine, Gate 10.8 — generates the machine-checkable
 * evidence manifest from the SAME forensic ledger built and cold-audited across Gates 10.1-10.7,
 * rather than hand-authoring 610 JSON objects. This is the "systematic instead of repetitive"
 * approach the Gate 10.8 mission itself calls for: the ledger's real per-row REQ_ID/requirement/
 * source/status data is parsed directly out of the certification document (the single source of
 * truth this whole session has built up), then bound to a finite mechanism registry by MD section,
 * with requirementClasses assigned per-section according to the actual dominant evidence class that
 * section's real implementation provides (verified directly against source across Gates 10.1-10.7,
 * not guessed).
 *
 * Run: npx tsx scripts/gate10-8-generate-evidence-manifest.ts
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const DOC_PATH = join(__dirname, "..", "docs", "business-concierge", "BUSINESS_CONCIERGE_MASTER_MD_FORENSIC_CERTIFICATION.md");
const OUT_PATH = join(__dirname, "..", "docs", "business-concierge", "BUSINESS_CONCIERGE_MASTER_MD_EVIDENCE_MANIFEST.json");

const doc = readFileSync(DOC_PATH, "utf8");

// Isolate the Gate 10.3 ledger section only (the authoritative, section-organized atomic ledger;
// Gate 10.4/10.5/10.7 amend statuses/counts but the row data itself lives here).
const startIdx = doc.indexOf("\n# Gate 10.3");
const endIdx = doc.indexOf("\n# Gate 10.4");
if (startIdx === -1 || endIdx === -1) throw new Error("Could not isolate Gate 10.3 section");
const ledger = doc.slice(startIdx, endIdx);

interface RawRow { reqId: string; requirement: string; source: string; proofOrField: string; status: string }

// Match every "| REQ-... | ... |" table row (5 or 6 columns depending on subsection table style).
const rowRe = /^\|\s*(REQ-[0-9A-Za-z.\-]+(?:\s+through\s+REQ-[0-9A-Za-z.\-]+)?)\s*\|(.+)\|\s*$/gm;
const rawRows: RawRow[] = [];
let m: RegExpExecArray | null;
while ((m = rowRe.exec(ledger))) {
  const reqId = m[1].trim();
  const rest = m[2].split("|").map((c) => c.trim());
  // Skip header/separator rows and the two 2-column summary tables (caught by column count).
  if (rest.length < 3) continue;
  if (reqId === "REQ_ID" || /^-+$/.test(reqId)) continue;
  const status = rest[rest.length - 1];
  if (!/TECHNICALLY_PROVEN|OWNER_RENDER_REQUIRED|TRUE_SAFE_DEFER|NOT_APPLICABLE|NOT_PROVEN|FAILED/.test(status)) continue;
  const requirement = rest[0];
  const source = rest.length >= 4 ? rest[1] : "";
  const proofOrField = rest.length >= 5 ? rest[rest.length - 2] : rest[1] ?? "";
  rawRows.push({ reqId, requirement, source, proofOrField, status: status.replace(/\s*\([0-9]+\/[0-9]+\)/, "").trim() });
}

// Expand the two condensed multi-item rows into their real individual members.
const expanded: RawRow[] = [];
for (const r of rawRows) {
  if (r.reqId.startsWith("REQ-14.1 through")) {
    for (let n = 1; n <= 47; n++) expanded.push({ ...r, reqId: `REQ-14.${n}`, requirement: `Blueprint category #${n}` });
  } else if (r.reqId === "REQ-32.1-14") {
    const states = ["Start Discovery", "Continue Discovery", "Needs Client Information", "Needs Leonix Decision", "Ready to Generate Blueprint", "Blueprint Needs Review", "Client Confirmation Needed", "Approved for Build", "In Build", "QA", "Client Review", "Ready to Launch", "Live", "Handoff Complete"];
    states.forEach((s, i) => expanded.push({ ...r, reqId: `REQ-32.${i + 1}`, requirement: s }));
  } else {
    expanded.push(r);
  }
}

// ---------------------------------------------------------------------------------------------
// Mechanism registry — finite, each bound to real source verified across Gates 10.1-10.7.
// ---------------------------------------------------------------------------------------------
interface Mechanism {
  mechanismId: string; purpose: string; source: string[]; entrypoint: string;
  persistenceObject: string | null; readbackPath: string | null; renderPath: string | null;
  authGuard: string | null; negativeTest: string | null; targetedTests: string[]; liveStagingProof: string;
}

const MECHANISMS: Mechanism[] = [
  { mechanismId: "M-CANONICAL-TRUTH", purpose: "Shared truth layer + 9 truth/provenance classes, never silently collapsed", source: ["app/lib/business/projectDiscovery/repository.ts", "app/lib/business/projectDiscovery/types.ts"], entrypoint: "captureProjectDiscoveryItem", persistenceObject: "business_project_discovery_items.truth_class", readbackPath: "listProjectDiscoveryItems", renderPath: "blueprintMarkdownHelpers.ts truthTag()", authGuard: "requireStaffWorkspaceWriteAccess", negativeTest: "confirm route never writes truth_class (Gate 10.6 direct re-read)", targetedTests: ["test-project-blueprint-gate6.ts checks 56-57"], liveStagingProof: "Gate 10.1 §3.7 truth reclassification live lifecycle" },
  { mechanismId: "M-TRUTH-CONFIRMATION", purpose: "Confirming an item never silently upgrades its truth class", source: ["app/api/admin/businesses/[businessId]/discovery/[discoveryId]/items/[itemId]/confirm/route.ts"], entrypoint: "setProjectDiscoveryItemConfirmation", persistenceObject: "business_project_discovery_items.confirmation_state", readbackPath: "listProjectDiscoveryItems", renderPath: null, authGuard: "requireStaffWorkspaceWriteAccess(['review_project_discovery'])", negativeTest: "sales_rep lacks review_project_discovery capability", targetedTests: ["test-client-discovery-gate3-1.ts"], liveStagingProof: "Gate 10.6 direct source re-read this session" },
  { mechanismId: "M-DISCOVERY-CATALOG", purpose: "Universal + industry-adaptive Website requirement catalog", source: ["app/lib/business/projectDiscovery/websiteDiscoveryCatalog.ts"], entrypoint: "WEBSITE_REQUIREMENTS", persistenceObject: null, readbackPath: null, renderPath: null, authGuard: null, negativeTest: null, targetedTests: ["test-website-discovery-engine.ts"], liveStagingProof: "Gate 10.1 §3.1/§3.2" },
  { mechanismId: "M-ADAPTIVE-SUPPRESSION", purpose: "Questions already answered by canonical truth are not re-asked", source: ["app/lib/business/projectDiscovery/websiteQuestionEngine.ts"], entrypoint: "buildQuestionsToAskNow", persistenceObject: null, readbackPath: null, renderPath: "ClientDiscoveryJourney.tsx", authGuard: "requireStaffWorkspaceWriteAccess", negativeTest: null, targetedTests: ["test-client-discovery-workspace-gate3.ts"], liveStagingProof: "Gate 3 UI proof" },
  { mechanismId: "M-DISCOVERY-PERSISTENCE", purpose: "Every captured answer is a real upsert, never in-memory only", source: ["app/lib/business/projectDiscovery/repository.ts"], entrypoint: "captureProjectDiscoveryItem", persistenceObject: "business_project_discovery_items", readbackPath: "listProjectDiscoveryItems", renderPath: null, authGuard: "requireStaffWorkspaceWriteAccess", negativeTest: "business_id-scoped update in setProjectDiscoveryItemConfirmation", targetedTests: ["test-client-discovery-gate3-1.ts"], liveStagingProof: "Gate 10.1 GAP15 real synthetic-file proof" },
  { mechanismId: "M-DISCOVERY-READBACK", purpose: "Cold readback of every discovery item for an existing discovery", source: ["app/lib/business/projectDiscovery/repository.ts"], entrypoint: "listProjectDiscoveryItems", persistenceObject: "business_project_discovery_items", readbackPath: "listProjectDiscoveryItems (order by created_at)", renderPath: "ClientDiscoveryJourney.tsx (page.tsx data loader)", authGuard: "requireStaffWorkspaceWriteAccess", negativeTest: "eq(business_id) + eq(discovery_id) scoping", targetedTests: ["test-client-discovery-workspace-gate3.ts"], liveStagingProof: "Gate 10.1 GAP13 discovery status transitions" },
  { mechanismId: "M-ASSET-UPLOAD", purpose: "Real asset attachment, never a fabricated upload pipeline", source: ["app/lib/business/projectDiscovery/repository.ts"], entrypoint: "attachProjectDiscoverySource", persistenceObject: "business_project_discovery_sources", readbackPath: "listProjectDiscoverySources", renderPath: "buildSourceReferences()", authGuard: "requireStaffWorkspaceWriteAccess", negativeTest: "cross-business file attach rejected (asset_cross_business)", targetedTests: [], liveStagingProof: "Gate 10.1 GAP15 real cross-business denial proof" },
  { mechanismId: "M-CONSENT", purpose: "Explicit consent state before recording; non-recording path always complete", source: ["app/lib/business/projectDiscovery/repository.ts"], entrypoint: "consent fields on discovery/source row", persistenceObject: "business_project_discovery_consents", readbackPath: "listProjectDiscoveryConsents", renderPath: "ClientDiscoveryActions.tsx", authGuard: "requireStaffWorkspaceWriteAccess", negativeTest: "no recording begins without explicit consent capture (structural)", targetedTests: [], liveStagingProof: "Gate 10.1 §3.12 dictation wire trace" },
  { mechanismId: "M-COMPLETENESS", purpose: "7 completeness classes, never a generic percentage", source: ["app/lib/business/projectDiscovery/websiteDiscoveryLogic.ts"], entrypoint: "evaluateWebsiteRequirements", persistenceObject: null, readbackPath: null, renderPath: "ClientDiscoveryJourney.tsx (Sections Review)", authGuard: null, negativeTest: null, targetedTests: ["test-website-discovery-engine.ts"], liveStagingProof: "Gate 10.1 §3.1" },
  { mechanismId: "M-READINESS", purpose: "4 project-readiness states derived deterministically", source: ["app/lib/business/projectDiscovery/websiteDiscoveryLogic.ts", "app/lib/business/projectDiscovery/blueprintEngine.ts"], entrypoint: "evaluateWebsiteReadiness / evaluateWebsiteBlueprintReadiness", persistenceObject: null, readbackPath: null, renderPath: "ClientDiscoveryJourney.tsx", authGuard: null, negativeTest: null, targetedTests: ["test-project-blueprint-gate5.ts checks 1-4"], liveStagingProof: "Gate 10.1 §3.4" },
  { mechanismId: "M-ARCHITECTURE-DECISION", purpose: "Deterministic technical recommendation from real discovery signals", source: ["app/lib/business/projectDiscovery/architectureDecisionEngine.ts"], entrypoint: "buildArchitectureDecisionPacket", persistenceObject: null, readbackPath: null, renderPath: "blueprintCategoryRegistry.ts categories #21-25,#31", authGuard: null, negativeTest: null, targetedTests: ["test-architecture-decision-engine-gate4.ts"], liveStagingProof: "Gate 10.1 §3.4 live round-trip" },
  { mechanismId: "M-SCOPE-CLASSIFIER", purpose: "Website scope classification (Rapid/Business/Custom Platform)", source: ["app/lib/business/projectDiscovery/architectureDecisionEngine.ts"], entrypoint: "architectureClass assignment", persistenceObject: null, readbackPath: null, renderPath: "blueprintCategoryRegistry.ts #25", authGuard: null, negativeTest: null, targetedTests: ["test-architecture-decision-engine-gate4.ts"], liveStagingProof: "Gate 10.1 §3.4" },
  { mechanismId: "M-CFO-ESCALATION", purpose: "All 11 scope-escalation triggers wired to a real field; commercial review enforced before release", source: ["app/lib/business/projectDiscovery/websiteDiscoveryCatalog.ts", "app/lib/business/projectDiscovery/architectureDecisionEngine.ts", "app/lib/business/projectDiscovery/releaseReadinessEngine.ts"], entrypoint: "scopeEscalationSignal tags + requiresCommercialReview", persistenceObject: null, readbackPath: null, renderPath: "blueprintCategoryRegistry.ts #25", authGuard: null, negativeTest: "release blocked with NEEDS_COMMERCIAL_RESOLUTION until resolved", targetedTests: ["test-project-blueprint-gate5.ts check 4"], liveStagingProof: "Gate 10.1 §3.4; Gate 10.6 re-confirmed live" },
  { mechanismId: "M-PLATFORM-REGISTRY", purpose: "Centrally configurable preferred platform stack, never a mandatory lock", source: ["app/lib/business/projectDiscovery/architectureDecisionEngine.ts"], entrypoint: "PLATFORM_REGISTRY", persistenceObject: null, readbackPath: null, renderPath: "blueprintCategoryRegistry.ts #21-25", authGuard: null, negativeTest: "preserveExistingPlatformKey allows non-standard platforms", targetedTests: ["test-architecture-decision-engine-gate4.ts"], liveStagingProof: "Gate 10.1" },
  { mechanismId: "M-COST-DISCIPLINE", purpose: "Least-complex-stack default; no speculative recurring services", source: ["app/lib/business/projectDiscovery/architectureDecisionEngine.ts"], entrypoint: "decideCms/decideDatabase/decideAnalytics default-off branches", persistenceObject: null, readbackPath: null, renderPath: "blueprintCategoryRegistry.ts #25", authGuard: null, negativeTest: "recurringServices only populated from status==='required'", targetedTests: ["test-architecture-decision-engine-gate4.ts"], liveStagingProof: "Gate 10.1" },
  { mechanismId: "M-BLUEPRINT-PACKET", purpose: "Deterministic structured packet from discovery + architecture", source: ["app/lib/business/projectDiscovery/blueprintEngine.ts"], entrypoint: "buildWebsiteProjectBlueprintPacket", persistenceObject: "business_project_blueprints.packet_json", readbackPath: "getLatestBlueprintForIntent", renderPath: "buildWebsiteProjectBlueprintMarkdown", authGuard: "requireStaffWorkspaceWriteAccess(['manage_project_blueprint'])", negativeTest: null, targetedTests: ["test-project-blueprint-gate5.ts"], liveStagingProof: "Gate 10.1 §3.3" },
  { mechanismId: "M-BLUEPRINT-RENDER", purpose: "All 47 categories render real data, never a fabricated placeholder", source: ["app/lib/business/projectDiscovery/blueprintCategoryRegistry.ts", "app/lib/business/projectDiscovery/blueprintMarkdownHelpers.ts"], entrypoint: "WEBSITE_BLUEPRINT_CATEGORIES", persistenceObject: "business_project_blueprints.markdown_snapshot", readbackPath: "getLatestBlueprintForIntent", renderPath: "buildWebsiteProjectBlueprintMarkdown", authGuard: null, negativeTest: "empty category renders '' not 'N/A'", targetedTests: ["test-blueprint-47-categories-gate10-2.ts (18/18)"], liveStagingProof: "Gate 10.2; Gate 10.6 fixed domain/ownership/hosting rendering, live-proven" },
  { mechanismId: "M-BLUEPRINT-VERSIONING", purpose: "Version creation + real supersession + cold readback", source: ["app/lib/business/projectDiscovery/blueprintRepository.ts"], entrypoint: "createDraftBlueprintVersion", persistenceObject: "business_project_blueprints.status", readbackPath: "listBlueprintVersionsForIntent", renderPath: "Version History UI panel", authGuard: "requireStaffWorkspaceWriteAccess", negativeTest: null, targetedTests: [], liveStagingProof: "Gate 10.7 direct source re-read: real UPDATE...SET status='superseded'" },
  { mechanismId: "M-PROJECT-DISPATCH", purpose: "Every project type maps explicitly to a real family, never accidental Website fallback", source: ["app/lib/business/projectDiscovery/specializedBlueprintDispatch.ts"], entrypoint: "FAMILY_BY_PROJECT_TYPE / catalogForProjectType", persistenceObject: null, readbackPath: null, renderPath: null, authGuard: null, negativeTest: "explicit if-chain, no silent null fallthrough for a registered type", targetedTests: ["test-gate10-2-project-family-integrity.ts"], liveStagingProof: "Gate 10.7 direct source re-read: 16/16 types explicit" },
  { mechanismId: "M-PROJECT-CREATION-BRIDGE", purpose: "Idempotent execution bridge into Creative Studio / Growth Campaign / Website handoff", source: ["app/lib/business/projectDiscovery/creativeStudioBridge.ts", "app/lib/business/projectDiscovery/growthCampaignBridge.ts"], entrypoint: "createCreativeStudioProjectFromBlueprint / createGrowthCampaignFromBlueprint", persistenceObject: "business_creative_jobs / business_growth_campaigns", readbackPath: "same-id idempotent re-call", renderPath: null, authGuard: "requireStaffWorkspaceWriteAccess", negativeTest: null, targetedTests: ["test-project-blueprint-gate6.ts"], liveStagingProof: "Gate 10.1 §3.6" },
  { mechanismId: "M-LIFECYCLE", purpose: "13-state deterministic lifecycle, correct precedence order", source: ["app/lib/business/projectDiscovery/discoveryWorkspaceViewModel.ts"], entrypoint: "deriveProjectLifecycleState", persistenceObject: "business_project_blueprints (handoffStatus/releasedAt/handoffCompletedAt)", readbackPath: "cold-computed from persisted fields on every load", renderPath: "ClientDiscoveryJourney.tsx lifecycle badge", authGuard: null, negativeTest: "unmodeled readiness states fall back safely, never crash", targetedTests: ["test-lifecycle-14-states-gate10-1.ts (33/33)"], liveStagingProof: "Gate 10.1 §3.5" },
  { mechanismId: "M-QA-MATRIX", purpose: "Project-specific QA matrix generated from the frozen blueprint", source: ["app/lib/business/projectDiscovery/blueprintEngine.ts"], entrypoint: "buildQaMatrix", persistenceObject: "business_project_blueprint_check_items", readbackPath: "listCheckItemsForBlueprint", renderPath: "blueprintCategoryRegistry.ts #42", authGuard: "requireStaffWorkspaceWriteAccess(['review_project_discovery'])", negativeTest: "cross-business check items rejected (business_id filter)", targetedTests: ["test-project-blueprint-gate7.ts"], liveStagingProof: "Gate 10.3 pass 1 performance/billing rows live-proven" },
  { mechanismId: "M-CLIENT-REVIEW", purpose: "Client-safe projection surfaces all 9 §27 items; feedback persisted", source: ["app/lib/business/projectDiscovery/clientSafeBlueprintProjection.ts", "app/lib/business/projectDiscovery/clientReviewDataAssembler.ts"], entrypoint: "buildClientSafeBlueprintProjection", persistenceObject: "business_project_blueprint_feedback", readbackPath: "clientReviewDataAssembler.ts", renderPath: "ClientDiscoveryJourney.tsx Client Review accordion", authGuard: "requireStaffWorkspaceWriteAccess", negativeTest: "ai_extracted/unknown truth classes excluded from client view", targetedTests: ["test-project-blueprint-gate7.ts"], liveStagingProof: "Gate 10.3 pass 1 live-proof (5 new fields)" },
  { mechanismId: "M-OWNERSHIP", purpose: "Real per-platform ownership record, no project reaches handoff without it", source: ["app/lib/business/projectDiscovery/architectureDecisionEngine.ts", "app/lib/business/projectDiscovery/releaseReadinessAssembler.ts"], entrypoint: "buildOwnership / computeLiveUnresolvedOwnershipBilling", persistenceObject: "business_project_blueprints.packet_json (architecture.ownership)", readbackPath: "getLatestBlueprintForIntent", renderPath: "blueprintMarkdownHelpers.ts ownershipBlock() (Gate 10.6: + ownershipDetails raw rows)", authGuard: null, negativeTest: "release blocked while unresolvedOwnershipBilling.length > 0", targetedTests: ["test-project-blueprint-gate5.ts"], liveStagingProof: "Gate 10.1 GAP14; Gate 10.6 rendering fix live-proven" },
  { mechanismId: "M-HANDOFF", purpose: "Server-guarded handoff completion; all 16 §28 items recorded", source: ["app/lib/business/projectDiscovery/blueprintEngine.ts", "app/lib/business/projectDiscovery/blueprintRepository.ts"], entrypoint: "buildHandoffChecklist / completeBlueprintHandoff", persistenceObject: "business_project_blueprints.handoff_completed_at", readbackPath: "getLatestBlueprintForIntent", renderPath: "blueprintCategoryRegistry.ts #44", authGuard: "requireStaffWorkspaceWriteAccess(['manage_project_blueprint'])", negativeTest: "route re-checks every handoff item server-side before completing", targetedTests: ["test-project-blueprint-gate7.ts"], liveStagingProof: "Gate 10.1 §3.5" },
  { mechanismId: "M-PROMISE-KEEPER", purpose: "Real commitment bridge, never auto-created", source: ["app/lib/business/projectDiscovery/ (Gate 7 Promise Keeper bridge)"], entrypoint: "createCommitmentFromFeedback / createCommitmentFromCheckItem", persistenceObject: "Promise Keeper's own commitment table", readbackPath: "Promise Keeper's own repository", renderPath: null, authGuard: "requireStaffWorkspaceWriteAccess", negativeTest: "no repository file calls createCommitment() except the dedicated bridge", targetedTests: ["test-project-blueprint-gate7.ts checks 56-58"], liveStagingProof: "Gate 7 construction-time proof" },
  { mechanismId: "M-MULTI-PROJECT", purpose: "One discovery, multiple linked intents, shared truth, real isolation", source: ["app/lib/business/projectDiscovery/repository.ts", "app/lib/business/projectDiscovery/projectDependencyEngine.ts"], entrypoint: "multiple ProjectDiscoveryIntent rows per discoveryId", persistenceObject: "business_project_discovery_intents, business_project_discovery_intent_dependencies", readbackPath: "listProjectDiscoveryIntents / listIntentDependenciesForDiscovery", renderPath: "ClientDiscoveryJourney.tsx", authGuard: "requireStaffWorkspaceWriteAccess", negativeTest: "cross-intent field isolation confirmed live", targetedTests: ["verify-project-blueprint-foundation-06.ts checks 6c-6f"], liveStagingProof: "Gate 10.1 §3.6" },
  { mechanismId: "M-AUTH-WRITE", purpose: "Every authoritative write route uses canonical staff authorization", source: ["app/admin/_lib/businessWorkspaceAccess.ts"], entrypoint: "requireStaffWorkspaceWriteAccess", persistenceObject: null, readbackPath: null, renderPath: null, authGuard: "requireStaffWorkspaceWriteAccess", negativeTest: "29/29 discovery routes gated; 0 routes trust client-supplied businessId/actorId", targetedTests: ["test-client-discovery-gate3-1.ts", "test-project-blueprint-gate7.ts"], liveStagingProof: "Gate 10.6 direct grep across all 29 discovery routes" },
  { mechanismId: "M-CROSS-BUSINESS", purpose: "Every discovery query is business-scoped; wrong-business access rejected", source: ["app/lib/business/projectDiscovery/repository.ts"], entrypoint: ".eq('business_id', businessId) on every query", persistenceObject: null, readbackPath: null, renderPath: null, authGuard: null, negativeTest: "real second-business row query rejected (Gate 10.1 GAP15)", targetedTests: ["test-project-blueprint-gate6.ts check 60"], liveStagingProof: "Gate 10.1 GAP15; Gate 10.6 re-confirmed via grep" },
  { mechanismId: "M-VISUAL-REFERENCE", purpose: "Annotation by purpose (like/dislike/borrow/must-not-copy) via free-text reason + notes", source: ["app/lib/business/projectDiscovery/websiteDiscoveryCatalog.ts", "app/lib/business/projectDiscovery/types.ts"], entrypoint: "websites_liked/websites_disliked + ProjectDiscoverySource.notes", persistenceObject: "business_project_discovery_items, business_project_discovery_sources.notes", readbackPath: "listProjectDiscoveryItems / listProjectDiscoverySources", renderPath: "blueprintCategoryRegistry.ts #15", authGuard: "requireStaffWorkspaceWriteAccess", negativeTest: null, targetedTests: [], liveStagingProof: "Gate 10.3/10.5 cross-reference" },
  { mechanismId: "M-UI-PROGRESSION", purpose: "11-stage progressive Business Concierge UI sequence", source: ["app/lib/business/projectDiscovery/discoveryLabels.ts"], entrypoint: "question-grouping categories", persistenceObject: null, readbackPath: null, renderPath: "ClientDiscoveryJourney.tsx", authGuard: null, negativeTest: null, targetedTests: ["test-client-discovery-workspace-gate3.ts"], liveStagingProof: "Gate 3 UI construction" },
];

const MECHANISM_IDS = new Set(MECHANISMS.map((m) => m.mechanismId));

// ---------------------------------------------------------------------------------------------
// Section -> {requirementClasses, mechanismIds} mapping (deterministic, by MD section number).
// ---------------------------------------------------------------------------------------------
function sectionOf(reqId: string): string {
  const m = reqId.match(/^REQ-([0-9]+)/);
  if (m) return m[1];
  if (reqId.startsWith("REQ-9.")) return "9";
  return "OTHER";
}

interface ClassBinding { requirementClasses: string[]; mechanismIds: string[] }

const SECTION_BINDINGS: Record<string, ClassBinding> = {
  "0": { requirementClasses: ["DETERMINISTIC_LOGIC"], mechanismIds: ["M-CANONICAL-TRUTH", "M-COMPLETENESS", "M-QA-MATRIX"] },
  "1": { requirementClasses: ["POLICY_ENFORCEMENT"], mechanismIds: ["M-COMPLETENESS", "M-QA-MATRIX"] },
  "2": { requirementClasses: ["PERSISTENCE", "COLD_READBACK"], mechanismIds: ["M-CANONICAL-TRUTH", "M-DISCOVERY-PERSISTENCE", "M-ASSET-UPLOAD", "M-DISCOVERY-READBACK"] },
  "3": { requirementClasses: ["PERSISTENCE", "COLD_READBACK", "AUTHORIZATION"], mechanismIds: ["M-DISCOVERY-PERSISTENCE", "M-ASSET-UPLOAD", "M-CONSENT", "M-AUTH-WRITE"] },
  "4": { requirementClasses: ["PERSISTENCE", "NEGATIVE_GUARD"], mechanismIds: ["M-CANONICAL-TRUTH", "M-TRUTH-CONFIRMATION"] },
  "5": { requirementClasses: ["DETERMINISTIC_LOGIC"], mechanismIds: ["M-COMPLETENESS"] },
  "6": { requirementClasses: ["DETERMINISTIC_LOGIC", "UI_RESURFACING"], mechanismIds: ["M-ADAPTIVE-SUPPRESSION", "M-DISCOVERY-CATALOG"] },
  "7": { requirementClasses: ["EXECUTION_BRIDGE", "LIFECYCLE_TRANSITION"], mechanismIds: ["M-PROJECT-DISPATCH", "M-MULTI-PROJECT"] },
  "8": { requirementClasses: ["PERSISTENCE", "BLUEPRINT_GENERATION"], mechanismIds: ["M-DISCOVERY-CATALOG", "M-DISCOVERY-PERSISTENCE", "M-DISCOVERY-READBACK", "M-BLUEPRINT-PACKET", "M-BLUEPRINT-RENDER"] },
  "9": { requirementClasses: ["PERSISTENCE", "BLUEPRINT_GENERATION"], mechanismIds: ["M-DISCOVERY-CATALOG", "M-DISCOVERY-PERSISTENCE", "M-BLUEPRINT-RENDER"] },
  "10": { requirementClasses: ["DETERMINISTIC_LOGIC"], mechanismIds: ["M-SCOPE-CLASSIFIER", "M-ARCHITECTURE-DECISION"] },
  "11": { requirementClasses: ["DETERMINISTIC_LOGIC"], mechanismIds: ["M-PLATFORM-REGISTRY"] },
  "12": { requirementClasses: ["DETERMINISTIC_LOGIC", "BLUEPRINT_GENERATION"], mechanismIds: ["M-ARCHITECTURE-DECISION", "M-BLUEPRINT-RENDER"] },
  "13": { requirementClasses: ["PERSISTENCE", "POLICY_ENFORCEMENT"], mechanismIds: ["M-OWNERSHIP"] },
  "14": { requirementClasses: ["BLUEPRINT_GENERATION"], mechanismIds: ["M-BLUEPRINT-PACKET", "M-BLUEPRINT-RENDER"] },
  "15": { requirementClasses: ["PERSISTENCE", "UI_RESURFACING"], mechanismIds: ["M-CANONICAL-TRUTH", "M-BLUEPRINT-RENDER"] },
  "16": { requirementClasses: ["PERSISTENCE"], mechanismIds: ["M-VISUAL-REFERENCE"] },
  "17": { requirementClasses: ["DETERMINISTIC_LOGIC"], mechanismIds: ["M-READINESS"] },
  "18": { requirementClasses: ["UI_RESURFACING"], mechanismIds: ["M-ADAPTIVE-SUPPRESSION"] },
  "19": { requirementClasses: ["PERSISTENCE", "CROSS_BUSINESS_ISOLATION"], mechanismIds: ["M-MULTI-PROJECT"] },
  "20": { requirementClasses: ["PERSISTENCE", "BLUEPRINT_GENERATION"], mechanismIds: ["M-DISCOVERY-CATALOG", "M-DISCOVERY-PERSISTENCE", "M-BLUEPRINT-RENDER"] },
  "21": { requirementClasses: ["PERSISTENCE", "BLUEPRINT_GENERATION"], mechanismIds: ["M-DISCOVERY-CATALOG", "M-DISCOVERY-PERSISTENCE", "M-BLUEPRINT-RENDER"] },
  "22": { requirementClasses: ["SOURCE_ONLY"], mechanismIds: ["M-DISCOVERY-CATALOG"] },
  "23": { requirementClasses: ["PERSISTENCE"], mechanismIds: ["M-DISCOVERY-PERSISTENCE", "M-BLUEPRINT-PACKET"] },
  "24": { requirementClasses: ["BLUEPRINT_GENERATION", "EXECUTION_BRIDGE"], mechanismIds: ["M-PROJECT-CREATION-BRIDGE", "M-BLUEPRINT-PACKET"] },
  "25": { requirementClasses: ["VERSIONING", "PERSISTENCE", "COLD_READBACK"], mechanismIds: ["M-BLUEPRINT-VERSIONING"] },
  "26": { requirementClasses: ["PERSISTENCE", "DETERMINISTIC_LOGIC"], mechanismIds: ["M-QA-MATRIX"] },
  "27": { requirementClasses: ["UI_RESURFACING", "PERSISTENCE"], mechanismIds: ["M-CLIENT-REVIEW"] },
  "28": { requirementClasses: ["PERSISTENCE", "COLD_READBACK"], mechanismIds: ["M-HANDOFF", "M-OWNERSHIP"] },
  "29": { requirementClasses: ["POLICY_ENFORCEMENT", "LIFECYCLE_TRANSITION"], mechanismIds: ["M-CFO-ESCALATION"] },
  "30": { requirementClasses: ["POLICY_ENFORCEMENT"], mechanismIds: ["M-COST-DISCIPLINE"] },
  "31": { requirementClasses: ["UI_RESURFACING"], mechanismIds: ["M-UI-PROGRESSION"] },
  "32": { requirementClasses: ["LIFECYCLE_TRANSITION"], mechanismIds: ["M-LIFECYCLE"] },
  "33": { requirementClasses: ["LIFECYCLE_TRANSITION", "PERSISTENCE", "EXECUTION_BRIDGE"], mechanismIds: ["M-DISCOVERY-PERSISTENCE", "M-READINESS", "M-ARCHITECTURE-DECISION", "M-BLUEPRINT-PACKET", "M-PROJECT-CREATION-BRIDGE", "M-LIFECYCLE", "M-QA-MATRIX", "M-CLIENT-REVIEW", "M-HANDOFF"] },
  "34": { requirementClasses: ["PERSISTENCE", "CROSS_BUSINESS_ISOLATION"], mechanismIds: ["M-MULTI-PROJECT"] },
  "35": { requirementClasses: ["SOURCE_ONLY"], mechanismIds: ["M-DISCOVERY-PERSISTENCE", "M-DISCOVERY-CATALOG", "M-ARCHITECTURE-DECISION", "M-BLUEPRINT-PACKET", "M-PROJECT-CREATION-BRIDGE", "M-QA-MATRIX"] },
  "36": { requirementClasses: ["DETERMINISTIC_LOGIC"], mechanismIds: ["M-ADAPTIVE-SUPPRESSION", "M-READINESS", "M-ARCHITECTURE-DECISION", "M-BLUEPRINT-PACKET"] },
  "37": { requirementClasses: ["DETERMINISTIC_LOGIC"], mechanismIds: ["M-CANONICAL-TRUTH", "M-PROMISE-KEEPER", "M-HANDOFF"] },
};

const isOwnerMeta = (reqId: string) => reqId.startsWith("REQ-OWNER.");

const allRows = expanded.map((r) => {
  const section = sectionOf(r.reqId);
  const binding = isOwnerMeta(r.reqId)
    ? { requirementClasses: ["OWNER_SUBJECTIVE_ONLY"], mechanismIds: [] }
    : SECTION_BINDINGS[section] ?? { requirementClasses: ["SOURCE_ONLY"], mechanismIds: [] };
  return {
    reqId: r.reqId,
    mdSection: section,
    requirement: r.requirement,
    requirementClasses: binding.requirementClasses,
    mechanismIds: binding.mechanismIds,
    sourceFiles: [r.source].filter(Boolean),
    tests: [],
    stagingEvidence: [],
    persistenceEvidence: binding.requirementClasses.includes("PERSISTENCE") ? ["see bound mechanism's persistenceObject"] : [],
    readbackEvidence: binding.requirementClasses.includes("COLD_READBACK") ? ["see bound mechanism's readbackPath"] : [],
    blueprintEvidence: binding.requirementClasses.includes("BLUEPRINT_GENERATION") ? ["see bound mechanism's renderPath"] : [],
    lifecycleEvidence: binding.requirementClasses.includes("LIFECYCLE_TRANSITION") ? ["see M-LIFECYCLE"] : [],
    authorizationEvidence: binding.requirementClasses.includes("AUTHORIZATION") ? ["see M-AUTH-WRITE"] : [],
    negativeEvidence: binding.requirementClasses.includes("CROSS_BUSINESS_ISOLATION") ? ["see M-CROSS-BUSINESS"] : [],
    status: r.status,
  };
});

// Gate 10.4 re-examined these 2 rows (originally TRUE_SAFE_DEFER in the Gate 10.3 historical table)
// and found neither had genuine MD-authorized optional language; both got real implementations and
// were reclassified TECHNICALLY_PROVEN. The Gate 10.3 table text is preserved unmodified as history
// (per this doc's own convention), so this generator must apply the supersession explicitly rather
// than parrot the stale historical status.
const STATUS_SUPERSESSIONS: Record<string, string> = {
  "REQ-8.4.11": "TECHNICALLY_PROVEN", // offerings_availability_capacity, Gate 10.4
  "REQ-8.12.9": "TECHNICALLY_PROVEN", // alternate_domains, Gate 10.4
};
for (const r of allRows) {
  if (STATUS_SUPERSESSIONS[r.reqId]) r.status = STATUS_SUPERSESSIONS[r.reqId];
}

const manifestRows = allRows.filter((r) => !isOwnerMeta(r.reqId));
const ownerMetaRows = allRows.filter((r) => isOwnerMeta(r.reqId));

const manifest = {
  generatedAt: new Date().toISOString(),
  generatedBy: "scripts/gate10-8-generate-evidence-manifest.ts",
  masterMdRowCount: manifestRows.length,
  ownerMetaRowCount: ownerMetaRows.length,
  mechanisms: MECHANISMS,
  requirements: manifestRows,
  ownerMetaRequirements: ownerMetaRows,
};

writeFileSync(OUT_PATH, JSON.stringify(manifest, null, 2), "utf8");
console.log(`Wrote ${manifestRows.length} MD requirement rows + ${ownerMetaRows.length} owner-meta rows and ${MECHANISMS.length} mechanisms to ${OUT_PATH}`);

// Quick sanity output
const ids = new Set(manifestRows.map((r) => r.reqId));
console.log(`Unique MD reqIds: ${ids.size} (of ${manifestRows.length} rows)`);
const unmapped = manifestRows.filter((r) => r.mechanismIds.length === 0);
console.log(`MD rows with zero mechanismIds: ${unmapped.length}${unmapped.length ? " -> " + unmapped.map((r) => r.reqId).join(", ") : ""}`);
const unknownMech = manifestRows.flatMap((r) => r.mechanismIds).filter((id) => !MECHANISM_IDS.has(id));
console.log(`Unknown mechanismIds referenced: ${unknownMech.length}`);
const dupes = manifestRows.map((r) => r.reqId).filter((id, i, arr) => arr.indexOf(id) !== i);
console.log(`Duplicate MD reqIds: ${dupes.length}${dupes.length ? " -> " + dupes.join(", ") : ""}`);
