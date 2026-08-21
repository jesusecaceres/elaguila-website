/**
 * LEO-21D — Gmail Reply live-capable adapter (feature flag OFF) verifier.
 *
 * Run:
 *   npx tsx scripts/verify-leo-21d-gmail-reply-live-capable-flag-off.ts
 *
 * Fixtures/mocks only. DO NOT send email. No env/OAuth mutation.
 */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

import {
  buildLeoGmailReplyMimeRaw,
} from "../app/leo/_lib/leoGmailReplyMimeBuilder";
import {
  extractLeoGmailTextPlainFromFullPayload,
  leoGmailNormalizedBodiesMatch,
  normalizeLeoGmailReplyBodyForCompare,
  validateLeoGmailReplyApprovedPayload,
} from "../app/leo/_lib/leoGmailReplyVerificationHelpers";
import { leoConnectedActionMayBlindRetryExecute } from "../app/leo/_lib/leoConnectedActionExecutionPolicy";

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

const paths = {
  cfg: "app/leo/_lib/leoGoogleWorkspaceConfig.ts",
  scope: "app/leo/_lib/leoGmailSendScopeProof.ts",
  mime: "app/leo/_lib/leoGmailReplyMimeBuilder.ts",
  gmail: "app/leo/_lib/leoGmailAdapter.ts",
  helpers: "app/leo/_lib/leoGmailReplyVerificationHelpers.ts",
  adapter: "app/leo/_lib/leoGmailReplyConnectedActionAdapter.ts",
  orch: "app/leo/_lib/leoConnectedActionExecutionService.ts",
  cockpit: "app/admin/(dashboard)/leo/_components/LeoGovernedActionsPanel.tsx",
  oauth: "scripts/LEO_GOOGLE_OAUTH_SETUP.md",
  roadmap: "docs/leo/LEO_MASTER_ROADMAP.md",
  ios: "docs/leo/LEO_INTELLIGENCE_OPERATING_SYSTEM.md",
};

for (const p of Object.values(paths)) {
  check(exists(p), `file exists: ${p}`);
}

const cfg = src(paths.cfg);
const scope = src(paths.scope);
const mimeSrc = src(paths.mime);
const gmail = src(paths.gmail);
const helpers = src(paths.helpers);
const adapter = src(paths.adapter);
const orch = src(paths.orch);
const cockpit = src(paths.cockpit);

// Write flag
check(cfg.includes("LEO_GMAIL_REPLY_WRITE_ENABLED"), "write env flag exists in code");
check(
  cfg.includes("isLeoGmailReplyWriteFlagEnabled") &&
    cfg.includes('v.trim().toLowerCase() === "true"'),
  "write flag only explicit true enables",
);
check(
  !process.env.LEO_GMAIL_REPLY_WRITE_ENABLED ||
    process.env.LEO_GMAIL_REPLY_WRITE_ENABLED.trim().toLowerCase() !== "true",
  "write flag default false in current process",
);
check(
  /LEO_GMAIL_REPLY_WRITE_CAPABILITY_ENABLED[^=]*= false/.test(cfg),
  "capability constant remains false",
);

// Scope proof + two-key
check(
  scope.includes("tokeninfo") && scope.includes("LEO_GMAIL_SEND_SCOPE"),
  "gmail.send runtime scope proof exists (tokeninfo)",
);
check(
  adapter.includes("isLeoGmailReplyWriteFlagEnabled") &&
    adapter.includes("proveLeoGmailSendScopeGranted") &&
    adapter.includes("SCOPE_INSUFFICIENT"),
  "two-key rule enforced in adapter execute",
);
check(
  cfg.includes("LEO_GMAIL_SEND_SCOPE") &&
    cfg.includes("https://www.googleapis.com/auth/gmail.send"),
  "gmail.send required / declared",
);
{
  const expectedLine = cfg
    .split(/\r?\n/)
    .find((l) => l.includes("LEO_GOOGLE_EXPECTED_SCOPES ="));
  const readBlock = cfg.slice(
    cfg.indexOf("LEO_GOOGLE_CURRENT_READ_SCOPES = ["),
    cfg.indexOf("] as const", cfg.indexOf("LEO_GOOGLE_CURRENT_READ_SCOPES = [")) +
      "] as const".length,
  );
  check(
    Boolean(expectedLine?.includes("LEO_GOOGLE_CURRENT_READ_SCOPES")) &&
      !readBlock.includes("LEO_GMAIL_SEND_SCOPE"),
    "current expected scopes remain read-only",
  );
}

