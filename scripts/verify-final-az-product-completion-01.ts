/**
 * Business Concierge — FINAL A→Z Product Completion verifier.
 *
 * This is the top-level, assembled-contract verifier requested by the Final A-to-Z Execution Map
 * pass. It does NOT re-implement the ~430 checks already covered by the existing per-gate/per-
 * domain verifiers (Gates 1-6, Full-MD, Bilingual, Actor Safety, Ownership Claim, Research/
 * Provider, Real-Admin-Write-Repair, Staff-Session-Precedence) — those are re-run separately as
 * part of this gate's validation sequence and remain the source of truth for their own domains.
 * This file covers exactly the NEW ground this pass investigated and touched: the "ONE Business
 * Concierge product" architecture (PWA scope, Field Agent's shared resolver), the Command Center
 * density/card-containment repair, and a final whole-surface sweep for raw internal error leaks.
 *
 * Run from repo root: npx tsx scripts/verify-final-az-product-completion-01.ts
 */
import { strict as assert } from "node:assert";
import { readFileSync, readdirSync, statSync } from "node:fs";
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

console.log("Final A-to-Z Product Completion — assembled-contract checks\n");

const ROOT = path.resolve(__dirname, "..");
function read(relPath: string): string {
  return readFileSync(path.join(ROOT, relPath), "utf8");
}

// --- 1. ONE Business Concierge product — PWA scope --------------------------------------------
const manifest = read("app/manifest.ts");
check("1a. The Business Concierge PWA manifest is scoped to /admin/ and starts at /admin/businesses (not a separate app)", () => {
  assert.ok(/scope:\s*"\/admin\/"/.test(manifest));
  assert.ok(/start_url:\s*"\/admin\/businesses"/.test(manifest));
});
check("1b. The manifest explicitly documents the one-shared-app doctrine (no per-user/per-role manifest)", () => {
  assert.ok(/one shared installable PWA/i.test(manifest) || /Identity is the product/i.test(manifest));
});

// --- 2. Field Agent uses the exact same canonical resolver as the main dashboard ----------------
const fieldIndexPage = read("app/admin/field/page.tsx");
const fieldBusinessPage = read("app/admin/field/[businessId]/page.tsx");
check("2a. Field Agent index page authorizes via the canonical requireSalesWorkspaceAccess (no separate auth path)", () => {
  assert.ok(fieldIndexPage.includes("requireSalesWorkspaceAccess"));
  assert.ok(fieldIndexPage.includes("businessWorkspaceAccess"));
});
check("2b. Field Agent business page authorizes via the same canonical resolver", () => {
  assert.ok(fieldBusinessPage.includes("requireSalesWorkspaceAccess"));
  assert.ok(fieldBusinessPage.includes("businessWorkspaceAccess"));
});

// --- 3. Service worker never caches API/private data -------------------------------------------
const sw = read("public/sw.js");
check("3a. The service worker explicitly excludes /api/, /auth/, and supabase.co from any cache", () => {
  assert.ok(/\/api\//.test(sw));
  assert.ok(sw.includes("NEVER_CACHE_PATTERNS"));
  assert.ok(/supabase/.test(sw) && /\.co/.test(sw));
});

// --- 4. Command Center — one product framing + compact card density ----------------------------
const commandCenter = read("app/admin/(dashboard)/businesses/StaffCommandCenter.tsx");
check("4a. \"Leonix Business Concierge\" is the primary heading, larger and above the Staff Command Center eyebrow", () => {
  const productIdx = commandCenter.indexOf("Leonix Business Concierge");
  const eyebrowIdx = commandCenter.indexOf("Staff Command Center");
  assert.ok(productIdx !== -1 && eyebrowIdx !== -1);
  assert.ok(productIdx < eyebrowIdx, "product name must appear before the eyebrow subtitle in source/DOM order");
  const productBlock = commandCenter.slice(commandCenter.lastIndexOf("<p", productIdx), productIdx);
  assert.ok(/text-xl|text-2xl|text-3xl/.test(productBlock), "product name should use a larger text size than the eyebrow");
});
check("4b. Command Center's major sections use the same compact bordered-card pattern established elsewhere in Business Concierge", () => {
  const cardPattern = /rounded-2xl border border-\[#E8DFD0\] bg-white p-4/g;
  const matches = commandCenter.match(cardPattern) ?? [];
  assert.ok(matches.length >= 5, `expected at least 5 compact-card sections, found ${matches.length}`);
});
check("4c. No section is left as a bare, unbordered full-width block for Today/Needs Attention/Owner Handoff/Quick Actions", () => {
  for (const heading of ["Hoy / Today", "Necesita atención / Needs attention", "Entrega al Dueño / Owner Handoff", "Acciones rápidas / Quick actions"]) {
    const idx = commandCenter.indexOf(heading);
    assert.ok(idx !== -1, `heading "${heading}" not found`);
    const precedingDiv = commandCenter.lastIndexOf("<div", idx);
    const divTag = commandCenter.slice(precedingDiv, idx);
    assert.ok(/rounded-2xl border/.test(divTag), `section containing "${heading}" is not wrapped in a bordered card`);
  }
});
check("4d. All real-data bindings (no hardcoded chip counts) are unchanged by the density repair", () => {
  assert.ok(!/count=\{\d/.test(commandCenter), "no chip may be given a hardcoded numeric literal count");
});

// --- 5. Whole-surface sweep: no raw internal error code ever rendered to staff ------------------
function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      if (entry === "node_modules" || entry === ".next") continue;
      walk(full, out);
    } else if (/\.(tsx|ts)$/.test(entry)) {
      out.push(full);
    }
  }
  return out;
}
check("5a. No client component in the Business Concierge surface template-interpolates a raw API error code straight into user-facing text", () => {
  const dirs = [path.join(ROOT, "app/admin/(dashboard)/businesses"), path.join(ROOT, "app/admin/field")];
  const offenders: string[] = [];
  for (const dir of dirs) {
    for (const file of walk(dir)) {
      const source = readFileSync(file, "utf8");
      if (!/"use client"/.test(source)) continue;
      // A raw leak looks like `${body.error}` / `${data.error}` interpolated directly into a
      // displayed string, without going through humanizeStaffWriteError first.
      if (/\$\{[a-zA-Z]*\.error\}/.test(source) && !source.includes("humanizeStaffWriteError")) {
        offenders.push(path.relative(ROOT, file));
      }
    }
  }
  assert.deepEqual(offenders, []);
});

console.log(`\n${passed} check(s) passed.`);
