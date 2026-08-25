/**
 * Focused tests for Gate BCO-4A / Gate B / Gate B.1 (Sales Team Business Workspace — strict,
 * capability-based authorization). Same repo convention as the other verify-*.ts scripts — no
 * jest/vitest, hand-rolled node:assert + check(). The deterministic-logic and capability-matrix
 * checks are real unit tests (pure functions, no DB dependency); the authorization-flow, schema,
 * and data-contract checks are source-level structural proof, since this sandbox has no outbound
 * path to the staging database (confirmed throughout this engagement) — every such check is
 * commented with what it stands in for.
 * Run from repo root: npx tsx scripts/verify-sales-business-workspace-01.ts
 */
import { strict as assert } from "node:assert";
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";

import {
  computeNextHelpfulAction,
  computeProfileCompleteness,
  deriveFollowUpDisplayStatus,
  type ProfileCompletenessInput,
} from "../app/admin/_lib/salesWorkspaceLogic";
import {
  SALES_WORKSPACE_CAPABILITIES,
  SALES_WORKSPACE_ROLES,
  capabilitiesForRole,
  hasCapability,
  isSalesWorkspaceRole,
} from "../app/admin/_lib/salesWorkspaceCapabilities";
import { isStaffSalesAllowedAdminPath } from "../app/admin/_lib/staffSalesAllowedAdminPath";
import { composeStaffConciergeHome } from "../app/admin/_lib/staffConciergeHome";

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

console.log("Sales Business Workspace (Gate BCO-4A / Gate B / Gate B.1) — focused tests\n");

function read(relPath: string): string {
  return readFileSync(path.resolve(__dirname, "..", relPath), "utf8");
}

function emptyCompletenessInput(overrides: Partial<ProfileCompletenessInput> = {}): ProfileCompletenessInput {
  return {
    business: { displayName: "", broadBusinessType: null, businessStage: null, updatedAt: new Date().toISOString(), preferredResponseMethod: null },
    authorizationNeedsReview: false,
    contacts: [],
    serviceAreas: [],
    digitalProfiles: [],
    customLinks: [],
    listingLinks: [],
    ...overrides,
  };
}

const COMPLETE_CORE: Partial<ProfileCompletenessInput> = {
  business: { displayName: "Taquería El Sol", broadBusinessType: "food_hospitality", businessStage: "operating", updatedAt: new Date().toISOString(), preferredResponseMethod: null },
  contacts: [{ contactType: "phone", capabilities: [] }],
  serviceAreas: [{ country: "US", rawText: "San Jose, CA" }],
};

// --- Deterministic profile completeness ---------------------------------------------------------
check("computeProfileCompleteness: an empty business has no identity/contact/area/website/whatsapp/google/ad evidence met (only the two neutral-default items pass)", () => {
  const result = computeProfileCompleteness(emptyCompletenessInput());
  assert.equal(result.totalCount, 9);
  const unmetIds = ["identity_confirmed", "primary_contact_confirmed", "service_area_confirmed", "has_website", "has_whatsapp", "has_google_business", "has_connected_ad"];
  for (const id of unmetIds) {
    assert.equal(result.items.find((i) => i.id === id)!.met, false, `${id} should not be met on an empty profile`);
  }
  assert.equal(result.metCount, 2);
});
check("computeProfileCompleteness: recognizes a website via a custom link OR a website-type contact", () => {
  const viaLink = computeProfileCompleteness(emptyCompletenessInput({ customLinks: [{ linkType: "order_online" }] }));
  const viaContact = computeProfileCompleteness(emptyCompletenessInput({ contacts: [{ contactType: "website", capabilities: [] }] }));
  assert.ok(viaLink.items.find((i) => i.id === "has_website")!.met);
  assert.ok(viaContact.items.find((i) => i.id === "has_website")!.met);
});
check("computeProfileCompleteness: WhatsApp requires the capability, not just a phone contact", () => {
  const plainPhone = computeProfileCompleteness(emptyCompletenessInput({ contacts: [{ contactType: "phone", capabilities: [] }] }));
  const whatsappPhone = computeProfileCompleteness(emptyCompletenessInput({ contacts: [{ contactType: "phone", capabilities: ["whatsapp"] }] }));
  assert.equal(plainPhone.items.find((i) => i.id === "has_whatsapp")!.met, false);
  assert.equal(whatsappPhone.items.find((i) => i.id === "has_whatsapp")!.met, true);
});
check("computeProfileCompleteness: connected ad only counts verified/pending, not removed/rejected", () => {
  const removed = computeProfileCompleteness(emptyCompletenessInput({ listingLinks: [{ status: "removed" }] }));
  const pending = computeProfileCompleteness(emptyCompletenessInput({ listingLinks: [{ status: "pending" }] }));
  assert.equal(removed.items.find((i) => i.id === "has_connected_ad")!.met, false);
  assert.equal(pending.items.find((i) => i.id === "has_connected_ad")!.met, true);
});
check("computeProfileCompleteness: never a bare percentage — every item carries an explanatory label", () => {
  const result = computeProfileCompleteness(emptyCompletenessInput());
  for (const item of result.items) {
    assert.ok(item.label.en.trim().length > 0);
    assert.ok(item.label.es.trim().length > 0);
  }
});

// --- Deterministic next-helpful-action, in the spec's exact priority order ----------------------
check("computeNextHelpfulAction: incomplete core profile -> complete_profile, never skips ahead", () => {
  const action = computeNextHelpfulAction(emptyCompletenessInput());
  assert.equal(action.id, "complete_profile");
});
check("computeNextHelpfulAction: core complete, no website -> confirm_website (never assumes a new site is needed)", () => {
  const action = computeNextHelpfulAction(emptyCompletenessInput(COMPLETE_CORE));
  assert.equal(action.id, "confirm_website");
  assert.ok(action.whatNotToRecommendYet.en.toLowerCase().includes("new website"));
});
check("computeNextHelpfulAction: website exists, no Google Business -> confirm_google_business", () => {
  const action = computeNextHelpfulAction(emptyCompletenessInput({ ...COMPLETE_CORE, customLinks: [{ linkType: "order_online" }] }));
  assert.equal(action.id, "confirm_google_business");
});
check("computeNextHelpfulAction: WhatsApp preferred but not confirmed -> confirm_whatsapp", () => {
  const action = computeNextHelpfulAction(
    emptyCompletenessInput({
      ...COMPLETE_CORE,
      business: { ...COMPLETE_CORE.business!, preferredResponseMethod: "whatsapp" },
      customLinks: [{ linkType: "order_online" }],
      digitalProfiles: [{ platform: "google_business" }],
    }),
  );
  assert.equal(action.id, "confirm_whatsapp");
});
check("computeNextHelpfulAction: everything but a connected ad -> confirm_connected_ad", () => {
  const action = computeNextHelpfulAction(
    emptyCompletenessInput({
      ...COMPLETE_CORE,
      customLinks: [{ linkType: "order_online" }],
      digitalProfiles: [{ platform: "google_business" }],
    }),
  );
  assert.equal(action.id, "confirm_connected_ad");
});
check("computeNextHelpfulAction: fully complete -> proceed_to_discovery, explicitly rejects commission-first framing", () => {
  const action = computeNextHelpfulAction(
    emptyCompletenessInput({
      ...COMPLETE_CORE,
      customLinks: [{ linkType: "order_online" }],
      digitalProfiles: [{ platform: "google_business" }],
      listingLinks: [{ status: "verified" }],
    }),
  );
  assert.equal(action.id, "proceed_to_discovery");
  assert.ok(action.whatNotToRecommendYet.en.toLowerCase().includes("commission"));
});
check("computeNextHelpfulAction: every branch names evidence, what to confirm, and what not to recommend yet", () => {
  const scenarios = [emptyCompletenessInput(), emptyCompletenessInput(COMPLETE_CORE)];
  for (const scenario of scenarios) {
    const action = computeNextHelpfulAction(scenario);
    assert.ok(action.evidence.en.trim().length > 0);
    assert.ok(action.whatToConfirm.en.trim().length > 0);
    assert.ok(action.whatNotToRecommendYet.en.trim().length > 0);
  }
});

// --- Follow-up display status --------------------------------------------------------------------
check("deriveFollowUpDisplayStatus: scheduled status is derived from the date, never stale", () => {
  assert.equal(deriveFollowUpDisplayStatus("scheduled", "2026-08-01", "2026-08-05"), "overdue");
  assert.equal(deriveFollowUpDisplayStatus("scheduled", "2026-08-05", "2026-08-05"), "due_today");
  assert.equal(deriveFollowUpDisplayStatus("scheduled", "2026-08-10", "2026-08-05"), "scheduled");
});
check("deriveFollowUpDisplayStatus: terminal statuses pass through unchanged regardless of date", () => {
  assert.equal(deriveFollowUpDisplayStatus("completed", "2020-01-01", "2026-08-05"), "completed");
  assert.equal(deriveFollowUpDisplayStatus("cancelled", "2020-01-01", "2026-08-05"), "cancelled");
  assert.equal(deriveFollowUpDisplayStatus("waiting_on_owner", "2020-01-01", "2026-08-05"), "waiting_on_owner");
});