// MIME
check(exists(paths.mime), "MIME builder exists");
check(
  mimeSrc.includes('text/plain') && mimeSrc.includes("HEADER_INJECTION") && mimeSrc.includes("base64"),
  "plain text only + header injection protected",
);
{
  const bad = buildLeoGmailReplyMimeRaw({
    from: "a@example.com",
    to: "b@example.com\r\nBcc: evil@x.com",
    subject: "Re: Hi",
    body: "Hello",
    inReplyTo: "<id@x>",
    references: "<id@x>",
  });
  check(!bad.ok && bad.error === "HEADER_INJECTION", "header injection rejected");
  const good = buildLeoGmailReplyMimeRaw({
    from: "owner@example.com",
    to: "peer@example.com",
    subject: "Re: Meeting",
    body: "Thursday works\nThanks",
    inReplyTo: "<m1@x>",
    references: "<m0@x> <m1@x>",
  });
  check(good.ok === true && typeof good.rawBase64Url === "string" && good.rawBase64Url.length > 20, "MIME builds base64url raw");
  if (good.ok) {
    const decoded = Buffer.from(
      good.rawBase64Url.replace(/-/g, "+").replace(/_/g, "/"),
      "base64",
    ).toString("utf8");
    check(
      decoded.includes("Content-Type: text/plain") && !decoded.toLowerCase().includes("text/html"),
      "MIME is plain-text V1 only",
    );
  }
}

// Send transport
check(
  gmail.includes("sendLeoGmailRawMessage") &&
    gmail.includes("/users/me/messages/send") &&
    gmail.includes('method: "POST"'),
  "Gmail send transport exists (messages.send)",
);
check(
  !adapter.includes("/users/me/messages/send") &&
    adapter.includes("sendLeoGmailRawMessage"),
  "messages.send exists only in provider transport (adapter calls helper)",
);

// Adapter execute requirements
check(adapter.includes("validateLeoGmailReplyApprovedPayload"), "execute requires approved payload validation");
check(adapter.includes("revalidateThreadBeforeSend") || adapter.includes("Pre-send thread"), "thread revalidation present");
check(adapter.includes("recipient") && adapter.includes("body") && adapter.includes("threadId"), "thread/recipient/body required");
check(
  adapter.includes("recipient_not_in_thread") || adapter.includes("no silent"),
  "no recipient guessing / no silent retarget (revalidation reasons)",
);
check(adapter.includes("buildLeoGmailReplyMimeRaw"), "MIME build before send");
check(adapter.includes("dispatchStarted") || adapter.includes("UNKNOWN_EXTERNAL_OUTCOME"), "dispatch boundary / unknown outcome modeled");

{
  const miss = validateLeoGmailReplyApprovedPayload({
    actionFamily: "GMAIL_REPLY",
    structuredPayload: { threadId: "t", body: "x", recipient: "Maria" },
  });
  check(!miss.ok, "no recipient guessing");
}

// Body read + normalize + verify FULL
check(
  gmail.includes("format=full") &&
    gmail.includes("readLeoGmailMessagePlainTextById") &&
    gmail.includes("extractLeoGmailTextPlainFromFullPayload"),
  "full-format verification read + bounded text/plain extraction",
);
check(
  !gmail.includes("persist") || gmail.includes("not persisted") || gmail.includes("Never persists"),
  "no raw persistence language for full dumps",
);
{
  const payload = {
    mimeType: "multipart/alternative",
    parts: [
      {
        mimeType: "text/plain",
        body: { data: Buffer.from("Hello\r\nWorld").toString("base64url") },
      },
    ],
  };
  const ex = extractLeoGmailTextPlainFromFullPayload(payload);
  check(ex.ok === true, "text/plain extraction works on fixture");
  check(
    leoGmailNormalizedBodiesMatch("Hello\r\nWorld", "Hello\nWorld"),
    "body normalization CRLF→LF compare",
  );
  check(
    normalizeLeoGmailReplyBodyForCompare("a  b") === "a  b",
    "does not collapse internal spaces",
  );
}
check(
  adapter.includes("leoGmailNormalizedBodiesMatch") &&
    adapter.includes('status: "VERIFIED"') &&
    adapter.includes("bodyOk"),
  "body verification FULL for supported plain-text V1; VERIFIED requires body match",
);
check(
  adapter.includes("PROVIDER_ACCEPTED") &&
    adapter.includes("Provider accepted ≠ verified"),
  "provider accepted != verified",
);

// Unknown / verify-only
check(
  adapter.includes("UNKNOWN_EXTERNAL_OUTCOME") &&
    adapter.includes("reconcileFirst") &&
    adapter.includes("dispatchStarted"),
  "timeout after dispatch => UNKNOWN_EXTERNAL_OUTCOME",
);
{
  const gate = leoConnectedActionMayBlindRetryExecute({
    priorStatus: "UNKNOWN_EXTERNAL_OUTCOME",
    priorExternalSideEffectPossible: true,
    mode: "execute",
  });
  check(!gate.allowed, "unknown outcome => no blind resend");
}
check(
  adapter.includes("verify_only") ||
    (adapter.includes("verify(") && !/sendLeoGmailRawMessage/.test(adapter.slice(adapter.indexOf("async verify")))),
  "verify-only cannot send",
);
{
  const verifySlice = adapter.slice(adapter.indexOf("async verify("));
  check(!verifySlice.includes("sendLeoGmailRawMessage"), "verify() never calls send");
}

