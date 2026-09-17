/**
 * LEO-19E Intelligence Runtime Health verifier (offline — no live provider call).
 *
 * Run:
 *   npx tsx scripts/verify-leo-19e-intelligence-runtime-health.ts
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

import {
  LEO_INTELLIGENCE_RUNTIME_FAILURE_CLASSES,
  LEO_INTELLIGENCE_RUNTIME_NOT_RECORDING,
  LEO_INTELLIGENCE_RUNTIME_STAGES,
  assertRuntimeStageIndependence,
  buildLeoIntelligenceRuntimeExecutiveSignals,
  buildLeoIntelligenceRuntimeObservation,
  leoIntelligenceRuntimeMorningBriefWarning,
  leoIntelligenceRuntimeReceiptCompatibility,
  mapIntelligenceRuntimeToSystemHealthComponent,
  shouldEscalateIntelligenceRuntimeAttention,
  stagesAsRecord,
} from "../app/leo/_lib/leoIntelligenceRuntimeHealth";
import { buildLeoSystemHealthSnapshot } from "../app/leo/_lib/leoSystemHealth";

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

check(exists("app/leo/_lib/leoIntelligenceRuntimeHealth.ts"), "runtime health contract exists");

const healthSrc = src("app/leo/_lib/leoIntelligenceRuntimeHealth.ts");
const engineSrc = src("app/leo/_lib/leoAiReasoningEngine.ts");
const typesSrc = src("app/leo/_lib/leoTypes.ts");
const convSrc = src("app/leo/_lib/leoConversationService.ts");
const reportSrc = src("app/leo/_lib/leoExecutiveReportingAdapters.ts");
const briefSvc = src("app/leo/_lib/leoMorningBriefService.ts");

for (const stage of LEO_INTELLIGENCE_RUNTIME_STAGES) {
  check(healthSrc.includes(stage), `stage stamp ${stage}`);
}

check(typesSrc.includes("runtimeObservation"), "LeoAiAnswerMeta extended with runtimeObservation");
check(engineSrc.includes("runtimeObservation") || engineSrc.includes("buildLeoIntelligenceRuntimeObservation"), "engine emits runtime observation");
check(engineSrc.includes("invokeLeoReasoningModelTransport"), "no second provider path — still adapter transport");
check(!engineSrc.includes("invokeLeoIntelligenceProvider"), "engine does not dual-invoke coordinator");
check(convSrc.includes("enrichLeoConversationWithAi"), "one AI entry path remains");
check(!convSrc.includes("invokeLeoIntelligenceProvider"), "conversation does not live-invoke providers");

check(!/console\.(log|info|debug)\([^)]*prompt/i.test(engineSrc + healthSrc), "raw prompts are not logged");
check(!/console\.(log|info|debug)\([^)]*(provider\.text|rawJsonText|response\.body)/i.test(engineSrc + healthSrc), "raw provider responses are not logged");
check(
  LEO_INTELLIGENCE_RUNTIME_NOT_RECORDING.includes("api_key") &&
    LEO_INTELLIGENCE_RUNTIME_NOT_RECORDING.includes("raw_prompt"),
  "API keys/tokens/prompts listed as notRecording",
);
check(!/sk-[a-zA-Z0-9]{10,}/.test(healthSrc + engineSrc), "no API key material in health/engine");

for (const c of [
  "NOT_CONNECTED",
  "PROVIDER_UNAVAILABLE",
  "TIMEOUT",
  "PROVIDER_ERROR",
  "INVALID_MODEL_OUTPUT",
  "VALIDATION_REJECTED",
  "INSUFFICIENT_EVIDENCE",
] as const) {
  check(LEO_INTELLIGENCE_RUNTIME_FAILURE_CLASSES.includes(c), `failure class ${c}`);
}

// --- Fixtures: stage independence ---
{
  const configuredButFailed = buildLeoIntelligenceRuntimeObservation({
    configPresent: true,
    callAttempted: true,
    callSucceeded: false,
    validationSucceeded: false,
    validationRejected: false,
    fallbackUsed: true,
    failureClass: "PROVIDER_ERROR",
    reasoningMode: "DETERMINISTIC",
    governanceLevel: "GREEN",
  });
  const independence = assertRuntimeStageIndependence(configuredButFailed);
  check(independence.configDoesNotImplyCallSuccess, "config presence != provider success");
  check(configuredButFailed.configPresent && !configuredButFailed.callSucceeded, "configured-but-failing distinguishable");
  check(configuredButFailed.workerDegraded && configuredButFailed.leoOperational, "worker degraded != LEO down");
  check(independence.workerDegradedDoesNotImplyLeoDown, "worker degraded != LEO down (assert)");
}

{
  const transportOkValidationFail = buildLeoIntelligenceRuntimeObservation({
    configPresent: true,
    callAttempted: true,
    callSucceeded: true,
    validationSucceeded: false,
    validationRejected: true,
    fallbackUsed: true,
    failureClass: "VALIDATION_REJECTED",
    reasoningMode: "DETERMINISTIC",
  });
  const independence = assertRuntimeStageIndependence(transportOkValidationFail);
  check(independence.callSuccessDoesNotImplyValidation, "provider success != validation success");
  check(
    transportOkValidationFail.callSucceeded && transportOkValidationFail.validationRejected,
    "validation rejection distinguishable from transport failure",
  );
}

{
  const unconfigured = buildLeoIntelligenceRuntimeObservation({
    configPresent: false,
    callAttempted: false,
    callSucceeded: false,
    validationSucceeded: false,
    validationRejected: false,
    fallbackUsed: true,
    failureClass: "NOT_CONNECTED",
    reasoningMode: "DETERMINISTIC",
  });
  check(!unconfigured.callAttempted && unconfigured.failureClass === "NOT_CONNECTED", "unconfigured distinct from failing");
  check(unconfigured.fallbackUsed, "fallback truth preserved (unconfigured)");
}

{
  const stages = stagesAsRecord(
    buildLeoIntelligenceRuntimeObservation({
      configPresent: true,
      callAttempted: false,
      callSucceeded: false,
      validationSucceeded: false,
      validationRejected: false,
      fallbackUsed: false,
      reasoningMode: "DETERMINISTIC",
    }),
  );
  check(stages.CONFIG_PRESENT === true && stages.CALL_SUCCEEDED === false, "runtime stages separated");
  check(stages.CALL_NOT_ATTEMPTED === true, "CALL_NOT_ATTEMPTED stage");
}

// --- Attention / reporting ---
{
  const success = buildLeoIntelligenceRuntimeObservation({
    configPresent: true,
    callAttempted: true,
    callSucceeded: true,
    validationSucceeded: true,
    validationRejected: false,
    fallbackUsed: false,
    failureClass: "NONE",
    reasoningMode: "AI",
  });
  const successSignals = buildLeoIntelligenceRuntimeExecutiveSignals({
    observation: success,
    configPresent: true,
    nowMs: Date.now(),
  });
  check(successSignals.length === 0, "successful routine calls do not create noisy executive attention");
  check(shouldEscalateIntelligenceRuntimeAttention(success) === false, "success does not escalate attention");
}

{
  const failed = buildLeoIntelligenceRuntimeObservation({
    configPresent: true,
    callAttempted: true,
    callSucceeded: false,
    validationSucceeded: false,
    validationRejected: false,
    fallbackUsed: true,
    failureClass: "PROVIDER_ERROR",
    reasoningMode: "DETERMINISTIC",
  });
  const failSignals = buildLeoIntelligenceRuntimeExecutiveSignals({
    observation: failed,
    nowMs: Date.now(),
  });
  check(failSignals.length >= 1, "provider failure can become HEALTH signal");
  check(
    failSignals.every((s) => s.ownerAttentionRequired === false),
    "single failure is not critical owner interrupt",
  );
  check(
    failSignals.some((s) => s.metadataSummary === "INTELLIGENCE_PROVIDER_FAILURE"),
    "failure signal class INTELLIGENCE_PROVIDER_FAILURE",
  );
}

{
  const validatedReject = buildLeoIntelligenceRuntimeObservation({
    configPresent: true,
    callAttempted: true,
    callSucceeded: true,
    validationSucceeded: false,
    validationRejected: true,
    fallbackUsed: true,
    failureClass: "VALIDATION_REJECTED",
    reasoningMode: "DETERMINISTIC",
  });
  const sigs = buildLeoIntelligenceRuntimeExecutiveSignals({ observation: validatedReject, nowMs: 1 });
  check(
    sigs.some((s) => s.metadataSummary === "INTELLIGENCE_VALIDATION_REJECTED"),
    "validation rejection HEALTH signal",
  );
}

{
  const fb = buildLeoIntelligenceRuntimeObservation({
    configPresent: true,
    callAttempted: true,
    callSucceeded: false,
    validationSucceeded: false,
    validationRejected: false,
    fallbackUsed: true,
    failureClass: "TIMEOUT",
    reasoningMode: "DETERMINISTIC",
  });
  check(fb.fallbackUsed === true, "fallback can be reported truthfully");
  const sigs = buildLeoIntelligenceRuntimeExecutiveSignals({ observation: fb, nowMs: 1 });
  check(
    sigs.some((s) => s.metadataSummary === "INTELLIGENCE_PROVIDER_TIMEOUT"),
    "timeout HEALTH signal",
  );
}

{
  const unconfiguredSignals = buildLeoIntelligenceRuntimeExecutiveSignals({
    configPresent: false,
    nowMs: 1,
  });
  check(
    unconfiguredSignals.some((s) => s.metadataSummary === "INTELLIGENCE_PROVIDER_NOT_CONFIGURED"),
    "not configured HEALTH signal",
  );
  check(
    unconfiguredSignals.every((s) => s.ownerAttentionRequired === false),
    "not configured is not critical interrupt",
  );
}

// --- System health ---
{
  const comp = mapIntelligenceRuntimeToSystemHealthComponent(
    buildLeoIntelligenceRuntimeObservation({
      configPresent: true,
      callAttempted: true,
      callSucceeded: false,
      validationSucceeded: false,
      validationRejected: false,
      fallbackUsed: true,
      failureClass: "PROVIDER_ERROR",
      reasoningMode: "DETERMINISTIC",
    }),
  );
  check(comp.state === "DEGRADED", "system health marks worker degraded");
  check(comp.ownerMessage != null && /deterministic/i.test(comp.ownerMessage), "owner message: LEO still operational");

  const snap = buildLeoSystemHealthSnapshot({
    intelligenceReasoning: "DEGRADED",
    intelligenceReasoningMessage: comp.ownerMessage,
    supabaseConfigured: true,
  });
  check(
    snap.components.some((c) => c.key === "intelligence_reasoning"),
    "system health integrates intelligence component",
  );
  check(
    snap.overall === "DEGRADED" || snap.overall === "HEALTHY",
    "LEO not falsely DOWN solely from worker",
  );
}

// --- Morning brief ---
{
  const warnConfigured = leoIntelligenceRuntimeMorningBriefWarning({
    configPresent: true,
    observation: null,
  });
  check(warnConfigured === null, "no AI healthy noise when configured + no problem");

  const warnUnconfigured = leoIntelligenceRuntimeMorningBriefWarning({ configPresent: false });
  check(warnUnconfigured != null && /not configured/i.test(warnUnconfigured), "morning brief exception when unconfigured");
  check(briefSvc.includes("leoIntelligenceRuntimeMorningBriefWarning"), "morning brief service wired");
}

// --- Receipts / duplicates / migration ---
{
  const receipt = leoIntelligenceRuntimeReceiptCompatibility();
  check(receipt.receiptCompatible === true, "receipt compatibility hook present");
  check(receipt.durablePersistAttempted === false, "no fake receipt persistence");
  check(receipt.durablePersistSupportedWithoutMigration === false, "no schema assumption without migration");
}

check(!exists("app/leo/_lib/leoIntelligenceReceiptSystem.ts"), "no duplicate receipt engine");
check(!exists("app/leo/_lib/leoIntelligenceReportingEngine.ts"), "no duplicate reporting engine");
check(exists("app/leo/_lib/leoToolReceiptService.ts"), "existing receipts preserved");
check(exists("app/leo/_lib/leoExecutiveReportingService.ts"), "existing reporting preserved");
check(reportSrc.includes("buildLeoIntelligenceRuntimeExecutiveSignals"), "executive reporting wired");

{
  const migrations = readdirSync(path.join(ROOT, "supabase/migrations")).filter((m) => m.endsWith(".sql"));
  check(!migrations.some((m) => /leo.?19e|intelligence.?runtime.?health/i.test(m)), "no new migration");
}

check(healthSrc.includes("governanceUnchangedByHealth"), "governance cannot be changed by health metadata");
check(engineSrc.includes("governance: deterministic.governance"), "governance preserved in engine");

async function main(): Promise<void> {
  console.log("--- LEO-19A regression ---");
  try {
    execSync("npx tsx scripts/verify-leo-19a-intelligence-router.ts", {
      cwd: ROOT,
      stdio: "inherit",
      encoding: "utf8",
    });
    check(true, "LEO-19A verifier passes");
  } catch {
    check(false, "LEO-19A verifier passes");
  }

  console.log("--- LEO-19B regression ---");
  try {
    execSync("npx tsx scripts/verify-leo-19b-provider-selection.ts", {
      cwd: ROOT,
      stdio: "inherit",
      encoding: "utf8",
    });
    check(true, "LEO-19B verifier passes");
  } catch {
    check(false, "LEO-19B verifier passes");
  }

  console.log("--- LEO-19C regression ---");
  try {
    execSync("npx tsx scripts/verify-leo-19c-provider-adapter-runtime.ts", {
      cwd: ROOT,
      stdio: "inherit",
      encoding: "utf8",
    });
    check(true, "LEO-19C verifier passes");
  } catch {
    check(false, "LEO-19C verifier passes");
  }

  console.log("--- LEO-19D regression ---");
  try {
    execSync("npx tsx scripts/verify-leo-19d-reasoning-adapter-bridge.ts", {
      cwd: ROOT,
      stdio: "inherit",
      encoding: "utf8",
    });
    check(true, "LEO-19D verifier passes");
  } catch {
    check(false, "LEO-19D verifier passes");
  }

  console.log("");
  if (failures > 0) {
    console.error(`LEO-19E verifier FAILED with ${failures} failure(s).`);
    process.exit(1);
  }
  console.log("LEO-19E verifier PASSED.");
  process.exit(0);
}

void main();
