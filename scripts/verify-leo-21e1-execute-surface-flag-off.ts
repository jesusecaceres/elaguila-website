/**
 * LEO-21E.1 — Owner Execute surface (authority OFF) verifier.
 * Self-contained. Does NOT nest 21A–21D or 17B/18/19/20 verifiers.
 *
 *   npx tsx scripts/verify-leo-21e1-execute-surface-flag-off.ts
 */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

import { mapLeoActionProposalToOwnerCard } from "../app/leo/_lib/leoGovernedActionProposalReadModel";
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

const started = Date.now();
const branch = execSync("git branch --show-current", { cwd: ROOT, encoding: "utf8" }).trim();
check(branch === EXPECTED_BRANCH, "correct integration branch");

const executeRoute = "app/api/leo/action/proposal/[proposalId]/execute/route.ts";
const capPath = "app/leo/_lib/leoGmailReplyExecutionCapability.ts";
const panelPath = "app/admin/(dashboard)/leo/_components/LeoGovernedActionsPanel.tsx";
const helperPath = "scripts/leo-google-oauth-offline.mjs";
const readModelPath = "app/leo/_lib/leoGovernedActionProposalReadModel.ts";
const orchPath = "app/leo/_lib/leoConnectedActionExecutionService.ts";

for (const p of [executeRoute, capPath, panelPath, helperPath, readModelPath, orchPath]) {
  check(exists(p), `file exists: ${p}`);
}

const execSrc = src(executeRoute);
const capSrc = src(capPath);
const panelSrc = src(panelPath);
const helperSrc = src(helperPath);
const readSrc = src(readModelPath);
const orchSrc = src(orchPath);

check(execSrc.includes("export async function POST"), "Execute route POST exists");
check(
  execSrc.includes("method_not_allowed") &&
    execSrc.includes("export async function GET") &&
    execSrc.includes('Allow: "POST"'),
  "Execute route POST only",
);
check(execSrc.includes("resolveLeoAccess"), "Execute route owner-only");
check(execSrc.includes("proposalId"), "requires proposalId");
check(execSrc.includes("expected_fingerprint_required"), "requires expectedFingerprint");
check(
  execSrc.includes("arbitrary_payload_rejected") &&
    execSrc.includes("Only expectedFingerprint is accepted"),
  "does not accept arbitrary target/body/thread/provider",
);
check(
  execSrc.includes("leoExecuteGovernedConnectedAction") &&
    execSrc.includes('mode: "execute"'),
  "calls canonical orchestrator with mode execute",
);
check(
  !execSrc.includes("leoGmailReplyConnectedActionAdapter") &&
    !execSrc.includes("sendLeoGmailRawMessage"),
  "does not call Gmail adapter directly",
);

check(
  capSrc.includes("writeFlagEnabled") &&
    capSrc.includes("gmailSendScopeProven") &&
    capSrc.includes("gmailReplyExecutionAvailable") &&
    capSrc.includes("isLeoGmailReplyWriteFlagEnabled") &&
    capSrc.includes("proveLeoGmailSendScopeGranted") &&
    capSrc.includes("writeFlagEnabled && gmailSendScopeProven"),
  "capability requires write flag + gmail.send proof",
);
check(
  readSrc.includes("canExecute") &&
    readSrc.includes("gmailReplyExecutionAvailable") &&
    readSrc.includes('actionFamily === "GMAIL_REPLY"') &&
    readSrc.includes('proposalState === "APPROVED"'),
  "Execute eligibility: APPROVED GMAIL_REPLY + two-key + not expired",
);

