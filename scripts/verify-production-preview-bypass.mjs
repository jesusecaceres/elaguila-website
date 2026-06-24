/**
 * SITE-PREVIEW-BYPASS-01 verification.
 * Run: npm run verify:production-preview-bypass
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

function read(rel) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

function exists(rel) {
  return fs.existsSync(path.join(root, rel));
}

function fail(msg) {
  console.error(`verify-production-preview-bypass: FAIL — ${msg}`);
  process.exit(1);
}

function ok(msg) {
  console.log(`OK: ${msg}`);
}

const unlockRoute = read("app/api/preview/unlock/route.ts");
const lockRoute = read("app/api/preview/lock/route.ts");
const previewBypass = read("app/lib/launchLock/previewBypass.ts");
const middleware = read("middleware.ts");
const gateRoot = read("app/components/ComingSoonGateRoot.tsx");
const packageJson = read("package.json");
const docs = read("docs/production-preview-bypass.md");

const SUSPICIOUS_SECRET_PATTERNS = [
  /LEONIX_PREVIEW_BYPASS_TOKEN\s*=\s*["'][^"']+["']/,
  /token\s*=\s*["'][a-zA-Z0-9]{16,}["']/i,
];

// 1. Unlock route exists
if (!exists("app/api/preview/unlock/route.ts")) {
  fail("unlock route missing");
}
ok("unlock route exists");

// 2. Lock route exists
if (!exists("app/api/preview/lock/route.ts")) {
  fail("lock route missing");
}
ok("lock route exists");

// 3. LEONIX_PREVIEW_BYPASS_TOKEN referenced server-side
if (!previewBypass.includes("LEONIX_PREVIEW_BYPASS_TOKEN")) {
  fail("LEONIX_PREVIEW_BYPASS_TOKEN not referenced in previewBypass.ts");
}
if (!unlockRoute.includes("getPreviewBypassToken")) {
  fail("unlock route must use getPreviewBypassToken");
}
ok("LEONIX_PREVIEW_BYPASS_TOKEN referenced server-side");

// 4. Unlock rejects missing/invalid token
if (!unlockRoute.includes("401")) fail("unlock must return 401 on failure");
if (!unlockRoute.includes("isValidPreviewBypassToken")) {
  fail("unlock must validate token with isValidPreviewBypassToken");
}
if (!previewBypass.includes("if (!expected) return false")) {
  fail("preview bypass must fail closed when env token missing");
}
ok("unlock rejects missing/invalid token");

// 5–10. Cookie settings
if (!unlockRoute.includes("leonix_preview_access") && !unlockRoute.includes("LEONIX_PREVIEW_ACCESS_COOKIE")) {
  fail("unlock must set leonix_preview_access cookie");
}
if (!previewBypass.includes("httpOnly: true")) fail("cookie must be httpOnly");
if (!previewBypass.includes('secure: process.env.NODE_ENV === "production"')) {
  fail("cookie must use secure in production");
}
if (!previewBypass.includes('sameSite: "lax"')) fail("cookie must use sameSite lax");
if (!previewBypass.includes('path: "/"')) fail("cookie must use path /");
if (!previewBypass.includes("60 * 60 * 24 * 30")) {
  fail("cookie must use 30-day max age");
}
ok("unlock sets leonix_preview_access with httpOnly, secure (prod), sameSite lax, path /, 30-day maxAge");

// 11. Lock clears cookie
if (!lockRoute.includes("leonix_preview_access") && !lockRoute.includes("LEONIX_PREVIEW_ACCESS_COOKIE")) {
  fail("lock must reference preview cookie");
}
if (!lockRoute.includes("maxAge: 0")) fail("lock must clear cookie with maxAge 0");
ok("lock route clears preview cookie");

// 12. Coming Soon lock checks preview cookie
if (!middleware.includes("hasPreviewBypassCookie")) {
  fail("middleware must check preview bypass cookie");
}
ok("Coming Soon lock checks preview cookie in middleware");

// 13. Existing admin/staff auth preserved
if (!middleware.includes('req.cookies.get(ADMIN_COOKIE)?.value === "1"')) {
  fail("middleware must preserve leonix_admin bypass");
}
if (!gateRoot.includes("requireAdminCookie")) {
  fail("ComingSoonGateRoot must preserve requireAdminCookie bypass");
}
ok("existing admin/staff auth behavior preserved");

// 14. Secret not hardcoded
const scanFiles = [
  "app/api/preview/unlock/route.ts",
  "app/api/preview/lock/route.ts",
  "app/lib/launchLock/previewBypass.ts",
  "middleware.ts",
  "app/components/ComingSoonGateRoot.tsx",
];
for (const rel of scanFiles) {
  const content = read(rel);
  for (const pattern of SUSPICIOUS_SECRET_PATTERNS) {
    if (pattern.test(content)) fail(`possible hardcoded secret in ${rel}`);
  }
}
ok("secret is not hardcoded in implementation files");

// 15. No public unlock button
const publicDirs = ["app/(site)", "app/components"];
const unlockButtonPatterns = [
  /\/api\/preview\/unlock/i,
  /preview\/unlock/i,
  /unlock production/i,
  /desbloquear preview/i,
];
for (const dir of publicDirs) {
  const abs = path.join(root, dir);
  if (!exists(dir)) continue;
  walk(abs, (file) => {
    if (!/\.(tsx|jsx|ts|js)$/.test(file)) return;
    if (file.includes("app/api/preview")) return;
    const rel = path.relative(root, file).replace(/\\/g, "/");
    const content = fs.readFileSync(file, "utf8");
    for (const pattern of unlockButtonPatterns) {
      if (pattern.test(content)) fail(`public unlock reference in ${rel}`);
    }
  });
}
ok("no public unlock button or client unlock URL");

// 16. Docs exist
if (!exists("docs/production-preview-bypass.md")) fail("docs missing");
if (!docs.includes("LEONIX_PREVIEW_BYPASS_TOKEN")) fail("docs must mention env var");
if (!docs.includes("/api/preview/unlock")) fail("docs must document unlock URL");
if (!docs.includes("/api/preview/lock")) fail("docs must document lock URL");
ok("docs exist");

// 17. No public page content changed (spot-check: no unlock UI in coming soon)
const comingSoonPaths = [
  "app/(site)/coming-soon-v2",
  "app/(site)/coming-soon",
];
for (const p of comingSoonPaths) {
  if (!exists(p)) continue;
  walk(path.join(root, p), (file) => {
    if (!/\.(tsx|jsx)$/.test(file)) return;
    const content = fs.readFileSync(file, "utf8");
    if (/\/api\/preview\/unlock/i.test(content)) {
      fail(`coming soon page references unlock: ${path.relative(root, file)}`);
    }
  });
}
ok("no public page content changed for unlock");

// 18. No schema/migration changes in this task scope
const migrationDir = path.join(root, "supabase/migrations");
if (exists(migrationDir)) {
  const recent = fs
    .readdirSync(migrationDir)
    .filter((f) => f.includes("preview_bypass") || f.includes("preview-access"));
  if (recent.length > 0) fail("unexpected preview bypass migration");
}
ok("no schema/migration changes");

// 19. No Stripe/payment changes
const stripeTouch = [
  "app/api/preview/unlock/route.ts",
  "app/api/preview/lock/route.ts",
  "app/lib/launchLock/previewBypass.ts",
  "middleware.ts",
].some((rel) => read(rel).toLowerCase().includes("stripe"));
if (stripeTouch) fail("preview bypass files must not touch Stripe");
ok("no Stripe/payment changes");

// Package script
if (!packageJson.includes('"verify:production-preview-bypass"')) {
  fail("package.json missing verify:production-preview-bypass script");
}
ok("package script registered");

// Safe next redirect
if (!previewBypass.includes("safeInternalNextPath")) {
  fail("must support safe internal next redirect");
}
if (!unlockRoute.includes("safeInternalNextPath")) {
  fail("unlock route must use safeInternalNextPath");
}
ok("safe internal next redirect supported");

function walk(dir, fn) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === ".next") continue;
      walk(full, fn);
    } else {
      fn(full);
    }
  }
}

console.log("\nverify-production-preview-bypass: all checks passed");
