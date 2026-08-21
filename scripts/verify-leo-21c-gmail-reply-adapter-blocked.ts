/**
 * LEO-21C Gmail Reply Adapter (write-disabled / scope-aware) verifier.
 *
 * Run:
 *   npx tsx scripts/verify-leo-21c-gmail-reply-adapter-blocked.ts
 *
 * No provider write. No OAuth grant change. No live email.
 */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

import {
  normalizeLeoGmailRecipientEmail,
  validateLeoGmailReplyApprovedPayload,
  leoGmailNormalizedBodiesMatch,
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

const adapterPath = "app/leo/_lib/leoGmailReplyConnectedActionAdapter.ts";
const helpersPath = "app/leo/_lib/leoGmailReplyVerificationHelpers.ts";
const cfgPath = "app/leo/_lib/leoGoogleWorkspaceConfig.ts";
const gmailPath = "app/leo/_lib/leoGmailAdapter.ts";
const orchPath = "app/leo/_lib/leoConnectedActionExecutionService.ts";
const cockpitPath = "app/admin/(dashboard)/leo/_components/LeoGovernedActionsPanel.tsx";

for (const p of [adapterPath, helpersPath, cfgPath, gmailPath, orchPath, cockpitPath]) {
  check(exists(p), `file exists: ${p}`);
}

const adapterSrc = src(adapterPath);
const helpersSrc = src(helpersPath);
const cfgSrc = src(cfgPath);
const gmailSrc = src(gmailPath);
const orchSrc = src(orchPath);
const cockpitSrc = src(cockpitPath);

check(adapterSrc.includes("leo.gmail_reply"), "Gmail reply adapter exists");
check(
  adapterSrc.includes('actionFamily === "GMAIL_REPLY"') ||
    adapterSrc.includes("actionFamily === 'GMAIL_REPLY'"),
  "canHandle only GMAIL_REPLY",
);

{
  const expectedLine = cfgSrc
    .split(/\r?\n/)
    .find((l) => l.includes("LEO_GOOGLE_EXPECTED_SCOPES ="));
  const readBlock = cfgSrc.slice(
    cfgSrc.indexOf("LEO_GOOGLE_CURRENT_READ_SCOPES = ["),
    cfgSrc.indexOf("] as const", cfgSrc.indexOf("LEO_GOOGLE_CURRENT_READ_SCOPES = [")) +
      "] as const".length,
  );
  check(
    Boolean(expectedLine?.includes("LEO_GOOGLE_CURRENT_READ_SCOPES")) &&
      readBlock.includes("LEO_GMAIL_READONLY_SCOPE") &&
      readBlock.includes("LEO_CALENDAR_READONLY_SCOPE") &&
      !readBlock.includes("LEO_GMAIL_SEND_SCOPE") &&
      !expectedLine?.includes("LEO_GMAIL_SEND_SCOPE"),
    "current Gmail expected grant remains readonly (send not in EXPECTED)",
  );
}
check(
  cfgSrc.includes("LEO_GMAIL_SEND_SCOPE") &&
    cfgSrc.includes("https://www.googleapis.com/auth/gmail.send"),
  "gmail.send declared as future required capability",
);
check(
  /LEO_GMAIL_REPLY_WRITE_CAPABILITY_ENABLED[^=]*= false/.test(cfgSrc) &&
    cfgSrc.includes("isLeoGmailReplyWriteCapabilityEnabled"),
  "gmail.send NOT enabled (write capability false)",
);
check(
  cfgSrc.includes("LEO_CALENDAR_READONLY_SCOPE") &&
    cfgSrc.includes("calendar.readonly"),
  "Calendar readonly unchanged",
);

check(
  !/users\/me\/messages\/send/i.test(adapterSrc) &&
    !/"POST"\s*,\s*\n?\s*headers:[\s\S]{0,80}gmail\.googleapis/i.test(adapterSrc) &&
    !adapterSrc.includes("fetch(`https://gmail.googleapis.com") &&
    adapterSrc.includes("externalSideEffectPossible: false"),
  "adapter execute contains no Gmail send call",
);
check(
  adapterSrc.includes("externalSideEffectPossible: false") &&
    adapterSrc.includes("externalSideEffectConfirmed: false"),
  "adapter execute produces no side effect flags",
);
check(
  adapterSrc.includes("SCOPE_INSUFFICIENT") && adapterSrc.includes("NOT_CONNECTED"),
  "missing write scope / connection fail-closed classes present",
);

{
  const missingThread = validateLeoGmailReplyApprovedPayload({
    actionFamily: "GMAIL_REPLY",
    structuredPayload: { recipient: "a@example.com", body: "Hi", threadId: null },
  });
  check(
    !missingThread.ok && missingThread.missing.includes("exact_thread_id"),
    "missing thread => TARGET_UNRESOLVED",
  );
  const missingRecipient = validateLeoGmailReplyApprovedPayload({
    actionFamily: "GMAIL_REPLY",
    structuredPayload: { threadId: "t1", body: "Hi", recipient: "Maria" },
  });
  check(
    !missingRecipient.ok && missingRecipient.missing.includes("exact_recipient_email"),
    "missing recipient / name guess blocked",
  );
  check(normalizeLeoGmailRecipientEmail("Maria") == null, "no recipient guessing from name");
  const okPayload = validateLeoGmailReplyApprovedPayload({
    actionFamily: "GMAIL_REPLY",
    structuredPayload: {
      threadId: "t1",
      recipient: "a@example.com",
      body: "Thursday works",
    },
  });
  check(okPayload.ok === true, "valid payload accepted");
}

check(
  adapterSrc.includes("readLeoGmailMessageById") &&
    gmailSrc.includes("readLeoGmailMessageById") &&
    !/users\/me\/messages\/send/i.test(adapterSrc),
  "verification path is read-only / existing Gmail client reused",
);
check(
  gmailSrc.includes("Message-ID") &&
    gmailSrc.includes("References") &&
    gmailSrc.includes("In-Reply-To"),
  "Message-ID header support added",
);
check(
  (adapterSrc.includes("PARTIAL") &&
    (adapterSrc.includes("Provider accepted ≠ verified") ||
      adapterSrc.includes("provider accepted"))) ||
    adapterSrc.includes("PROVIDER_ACCEPTED_UNVERIFIED"),
  "provider accepted != verified / body PARTIAL documented",
);
check(!/raw MIME|full provider response|access_token/i.test(adapterSrc), "no raw full provider dumps");

{
  const gate = leoConnectedActionMayBlindRetryExecute({
    priorStatus: "UNKNOWN_EXTERNAL_OUTCOME",
    priorExternalSideEffectPossible: true,
    mode: "execute",
  });
  check(!gate.allowed, "unknown outcome policy unchanged — no blind resend");
}

check(orchSrc.includes("leoGmailReplyConnectedActionAdapter"), "adapter resolution wired");
check(
  orchSrc.includes("leoNullConnectedActionProviderAdapter"),
  "null adapter retained for other families",
);

check(!/data-leo-action=\"execute\"|>Execute</i.test(cockpitSrc), "21B cockpit has no Execute");
check(!/>\s*Send\s*</.test(cockpitSrc) && !cockpitSrc.includes("Send now"), "21B cockpit has no Send");
check(
  !/>\s*Schedule\s*</.test(cockpitSrc) && !cockpitSrc.includes("Schedule now"),
  "21B cockpit has no Schedule",
);

check(!exists("app/leo/_lib/leoGoogleContactsAdapter.ts"), "Contacts untouched");
const cal = src("app/leo/_lib/leoCalendarAdapter.ts");
check(!/events\.insert|events\.patch|events\.update/i.test(cal), "Calendar write untouched");

const oauthDoc = src("scripts/LEO_GOOGLE_OAUTH_SETUP.md");
check(
  oauthDoc.includes("gmail.send") &&
    oauthDoc.includes("NOT ENABLED") &&
    oauthDoc.includes("Do not regenerate"),
  "OAuth docs declare future scope without enabling",
);

check(
  !src(adapterPath).includes("apply_migration") &&
    !execSync("git ls-files supabase/migrations", { cwd: ROOT, encoding: "utf8" })
      .split(/\r?\n/)
      .some((m) => /leo.?21c|gmail.?reply/i.test(m)),
  "no migration / no Supabase remote invent",
);

check(
  leoGmailNormalizedBodiesMatch("Hello\r\nWorld", "Hello\nWorld") === true,
  "body normalization helper works",
);

const roadmap = src("docs/leo/LEO_MASTER_ROADMAP.md");
check(roadmap.includes("LEO-21C") && roadmap.includes("write-disabled"), "roadmap records 21C");

function runRegression(script: string, label: string) {
  try {
    execSync(`npx tsx ${script}`, { cwd: ROOT, stdio: "pipe", encoding: "utf8" });
    check(true, label);
  } catch (e: any) {
    console.error(`${e?.stdout ?? ""}${e?.stderr ?? ""}`.slice(-2000));
    check(false, label);
  }
}

runRegression("scripts/verify-leo-21a-governed-execution-runtime.ts", "21A passes");
runRegression("scripts/verify-leo-21b-governed-action-approval-cockpit.ts", "21B passes");
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
  adapterSrc.includes("CAPABILITY") || helpersSrc.includes("CAPABILITY"),
  "CAPABILITY != AUTHORITY referenced",
);

if (failures > 0) {
  console.error(`\nLEO-21C verifier FAILED (${failures})`);
  process.exit(1);
}
console.log("\nLEO-21C verifier PASSED");
