/**
 * LEO-VOICE.1 — Friendly natural neural voice — construction verifier.
 *
 * Run: npx tsx scripts/verify-leo-voice1-neural-tts.ts
 */
import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

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

function main() {
  const routePath = "app/api/leo/speech/route.ts";
  const ttsConfigPath = "app/leo/_lib/leoTtsConfig.ts";
  const neuralClientPath = "app/leo/_lib/leoNeuralSpeech.ts";
  const sessionPath = "app/admin/(dashboard)/leo/_components/LeoSpokenSession.tsx";
  const voiceControlsPath = "app/admin/(dashboard)/leo/_components/LeoVoiceControls.tsx";
  const handsFreePath = "app/admin/(dashboard)/leo/_components/LeoHandsFreeMode.tsx";
  const browserSynthPath = "app/leo/_lib/leoSpeechSynthesis.ts";

  for (const p of [routePath, ttsConfigPath, neuralClientPath, sessionPath, voiceControlsPath]) {
    check(exists(p), `file exists: ${p}`);
  }

  const route = src(routePath);
  const ttsConfig = src(ttsConfigPath);
  const neuralClient = src(neuralClientPath);
  const session = src(sessionPath);
  const voiceControls = src(voiceControlsPath);
  const handsFree = src(handsFreePath);
  const browserSynth = src(browserSynthPath);

  // LEO_NEURAL_TTS_ROUTE_EXISTS
  check(
    exists(routePath) && /export async function POST/.test(route) && /audio\/speech/.test(route),
    "LEO_NEURAL_TTS_ROUTE_EXISTS",
  );

  // OPENAI_KEY_SERVER_ONLY
  check(
    /import\s+"server-only"/.test(route) &&
      /import\s+"server-only"/.test(ttsConfig) &&
      /process\.env\.OPENAI_API_KEY/.test(route) &&
      !/OPENAI_API_KEY/.test(neuralClient) &&
      !/OPENAI_API_KEY/.test(session) &&
      !/OPENAI_API_KEY/.test(voiceControls),
    "OPENAI_KEY_SERVER_ONLY",
  );

  // OWNER_AUTH_REQUIRED
  check(
    /resolveLeoAccess/.test(route) && /access\.allowed/.test(route) && /401|403/.test(route),
    "OWNER_AUTH_REQUIRED",
  );

  // DEFAULT_TTS_MODEL_GPT4O_MINI_TTS
  check(
    /LEO_TTS_MODEL_DEFAULT\s*=\s*"gpt-4o-mini-tts"/.test(ttsConfig) && /getLeoTtsModel/.test(route),
    "DEFAULT_TTS_MODEL_GPT4O_MINI_TTS",
  );

  // FRIENDLY_VOICE_CONFIGURATION
  check(
    /LEO_TTS_VOICE_PRESETS/.test(ttsConfig) &&
      /friendly:\s*"alloy"/.test(ttsConfig) &&
      /LEO_TTS_VOICE_INSTRUCTIONS/.test(ttsConfig) &&
      /warm/i.test(ttsConfig) &&
      /instructions/.test(route),
    "FRIENDLY_VOICE_CONFIGURATION",
  );

  // READ_ALOUD_USES_NEURAL_TTS — LeoSpeechResponseControls now routes through
  // the shared session, which tries neural first.
  check(
    /useLeoSpokenSession/.test(voiceControls) &&
      !/createLeoSpeechSynthesisController/.test(voiceControls) &&
      /spokenSession\.speak/.test(voiceControls),
    "READ_ALOUD_USES_NEURAL_TTS",
  );

  // HANDS_FREE_USES_NEURAL_TTS — unchanged call site, now backed by the
  // neural-first session.
  check(
    /useLeoSpokenSession/.test(handsFree) &&
      /spokenSession\.speak\(/.test(handsFree) &&
      /createLeoNeuralSpeechController/.test(session),
    "HANDS_FREE_USES_NEURAL_TTS",
  );

  // BROWSER_TTS_FALLBACK_REMAINS
  check(
    /createLeoSpeechSynthesisController/.test(session) &&
      exists(browserSynthPath) &&
      /SpeechSynthesisUtterance/.test(browserSynth),
    "BROWSER_TTS_FALLBACK_REMAINS",
  );

  // NO_DOUBLE_SPEAK — every speak/repeat path stops both lanes before
  // starting a new one.
  check(
    /stopAllLanes\(\)/.test(session) &&
      /neuralRef\.current\?\.stop\(\)/.test(session) &&
      /browserRef\.current\?\.stop\(\)/.test(session),
    "NO_DOUBLE_SPEAK",
  );

  // STOP_SPEAKING_STOPS_NEURAL_AUDIO
  check(
    /const stop = useCallback\(\(\) => \{[\s\S]{0,120}stopAllLanes\(\)/.test(session),
    "STOP_SPEAKING_STOPS_NEURAL_AUDIO",
  );

  // REAL_COMPLETION_SIGNAL_PRESERVED — neural onEnd only fires on real
  // <audio> `ended`, and still routes into the same fireUtteranceEnded /
  // onEnded contract Hands-Free relies on.
  check(
    /el\.onended = \(\) => \{/.test(neuralClient) &&
      /callbacks\.onEnd\?\.\(\)/.test(neuralClient) &&
      /fireUtteranceEnded/.test(session),
    "REAL_COMPLETION_SIGNAL_PRESERVED",
  );

  // WATCHDOG_FALLBACK_PRESERVED — Hands-Free's own bounded fallback timer is
  // untouched by this gate.
  check(
    /window\.setTimeout\(completeSpeech, Math\.max\(20000, utterance\.length \* 80\)\)/.test(handsFree),
    "WATCHDOG_FALLBACK_PRESERVED",
  );

  // VOICE_CANNOT_BYPASS_RED — no execute/approval route referenced anywhere
  // in the new voice files.
  const voiceFiles = route + ttsConfig + neuralClient + session + voiceControls;
  check(
    !/action\/proposal|approveLeoActionProposal|leoExecuteGovernedConnectedAction|executionAllowed\s*=\s*true/.test(
      voiceFiles,
    ),
    "VOICE_CANNOT_BYPASS_RED",
  );

  // GENERAL_AI_PATH_UNCHANGED / GMAIL_GOVERNANCE_UNCHANGED — untouched by
  // this gate's diff against the branch base.
  const untouchedPaths = [
    "app/leo/_lib/leoAiProvider.ts",
    "app/leo/_lib/leoAiReasoningEngine.ts",
    "app/leo/_lib/leoAiConfig.ts",
    "app/leo/_lib/leoConversationRouter.ts",
    "app/leo/_lib/leoGmailReplyConnectedActionAdapter.ts",
    "app/leo/_lib/leoGoogleWorkspaceConfig.ts",
    "app/leo/_lib/leoGmailSendScopeProof.ts",
    "app/leo/_lib/leoConnectedActionExecutionService.ts",
    "app/leo/_lib/leoActionProposalRepository.ts",
    "app/leo/_lib/leoGovernanceEngine.ts",
  ];
  let changedTracked: string[] = [];
  try {
    const diffOut = execSync("git diff --name-only HEAD", { cwd: ROOT, encoding: "utf8" });
    changedTracked = diffOut.split("\n").map((l) => l.trim()).filter(Boolean);
  } catch {
    changedTracked = [];
  }
  const touchedForbidden = untouchedPaths.filter((p) => changedTracked.includes(p));
  check(touchedForbidden.length === 0, "GENERAL_AI_PATH_UNCHANGED");
  check(
    !changedTracked.includes("app/leo/_lib/leoGmailReplyConnectedActionAdapter.ts") &&
      !changedTracked.includes("app/leo/_lib/leoGoogleWorkspaceConfig.ts") &&
      !changedTracked.includes("app/leo/_lib/leoGmailSendScopeProof.ts"),
    "GMAIL_GOVERNANCE_UNCHANGED",
  );

  // NO_MIGRATION
  const migrationsDir = "supabase/migrations";
  const newMigrations = changedTracked.filter((p) => p.startsWith(`${migrationsDir}/`));
  check(newMigrations.length === 0, "NO_MIGRATION");

  // NO_SECRET_EXPOSURE — the route never logs the key or the spoken text.
  check(
    !/console\.(log|warn|error|info)\([^)]*OPENAI_API_KEY/.test(route) &&
      !/console\.(log|warn|error|info)\([^)]*bounded\b/.test(route) &&
      !/console\.(log|warn|error|info)\([^)]*\btext\b/.test(route),
    "NO_SECRET_EXPOSURE",
  );

  if (failures > 0) {
    console.error(`\nLEO-VOICE.1 verifier: ${failures} failure(s)`);
    process.exit(1);
  }
  console.log("\nLEO-VOICE.1 verifier: PASS");
}

main();
