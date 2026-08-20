/**
 * LEO-17A Connected Action Persistence Foundation verifier (static / fixture-safe).
 *
 * Run:
 *   npx tsx scripts/verify-leo-17a-connected-action-persistence.ts
 *
 * Does NOT apply migrations remotely. Does NOT call live Supabase.
 */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

import { computeLeoActionProposalFingerprint } from "../app/leo/_lib/leoActionProposalFingerprint";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const EXPECTED_BRANCH = "integration/leo-executive-operating-intelligence-2026-08";
const MIGRATION = "supabase/migrations/20260820010000_leo17a_connected_action_proposals.sql";

function src(rel: string): string {
  return readFileSync(path.join(ROOT, rel), "utf8");
}
function exists(rel: string): boolean {
  return existsSync(path.join(ROOT, rel));
}

let failures = 0;
const check = (ok: boolean, label: string) => {
  if (ok) console.log(`PASS  ${label}`);
  else {
    failures += 1;
    console.error(`FAIL  ${label}`);
  }
};

const branch = execSync("git branch --show-current", { cwd: ROOT, encoding: "utf8" }).trim();
check(branch === EXPECTED_BRANCH, "correct integration branch");

check(exists(MIGRATION), "migration file exists");
const migrationSql = src(MIGRATION);
check(
  migrationSql.includes("CREATE TABLE IF NOT EXISTS public.leo_action_proposals"),
  "table: leo_action_proposals created",
);
check(
  migrationSql.includes("ALTER TABLE public.leo_action_proposals ENABLE ROW LEVEL SECURITY"),
  "RLS enabled",
);
check(!migrationSql.includes("CREATE POLICY"), "no CREATE POLICY in migration");
check(
  migrationSql.includes("UNIQUE (execution_claim_key)") ||
    migrationSql.includes("execution_claim_key_uq"),
  "UNIQUE execution_claim_key present",
);
check(
  migrationSql.includes("'GMAIL_SEND'") &&
    migrationSql.includes("'GMAIL_REPLY'") &&
    migrationSql.includes("'CALENDAR_CREATE'") &&
    migrationSql.includes("'CALENDAR_UPDATE'"),
  "action_family CHECK includes required families",
);
check(migrationSql.includes("IN ('RED')"), "governance_level CHECK locks to RED");
check(
  migrationSql.includes("'AWAITING_APPROVAL'") && migrationSql.includes("'EXECUTION_CLAIMED'"),
  "proposal_state CHECK includes key states",
);
check(migrationSql.includes("expires_at timestamptz NOT NULL"), "expires_at present and NOT NULL");

const typesPath = "app/leo/_lib/leoActionProposalTypes.ts";
const fpPath = "app/leo/_lib/leoActionProposalFingerprint.ts";
const repoPath = "app/leo/_lib/leoActionProposalRepository.ts";
const svcPath = "app/leo/_lib/leoActionProposalService.ts";
const routePath = "app/api/leo/action/proposal/[proposalId]/route.ts";

for (const p of [typesPath, fpPath, repoPath, svcPath, routePath]) {
  check(exists(p), `file exists: ${p}`);
}

const typesSrc = src(typesPath);
check(typesSrc.includes("GMAIL_SEND") && typesSrc.includes("CALENDAR_UPDATE"), "types include all action families");
check(
  typesSrc.includes("AWAITING_APPROVAL") && typesSrc.includes("EXECUTION_CLAIMED"),
  "types include required state model",
);

const fpSrc = src(fpPath);
check(fpSrc.includes('createHash("sha256")') || fpSrc.includes("createHash('sha256')"), "fingerprint uses sha256");
check(!fpSrc.includes("Math.random"), "fingerprint does not use Math.random");
check(!fpSrc.includes("Date.now") && !fpSrc.includes("new Date("), "fingerprint excludes timestamps");

const baseInput = {
  ownerActorId: "owner-1",
  actionFamily: "GMAIL_SEND" as const,
  normalizedTarget: { recipient: "maria@example.com" },
  structuredPayload: {
    recipient: "maria@example.com",
    subject: "Hello",
    body: "Body",
    sourceEvidenceRefs: ["x"],
  },
  referentSnapshot: { resolvedFrom: "user_message" },
};
const fp1 = computeLeoActionProposalFingerprint(baseInput);
const fp2 = computeLeoActionProposalFingerprint(baseInput);
check(fp1 === fp2 && fp1.length > 10, "fingerprint stable for identical input");

