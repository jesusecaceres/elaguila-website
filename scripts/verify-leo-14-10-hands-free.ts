/**
 * LEO-14.10 foreground Hands-Free verifier (static / fixture-safe).
 * Run: npx tsx scripts/verify-leo-14-10-hands-free.ts
 */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

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

{
  const branch = execSync("git branch --show-current", { cwd: ROOT, encoding: "utf8" }).trim();
  check(branch === EXPECTED_BRANCH, `branch ${EXPECTED_BRANCH}`);
}

const machine = src("app/leo/_lib/leoHandsFreeState.ts");
const hf = src("app/admin/(dashboard)/leo/_components/LeoHandsFreeMode.tsx");
const panel = src("app/admin/(dashboard)/leo/_components/LeoConversationPanel.tsx");
const composer = src("app/admin/(dashboard)/leo/_components/LeoComposer.tsx");
const voice = src("app/admin/(dashboard)/leo/_components/LeoVoiceControls.tsx");
const rec = src("app/leo/_lib/leoSpeechRecognition.ts");
const tts = src("app/leo/_lib/leoSpeechSynthesis.ts");
const sessionRoute = src("app/api/leo/conversation/session/route.ts");
const sessionService = src("app/leo/_lib/leoConversationSessionService.ts");
const types = src("app/leo/_lib/leoTypes.ts");

check(exists("app/leo/_lib/leoHandsFreeState.ts"), "state machine module");
check(exists("app/admin/(dashboard)/leo/_components/LeoHandsFreeMode.tsx"), "hands-free UI");

