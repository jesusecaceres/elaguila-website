/**
 * LEO-21B Governed Action Approval Cockpit verifier (static / fixture-safe).
 *
 * Run:
 *   npx tsx scripts/verify-leo-21b-governed-action-approval-cockpit.ts
 *
 * No provider calls. No Supabase remote mutation. No migrations.
 */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

import {
  mapLeoActionProposalToOwnerCard,
  presentGovernedActionStatus,
  sortLeoGovernedActionCards,
} from "../app/leo/_lib/leoGovernedActionProposalReadModel";
import type { LeoActionProposal } from "../app/leo/_lib/leoActionProposalTypes";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const EXPECTED_BRANCH = "integration/leo-executive-operating-intelligence-2026-08";

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

const pagePath = "app/admin/(dashboard)/leo/page.tsx";
const panelPath = "app/admin/(dashboard)/leo/_components/LeoGovernedActionsPanel.tsx";
const readModelPath = "app/leo/_lib/leoGovernedActionProposalReadModel.ts";
const listRoute = "app/api/leo/action/proposals/route.ts";
const mutateRoute = "app/api/leo/action/proposal/[proposalId]/route.ts";
const repoPath = "app/leo/_lib/leoActionProposalRepository.ts";
const svcPath = "app/leo/_lib/leoActionProposalService.ts";

for (const p of [pagePath, panelPath, readModelPath, listRoute, mutateRoute, repoPath, svcPath]) {
  check(exists(p), `file exists: ${p}`);
}

const pageSrc = src(pagePath);
const panelSrc = src(panelPath);
const readSrc = src(readModelPath);
const listSrc = src(listRoute);
const mutateSrc = src(mutateRoute);
const repoSrc = src(repoPath);
const svcSrc = src(svcPath);

check(pageSrc.includes("LeoGovernedActionsPanel"), "existing /admin/leo reused with cockpit");
check(
  repoSrc.includes("listLeoActionProposalsForOwner") &&
    svcSrc.includes("leoListGovernedActionProposalCardsForOwner"),
  "owner proposal list/read model exists",
);
check(
  repoSrc.includes('.from("leo_action_proposals")') &&
    !panelSrc.includes("localStorage") &&
    !readSrc.includes("CREATE TABLE"),
  "canonical proposal store reused — no second store",
);

check(presentGovernedActionStatus("AWAITING_APPROVAL").primary === "Needs approval", "Needs approval visible");
check(presentGovernedActionStatus("PREPARED").primary === "Prepared", "Prepared visible");
check(
  presentGovernedActionStatus("APPROVED").primary ===
    "Approved — execution capability not enabled yet",
  "Approved visible",
);
check(presentGovernedActionStatus("EXECUTION_CLAIMED").primary === "Executing", "Executing visible");
check(
  presentGovernedActionStatus("EXECUTED").primary === "Executed — verification pending",
  "Executed pending verification visible",
);
check(presentGovernedActionStatus("VERIFIED").primary === "Verified", "Verified visible");
check(presentGovernedActionStatus("FAILED").primary === "Failed", "Failed visible");
check(presentGovernedActionStatus("CANCELLED").primary === "Cancelled", "Cancelled visible");
check(presentGovernedActionStatus("EXPIRED").primary === "Expired", "Expired visible");

check(panelSrc.includes("RED") || panelSrc.includes("governanceLevel"), "RED governance visible");
check(panelSrc.includes("targetSummary") || panelSrc.includes("Target:"), "target visible");
check(
  panelSrc.includes("Exact consequential content") && panelSrc.includes("payloadDetails"),
  "payload visible before approval",
);

check(
  mutateSrc.includes("expectedFingerprint") &&
    panelSrc.includes("expectedFingerprint") &&
    panelSrc.includes('action: "approve"'),
  "approve requires proposalId + expectedFingerprint",
);
check(
  mutateSrc.includes("resolveLeoAccess") && listSrc.includes("resolveLeoAccess"),
  "approve/list owner-gated via resolveLeoAccess",
);
check(mutateSrc.includes('action === "cancel"') || mutateSrc.includes("cancel"), "cancel owner-only route");

const convRoute = src("app/api/leo/conversation/route.ts");
check(
  !convRoute.includes("leoApproveGovernedActionProposal") &&
    !convRoute.includes("action/proposal"),
  "conversation POST cannot approve",
);
const hands = src("app/admin/(dashboard)/leo/_components/LeoHandsFreeMode.tsx");
const voice = src("app/admin/(dashboard)/leo/_components/LeoVoiceControls.tsx");
check(!hands.includes("action/proposal"), "hands-free cannot approve");
check(!voice.includes("action/proposal") && !voice.includes("expectedFingerprint"), "voice cannot approve");

check(
  panelSrc.includes("data-leo-confirm") &&
    panelSrc.includes("Approve this exact action"),
  "explicit confirmation exists",
);
check(
  panelSrc.includes("does not") &&
    panelSrc.includes("not enabled") &&
    !panelSrc.includes("Send now"),
  "approval does not imply execution",
);

