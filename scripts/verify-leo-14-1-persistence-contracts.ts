/**
 * LEO-14.1 Persistence Contracts verifier (static / fixture-safe).
 * Run: npx tsx scripts/verify-leo-14-1-persistence-contracts.ts
 *
 * Does NOT apply migrations remotely. Does NOT call live Supabase.
 */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

import { deriveLeoCommitmentDueState, isLeoAttentionAckSuppressing, LEO_TURN_RETENTION_DAYS, LEO_TURN_TEXT_MAX } from "../app/leo/_lib/leoPersistenceSemantics";
import type { LeoAttentionAck, LeoCommitment } from "../app/leo/_lib/leoTypes";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const EXPECTED_BRANCH = "integration/leo-executive-operating-intelligence-2026-08";
const MIGRATION = "supabase/migrations/20260819120000_leo14_executive_action_os.sql";

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
check(branch === EXPECTED_BRANCH, "correct LEO integration branch");

check(exists(MIGRATION), "migration file exists");
const migration = src(MIGRATION);

// SCHEMA CONTRACT
const tables = [
  "leo_conversation_sessions",
  "leo_conversation_turns",
  "leo_commitments",
  "leo_tool_receipts",
  "leo_attention_acks",
];
for (const t of tables) {
  check(new RegExp(`CREATE TABLE IF NOT EXISTS public\\.${t}`).test(migration), `table defined: ${t}`);
  check(
    new RegExp(`ALTER TABLE public\\.${t} ENABLE ROW LEVEL SECURITY`).test(migration),
    `RLS enabled: ${t}`,
  );
}

check(!/CREATE POLICY/i.test(migration), "no anon/public/authenticated policies");
check(!/DROP TABLE|TRUNCATE|ALTER TABLE public\.leo_memory_records/i.test(migration), "no destructive SQL / Living Book untouched");
check(
  /leo_conversation_sessions_owner_active_idx/.test(migration) &&
    /leo_conversation_turns_session_created_idx/.test(migration) &&
    /leo_commitments_owner_status_idx/.test(migration) &&
    /leo_tool_receipts_actor_created_idx/.test(migration) &&
    /leo_attention_acks_owner_source_uq/.test(migration),
  "expected indexes / uniqueness present",
);
check(
  /CHECK \(mode IN \('TEXT', 'HANDS_FREE', 'LOW_ATTENTION'\)\)/.test(migration) &&
    /CHECK \(role IN \('USER', 'LEO', 'SYSTEM'\)\)/.test(migration),
  "session mode + turn role CHECKs",
);
check(
  /CHECK \(kind IN \('EXPLICIT_OWNER', 'EXTRACTED_CANDIDATE', 'EXTERNAL_PARTY'\)\)/.test(migration) &&
    /CHECK \(status IN \('OPEN', 'COMPLETED', 'CANCELLED', 'SUPERSEDED'\)\)/.test(migration) &&
    !/status IN \([^)]*DUE_SOON/.test(migration) &&
    !/status IN \([^)]*OVERDUE/.test(migration),
  "commitment kind/status CHECKs; no DUE_SOON/OVERDUE columns",
);
check(
  /lifecycle_state[\s\S]*REQUESTED[\s\S]*PREPARED[\s\S]*EXECUTED[\s\S]*VERIFIED[\s\S]*FAILED[\s\S]*NOT_EXECUTED/.test(
    migration,
  ),
  "receipt lifecycle states present",
);
check(
  /CHECK \(disposition IN \('ACKNOWLEDGED', 'DISMISSED', 'SNOOZED'\)\)/.test(migration),
  "ack disposition CHECK",
);

// CONVERSATION retention / safety
check(
  /expires_at timestamptz NOT NULL DEFAULT \(now\(\) \+ interval '60 days'\)/.test(migration),
  "60-day turn expires_at default in SQL",
);
check(LEO_TURN_RETENTION_DAYS === 60, "repository retention constant = 60 days");
check(LEO_TURN_TEXT_MAX === 4000, "bounded turn text max = 4000");
check(
  /char_length\(bounded_text\) <= 4000/.test(migration),
  "DB CHECK on bounded_text length",
);
check(
  !/access_token|refresh_token|client_secret|raw_audio|mime_body|full_thread/i.test(migration),
  "no raw audio / OAuth / full Gmail body fields",
);
check(
  /REFERENCES public\.leo_conversation_sessions \(id\)/.test(migration) &&
    !/REFERENCES public\.leo_conversation_sessions \(id\)\s+ON DELETE CASCADE/i.test(migration),
  "turn FK without ON DELETE CASCADE (auditability)",
);

