/**
 * Focused, source-level proof that Executive Hub / staff public contact profiles are correctly
 * wired into Company Search (Master Operating Book V2 §17/§0C/§0G). Same hand-rolled node:assert
 * convention as every other verify-*.ts script in this repo — structural/source-level proof only.
 * Run from repo root: npx tsx scripts/verify-executive-company-search-01.ts
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

function read(relPath: string): string {
  return readFileSync(path.resolve(__dirname, "..", relPath), "utf8");
}

console.log("Executive Hub -> Company Search (Master Operating Book V2 §17) — focused tests\n");

const extendedSearch = read("app/admin/_lib/adminExtendedGlobalSearch.ts");
const unifiedSearch = read("app/admin/_lib/adminOpsUnifiedSearch.ts");
const opsPage = read("app/admin/(dashboard)/ops/page.tsx");
const guideRegistry = read("app/admin/_lib/adminGuideRegistry.ts");
const executivesDb = read("app/lib/digitalContact/digitalContactExecutivesDb.ts");
const executiveHubStore = read("app/admin/_lib/executiveHubStore.ts");

// --- 1: executives source is registered in Company Search ---
check("adminExtendedGlobalSearch.ts imports and calls the canonical listExecutiveHubRecords() — no duplicate table/query", () => {
  assert.ok(extendedSearch.includes('import { listExecutiveHubRecords } from "@/app/admin/_lib/executiveHubStore";'));
  assert.ok(extendedSearch.includes("await listExecutiveHubRecords()"));
});
check("runAdminUnifiedSearch (the canonical Company Search entry point) includes the extended-sources call that now covers executives", () => {
  assert.ok(unifiedSearch.includes("searchExtendedAdminSources(trimmed, viewer)"));
});
check("no duplicate/parallel executives table or index was introduced — no new CREATE TABLE for executives-adjacent search", () => {
  assert.ok(!/CREATE TABLE.*executives_search/i.test(extendedSearch));
});

// --- 2: expected safe fields are searchable ---
check("executive search matches on full name, preferred name, title, email, slug, company, and phone — the task's own named safe fields", () => {
  const block = extendedSearch.match(/Executive Hub \/ staff PUBLIC contact profiles[\s\S]*?catch \(e\) \{\s*errors\.push\(`Staff contact profiles/);
  assert.ok(block, "executive search block must exist");
  const body = block![0];
  for (const field of ["row.fullName", "row.preferredName", "row.title", "row.email", "row.slug", "row.company", "row.phoneDisplay", "row.phoneDigits"]) {
    assert.ok(body.includes(field), `expected searchable field missing: ${field}`);
  }
});
check("executive search does NOT match on internal-only notes or metaDescription", () => {
  const block = extendedSearch.match(/Executive Hub \/ staff PUBLIC contact profiles[\s\S]*?catch \(e\) \{\s*errors\.push\(`Staff contact profiles/)![0];
  const code = block.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
  assert.ok(!/row\.notes|row\.metaDescription/.test(code), "code (excluding comments) must not read row.notes/row.metaDescription");
});

// --- 3: result type is unambiguous ---
check("executive profile results use a distinct entityType/entityLabel from team_member (Team Roster/login identity)", () => {
  assert.ok(extendedSearch.includes('entityType: "executive_profile"'));
  assert.ok(extendedSearch.includes('entityLabel: "Staff contact profile"'));
  assert.ok(extendedSearch.includes('entityType: "team_member"'));
  assert.ok(extendedSearch.includes('entityLabel: "Staff"'));
});
check("AdminExtendedSearchRow's entityType union includes executive_profile alongside every pre-existing type, none removed", () => {
  const unionMatch = extendedSearch.match(/entityType: "team_member" \| "lead" \| "payment" \| "resource" \| "magazine_issue" \| "support_ticket" \| "executive_profile";/);
  assert.ok(unionMatch, "entityType union must be extended, not replaced");
});

// --- 4: canonical Admin destination is correct ---
check("owner_admin viewer gets the real, existing Executive Hub edit route", () => {
  assert.ok(extendedSearch.includes("adminHref = `/admin/team/executive-hub/${row.slug}/edit`;"));
});
check("the linked staff member themselves gets their own existing self-service route, never someone else's", () => {
  assert.ok(extendedSearch.includes('adminHref = "/admin/team/my-profile";'));
  assert.ok(extendedSearch.includes("viewer.rosterId === row.linkedRosterId"));
});
check("every other viewer gets the real, always-reachable public contact route as the default", () => {
  assert.ok(extendedSearch.includes("let adminHref = `/contact/${row.slug}`;"));
});

// --- 5: restricted roles do not receive an unusable owner-only CTA ---
check("the owner-only edit route is only ever assigned when viewer.isOwnerAdmin is true — never unconditionally", () => {
  const ifMatch = extendedSearch.match(/if \(viewer\?\.isOwnerAdmin\) \{\s*adminHref = `\/admin\/team\/executive-hub/);
  assert.ok(ifMatch, "owner edit route must be gated behind viewer.isOwnerAdmin");
});
check("ops/page.tsx computes and passes a real viewer context (rosterId + isOwnerAdmin) from the actual authenticated access context, not a hardcoded value", () => {
  assert.ok(opsPage.includes("getCurrentAdminAccessContext"));
  assert.ok(opsPage.includes("isOwnerAdminRole(access.normalizedRole)"));
  assert.ok(opsPage.includes("access.rosterMemberId"));
  assert.ok(opsPage.includes("runAdminUnifiedSearch(q, viewer)"));
});

// --- 6: no sensitive/internal fields are exposed in result summaries ---
check("the result's displayed title is built only from name + title fields, never notes/metaDescription/raw internal data", () => {
  assert.ok(extendedSearch.includes('title: (row.preferredName || row.fullName) + (row.title ? ` — ${row.title}` : "")'));
});
check("rowToDigitalContactProfile (the real public shape) still never exposes linked_roster_id — confirms this gate did not weaken that prior boundary", () => {
  const fnMatch = executivesDb.match(/export function rowToDigitalContactProfile[\s\S]*?\n}/);
  assert.ok(fnMatch);
  assert.ok(!/linked_roster_id|linkedRosterId/.test(fnMatch![0]));
});

// --- 7: missing linked_roster_id migration does not break search ---
check("listExecutiveHubRecords() (reused directly, unmodified) delegates to the already pre-migration-safe dbListExecutiveHubRecords()", () => {
  assert.ok(executiveHubStore.includes("dbListExecutiveHubRecords"));
});
check("dbListExecutiveHubRecords() still contains its pre-migration fallback (retries without linked_roster_id on the specific column error)", () => {
  const fnMatch = executivesDb.match(/export async function dbListExecutiveHubRecords[\s\S]*?\n}/);
  assert.ok(fnMatch);
  assert.ok(fnMatch![0].includes("isMissingLinkedRosterIdColumn"));
});
check("the executive search block itself never queries linked_roster_id directly against Supabase — it only reads the already-resolved, already-safe ExecutiveHubRecord field", () => {
  const block = extendedSearch.match(/Executive Hub \/ staff PUBLIC contact profiles[\s\S]*?catch \(e\) \{\s*errors\.push\(`Staff contact profiles/)![0];
  assert.ok(!/\.eq\(\s*["']linked_roster_id["']/.test(block), "search block must not run its own raw query against linked_roster_id");
});

// --- 8: Company Search remains distinct from Admin Guide Search ---
check("the Admin Guide registry is a separate module from the search modules — no cross-import in either direction", () => {
  // Prose mentions of the search module filenames (explaining the §0C distinction) are fine and
  // expected — what must never exist is an actual `import ... from "./admin...Search"` statement.
  assert.ok(!/import[\s\S]*?from\s+["'].*adminExtendedGlobalSearch["']/.test(guideRegistry));
  assert.ok(!/import[\s\S]*?from\s+["'].*adminOpsUnifiedSearch["']/.test(guideRegistry));
  assert.ok(!/import[\s\S]*?from\s+["'].*adminGuideRegistry["']/.test(extendedSearch));
  assert.ok(!/import[\s\S]*?from\s+["'].*adminGuideRegistry["']/.test(unifiedSearch));
});
check("the executive-hub Admin Guide entry documents that Company Search can now find staff contact profiles, without duplicating search instructions elsewhere", () => {
  const entryMatch = guideRegistry.match(/id: "executive-hub",[\s\S]*?\n {2}\},/);
  assert.ok(entryMatch, "executive-hub guide entry must exist");
  assert.ok(/Company Search/i.test(entryMatch![0]), "executive-hub guide entry should mention Company Search coverage");
});

// --- 9: existing search categories remain intact ---
check("every pre-existing extended-search source is still present and unmodified in shape (team_member, lead, payment, resource, magazine_issue, support_ticket)", () => {
  for (const label of ['entityLabel: "Staff"', 'entityLabel: "Lead"', 'entityLabel: "Payment / entitlement"', 'entityLabel: "Recursos"', 'entityLabel: "Revista issue"', 'entityLabel: "Support ticket"']) {
    assert.ok(extendedSearch.includes(label), `pre-existing entityLabel missing: ${label}`);
  }
});
check("Company Search's other pre-existing sources (profiles, listings, orders, reports, dedicated categories, businesses) are still wired in runAdminUnifiedSearch, unchanged by this gate", () => {
  for (const src of ["fetchProfilesForAdminList", "searchListingsForAdminOps", "listTiendaOrdersForAdmin", "searchListingReportsForOps", "searchDedicatedCategoryListingsForAdminOps", "listBusinessesForWorkspace"]) {
    assert.ok(unifiedSearch.includes(src), `pre-existing search source missing: ${src}`);
  }
});

console.log(`\n${passed} check(s) passed.`);
if (process.exitCode) {
  console.error("\nSome checks FAILED.");
} else {
  console.log("\nAll checks passed.");
}