check(!/data-leo-action=\"execute\"|Execute now|>Execute</i.test(panelSrc), "no Execute button");
check(!/>\s*Send\s*</.test(panelSrc) && !panelSrc.includes("Send now"), "no Send button");
check(!/>\s*Schedule\s*</.test(panelSrc) && !panelSrc.includes("Schedule now"), "no Schedule button");
check(
  !panelSrc.includes("leoExecuteGovernedConnectedAction") &&
    !panelSrc.includes("leoNullConnectedAction") &&
    !panelSrc.includes("adapter.execute"),
  "no provider invocation from UI",
);

const gmail = src("app/leo/_lib/leoGmailAdapter.ts");
const cal = src("app/leo/_lib/leoCalendarAdapter.ts");
const oauth = src("app/leo/_lib/leoGoogleWorkspaceConfig.ts");
check(!/users\.messages\.send/i.test(gmail), "Gmail readonly");
check(!/events\.insert|events\.patch/i.test(cal), "Calendar readonly");
check(
  oauth.includes("gmail.readonly") &&
    oauth.includes("calendar.readonly") &&
    oauth.includes("LEO_GOOGLE_EXPECTED_SCOPES = LEO_GOOGLE_CURRENT_READ_SCOPES") &&
    /LEO_GMAIL_REPLY_WRITE_CAPABILITY_ENABLED[^=]*= false/.test(oauth),
  "no OAuth write scopes enabled in active grant",
);

const migrations = execSync("git ls-files supabase/migrations", {
  cwd: ROOT,
  encoding: "utf8",
})
  .trim()
  .split(/\r?\n/)
  .filter(Boolean);
check(!migrations.some((m) => /leo.?21b|approval.?cockpit/i.test(m)), "no new migration");
check(!panelSrc.includes("apply_migration") && !listSrc.includes("apply_migration"), "no Supabase remote change");

{
  const fixture: LeoActionProposal = {
    proposalId: "p1",
    ownerActorId: "owner",
    sourceSessionId: null,
    sourceTurnId: null,
    actionFamily: "GMAIL_SEND",
    governanceLevel: "RED",
    proposalState: "AWAITING_APPROVAL",
    approvalState: "PENDING",
    normalizedTarget: { recipient: "a@example.com" },
    structuredPayload: {
      recipient: "a@example.com",
      subject: "Hello",
      body: "World body content",
      sourceEvidenceRefs: [],
    },
    referentSnapshot: {},
    proposalFingerprint: "fp123",
    executionClaimKey: "ck",
    linkedReceiptId: "receipt-1",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    approvedAt: null,
    executionClaimedAt: null,
    executedAt: null,
    verifiedAt: null,
    failedAt: null,
    expiresAt: new Date(Date.now() + 3600_000).toISOString(),
  };
  const card = mapLeoActionProposalToOwnerCard(fixture);
  check(card.canApprove === true, "fixture awaiting approval is approvable");
  check(card.governanceLevel === "RED", "fixture RED");
  check(card.targetSummary.includes("a@example.com"), "fixture target from payload");
  check(card.payloadDetails.some((d) => d.includes("World body")), "fixture body visible");
  check(card.proposalFingerprint === "fp123", "fingerprint preserved for approve");

  const expired = mapLeoActionProposalToOwnerCard({
    ...fixture,
    expiresAt: new Date(Date.now() - 1000).toISOString(),
  });
  check(expired.canApprove === false, "expired not approvable");

  const sorted = sortLeoGovernedActionCards([
    mapLeoActionProposalToOwnerCard({ ...fixture, proposalId: "v", proposalState: "VERIFIED", approvalState: "APPROVED" }),
    mapLeoActionProposalToOwnerCard({ ...fixture, proposalId: "a", proposalState: "AWAITING_APPROVAL" }),
  ]);
  check(sorted[0]?.proposalId === "a", "priority: needs approval before verified");
}

const roadmap = src("docs/leo/LEO_MASTER_ROADMAP.md");
check(roadmap.includes("LEO-21B") && roadmap.includes("Approval Cockpit"), "docs mention 21B cockpit");
const ios = src("docs/leo/LEO_INTELLIGENCE_OPERATING_SYSTEM.md");
check(ios.includes("LEO-21B") && ios.includes("CAPABILITY"), "CAPABILITY != AUTHORITY docs");

check(pageSrc.includes("Governed Actions") || panelSrc.includes("Governed Actions"), "cockpit heading");

function runRegression(script: string, label: string) {
  try {
    execSync(`npx tsx ${script}`, { cwd: ROOT, stdio: "pipe", encoding: "utf8" });
    check(true, label);
  } catch (e: any) {
    const out = `${e?.stdout ?? ""}${e?.stderr ?? ""}`;
    console.error(out.slice(-2000));
    check(false, label);
  }
}

runRegression("scripts/verify-leo-21a-governed-execution-runtime.ts", "21A verifier passes");
runRegression("scripts/verify-leo-17b-conversation-proposal-wiring.ts", "LEO-17B regression passes");
runRegression("scripts/verify-leo-18a-entity-resolution.ts", "LEO-18a regression passes");
runRegression("scripts/verify-leo-18b-executive-context.ts", "LEO-18b regression passes");
runRegression("scripts/verify-leo-19a-intelligence-router.ts", "LEO-19a regression passes");
runRegression("scripts/verify-leo-19c-provider-adapter-runtime.ts", "LEO-19c regression passes");
runRegression("scripts/verify-leo-20a-self-intelligence-foundation.ts", "LEO-20a regression passes");
runRegression(
  "scripts/verify-leo-20d-buyer-engagement-journey-sensor.ts",
  "LEO-20d regression passes",
);

if (failures > 0) {
  console.error(`\nLEO-21B verifier FAILED (${failures})`);
  process.exit(1);
}
console.log("\nLEO-21B verifier PASSED");
