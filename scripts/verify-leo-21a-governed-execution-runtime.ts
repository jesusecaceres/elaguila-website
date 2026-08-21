/**
 * LEO-21A Provider-Neutral Governed Execution Runtime verifier (static / fixture-safe).
 *
 * Run:
 *   npx tsx scripts/verify-leo-21a-governed-execution-runtime.ts
 *
 * Does NOT call providers. Does NOT mutate Supabase remote. Does NOT apply migrations.
 */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

import {
  LEO_CONNECTED_ACTION_FAILURE_CLASS_META,
  LEO_CONNECTED_ACTION_SAFE_FAILURE_CLASSES,
  LEO_CONNECTED_ACTION_EXECUTION_STATUSES,
  LEO_UNKNOWN_EXTERNAL_OUTCOME_PROPOSAL_STATE,
} from "../app/leo/_lib/leoConnectedActionExecutionTypes";
import {
  computeLeoConnectedActionAttemptId,
  leoConnectedActionMayBlindRetryExecute,
} from "../app/leo/_lib/leoConnectedActionExecutionPolicy";
import { leoProposalTruthLabelForState } from "../app/leo/_lib/leoConversationProposalBridge";
import { presentConnectedActionProposalStateLabel } from "../app/admin/(dashboard)/leo/_components/leoOwnerPresentation";

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

const typesPath = "app/leo/_lib/leoConnectedActionExecutionTypes.ts";
const adapterPath = "app/leo/_lib/leoConnectedActionProviderAdapter.ts";
const nullPath = "app/leo/_lib/leoNullConnectedActionProviderAdapter.ts";
const orchPath = "app/leo/_lib/leoConnectedActionExecutionService.ts";

for (const p of [typesPath, adapterPath, nullPath, orchPath]) {
  check(exists(p), `file exists: ${p}`);
}

const typesSrc = src(typesPath);
const adapterSrc = src(adapterPath);
const nullSrc = src(nullPath);
const orchSrc = src(orchPath);

check(
  typesSrc.includes("LeoConnectedActionExecutionRequest") &&
    typesSrc.includes("proposalFingerprint") &&
    typesSrc.includes("executionClaimKey") &&
    typesSrc.includes("attemptId"),
  "provider-neutral execution types exist",
);

check(
  LEO_CONNECTED_ACTION_EXECUTION_STATUSES.includes("PROVIDER_ACCEPTED") &&
    LEO_CONNECTED_ACTION_EXECUTION_STATUSES.includes("VERIFIED") &&
    LEO_CONNECTED_ACTION_EXECUTION_STATUSES.includes("UNKNOWN_EXTERNAL_OUTCOME"),
  "execution statuses distinguish accepted vs verified vs unknown",
);

check(
  LEO_CONNECTED_ACTION_SAFE_FAILURE_CLASSES.includes("NOT_CONNECTED") &&
    LEO_CONNECTED_ACTION_SAFE_FAILURE_CLASSES.includes("UNKNOWN_EXTERNAL_OUTCOME") &&
    LEO_CONNECTED_ACTION_FAILURE_CLASS_META.UNKNOWN_EXTERNAL_OUTCOME.reconcileFirst === true,
  "stable failure model exists with reconcileFirst for unknown",
);

check(
  adapterSrc.includes("canHandle") &&
    adapterSrc.includes("execute(") &&
    adapterSrc.includes("verify(") &&
    adapterSrc.includes("MUST NOT"),
  "adapter interface exists",
);

