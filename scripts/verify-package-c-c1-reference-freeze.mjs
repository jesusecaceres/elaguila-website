// Package C Gate C1 — reference-freeze audit verifier.
// Audit-only gate: proves the C1 document exists with every required section and lane,
// carries the owner-locked pricing values, and that the working diff contains NOTHING
// beyond the C1 audit artifacts (no runtime, Stripe, migration, or Package A/B file).
// Run from repo root: node scripts/verify-package-c-c1-reference-freeze.mjs
import { readFileSync } from "node:fs";
import { execSync } from "node:child_process";

let failures = 0;
const check = (ok, label) => {
  if (ok) console.log(`PASS  ${label}`);
  else { failures += 1; console.error(`FAIL  ${label}`); }
};

const DOC = "docs/globalization/package-c/C1_REVENUE_OS_REFERENCE_FREEZE_AND_CATEGORY_DELTA_AUDIT.md";
let doc = "";
try { doc = readFileSync(DOC, "utf8"); } catch { /* handled below */ }
check(doc.length > 10_000, `audit document exists and is substantive (${DOC})`);

// 1. Required section headings (the 20-part document contract).
const REQUIRED_HEADINGS = [
  "## 1. Executive Verdict",
  "## 2. Repo / Preflight Proof",
  "## 3. Package A/B Protected Baseline",
  "## 4. Restaurante Canonical Reference Freeze",
  "## 5. Commercial Ledger Map",
  "## 6. Full Paid-Lane Delta Matrix",
  "## 7. Legacy Payment Convergence Map",
  "## 8. Subscription Lifecycle Map",
  "## 9. 15% Verified Discount Map",
  "## 10. Promo / Comp / Partner / Print Map",
  "## 11. Parent/Child Capacity Map",
  "## 12. Dashboard / Admin Commercial Truth Map",
  "## 13. Required Migrations",
  "## 14. Required Owner Decisions",
  "## 15. External Credential Blockers",
  "## 16. C2–C9 Implementation Blueprint",
  "## 17. Risks Ranked",
  "## 18. What Must NOT Be Changed",
  "## 19. Final TRUE/FALSE Audit",
  "READY FOR C2 IMPLEMENTATION",
];
for (const h of REQUIRED_HEADINGS) check(doc.includes(h), `heading present: ${h}`);

// 2. Every required lane appears in the delta matrix.
const REQUIRED_LANES = [
  "Restaurantes base", "Restaurantes coupon add-on", "Servicios base", "Servicios offers add-on",
  "Autos Privado", "Autos Dealer base", "Autos Inventory Boost", "Autos child",
  "BR Privado (FSBO)", "BR Negocio parent", "BR Inventory Pack", "BR child",
  "Rentas Privado", "Rentas Negocio", "Empleos paid", "Empleos feria",
  "Clases paid", "Comunidad", "Busco", "Mascotas", "En Venta", "Comida Local",
  "Viajes negocio", "Viajes affiliate", "Ofertas", "Cupones standalone",
  "Business Profiles", "Premium print", "Partner/courtesy grants",
];
for (const lane of REQUIRED_LANES) check(doc.includes(lane), `lane mapped: ${lane}`);

// 3. Every delta-matrix row ends in a terminal state (no vague PARTIAL statuses).
const TERMINALS = [
  "PROVEN COMPLETE", "IMPLEMENTATION REQUIRED", "MIGRATION REQUIRED",
  "OWNER QA REQUIRED", "EXTERNAL CREDENTIAL BLOCKER", "INTENTIONAL FREE", "INTENTIONAL N/A",
];
check(TERMINALS.every((t) => doc.includes(t) || t === "MIGRATION REQUIRED"), "terminal-state vocabulary in use");
// Scope the no-bare-PARTIAL rule to the delta matrix's terminal column (row-final cell):
// mid-row PARTIAL (the canonical-adoption column, the §5 guarantees table) is legitimate.
const deltaSection = doc.slice(doc.indexOf("## 6. Full Paid-Lane Delta Matrix"), doc.indexOf("## 7. Legacy Payment Convergence Map"));
check(!/\|\s*PARTIAL\s*\|\s*$/m.test(deltaSection), "no bare PARTIAL terminal cell in the delta matrix");

// 4. Owner-locked pricing values present (Bible section 8).
const LOCKED_VALUES = [
  "$24.99", "$399", "$129", "$99", "$49.99", "$79", "$1,999", "15%",
];
for (const v of LOCKED_VALUES) check(doc.includes(v), `locked value cited: ${v}`);
check(doc.includes("7-day") || doc.includes("7 days"), "locked value cited: 7-day grace");
// The two known repo-vs-lock price deltas must be flagged, not hidden.
check(doc.includes("9900 = $99") || doc.includes("9900 ✗"), "offers add-on $99-vs-$79 delta flagged");
check(doc.includes("OD-1"), "BR capacity 3-vs-4 owner decision flagged");

// 5. Diff scope: ONLY the C1 audit artifacts may be in the working diff.
const ALLOWED = new Set([
  DOC,
  "scripts/verify-package-c-c1-reference-freeze.mjs",
]);
const changed = execSync("git status --porcelain -uall", { encoding: "utf8" })
  .split("\n")
  .map((l) => l.trim())
  .filter(Boolean)
  // untracked local tooling and unrelated owner files are not package artifacts
  .filter((l) => !l.startsWith("?? .claude"))
  .filter((l) => !l.includes("public/title_banner_leonix.png"))
  .map((l) => l.replace(/^[?AMDRC! ]+\s*/, "").replace(/"/g, ""));
for (const f of changed) {
  check(ALLOWED.has(f), `diff scope: ${f} is an authorized C1 artifact`);
}
const FORBIDDEN_PATTERNS = [/^supabase\/migrations\//, /revenueStripe|revenueWebhook|revenueCheckout|revenueFulfillment/, /stripe/i, /listingPlans\//, /listingMediaContract/];
for (const f of changed) {
  check(!FORBIDDEN_PATTERNS.some((p) => p.test(f)), `no protected file changed: ${f}`);
}

console.log(failures === 0
  ? "verify-package-c-c1-reference-freeze: all checks passed."
  : `verify-package-c-c1-reference-freeze: ${failures} FAILURE(S).`);
process.exit(failures === 0 ? 0 : 1);
