/**
 * LEO-22QA.1 — Conversation submit / composer recovery (source contract).
 * Self-contained. Does not nest historical verifiers.
 *
 *   npx tsx scripts/verify-leo-22qa1-conversation-submit-recovery.ts
 */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

import { classifyLeoConversationFailure } from "../app/leo/_lib/leoConversationRouter";
import { applyDictationTranscriptToComposer } from "../app/leo/_lib/leoSpeechRecognition";
import { resolveLeoPresentationIntent } from "../app/leo/_lib/leoPresentationIntent";

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

const route = "app/api/leo/conversation/route.ts";
const panel = "app/admin/(dashboard)/leo/_components/LeoConversationPanel.tsx";
const session = "app/leo/_lib/leoConversationSessionService.ts";
const acks = "app/leo/_lib/leoAttentionAckService.ts";
const cfg = "app/leo/_lib/leoGoogleWorkspaceConfig.ts";

for (const f of [route, panel, session, acks, "app/leo/_lib/leoSpeechRecognition.ts"]) {
  check(exists(f), `exists ${f}`);
}

const routeSrc = src(route);
const panelSrc = src(panel);
const sessionSrc = src(session);
const ackSrc = src(acks);
const handsFree = src("app/admin/(dashboard)/leo/_components/LeoHandsFreeMode.tsx");
const presentation = src("app/leo/_lib/leoPresentationIntent.ts");
const gmailCfg = src(cfg);

check(routeSrc.includes('fetch("/api/leo/conversation"') === false, "route file is the canonical endpoint");
check(panelSrc.includes('fetch("/api/leo/conversation"'), "typed/dictation submit uses /api/leo/conversation");
check(handsFree.includes("onSubmit") && panelSrc.includes("onSubmit={(text) => submit(text)}"), "hands-free uses same submit path");
check(
  panelSrc.includes("activeWorkspace: workspace.activeWorkspace") ||
    panelSrc.includes("activeWorkspace: workspace.activeWorkspace"),
  "activeWorkspace is sent on clientContext",
);
check(sessionSrc.includes("missing_auth_user_id") && sessionSrc.includes("persistence_unavailable"), "persist fail-softs missing auth user id");
check(ackSrc.includes("missing_auth_user_id") && ackSrc.includes("UNAVAILABLE"), "attention ACK list fail-opens without owner id");
check(routeSrc.includes("classifyLeoConversationFailure"), "API classifies thrown failures");
check(panelSrc.includes("lastSubmittedRef") && panelSrc.includes('writeDraft("")'), "submit clears composer/draft");
check(panelSrc.includes("dictationMode") && panelSrc.includes('"replace"'), "stale composer dictation replaces");
check(panelSrc.includes("retryLocalId"), "retry uses failed turn text");
check(presentation.includes("take me to my reports") && presentation.includes("take me to gmail"), "deterministic navigation phrases");
check(
  panelSrc.includes("leoIntentIsWorkspaceCommand") &&
    panelSrc.includes("workspace.applyPresentationIntent"),
  "deterministic navigation does not require AI transport",
);
check(gmailCfg.includes('v.trim().toLowerCase() === "true"'), "Gmail write flag unchanged");
check(!panelSrc.includes("leoExecuteGovernedConnectedAction"), "no RED bypass on panel");

check(
  classifyLeoConversationFailure(new Error("LEO access denied: missing_auth_user_id")).code ===
    "owner_auth_required",
  "classifier maps missing auth user id",
);
check(
  applyDictationTranscriptToComposer("What needs my attention today", "Take me to my reports", "replace") ===
    "Take me to my reports",
  "replace mode does not concatenate stale text",
);
check(
  applyDictationTranscriptToComposer("draft left", "and more", "merge") === "draft left and more",
  "merge mode preserves owner draft",
);
check(
  resolveLeoPresentationIntent("Take me to my reports").kind === "PRESENT" &&
    resolveLeoPresentationIntent("Take me to my reports").kind !== "NONE",
  "take me to my reports is a presentation command",
);
check(
  !process.env.LEO_GMAIL_REPLY_WRITE_ENABLED ||
    process.env.LEO_GMAIL_REPLY_WRITE_ENABLED.trim().toLowerCase() !== "true",
  "write flag remains OFF",
);

const elapsedMs = Date.now() - started;
if (failures > 0) {
  console.error(`\nLEO-22QA.1 verifier FAILED (${failures}) in ${elapsedMs}ms`);
  process.exit(1);
}
console.log(`\nLEO-22QA.1 verifier PASSED in ${elapsedMs}ms`);
