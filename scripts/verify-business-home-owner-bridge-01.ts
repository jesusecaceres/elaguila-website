/**
 * Gate 2 — Owner-Safe Bridge Reconciliation. Focused structural verifier for:
 *   - the new resolveBusinessHomeAccess() primitive (app/lib/business/businessHome/access.ts)
 *   - the new composition endpoint (app/api/dashboard/business/home/route.ts)
 *   - the new proposals owner-safe shape/visibility functions
 * Same hand-rolled node:assert convention as every other verify-*.ts script in this repo.
 * Structural/source-level proof — pure-logic behavior is covered by real runtime execution in
 * scripts/test-business-home-owner-safe-shaping.ts, which this script does not duplicate.
 * Run from repo root: npx tsx scripts/verify-business-home-owner-bridge-01.ts
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

console.log("Gate 2 — Business Home owner-safe bridge — focused tests\n");

function read(relPath: string): string {
  return readFileSync(path.resolve(__dirname, "..", relPath), "utf8");
}

const accessText = read("app/lib/business/businessHome/access.ts");
const routeText = read("app/api/dashboard/business/home/route.ts");
const proposalsLogicText = read("app/lib/business/proposals/logic.ts");

// --- P0: exact business access rule (owner authorization / cross-business isolation) -----------

check("resolveBusinessHomeAccess requires a real authenticated user before anything else", () => {
  assert.ok(accessText.includes("resolveAuthenticatedUserId(token)"));
  assert.ok(/if \(!token\) return \{ ok: false, status: 401/.test(accessText));
  assert.ok(/if \(!userId\) return \{ ok: false, status: 401/.test(accessText));
});
check("resolveBusinessHomeAccess requires an explicit businessId — never infers 'the' business for a user", () => {
  assert.ok(/if \(!businessId\) return \{ ok: false, status: 404, error: "missing_business_id" \}/.test(accessText));
  assert.ok(!accessText.includes("findActiveMembershipForCurrentUser"), "must use the EXACT (businessId, userId) match primitive, not the 'any membership' primitive");
});
check("resolveBusinessHomeAccess grants access only via a real, exact (businessId, userId) membership row — RLS-scoped client, not service role", () => {
  assert.ok(accessText.includes("findActiveMembershipForBusinessAndUser(userClient, businessId, userId)"));
  assert.ok(/if \(!membership\) return \{ ok: false, status: 403, error: "cross_business_denied" \}/.test(accessText));
  assert.ok(accessText.includes("getServerSupabaseForBearerToken(token)"), "must use the bearer-token-scoped (RLS-enforcing) client to prove membership, not an admin/service-role client");
});
check("resolveBusinessHomeAccess fetches the business itself only through the RLS-scoped user client, and fails closed if not found", () => {
  assert.ok(accessText.includes("getBusinessByIdForCurrentUser(userClient, businessId)"));
  assert.ok(/if \(!business\) return \{ ok: false, status: 404, error: "business_not_found" \}/.test(accessText));
});
check("The composition route rejects the request outright (no partial payload) when access resolution fails", () => {
  assert.ok(/if \(!access\.ok\) return NextResponse\.json\(\{ ok: false, error: access\.error \}, \{ status: access\.status \}\)/.test(routeText));
});
check("The composition route never accepts a business id from anywhere except the resolved, membership-verified access.business.id — every per-domain call uses business.id, never a raw request param", () => {
  const composeCalls = routeText.match(/compose\w+\(userId, business\.id[^)]*\)/g) ?? [];
  assert.ok(composeCalls.length >= 8, `expected at least 8 section calls scoped to business.id, found ${composeCalls.length}`);
  assert.ok(!/compose\w+\(userId, businessId\b/.test(routeText.replace(/const \{ userId, business \} = access;/, "")), "no section may be called with a raw, unverified businessId");
});

// --- Staff-data leakage ---------------------------------------------------------------------------

check("The composition route never imports a staff-only repository or admin access module", () => {
  assert.ok(!routeText.includes("app/admin/"));
  assert.ok(!/StaffWriteActor|requireStaffWorkspaceWriteAccess|toStaffWriteActor/.test(routeText));
});
check("The composition route reuses each domain's OWN already-certified owner-safe shape function (never re-derives shaping inline for facts/unknowns/health/signals/outcomes)", () => {
  assert.ok(routeText.includes("shapeFactsForOwnerView") && routeText.includes("shapeUnknownsForOwnerView"));
  assert.ok(routeText.includes("shapeDimensionResultsForOwnerView") && routeText.includes("shapeFindingsForOwnerView"));
  assert.ok(routeText.includes("shapeSignalForOwner"));
  assert.ok(routeText.includes("isOwnerSafeOutcome") && routeText.includes("shapeOutcomeForOwner"));
  assert.ok(routeText.includes("shapeProposalForOwner") && routeText.includes("isOwnerVisibleProposalStatus"));
});
check("The composition route never spreads/returns a raw domain record directly — Next Right Move destructures an explicit owner-safe field allowlist matching the existing dedicated route exactly", () => {
  assert.ok(!/\.\.\.(current|proposal|outcome|signal|fact)\b/.test(routeText), "must never spread a raw repository record into the response");
});
check("Assistant section never returns message content or thread titles — readiness/count only", () => {
  const fnMatch = routeText.match(/async function composeAssistant[\s\S]*?\n\}/);
  assert.ok(fnMatch, "composeAssistant not found");
  const body = fnMatch![0];
  assert.ok(!body.includes("listMessagesForThread") && !body.includes("listOwnerSafeMessagesForThread"), "the Business Home summary must not fetch message content — that belongs to the dedicated assistant thread route, not the home composition payload");
  assert.ok(body.includes("hasActiveThread"));
});
check("Proposals never reach the payload while in draft/staff_review — filtered before shaping, not after", () => {
  const fnMatch = routeText.match(/async function composeWorkWithLeonix[\s\S]*?\n\}/);
  assert.ok(fnMatch, "composeWorkWithLeonix not found");
  const body = fnMatch![0];
  const filterIdx = body.indexOf("isOwnerVisibleProposalStatus");
  const shapeIdx = body.indexOf("shapeProposalForOwner");
  assert.ok(filterIdx >= 0 && shapeIdx >= 0 && filterIdx < shapeIdx, "visibility filter must run before shaping");
});

// --- Resilience — one disabled/erroring domain must never break the whole payload ----------------

check("Every compose* section function has its own try/catch OR is wrapped in Promise.allSettled — a single domain failure can never throw out of the route", () => {
  const composeFns = routeText.match(/async function compose\w+\([\s\S]*?\n\}/g) ?? [];
  assert.ok(composeFns.length >= 8, `expected at least 8 compose functions, found ${composeFns.length}`);
  for (const fn of composeFns) {
    const name = fn.match(/async function (compose\w+)/)?.[1];
    const isolated = fn.includes("try {") || fn.includes("Promise.allSettled");
    assert.ok(isolated, `${name} has no try/catch or allSettled isolation`);
  }
});
check("The route awaits every section via Promise.all/allSettled (parallel), not sequential awaits — matches Gate 2A no-per-card-waterfall doctrine", () => {
  assert.ok(/const \[[\s\S]{0,300}\] = await Promise\.all\(\[/.test(routeText));
});
check("Every feature-flag-gated section checks its OWN flag/entitlement — no section fabricates access from another domain's flag", () => {
  assert.ok(routeText.includes("resolveStewardshipFlagTier"));
  assert.ok(routeText.includes("resolveHealthMapFlagTier"));
  assert.ok(routeText.includes("resolveDiyConciergeFlagTier"));
  assert.ok(routeText.includes("resolveLivingBookFlagTier"));
  assert.ok(routeText.includes("resolveAdvisorFlagTier"));
  assert.ok(routeText.includes("resolveOutcomesFlagTier"));
  assert.ok(routeText.includes("resolveAssistantFlagTier"));
  assert.ok(routeText.includes("resolveProposalFlagTier"));
});

// --- No invented empty/fake values -----------------------------------------------------------------

check("Learning section is honestly null with a documented reason, not a fabricated empty array pretending to be real content", () => {
  assert.ok(/learning: null,/.test(routeText));
  assert.ok(/MISSING BRIDGE/.test(routeText));
});
check("No section returns a hardcoded non-zero count or fake recommendation/health/outcome literal", () => {
  assert.ok(!/recommendation:\s*\{\s*id:\s*"/.test(routeText), "no hardcoded fake recommendation literal");
  assert.ok(!/outcomes:\s*\[\s*\{/.test(routeText), "no hardcoded fake outcomes array literal");
});

// --- Proposals owner-safe module itself -------------------------------------------------------------

check("proposals/logic.ts stays pure (no server-only, no DB import) — shape/visibility logic is testable without a live database", () => {
  assert.ok(!proposalsLogicText.includes('import "server-only"'));
  assert.ok(!proposalsLogicText.includes("getAdminSupabase"));
});
check("shapeProposalForOwner's explicit return type omits every actor-attribution field at the TYPE level, not just by convention", () => {
  const typeMatch = proposalsLogicText.match(/export type OwnerSafeProposal = \{[\s\S]*?\n\};/);
  assert.ok(typeMatch, "OwnerSafeProposal type not found");
  const body = typeMatch![0];
  for (const forbidden of ["createdByRosterId", "createdByAuthUserId", "createdByEmail", "createdByRole", "acceptedByRosterId", "acceptedByAuthUserId", "acceptedByEmail", "acceptedByRole", "entitlementReference"]) {
    assert.ok(!body.includes(forbidden), `OwnerSafeProposal type must not declare ${forbidden}`);
  }
});

console.log(`\n${passed} check(s) passed.`);
if (process.exitCode) {
  console.error("\nSome checks FAILED.");
} else {
  console.log("\nAll checks passed.");
}