// --- Capability matrix (real unit tests — pure functions) -----------------------------------------
check("isSalesWorkspaceRole: only super_admin/sales_manager/sales_rep are recognized — every other roster role is rejected", () => {
  assert.deepEqual([...SALES_WORKSPACE_ROLES].sort(), ["sales_manager", "sales_rep", "super_admin"]);
  for (const other of ["billing_support", "content_manager", "ads_moderator", "magazine_editor", "read_only", "owner_admin", ""]) {
    assert.equal(isSalesWorkspaceRole(other), false, `${other} must not be treated as a Sales Workspace role`);
  }
});
check("capability matrix: sales_rep never receives archive_sales_record or manage_staff_assignments — no automatic owner_admin-level access", () => {
  const repCaps = capabilitiesForRole("sales_rep");
  assert.equal(hasCapability(repCaps, "archive_sales_record"), false);
  assert.equal(hasCapability(repCaps, "manage_staff_assignments"), false);
  assert.ok(hasCapability(repCaps, "view_business_list"));
  assert.ok(hasCapability(repCaps, "create_internal_note"));
});
check("capability matrix: sales_manager gets archive_sales_record but not manage_staff_assignments", () => {
  const managerCaps = capabilitiesForRole("sales_manager");
  assert.ok(hasCapability(managerCaps, "archive_sales_record"));
  assert.equal(hasCapability(managerCaps, "manage_staff_assignments"), false);
});
check("capability matrix: super_admin holds every defined capability", () => {
  const superCaps = capabilitiesForRole("super_admin");
  for (const cap of SALES_WORKSPACE_CAPABILITIES) {
    assert.ok(hasCapability(superCaps, cap), `super_admin missing ${cap}`);
  }
});
check("capability matrix: capability sets are strictly ordered by privilege — sales_rep subset of sales_manager subset of super_admin", () => {
  const rep = capabilitiesForRole("sales_rep");
  const manager = capabilitiesForRole("sales_manager");
  const superAdmin = capabilitiesForRole("super_admin");
  for (const cap of rep) assert.ok(manager.has(cap), `sales_manager missing ${cap} held by sales_rep`);
  for (const cap of manager) assert.ok(superAdmin.has(cap), `super_admin missing ${cap} held by sales_manager`);
});

