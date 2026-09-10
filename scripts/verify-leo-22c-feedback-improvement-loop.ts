/**
 * LEO-22C — Feedback + sources + self-improvement loop (source contract).
 * Self-contained. Does not nest historical verifiers. Does not apply migrations.
 *
 *   npx tsx scripts/verify-leo-22c-feedback-improvement-loop.ts
 */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

import { classifyLeoFeedbackFailure } from "../app/leo/_lib/leoFeedbackClassification";
import { aggregateLeoFeedbackQuality } from "../app/leo/_lib/leoFeedbackMetrics";
import { leoFeedbackToRegressionCandidate } from "../app/leo/_lib/leoFeedbackRegressionCandidates";
import { extractLeoAnswerSourceRefs } from "../app/leo/_lib/leoFeedbackSources";

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

const files = [
  "app/leo/_lib/leoFeedbackTypes.ts",
  "app/leo/_lib/leoFeedbackClassification.ts",
  "app/leo/_lib/leoFeedbackMetrics.ts",
  "app/leo/_lib/leoFeedbackRegressionCandidates.ts",
  "app/leo/_lib/leoFeedbackRepository.ts",
  "app/leo/_lib/leoFeedbackService.ts",
  "app/leo/_lib/leoFeedbackSources.ts",
  "app/api/leo/feedback/route.ts",
  "app/admin/(dashboard)/leo/_components/LeoResponseActionBar.tsx",
  "app/admin/(dashboard)/leo/_components/LeoFeedbackQualityCard.tsx",
  "supabase/migrations/20260822120000_leo22c_response_feedback.sql",
];
for (const f of files) check(exists(f), `exists ${f}`);

const types = src("app/leo/_lib/leoFeedbackTypes.ts");
const bar = src("app/admin/(dashboard)/leo/_components/LeoResponseActionBar.tsx");
const svc = src("app/leo/_lib/leoFeedbackService.ts");
const api = src("app/api/leo/feedback/route.ts");
const mig = src("supabase/migrations/20260822120000_leo22c_response_feedback.sql");
const turn = src("app/admin/(dashboard)/leo/_components/LeoConversationTurn.tsx");
const si = src("app/admin/(dashboard)/leo/_components/LeoSelfIntelligencePanel.tsx");
const gmail = src("app/leo/_lib/leoGoogleWorkspaceConfig.ts");

check(types.includes("POSITIVE") && types.includes("NEGATIVE"), "feedback polarity model");
check(types.includes("WRONG_ANSWER") && types.includes("WRONG_NAVIGATION"), "structured failure taxonomy");
check(types.includes("UNDERSTANDING") && types.includes("NAVIGATION"), "failure class model");
check(svc.includes("upsertLeoResponseFeedback") && svc.includes("requireLeoOwnerAccess"), "positive/negative persistence path");
check(svc.includes("insertLeoFactCorrectionProposal") && svc.includes("PROPOSED"), "fact correction governed as proposal");
check(!svc.includes("status: \"ACCEPTED\"") && !svc.includes("rewriteLivingBook"), "feedback cannot rewrite truth directly");
check(bar.includes("Copy") && bar.includes("Thumbs up") && bar.includes("Thumbs down"), "response action bar");
check(bar.includes("Read aloud") && bar.includes("Sources"), "read aloud + sources actions");
check(bar.includes("clipboard.writeText") && bar.includes("Copied"), "copy action");
check(bar.includes("Tell LEO what should have happened"), "owner correction note");
check(bar.includes("proposeFactCorrection"), "fact correction opt-in");
check(src("app/leo/_lib/leoFeedbackSources.ts").includes("extractLeoAnswerSourceRefs") && src("app/leo/_lib/leoFeedbackSources.ts").includes("SECRETISH"), "sources evidence-backed + secret strip");
check(classifyLeoFeedbackFailure("WRONG_NAVIGATION") === "NAVIGATION", "selected category wins classification");
check(classifyLeoFeedbackFailure("VOICE_RECOGNITION_ERROR") === "VOICE_RECOGNITION", "voice class mapping");
check(
  aggregateLeoFeedbackQuality([]).positiveRate === null &&
    aggregateLeoFeedbackQuality([]).limitation != null,
  "empty quality snapshot is honest",
);
check(
  leoFeedbackToRegressionCandidate({
    id: "f1",
    polarity: "NEGATIVE",
    failureClass: "NAVIGATION",
    requestSnapshot: "take me to the dashboard",
    expectedDestination: "HOME",
    activeWorkspace: "TECHNOLOGY",
  })?.expected === "HOME",
  "regression candidate helper",
);
check(extractLeoAnswerSourceRefs(null).length === 0, "no invented sources");
check(turn.includes("LeoResponseActionBar") && turn.includes("turn.turnId"), "stable response identity");
check(si.includes("LeoFeedbackQualityCard"), "self-intelligence feedback metrics");
check(api.includes("resolveLeoAccess") && !api.includes("messages.send"), "owner-only API, no Gmail send");
check(mig.includes("ENABLE ROW LEVEL SECURITY") && !mig.includes("TO anon") && !mig.includes("TO authenticated"), "RLS fail-closed");
check(!mig.includes("APPLY NOW") && exists("supabase/migrations/20260822120000_leo22c_response_feedback.sql"), "migration authored not applied in this gate");
check(gmail.includes('v.trim().toLowerCase() === "true"'), "Gmail write flag unchanged");
check(!bar.includes("leoExecuteGovernedConnectedAction") && !svc.includes("leoExecuteGovernedConnectedAction"), "no RED bypass");
check(src("app/admin/(dashboard)/leo/_components/LeoOperatingShell.tsx").includes("data-leo-conversation-first"), "22A preserved");
check(src("app/leo/_lib/leoSpokenContext.ts").includes("resolveLeoReadableContext"), "22B preserved");

check(
  !process.env.LEO_GMAIL_REPLY_WRITE_ENABLED ||
    process.env.LEO_GMAIL_REPLY_WRITE_ENABLED.trim().toLowerCase() !== "true",
  "write flag remains OFF",
);

const elapsedMs = Date.now() - started;
if (failures > 0) {
  console.error(`\nLEO-22C verifier FAILED (${failures}) in ${elapsedMs}ms`);
  process.exit(1);
}
console.log(`\nLEO-22C verifier PASSED in ${elapsedMs}ms`);