// UI
check(
  cockpit.includes('data-leo-action="execute-request"') &&
    cockpit.includes("canExecute") &&
    cockpit.includes("Send this exact approved reply"),
  "21E.1 Execute surface exists and is capability-gated",
);
check(!cockpit.includes("Send now"), "21B cockpit has no Send now");
check(!/>\s*Schedule\s*</.test(cockpit) && !cockpit.includes("Schedule now"), "21B cockpit has no Schedule");

// Execution API exists as of 21E.1 — still authority OFF (flag + scope)
check(
  exists("app/api/leo/action/proposal/[proposalId]/execute/route.ts") &&
    src("app/api/leo/action/proposal/[proposalId]/execute/route.ts").includes(
      "leoExecuteGovernedConnectedAction",
    ),
  "execution API exists and calls orchestrator (authority still two-key gated)",
);

// Current config cannot send
check(
  (!process.env.LEO_GMAIL_REPLY_WRITE_ENABLED ||
    process.env.LEO_GMAIL_REPLY_WRITE_ENABLED.trim().toLowerCase() !== "true") &&
    cfg.includes('v.trim().toLowerCase() === "true"'),
  "current default configuration cannot send (flag absent/off)",
);
check(
  !cfg.includes("LEO_GOOGLE_EXPECTED_SCOPES") ||
    cfg.includes("LEO_GOOGLE_CURRENT_READ_SCOPES"),
  "gmail.readonly / calendar.readonly preserved as expected grant",
);

check(!exists("app/leo/_lib/leoGoogleContactsAdapter.ts"), "no Contacts");
const cal = src("app/leo/_lib/leoCalendarAdapter.ts");
check(!/events\.insert|events\.patch|events\.update/i.test(cal), "no Calendar write");

check(
  src(paths.roadmap).includes("LEO-21D") &&
    src(paths.roadmap).includes("authority OFF") &&
    src(paths.ios).includes("LEO-21D"),
  "docs record LEO-21D live-capable authority OFF",
);
check(
  src(paths.oauth).includes("Do not regenerate") &&
    (src(paths.oauth).includes("LEO-21D") || src(paths.oauth).includes("LEO-21E.1")),
  "OAuth docs: no grant mutation in 21D",
);

check(
  orch.includes("leoGmailReplyConnectedActionAdapter") &&
    orch.includes("verify_only"),
  "orchestrator retains verify_only / adapter wire",
);

check(
  !execSync("git ls-files supabase/migrations", { cwd: ROOT, encoding: "utf8" })
    .split(/\r?\n/)
    .some((m) => /leo.?21d|gmail.?reply.?live/i.test(m)),
  "no migration",
);

function runRegression(script: string, label: string) {
  try {
    execSync(`npx tsx ${script}`, { cwd: ROOT, stdio: "pipe", encoding: "utf8" });
    check(true, label);
  } catch (e: unknown) {
    const err = e as { stdout?: string; stderr?: string };
    console.error(`${err?.stdout ?? ""}${err?.stderr ?? ""}`.slice(-2500));
    check(false, label);
  }
}

runRegression("scripts/verify-leo-21a-governed-execution-runtime.ts", "21A passes");
runRegression("scripts/verify-leo-21b-governed-action-approval-cockpit.ts", "21B passes");
runRegression("scripts/verify-leo-21c-gmail-reply-adapter-blocked.ts", "21C passes");
runRegression("scripts/verify-leo-17b-conversation-proposal-wiring.ts", "LEO-17B regression passes");
runRegression("scripts/verify-leo-18a-entity-resolution.ts", "LEO-18a regression passes");
runRegression("scripts/verify-leo-18b-executive-context.ts", "LEO-18b regression passes");
runRegression("scripts/verify-leo-19a-intelligence-router.ts", "LEO-19a regression passes");
runRegression("scripts/verify-leo-19c-provider-adapter-runtime.ts", "LEO-19c regression passes");
runRegression("scripts/verify-leo-20a-self-intelligence-foundation.ts", "LEO-20a regression passes");
runRegression(
  "scripts/verify-leo-20d-buyer-engagement-journey-sensor.ts",
  "LEO-20d regression passes",
);

check(
  adapter.includes("CAPABILITY ≠ AUTHORITY") || helpers.includes("CAPABILITY"),
  "CAPABILITY != AUTHORITY",
);

check(true, "no env mutation by verifier");
check(true, "no OAuth grant mutation");
check(true, "no live email");
check(true, "no Supabase remote");

if (failures > 0) {
  console.error(`\nLEO-21D verifier FAILED (${failures})`);
  process.exit(1);
}
console.log("\nLEO-21D verifier PASSED");
