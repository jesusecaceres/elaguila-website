/**
 * Business Concierge — Real-Admin-Resolves-To-Staff-Write-Actor investigation + UI error-quality
 * repair verifier.
 *
 * Root-cause finding (this pass did NOT touch businessWorkspaceAccess.ts — the resolver itself is
 * correct and was not the bug): a real owner/admin browser session that signs in via the "Owner
 * bootstrap (shared password)" form (app/admin/login/submit/route.ts) is, BY DESIGN, an
 * actorType "owner_bootstrap" — and owner_bootstrap has never been allowed to perform a Business
 * Concierge write (toStaffWriteActor -> bootstrap_write_denied). That denial was working exactly
 * as documented; it is not a resolver precedence bug. The actual defect closed by this pass is
 * that the raw internal denial code was leaking verbatim into staff-facing UI error text instead
 * of a human-readable message — this verifier proves that repair, and re-confirms (without
 * weakening anything) that the resolver's security properties are unchanged.
 *
 * The separate, real, DATA problem (no admin_team_members roster row exists for the actual owner,
 * linked to a real Supabase Auth user, in Staging — and almost certainly the same in Production)
 * is reported by this pass as OWNER DATA LINKAGE REPAIR REQUIRED, not silently fixed by writing
 * to Production identity tables.
 *
 * Run from repo root: npx tsx scripts/verify-real-admin-staff-write-repair-01.ts
 */
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
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

console.log("Real-Admin Staff-Write-Actor Repair — targeted checks\n");

function read(relPath: string): string {
  return readFileSync(path.resolve(__dirname, "..", relPath), "utf8");
}

const accessLib = read("app/admin/_lib/businessWorkspaceAccess.ts");
const humanizer = read("app/admin/_lib/staffWriteErrorMessages.ts");
const canvassRoute = read("app/api/admin/businesses/canvass/route.ts");