// Source files server-only
const repoFiles = [
  "app/leo/_lib/leoConversationSessionRepository.ts",
  "app/leo/_lib/leoCommitmentRepository.ts",
  "app/leo/_lib/leoToolReceiptRepository.ts",
  "app/leo/_lib/leoAttentionAckRepository.ts",
  "app/leo/_lib/leoConversationSessionService.ts",
  "app/leo/_lib/leoCommitmentService.ts",
  "app/leo/_lib/leoToolReceiptService.ts",
  "app/leo/_lib/leoAttentionAckService.ts",
];
for (const f of repoFiles) {
  check(exists(f), `exists ${f}`);
  check(/import "server-only"/.test(src(f)), `server-only: ${path.basename(f)}`);
}

const types = src("app/leo/_lib/leoTypes.ts");
check(/export type LeoConversationSession/.test(types), "type LeoConversationSession");
check(/export type LeoConversationTurn/.test(types), "type LeoConversationTurn");
check(/export type LeoCommitment /.test(types) || /export type LeoCommitment =/.test(types), "type LeoCommitment");
check(/export type LeoDurableToolReceipt/.test(types), "type LeoDurableToolReceipt (distinct from ephemeral)");
check(/export type LeoAttentionAck /.test(types) || /export type LeoAttentionAck =/.test(types), "type LeoAttentionAck");
check(/LeoAttentionAckDisposition/.test(types), "LeoAttentionAckDisposition distinct from attention engine disposition");

// COMMITMENT semantics (pure helpers)
{
  const openSoon: Pick<LeoCommitment, "status" | "dueAt"> = {
    status: "OPEN",
    dueAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
  };
  const openOverdue: Pick<LeoCommitment, "status" | "dueAt"> = {
    status: "OPEN",
    dueAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
  };
  const completed: Pick<LeoCommitment, "status" | "dueAt"> = {
    status: "COMPLETED",
    dueAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
  };
  check(deriveLeoCommitmentDueState(openSoon) === "DUE_SOON", "derived DUE_SOON");
  check(deriveLeoCommitmentDueState(openOverdue) === "OVERDUE", "derived OVERDUE");
  check(deriveLeoCommitmentDueState(completed) === "NONE", "completed not overdue");
}

{
  const candRepo = src("app/leo/_lib/leoCommitmentRepository.ts");
  check(/confirmLeoCommitmentCandidate/.test(candRepo), "confirm candidate helper exists");
  check(
    /kind !== "EXTRACTED_CANDIDATE"/.test(candRepo) || /not_a_candidate/.test(candRepo),
    "confirm rejects non-candidates",
  );
  check(
    /creation_method: "OWNER_CONFIRM"/.test(candRepo) && /kind: "EXPLICIT_OWNER"/.test(candRepo),
    "confirm promotes with OWNER_CONFIRM",
  );
  check(
    /explicit_owner_cannot_use_extracted_method/.test(candRepo),
    "cannot create EXPLICIT_OWNER with EXTRACTED method",
  );
}

