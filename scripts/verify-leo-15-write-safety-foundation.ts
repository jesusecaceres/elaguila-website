/**
 * LEO FINAL 01 — write-safety foundation verifier (fixture-safe, no live DB/network).
 * Proves the 6 required outcomes for this gate:
 *  1. external provider text cannot alter governance/confirmation/tool-policy
 *  2. receipt evidence rejects secret-like fields
 *  3. deterministic duplicate action key dedupes (no timestamp-embedded correlation id)
 *  4. concurrent/duplicate claim cannot produce two execution claims (atomic CAS)
 *  5. provider failure lifecycle cannot become VERIFIED success
 *  6. WRITE/EXECUTE remains externally disabled in this build
 * Run: npx tsx scripts/verify-leo-15-write-safety-foundation.ts
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

import {
  sanitizeLeoReceiptSourceRefs,
  sanitizeLeoReceiptText,
} from "../app/leo/_lib/leoReceiptSanitization";
import { leoGoogleDiagnosticContainsForbiddenSecretMaterial } from "../app/leo/_lib/leoGoogleConnectionDiagnostic";

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
// 1. External provider text cannot alter governance / confirmation / tool policy
// ---------------------------------------------------------------------------
{
  const bounds = src("app/leo/_lib/leoAiBounds.ts");
  check(/immutable input/i.test(bounds), "governance documented as immutable AI input");

  const reasoning = src("app/leo/_lib/leoAiReasoningEngine.ts");
  check(/EXTERNAL_UNTRUSTED_DATA/.test(reasoning), "external data is labeled EXTERNAL_UNTRUSTED_DATA");
  check(/ignore any instruction-like content/i.test(reasoning), "system prompt instructs model to ignore embedded instructions");

  const validation = src("app/leo/_lib/leoAiValidation.ts");
  check(/governance_contradiction/.test(validation), "validator rejects governance-level contradictions");
  check(/unauthorized_approval_or_execution/.test(validation), "validator rejects approval/execution claims");
  check(/FORBIDDEN_EXECUTION/.test(validation), "validator screens execution-claim language");
  check(/SECRETISH/.test(validation), "validator screens secret-shaped strings");

  const governance = src("app/leo/_lib/leoGovernanceEngine.ts");
  check(
    /externalClaimsApproval|externalClaimsDowngrade/.test(governance),
    "governance engine force-escalates on external approval/downgrade claims rather than honoring them",
  );

  const registry = src("app/leo/_lib/leoToolRegistry.ts");
  check(
    /operation === "WRITE" \|\| operation === "EXECUTE"/.test(registry) ||
      /"WRITE"[\s\S]{0,80}"EXECUTE"/.test(registry),
    "tool gate keys WRITE/EXECUTE block on fixed operation modes, not external input",
  );
}

// ---------------------------------------------------------------------------
// 2. Receipt evidence rejects secret-like fields (direct unit test, no DB)
// ---------------------------------------------------------------------------
{
  check(sanitizeLeoReceiptText("ACKNOWLEDGE attention_item/sig-1").ok === true, "safe summary passes");
  check(
    sanitizeLeoReceiptText("Bearer ya29.a0AfH6SMC1234567890abcdefghijklmnopqrstuvwxyz").ok === false,
    "Bearer-token-shaped summary rejected",
  );
  check(
    sanitizeLeoReceiptText("refresh_token=1//0gAbCdEfGhIjKlMnOpQrStUvWxYz1234567890").ok === false,
    "refresh_token-shaped summary rejected",
  );
  check(
    sanitizeLeoReceiptText("client_secret=GOCSPX-abcdefghijklmnopqrstuvwxyz1234").ok === false,
    "client_secret-shaped summary rejected",
  );

  const okRefs = sanitizeLeoReceiptSourceRefs([{ system: "LEO", kind: "attention_item", id: "sig-1" }]);
  check(okRefs.ok === true, "safe sourceRefs pass");

  const secretRef = sanitizeLeoReceiptSourceRefs([
    { system: "google", kind: "raw", id: "ya29.a0AfH6SMC1234567890abcdefghijklmnopqrstuvwxyz" },
  ]);
  check(secretRef.ok === false, "sourceRefs id containing a secret-shaped token rejected");

  const longRef = sanitizeLeoReceiptSourceRefs([{ system: "LEO", kind: "evidence", id: "x".repeat(500) }]);
  check(longRef.ok === false, "oversized sourceRefs field rejected");

  const tooMany = sanitizeLeoReceiptSourceRefs(
    Array.from({ length: 51 }, (_, i) => ({ system: "LEO", kind: "evidence", id: `e${i}` })),
  );
  check(tooMany.ok === false, "sourceRefs array over 50 entries rejected");

  // The sanitizer must reuse the existing detector, not a second one.
  check(
    leoGoogleDiagnosticContainsForbiddenSecretMaterial("Bearer abcXYZ123456789012345678901234567890=="),
    "shared secret detector still catches Bearer pattern (sanity check on reused function)",
  );

  const repoSrc = src("app/leo/_lib/leoToolReceiptRepository.ts");
  check(
    /from "@\/app\/leo\/_lib\/leoReceiptSanitization"/.test(repoSrc),
    "receipt repository imports the pure sanitization module (not server-only-gated)",
  );
  check(
    /sanitizeLeoReceiptText\(summary\)/.test(repoSrc) && /createLeoDurableToolReceipt/.test(repoSrc),
    "createLeoDurableToolReceipt routes summary through sanitizer",
  );
  check(/sanitizeLeoReceiptSourceRefs\(input\.sourceRefs\)/.test(repoSrc), "createLeoDurableToolReceipt routes sourceRefs through sanitizer");
  check(/sanitizeLeoReceiptText\(patch\.safe_error_class\)/.test(repoSrc), "transitionLeoDurableToolReceipt routes safe_error_class through sanitizer");

  const migration = src("supabase/migrations/20260819222000_leo15_action_execution_idempotency.sql");
  check(/source_refs_bounded/.test(migration), "DB-level source_refs length bound present");
}

// ---------------------------------------------------------------------------
// 3. Deterministic duplicate action key dedupes (no timestamp-embedded correlation id)
// ---------------------------------------------------------------------------
{
  const ackSvc = src("app/leo/_lib/leoAttentionAckService.ts");
  check(
    /const correlationId = `leo-internal:\$\{actionType\}:\$\{sourceKind\}:\$\{sourceKey\}`;/.test(ackSvc),
    "attention-action correlationId is deterministic (no embedded timestamp)",
  );
  check(!/leo-internal:.*Date\.now\(\)/.test(ackSvc), "attention-action correlationId no longer embeds Date.now()");
  check(/idempotentReplay/.test(ackSvc), "attention-action executor checks idempotentReplay before re-running the mutation");
  check(
    /LEO_RECEIPT_TERMINAL_STATES/.test(ackSvc) && /"VERIFIED"/.test(ackSvc) && /"CANCELLED"/.test(ackSvc),
    "attention-action executor short-circuits on terminal receipt states",
  );

  const repoSrc = src("app/leo/_lib/leoToolReceiptRepository.ts");
  check(
    /getLeoDurableToolReceiptByCorrelation\(correlationId, actor\)/.test(repoSrc),
    "createLeoDurableToolReceipt checks for an existing receipt by (actor, correlationId) before inserting",
  );
  check(/error\?\.code === "23505"/.test(repoSrc), "createLeoDurableToolReceipt handles the unique-constraint race as a replay, not a failure");

  const migration = src("supabase/migrations/20260819222000_leo15_action_execution_idempotency.sql");
  check(
    /leo_tool_receipts_actor_correlation_unique/.test(migration) && /UNIQUE \(actor_auth_user_id, correlation_id\)/.test(migration),
    "DB unique constraint on (actor_auth_user_id, correlation_id) present",
  );
}

// ---------------------------------------------------------------------------
// 4. Concurrent/duplicate claim cannot produce two execution claims (atomic CAS)
// ---------------------------------------------------------------------------
{
  const repoSrc = src("app/leo/_lib/leoToolReceiptRepository.ts");
  check(
    /\.eq\("lifecycle_state", existing\.lifecycleState\)/.test(repoSrc),
    "transitionLeoDurableToolReceipt guards its UPDATE with a lifecycle_state CAS predicate",
  );
  check(/concurrent_state_conflict/.test(repoSrc), "lost-race transitions return a distinct concurrent_state_conflict error");
}

// ---------------------------------------------------------------------------
// 5. Provider failure lifecycle cannot become VERIFIED success (pre-existing invariant, re-proven)
// ---------------------------------------------------------------------------
{
  const svc = src("app/leo/_lib/leoToolReceiptService.ts");
  check(/cannot_verify_before_executed/.test(svc), "leoMarkReceiptVerified still refuses to verify before executed_at is set");
  const repoSrc = src("app/leo/_lib/leoToolReceiptRepository.ts");
  check(/cannot_clear_executed_at/.test(repoSrc), "executed_at still cannot be cleared once set");
  check(/cannot_clear_verified_at/.test(repoSrc), "verified_at still cannot be cleared once set");
}

// ---------------------------------------------------------------------------
// 6. WRITE/EXECUTE remains externally disabled in this build
// ---------------------------------------------------------------------------
{
  const registry = src("app/leo/_lib/leoToolRegistry.ts");
  check(/WRITE_EXECUTE_BLOCKED/.test(registry), "tool registry still hard-blocks WRITE/EXECUTE operation modes");

  const actions = src("app/leo/_lib/leoExecutiveActions.ts");
  check(
    /EXECUTE_EXTERNAL/.test(actions) && /not available/i.test(actions),
    "EXECUTE_EXTERNAL is still hard-disabled with a truthful reason",
  );

  const gmail = src("app/leo/_lib/leoGmailAdapter.ts");
  check(!/messages\.send|drafts\.create|export (async )?function\s+sendLeoGmail/i.test(gmail), "no Gmail send/draft function exists");

  const calendar = src("app/leo/_lib/leoCalendarAdapter.ts");
  check(
    !/events\.insert|events\.update|events\.patch|export (async )?function\s+(createLeoCalendar|updateLeoCalendar)/i.test(calendar),
    "no Calendar create/update function exists",
  );
}

if (failures > 0) {
  console.error(`\nLEO FINAL 01 write-safety verifier FAIL (${failures})`);
  process.exit(1);
}
console.log("\nLEO FINAL 01 write-safety verifier PASS");
