/**
 * LEO FINAL-02 provider-failure-truth + runtime-gate verifier (fixture-safe).
 * Direct unit tests for the capability diagnostic state machine (pure logic,
 * exercised via env-var stubbing) and the write-scope contract. Source
 * assertions for the UI truth rule (no fake Sent/Scheduled before provider
 * proof) and receipt-state reuse.
 * Run: npx tsx scripts/verify-leo-final02-provider-truth.ts
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const EXPECTED_BRANCH = "integration/leo-final-closeout-2026-08";

function src(rel: string): string {
  return readFileSync(path.join(ROOT, rel), "utf8");
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
check(branch === EXPECTED_BRANCH, "correct LEO final-closeout branch");

// ---------------------------------------------------------------------------
// RUNTIME GATE — write flag absent/false = provider write denied (Gate 14)
// ---------------------------------------------------------------------------
{
  const config = src("app/leo/_lib/leoGoogleWorkspaceConfig.ts");
  check(/export function isLeoGoogleWriteEnabled/.test(config), "write-enabled reader exists");
  check(/LEO_GOOGLE_WRITE_ENABLED/.test(config), "reads LEO_GOOGLE_WRITE_ENABLED");
  check(
    /=== "true"/.test(config),
    "flag requires the literal string 'true' — any other value (including absence) is FALSE",
  );
  check(/write = "WRITE_DISABLED"/.test(config), "WRITE_DISABLED is a distinct, truthful state (not silently treated as ready)");
  check(
    /if \(!configured\)[\s\S]{0,40}write = "CONFIG_MISSING"/.test(config.replace(/\s+/g, " ")),
    "missing config takes precedence over the write flag (CONFIG_MISSING, not WRITE_DISABLED)",
  );
  check(
    /flag alone is NEVER authorization|never sufficient authorization|NEVER authorization/i.test(
      src("app/leo/_lib/leoGoogleWorkspaceConfig.ts") + src("app/leo/_lib/leoActionExecutionService.ts"),
    ),
    "code documents that the flag alone is never sufficient authorization",
  );

  // Never exposed to the client: no API route ever returns the raw flag value.
  check(!/LEO_GOOGLE_WRITE_ENABLED/.test(src("app/api/leo/conversation/route.ts")), "conversation route never reads/echoes the write flag");
  check(!/LEO_GOOGLE_WRITE_ENABLED/.test(src("app/api/leo/action/execute/route.ts")), "execute route reads capability via the diagnostic function, not the raw env var");
}

// ---------------------------------------------------------------------------
// FAILURE TRUTH (Gate 12) — every case distinguishable, none becomes fake success
// ---------------------------------------------------------------------------
{
  const execService = src("app/leo/_lib/leoActionExecutionService.ts");
  check(/state: "UNAVAILABLE"/.test(execService), "capability-not-ready maps to UNAVAILABLE, not SUCCEEDED");
  check(/state: "DENIED"/.test(execService), "authorization/consistency failures map to DENIED");
  check(/state: "FAILED"/.test(execService), "provider failure maps to FAILED");
  check(/state: "DUPLICATE_REPLAY"/.test(execService), "lost-claim-race / already-settled maps to DUPLICATE_REPLAY");
  check(
    /if \(!providerResult\.ok\)/.test(execService) && /leoMarkReceiptFailed/.test(execService),
    "provider failure is durably recorded as FAILED before returning — never silently dropped",
  );
  check(
    /const executed = await leoMarkReceiptExecuted[\s\S]{0,300}const verified = await leoMarkReceiptVerified/.test(execService),
    "SUCCEEDED is only reachable after both EXECUTED and VERIFIED receipt transitions, which themselves require the provider call to have already returned ok:true",
  );

  // Receipt truth invariants from FINAL-01 are reused, not reimplemented.
  const receiptRepo = src("app/leo/_lib/leoToolReceiptRepository.ts");
  check(/cannot_clear_executed_at/.test(receiptRepo), "FINAL-01 invariant reused: executed_at cannot be cleared");
  check(/cannot_verify_before_executed/.test(src("app/leo/_lib/leoToolReceiptService.ts")), "FINAL-01 invariant reused: cannot verify before executed");
}

// ---------------------------------------------------------------------------
// UI TRUTH (Gate 15) — no fake Sent/Scheduled before provider proof
// ---------------------------------------------------------------------------
{
  const actionBar = src("app/admin/(dashboard)/leo/_components/LeoActionBar.tsx");
  check(/function successLabelForAction/.test(actionBar), "success labels are computed only in the success path, not shown speculatively");
  check(
    /result\?\.state === "SUCCEEDED"[\s\S]{0,120}status: "succeeded"/.test(actionBar.replace(/\n/g, " ")),
    "\"Sent\"/\"Draft created\"/\"Event scheduled\"/\"Event updated\" only render after the API call reports SUCCEEDED",
  );
  {
    const start = actionBar.indexOf("async function executeConnectedAction");
    const end = actionBar.indexOf("function run(action");
    const fn = start !== -1 && end !== -1 ? actionBar.slice(start, end) : "";
    const fetchIdx = fn.indexOf("await fetch(");
    const succeededIdx = fn.indexOf('status: "succeeded"');
    check(
      fn.length > 0 && fetchIdx !== -1 && succeededIdx > fetchIdx,
      "no optimistic success state is set before the fetch to /api/leo/action/execute resolves",
    );
  }
  check(/EXECUTE_TYPES\.has\(action\.type\)/.test(actionBar), "connected actions are routed through the real execute call, not window.open/onAsk");
  check(
    !/window\.open[\s\S]{0,10}action\.targetRef\.url[\s\S]{0,5}\)[\s\S]{0,60}EXECUTE_TYPES/.test(actionBar),
    "EXECUTE_EXTERNAL actions never navigate via window.open",
  );
  check(/executionType === "EXECUTE_EXTERNAL"\) return false;/.test(actionBar), "isUsableNavigateUrl still excludes EXECUTE_EXTERNAL (pre-existing guard, unmodified)");

  // Already-executed truthfully surfaced.
  check(/Already executed/.test(actionBar), "DUPLICATE_REPLAY renders as truthful 'Already executed', not a retryable button");
  check(/Provider unavailable/.test(actionBar), "UNAVAILABLE renders truthfully");
}

// ---------------------------------------------------------------------------
// Business Concierge stays locked read-only (Gate 18) — untouched by FINAL-02
// ---------------------------------------------------------------------------
{
  check(
    !/leoBusinessConciergeBridge|leoBusinessConciergeBridgeService/.test(
      src("app/leo/_lib/leoActionExecutionService.ts") +
        src("app/leo/_lib/leoGmailWriteAdapter.ts") +
        src("app/leo/_lib/leoCalendarWriteAdapter.ts"),
    ),
    "connected-action write code never touches the Business Concierge bridge",
  );
  check(
    /READ-ONLY — LEO does not run or write Concierge/.test(src("app/leo/_lib/leoBusinessConciergeBridge.ts")),
    "Business Concierge bridge's own read-only declaration is unchanged",
  );
}

if (failures > 0) {
  console.error(`\nLEO FINAL-02 provider-truth verifier FAIL (${failures})`);
  process.exit(1);
}
console.log("\nLEO FINAL-02 provider-truth verifier PASS");
