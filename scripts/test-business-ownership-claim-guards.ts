/**
 * Systemic Repair Build — targeted runtime unit tests for the token/hash primitives (real,
 * executable logic — not source-text scanning like the verify-*.ts scripts).
 *
 * app/lib/business/ownership/tokens.ts is marked `import "server-only"`, which throws
 * unconditionally outside a Next.js server build (see node_modules/server-only/index.js) — so it
 * cannot be imported directly from a plain tsx script. This test loads the file's real source,
 * strips only that one marker line, and imports the byte-identical remainder from a scratch copy —
 * the actual generateClaimToken/hashClaimToken logic under test is never duplicated or reimplemented.
 *
 * The bootstrap-denial / incomplete-identity-denial / real-staff-success decision logic inside
 * toStaffWriteActor() (app/admin/_lib/businessWorkspaceAccess.ts) pulls in next/headers and other
 * Next.js-only modules transitively, so it is not runtime-importable here either — it is instead
 * verified executably-equivalent via exact source-body extraction + assertion in
 * scripts/verify-business-concierge-actor-safety-01.ts ("toStaffWriteActor denies owner_bootstrap
 * and any staff actor missing rosterId/authUserId").
 *
 * The claim lifecycle itself (happy path / expired / wrong-email / double-redemption) lives inside
 * accept_business_ownership_claim(), a plpgsql function with no local Postgres available in this
 * sandbox to execute it against — those four scenarios are instead verified structurally, statement
 * by statement, in scripts/verify-business-ownership-claim-01.ts (checks: FOR UPDATE row lock,
 * claim_not_pending, claim_expired, claim_email_mismatch, business_already_owned, and the atomic
 * accepted-fields / revoked-fields CHECK constraints that make a race impossible to observe as a
 * partial write).
 *
 * Run from repo root: npx tsx scripts/test-business-ownership-claim-guards.ts
 */
import { strict as assert } from "node:assert";
import { readFileSync, writeFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";

let passed = 0;
function check(name: string, fn: () => void): void {
  try {
    fn();
    passed += 1;
    console.log(`  PASS  ${name}`);
  } catch (e) {
    console.error(`  FAIL  ${name}`);
    console.error(e);
    process.exitCode = 1;
  }
}

console.log("Owner Claim / Handoff — token/hash targeted runtime unit tests\n");

const ROOT = path.resolve(__dirname, "..");
const tokensSource = readFileSync(path.join(ROOT, "app/lib/business/ownership/tokens.ts"), "utf8");
const strippedSource = tokensSource.replace(/^import "server-only";\n/, "");
assert.notEqual(strippedSource, tokensSource, "expected to find and strip exactly one `import \"server-only\";` line");

const scratchDir = mkdtempSync(path.join(tmpdir(), "ownership-claim-tokens-test-"));
const scratchFile = path.join(scratchDir, "tokens.ts");
writeFileSync(scratchFile, strippedSource, "utf8");

async function loadTokensModule() {
  return import(pathToFileURL(scratchFile).href);
}

async function main() {
  const { generateClaimToken, hashClaimToken } = await loadTokensModule();

  check("generateClaimToken: produces a 256-bit (32-byte) base64url token, different every call", () => {
    const a = generateClaimToken();
    const b = generateClaimToken();
    assert.notEqual(a, b, "two calls must never produce the same token");
    const decoded = Buffer.from(a, "base64url");
    assert.equal(decoded.length, 32, `expected 32 raw bytes, got ${decoded.length}`);
    assert.ok(!/[+/=]/.test(a), "base64url must not contain +, /, or = padding characters");
  });

  check("hashClaimToken: deterministic SHA-256 hex digest, same input -> same output", () => {
    const token = generateClaimToken();
    const h1 = hashClaimToken(token);
    const h2 = hashClaimToken(token);
    assert.equal(h1, h2, "hashing the same token twice must produce the same hash");
    assert.match(h1, /^[0-9a-f]{64}$/, "expected a 64-char lowercase hex SHA-256 digest");
  });

  check("hashClaimToken: different tokens hash to different digests (no accidental collision in this small sample)", () => {
    const hashes = new Set(Array.from({ length: 20 }, () => hashClaimToken(generateClaimToken())));
    assert.equal(hashes.size, 20, "expected 20 distinct hashes for 20 distinct tokens");
  });

  check("hashClaimToken: trims whitespace before hashing, so a copy-paste with trailing whitespace still redeems correctly", () => {
    const token = generateClaimToken();
    assert.equal(hashClaimToken(token), hashClaimToken(`  ${token}  `));
  });

  console.log(`\n${passed} check(s) passed.`);
  if (process.exitCode) {
    console.error("\nSome checks FAILED.");
  } else {
    console.log("\nAll checks passed.");
  }
}

void main();
