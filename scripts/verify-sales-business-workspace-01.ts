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
import { readFileSync } from "node:fs";
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