check(nullSrc.includes("leo.null_connected_action"), "null adapter exists");
check(
  nullSrc.includes("NOT_CONNECTED") &&
    nullSrc.includes("SCOPE_INSUFFICIENT") &&
    nullSrc.includes("externalSideEffectPossible: false") &&
    nullSrc.includes("externalSideEffectConfirmed: false"),
  "null adapter has no external effect",
);
check(
  !/users\.messages\.send|events\.insert|events\.patch|fetch\(/i.test(nullSrc),
  "null adapter has no provider write / fetch",
);

check(orchSrc.includes("requireLeoOwnerAccess"), "owner access required");
check(
  orchSrc.includes("APPROVED") && orchSrc.includes("NOT_APPROVED"),
  "approved state required",
);
check(
  orchSrc.includes("expectedFingerprint") && orchSrc.includes("FINGERPRINT_MISMATCH"),
  "fingerprint required",
);
check(
  orchSrc.includes("claimLeoActionProposalExecutionAtomic") &&
    orchSrc.indexOf("claimLeoActionProposalExecutionAtomic") <
      orchSrc.indexOf("adapter.execute"),
  "claim occurs before adapter execute",
);

check(
  !adapterSrc.includes("approveLeo") &&
    !adapterSrc.includes("claimLeo") &&
    !nullSrc.includes("approveLeo") &&
    !nullSrc.includes("claimLeo") &&
    !nullSrc.includes("transitionLeoActionProposal"),
  "adapter cannot approve / claim / mutate proposal state",
);

check(
  !adapterSrc.includes("governanceLevel") || adapterSrc.includes("MUST NOT"),
  "adapter contract forbids governance mutation",
);

check(
  orchSrc.includes("already_claimed") || orchSrc.includes("ALREADY_CLAIMED"),
  "one execution claim maximum surfaced",
);

{
  const unknownGate = leoConnectedActionMayBlindRetryExecute({
    priorStatus: "UNKNOWN_EXTERNAL_OUTCOME",
    priorExternalSideEffectPossible: true,
    mode: "execute",
  });
  check(!unknownGate.allowed, "unknown outcome cannot blind retry");
  const acceptedGate = leoConnectedActionMayBlindRetryExecute({
    priorStatus: "PROVIDER_ACCEPTED",
    priorExternalSideEffectPossible: true,
    mode: "execute",
  });
  check(!acceptedGate.allowed, "provider accepted requires verify-only — no blind resend");
}

check(
  typesSrc.includes("provider accepted") ||
    typesSrc.includes("provider accepted ≠ verified") ||
    typesSrc.includes("Never collapse") ||
    /PROVIDER_ACCEPTED[\s\S]*VERIFIED/.test(typesSrc),
  "provider accepted != verified documented in types",
);

check(
  orchSrc.includes("verificationState === \"VERIFIED\"") ||
    orchSrc.includes("verificationState === 'VERIFIED'"),
  "verification required for VERIFIED path",
);

check(
  orchSrc.includes("leoMarkGovernedActionProposal") &&
    orchSrc.includes("leoMarkGovernedActionProposalFailed"),
  "receipt/proposal lifecycle via existing mark helpers",
);

check(!exists("supabase/migrations/20260821"), "no new 21A migration directory invent");
const migrations = execSync("git ls-files supabase/migrations", {
  cwd: ROOT,
  encoding: "utf8",
})
  .trim()
  .split(/\r?\n/)
  .filter(Boolean);
check(
  !migrations.some((m) => /leo.?21a|governed.?execution/i.test(m)),
  "no new migration for LEO-21A",
);

check(
  !orchSrc.includes("create table") && !orchSrc.includes("apply_migration"),
  "no Supabase remote code action in orchestrator",
);

const gmail = src("app/leo/_lib/leoGmailAdapter.ts");
const cal = src("app/leo/_lib/leoCalendarAdapter.ts");
const oauth = src("app/leo/_lib/leoGoogleWorkspaceConfig.ts");
check(!/users\.messages\.send|drafts\.create/i.test(gmail), "no Gmail write");
check(!/events\.insert|events\.patch|events\.update/i.test(cal), "no Calendar write");
check(
  oauth.includes("gmail.readonly") && oauth.includes("calendar.readonly"),
  "gmail.readonly + calendar.readonly preserved",
);
check(
  !oauth.includes("gmail.send") &&
    !oauth.includes("gmail.compose") &&
    !oauth.includes("calendar.events"),
  "no new OAuth write scopes",
);

check(
  leoProposalTruthLabelForState("EXECUTION_CLAIMED", false) === "Executing",
  "EXECUTION_CLAIMED label not Prepared",
);
check(
  leoProposalTruthLabelForState("EXECUTED", false) === "Executed — verification pending",
  "EXECUTED label not Prepared",
);
check(
  leoProposalTruthLabelForState("VERIFIED", false) === "Verified",
  "VERIFIED label not Prepared",
);

const ui = presentConnectedActionProposalStateLabel("EXECUTION_CLAIMED");
check(ui.primary === "Executing", "owner UI vocabulary: Executing");
check(
  presentConnectedActionProposalStateLabel("EXECUTED").primary ===
    "Executed — verification pending",
  "owner UI vocabulary: Executed — verification pending",
);

const roadmap = src("docs/leo/LEO_MASTER_ROADMAP.md");
check(
  !/Next executable build:\s*LEO-17B/.test(roadmap),
  "roadmap no longer says 17B is next",
);
check(
  roadmap.includes("LEO-21A") && roadmap.includes("Governed Connected Actions"),
  "roadmap points at LEO-21A / LEO-21",
);

const ios = src("docs/leo/LEO_INTELLIGENCE_OPERATING_SYSTEM.md");
check(
  ios.includes("no blind resend") || ios.includes("No blind resend") || ios.includes("blind resend"),
  "docs: no blind resend",
);
check(
  ios.includes("CAPABILITY ≠ AUTHORITY") || ios.includes("CAPABILITY != AUTHORITY"),
  "docs: CAPABILITY != AUTHORITY",
);
check(
  ios.includes("claim") && ios.includes("provider side effect"),
  "docs: claim != provider side effect",
);

{
  const attemptA = computeLeoConnectedActionAttemptId({
    proposalId: "p1",
    executionClaimKey: "ck1",
    correlationId: "leo-proposal:p1",
  });
  const attemptB = computeLeoConnectedActionAttemptId({
    proposalId: "p1",
    executionClaimKey: "ck1",
    correlationId: "leo-proposal:p1",
  });
  check(attemptA === attemptB && attemptA.length === 32, "attempt id deterministic/bounded");
}

check(
  LEO_UNKNOWN_EXTERNAL_OUTCOME_PROPOSAL_STATE === "EXECUTION_CLAIMED",
  "unknown outcome maps to EXECUTION_CLAIMED without migration",
);

check(
  orchSrc.includes("CAPABILITY") || typesSrc.includes("CAPABILITY"),
  "CAPABILITY != AUTHORITY referenced in runtime contracts",
);

// Regressions
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

runRegression(
  "scripts/verify-leo-17b-conversation-proposal-wiring.ts",
  "LEO-17B regression passes",
);
runRegression("scripts/verify-leo-18a-entity-resolution.ts", "LEO-18a regression passes");
runRegression("scripts/verify-leo-18b-executive-context.ts", "LEO-18b regression passes");
runRegression("scripts/verify-leo-19a-intelligence-router.ts", "LEO-19a regression passes");
runRegression("scripts/verify-leo-19c-provider-adapter-runtime.ts", "LEO-19c regression passes");
runRegression(
  "scripts/verify-leo-20a-self-intelligence-foundation.ts",
  "LEO-20a regression passes",
);
runRegression(
  "scripts/verify-leo-20d-buyer-engagement-journey-sensor.ts",
  "LEO-20d regression passes",
);

if (failures > 0) {
  console.error(`\nLEO-21A verifier FAILED (${failures})`);
  process.exit(1);
}
console.log("\nLEO-21A verifier PASSED");