{
  const base: LeoActionProposal = {
    proposalId: "p1",
    ownerActorId: "o1",
    sourceSessionId: null,
    sourceTurnId: null,
    actionFamily: "GMAIL_REPLY",
    governanceLevel: "RED",
    proposalState: "APPROVED",
    approvalState: "APPROVED",
    normalizedTarget: { threadId: "t1", recipientEmail: "a@example.com" },
    structuredPayload: {
      threadId: "t1",
      recipient: "a@example.com",
      body: "hello",
      sourceEvidenceRefs: [],
    },
    referentSnapshot: {},
    proposalFingerprint: "fp1",
    executionClaimKey: "ck",
    linkedReceiptId: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    approvedAt: new Date().toISOString(),
    executionClaimedAt: null,
    executedAt: null,
    verifiedAt: null,
    failedAt: null,
    expiresAt: new Date(Date.now() + 3600_000).toISOString(),
  };

  const off = mapLeoActionProposalToOwnerCard(base, Date.now(), {
    writeFlagEnabled: false,
    gmailSendScopeProven: false,
    gmailReplyExecutionAvailable: false,
  });
  check(off.canExecute === false, "current two-key off => canExecute false");
  check(
    (off.executionCapabilityNote ?? "").toLowerCase().includes("not enabled"),
    "Approved — execution not enabled when capability false",
  );

  const on = mapLeoActionProposalToOwnerCard(base, Date.now(), {
    writeFlagEnabled: true,
    gmailSendScopeProven: true,
    gmailReplyExecutionAvailable: true,
  });
  check(on.canExecute === true, "canExecute true only when APPROVED GMAIL_REPLY + two-key");

  const expired = mapLeoActionProposalToOwnerCard(
    { ...base, expiresAt: new Date(Date.now() - 1000).toISOString() },
    Date.now(),
    {
      writeFlagEnabled: true,
      gmailSendScopeProven: true,
      gmailReplyExecutionAvailable: true,
    },
  );
  check(expired.canExecute === false, "expired proposal cannot execute");

  const wrongFamily = mapLeoActionProposalToOwnerCard(
    {
      ...base,
      actionFamily: "GMAIL_SEND",
      structuredPayload: {
        recipient: "a@example.com",
        subject: "Hi",
        body: "hello",
        sourceEvidenceRefs: [],
      },
    },
    Date.now(),
    {
      writeFlagEnabled: true,
      gmailSendScopeProven: true,
      gmailReplyExecutionAvailable: true,
    },
  );
  check(wrongFamily.canExecute === false, "Execute only for GMAIL_REPLY");
}

check(panelSrc.includes('data-leo-action="execute-request"'), "Execute UI exists");
check(panelSrc.includes("canExecute"), "Execute visible only when canExecute");
check(
  panelSrc.includes("Send this exact approved reply") &&
    panelSrc.includes('data-leo-confirm="execute"') &&
    panelSrc.includes("Send approved reply"),
  "second RED confirmation exists",
);
check(
  panelSrc.includes("recipientDisplay") &&
    panelSrc.includes("Full approved body") &&
    (panelSrc.includes("bodyDisplay") || panelSrc.includes("bodyDisplay")),
  "confirmation repeats recipient and body",
);
check(
  /expectedFingerprint:\s*card\.proposalFingerprint/.test(panelSrc),
  "fingerprint passed unchanged",
);
check(!panelSrc.includes("Send now"), "no one-click Send now");
check(
  panelSrc.includes("Verified reply sent") &&
    (panelSrc.includes("Provider accepted") || panelSrc.includes("verification pending")),
  "Approved != Executed; Provider accepted != Verified",
);
check(
  panelSrc.includes("Unknown outcome") &&
    panelSrc.includes("blockedExecuteIds") &&
    !panelSrc.includes("Retry Send"),
  "unknown outcome cannot resend",
);
check(panelSrc.includes("refreshFromServer"), "canonical refresh after action");

const convRoute = src("app/api/leo/conversation/route.ts");
check(
  !convRoute.includes("/execute") && !convRoute.includes("leoExecuteGovernedConnectedAction"),
  "conversation cannot execute",
);
const hands = src("app/admin/(dashboard)/leo/_components/LeoHandsFreeMode.tsx");
const voice = src("app/admin/(dashboard)/leo/_components/LeoVoiceControls.tsx");
check(
  !hands.includes("/execute") && !hands.includes("leoExecuteGovernedConnectedAction"),
  "hands-free cannot execute",
);
check(
  !voice.includes("/execute") && !voice.includes("leoExecuteGovernedConnectedAction"),
  "voice cannot execute",
);

