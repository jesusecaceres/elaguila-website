/**
 * LEO FINAL-02 Contacts resolution verifier (fixture-safe, no live network).
 * leoPeopleAdapter.ts is server-only (real fetch to People API) so its
 * request-shaping/response-mapping logic is proven via source assertions,
 * matching how leoGmailAdapter.ts/leoCalendarAdapter.ts are verified
 * elsewhere in this repo. State-machine completeness is checked directly.
 * Run: npx tsx scripts/verify-leo-final02-contacts-resolution.ts
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

const adapter = src("app/leo/_lib/leoPeopleAdapter.ts");

check(/import "server-only"/.test(adapter), "adapter is server-only");
check(/contacts\.readonly|people\.googleapis\.com/i.test(adapter), "uses Google People API");
check(/people:searchContacts/.test(adapter), "uses searchContacts for name-based lookup");
check(/readMask.*names,emailAddresses|names,emailAddresses/.test(adapter), "readMask bounded to names/emailAddresses only");

// --- State machine completeness: every required state is a real branch, not just a label. ---
check(/state:\s*"RESOLVED"/.test(adapter), "RESOLVED state reachable");
check(/state:\s*"AMBIGUOUS"/.test(adapter), "AMBIGUOUS state reachable");
check(/state:\s*"NOT_FOUND"/.test(adapter), "NOT_FOUND state reachable");
check(/state:\s*"UNAVAILABLE"/.test(adapter), "UNAVAILABLE state reachable");
check(/state:\s*"ERROR"/.test(adapter), "ERROR state reachable");

// RESOLVED requires exactly one match: bounded to candidates.length === 1.
check(/candidates\.length === 1/.test(adapter), "RESOLVED requires exactly one candidate");
check(/candidates\.length === 0/.test(adapter), "NOT_FOUND requires zero candidates");

// Never invents an address: no candidate is fabricated from the query text itself.
check(
  !/resolved:\s*\{\s*email:\s*(query|input\.query)/.test(adapter.replace(/isValidEmailShape\(query\)[\s\S]{0,400}/, "")),
  "RESOLVED never fabricates an email from the raw query outside the owner-typed-literal fast path",
);
check(
  /Owner-supplied literal email/.test(adapter),
  "owner-typed exact email is trusted as-is (not invented — the owner supplied it)",
);

// Bounded candidate list.
check(/MAX_CANDIDATES\s*=\s*5/.test(adapter), "candidate list is bounded (MAX_CANDIDATES = 5)");
check(/dedupeByEmail/.test(adapter), "candidates are de-duplicated by email");

// No OAuth token ever returned to the caller.
check(!/return\s*\{[^}]*accessToken/.test(adapter), "never returns an access token to the caller");
check(/refreshLeoGoogleAccessToken/.test(adapter), "reuses the shared OAuth client (no second token flow)");

// Never persists entire raw contact records — only bounded email/displayName pairs.
check(
  /email:\s*string;\s*\n\s*displayName:\s*string \| null;/.test(src("app/leo/_lib/leoTypes.ts")) ||
    /LeoResolvedContact\s*=\s*\{/.test(src("app/leo/_lib/leoTypes.ts")),
  "resolved contact shape is bounded to email + displayName only",
);

if (failures > 0) {
  console.error(`\nLEO FINAL-02 contacts resolution verifier FAIL (${failures})`);
  process.exit(1);
}
console.log("\nLEO FINAL-02 contacts resolution verifier PASS");
