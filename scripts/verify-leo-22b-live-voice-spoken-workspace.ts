/**
 * LEO-22B — Live voice + read-aloud + spoken workspace (source contract).
 * Self-contained. Does not nest historical verifiers.
 *
 *   npx tsx scripts/verify-leo-22b-live-voice-spoken-workspace.ts
 */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

import { resolveLeoPresentationIntent } from "../app/leo/_lib/leoPresentationIntent";
import {
  resolveLeoReadableContext,
  resolveLeoVisibleItemByNumber,
  leoResultCardsToAddressableItems,
} from "../app/leo/_lib/leoSpokenContext";

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

const spoken = "app/leo/_lib/leoSpokenContext.ts";
const intent = "app/leo/_lib/leoPresentationIntent.ts";
const session = "app/admin/(dashboard)/leo/_components/LeoSpokenSession.tsx";
const panel = "app/admin/(dashboard)/leo/_components/LeoConversationPanel.tsx";
const hands = "app/admin/(dashboard)/leo/_components/LeoHandsFreeMode.tsx";
const page = "app/admin/(dashboard)/leo/page.tsx";
const composer = "app/admin/(dashboard)/leo/_components/LeoComposer.tsx";

for (const p of [spoken, intent, session, panel, hands, page]) {
  check(exists(p), `exists ${p}`);
}

const spokenSrc = src(spoken);
const intentSrc = src(intent);
const sessionSrc = src(session);
const panelSrc = src(panel);
const handsSrc = src(hands);
const pageSrc = src(page);

check(spokenSrc.includes("resolveLeoReadableContext") && spokenSrc.includes("LeoSpokenSessionSnapshot"), "spoken context model exists");
check(spokenSrc.includes("resolveLeoVisibleItemByNumber") && spokenSrc.includes("leoResultCardsToAddressableItems"), "visible item resolution exists");
check(intentSrc.includes("STOP_SPEECH") && intentSrc.includes("READ_CONTEXT") && intentSrc.includes("REPEAT_SPOKEN"), "stop/read/repeat intents exist");
check(intentSrc.includes("open number") || intentSrc.includes("parseVisibleItemIntent"), "numbered item phrases in canonical resolver");
check(
  panelSrc.includes("resolveLeoPresentationIntent") &&
    handsSrc.includes("onSubmit") &&
    !handsSrc.includes("take me to reports"),
  "voice uses canonical presentation resolver; no duplicate workspace phrase table in Hands-Free",
);

check(
  resolveLeoPresentationIntent("take me to reports").kind === "PRESENT" &&
    resolveLeoPresentationIntent("take me to gmail").kind === "PRESENT" &&
    resolveLeoPresentationIntent("take me to my calendar").kind === "PRESENT" &&
    resolveLeoPresentationIntent("show me what needs attention").kind === "PRESENT" &&
    resolveLeoPresentationIntent("go home").kind === "NAVIGATE" &&
    resolveLeoPresentationIntent("go back").kind === "BACK" &&
    resolveLeoPresentationIntent("stop").kind === "STOP_SPEECH" &&
    resolveLeoPresentationIntent("read that to me").kind === "READ_CONTEXT" &&
    resolveLeoPresentationIntent("repeat that").kind === "REPEAT_SPOKEN" &&
    resolveLeoPresentationIntent("open number two").kind === "OPEN_VISIBLE_ITEM",
  "resolver covers spoken navigation, read, stop, repeat, numbered open",
);

const missing = resolveLeoVisibleItemByNumber([], 2);
check(missing === null, "missing visible number fails closed");
check(
  resolveLeoReadableContext({
    selectedCardId: null,
    currentAnswerSpoken: null,
    currentAnswerDisplay: null,
    visibleItems: [],
    workspaceId: "HOME",
  }).ok === true,
  "workspace summary is readable when nothing else is selected",
);

check(panelSrc.includes("STOP_SPEECH") && panelSrc.includes("READ_CONTEXT") && panelSrc.includes("REPEAT_SPOKEN"), "conversation intercepts speech primitives");
check(sessionSrc.includes("createLeoSpeechSynthesisController") && sessionSrc.includes("stop") && sessionSrc.includes("repeat"), "shared TTS stop/repeat");
check(handsSrc.includes("useLeoSpokenSession") && !/useEffect\(\(\) => \{\s*startListen\(\)/.test(handsSrc.replace(/\n/g, " ")), "Hands-Free uses shared session");
check(handsSrc.includes("Explicit start only") && panelSrc.includes("setHandsFree(false)"), "Hands-Free does not auto-start on page load");
check(handsSrc.includes("LEO_BARGE_IN_LIMITATION"), "honest barge-in limitation");
check(src("app/admin/(dashboard)/leo/_components/LeoVoiceControls.tsx").includes("LeoVoiceDictationControl"), "dictation control preserved");
check(pageSrc.includes("LeoSpokenSessionProvider") && pageSrc.includes("LeoOperatingShell"), "spoken session wraps conversation-first shell");
check(src("app/admin/(dashboard)/leo/_components/LeoConversationTurn.tsx").includes("data-leo-visible-index"), "visible item numbers in UI");
check(panelSrc.includes('fetch("/api/leo/conversation"'), "canonical conversation endpoint");
check(
  !panelSrc.includes("leoExecuteGovernedConnectedAction") &&
    !handsSrc.includes("leoExecuteGovernedConnectedAction") &&
    !handsSrc.includes("messages.send"),
  "voice does not execute RED or Gmail send",
);
check(
  !src("app/leo/_lib/leoGoogleWorkspaceConfig.ts").includes('LEO_GMAIL_REPLY_WRITE_ENABLED: boolean = true') &&
    src("app/leo/_lib/leoGoogleWorkspaceConfig.ts").includes('v.trim().toLowerCase() === "true"'),
  "Gmail write flag still fail-closed",
);
check(!exists("supabase/migrations/.leo-22b.sql"), "no 22B migration");

check(
  !process.env.LEO_GMAIL_REPLY_WRITE_ENABLED ||
    process.env.LEO_GMAIL_REPLY_WRITE_ENABLED.trim().toLowerCase() !== "true",
  "write flag remains OFF in this process",
);

const elapsedMs = Date.now() - started;
if (failures > 0) {
  console.error(`\nLEO-22B verifier FAILED (${failures}) in ${elapsedMs}ms`);
  process.exit(1);
}
console.log(`\nLEO-22B verifier PASSED in ${elapsedMs}ms`);