// --- Authorization fails closed in every required scenario (source-level structural proof — this
// sandbox has no outbound path to Supabase/staging to run these as live integration tests, so each
// check below proves the exact source-code shape that produces the required behavior) -------------
const accessText = read("app/admin/_lib/businessWorkspaceAccess.ts");
check("Scenario: missing admin cookie -> denied before any other check runs", () => {
  assert.ok(/if \(!requireAdminCookie\(jar\)\) \{\s*return \{ ok: false, reason: "no_admin_cookie" \};/.test(accessText), "cookie check must be first and must deny closed");
});
check("Scenario: valid owner-bootstrap session -> allowed as owner_bootstrap override with super_admin capabilities, never as a staff session", () => {
  assert.ok(accessText.includes("isAdminBootstrapSession(jar)"), "must still detect the bootstrap cookie with the existing helper");
  assert.ok(accessText.includes("ownerBootstrapAccess()"), "valid bootstrap must take the owner-override branch");
  assert.ok(accessText.includes('actorType: "owner_bootstrap"'), "bootstrap actor must be tagged owner_bootstrap");
  assert.ok(accessText.includes('role: "super_admin"'), "owner override reuses the existing super_admin capability matrix");
  assert.ok(accessText.includes("capabilities: capabilitiesForRole(\"super_admin\")") || accessText.includes("capabilitiesForRole(\"super_admin\")"), "must reuse capabilitiesForRole, not invent parallel capability strings");
  assert.ok(!/if \(isAdminBootstrapSession\(jar\)\) \{\s*return \{ ok: false, reason: "bootstrap_session_not_allowed" \};/.test(accessText), "valid owner bootstrap must no longer be denied outright");
  const bootstrapIdx = accessText.indexOf("isAdminBootstrapSession(jar)");
  const staffLookupIdx = accessText.indexOf("lookupActiveAdminRosterByAuthUserId(authUserId)");
  assert.ok(bootstrapIdx >= 0 && staffLookupIdx > bootstrapIdx, "owner-bootstrap branch must run before the staff roster lookup so bootstrap is never treated as staff");
});
check("Owner-bootstrap override never fabricates a roster row or a Supabase Auth user", () => {
  assert.ok(accessText.includes('rosterId: ""'), "owner_bootstrap rosterId must be empty — not a fabricated roster UUID");
  assert.ok(!accessText.includes("insert(") && !accessText.includes(".from(\"admin_team_members\")"), "access helper must not write roster rows");
  assert.ok(!accessText.includes("auth.admin.createUser") && !accessText.includes("signUp"), "must not create a Supabase Auth user");
  assert.ok(accessText.includes("salesActorToCreativeActor") && accessText.includes("salesActorToOpportunityActor"), "Package A/B routes must be able to reuse shared owner adapters");
  assert.ok(/if \(actor\.actorType === "owner_bootstrap"\) \{\s*return \{\s*type: "owner"/.test(accessText), "owner bootstrap must map to domain type owner, not staff");
});
check("Scenario: cookie present but no operator email/auth-user-id pair -> denied (no_operator_identity)", () => {
  assert.ok(accessText.includes('reason: "no_operator_identity"'));
  assert.ok(/if \(!operatorEmail \|\| !authUserId\)/.test(accessText));
});
check("Scenario (BCO-4A.7): authUserId cookie does not correspond to a real Supabase Auth user -> denied (auth_user_not_found), checked BEFORE any roster lookup", () => {
  const authCheckIdx = accessText.indexOf('reason: "auth_user_not_found"');
  const rosterLookupIdx = accessText.indexOf("lookupActiveAdminRosterByAuthUserId(authUserId)");
  assert.ok(authCheckIdx >= 0, "auth_user_not_found denial reason missing");
  assert.ok(rosterLookupIdx >= 0 && authCheckIdx < rosterLookupIdx, "the real-Auth-user check must run before the roster lookup");
  assert.ok(accessText.includes("lookupAuthUserById(authUserId)"), "must verify the cookie's authUserId against a real Supabase Auth user via the Admin API");
});
check("Scenario (BCO-4A.7): a real Auth UUID paired with a mismatched/forged operator-email cookie -> denied (identity_mismatch)", () => {
  assert.ok(/if \(authUser\.email !== operatorEmail\.trim\(\)\.toLowerCase\(\)\)/.test(accessText), "cookie-claimed email must be compared against the real, verified Supabase Auth email");
  assert.ok((accessText.match(/"identity_mismatch"/g) ?? []).length >= 2, "identity_mismatch must be checked at least twice — cookie-email-vs-Auth-email AND roster-email-vs-Auth-email");
});
check("Scenario (BCO-4A.7): roster row is resolved by auth_user_id, never by email — a NULL auth_user_id roster row can never match and is denied by construction, not by special-case code", () => {
  assert.ok(!accessText.includes("lookupActiveAdminRosterByEmail"), "businessWorkspaceAccess.ts must not resolve roster identity by email at all anymore — email-only fallback is exactly the gap BCO-4A.7 closed");
  assert.ok(accessText.includes("lookupActiveAdminRosterByAuthUserId(authUserId)"));
});
check("Scenario: operator identity is real and verified but no roster row has this exact auth_user_id -> denied (roster_not_found)", () => {
  assert.ok(accessText.includes('"roster_not_found"'));
});
check("Scenario: roster row exists (matched by auth_user_id) but is_active is false -> denied (roster_inactive)", () => {
  assert.ok(accessText.includes('"roster_inactive"'));
  assert.ok(accessText.includes("roster.code"), "must branch on the roster lookup's inactive-vs-missing code");
});
check("Scenario (BCO-4A.7): roster row matched by auth_user_id but its own email column has drifted from the verified Auth email -> denied (identity_mismatch)", () => {
  assert.ok(/if \(roster\.email\.trim\(\)\.toLowerCase\(\) !== authUser\.email\)/.test(accessText), "roster.email must be cross-checked against the verified Auth email as defense in depth");
});
check("Scenario: roster role is not one of the three Sales Workspace roles -> denied (role_not_permitted)", () => {
  assert.ok(/if \(!isSalesWorkspaceRole\(normalizedRole\)\)/.test(accessText));
  assert.ok(accessText.includes('"role_not_permitted"'));
});
check("Scenario: allowed role succeeds and returns a full StrictSalesActor — never a partial or fallback object; the actor's email is the VERIFIED Auth email, not the bare cookie-claimed value", () => {
  assert.ok(/return \{\s*ok: true,\s*actor: \{/.test(accessText));
  for (const field of ['actorType: "staff"', "rosterId: roster.rosterMemberId", "authUserId", "email: authUser.email", "role: normalizedRole", "capabilities: capabilitiesForRole(normalizedRole)"]) {
    assert.ok(accessText.includes(field), `success actor must set ${field}`);
  }
});
check("No env-var fallback identity (ADMIN_OPERATOR_EMAIL) is accepted — a per-person session is required, never a shared machine-level default", () => {
  assert.ok(!/process\.env\.ADMIN_OPERATOR_EMAIL/.test(accessText), "ADMIN_OPERATOR_EMAIL may only appear in explanatory comments, never read as a live fallback");
});
check("No inferred owner_admin fallback and no placeholder/anonymous actor anywhere in the access module's executable code", () => {
  for (const forbidden of ["UNATTRIBUTED", "unattributed@leonix-admin", "system@leonix-admin", "\"anonymous\"", "'anonymous'", 'role: "owner_admin"', "role = \"owner_admin\""]) {
    assert.ok(!accessText.includes(forbidden), `businessWorkspaceAccess.ts must not contain "${forbidden}"`);
  }
});
check("Roster and Auth-identity freshness are both re-checked on every call, never cached — a deactivated staff member or a revoked/forged identity loses access on their next request", () => {
  assert.ok(accessText.includes("lookupActiveAdminRosterByAuthUserId(authUserId)"));
  assert.ok(accessText.includes("lookupAuthUserById(authUserId)"));
});
check("Entrepreneur/business-owner sessions cannot reach this module — it only ever reads admin cookies, never an entrepreneur/business session cookie", () => {
  assert.ok(!/business.?owner.?cookie|entrepreneur.?session|getBusinessOwnerSession/i.test(accessText));
});

// --- Capability enforcement is server-side, not a JSX hint (structural proof) ----------------------
const dataText = read("app/admin/_lib/businessWorkspaceData.ts");
check("getBusinessWorkspaceDetail shapes/redacts contact values by capability BEFORE returning — not left for the page to hide", () => {
  assert.ok(dataText.includes('hasCapability(actor.capabilities, "view_private_contacts")'), "must gate on the actor's real capability set");
  assert.ok(/contactsRaw\.map\(\(c\) => \(\{ \.\.\.c, value: REDACTED, normalizedValue: REDACTED \}\)\)/.test(dataText), "must overwrite the value fields server-side, not just flag them");
});
check("Every write function requires a StrictSalesActor argument — no function accepts a bare actor email string", () => {
  for (const fn of ["export async function updateSalesStatus", "export async function createSalesNote", "export async function upsertCurrentFollowUp", "export async function completeFollowUp", "export async function markFollowUpStatus", "export async function getOrCreateSalesProfile"]) {
    const idx = dataText.indexOf(fn);
    assert.ok(idx >= 0, `${fn} not found`);
    const signatureLine = dataText.slice(idx, dataText.indexOf(")", dataText.indexOf(")", idx) + 1) + 1);
    assert.ok(signatureLine.includes("actor: StrictSalesActor") || signatureLine.includes("actor,"), `${fn} must take a StrictSalesActor, found: ${signatureLine}`);
  }
  assert.ok(!/actorEmail: string/.test(dataText), "no write function may accept a bare actorEmail: string");
});
check("Notes and follow-up creation reject an empty/whitespace-only body or purpose before any write is attempted", () => {
  assert.ok(/if \(!trimmedBody\) return \{ ok: false, error: "empty_body" \};/.test(dataText));
  assert.ok(/if \(!trimmedPurpose\) return \{ ok: false, error: "empty_purpose" \};/.test(dataText));
});
check("Every mutation writes a business_sales_audit_log row via writeAuditLog(), attributed to the real actor", () => {
  const auditCallCount = (dataText.match(/await writeAuditLog\(actor,/g) ?? []).length;
  assert.ok(auditCallCount >= 6, `expected at least 6 audit-log call sites (note create, status change, follow-up create/complete/cancel/waiting), found ${auditCallCount}`);
  assert.ok(dataText.includes("actor_roster_id: actor.rosterId"));
  assert.ok(dataText.includes("actor_email: actor.email"));
});
check("No placeholder/system actor string anywhere in the data module", () => {
  for (const forbidden of ["unattributed@leonix-admin", "system@leonix-admin", "UNATTRIBUTED_ACTOR"]) {
    assert.ok(!dataText.includes(forbidden), `businessWorkspaceData.ts must not contain "${forbidden}"`);
  }
});

// --- Every Sales Workspace API route is independently gated, with a capability check beyond the
// bare access check, and never falls back to the legacy cookie-only pattern -----------------------
const routeFiles = [
  "app/api/admin/businesses/route.ts",
  "app/api/admin/businesses/[businessId]/route.ts",
  "app/api/admin/businesses/[businessId]/notes/route.ts",
  "app/api/admin/businesses/[businessId]/follow-up/route.ts",
];
check("Every app/api/admin/businesses/** route handler calls requireSalesWorkspaceAccess() — never just the bare cookie check other admin routes use", () => {
  for (const rel of routeFiles) {
    const text = read(rel);
    const handlerCount = (text.match(/export async function (GET|POST|PATCH|PUT|DELETE)/g) ?? []).length;
    const guardCount = (text.match(/requireSalesWorkspaceAccess\(\)/g) ?? []).length;
    assert.ok(handlerCount > 0, `${rel} has no exported route handler`);
    assert.ok(guardCount >= handlerCount, `${rel} has ${handlerCount} handler(s) but only ${guardCount} requireSalesWorkspaceAccess() call(s) — every handler must gate itself, not rely on the page layout alone`);
    assert.ok(!text.includes("requireAdminCookie"), `${rel} must not fall back to the bare cookie-only pattern`);
  }
});
check("Mutating routes (POST/PATCH) each check a specific capability beyond bare access — a sales rep cannot archive a record via the status route", () => {
  const detailRoute = read("app/api/admin/businesses/[businessId]/route.ts");
  assert.ok(detailRoute.includes('actorHasCapability(access.actor, "update_sales_status")'));
  assert.ok(detailRoute.includes('actorHasCapability(access.actor, "archive_sales_record")'), "archiving must require its own, stricter capability check even inside the status-update route");
  const notesRoute = read("app/api/admin/businesses/[businessId]/notes/route.ts");
  assert.ok(notesRoute.includes('actorHasCapability(access.actor, "create_internal_note")'));
  const followUpRoute = read("app/api/admin/businesses/[businessId]/follow-up/route.ts");
  assert.ok(followUpRoute.includes('actorHasCapability(access.actor, "create_follow_up")'));
});
check("Denial responses use denialStatusCode() (handles all eight SalesWorkspaceDenialReason values, including the BCO-4A.7 identity-binding reasons) — not a two-way ternary that only knows about two", () => {
  for (const rel of routeFiles) {
    const text = read(rel);
    assert.ok(text.includes("denialStatusCode(access.reason)"), `${rel} must use denialStatusCode(), which maps all six SalesWorkspaceDenialReason values`);
  }
});
check("Both admin/businesses pages call requireSalesWorkspaceAccess(), check a capability, and redirect when denied", () => {
  const listPage = read("app/admin/(dashboard)/businesses/page.tsx");
  const detailPage = read("app/admin/(dashboard)/businesses/[businessId]/page.tsx");
  for (const text of [listPage, detailPage]) {
    assert.ok(text.includes("requireSalesWorkspaceAccess()"));
    assert.ok(text.includes("redirect("));
    assert.ok(text.includes("actorHasCapability(access.actor,"));
  }
});
check("Admin business detail formats phones via the server-safe phoneDisplay helper, never a \"use client\" module", () => {
  const detailPage = read("app/admin/(dashboard)/businesses/[businessId]/page.tsx");
  const phoneDisplay = read("app/lib/business/phoneDisplay.ts");
  assert.ok(!/^\s*["']use client["']/.test(phoneDisplay), "phoneDisplay.ts must not be a client module");
  assert.ok(phoneDisplay.includes("export function formatUsPhoneForDisplay"));
  assert.ok(detailPage.includes('from "@/app/lib/business/phoneDisplay"'));
  assert.ok(!detailPage.includes("Step6ContactsProfiles"), "server page must not import formatUsPhoneForDisplay from the client Step 6 module");
});
check("getAdminSupabase() (service-role) is never imported by a client component — no service-role write path is exposed to the browser", () => {
  const actionsText = read("app/admin/(dashboard)/businesses/[businessId]/BusinessWorkspaceActions.tsx");
  assert.ok(actionsText.startsWith('"use client";'));
  assert.ok(!actionsText.includes("getAdminSupabase"));
  assert.ok(!actionsText.includes("server-only"));
});
check("businessWorkspaceData.ts and businessWorkspaceAccess.ts are server-only modules (import \"server-only\") — cannot be pulled into a client bundle", () => {
  assert.ok(dataText.includes('import "server-only";'));
  assert.ok(accessText.includes('import "server-only";'));
});

// --- Sales-rep reachability (nav wiring) ----------------------------------------------------------
const staffAccessText = read("app/admin/_lib/staffSalesAllowedAdminPath.ts");
check("isStaffSalesAllowedAdminPath: sales_rep role can reach /admin/businesses (the whole point of the role)", () => {
  assert.ok(staffAccessText.includes('pathname.startsWith("/admin/businesses")'));
  assert.equal(isStaffSalesAllowedAdminPath("/admin/businesses"), true);
});
check("isStaffSalesAllowedAdminPath: sales_rep can reach Field Agent /admin/field and /admin/field/[businessId]", () => {
  assert.equal(isStaffSalesAllowedAdminPath("/admin/field"), true);
  assert.equal(isStaffSalesAllowedAdminPath("/admin/field/abc-123"), true);
});
check("isStaffSalesAllowedAdminPath: sales_rep is still denied unrelated admin routes", () => {
  assert.equal(isStaffSalesAllowedAdminPath("/admin/clasificados"), false);
  assert.equal(isStaffSalesAllowedAdminPath("/admin/tienda"), false);
  assert.equal(isStaffSalesAllowedAdminPath("/admin/usuarios"), false);
  assert.equal(isStaffSalesAllowedAdminPath("/admin/leads/inbox"), false);
});
const adminAccessControlText = read("app/admin/_lib/adminAccessControl.ts");
check("getAllowedGlobalNavHrefs: /admin/businesses is allowed for both the sales_rep branch and the full-access branch", () => {
  assert.ok(/return \["\/admin\/team", "\/admin\/support", "\/admin\/businesses"\]/.test(adminAccessControlText));
  assert.ok(/const hrefs = \["\/admin", "\/admin\/businesses"\]/.test(adminAccessControlText));
});

// --- Migration: schema safety ----------------------------------------------------------------------
const migrationText = read("supabase/migrations/20260731220000_admin_roster_foundation_and_sales_workspace.sql");
check("Migration: all four tables enable RLS", () => {
  for (const table of ["business_sales_profiles", "business_sales_notes", "business_follow_ups", "business_sales_audit_log"]) {
    assert.ok(migrationText.includes(`ALTER TABLE public.${table} ENABLE ROW LEVEL SECURITY;`), `${table} must enable RLS`);
  }
});
check("Migration: RLS is enabled with zero policies on every table (deny-all for anon/authenticated) — no GRANT/POLICY statement re-opens anon/authenticated access", () => {
  assert.ok(!/CREATE POLICY/i.test(migrationText), "no policy should exist — service role bypasses RLS, anon/authenticated must get zero rows");
  // Gate BCO-4A.6: the migration now legitimately GRANTs explicit DML to service_role (owner-proven
  // live on staging — see verify-admin-roster-foundation-01.ts for the full grant-hardening
  // checks). What must never happen is a GRANT reaching anon/authenticated/PUBLIC.
  const grantLines = migrationText.match(/GRANT [^;]*;/g) ?? [];
  for (const line of grantLines) {
    assert.ok(!/\bTO[^;]*\b(anon|authenticated|PUBLIC)\b/i.test(line), `GRANT line must never target anon/authenticated/PUBLIC: ${line}`);
  }
});
check("Migration: every status/type/method/outcome/action column is CHECK-bounded, never free text", () => {
  assert.ok(/status text NOT NULL DEFAULT 'new' CHECK/.test(migrationText));
  assert.ok(/note_type text NOT NULL CHECK/.test(migrationText));
  assert.ok(/status text NOT NULL DEFAULT 'scheduled' CHECK/.test(migrationText));
  assert.ok(/action text NOT NULL CHECK \(action IN \(/.test(migrationText));
  assert.ok(/record_type text NOT NULL CHECK \(record_type IN \(/.test(migrationText));
});
check("Migration: actor attribution is a real FK into admin_team_members(id), NOT NULL, no free-text-only column and no default that could paper over a missing actor", () => {
  const actorFkPattern = /(created_by_roster_id|updated_by_roster_id|author_roster_id|actor_roster_id) uuid NOT NULL REFERENCES public\.admin_team_members\(id\)/g;
  const matches = migrationText.match(actorFkPattern) ?? [];
  assert.ok(matches.length >= 5, `expected at least 5 actor-roster FK columns across all 4 tables, found ${matches.length}`);
  assert.ok(!/created_by_operator_email text NOT NULL/.test(migrationText), "old free-text actor column must not exist");
  assert.ok(!/author_operator_email text NOT NULL/.test(migrationText), "old free-text actor column must not exist");
});
check("Migration: at most one current follow-up per business is enforced by a partial unique index, not just app code", () => {
  assert.ok(migrationText.includes("business_follow_ups_one_current_per_business"));
  assert.ok(migrationText.includes("CREATE UNIQUE INDEX"));
  assert.ok(/WHERE status IN \('scheduled', 'due_today', 'overdue', 'waiting_on_owner'\)/.test(migrationText));
});
check("Migration: business_sales_audit_log has the required columns and both its access-pattern indexes", () => {
  assert.ok(migrationText.includes("CREATE TABLE IF NOT EXISTS public.business_sales_audit_log"));
  for (const col of ["action text NOT NULL CHECK", "business_id uuid NOT NULL REFERENCES public.businesses(id)", "record_type text NOT NULL CHECK", "record_id uuid NULL", "actor_roster_id uuid NOT NULL REFERENCES public.admin_team_members(id)", "actor_auth_user_id uuid NOT NULL", "actor_email text NOT NULL", "actor_role text NOT NULL", "metadata jsonb NOT NULL DEFAULT '{}'::jsonb"]) {
    assert.ok(migrationText.includes(col), `business_sales_audit_log missing column definition: ${col}`);
  }
  assert.ok(migrationText.includes("business_sales_audit_log_business_id_idx"));
  assert.ok(migrationText.includes("business_sales_audit_log_actor_idx"));
});
check("Migration: metadata never duplicates a raw note body (documented, not just implied)", () => {
  assert.ok(/never the\s*-- raw note body duplicated here/i.test(migrationText) || migrationText.toLowerCase().includes("never the raw note body"));
});
check("Migration: additive only — no ALTER/DROP touching any existing table other than the intentional admin_team_members enrichment (ADD COLUMN IF NOT EXISTS / guarded ADD CONSTRAINT / ENABLE RLS only, no DROP/ALTER COLUMN TYPE)", () => {
  assert.ok(!/ALTER TABLE public\.businesses\b/.test(migrationText));
  const teamMemberAlters = migrationText.match(/ALTER TABLE public\.admin_team_members[^;]*;/g) ?? [];
  for (const stmt of teamMemberAlters) {
    assert.ok(/ADD COLUMN IF NOT EXISTS|ADD CONSTRAINT|ENABLE ROW LEVEL SECURITY/.test(stmt), `unexpected admin_team_members ALTER shape: ${stmt}`);
  }
  assert.ok(!/DROP TABLE/i.test(migrationText));
  assert.ok(!/DROP COLUMN/i.test(migrationText));
});
check("Migration: never touches the feature-flag table — enablement state is untouched by this package", () => {
  assert.ok(!migrationText.includes("business_identity_flags"));
});
check("Migration: no production-specific value (project ref, real credential, seeded row) appears in the DDL", () => {
  assert.ok(!migrationText.includes("xuieateniufcrsfdomwl"));
  assert.ok(!/INSERT INTO/i.test(migrationText), "an additive schema migration should not seed data rows");
});

// --- Deterministic, not AI; no automation ----------------------------------------------------------
const logicText = read("app/admin/_lib/salesWorkspaceLogic.ts");
check("salesWorkspaceLogic: no AI/model call — purely deterministic rule functions", () => {
  assert.ok(!/openai|anthropic|generateText|chat\.completions|fetch\(.*api\..*ai/i.test(logicText));
});
check("businessWorkspaceData: no email/SMS send call anywhere in this package's data layer", () => {
  assert.ok(!/sendEmail|sendSms|twilio|sendgrid|resend\.emails/i.test(dataText));
});

// --- Data contract doc completeness -----------------------------------------------------------------
const contractText = read("docs/sales-business-workspace-data-contract-01.md");
check("Data contract doc documents all four tables, the capability matrix, and the resolved authorization model", () => {
  for (const table of ["business_sales_profiles", "business_sales_notes", "business_follow_ups", "business_sales_audit_log"]) {
    assert.ok(contractText.includes(`\`${table}\``), `missing documentation for ${table}`);
  }
  assert.ok(contractText.toLowerCase().includes("never shown to owner"));
  assert.ok(contractText.includes("StrictSalesActor"));
  assert.ok(contractText.includes("assigned_roster_id"), "must document the assignment-model gap using the current column name");
  assert.ok(!contractText.includes("assigned_operator_email"), "must not reference the old free-text column name");
  assert.ok(!contractText.includes("unattributed@leonix-admin") || contractText.toLowerCase().includes("resolved"), "the old placeholder pattern must be documented as resolved, not presented as current behavior");
});

// --- Gate 01: Staff Command Center (read model + shell, no new table) --------------------------------
check("composeStaffConciergeHome: overdue and due_today come from real follow-up status only", () => {
  const home = composeStaffConciergeHome([
    { business: { id: "b1", displayName: "Overdue Cafe" }, salesStatus: "contacted", nextFollowUpDate: "2026-08-01", nextFollowUpStatus: "overdue" },
    { business: { id: "b2", displayName: "Due Today Shop" }, salesStatus: "follow_up_due", nextFollowUpDate: "2026-08-21", nextFollowUpStatus: "due_today" },
    { business: { id: "b3", displayName: "Quiet Bakery" }, salesStatus: "new", nextFollowUpDate: null, nextFollowUpStatus: null },
  ]);
  assert.equal(home.overdueFollowUps.length, 1);
  assert.equal(home.overdueFollowUps[0]?.businessId, "b1");
  assert.equal(home.dueFollowUps.length, 1);
  assert.equal(home.dueFollowUps[0]?.businessId, "b2");
  assert.equal(home.attentionBusinesses.length, 2);
});
check("composeStaffConciergeHome: empty lists stay empty — no fake counts", () => {
  const home = composeStaffConciergeHome([]);
  assert.equal(home.dueFollowUps.length, 0);
  assert.equal(home.overdueFollowUps.length, 0);
  assert.equal(home.attentionBusinesses.length, 0);
  assert.equal(home.recentBusinesses.length, 0);
});
check("composeStaffConciergeHome: the same business is not double-counted in Today headline metrics", () => {
  const home = composeStaffConciergeHome([
    { business: { id: "b1", displayName: "One Shop" }, salesStatus: "follow_up_due", nextFollowUpDate: "2026-08-01", nextFollowUpStatus: "overdue" },
  ]);
  assert.equal(home.overdueFollowUps.length, 1);
  assert.equal(home.dueFollowUps.length, 0);
  assert.equal(home.attentionBusinesses.length, 1);
  assert.equal(home.attentionBusinesses[0]?.businessId, "b1");
});

const commandCenterPage = read("app/admin/(dashboard)/businesses/page.tsx");
const commandCenterUi = read("app/admin/(dashboard)/businesses/StaffCommandCenter.tsx");
const adminHomeDash = read("app/admin/_components/AdminCommandCenterDashboard.tsx");
const manifestText = read("app/manifest.ts");
check("Gate 01: /admin/businesses is the Staff Command Center and still loads business inventory", () => {
  assert.ok(commandCenterPage.includes("StaffCommandCenter"));
  assert.ok(commandCenterPage.includes("listBusinessesForWorkspace"));
  assert.ok(commandCenterPage.includes('id="businesses-inventory"'));
  assert.ok(commandCenterUi.includes("Leonix Business Concierge"));
  assert.ok(commandCenterUi.includes("Staff Command Center"));
});
check("Gate 01: Command Center crest is /logo-clean.png and never the locked title banner", () => {
  assert.ok(commandCenterUi.includes('src="/logo-clean.png"'));
  assert.ok(!commandCenterUi.includes("title_banner_leonix.png"));
  assert.ok(!commandCenterPage.includes("title_banner_leonix.png"));
});
check("Gate 01: Quick actions use real routes only (inventory, canvass, Field Agent)", () => {
  assert.ok(commandCenterUi.includes('href="#businesses-inventory"'));
  assert.ok(commandCenterUi.includes('href="/admin/businesses/canvass"'));
  assert.ok(commandCenterUi.includes('href="/admin/field"'));
});
check("Gate 01: install banner remains on the Command Center", () => {
  assert.ok(commandCenterUi.includes("BusinessConciergeInstallBanner"));
});
check("Gate 01: Admin home Concierge card is live and links to /admin/businesses", () => {
  assert.ok(adminHomeDash.includes("Open Business Concierge"));
  assert.ok(adminHomeDash.includes('href: "/admin/businesses"'));
  assert.ok(!adminHomeDash.includes("Future paid service queue"));
  assert.ok(!adminHomeDash.includes("No live concierge table yet"));
});
check("Gate 01: PWA identity is Leonix Business Concierge with start_url /admin/businesses", () => {
  assert.ok(manifestText.includes('name: "Leonix Business Concierge"'));
  assert.ok(manifestText.includes('short_name: "Leonix Concierge"'));
  assert.ok(manifestText.includes('start_url: "/admin/businesses"'));
});
check("Gate 01: staffConciergeHome is a pure read model — no DB writes, no new table", () => {
  const homeLib = read("app/admin/_lib/staffConciergeHome.ts");
  assert.ok(!/\.from\(/.test(homeLib));
  assert.ok(!/CREATE TABLE/i.test(homeLib));
  assert.ok(!/insert\(/i.test(homeLib));
});

const detailPageGate02 = read("app/admin/(dashboard)/businesses/[businessId]/page.tsx");
const dashboardNav = read("app/admin/(dashboard)/businesses/[businessId]/BusinessDashboardNav.tsx");
check("Gate 02: business detail remains a server component (no use client on the page)", () => {
  assert.ok(!/^\s*["']use client["']/.test(detailPageGate02));
  assert.ok(detailPageGate02.includes("requireSalesWorkspaceAccess()"));
});
check("Gate 02: Business Dashboard identity exists and is not merely Sales workspace", () => {
  assert.ok(detailPageGate02.includes("Business Dashboard"));
  assert.ok(detailPageGate02.includes("Business Concierge"));
  assert.ok(!detailPageGate02.includes('eyebrow="Sales workspace"'));
  assert.ok(!detailPageGate02.includes('eyebrow={business.publicName && business.publicName !== business.displayName ? `Public name: ${business.publicName}` : "Sales workspace"}'));
});
check("Gate 02: local navigation exists with the required section anchors", () => {
  assert.ok(dashboardNav.includes('"use client"'));
  assert.ok(dashboardNav.includes("BusinessDashboardNav"));
  for (const id of ["overview", "business-book", "health", "outreach", "discover", "meetings", "opportunity", "creative", "decide", "promises", "outcomes"]) {
    assert.ok(detailPageGate02.includes(`id="${id}"`), `missing section id ${id}`);
  }
  assert.ok(read("app/admin/(dashboard)/businesses/[businessId]/RecommendJourney.tsx").includes('id="recommend"'));
});
check("Gate 02: existing domain panels remain rendered on the detail page", () => {
  assert.ok(detailPageGate02.includes("from \"./LivingBusinessBookActions\""));
  assert.ok(detailPageGate02.includes("from \"./HealthMapActions\""));
  assert.ok(detailPageGate02.includes("<FollowUpPanel"));
  assert.ok(detailPageGate02.includes("<NotesPanel"));
  assert.ok(detailPageGate02.includes("from \"./FieldDiscoveryActions\""));
  assert.ok(detailPageGate02.includes("from \"./MeetingJourney\""));
  assert.ok(detailPageGate02.includes("from \"./RecommendJourney\""));
  assert.ok(detailPageGate02.includes("from \"./OpportunityActions\""));
  assert.ok(detailPageGate02.includes("from \"./CreativeJourney\""));
  assert.ok(detailPageGate02.includes("from \"./ProposalActions\""));
  assert.ok(detailPageGate02.includes("from \"./PromiseKeeperActions\""));
  assert.ok(detailPageGate02.includes("<OutcomesPanel"));
  assert.ok(detailPageGate02.includes("<AdvisorPanel"));
  assert.ok(detailPageGate02.includes("<AssistantPanel"));
  assert.ok(detailPageGate02.includes("isOutcomesEnabled"));
  assert.ok(detailPageGate02.includes("isAdvisorEnabled"));
  assert.ok(detailPageGate02.includes("isAssistantEnabled"));
});
check("Gate 02: Field Agent business link and no duplicate Concierge route", () => {
  assert.ok(detailPageGate02.includes("href={`/admin/field/${business.id}`}"));
  assert.ok(!detailPageGate02.includes("/admin/business-concierge"));
  assert.ok(detailPageGate02.includes('from "@/app/lib/business/phoneDisplay"'));
});

const fieldHomeGate03 = read("app/admin/field/page.tsx");
const fieldBusinessGate03 = read("app/admin/field/[businessId]/page.tsx");
const fieldIdentityGate03 = read("app/admin/field/FieldAgentIdentity.tsx");
const fieldDictationGate03 = read("app/admin/field/[businessId]/FieldAgentDictationSection.tsx");
const fieldComponentsGate03 = read("app/admin/field/FieldAgentComponents.tsx");
check("Gate 03: Field Agent home brands as Business Concierge mode and links to Staff Command Center", () => {
  assert.ok(fieldIdentityGate03.includes("Business Concierge"));
  assert.ok(fieldIdentityGate03.includes("Field Agent"));
  assert.ok(fieldHomeGate03.includes("FieldAgentHomeHeader"));
  assert.ok(fieldIdentityGate03.includes('href="/admin/businesses"'));
  assert.ok(fieldHomeGate03.includes("listBusinessesForWorkspace"));
  assert.ok(!fieldHomeGate03.includes("/admin/business-concierge"));
});
check("Gate 03: Field business page links to Business Dashboard with the same business ID", () => {
  assert.ok(fieldIdentityGate03.includes("Open Business Dashboard"));
  assert.ok(fieldIdentityGate03.includes("`/admin/businesses/${businessId}`"));
  assert.ok(fieldComponentsGate03.includes("`/admin/businesses/${businessId}`"));
  assert.ok(fieldBusinessGate03.includes("FieldAgentDictationSection businessId={businessId}"));
});
check("Gate 03: Field note save destination is Living Book evidence and not a verified fact", () => {
  assert.ok(fieldDictationGate03.includes("Living Business Book evidence"));
  assert.ok(fieldDictationGate03.includes("does not automatically become a verified business fact"));
  assert.ok(fieldDictationGate03.includes('evidenceType: "staff_note"'));
  assert.ok(!fieldDictationGate03.includes("business_sales_notes"));
  assert.ok(fieldDictationGate03.includes('setTranscript("")'));
  assert.ok(fieldDictationGate03.indexOf("setError(String(body?.error") < fieldDictationGate03.indexOf('setTranscript("")'));
});
check("Gate 03: recent notes reuse existing evidence repository; follow-up is Outreach only", () => {
  assert.ok(fieldBusinessGate03.includes("listEvidenceForBusiness"));
  assert.ok(!fieldBusinessGate03.includes("CREATE TABLE"));
  assert.ok(fieldComponentsGate03.includes("#outreach"));
  assert.ok(!fieldDictationGate03.includes("chrono"));
  assert.ok(!fieldComponentsGate03.includes("MediaRecorder"));
});

const outreachPageGate04 = read("app/admin/(dashboard)/businesses/[businessId]/page.tsx");
const outreachActionsGate04 = read("app/admin/(dashboard)/businesses/[businessId]/BusinessWorkspaceActions.tsx");
const followUpRouteGate04 = read("app/api/admin/businesses/[businessId]/follow-up/route.ts");
const notesRouteGate04 = read("app/api/admin/businesses/[businessId]/notes/route.ts");
check("Gate 04: Outreach section exists with canonical follow-up and sales note UI", () => {
  assert.ok(outreachPageGate04.includes('id="outreach"'));
  assert.ok(outreachPageGate04.includes("<FollowUpPanel"));
  assert.ok(outreachPageGate04.includes("<NotesPanel"));
  assert.ok(outreachPageGate04.includes("business_follow_ups"));
  assert.ok(outreachPageGate04.includes("business_sales_notes"));
  assert.ok(outreachPageGate04.includes("Promise Keeper"));
});
check("Gate 04: follow-up source remains business_follow_ups; no Promise Keeper merge or reminder table", () => {
  assert.ok(followUpRouteGate04.includes("upsertCurrentFollowUp"));
  assert.ok(followUpRouteGate04.includes("getCurrentFollowUp"));
  assert.ok(dataText.includes('.from("business_follow_ups")'));
  assert.ok(dataText.includes("deriveFollowUpDisplayStatus"));
  assert.ok(!outreachPageGate04.includes("business_reminders"));
  assert.ok(!outreachActionsGate04.includes("business_commitments"));
  assert.ok(!outreachActionsGate04.includes("PromiseKeeper"));
  assert.ok(!dataText.includes("CREATE TABLE"));
});
check("Gate 04: owner bootstrap cannot fabricate a sales-note roster write", () => {
  assert.ok(dataText.includes("owner_bootstrap_cannot_write_sales_notes"));
  assert.ok(dataText.includes("isOwnerBootstrapActor(actor)"));
  assert.ok(outreachPageGate04.includes("isOwnerBootstrapActor(access.actor)"));
  assert.ok(outreachActionsGate04.includes("Owner bootstrap cannot write roster-attributed sales notes"));
});
check("Gate 04: contact actions require real values; Field Agent still targets #outreach; no automation", () => {
  assert.ok(outreachPageGate04.includes("{primaryPhone ?"));
  assert.ok(outreachPageGate04.includes("{primaryEmail ?"));
  assert.ok(outreachPageGate04.includes("No verified contact method on file yet."));
  assert.ok(fieldComponentsGate03.includes("#outreach"));
  assert.ok(fieldComponentsGate03.includes("Create Follow-up"));
  assert.ok(!outreachActionsGate04.includes("twilio"));
  assert.ok(!outreachActionsGate04.includes("chrono"));
  assert.ok(!outreachActionsGate04.includes("parseFollowUp"));
  assert.ok(!notesRouteGate04.includes("upsertCurrentFollowUp"));
  assert.ok(commandCenterUi.includes("#outreach"));
});

const meetingPageGate05 = read("app/admin/(dashboard)/businesses/[businessId]/page.tsx");
const meetingJourneyGate05 = read("app/admin/(dashboard)/businesses/[businessId]/MeetingJourney.tsx");
const meetingActionsGate05 = read("app/admin/(dashboard)/businesses/[businessId]/MeetingStudioActions.tsx");
const meetingApiGate05 = read("app/api/admin/businesses/[businessId]/meetings/[meetingId]/route.ts");
const meetingLogicGate05 = read("app/lib/business/meetingStudio/logic.ts");
check("Gate 05: Meetings section remains on the business dashboard with Lion's Cockpit as Meeting Prep", () => {
  assert.ok(meetingPageGate05.includes('id="meetings"'));
  assert.ok(meetingPageGate05.includes("<MeetingJourney"));
  assert.ok(meetingJourneyGate05.includes("Meeting Prep"));
  assert.ok(meetingJourneyGate05.includes("Lion"));
  assert.ok(!meetingJourneyGate05.includes("assembleCockpitBriefing"));
  assert.ok(meetingPageGate05.includes("assembleCockpitBriefing"));
  assert.ok(meetingJourneyGate05.includes("<CreateMeetingForm"));
  assert.ok(meetingJourneyGate05.includes("<MeetingDetailPanel"));
});
check("Gate 05: Meeting Studio capabilities preserved; notes remain notes; transcript is import-only", () => {
  assert.ok(meetingActionsGate05.includes("action: \"add_attendee\""));
  assert.ok(meetingActionsGate05.includes("action: \"record_consent\""));
  assert.ok(meetingActionsGate05.includes("action: \"create_note\""));
  assert.ok(meetingActionsGate05.includes("action: \"import_transcript\""));
  assert.ok(meetingActionsGate05.includes("Import Transcript"));
  assert.ok(meetingActionsGate05.includes("Use a transcript created manually or by an external tool"));
  assert.ok(meetingActionsGate05.includes("Meeting notes remain meeting notes"));
  assert.ok(meetingApiGate05.includes("import_transcript"));
  assert.ok(meetingLogicGate05.includes("isAudioRecordingLive"));
  assert.ok(meetingLogicGate05.includes("return false"));
});
check("Gate 05: no live recorder, no auto fact/commitment/follow-up/proposal/creative promotion", () => {
  assert.ok(meetingActionsGate05.includes("Live meeting recording is not currently available"));
  assert.ok(!meetingActionsGate05.includes("MediaRecorder"));
  assert.ok(!meetingActionsGate05.includes("Whisper"));
  assert.ok(!meetingActionsGate05.includes("Deepgram"));
  assert.ok(!meetingActionsGate05.includes("AssemblyAI"));
  assert.ok(meetingActionsGate05.includes("Promote to Living Book"));
  assert.ok(meetingActionsGate05.includes("action: \"promote_note\""));
  assert.ok(meetingJourneyGate05.includes("do not auto-create"));
  assert.ok(meetingJourneyGate05.includes("#outreach"));
  assert.ok(meetingJourneyGate05.includes("#promises"));
  assert.ok(!meetingJourneyGate05.includes("CREATE TABLE"));
  assert.ok(!meetingActionsGate05.includes("CREATE TABLE"));
  assert.ok(meetingPageGate05.includes("requireSalesWorkspaceAccess"));
});
check("Gate 05: fact/evidence/unknown distinctions and existing status enum remain", () => {
  assert.ok(meetingJourneyGate05.includes("Fact"));
  assert.ok(meetingJourneyGate05.includes("Evidence"));
  assert.ok(meetingJourneyGate05.includes("Unknown"));
  assert.ok(meetingJourneyGate05.includes("Contradiction"));
  assert.ok(meetingJourneyGate05.includes("Meeting note"));
  assert.ok(meetingActionsGate05.includes("planned:"));
  assert.ok(meetingActionsGate05.includes("prepared:"));
  assert.ok(meetingActionsGate05.includes("in_progress:"));
  assert.ok(meetingActionsGate05.includes("completed:"));
  assert.ok(meetingActionsGate05.includes("cancelled:"));
  assert.ok(meetingApiGate05.includes("review_meeting_notes"));
});

const recommendPageGate06 = read("app/admin/(dashboard)/businesses/[businessId]/page.tsx");
const recommendJourneyGate06 = read("app/admin/(dashboard)/businesses/[businessId]/RecommendJourney.tsx");
const stewardshipActionsGate06 = read("app/admin/(dashboard)/businesses/[businessId]/StewardshipActions.tsx");
const opportunityActionsGate06 = read("app/admin/(dashboard)/businesses/[businessId]/OpportunityActions.tsx");
const stewardshipTypesGate06 = read("app/lib/business/stewardship/types.ts");
const stewardshipConstantsGate06 = read("app/lib/business/stewardship/constants.ts");
const opportunityTypesGate06 = read("app/lib/business/opportunity/types.ts");
const opportunityRepoGate06 = read("app/lib/business/opportunity/repository.ts");
const opportunityMatchGate06 = read("app/lib/business/opportunity/matchEngine.ts");
const opportunityCreativeRouteGate06 = read("app/api/admin/businesses/[businessId]/opportunities/[opportunityId]/creative-request/route.ts");
const commandCenterHomeGate06 = read("app/admin/_lib/staffConciergeHome.ts");
const commandCenterUiGate06 = read("app/admin/(dashboard)/businesses/StaffCommandCenter.tsx");
const capabilitiesGate06 = read("app/admin/_lib/salesWorkspaceCapabilities.ts");
check("Gate 06: Stewardship remains the canonical recommendation engine under #recommend", () => {
  assert.ok(recommendPageGate06.includes("<RecommendJourney"));
  assert.ok(recommendJourneyGate06.includes('id="recommend"'));
  assert.ok(recommendJourneyGate06.includes("from \"./StewardshipActions\""));
  assert.ok(recommendJourneyGate06.includes("<CreateRecommendationButton"));
  assert.ok(recommendJourneyGate06.includes("<RecommendationTransitionButtons"));
  assert.ok(recommendJourneyGate06.includes("Next Right Move"));
  assert.ok(!recommendJourneyGate06.includes("CREATE TABLE"));
  assert.ok(!recommendPageGate06.includes("new recommendation engine"));
});
check("Gate 06: six tests, statuses, and recommendation ladder remain canonical with no fake score", () => {
  for (const key of ["need", "readiness", "capacity", "life_alignment", "value", "lion_code"]) {
    assert.ok(stewardshipTypesGate06.includes(`"${key}"`) || stewardshipTypesGate06.includes(`'${key}'`));
  }
  assert.ok(recommendJourneyGate06.includes("Need"));
  assert.ok(recommendJourneyGate06.includes("Readiness"));
  assert.ok(recommendJourneyGate06.includes("Capacity"));
  assert.ok(recommendJourneyGate06.includes("Life alignment"));
  assert.ok(recommendJourneyGate06.includes("Value"));
  assert.ok(recommendJourneyGate06.includes("Lion Code"));
  assert.ok(recommendJourneyGate06.includes("does not infer pass or fail") || recommendJourneyGate06.includes("This page does not infer pass or fail"));
  assert.ok(stewardshipConstantsGate06.includes('"draft", "review_required", "approved"'));
  assert.ok(recommendJourneyGate06.includes("free_owner_action"));
  assert.ok(recommendJourneyGate06.includes("external_specialist_referral"));
  assert.ok(recommendJourneyGate06.includes("no_action_yet"));
  assert.ok(recommendJourneyGate06.includes("External referral"));
  assert.ok(recommendJourneyGate06.includes("No action"));
  assert.ok(recommendJourneyGate06.includes("Leonix sale is not forced"));
  assert.ok(!recommendJourneyGate06.includes("71/100"));
  assert.ok(!recommendJourneyGate06.includes("85% match"));
  assert.ok(!recommendJourneyGate06.includes("A+ opportunity"));
  assert.ok(!recommendJourneyGate06.includes("star rating"));
  assert.ok(recommendJourneyGate06.includes("not a score"));
});
check("Gate 06: OpportunityActions remains canonical; lifecycle unchanged; approved is not client acceptance", () => {
  assert.ok(recommendPageGate06.includes("<OpportunitiesPanel"));
  assert.ok(recommendPageGate06.includes('id="opportunity"'));
  assert.ok(opportunityActionsGate06.includes("Suggested — the system found a plausible fit"));
  assert.ok(opportunityActionsGate06.includes("Approved — staff judges this opportunity worth pursuing"));
  assert.ok(opportunityActionsGate06.includes("Not client acceptance and not confirmed sponsorship"));
  assert.ok(opportunityTypesGate06.includes('"suggested"'));
  assert.ok(opportunityTypesGate06.includes('"reviewed"'));
  assert.ok(opportunityTypesGate06.includes('"approved"'));
  assert.ok(opportunityTypesGate06.includes('"dismissed"'));
  assert.ok(opportunityTypesGate06.includes('"creative_requested"'));
  assert.ok(!opportunityTypesGate06.includes('"accepted"'));
  assert.ok(!opportunityTypesGate06.includes("declined_by_client"));
  assert.ok(!opportunityTypesGate06.includes("contracted"));
  assert.ok(!opportunityTypesGate06.includes("published"));
  assert.ok(opportunityActionsGate06.includes("Request Creative"));
  assert.ok(!opportunityActionsGate06.includes("Send Pitch"));
  assert.ok(!opportunityActionsGate06.includes("Generate Contract"));
  assert.ok(!opportunityActionsGate06.includes("Charge Client"));
  assert.ok(!opportunityActionsGate06.includes("Publish Feature"));
});
check("Gate 06: creative request stays human-triggered; no auto outreach/pricing/payment; Command Center opportunity counts deferred", () => {
  assert.ok(opportunityCreativeRouteGate06.includes('opportunity.lifecycleState !== "approved"'));
  assert.ok(!opportunityActionsGate06.includes("/generate"));
  assert.ok(!opportunityRepoGate06.includes("twilio"));
  assert.ok(!opportunityMatchGate06.includes("generateText"));
  assert.ok(!opportunityMatchGate06.includes("providerRegistry"));
  assert.ok(opportunityActionsGate06.includes("matchReasons"));
  assert.ok(commandCenterHomeGate06.includes("composeStaffConciergeHome"));
  assert.ok(!commandCenterHomeGate06.includes("listOpportunities"));
  assert.ok(!commandCenterUiGate06.includes("Opportunities to review"));
  assert.ok(!commandCenterUiGate06.includes("awaiting creative"));
  assert.ok(!opportunityRepoGate06.includes("listOpportunitiesForWorkspace"));
  assert.ok(opportunityRepoGate06.includes("listOpportunitiesForBusiness"));
  assert.ok(capabilitiesGate06.includes('"view_recommendations"'));
  assert.ok(capabilitiesGate06.includes('"view_opportunities"'));
  assert.ok(capabilitiesGate06.includes('"review_opportunity"'));
  const salesRepMatrix = capabilitiesGate06.slice(capabilitiesGate06.lastIndexOf("sales_rep: ["));
  assert.ok(salesRepMatrix.includes('"view_opportunities"'));
  assert.ok(salesRepMatrix.includes('"view_recommendations"'));
  assert.ok(!salesRepMatrix.includes('"review_opportunity"'));
  assert.ok(!salesRepMatrix.includes('"create_opportunity_creative_request"'));
  assert.ok(!salesRepMatrix.includes('"approve_recommendation"'));
  assert.ok(!salesRepMatrix.includes('"create_recommendation"'));
  assert.ok(!stewardshipActionsGate06.includes("CREATE TABLE"));
  assert.ok(!opportunityActionsGate06.includes("CREATE TABLE"));
  assert.ok(recommendJourneyGate06.includes("No active recommendation."));
  assert.ok(opportunityActionsGate06.includes("No contextual opportunities are waiting for review."));
  assert.ok(opportunityActionsGate06.includes("No approved opportunities are waiting for creative."));
});

const creativePageGate07 = read("app/admin/(dashboard)/businesses/[businessId]/page.tsx");
const creativeJourneyGate07 = read("app/admin/(dashboard)/businesses/[businessId]/CreativeJourney.tsx");
const creativePacketGate07 = read("app/admin/(dashboard)/businesses/[businessId]/CreativeTruthPacket.tsx");
const creativeActionsGate07 = read("app/admin/(dashboard)/businesses/[businessId]/CreativeStudioActions.tsx");
const creativeSnapshotTypesGate07 = read("app/lib/business/creativeStudio/types.ts");
const creativeRepoGate07 = read("app/lib/business/creativeStudio/repository.ts");
const imageGenRouteGate07 = read("app/api/admin/businesses/[businessId]/creative-studio/jobs/[jobId]/generate-image/route.ts");
const encodedCreativeListGate07 = "app/api/admin/businesses/%5BbusinessId%5D/creative-studio/route.ts";
check("Gate 07: Creative Studio remains canonical; Truth Packet reads existing snapshots", () => {
  assert.ok(creativePageGate07.includes("<CreativeJourney"));
  assert.ok(creativeJourneyGate07.includes("from \"./CreativeStudioActions\""));
  assert.ok(creativeJourneyGate07.includes("from \"./CreativeTruthPacket\""));
  assert.ok(creativeJourneyGate07.includes("getLatestSnapshotForJob"));
  assert.ok(creativePacketGate07.includes("Creative Truth Packet"));
  assert.ok(creativePacketGate07.includes("not live-mutating canonical business truth"));
  assert.ok(!creativeJourneyGate07.includes("assembleResearchPacket"));
  assert.ok(creativeRepoGate07.includes("business_creative_input_snapshots"));
  assert.ok(creativeSnapshotTypesGate07.includes("CreativeInputSnapshot"));
  assert.ok(!creativeJourneyGate07.includes("CREATE TABLE"));
  assert.ok(!creativePacketGate07.includes("CREATE TABLE"));
});
check("Gate 07: journey distinctions, no fake score, no auto publish, image button not added", () => {
  assert.ok(creativeJourneyGate07.includes("1. Input — Creative Truth Packet"));
  assert.ok(creativeJourneyGate07.includes("2. Brief — derived working direction"));
  assert.ok(creativeJourneyGate07.includes("3. Create — generate from snapshot + brief"));
  assert.ok(creativeJourneyGate07.includes("4. Review — human assessment"));
  assert.ok(creativeJourneyGate07.includes("5. Export / handoff — not publication"));
  assert.ok(creativeJourneyGate07.includes("Not approved and not published") || creativeJourneyGate07.includes("not approved, not published"));
  assert.ok(creativeJourneyGate07.includes("not confirmed sponsorship"));
  assert.ok(creativeJourneyGate07.includes("Ready for Canva finishing"));
  assert.ok(creativeJourneyGate07.includes("No Canva API is claimed"));
  assert.ok(creativeJourneyGate07.includes("No creative work has been requested yet."));
  assert.ok(creativePacketGate07.includes("No verified creative input snapshot is available."));
  assert.ok(creativeActionsGate07.includes("Creative generation provider is not available."));
  assert.ok(creativeJourneyGate07.includes("No approved export is ready."));
  assert.ok(!creativeActionsGate07.includes("generate-image"));
  assert.ok(!creativeJourneyGate07.includes("generate-image"));
  assert.ok(!creativeJourneyGate07.includes("71/100"));
  assert.ok(imageGenRouteGate07.includes("OPENAI_IMAGE_GENERATION_ENABLED"));
  assert.ok(existsSync(path.resolve(__dirname, "..", encodedCreativeListGate07)));
  assert.ok(!existsSync(path.resolve(__dirname, "..", "app/api/admin/businesses/[businessId]/creative-studio/route.ts")));
  assert.ok(existsSync(path.resolve(__dirname, "..", "app/api/admin/businesses/%5BbusinessId%5D/advisor/route.ts")));
  assert.ok(existsSync(path.resolve(__dirname, "..", "app/api/admin/businesses/%5BbusinessId%5D/assistant/route.ts")));
  assert.ok(existsSync(path.resolve(__dirname, "..", "app/api/admin/businesses/%5BbusinessId%5D/outcomes/route.ts")));
  assert.ok(creativePageGate07.includes("listJobsForBusiness"));
});

const proposalPageGate08 = read("app/admin/(dashboard)/businesses/[businessId]/page.tsx");
const proposalActionsGate08 = read("app/admin/(dashboard)/businesses/[businessId]/ProposalActions.tsx");
const proposalConstantsGate08 = read("app/lib/business/proposals/constants.ts");
const proposalRepoGate08 = read("app/lib/business/proposals/repository.ts");
const opportunityTypesGate08 = read("app/lib/business/opportunity/types.ts");
const commandCenterGate08 = read("app/admin/(dashboard)/businesses/StaffCommandCenter.tsx");
const commandCenterPageGate08 = read("app/admin/(dashboard)/businesses/page.tsx");
const followUpDataGate08 = read("app/admin/_lib/businessWorkspaceData.ts");
check("Gate 08: proposals remain canonical client decision domain; statuses unchanged", () => {
  assert.ok(proposalConstantsGate08.includes('"draft"'));
  assert.ok(proposalConstantsGate08.includes('"accepted"'));
  assert.ok(proposalConstantsGate08.includes('"declined"'));
  assert.ok(!proposalConstantsGate08.includes('"postponed"'));
  assert.ok(!proposalConstantsGate08.includes('"signed"'));
  assert.ok(!proposalConstantsGate08.includes('"paid"'));
  assert.ok(proposalPageGate08.includes('id="proposals"'));
  assert.ok(proposalActionsGate08.includes("Client Decision"));
  assert.ok(proposalActionsGate08.includes("does not mean opportunity approval"));
  assert.ok(!proposalActionsGate08.includes("CREATE TABLE"));
});
check("Gate 08: Owner Handoff is a bounded accepted-proposal read model; follow-up stays canonical", () => {
  assert.ok(proposalRepoGate08.includes("listAcceptedCurrentProposalsForHandoff"));
  assert.ok(proposalRepoGate08.includes('.eq("status", "accepted")'));
  assert.ok(proposalRepoGate08.includes('.eq("is_current", true)'));
  assert.ok(proposalRepoGate08.includes("OWNER_HANDOFF_LIMIT"));
  assert.ok(commandCenterGate08.includes("Owner Handoff"));
  assert.ok(commandCenterGate08.includes("No accepted proposals are waiting for owner handoff."));
  assert.ok(commandCenterGate08.includes("#proposals"));
  assert.ok(commandCenterPageGate08.includes("listAcceptedCurrentProposalsForHandoff"));
  assert.ok(proposalActionsGate08.includes("/api/admin/businesses/${businessId}/follow-up"));
  assert.ok(followUpDataGate08.includes("owner_bootstrap_cannot_write_follow_ups"));
  assert.ok(proposalActionsGate08.includes("A staff roster assignment is required"));
  assert.ok(!opportunityTypesGate08.includes('| "accepted"'));
  assert.ok(!opportunityTypesGate08.includes('| "declined"'));
  assert.ok(!opportunityTypesGate08.includes('| "postponed"'));
  assert.ok(opportunityTypesGate08.includes('"suggested"'));
  assert.ok(opportunityTypesGate08.includes('"creative_requested"'));
  assert.ok(!proposalActionsGate08.includes("docusign"));
  assert.ok(!proposalActionsGate08.includes("stripe"));
  assert.ok(!proposalRepoGate08.includes("CREATE TABLE"));
});

const advisorPanelGate09 = read("app/admin/(dashboard)/businesses/[businessId]/AdvisorPanel.tsx");
const assistantPanelGate09 = read("app/admin/(dashboard)/businesses/[businessId]/AssistantPanel.tsx");
const outcomesPanelGate09 = read("app/admin/(dashboard)/businesses/[businessId]/OutcomesPanel.tsx");
const advisorActionRouteGate09 = read("app/api/admin/businesses/[businessId]/advisor/[signalId]/route.ts");
const assistantThreadRouteGate09 = read("app/api/admin/businesses/[businessId]/assistant/[threadId]/route.ts");
const outcomesRouteGate09 = read("app/api/admin/businesses/[businessId]/outcomes/route.ts");
const advisorRepoGate09 = read("app/lib/business/advisor/repository.ts");
const advisorConstantsGate09 = read("app/lib/business/advisor/constants.ts");
const commandCenterGate09 = read("app/admin/(dashboard)/businesses/StaffCommandCenter.tsx");
const businessesPageGate09 = read("app/admin/(dashboard)/businesses/page.tsx");
const detailPageGate09 = read("app/admin/(dashboard)/businesses/[businessId]/page.tsx");
check("Gate 09: Program 7 dynamic routes resolve; encoded Creative Studio list remains", () => {
  assert.ok(existsSync(path.resolve(__dirname, "..", "app/api/admin/businesses/[businessId]/advisor/route.ts")));
  assert.ok(existsSync(path.resolve(__dirname, "..", "app/api/admin/businesses/[businessId]/assistant/route.ts")));
  assert.ok(existsSync(path.resolve(__dirname, "..", "app/api/admin/businesses/[businessId]/outcomes/route.ts")));
  assert.ok(existsSync(path.resolve(__dirname, "..", "app/api/admin/businesses/%5BbusinessId%5D/creative-studio/route.ts")));
  assert.ok(!existsSync(path.resolve(__dirname, "..", "app/api/admin/businesses/[businessId]/creative-studio/route.ts")));
  assert.ok(outcomesRouteGate09.includes("listBusinessOutcomes(businessId)"));
});
check("Gate 09: Advisor/Assistant identity boundaries; Command Center Advisor is bounded", () => {
  assert.ok(advisorPanelGate09.includes("/api/admin/businesses/${businessId}/advisor/${signalId}"));
  assert.ok(!advisorPanelGate09.includes("/api/admin/businesses/${signalId}/"));
  assert.ok(advisorActionRouteGate09.includes("getSignalById(businessId, signalId)"));
  assert.ok(assistantPanelGate09.includes("/api/admin/businesses/${businessId}/assistant/${threadId}"));
  assert.ok(!assistantPanelGate09.includes("/api/admin/businesses/${threadId}/"));
  assert.ok(assistantThreadRouteGate09.includes("getThreadById(businessId, threadId)"));
  assert.ok(advisorRepoGate09.includes("listActiveSignalsForStaffAttention"));
  assert.ok(advisorRepoGate09.includes("ADVISOR_ATTENTION_LIMIT"));
  assert.ok(commandCenterGate09.includes("No active advisor signals."));
  assert.ok(businessesPageGate09.includes("listActiveSignalsForStaffAttention"));
  assert.ok(detailPageGate09.includes('id="advisor"'));
  assert.ok(detailPageGate09.includes('id="assistant"'));
  assert.ok(advisorConstantsGate09.includes("COMMITMENT_DUE"));
  assert.ok(outcomesPanelGate09.includes("No outcomes have been recorded yet."));
  assert.ok(!advisorActionRouteGate09.includes("CREATE TABLE"));
  assert.ok(!assistantThreadRouteGate09.includes("CREATE TABLE"));
});

// --- No secret / no production reference ------------------------------------------------------------
const gateB_Files = [
  "app/admin/_lib/businessWorkspaceAccess.ts",
  "app/admin/_lib/businessWorkspaceData.ts",
  "app/admin/_lib/salesWorkspaceCapabilities.ts",
  "app/admin/_lib/salesWorkspaceLogic.ts",
  "supabase/migrations/20260731220000_admin_roster_foundation_and_sales_workspace.sql",
  "docs/sales-business-workspace-data-contract-01.md",
  ...routeFiles,
];
check("No secret pattern or the production Supabase ref appears in any Gate B/B.1 file", () => {
  const secretPattern = /sk_live|sk_test_[a-zA-Z0-9]{10}|SUPABASE_SERVICE_ROLE_KEY\s*=\s*[^"'`]|AKIA[0-9A-Z]{16}|-----BEGIN (RSA|EC|OPENSSH) PRIVATE KEY-----|xuieateniufcrsfdomwl/i;
  for (const rel of gateB_Files) {
    assert.ok(!secretPattern.test(read(rel)), `${rel} matched a secret/production-ref pattern`);
  }
});

console.log(`\n${passed} check(s) passed.`);
if (process.exitCode) {
  console.error("\nSome checks FAILED.");
} else {
  console.log("\nAll checks passed.");
}