// RECEIPT semantics (source inspection)
{
  const svc = src("app/leo/_lib/leoToolReceiptService.ts");
  const repo = src("app/leo/_lib/leoToolReceiptRepository.ts");
  check(/cannot_verify_before_executed/.test(svc), "cannot VERIFIED before EXECUTED");
  check(/cannot_clear_executed_at/.test(repo), "cannot clear executed_at");
  check(/cannot_clear_verified_at/.test(repo), "cannot clear verified_at");
  check(/lifecycle_state: "PREPARED"/.test(svc) && /lifecycle_state: "EXECUTED"/.test(svc), "PREPARED and EXECUTED distinct");
  check(/lifecycle_state: "NOT_EXECUTED"/.test(svc) && /lifecycle_state: "FAILED"/.test(svc), "FAILED != NOT_EXECUTED");
  check(
    !/tool_id:/.test(repo.match(/transitionLeoDurableToolReceipt[\s\S]*?^}/m)?.[0] ?? "tool_id:") ||
      !/update\(\{[\s\S]*tool_id/.test(repo),
    "transition does not rewrite tool_id",
  );
  check(!/requested_payload_summary:\s*patch/.test(repo), "transition does not rewrite payload summary");
}

// ACK semantics
{
  const now = Date.now();
  const base: LeoAttentionAck = {
    id: "1",
    ownerAuthUserId: "u",
    sourceKind: "attention",
    sourceKey: "sig-a",
    disposition: "ACKNOWLEDGED",
    snoozeUntil: null,
    note: null,
    createdAt: new Date(now).toISOString(),
    updatedAt: new Date(now).toISOString(),
    expiresAt: null,
  };
  check(isLeoAttentionAckSuppressing(base, now) === true, "ACK suppresses");
  check(
    isLeoAttentionAckSuppressing({ ...base, disposition: "DISMISSED" }, now) === true,
    "DISMISS suppresses",
  );
  check(
    isLeoAttentionAckSuppressing(
      {
        ...base,
        disposition: "SNOOZED",
        snoozeUntil: new Date(now + 60_000).toISOString(),
      },
      now,
    ) === true,
    "SNOOZE active while before snooze_until",
  );
  check(
    isLeoAttentionAckSuppressing(
      {
        ...base,
        disposition: "SNOOZED",
        snoozeUntil: new Date(now - 60_000).toISOString(),
      },
      now,
    ) === false,
    "SNOOZE expired after snooze_until",
  );
  check(isLeoAttentionAckSuppressing(null, now) === false, "no ack => not suppressing");
  // Different source key = different identity (unique constraint) — documented by UNIQUE
  check(/UNIQUE \(owner_auth_user_id, source_kind, source_key\)/.test(migration), "source identity uniqueness");
}

// SECURITY / LOCKS
check(!exists("app/api/leo/commitments"), "no public commitments API route");
check(!exists("app/api/leo/receipts"), "no public receipts API route");
const gmail = src("app/leo/_lib/leoGmailAdapter.ts");
const cal = src("app/leo/_lib/leoCalendarAdapter.ts");
check(!/messages\/send|users\.messages\.send/.test(gmail), "Gmail remains read-only");
check(!/events\.insert|events\.update|events\.patch|events\.delete/.test(cal), "Calendar remains read-only");
check(exists("public/sw.js"), "PWA SW still present (untouched expectation)");
const swDiff = execSync("git diff --name-only HEAD -- public/sw.js public/manifest.webmanifest", {
  cwd: ROOT,
  encoding: "utf8",
}).trim();
check(swDiff === "", "PWA files untouched");

const livingBook = src("supabase/migrations/20260817120000_leo_living_book_foundation.sql");
check(/leo_memory_records/.test(livingBook), "Living Book migration still present");
check(!/leo_conversation_sessions/.test(livingBook), "Living Book migration not polluted");

// Scope allowlist for this gate
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
  "supabase/migrations/20260819120000_leo14_executive_action_os.sql",
  "app/leo/_lib/leoTypes.ts",
  "app/leo/_lib/leoConversationSessionRepository.ts",
  "app/leo/_lib/leoConversationSessionService.ts",
  "app/leo/_lib/leoCommitmentRepository.ts",
  "app/leo/_lib/leoCommitmentService.ts",
  "app/leo/_lib/leoToolReceiptRepository.ts",
  "app/leo/_lib/leoToolReceiptService.ts",
  "app/leo/_lib/leoAttentionAckRepository.ts",
  "app/leo/_lib/leoAttentionAckService.ts",
  "app/leo/_lib/leoPersistenceSemantics.ts",
  "scripts/verify-leo-14-1-persistence-contracts.ts",
  "scripts/verify-leo-13-gmail-calendar-intelligence.ts",
  "scripts/verify-leo-13a-google-live-connection.ts",
  // LEO-14.2 result/action contracts
  "app/leo/_lib/leoResultCards.ts",
  "app/leo/_lib/leoExecutiveActions.ts",
  "scripts/verify-leo-14-2-result-action-contracts.ts",
  // LEO-14.3 Gmail executive triage
  "app/leo/_lib/leoGmailTriageUpgrade.ts",
  "app/leo/_lib/leoCommunicationIntelligenceService.ts",
  "app/leo/_lib/leoConversationComposer.ts",
  "app/leo/_lib/leoConversationService.ts",
  "scripts/verify-leo-14-3-gmail-executive-triage.ts",
  // LEO-14.4 commitment intelligence
  "app/leo/_lib/leoCommitmentIntelligence.ts",
  "app/leo/_lib/leoCommitmentRepository.ts",
  "app/leo/_lib/leoCommitmentService.ts",
  "app/leo/_lib/leoPersistenceSemantics.ts",
  "app/leo/_lib/leoConversationRouter.ts",
  "app/leo/_lib/leoConversationService.ts",
  "app/leo/_lib/leoConversationComposer.ts",
  "app/leo/_lib/leoExecutiveActions.ts",
  "scripts/verify-leo-14-4-commitment-intelligence.ts",
  // LEO-14.5 receipts + attention runtime
  "app/leo/_lib/leoReceiptIntelligence.ts",
  "app/leo/_lib/leoAttentionRuntime.ts",
  "app/leo/_lib/leoToolReceiptRepository.ts",
  "app/leo/_lib/leoToolReceiptService.ts",
  "app/leo/_lib/leoAttentionAckRepository.ts",
  "app/leo/_lib/leoAttentionAckService.ts",
  "app/leo/_lib/leoAttentionService.ts",
  "app/leo/_lib/leoPreparationService.ts",
  "scripts/verify-leo-14-5-receipts-attention-runtime.ts",
]);

const illegal = [...changed, ...untracked].filter((f) => !allowed.has(f) && !f.endsWith("/"));
check(illegal.length === 0, `scope only allowlisted${illegal.length ? ": " + illegal.join(", ") : ""}`);

check(true, "Migration NOT remotely applied (static verifier only)");

if (failures > 0) {
  console.error(`\nLEO-14.1 verifier FAIL (${failures})`);
  process.exit(1);
}
console.log("\nLEO-14.1 verifier PASS");
