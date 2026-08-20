/**
 * LEO-14.9 voice dictation + spoken responses verifier (static / fixture-safe).
 * Run: npx tsx scripts/verify-leo-14-9-voice.ts
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

const recognition = src("app/leo/_lib/leoSpeechRecognition.ts");
const synthesis = src("app/leo/_lib/leoSpeechSynthesis.ts");
const voice = src("app/admin/(dashboard)/leo/_components/LeoVoiceControls.tsx");
const composer = src("app/admin/(dashboard)/leo/_components/LeoComposer.tsx");
const turn = src("app/admin/(dashboard)/leo/_components/LeoConversationTurn.tsx");
const panel = src("app/admin/(dashboard)/leo/_components/LeoConversationPanel.tsx");

check(exists("app/leo/_lib/leoSpeechRecognition.ts"), "speech recognition lib");
check(exists("app/leo/_lib/leoSpeechSynthesis.ts"), "speech synthesis lib");
check(exists("app/admin/(dashboard)/leo/_components/LeoVoiceControls.tsx"), "voice controls component");

check(/getLeoSpeechRecognitionCapability/.test(recognition), "SpeechRecognition feature detection");
check(/SpeechRecognition/.test(recognition) && /webkitSpeechRecognition/.test(recognition), "webkit fallback");
check(/typeof win !== "undefined"|isBrowserWindow/.test(recognition), "no SSR browser-global crash");
check(!/MediaRecorder/.test(recognition + voice + synthesis + composer), "no MediaRecorder");
check(!/getUserMedia/.test(recognition + voice + synthesis + composer), "no getUserMedia recording");
check(!/localStorage\.setItem\([^)]*transcript|Blob\(|audio\/|\.put\(/.test(recognition + voice), "no raw audio persistence");
check(!/fetch\([^)]*speech|openai|whisper|deepgram|assemblyai/i.test(recognition + voice + synthesis), "no external STT provider");

check(/resolveLeoSpeechRecognitionLang/.test(recognition), "language resolver");
check(/en-US/.test(recognition), "English support");
check(/es-MX/.test(recognition), "Spanish support");
check(/leoSpeechRecognitionAutoLabel|Browser default language/.test(recognition), "AUTO truthfully labeled");

check(/continuous = false/.test(recognition), "foreground single-shot recognition");
check(/mergeTranscriptIntoComposer/.test(recognition + voice + composer), "transcript inserts into composer");
check(!/onFinal[\s\S]{0,120}onSubmit|auto-submit|autoSend/.test(voice + composer), "transcript does not auto-submit");
check(/LeoVoiceDictationControl/.test(composer), "composer integrates dictation");
check(/\/api\/leo\/conversation/.test(panel), "existing conversation submit path");
check(/sessionId/.test(panel) && /clientRequestId/.test(panel), "sessionId flow preserved");
check(/clientContext|selectedEntityRef|selectedCardId/.test(panel), "referent context preserved");

check(/getLeoSpeechSynthesisCapability/.test(synthesis), "TTS feature detection");
check(/speechSynthesis/.test(synthesis) && /SpeechSynthesisUtterance/.test(synthesis), "browser speechSynthesis");
check(/resolveLeoSpokenResponseText/.test(synthesis), "spoken text resolver");
check(/spokenSummary/.test(synthesis), "answer.spokenSummary preferred");
check(!/evidence\.|answer\.evidence/.test(synthesis), "evidence not read aloud wholesale");

check(/Stop listening|stopListening|\.stop\(\)/.test(voice + recognition), "stop listening implemented");
check(/Stop LEO speech|\.stop\(\)|cancelOwned/.test(voice + synthesis), "stop speaking implemented");
check(/pauseSupported|Pause LEO speech|Resume LEO speech/.test(voice + synthesis), "pause/resume handled truthfully");
check(/cancelOwned|cancel\(\)/.test(synthesis), "overlapping speech prevented");

check(!/wake word|Hey LEO|always listening|background listening|continuous = true/i.test(recognition + voice + synthesis + composer), "no background/wake word");
check(!/onend[\s\S]{0,200}start\(\)|auto-loop|hands-free loop/i.test(voice + composer), "no hands-free auto-loop yet");

check(/LeoSpeechResponseControls/.test(turn), "TTS controls on LEO turn");
check(/Speak LEO response|Repeat LEO response/.test(voice), "accessibility labels exist");
check(/min-h-\[44px\]/.test(voice + composer), "mobile-safe control classes");
check(/LEO_OFFLINE_SUBMIT_MESSAGE|offline/i.test(panel + composer), "offline submission remains blocked by 14.8");

check(!/gmail.*send|EXECUTE_EXTERNAL|deploy.*Production/i.test(voice + composer + turn), "governance unchanged — no voice executor");

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
  "app/leo/_lib/leoSpeechRecognition.ts",
  "app/leo/_lib/leoSpeechSynthesis.ts",
  "app/admin/(dashboard)/leo/_components/LeoVoiceControls.tsx",
  "app/admin/(dashboard)/leo/_components/LeoComposer.tsx",
  "app/admin/(dashboard)/leo/_components/LeoConversationTurn.tsx",
  "app/admin/(dashboard)/leo/_components/LeoConversationPanel.tsx",
  "app/admin/(dashboard)/leo/_components/LeoConversationStream.tsx",
  "app/admin/(dashboard)/leo/_components/LeoSessionStatus.tsx",
  "app/admin/(dashboard)/leo/page.tsx",
  "app/leo/_lib/leoTypes.ts",
  "scripts/verify-leo-14-9-voice.ts",
  "scripts/verify-leo-14-8-pwa-shell.ts",
  "scripts/verify-leo-14-7-conversation-ui.ts",
  "scripts/verify-leo-14-6-persistent-conversation-context.ts",
  "scripts/verify-leo-14-5-receipts-attention-runtime.ts",
  "scripts/verify-leo-14-4-commitment-intelligence.ts",
  "scripts/verify-leo-14-3-gmail-executive-triage.ts",
  "scripts/verify-leo-14-2-result-action-contracts.ts",
  "scripts/verify-leo-14-1-persistence-contracts.ts",
  // prior gates preserved on branch
  "public/sw.js",
  "public/manifest.webmanifest",
  "app/leo/_lib/leoPwaCapabilities.ts",
  "app/admin/(dashboard)/leo/_components/LeoPwaShell.tsx",
  "app/admin/(dashboard)/leo/_components/LeoConversationStream.tsx",
  "app/admin/(dashboard)/leo/_components/LeoResultCard.tsx",
  "app/admin/(dashboard)/leo/_components/LeoActionBar.tsx",
  "app/admin/(dashboard)/leo/_components/leoOwnerPresentation.ts",
  // LEO-14.10 hands-free
  "app/leo/_lib/leoHandsFreeState.ts",
  "app/admin/(dashboard)/leo/_components/LeoHandsFreeMode.tsx",
  "app/api/leo/conversation/session/route.ts",
  "app/leo/_lib/leoConversationSessionService.ts",
  "scripts/verify-leo-14-10-hands-free.ts",
]);
const illegal = [...changed, ...untracked].filter((f) => !allowed.has(f) && !f.endsWith("/"));
check(illegal.length === 0, `scope only allowlisted${illegal.length ? ": " + illegal.join(", ") : ""}`);

check(
  execSync("git diff --name-only HEAD -- package.json package-lock.json supabase/migrations", {
    cwd: ROOT,
    encoding: "utf8",
  }).trim() === "",
  "package + migrations untouched",
);

check(
  execSync("git diff --name-only HEAD -- package.json package-lock.json", { cwd: ROOT, encoding: "utf8" }).trim() ===
    "",
  "no package dependency added",
);

if (failures > 0) {
  console.error(`\nLEO-14.9 FAILED with ${failures} failure(s)`);
  process.exit(1);
}
console.log("\nLEO-14.9 PASS");
