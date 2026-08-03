/**
 * Focused tests for Gate BCO-4A.3 (canonical staff roster foundation + corrected Sales Workspace
 * migration). Same hand-rolled node:assert convention as every other verify-*.ts script in this
 * repo. Structural/source-level proof only — this sandbox has no DDL-execution credential for
 * staging (see the BCO-4A.2 owner handoff), so table-existence and constraint-enforcement claims
 * are verified against the migration file's exact text and against the application code that
 * depends on it, not against a live database.
 * Run from repo root: npx tsx scripts/verify-admin-roster-foundation-01.ts
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

console.log("Canonical Staff Roster Foundation (Gate BCO-4A.3) — focused tests\n");

function read(relPath: string): string {
  return readFileSync(path.resolve(__dirname, "..", relPath), "utf8");
}

const MIGRATION_PATH = "supabase/migrations/20260731220000_admin_roster_foundation_and_sales_workspace.sql";
const migrationText = read(MIGRATION_PATH);

// --- Migration structure: admin_team_members ------------------------------------------------------
check("Migration: admin_team_members is created (or patched) before every Sales Workspace table that FKs into it", () => {
  const rosterIdx = migrationText.indexOf("CREATE TABLE IF NOT EXISTS public.admin_team_members");
  const profilesIdx = migrationText.indexOf("CREATE TABLE IF NOT EXISTS public.business_sales_profiles");
  assert.ok(rosterIdx >= 0, "admin_team_members table definition not found");
  assert.ok(profilesIdx >= 0, "business_sales_profiles table definition not found");
  assert.ok(rosterIdx < profilesIdx, "admin_team_members must be defined before the tables that reference it");
});
check("Migration: admin_team_members preserves every column the shipped legacy admin system already reads/writes (email, display_name, role, is_active, permissions, notes, created_at, updated_at)", () => {
  for (const col of ["email text NOT NULL", "display_name text", "role text NOT NULL DEFAULT 'read_only'", "is_active boolean NOT NULL DEFAULT true", "permissions jsonb NOT NULL DEFAULT '[]'::jsonb", "notes text", "created_at timestamptz NOT NULL DEFAULT now()", "updated_at timestamptz NOT NULL DEFAULT now()"]) {
    assert.ok(migrationText.includes(col), `admin_team_members missing legacy column: ${col}`);
  }
});
check("Migration: admin_team_members adds the new security columns (auth_user_id, created_by_auth_user_id, updated_by_auth_user_id), all nullable — the first bootstrapped super_admin has no prior actor to attribute to", () => {
  assert.ok(/auth_user_id uuid NULL/.test(migrationText));
  assert.ok(migrationText.includes("created_by_auth_user_id uuid NULL"));
  assert.ok(migrationText.includes("updated_by_auth_user_id uuid NULL"));
  assert.ok(migrationText.includes("ALTER TABLE public.admin_team_members ADD COLUMN IF NOT EXISTS auth_user_id uuid"), "must also patch an already-existing old-shape table defensively");
  assert.ok(migrationText.includes("ALTER TABLE public.admin_team_members ADD COLUMN IF NOT EXISTS created_by_auth_user_id uuid"));
  assert.ok(migrationText.includes("ALTER TABLE public.admin_team_members ADD COLUMN IF NOT EXISTS updated_by_auth_user_id uuid"));
});
check("Migration: role CHECK constraint uses exactly the 9 role strings actually used across the repo today (confirmed by grep of adminUserProvisioning.ts's ADMIN_STAFF_ROLES, teamTypes.ts's AdminTeamRole, and adminAuthBoundary.ts) — no invented role, and owner_admin (a derived/normalized value, never a stored raw role) is correctly excluded", () => {
  const expectedRoles = ["super_admin", "sales_manager", "sales_rep", "billing_support", "content_manager", "ads_moderator", "support_agent", "magazine_editor", "read_only"];
  const constraintMatch = migrationText.match(/admin_team_members_role_check CHECK \(role IN \(([\s\S]*?)\)\)/);
  assert.ok(constraintMatch, "role CHECK constraint not found");
  const roleListText = constraintMatch![1];
  for (const role of expectedRoles) {
    assert.ok(roleListText.includes(`'${role}'`), `role CHECK missing ${role}`);
  }
  assert.ok(!roleListText.includes("'owner_admin'"), "owner_admin must not appear in the raw role CHECK — it is a normalized/derived value, never a stored roster role");
  const provisioningText = read("app/admin/_lib/adminUserProvisioning.ts");
  for (const role of expectedRoles) {
    assert.ok(provisioningText.includes(`"${role}"`), `${role} in the migration CHECK is not in adminUserProvisioning.ts's ADMIN_STAFF_ROLES — role list would be inconsistent with the actual staff-creation allow-list`);
  }
});
check("Migration: role CHECK and email-not-empty CHECK are added via a guarded DO block (idempotent — Postgres has no ADD CONSTRAINT IF NOT EXISTS for CHECK constraints)", () => {
  assert.ok(/DO \$\$\s*BEGIN\s*IF NOT EXISTS \(\s*SELECT 1 FROM pg_constraint WHERE conname = 'admin_team_members_role_check'/.test(migrationText));
  assert.ok(migrationText.includes("admin_team_members_email_not_empty_check"));
});
check("Migration: email uniqueness is case-insensitive via the exact same index name the legacy 2026-04-08 migration already uses (idempotent regardless of which migration creates the table first)", () => {
  assert.ok(migrationText.includes("CREATE UNIQUE INDEX IF NOT EXISTS admin_team_members_email_lower_idx ON public.admin_team_members (lower(email));"));
});
check("Migration: a CHECK constraint additionally guarantees the stored email value itself is always lowercase (defense-in-depth beyond the case-insensitive unique index) — matches the trim().toLowerCase() normalization every write path in the app already performs", () => {
  assert.ok(migrationText.includes("admin_team_members_email_lowercase_check CHECK (email = lower(email))"));
  const provisioningText = read("app/admin/_lib/adminUserProvisioning.ts");
  assert.ok(provisioningText.includes("email.trim().toLowerCase()"));
});
check("Migration: auth_user_id is unique when present (one auth user per roster row) via a plain unique index, which correctly allows multiple NULLs rather than a partial-index workaround", () => {
  assert.ok(migrationText.includes("CREATE UNIQUE INDEX IF NOT EXISTS admin_team_members_auth_user_id_key ON public.admin_team_members (auth_user_id);"));
  assert.ok(!/admin_team_members_auth_user_id_key[\s\S]{0,20}WHERE/.test(migrationText), "should be a plain unique index, not an unnecessary partial one");
});
check("Migration: admin_team_members enables RLS", () => {
  assert.ok(migrationText.includes("ALTER TABLE public.admin_team_members ENABLE ROW LEVEL SECURITY;"));
});
check("Migration: explicit REVOKE-from-PUBLIC + explicit DML GRANT to service_role (Gate BCO-4A.6, owner-proven live on staging) exists for all six tables — RLS is not the only defense against anon/authenticated direct access", () => {
  const expectedTables = ["admin_team_members", "business_sales_profiles", "business_sales_notes", "business_follow_ups", "business_sales_audit_log", "admin_roster_audit_log"];
  for (const table of expectedTables) {
    assert.ok(migrationText.includes(`REVOKE ALL PRIVILEGES ON TABLE public.${table} FROM PUBLIC;`), `missing explicit REVOKE FROM PUBLIC for ${table}`);
    assert.ok(migrationText.includes(`GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.${table} TO service_role;`), `missing explicit SELECT/INSERT/UPDATE/DELETE GRANT to service_role for ${table}`);
  }
});
check("Migration: GRANT ALL PRIVILEGES is not used as the service_role contract — the exact DML verb list is granted explicitly instead, matching the statement actually proven to restore live staging access", () => {
  assert.ok(!/GRANT ALL PRIVILEGES ON TABLE/.test(migrationText), "GRANT ALL PRIVILEGES must not appear — replaced by the explicit SELECT/INSERT/UPDATE/DELETE grant");
});
check("Migration: every REVOKE FROM PUBLIC is immediately followed by the explicit DML GRANT to service_role on the same table, in that order — REVOKE first (strips the inherited default), GRANT second (restores exactly what service_role needs)", () => {
  const pairs = migrationText.match(/REVOKE ALL PRIVILEGES ON TABLE public\.\w+ FROM PUBLIC;\nGRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public\.\w+ TO service_role;/g) ?? [];
  assert.equal(pairs.length, 6, "every REVOKE FROM PUBLIC must be immediately paired with the DML GRANT to service_role on the same table, in that order");
});
check("Migration: no REVOKE ever targets postgres/service_role as the role being revoked FROM, and no GRANT is ever made to anon/authenticated/PUBLIC", () => {
  const revokeLines = migrationText.match(/REVOKE ALL PRIVILEGES ON TABLE[^;]*;/g) ?? [];
  for (const line of revokeLines) {
    assert.ok(!/\b(postgres|service_role)\b/.test(line), `REVOKE line must never name postgres/service_role as a FROM target: ${line}`);
  }
  const grantLines = migrationText.match(/GRANT [^;]*;/g) ?? [];
  for (const line of grantLines) {
    assert.ok(!/\bTO[^;]*\b(anon|authenticated|PUBLIC)\b/i.test(line), `GRANT line must never target anon/authenticated/PUBLIC: ${line}`);
  }
});
check("Migration: this migration introduces no SERIAL columns / sequences (every id column uses gen_random_uuid()), so no sequence-privilege grant is required or present", () => {
  assert.ok(!/\bSERIAL\b/i.test(migrationText));
  assert.ok(!/CREATE SEQUENCE/i.test(migrationText));
  assert.ok(!/GRANT[^;]*SEQUENCE/i.test(migrationText), "no sequence grant should exist since this migration creates none");
});
check("Migration: every REVOKE/GRANT pair follows its table's ENABLE ROW LEVEL SECURITY — grant hardening is additive to RLS, not a replacement for it, and no permissive policy was introduced alongside it", () => {
  const revokeCount = (migrationText.match(/REVOKE ALL PRIVILEGES ON TABLE/g) ?? []).length;
  const grantCount = (migrationText.match(/GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE/g) ?? []).length;
  const rlsCount = (migrationText.match(/ENABLE ROW LEVEL SECURITY;/g) ?? []).length;
  assert.equal(revokeCount, 6);
  assert.equal(grantCount, 6);
  assert.equal(rlsCount, 6);
  assert.ok(!/CREATE POLICY/i.test(migrationText), "no permissive policy should accompany the grant hardening");
});
check("Migration: no destructive statement anywhere (no DROP, no ALTER COLUMN TYPE, no TRUNCATE, no DELETE)", () => {
  assert.ok(!/DROP TABLE|DROP COLUMN|ALTER COLUMN .* TYPE|TRUNCATE|DELETE FROM/i.test(migrationText));
});
check("Migration: admin_roster_audit_log exists, FKs into admin_team_members for both actor and target, and covers every required action type", () => {
  assert.ok(migrationText.includes("CREATE TABLE IF NOT EXISTS public.admin_roster_audit_log"));
  for (const action of ["staff_row_created", "role_changed", "activated", "deactivated", "auth_user_linked", "display_name_changed", "permissions_changed"]) {
    assert.ok(migrationText.includes(`'${action}'`), `admin_roster_audit_log action CHECK missing ${action}`);
  }
  assert.ok(migrationText.includes("target_roster_id uuid NOT NULL REFERENCES public.admin_team_members(id)"));
  assert.ok(migrationText.includes("actor_roster_id uuid NOT NULL REFERENCES public.admin_team_members(id)"));
  assert.ok(migrationText.includes("ALTER TABLE public.admin_roster_audit_log ENABLE ROW LEVEL SECURITY;"));
});
check("Migration: dependency order is correct — admin_roster_audit_log defined after admin_team_members exists", () => {
  const rosterIdx = migrationText.indexOf("CREATE TABLE IF NOT EXISTS public.admin_team_members");
  const auditIdx = migrationText.indexOf("CREATE TABLE IF NOT EXISTS public.admin_roster_audit_log");
  assert.ok(rosterIdx < auditIdx);
});
check("Migration: no seeded rows, no production reference, no real credential", () => {
  assert.ok(!/INSERT INTO/i.test(migrationText));
  assert.ok(!migrationText.includes("xuieateniufcrsfdomwl"));
  const secretPattern = /sk_live|sk_test_[a-zA-Z0-9]{10}|AKIA[0-9A-Z]{16}|-----BEGIN (RSA|EC|OPENSSH) PRIVATE KEY-----/i;
  assert.ok(!secretPattern.test(migrationText));
});

// --- Safety guards: last-active-super_admin protection + self-deactivation confirmation -----------
const rosterAuditText = read("app/admin/_lib/adminRosterAudit.ts");
check("wouldDeactivateLastSuperAdmin: only blocks when the target IS an active super_admin and is the last one — never blocks deactivating any other role or an already-inactive row", () => {
  assert.ok(rosterAuditText.includes('.eq("role", "super_admin")'));
  assert.ok(rosterAuditText.includes('.eq("is_active", true)'));
  assert.ok(/if \(!target \|\| \(target as \{ role: string \}\)\.role !== "super_admin" \|\| !\(target as \{ is_active: boolean \}\)\.is_active\) \{\s*return false;/.test(rosterAuditText));
});
check("isUnconfirmedSelfDeactivation: only triggers on self + deactivation + missing confirmation — activating, confirmed, or a different actor all pass through", () => {
  assert.ok(/if \(nextActive \|\| confirmed\) return false;/.test(rosterAuditText));
  assert.ok(rosterAuditText.includes("actor.rosterId === targetId"));
});
const teamActionsText = read("app/admin/adminTeamActions.ts");
check("toggleTeamMemberActiveAction calls both guards BEFORE writing to admin_team_members, and redirects with a distinct, user-visible reason for each", () => {
  const guardIdx = Math.max(teamActionsText.indexOf("wouldDeactivateLastSuperAdmin(id"), teamActionsText.indexOf("isUnconfirmedSelfDeactivation(id"));
  const writeIdx = teamActionsText.indexOf("is_active: nextActive");
  assert.ok(guardIdx >= 0 && writeIdx >= 0 && guardIdx < writeIdx, "both guards must run before the is_active write");
  assert.ok(teamActionsText.includes("member_error=last_super_admin"));
  assert.ok(teamActionsText.includes("member_error=confirm_self_deactivate"));
});
check("toggleTeamMemberActiveAction requires an explicit confirm_self_deactivate=1 form field to bypass the self-deactivation guard — it is never satisfied implicitly by a normal deactivate submission", () => {
  assert.ok(teamActionsText.includes('str(formData, "confirm_self_deactivate") === "1"'));
});
const rosterPageText = read("app/admin/(dashboard)/team/roster/page.tsx");
check("Roster page: the self-deactivate confirmation control only renders for the acting operator's own active row — every other row keeps the single-click toggle unchanged", () => {
  assert.ok(rosterPageText.includes("isSelf && member.is_active"));
  assert.ok(rosterPageText.includes('name="confirm_self_deactivate" value="1"'));
  assert.ok(rosterPageText.includes("resolveActingRosterIdentity"));
});
check("Roster page: last-updated timestamp is now shown per roster row (desktop table + mobile cards)", () => {
  assert.ok(rosterPageText.includes("email, display_name, role, is_active, permissions, created_at, updated_at"));
  assert.ok((rosterPageText.match(/m\.updated_at/g) ?? []).length >= 2, "expected updated_at rendered in both the desktop table and the mobile card list");
});

// --- Attributable audit logging, not the legacy no-actor admin_audit_log --------------------------
const legacyAuditText = read("app/admin/_lib/adminAuditLogServer.ts");
check("Confirms the documented root cause: the legacy admin_audit_log insert genuinely has no actor column, which is why a dedicated roster audit table with real FK-based actor attribution was required", () => {
  assert.ok(!/actor|operator_email|auth_user_id/i.test(legacyAuditText), "if this ever gains an actor column, the roster audit design note in the migration should be revisited");
});
check("writeRosterAuditLog: writes actor_roster_id/actor_auth_user_id/actor_email/actor_role to admin_roster_audit_log only when a real roster identity is resolvable — never a placeholder or fabricated actor", () => {
  assert.ok(rosterAuditText.includes("actor_roster_id: actor.rosterId"));
  assert.ok(rosterAuditText.includes("actor_email: actor.email"));
  assert.ok(!/unattributed@|system@leonix-admin|"anonymous"/i.test(rosterAuditText));
});
check("writeRosterAuditLog is called for every required roster action: staff row created, activated/deactivated, permissions changed, role changed (via provisioning upsert)", () => {
  assert.ok(teamActionsText.includes('writeRosterAuditLog("staff_row_created"'));
  assert.ok(teamActionsText.includes('writeRosterAuditLog(nextActive ? "activated" : "deactivated"'));
  assert.ok(teamActionsText.includes('writeRosterAuditLog("permissions_changed"'));
  const provisioningActionsText = read("app/admin/teamProvisioningActions.ts");
  assert.ok(provisioningActionsText.includes("writeRosterAuditLog(result.rosterCreated ? \"staff_row_created\" : \"role_changed\""));
});

// --- Actor attribution threaded through staff provisioning -----------------------------------------
const provisioningText = read("app/admin/_lib/adminUserProvisioning.ts");
check("provisionStaffAuthUser/upsertRosterMember accept and persist creatorAuthUserId into created_by_auth_user_id/updated_by_auth_user_id", () => {
  assert.ok(provisioningText.includes("creatorAuthUserId?: string | null;"));
  assert.ok(provisioningText.includes("created_by_auth_user_id: actorAuthUserId"));
  assert.ok(provisioningText.includes("updated_by_auth_user_id: actorAuthUserId"));
});
const teamProvisioningActionsText = read("app/admin/teamProvisioningActions.ts");
check("createStaffUserWithAuthAction passes the real caller's authUserId (from the resolved AdminAccessContext) through to provisionStaffAuthUser — not a placeholder", () => {
  assert.ok(teamProvisioningActionsText.includes("creatorAuthUserId: access.authUserId"));
});

// --- Sales Workspace foreign keys still valid after the migration rewrite -------------------------
check("Every Sales Workspace actor FK still references public.admin_team_members(id) — the corrected roster table is a drop-in dependency, not a schema break for the already-hardened Sales Workspace tables", () => {
  const fkMatches = migrationText.match(/REFERENCES public\.admin_team_members\(id\)/g) ?? [];
  assert.ok(fkMatches.length >= 8, `expected at least 8 FK references into admin_team_members(id) across business_sales_profiles/notes/follow_ups/business_sales_audit_log/admin_roster_audit_log, found ${fkMatches.length}`);
});

// --- Documentation / other packages must not still name the withdrawn migration file --------------
check("No file in the repo still references the withdrawn 20260719120000 migration filename", () => {
  const candidates = [
    "app/admin/_lib/businessWorkspaceData.ts",
    "scripts/verify-sales-business-workspace-01.ts",
    "docs/sales-business-workspace-data-contract-01.md",
  ];
  for (const rel of candidates) {
    assert.ok(!read(rel).includes("20260719120000"), `${rel} still references the withdrawn migration filename`);
  }
});

console.log(`\n${passed} check(s) passed.`);
if (process.exitCode) {
  console.error("\nSome checks FAILED.");
} else {
  console.log("\nAll checks passed.");
}