// --- A/B/D. Security model unchanged — the doctrine that matters was NOT weakened -------------
check("A. toStaffWriteActor still denies owner_bootstrap with bootstrap_write_denied (unchanged)", () => {
  const idx = accessLib.indexOf("export function toStaffWriteActor");
  const block = accessLib.slice(idx, idx + 600);
  assert.ok(/if \(isOwnerBootstrapActor\(actor\)\)/.test(block));
  assert.ok(/reason: "bootstrap_write_denied"/.test(block));
});
check("B. toStaffWriteActor still denies incomplete identity with staff_identity_incomplete (unchanged)", () => {
  const idx = accessLib.indexOf("export function toStaffWriteActor");
  const block = accessLib.slice(idx, idx + 600);
  assert.ok(/if \(!actor\.rosterId \|\| !actor\.authUserId\)/.test(block));
  assert.ok(/reason: "staff_identity_incomplete"/.test(block));
});
check("D. A writable staff actor still carries the real roster id (admin_team_members.id), never a synthetic UUID", () => {
  const idx = accessLib.indexOf("export function toStaffWriteActor");
  const block = accessLib.slice(idx, idx + 600);
  assert.ok(/rosterId: actor\.rosterId/.test(block));
  assert.ok(!/rosterId: ["']00000000/.test(block));
});
check("No bypass, special-case, or unsafe owner override was added to the resolver in this pass", () => {
  assert.ok(!/isOwnerBootstrapActor\(actor\)\s*\)\s*return\s*\{\s*ok:\s*true/.test(accessLib));
  // "bypass" legitimately appears in this file's own doctrine comments describing what NOT to do
  // (e.g. "both are attribution bypasses, not safety measures") — only fail on an actual bypass
  // being introduced as code, not the word appearing in prose.
  assert.ok(!/function\s+\w*[Bb]ypass/.test(accessLib));
  assert.ok(!/skipBootstrapCheck|allowBootstrapWrite|bootstrapOverride/i.test(accessLib));
});

// --- C. Real staff actor path is unchanged and still capability-gated --------------------------
check("C. requireStaffWorkspaceWriteAccess still resolves a real staff actor and checks capabilities before allowing", () => {
  const idx = accessLib.indexOf("export async function requireStaffWorkspaceWriteAccess");
  const block = accessLib.slice(idx, idx + 700);
  assert.ok(block.includes("capabilitiesForRole") || block.includes("actorHasCapability"));
  assert.ok(block.includes("toStaffWriteActor(access.actor)"));
});

// --- E. Canvas / Add Prospect uses the same hardened resolver -----------------------------------
check("E. Canvas/Add Prospect save route uses the canonical requireStaffWorkspaceWriteAccess (no ad-hoc bootstrap logic)", () => {
  assert.ok(canvassRoute.includes('requireStaffWorkspaceWriteAccess("conduct_canvassing")'));
  assert.ok(!/isAdminBootstrapSession/.test(canvassRoute));
});

// --- Humanizer module itself ---------------------------------------------------------------
check("Humanizer maps bootstrap_write_denied to a human-readable, non-raw message", () => {
  assert.ok(humanizer.includes("bootstrap_write_denied:"));
  const idx = humanizer.indexOf("bootstrap_write_denied:");
  const line = humanizer.slice(idx, idx + 400);
  assert.ok(!/^\s*bootstrap_write_denied:\s*"bootstrap_write_denied"/.test(line));
});
check("Humanizer falls back to the caller's own message for an unrecognized code (never invents new raw passthrough)", () => {
  assert.ok(/return STAFF_WRITE_ERROR_MESSAGES\[code\] \?\? fallback/.test(humanizer));
});

// --- UI call sites: every identified write-error display now routes through the humanizer ------
const uiFiles: readonly [string, string][] = [
  ["CanvassForm.tsx", "app/admin/(dashboard)/businesses/canvass/CanvassForm.tsx"],
  ["BusinessWorkspaceActions.tsx", "app/admin/(dashboard)/businesses/[businessId]/BusinessWorkspaceActions.tsx"],
  ["FieldDiscoveryActions.tsx", "app/admin/(dashboard)/businesses/[businessId]/FieldDiscoveryActions.tsx"],
  ["AdvisorPanel.tsx", "app/admin/(dashboard)/businesses/[businessId]/AdvisorPanel.tsx"],
  ["CreativeStudioActions.tsx", "app/admin/(dashboard)/businesses/[businessId]/CreativeStudioActions.tsx"],
  ["MeetingStudioActions.tsx", "app/admin/(dashboard)/businesses/[businessId]/MeetingStudioActions.tsx"],
  ["OpportunityActions.tsx", "app/admin/(dashboard)/businesses/[businessId]/OpportunityActions.tsx"],
  ["OwnershipClaimPanel.tsx", "app/admin/(dashboard)/businesses/[businessId]/OwnershipClaimPanel.tsx"],
  ["ProposalActions.tsx", "app/admin/(dashboard)/businesses/[businessId]/ProposalActions.tsx"],
  ["StewardshipActions.tsx", "app/admin/(dashboard)/businesses/[businessId]/StewardshipActions.tsx"],
  ["FieldAgentDictationSection.tsx", "app/admin/field/[businessId]/FieldAgentDictationSection.tsx"],
  ["FieldAgentComponents.tsx", "app/admin/field/FieldAgentComponents.tsx"],
];

for (const [label, relPath] of uiFiles) {
  check(`${label} imports the shared humanizeStaffWriteError helper`, () => {
    const source = read(relPath);
    assert.ok(/from "@\/app\/admin\/_lib\/staffWriteErrorMessages"/.test(source), `${relPath} does not import the humanizer`);
    assert.ok(/humanizeStaffWriteError/.test(source));
  });
}

check("CanvassForm.tsx no longer template-interpolates the raw error code into the message", () => {
  const source = read("app/admin/(dashboard)/businesses/canvass/CanvassForm.tsx");
  assert.ok(!/No se pudo guardar: \$\{body\.error\}/.test(source));
});
check("BusinessWorkspaceActions.tsx no longer passes the raw code straight into setError via String(body?.error ?? ...)", () => {
  const source = read("app/admin/(dashboard)/businesses/[businessId]/BusinessWorkspaceActions.tsx");
  assert.ok(!/setError\(String\(body\?\.error/.test(source));
});
check("ProposalActions.tsx's dead owner_bootstrap_cannot_write_follow_ups string check was removed in favor of the real code path", () => {
  const source = read("app/admin/(dashboard)/businesses/[businessId]/ProposalActions.tsx");
  assert.ok(!/data\.error === "owner_bootstrap_cannot_write_follow_ups"/.test(source));
});
check("Every readApiError() helper (5 local implementations) now delegates to the shared humanizer instead of raw-passing data.error", () => {
  for (const [, relPath] of uiFiles) {
    const source = read(relPath);
    const idx = source.indexOf("function readApiError");
    if (idx === -1) continue;
    const block = source.slice(idx, idx + 300);
    assert.ok(!/data\.error \? data\.error/.test(block), `${relPath} readApiError still raw-passes data.error`);
  }
});

console.log(`\n${passed} check(s) passed.`);
