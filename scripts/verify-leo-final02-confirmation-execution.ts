/**
 * LEO FINAL-02 confirmation + execution verifier (fixture-safe, no live DB/network).
 * Direct unit tests for fingerprinting, the WRITE allowlist, and the action
 * factory gate (all pure, non-server-only). Source assertions for the
 * execution service / API route (server-only / Next.js runtime), matching
 * how leoToolReceiptRepository.ts was verified in FINAL-01.
 * Run: npx tsx scripts/verify-leo-final02-confirmation-execution.ts
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

import { computeLeoActionProposalFingerprint } from "../app/leo/_lib/leoActionProposalFingerprint";
import {
  createCalendarConnectedAction,
  createEmailConnectedAction,
} from "../app/leo/_lib/leoExecutiveActions";
import { evaluateLeoToolRequestGate, LEO_WRITE_ALLOWLIST } from "../app/leo/_lib/leoToolRegistry";
import type { LeoConnectedActionProposal } from "../app/leo/_lib/leoTypes";

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
// AUTHORIZATION
// ---------------------------------------------------------------------------
{
  const route = src("app/api/leo/action/execute/route.ts");
  check(/resolveLeoAccess/.test(route), "owner_admin required at the route boundary");
  check(
    /"ownerAuthUserId" in record.*"owner_id" in record.*"ownerId" in record.*"actorAuthUserId" in record/.test(
      route.replace(/\n/g, " "),
    ),
    "client-supplied owner/actor identity is explicitly rejected",
  );
  check(/requireLeoOwnerAccess/.test(src("app/leo/_lib/leoActionExecutionService.ts")), "service layer independently re-derives owner identity server-side");

  // Unsupported action rejected — only the 5-tool allowlist is ever WRITE-eligible.
  const denied = evaluateLeoToolRequestGate({ toolId: "leo.attention.read", operation: "WRITE" });
  check(!denied.ok && denied.errorCode === "WRITE_EXECUTE_BLOCKED", "non-allowlisted tool denied for WRITE");
  const deniedUnknown = evaluateLeoToolRequestGate({ toolId: "leo.not.a.real.tool", operation: "WRITE" });
  check(!deniedUnknown.ok && deniedUnknown.errorCode === "UNKNOWN_TOOL", "unknown tool id rejected outright");
  check(LEO_WRITE_ALLOWLIST.size === 5, "write allowlist has exactly 5 entries — no scope creep");
  for (const id of ["leo.calendar.create", "leo.calendar.update", "leo.gmail.draft.create", "leo.gmail.send", "leo.gmail.reply"]) {
    check(LEO_WRITE_ALLOWLIST.has(id as never), `allowlist includes ${id}`);
    const gate = evaluateLeoToolRequestGate({ toolId: id, operation: "WRITE", runtimeAvailability: "AVAILABLE" });
    check(gate.ok === true, `allowlisted tool ${id} passes the WRITE gate when available`);
  }
}

// ---------------------------------------------------------------------------
// CONFIRMATION
// ---------------------------------------------------------------------------
{
  const proposalA: LeoConnectedActionProposal = {
    toolId: "leo.gmail.send",
    email: {
      kind: "SEND_EMAIL",
      recipientEmail: "client@example.com",
      recipientDisplayName: "Client",
      subject: "Re: proposal",
      bodyText: "See attached.",
      replyToMessageId: null,
      replyToThreadId: null,
    },
  };
  const proposalB: LeoConnectedActionProposal = {
    ...proposalA,
    email: { ...proposalA.email!, bodyText: "See attached — updated terms." },
  };

  const fpA1 = computeLeoActionProposalFingerprint(proposalA);
  const fpA2 = computeLeoActionProposalFingerprint(proposalA);
  const fpB = computeLeoActionProposalFingerprint(proposalB);

  check(fpA1 === fpA2, "identical proposal content always fingerprints identically");
  check(/^[0-9a-f]{64}$/.test(fpA1), "fingerprint is a 64-char lowercase hex SHA-256 digest");
  check(fpA1 !== fpB, "mutated proposal content (action A vs mutated B) fingerprints differently — cannot pass A's confirmation for B");

  const execService = src("app/leo/_lib/leoActionExecutionService.ts");
  check(/getLeoActionProposalForActor/.test(execService), "execute step re-fetches canonical proposal content by ID, never trusts client-supplied content");
  check(/input\.fingerprint !== proposalRecord\.fingerprint/.test(execService), "execute step rejects when the echoed fingerprint doesn't match stored content");
  check(/CONFIRMATION_STALE/.test(execService), "stale/mismatched confirmation has a distinct truthful error code");
  check(/!confirm/.test(src("app/api/leo/action/execute/route.ts")) === false || /confirmation_required/.test(src("app/api/leo/action/execute/route.ts")), "unconfirmed request (confirm !== true) is rejected");
  check(/expires_at/.test(src("supabase/migrations/20260819223000_leo_final02_connected_action_truth.sql")), "prepared proposals expire — cannot be confirmed indefinitely stale");
}

// ---------------------------------------------------------------------------
// IDEMPOTENCY (reuses FINAL-01 receipt system — no second framework)
// ---------------------------------------------------------------------------
{
  const execService = src("app/leo/_lib/leoActionExecutionService.ts");
  check(
    /correlationId = `leo-action:\$\{toolId\}:\$\{proposalRecord\.id\}`;/.test(execService),
    "correlationId is deterministic (actor+proposalId+toolId) — no Date.now()/nonce",
  );
  check(!/correlationId[\s\S]{0,80}Date\.now\(\)/.test(execService), "correlationId does not embed a timestamp");
  check(/idempotentReplay && RECEIPT_TERMINAL_STATES\.has/.test(execService), "duplicate click short-circuits on an already-terminal receipt instead of re-invoking the provider");
  check(/leoMarkReceiptAuthorized/.test(execService), "claim uses the FINAL-01 atomic CAS-guarded transition, not a second lock system");
  check(!/authorized\.ok\)[\s\S]{0,20}return[\s\S]{0,60}invokeAllowlistedAdapter/.test(execService.replace(/\s/g, "")), "provider is not invoked when the authorization claim was lost to a race");
  check(/invokeAllowlistedAdapter\(toolId, proposal\)/.test(execService), "exactly one provider adapter call site in the execute path");
  const adapterCallSites = (execService.match(/await (createLeoGmailDraft|sendLeoGmailMessage|replyLeoGmailMessage|createLeoCalendarEvent|updateLeoCalendarEvent)\(/g) ?? []).length;
  check(adapterCallSites === 5, "each of the 5 allowlisted provider functions is called from exactly one place");
}

if (failures > 0) {
  console.error(`\nLEO FINAL-02 confirmation/execution verifier FAIL (${failures})`);
  process.exit(1);
}
console.log("\nLEO FINAL-02 confirmation/execution verifier PASS");