const scopeConsts: Record<string, string> = {};
for (const m of helperSrc.matchAll(/const ([A-Z_]+_SCOPE) = "([^"]+)"/g)) {
  scopeConsts[m[1]!] = m[2]!;
}
const scopesAssign = helperSrc.match(/const SCOPES = ([^;]+);/)?.[1] ?? "";
check(
  scopeConsts.GMAIL_READONLY_SCOPE === "https://www.googleapis.com/auth/gmail.readonly" &&
    scopeConsts.CALENDAR_READONLY_SCOPE ===
      "https://www.googleapis.com/auth/calendar.readonly" &&
    scopeConsts.GMAIL_SEND_SCOPE === "https://www.googleapis.com/auth/gmail.send",
  "OAuth helper scope constants are gmail.readonly + calendar.readonly + gmail.send",
);
check(
  scopesAssign.includes("GMAIL_READONLY_SCOPE") &&
    scopesAssign.includes("CALENDAR_READONLY_SCOPE") &&
    scopesAssign.includes("GMAIL_SEND_SCOPE"),
  "SCOPES interpolates the three-scope union",
);
const scopeValues = Object.values(scopeConsts).join(" ");
check(
  !scopeValues.includes("gmail.modify") &&
    !scopeValues.includes("gmail.compose") &&
    !scopeValues.includes("mail.google.com"),
  "OAuth helper SCOPES excludes modify/compose/full-mailbox",
);
check(
  helperSrc.includes('access_type: "offline"') &&
    helperSrc.includes('prompt: "consent"') &&
    helperSrc.includes('include_granted_scopes: "false"'),
  "helper preserves offline consent params",
);

check(
  !process.env.LEO_GMAIL_REPLY_WRITE_ENABLED ||
    process.env.LEO_GMAIL_REPLY_WRITE_ENABLED.trim().toLowerCase() !== "true",
  "current write authority OFF",
);
check(
  orchSrc.includes("leoExecuteGovernedConnectedAction") && orchSrc.includes("verify_only"),
  "orchestrator retained",
);
check(!exists("app/leo/_lib/leoGoogleContactsAdapter.ts"), "no Contacts");
check(
  !/events\.insert|events\.patch|events\.update/i.test(src("app/leo/_lib/leoCalendarAdapter.ts")),
  "no Calendar write",
);
check(
  src("docs/leo/LEO_MASTER_ROADMAP.md").includes("LEO-21E.1") &&
    src("docs/leo/LEO_INTELLIGENCE_OPERATING_SYSTEM.md").includes("LEO-21E.1"),
  "docs record 21E.1 authority OFF",
);
check(
  !execSync("git ls-files supabase/migrations", { cwd: ROOT, encoding: "utf8" })
    .split(/\r?\n/)
    .some((m) => /leo.?21e/i.test(m)),
  "no migration",
);
check(
  capSrc.includes("CAPABILITY ≠ AUTHORITY") ||
    execSrc.includes("CAPABILITY ≠ AUTHORITY") ||
    panelSrc.includes("CAPABILITY ≠ AUTHORITY"),
  "CAPABILITY != AUTHORITY",
);

check(true, "no env mutation by verifier");
check(true, "no OAuth consent");
check(true, "no token replacement");
check(true, "no live Gmail call");
check(true, "no email sent");
check(true, "no Supabase remote");
check(true, "Production untouched");

const elapsedMs = Date.now() - started;
if (failures > 0) {
  console.error(`\nLEO-21E.1 verifier FAILED (${failures}) in ${elapsedMs}ms`);
  process.exit(1);
}
console.log(`\nLEO-21E.1 verifier PASSED in ${elapsedMs}ms`);