const fpChanged = computeLeoActionProposalFingerprint({
  ...baseInput,
  structuredPayload: { ...baseInput.structuredPayload, body: "DIFFERENT BODY" },
});
check(fpChanged !== fp1, "fingerprint changes when payload changes");

const repoSrc = src(repoPath);
check(
  repoSrc.includes("claimLeoActionProposalExecutionAtomic") &&
    repoSrc.includes('.from("leo_action_proposals"') &&
    repoSrc.includes(".update("),
  "claim uses update on leo_action_proposals",
);
check(repoSrc.includes('.eq("proposal_state", "APPROVED")'), "claim requires proposal_state=APPROVED");
check(repoSrc.includes('.is("execution_claimed_at", null)'), "claim requires execution_claimed_at IS NULL");
check(repoSrc.includes('.gt("expires_at", now)'), "claim requires expires_at > now");

const svcSrc = src(svcPath);
check(svcSrc.includes("requireLeoOwnerAccess("), "service derives owner via requireLeoOwnerAccess");
check(svcSrc.includes("leoApproveGovernedActionProposal"), "service exposes approve function");
check(svcSrc.includes("expectedFingerprint"), "service requires expectedFingerprint for approval");

const claimIdx = svcSrc.indexOf("export async function leoClaimGovernedActionProposalExecution");
const claimEnd = svcSrc.indexOf("export async function leoGetGovernedActionProposalForOwner", claimIdx);
const claimSection =
  claimIdx >= 0 ? svcSrc.slice(claimIdx, claimEnd > claimIdx ? claimEnd : claimIdx + 1500) : "";
check(!claimSection.includes("leoMarkReceiptExecuted("), "claim does not mark receipts EXECUTED");
check(!claimSection.includes("leoMarkReceiptVerified("), "claim does not mark receipts VERIFIED");
check(svcSrc.includes("leoMarkReceiptAwaitingApproval("), "service creates AWAITING_APPROVAL receipts when needed");
check(svcSrc.includes("leoClaimGovernedActionProposalExecution"), "service exposes claim function");

const routeSrc = src(routePath);
check(routeSrc.includes("resolveLeoAccess("), "route resolves owner access");
check(
  routeSrc.includes("b.action") && routeSrc.includes('"approve"') && routeSrc.includes('"cancel"'),
  "route validates approve/cancel action",
);
check(
  !/gmail\.send|events\.insert|calendar\.events/i.test(routeSrc),
  "route does not reference Gmail/Calendar provider writes",
);

const oauthSrc = src("app/leo/_lib/leoGoogleWorkspaceConfig.ts");
check(oauthSrc.includes("READONLY"), "OAuth config still mentions READONLY scopes");
check(
  !/gmail\.send|calendar\.events|people\.|connections\./i.test(oauthSrc),
  "OAuth config does not include write-scopes (static)",
);

const toolServiceSrc = src("app/leo/_lib/leoToolService.ts");
check(
  toolServiceSrc.includes("WRITE_EXECUTE_BLOCKED") || /WRITE.*EXECUTE.*blocked/i.test(toolServiceSrc),
  "tool request gate blocks WRITE/EXECUTE",
);

const handsFree = src("app/admin/(dashboard)/leo/_components/LeoHandsFreeMode.tsx");
check(!handsFree.includes("action/proposal"), "hands-free mode does not call proposal approval route (static)");

const gmailAdapter = src("app/leo/_lib/leoGmailAdapter.ts");
const calendarAdapter = src("app/leo/_lib/leoCalendarAdapter.ts");
check(!/users\.messages\.send|drafts\.create|messages\.modify/i.test(gmailAdapter), "Gmail adapter has no write calls");
check(!/events\.insert|events\.patch|events\.update|events\.delete/i.test(calendarAdapter), "Calendar adapter has no write calls");

const execReports = src("app/leo/_lib/leoExecutiveReportingAdapters.ts");
check(
  execReports.includes("leo_action_proposals") && execReports.includes("AWAITING_APPROVAL"),
  "executive reporting projects proposal awaiting-approval truth",
);

if (failures > 0) {
  process.exit(1);
}

console.log("\nLEO-17A verifier PASS");
