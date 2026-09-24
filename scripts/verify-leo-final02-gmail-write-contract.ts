/**
 * LEO FINAL-02 Gmail write contract verifier (fixture-safe, no real send/draft).
 * leoGmailWriteAdapter.ts is server-only; verified via source assertions for
 * MIME construction, encoding, validation, and receipt-safe evidence shape.
 * Run: npx tsx scripts/verify-leo-final02-gmail-write-contract.ts
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

const readAdapter = src("app/leo/_lib/leoGmailAdapter.ts");
const writeAdapter = src("app/leo/_lib/leoGmailWriteAdapter.ts");

// --- Security architecture separation (Gate 6) ---
check(/import "server-only"/.test(writeAdapter), "write adapter is server-only");
check(
  !/messages\/send|drafts\b/.test(readAdapter) && /No send\/modify\/delete/i.test(readAdapter),
  "read adapter (leoGmailAdapter.ts) remains read-only and untouched by write concerns",
);
check(/export async function createLeoGmailDraft/.test(writeAdapter), "draft creation exists");
check(/export async function sendLeoGmailMessage/.test(writeAdapter), "send exists");
check(/export async function replyLeoGmailMessage/.test(writeAdapter), "reply exists");
check(/\/users\/me\/drafts/.test(writeAdapter), "draft uses drafts endpoint");
check(/\/users\/me\/messages\/send/.test(writeAdapter), "send/reply use messages/send endpoint");

// --- MIME construction (Gate 6) ---
check(/function buildMimeMessage/.test(writeAdapter), "MIME builder exists");
check(/`To: \$\{/.test(writeAdapter), "MIME sets To header");
check(/`Subject: \$\{/.test(writeAdapter), "MIME sets Subject header");
check(/MIME-Version: 1\.0/.test(writeAdapter), "MIME-Version header present");
check(/text\/plain; charset="UTF-8"/.test(writeAdapter), "plain-text UTF-8 body (Gate 6 minimum)");
check(/In-Reply-To/.test(writeAdapter) && /References/.test(writeAdapter), "reply sets In-Reply-To/References when available");
check(/threadId: input\.threadId\.trim\(\)/.test(writeAdapter), "reply passes threadId for correct Gmail threading");

// --- URL-safe base64 encoding (Gate 6) ---
check(/function base64UrlEncode/.test(writeAdapter), "base64url encoder exists");
check(
  /replace\(\/\\\+\/g, "-"\)/.test(writeAdapter) && /replace\(\/\\\/\/g, "_"\)/.test(writeAdapter),
  "encoder is URL-safe (+/ -> -_)",
);
check(/replace\(\/=\+\$\/, ""\)/.test(writeAdapter), "encoder strips base64 padding");

// --- Header injection / recipient validation ---
check(/function stripHeaderInjection/.test(writeAdapter), "header-injection stripper exists");
check(/replace\(\/\[\\r\\n\]\+\/g/.test(writeAdapter), "CR/LF stripped from header values");
check(/function isValidEmailShape/.test(writeAdapter), "recipient shape validation exists");
check(/RECIPIENT_INVALID/.test(writeAdapter), "invalid recipient is rejected with a distinct error code");

// --- No silent CC/BCC, no invented recipients (Gate 6) ---
check(!/\bcc:\s*|\bbcc:\s*/i.test(writeAdapter), "no cc:/bcc: field is ever added to a request body");
check(/to: string/.test(writeAdapter), "recipient is a single required field, never inferred");

// --- Safe bounded evidence only (Gate 6, Gate 12) ---
check(/function mapMessageResponse/.test(writeAdapter), "response mapper exists");
check(/messageId,\s*\n\s*threadId:/.test(writeAdapter), "evidence includes messageId + threadId");
check(!/return\s*\{[^}]*raw:/.test(writeAdapter), "raw MIME payload is never echoed back in results");
{
  const resultType = writeAdapter.match(/export type LeoGmailWriteResult =[\s\S]*?\| \{ ok: false;[^}]*\};/)?.[0] ?? "";
  check(resultType.length > 0 && !/accessToken/.test(resultType), "LeoGmailWriteResult type never carries an access token field");
  const mapper = writeAdapter.match(/function mapMessageResponse[\s\S]*?\n\}/)?.[0] ?? "";
  check(mapper.length > 0 && !/accessToken/.test(mapper), "response mapper never forwards an access token into the result");
}

// --- Truthful failure classification (Gate 12) ---
check(/GMAIL_WRITE_UNAUTHORIZED/.test(writeAdapter), "401 classified distinctly");
check(/GMAIL_WRITE_FORBIDDEN/.test(writeAdapter), "403 classified distinctly (likely SCOPE_MISSING in practice)");
check(/GMAIL_WRITE_RATE_LIMITED/.test(writeAdapter), "429 classified distinctly");
check(/GMAIL_WRITE_PROVIDER_ERROR/.test(writeAdapter), "5xx classified distinctly");
check(/GMAIL_WRITE_NETWORK_OR_TIMEOUT/.test(writeAdapter), "network/timeout classified distinctly");

// --- Bounded input (defense in depth) ---
check(/MAX_SUBJECT_CHARS = 200/.test(writeAdapter), "subject length bounded");
check(/MAX_BODY_CHARS = 20_000/.test(writeAdapter), "body length bounded");

// --- Execution service only calls the allowlisted adapter functions ---
const execService = src("app/leo/_lib/leoActionExecutionService.ts");
check(
  /createLeoGmailDraft|sendLeoGmailMessage|replyLeoGmailMessage/.test(execService),
  "execution service imports the Gmail write functions",
);
check(
  !/leoGmailWriteAdapter/.test(src("app/leo/_lib/leoConversationService.ts")),
  "Gmail write adapter is never imported directly from conversation code (must go through the execution service)",
);

if (failures > 0) {
  console.error(`\nLEO FINAL-02 Gmail write contract verifier FAIL (${failures})`);
  process.exit(1);
}
console.log("\nLEO FINAL-02 Gmail write contract verifier PASS");
