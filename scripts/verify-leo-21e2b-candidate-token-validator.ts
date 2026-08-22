/**
 * LEO-21E.2B — Local candidate refresh-token validator (source contract).
 * Self-contained. Does NOT nest historical verifiers.
 * Does NOT run the validator with credentials.
 *
 *   npx tsx scripts/verify-leo-21e2b-candidate-token-validator.ts
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

const started = Date.now();
const branch = execSync("git branch --show-current", { cwd: ROOT, encoding: "utf8" }).trim();
check(branch === EXPECTED_BRANCH, "correct integration branch");

const validatorPath = "scripts/leo-google-candidate-token-validate.mjs";
const docsPath = "scripts/LEO_GOOGLE_OAUTH_SETUP.md";
check(exists(validatorPath), "validator exists");
check(exists(docsPath), "OAuth setup docs exist");

const v = src(validatorPath);
const docs = src(docsPath);

check(v.includes("LOCAL ONLY") || v.includes("LOCAL OPS ONLY"), "local-only wording");
check(v.includes("LEO_GOOGLE_CANDIDATE_REFRESH_TOKEN"), "candidate env name used");
check(
  v.includes("not LEO_GOOGLE_REFRESH_TOKEN") &&
    v.includes("LEO_GOOGLE_CANDIDATE_REFRESH_TOKEN") &&
    !v.includes("env(\"LEO_GOOGLE_REFRESH_TOKEN\")") &&
    !v.includes("env('LEO_GOOGLE_REFRESH_TOKEN')"),
  "configured live refresh token env is not the candidate under test",
);

check(
  !v.includes("console.log(accessToken") &&
    !v.includes("console.log(candidate") &&
    !v.includes("console.log(refreshToken") &&
    !v.includes("console.log(clientSecret") &&
    !v.includes(".slice(0") &&
    !v.includes("token.length") &&
    !v.includes("substring(0"),
  "no secret / token / prefix / length logging",
);

check(
  v.includes('grant_type: "refresh_token"') &&
    v.includes("oauth2.googleapis.com/token") &&
    v.includes("method: \"POST\""),
  "refresh-token flow exists",
);
check(v.includes("oauth2.googleapis.com/tokeninfo"), "tokeninfo exists");
check(
  v.includes("https://www.googleapis.com/auth/gmail.readonly") &&
    v.includes("https://www.googleapis.com/auth/calendar.readonly") &&
    v.includes("https://www.googleapis.com/auth/gmail.send"),
  "required three scopes checked",
);
check(
  v.includes("gmail.modify") &&
    v.includes("gmail.compose") &&
    v.includes("mail.google.com") &&
    v.includes("UNEXPECTED_BROAD_SCOPE"),
  "broad Gmail scopes rejected",
);
check(
  v.includes("/gmail/v1/users/me/profile") &&
    v.includes("emailAddress") &&
    v.includes("LEO_GOOGLE_ACCOUNT_EMAIL") &&
    v.includes("OWNER_IDENTITY"),
  "owner identity checked",
);
check(
  v.includes("users/me/messages?maxResults=1") && v.includes("GMAIL_READ"),
  "Gmail read smoke exists",
);
check(
  v.includes("calendars/primary/events") &&
    v.includes("maxResults=1") &&
    v.includes("CALENDAR_READ"),
  "Calendar read smoke exists",
);
check(
  !v.includes("/gmail/v1/users/me/messages/send") &&
    !v.includes("users.messages.send"),
  "no Gmail messages.send transport",
);
check(
  !v.includes("events.insert") &&
    !v.includes("events.patch") &&
    !v.includes("events.update") &&
    !v.includes("events.delete") &&
    !v.includes("messages.modify") &&
    !v.includes("messages.trash") &&
    !v.includes("drafts"),
  "no Gmail/Calendar mutation",
);
check(!v.includes("api.vercel.com") && !v.includes("vercel env"), "no Vercel API");
check(!v.includes("process.env.LEO_GOOGLE_REFRESH_TOKEN ="), "no env mutation");
check(!v.includes("supabase") && !v.includes("SUPABASE"), "no Supabase");
check(v.includes("CANDIDATE_TOKEN_VALID"), "final validation result printed");

check(
  docs.includes("LEO_GOOGLE_CANDIDATE_REFRESH_TOKEN") &&
    docs.includes("CANDIDATE_TOKEN_VALID") &&
    docs.includes("Never paste") &&
    docs.includes("LEO_GOOGLE_REFRESH_TOKEN"),
  "docs describe candidate-then-Preview sequence",
);

check(
  !process.env.LEO_GMAIL_REPLY_WRITE_ENABLED ||
    process.env.LEO_GMAIL_REPLY_WRITE_ENABLED.trim().toLowerCase() !== "true",
  "write flag remains OFF in this process",
);

const elapsedMs = Date.now() - started;
if (failures > 0) {
  console.error(`\nLEO-21E.2B verifier FAILED (${failures}) in ${elapsedMs}ms`);
  process.exit(1);
}
console.log(`\nLEO-21E.2B verifier PASSED in ${elapsedMs}ms`);
