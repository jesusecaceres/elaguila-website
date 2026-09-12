/**
 * Client Discovery & Project Blueprint Engine, Gate 10.8 — machine-checkable evidence-manifest
 * verifier. Fails (non-zero exit) unless every completeness/evidence-sufficiency condition the
 * Gate 10.8 mission specifies holds. Re-runnable at any time: `npx tsx scripts/gate10-8-verify-evidence-manifest.ts`.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

const MANIFEST_PATH = join(__dirname, "..", "docs", "business-concierge", "BUSINESS_CONCIERGE_MASTER_MD_EVIDENCE_MANIFEST.json");
const manifest = JSON.parse(readFileSync(MANIFEST_PATH, "utf8"));

let failures = 0;
function check(name: string, ok: boolean, detail?: string): void {
  if (ok) {
    console.log(`  PASS  ${name}`);
  } else {
    console.log(`  FAIL  ${name}${detail ? " — " + detail : ""}`);
    failures++;
  }
}

console.log("Gate 10.8 — Machine-Checkable Evidence Manifest Verifier\n");

const reqs: any[] = manifest.requirements;
const ownerReqs: any[] = manifest.ownerMetaRequirements;
const mechanisms: any[] = manifest.mechanisms;
const mechanismIds = new Set(mechanisms.map((m) => m.mechanismId));

check("TOTAL CANONICAL MD REQS = 610", reqs.length === 610, `got ${reqs.length}`);

const idCounts = new Map<string, number>();
for (const r of reqs) idCounts.set(r.reqId, (idCounts.get(r.reqId) ?? 0) + 1);
const duplicates = [...idCounts.entries()].filter(([, n]) => n > 1);
check("Every reqId appears exactly once (no duplicates)", duplicates.length === 0, duplicates.map(([id]) => id).join(", "));

const unmapped = reqs.filter((r) => !r.mechanismIds || r.mechanismIds.length === 0);
check("Every MD req has at least one mechanismId", unmapped.length === 0, unmapped.map((r) => r.reqId).join(", "));

const unknownMechRefs = reqs.flatMap((r) => r.mechanismIds).filter((id: string) => !mechanismIds.has(id));
check("Every referenced mechanismId exists in the registry", unknownMechRefs.length === 0, [...new Set(unknownMechRefs)].join(", "));

const notProven = reqs.filter((r) => r.status === "NOT_PROVEN");
check("No NOT_PROVEN rows", notProven.length === 0, notProven.map((r) => r.reqId).join(", "));

const failed = reqs.filter((r) => r.status === "FAILED");
check("No FAILED rows", failed.length === 0, failed.map((r) => r.reqId).join(", "));

const deferred = reqs.filter((r) => r.status === "TRUE_SAFE_DEFER");
check("No TRUE_SAFE_DEFER rows", deferred.length === 0, deferred.map((r) => r.reqId).join(", "));

const validStatuses = new Set(["TECHNICALLY_PROVEN", "NOT_APPLICABLE"]);
const invalidStatus = reqs.filter((r) => !validStatuses.has(r.status));
check("Every MD row has a valid closeout status (TECHNICALLY_PROVEN or NOT_APPLICABLE)", invalidStatus.length === 0, invalidStatus.map((r) => `${r.reqId}:${r.status}`).join(", "));

// Evidence-class -> required populated field(s).
const CLASS_EVIDENCE_FIELD: Record<string, string[]> = {
  PERSISTENCE: ["persistenceEvidence"],
  COLD_READBACK: ["readbackEvidence"],
  BLUEPRINT_GENERATION: ["blueprintEvidence"],
  LIFECYCLE_TRANSITION: ["lifecycleEvidence"],
  AUTHORIZATION: ["authorizationEvidence"],
  CROSS_BUSINESS_ISOLATION: ["negativeEvidence"],
};
let evidenceGaps: string[] = [];
for (const r of reqs) {
  for (const cls of r.requirementClasses ?? []) {
    const fields = CLASS_EVIDENCE_FIELD[cls];
    if (!fields) continue; // classes without a dedicated evidence-field requirement (e.g. SOURCE_ONLY, DETERMINISTIC_LOGIC, POLICY_ENFORCEMENT, EXECUTION_BRIDGE, VERSIONING, UI_RESURFACING) are satisfied by mechanism binding + source citation alone.
    for (const f of fields) {
      if (!r[f] || r[f].length === 0) evidenceGaps.push(`${r.reqId} (${cls} needs ${f})`);
    }
  }
}
check("Evidence required by requirementClasses is populated (PERSISTENCE/READBACK/BLUEPRINT/LIFECYCLE/AUTH/CROSS-BUSINESS)", evidenceGaps.length === 0, evidenceGaps.slice(0, 10).join("; "));

// Never let a SOURCE_ONLY-only mechanism satisfy a persistence/lifecycle/auth requirement class.
const SOURCE_ONLY_MECH_PURPOSE_HINTS = ["catalog", "registry list"]; // mechanisms whose purpose is purely definitional
let misboundClasses: string[] = [];
for (const r of reqs) {
  const needsStrongEvidence = (r.requirementClasses ?? []).some((c: string) => ["PERSISTENCE", "LIFECYCLE_TRANSITION", "AUTHORIZATION", "CROSS_BUSINESS_ISOLATION"].includes(c));
  if (!needsStrongEvidence) continue;
  const boundMechs = mechanisms.filter((m) => r.mechanismIds.includes(m.mechanismId));
  const hasRealMechanism = boundMechs.some((m) => m.persistenceObject || m.authGuard || m.negativeTest || m.lifecycleEvidence);
  if (!hasRealMechanism && boundMechs.length > 0) {
    const allDefinitionalOnly = boundMechs.every((m) => !m.persistenceObject && !m.authGuard && !m.negativeTest);
    if (allDefinitionalOnly) misboundClasses.push(r.reqId);
  }
}
check("No PERSISTENCE/LIFECYCLE/AUTH/CROSS-BUSINESS row is bound only to a definitional (SOURCE_ONLY) mechanism", misboundClasses.length === 0, misboundClasses.slice(0, 10).join(", "));

// §14 Blueprint: 47/47.
const blueprintRows = reqs.filter((r) => r.mdSection === "14");
check("Blueprint categories 1-47 present", blueprintRows.length === 47, `got ${blueprintRows.length}`);
const blueprintNums = new Set(blueprintRows.map((r) => r.reqId));
const missingBlueprintNums = Array.from({ length: 47 }, (_, i) => `REQ-14.${i + 1}`).filter((id) => !blueprintNums.has(id));
check("Blueprint categories are exactly REQ-14.1 through REQ-14.47, no gaps", missingBlueprintNums.length === 0, missingBlueprintNums.join(", "));

// §33 Website Acceptance: 25/25.
const acceptanceRows = reqs.filter((r) => r.mdSection === "33");
check("Website acceptance steps 1-25 present", acceptanceRows.length === 25, `got ${acceptanceRows.length}`);

// §32 CTA states: 14/14.
const ctaRows = reqs.filter((r) => r.mdSection === "32");
check("CTA lifecycle states present (14)", ctaRows.length === 14, `got ${ctaRows.length}`);

// §9 industry branches: 48.
const industryRows = reqs.filter((r) => r.reqId.startsWith("REQ-9."));
check("Industry branch bullets present (48)", industryRows.length === 48, `got ${industryRows.length}`);

// Owner-meta: 6, separate, all OWNER_SUBJECTIVE_ONLY class, zero mechanismIds (by construction).
check("Owner-meta rows = 6, kept separate from the 610 MD count", ownerReqs.length === 6, `got ${ownerReqs.length}`);
const ownerNotSubjective = ownerReqs.filter((r) => !r.requirementClasses.includes("OWNER_SUBJECTIVE_ONLY"));
check("Every owner-meta row is classed OWNER_SUBJECTIVE_ONLY", ownerNotSubjective.length === 0, ownerNotSubjective.map((r) => r.reqId).join(", "));

console.log(`\n${failures === 0 ? "ALL CHECKS PASS" : `${failures} CHECK(S) FAILED`}`);
if (failures > 0) process.exit(1);
