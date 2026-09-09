/**
 * Systemic Repair Build — actor-safety regression guard. Same hand-rolled node:assert convention
 * as every other verify-*.ts script in this repo. Structural/source-level proof only.
 *
 * Locked PM policy this guard protects: owner_bootstrap must NEVER perform a Business Concierge
 * write — not by fabricating a staff roster row, and not by remapping to a fake "owner" actor
 * either. The only way to obtain a writable staff actor is requireStaffWorkspaceWriteAccess() (the
 * common single/either-of capability case) or toStaffWriteActor() (multi-branch capability logic
 * that converts once, right before the write) — both exported from
 * app/admin/_lib/businessWorkspaceAccess.ts. Every other construction of a `{ type: "staff", ... }`
 * actor object on the admin surface, and every one of the retired module-specific staffActorTo-
 * or salesActorTo- prefixed mappers, is forbidden.
 *
 * Run from repo root: npx tsx scripts/verify-business-concierge-actor-safety-01.ts
 */
import { strict as assert } from "node:assert";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import path from "node:path";

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

console.log("Business Concierge — Actor Safety regression guard\n");

const ROOT = path.resolve(__dirname, "..");
function read(relPath: string): string {
  return readFileSync(path.join(ROOT, relPath), "utf8");
}

function listRouteFilesRecursive(relDir: string): string[] {
  const absDir = path.join(ROOT, relDir);
  if (!existsSync(absDir)) return [];
  const out: string[] = [];
  for (const entry of readdirSync(absDir, { withFileTypes: true })) {
    const relChild = path.posix.join(relDir.replace(/\\/g, "/"), entry.name);
    if (entry.isDirectory()) {
      out.push(...listRouteFilesRecursive(relChild));
    } else if (entry.name === "route.ts") {
      out.push(relChild);
    }
  }
  return out;
}

const ADMIN_BUSINESS_ROUTE_DIRS = ["app/api/admin/businesses", "app/api/admin/field-discovery"];
const routeFiles = ADMIN_BUSINESS_ROUTE_DIRS.flatMap(listRouteFilesRecursive);

check("Sanity: found a substantial number of admin Business Concierge route files to scan (guards against a silent path typo making every check below vacuously pass)", () => {
  assert.ok(routeFiles.length >= 30, `expected at least 30 route.ts files under ${ADMIN_BUSINESS_ROUTE_DIRS.join(", ")}, found ${routeFiles.length}`);
});

