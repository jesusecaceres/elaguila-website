/**
 * Staging Release Blocker Hardening — targeted runtime unit tests for the signed bootstrap
 * session token (real, executable logic — not source-text scanning like the verify-*.ts
 * scripts).
 *
 * app/lib/supabase/adminSession.ts is marked `import "server-only";`, which throws
 * unconditionally outside a Next.js server build (see node_modules/server-only/index.js), and it
 * imports `@/app/lib/supabase/server` via the `@/` path alias, which plain tsx does not resolve.
 * This test loads the file's real source, strips only the server-only marker line, rewrites the
 * `@/app/lib/supabase/server` specifier to an absolute file:// URL pointing at the real file (no
 * further changes needed there — it has no `server-only` marker of its own), and imports the
 * byte-identical remainder from a scratch copy. The actual isAdminBootstrapSession /
 * createBootstrapSessionToken logic under test is never duplicated or reimplemented.
 *
 * Run from repo root: npx tsx scripts/test-admin-bootstrap-session-security.ts
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

console.log("Bootstrap Session Security — targeted runtime unit tests\n");

const ROOT = path.resolve(__dirname, "..");
const adminSessionSource = readFileSync(path.join(ROOT, "app/lib/supabase/adminSession.ts"), "utf8");
const serverModuleUrl = pathToFileURL(path.join(ROOT, "app/lib/supabase/server.ts")).href;

let scratchSource = adminSessionSource.replace(/^import "server-only";\r?\n/, "");
assert.notEqual(scratchSource, adminSessionSource, "expected to find and strip exactly one `import \"server-only\";` line");
const beforeAliasRewrite = scratchSource;
scratchSource = scratchSource.replaceAll("@/app/lib/supabase/server", serverModuleUrl);
assert.notEqual(scratchSource, beforeAliasRewrite, "expected to rewrite the @/app/lib/supabase/server import specifier");

const scratchDir = mkdtempSync(path.join(tmpdir(), "admin-bootstrap-session-test-"));
const scratchFile = path.join(scratchDir, "adminSession.ts");
writeFileSync(scratchFile, scratchSource, "utf8");

const TEST_SECRET = "staging-cert-test-secret-do-not-use-in-real-env-0123456789abcdef";

// A minimal CookieStore fake — the same shape adminSession.ts expects (a `.get(name)` returning
// `{ value }` or undefined), matching Next's real `cookies()` return shape closely enough for
// these pure signature/expiry checks (no Supabase call is exercised by any of these paths).
function fakeCookies(values: Record<string, string>) {
  return { get: (name: string) => (name in values ? { value: values[name] } : undefined) };
}

async function main() {
  const mod = await import(pathToFileURL(scratchFile).href);
  const { isAdminBootstrapSession, createBootstrapSessionToken, LEONIX_ADMIN_BOOTSTRAP_COOKIE } = mod;

  const originalSecret = process.env.ADMIN_BOOTSTRAP_SESSION_SECRET;

  // --- 1. Forged legacy cookie value "1" -> unauthorized, even with a real secret configured ---
  check("1. Forged legacy cookie value \"1\" is rejected (never authorizes, secret configured)", () => {
    process.env.ADMIN_BOOTSTRAP_SESSION_SECRET = TEST_SECRET;
    const cookies = fakeCookies({ [LEONIX_ADMIN_BOOTSTRAP_COOKIE]: "1" });
    assert.equal(isAdminBootstrapSession(cookies), false);
  });

  check("1b. Forged legacy cookie value \"1\" is rejected even with NO secret configured (fail closed)", () => {
    delete process.env.ADMIN_BOOTSTRAP_SESSION_SECRET;
    const cookies = fakeCookies({ [LEONIX_ADMIN_BOOTSTRAP_COOKIE]: "1" });
    assert.equal(isAdminBootstrapSession(cookies), false);
  });

  // --- 2. Malformed signed token -> unauthorized ---
  check("2. Malformed token (wrong part count) is rejected", () => {
    process.env.ADMIN_BOOTSTRAP_SESSION_SECRET = TEST_SECRET;
    const cookies = fakeCookies({ [LEONIX_ADMIN_BOOTSTRAP_COOKIE]: "12345.67890" });
    assert.equal(isAdminBootstrapSession(cookies), false);
  });
  check("2b. Well-formed but wrong-signature token is rejected", () => {
    process.env.ADMIN_BOOTSTRAP_SESSION_SECRET = TEST_SECRET;
    const now = Date.now();
    const cookies = fakeCookies({ [LEONIX_ADMIN_BOOTSTRAP_COOKIE]: `${now}.${now + 3600_000}.0000000000000000000000000000000000000000000000000000000000000000` });
    assert.equal(isAdminBootstrapSession(cookies), false);
  });
  check("2c. Valid signature but signed with a DIFFERENT secret is rejected (secret rotation invalidates old sessions)", () => {
    process.env.ADMIN_BOOTSTRAP_SESSION_SECRET = "a-different-secret-entirely";
    const tokenSignedWithOtherSecret = createBootstrapSessionToken();
    process.env.ADMIN_BOOTSTRAP_SESSION_SECRET = TEST_SECRET;
    const cookies = fakeCookies({ [LEONIX_ADMIN_BOOTSTRAP_COOKIE]: tokenSignedWithOtherSecret });
    assert.equal(isAdminBootstrapSession(cookies), false);
  });

  // --- 3. Expired token -> unauthorized ---
  check("3. Expired token is rejected even though its signature is genuinely valid", () => {
    process.env.ADMIN_BOOTSTRAP_SESSION_SECRET = TEST_SECRET;
    const past = Date.now() - 3600_000;
    const expiredToken = createBootstrapSessionToken(past - 1000, past);
    assert.ok(expiredToken, "expected a real token to be constructible");
    const cookies = fakeCookies({ [LEONIX_ADMIN_BOOTSTRAP_COOKIE]: expiredToken });
    assert.equal(isAdminBootstrapSession(cookies), false);
  });
  check("3b. A token issued in the future is rejected", () => {
    process.env.ADMIN_BOOTSTRAP_SESSION_SECRET = TEST_SECRET;
    const future = Date.now() + 3600_000;
    const futureToken = createBootstrapSessionToken(future, future + 3600_000);
    assert.ok(futureToken);
    const cookies = fakeCookies({ [LEONIX_ADMIN_BOOTSTRAP_COOKIE]: futureToken });
    assert.equal(isAdminBootstrapSession(cookies), false);
  });

  // --- 4. Valid bootstrap session -> the session itself verifies ---
  check("4. A freshly created, correctly signed, unexpired token verifies as a valid bootstrap session", () => {
    process.env.ADMIN_BOOTSTRAP_SESSION_SECRET = TEST_SECRET;
    const token = createBootstrapSessionToken();
    assert.ok(token, "expected a real token when the secret is configured");
    const cookies = fakeCookies({ [LEONIX_ADMIN_BOOTSTRAP_COOKIE]: token });
    assert.equal(isAdminBootstrapSession(cookies), true);
  });
  check("4b. createBootstrapSessionToken returns null (fail closed) when the secret is not configured", () => {
    delete process.env.ADMIN_BOOTSTRAP_SESSION_SECRET;
    assert.equal(createBootstrapSessionToken(), null);
  });
  check("4c. No cookie at all -> not a bootstrap session (never throws)", () => {
    process.env.ADMIN_BOOTSTRAP_SESSION_SECRET = TEST_SECRET;
    assert.equal(isAdminBootstrapSession(fakeCookies({})), false);
  });

  if (originalSecret === undefined) delete process.env.ADMIN_BOOTSTRAP_SESSION_SECRET;
  else process.env.ADMIN_BOOTSTRAP_SESSION_SECRET = originalSecret;

  console.log(`\n${passed} check(s) passed.`);
  if (process.exitCode) {
    console.error("\nSome checks FAILED.");
  } else {
    console.log("\nAll checks passed.");
  }
}

void main();