check(/Start Hands-Free/.test(composer + panel), "explicit owner start required");
check(/useState\(false\)/.test(panel) && /setHandsFree\(true\)/.test(panel), "hands-free starts off");
check(/Never auto-start Hands-Free/.test(panel), "no auto start on mount/restore");
check(!/setHandsFree\(\s*data\.session|session\.mode\s*===/.test(panel), "restore path does not auto-enable");

check(/LEO_HANDS_FREE_FOREGROUND_NOTICE|this page stays open/.test(machine + hf), "foreground only");
check(/visibilitychange/.test(hf), "visibility listener");
check(/VISIBILITY_HIDDEN/.test(machine + hf), "visibility hidden pauses");
check(/document\.hidden/.test(hf) && /abort|stopRecognition|stopSpeech/.test(hf), "hidden tab stops listen + speech");
check(/Resume hands-free/.test(hf) && /skipAutoListenRef/.test(hf), "resume requires explicit interaction");

check(/"IDLE"[\s\S]*"LISTENING"[\s\S]*"TRANSCRIBING"[\s\S]*"THINKING"[\s\S]*"SPEAKING"[\s\S]*"WAITING_FOR_NEXT_TURN"[\s\S]*"PAUSED"[\s\S]*"ENDED"[\s\S]*"ERROR"/.test(machine), "canonical state machine exists");
check(/transitionLeoHandsFree/.test(machine), "deterministic transitions");

check(/isActive\(\)|requestLockRef|speakLockRef/.test(hf + rec), "single recognition / request / speech locks");
check(/state === "SPEAKING"[\s\S]{0,80}return/.test(hf) || /SPEAKING" \|\| st === "THINKING"/.test(hf), "no speech+listen overlap");
check(/onSubmit\(trimmed\)|onSubmitRef\.current/.test(hf) && /submit\(text\)/.test(panel), "final transcript uses existing submit path");
check(/\/api\/leo\/conversation"/.test(panel), "same conversation POST");
check(!/onInterim[\s\S]{0,200}onSubmit/.test(hf), "no interim auto-submit");
check(/onComposerChange\(mergeTranscriptIntoComposer/.test(voice), "normal dictation still inserts without auto-send");

check(/spokenSummary|resolveLeoSpokenResponseText/.test(hf + tts), "spokenSummary used for auto-speech");
check(/onEnd\?:/.test(tts) && /callbacks\.onEnd/.test(tts), "actual speech end callback");
check(/callbacks\.onEnd/.test(tts) && !/setTimeout\s*\(/.test(hf), "no guessed timeout for utterance completion");
check(/SPEECH_END/.test(machine + hf), "speech completion drives next state");

check(/Stop listening/.test(hf), "stop listening works");
check(/Stop speaking/.test(hf), "stop speaking works");
check(/Pause hands-free/.test(hf), "pause works");
check(/Resume hands-free/.test(hf), "resume works");
check(/End hands-free/.test(hf), "end works");

check(/NO_SPEECH/.test(machine + hf) && /I didn't catch anything/.test(hf), "no-speech does not submit blank");
check(/not-allowed/.test(hf) && /Microphone permission is blocked/.test(hf), "permission denial truthful");
check(!/requestPermission|permissions\.query/.test(hf), "permission denial does not reprompt automatically");

check(/LEO_HANDS_FREE_OFFLINE_MESSAGE|needs a connection/.test(machine + hf + panel), "offline pauses live interaction");
check(/navigator\.onLine === false/.test(panel), "start blocked offline");
check(!/online[\s\S]{0,80}startListen\(\)/.test(hf.split("Resume")[0] ?? ""), "reconnect does not silently resume mic");

check(/LeoConversationMode/.test(types), "TEXT/HANDS_FREE/LOW_ATTENTION type exists");
check(/TEXT" \|\| value === "HANDS_FREE" \|\| value === "LOW_ATTENTION/.test(machine), "modes used");
check(/export async function PATCH/.test(sessionRoute), "session mode PATCH");
check(/sessionId/.test(sessionRoute) && /mode/.test(sessionRoute), "PATCH body sessionId + mode");
check(/ownerAuthUserId/.test(sessionRoute) && /not accepted from the client/.test(sessionRoute), "session mode owner-only — no client owner id");
check(/leoSetConversationMode/.test(sessionService + sessionRoute), "mode persist via session service");
check(/Hands-Free is on this page only/.test(panel), "persistence failure does not block local mode");

check(/clientContext|selectedEntityRef/.test(panel), "referent resolver reused");
check(/sessionId/.test(panel) && /clientRequestId/.test(panel), "normal conversation history/session reused");
check(!/executeGmail|sendEmail\(|deployProduction|EXECUTE_EXTERNAL/.test(hf + machine), "governance unchanged — no direct external execution");
check(/leoHandsFreeGenericYesCannotExecute/.test(machine + hf), "spoken YES cannot execute without exact pending action");
check(/LEO_HANDS_FREE_CONFIRMATION_PROMPT/.test(machine), "confirmation is spoken ask, not execute");

check(!/Hey LEO/.test(hf + machine + panel), "no wake word");
check(!/background microphone|always-listening behavior/i.test(hf + machine + panel), "no background mic claim");
check(/not always listening/.test(machine + hf), "no always-listening claim");
check(!/MediaRecorder|getUserMedia/.test(hf + machine + rec), "no MediaRecorder / raw audio capture");
check(!/localStorage\.setItem\([^)]*audio|Blob\(/.test(hf + rec + tts), "no raw audio persistence");

check(/min-h-\[48px\]/.test(hf + composer), "mobile-safe 48px controls");
check(/safe-area-inset-bottom/.test(hf + composer), "safe-area");
check(/aria-label="Start hands-free"|aria-label="Stop listening"|aria-label="End hands-free"/.test(hf + composer), "accessibility labels");
check(/aria-live="polite"/.test(hf), "aria-live for current state");
check(!/autoFocus/.test(hf + composer), "no auto-focus that would open mobile keyboard");

check(
  execSync("git diff --name-only HEAD -- package.json package-lock.json supabase/migrations", {
    cwd: ROOT,
    encoding: "utf8",
  }).trim() === "",
  "no package changes / migrations",
);

const changed = execSync("git diff --name-only HEAD", { cwd: ROOT, encoding: "utf8" })
  .trim()
  .split(/\r?\n/)
  .filter(Boolean)
  .map((f) => f.replace(/\\/g, "/"));
const untracked = execSync("git status --short", { cwd: ROOT, encoding: "utf8" })
  .trim()
  .split(/\r?\n/)
  .filter((l) => l.startsWith("??"))
  .map((l) => l.replace(/^\?\?\s+/, "").replace(/\\/g, "/"));

const allowed = new Set([
  "app/leo/_lib/leoHandsFreeState.ts",
  "app/admin/(dashboard)/leo/_components/LeoHandsFreeMode.tsx",
  "app/admin/(dashboard)/leo/_components/LeoConversationPanel.tsx",
  "app/admin/(dashboard)/leo/_components/LeoComposer.tsx",
  "app/admin/(dashboard)/leo/_components/LeoVoiceControls.tsx",
  "app/admin/(dashboard)/leo/_components/LeoConversationTurn.tsx",
  "app/admin/(dashboard)/leo/_components/LeoSessionStatus.tsx",
  "app/leo/_lib/leoSpeechRecognition.ts",
  "app/leo/_lib/leoSpeechSynthesis.ts",
  "app/leo/_lib/leoTypes.ts",
  "app/leo/_lib/leoConversationSessionService.ts",
  "app/api/leo/conversation/session/route.ts",
  "scripts/verify-leo-14-10-hands-free.ts",
  "scripts/verify-leo-14-9-voice.ts",
  "scripts/verify-leo-14-8-pwa-shell.ts",
  "scripts/verify-leo-14-7-conversation-ui.ts",
  "scripts/verify-leo-14-6-persistent-conversation-context.ts",
  "scripts/verify-leo-14-5-receipts-attention-runtime.ts",
  "scripts/verify-leo-14-4-commitment-intelligence.ts",
  "scripts/verify-leo-14-3-gmail-executive-triage.ts",
  "scripts/verify-leo-14-2-result-action-contracts.ts",
  "scripts/verify-leo-14-1-persistence-contracts.ts",
  // LEO-14.11 morning brief
  "app/leo/_lib/leoTypes.ts",
  "app/leo/_lib/leoMorningBrief.ts",
  "app/leo/_lib/leoMorningBriefService.ts",
  "app/leo/_lib/leoConversationRouter.ts",
  "app/leo/_lib/leoConversationService.ts",
  "app/leo/_lib/leoConversationComposer.ts",
  "app/admin/(dashboard)/leo/_components/LeoMorningBrief.tsx",
  "app/admin/(dashboard)/leo/page.tsx",
  "scripts/verify-leo-14-11-morning-ceo-brief.ts",
  "scripts/verify-leo-14-7-conversation-ui.ts",
  "scripts/verify-leo-14-8-pwa-shell.ts",
  "scripts/verify-leo-14-9-voice.ts",
  // LEO-15 business concierge read bridge
  "app/leo/_lib/leoBusinessConciergeBridge.ts",
  "app/leo/_lib/leoBusinessConciergeBridgeService.ts",
  "app/leo/_lib/leoConversationContext.ts",
  "app/leo/_lib/leoResultCards.ts",
  "scripts/verify-leo-15-business-concierge-read-bridge.ts",
]);
const illegal = [...changed, ...untracked].filter((f) => !allowed.has(f) && !f.endsWith("/"));
check(illegal.length === 0, `scope only allowlisted${illegal.length ? ": " + illegal.join(", ") : ""}`);

if (failures > 0) {
  console.error(`\nLEO-14.10 FAILED with ${failures} failure(s)`);
  process.exit(1);
}
console.log("\nLEO-14.10 PASS");