const OBSOLETE_MAPPER_PATTERN = /\b(staffActorTo\w+Actor|salesActorTo(Creative|Opportunity|Advisor|Assistant|LivingBook)Actor)\s*\(/;
const INLINE_STAFF_LITERAL_PATTERN = /\{\s*type:\s*["']staff["']/;
const CANONICAL_GUARD_PATTERN = /\b(requireStaffWorkspaceWriteAccess|toStaffWriteActor)\b/;
const WRITE_METHOD_EXPORT_PATTERN = /export\s+async\s+function\s+(POST|PATCH|PUT|DELETE)\s*\(/g;

for (const relPath of routeFiles) {
  const text = read(relPath);

  check(`${relPath}: no obsolete staffActorTo*/salesActorTo* remapper call`, () => {
    assert.ok(!OBSOLETE_MAPPER_PATTERN.test(text), `found an obsolete actor-mapper call in ${relPath}`);
  });

  check(`${relPath}: no inline { type: "staff", ... } actor construction`, () => {
    assert.ok(!INLINE_STAFF_LITERAL_PATTERN.test(text), `found an inline staff-actor literal in ${relPath} — must go through requireStaffWorkspaceWriteAccess()/toStaffWriteActor() instead`);
  });

  const writeMethods = [...text.matchAll(WRITE_METHOD_EXPORT_PATTERN)].map((m) => m[1]);
  if (writeMethods.length > 0) {
    check(`${relPath}: exports a write handler (${writeMethods.join("/")}) and references the canonical staff-write guard`, () => {
      assert.ok(CANONICAL_GUARD_PATTERN.test(text), `${relPath} exports ${writeMethods.join("/")} but never calls requireStaffWorkspaceWriteAccess() or toStaffWriteActor()`);
    });
  }
}

// --- The obsolete per-module mapper files must be deleted, not just unused -------------------------
const OBSOLETE_MAPPER_FILES = [
  "app/admin/_lib/fieldDiscoveryActor.ts",
  "app/admin/_lib/healthMapActor.ts",
  "app/admin/_lib/diyConciergeActor.ts",
  "app/admin/_lib/stewardshipActor.ts",
  "app/admin/_lib/livingBookActor.ts",
];
for (const relPath of OBSOLETE_MAPPER_FILES) {
  check(`${relPath} has been deleted (not kept as a dead/unused alias)`, () => {
    assert.ok(!existsSync(path.join(ROOT, relPath)), `${relPath} still exists — the module-specific actor mapper must be removed entirely, not left dangling`);
  });
}

// --- The canonical guard module itself --------------------------------------------------------------
const accessText = read("app/admin/_lib/businessWorkspaceAccess.ts");
check("businessWorkspaceAccess.ts exports requireStaffWorkspaceWriteAccess and toStaffWriteActor", () => {
  assert.ok(accessText.includes("export async function requireStaffWorkspaceWriteAccess"));
  assert.ok(accessText.includes("export function toStaffWriteActor"));
});
check("toStaffWriteActor denies owner_bootstrap and any staff actor missing rosterId/authUserId — never maps bootstrap to a fake staff or owner shape", () => {
  const bodyMatch = accessText.match(/export function toStaffWriteActor\(actor: StrictSalesActor\): StaffWorkspaceWriteAccessResult \{([\s\S]*?)\n\}/);
  assert.ok(bodyMatch, "toStaffWriteActor body not found");
  const body = bodyMatch![1];
  assert.ok(/isOwnerBootstrapActor\(actor\)/.test(body), "must check isOwnerBootstrapActor");
  assert.ok(/!actor\.rosterId/.test(body) && /!actor\.authUserId/.test(body), "must require both rosterId and authUserId");
  assert.ok(!/type:\s*["']owner["']/.test(body), "must never construct a type:\"owner\" fallback for bootstrap");
});
check("The four retired bootstrap-to-owner mapper functions no longer exist as callable exports", () => {
  for (const fn of ["salesActorToCreativeActor", "salesActorToOpportunityActor", "salesActorToAdvisorActor", "salesActorToAssistantActor"]) {
    assert.ok(!new RegExp(`export function ${fn}\\(`).test(accessText), `${fn} must be removed, not just left unused`);
  }
});
check("actorHasCapability accepts any actor shape carrying a capabilities set (works for both StrictSalesActor and StaffWriteActor) rather than being narrowly typed to one", () => {
  assert.ok(/export function actorHasCapability\(actor: \{ capabilities: ReadonlySet<SalesWorkspaceCapability> \}/.test(accessText));
});

// --- businessWorkspaceData.ts: the two previously-unguarded write paths --------------------------
const dataText = read("app/admin/_lib/businessWorkspaceData.ts");
check("getOrCreateSalesProfile never performs the create half under owner_bootstrap or an incomplete staff identity", () => {
  const fnMatch = dataText.match(/export async function getOrCreateSalesProfile\([\s\S]*?\n\}/);
  assert.ok(fnMatch, "getOrCreateSalesProfile not found");
  assert.ok(/actor\.actorType === "owner_bootstrap" \|\| !actor\.rosterId \|\| !actor\.authUserId/.test(fnMatch![0]));
});
check("updateSalesStatus/createSalesNote/upsertCurrentFollowUp/completeFollowUp/markFollowUpStatus require a StaffWriteActor (real staff, already guarded) rather than a bare StrictSalesActor", () => {
  for (const fn of ["updateSalesStatus", "createSalesNote", "upsertCurrentFollowUp", "completeFollowUp", "markFollowUpStatus"]) {
    const re = new RegExp(`export async function ${fn}\\([^)]*actor: StaffWriteActor`);
    assert.ok(re.test(dataText.replace(/\n/g, " ")), `${fn} must take actor: StaffWriteActor`);
  }
});

// --- No production reference, no real credential ----------------------------------------------------
check("No file scanned references a real Supabase project ref or an obvious secret", () => {
  const secretPattern = /sk_live|sk_test_[a-zA-Z0-9]{10}|AKIA[0-9A-Z]{16}|-----BEGIN (RSA|EC|OPENSSH) PRIVATE KEY-----/i;
  for (const relPath of [...routeFiles, "app/admin/_lib/businessWorkspaceAccess.ts", "app/admin/_lib/businessWorkspaceData.ts"]) {
    const text = read(relPath);
    assert.ok(!text.includes("xuieateniufcrsfdomwl"), `${relPath} references a real production project ref`);
    assert.ok(!secretPattern.test(text), `${relPath} contains what looks like a real credential`);
  }
});

console.log(`\n${passed} check(s) passed.`);
if (process.exitCode) {
  console.error("\nSome checks FAILED.");
} else {
  console.log("\nAll checks passed.");
}
