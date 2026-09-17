/**
 * Focused tests for the Systemic Repair Build's Owner Claim / Handoff foundation (migration
 * 20260909120000_business_ownership_claim_foundation.sql + app/lib/business/ownership/**). Same
 * hand-rolled node:assert convention as every other verify-*.ts script in this repo.
 * Structural/source-level proof only — no live database in this sandbox.
 * Run from repo root: npx tsx scripts/verify-business-ownership-claim-01.ts
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

console.log("Owner Claim / Handoff foundation — focused tests\n");

function read(relPath: string): string {
  return readFileSync(path.resolve(__dirname, "..", relPath), "utf8");
}

const MIGRATION_PATH = "supabase/migrations/20260909120000_business_ownership_claim_foundation.sql";
const migrationText = read(MIGRATION_PATH);

// --- Table shape -------------------------------------------------------------------------------
check("Migration: business_ownership_claims table exists with business_id FK to businesses(id) ON DELETE CASCADE", () => {
  assert.ok(migrationText.includes("CREATE TABLE IF NOT EXISTS public.business_ownership_claims"));
  assert.ok(migrationText.includes("business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE"));
});
check("Migration: claim_token_hash is stored (never the raw token) and is unique", () => {
  assert.ok(migrationText.includes("claim_token_hash text NOT NULL"));
  assert.ok(migrationText.includes("business_ownership_claims_token_hash_uk UNIQUE (claim_token_hash)"));
  assert.ok(!/raw_token|plain_token|token_plaintext/i.test(migrationText), "the raw token must never have a persisted column");
});
check("Migration: status is a bounded enum covering the full pending/accepted/expired/revoked lifecycle", () => {
  assert.ok(migrationText.includes("CHECK (status IN ('pending', 'accepted', 'expired', 'revoked'))"));
});
check("Migration: at most one pending claim per business, via a partial unique index (not application logic alone)", () => {
  assert.ok(migrationText.includes("CREATE UNIQUE INDEX IF NOT EXISTS business_ownership_claims_one_pending_per_business_uk"));
  assert.ok(/business_ownership_claims_one_pending_per_business_uk[\s\S]{0,80}WHERE status = 'pending'/.test(migrationText));
});
check("Migration: accepted_* and revoked_* fields are each atomic (all-or-nothing) via CHECK constraints", () => {
  assert.ok(migrationText.includes("business_ownership_claims_accepted_atomic_chk"));
  assert.ok(migrationText.includes("business_ownership_claims_revoked_atomic_chk"));
});
check("Migration: creator attribution columns are NOT NULL (a claim always has a real staff creator) and FK into admin_team_members", () => {
  assert.ok(migrationText.includes("created_by_roster_id uuid NOT NULL REFERENCES public.admin_team_members(id)"));
  assert.ok(migrationText.includes("created_by_auth_user_id uuid NOT NULL"));
});
check("Migration: resulting_membership_id FKs into business_memberships — traceable link from claim to the founding membership it produced", () => {
  assert.ok(migrationText.includes("resulting_membership_id uuid NULL REFERENCES public.business_memberships(id)"));
});

// --- RLS / grants --------------------------------------------------------------------------------
check("Migration: business_ownership_claims enables RLS and revokes from PUBLIC/anon/authenticated/service_role before the narrow explicit grant (deny-all pattern, matching every other Business Concierge table)", () => {
  assert.ok(migrationText.includes("ALTER TABLE public.business_ownership_claims ENABLE ROW LEVEL SECURITY;"));
  for (const role of ["PUBLIC", "anon", "authenticated", "service_role"]) {
    assert.ok(migrationText.includes(`REVOKE ALL PRIVILEGES ON TABLE public.business_ownership_claims FROM ${role};`), `missing REVOKE FROM ${role}`);
  }
  assert.ok(!/CREATE POLICY[\s\S]*business_ownership_claims/i.test(migrationText), "no client policy should exist — deny-all, service-role-only access");
});
check("Migration: service_role gets SELECT/INSERT/UPDATE only — no DELETE grant (claims are status-transitioned, never hard-deleted, for permanent audit history)", () => {
  assert.ok(migrationText.includes("GRANT SELECT, INSERT, UPDATE ON TABLE public.business_ownership_claims TO service_role;"));
  const grantLines = migrationText.match(/^GRANT\b.*business_ownership_claims.*$/gim) ?? [];
  assert.ok(grantLines.length > 0, "expected at least one GRANT statement targeting business_ownership_claims");
  for (const line of grantLines) {
    assert.ok(!/\bDELETE\b/i.test(line), `a GRANT line for business_ownership_claims includes DELETE: ${line}`);
  }
});

// --- The RPC -------------------------------------------------------------------------------------
check("Migration: accept_business_ownership_claim is SECURITY DEFINER with a fixed search_path, exactly matching the finalize_business_identity family's contract", () => {
  const fnMatch = migrationText.match(/CREATE OR REPLACE FUNCTION public\.accept_business_ownership_claim\([\s\S]*?\$\$;/);
  assert.ok(fnMatch, "accept_business_ownership_claim function body not found");
  assert.ok(fnMatch![0].includes("SECURITY DEFINER"));
  assert.ok(fnMatch![0].includes("SET search_path = public"));
});
check("Migration: accept_business_ownership_claim derives identity exclusively from auth.uid() — never a client-supplied user id parameter", () => {
  const fnMatch = migrationText.match(/CREATE OR REPLACE FUNCTION public\.accept_business_ownership_claim\(([\s\S]*?)\)\s*\nRETURNS/);
  assert.ok(fnMatch, "function signature not found");
  assert.ok(!/p_user_id|p_auth_user_id|p_owner_id/.test(fnMatch![1]), "the RPC must never accept a caller-supplied identity parameter");
  assert.ok(migrationText.includes("v_user_id uuid := auth.uid();"));
});
check("Migration: the RPC locks the claim row FOR UPDATE before validating — concurrent redemption attempts serialize instead of racing", () => {
  assert.ok(/SELECT \* INTO v_claim[\s\S]*?FOR UPDATE;/.test(migrationText));
});
check("Migration: the RPC rejects a non-pending or expired claim, an email mismatch, and an already-owned business before writing anything", () => {
  assert.ok(migrationText.includes("claim_not_pending"));
  assert.ok(migrationText.includes("claim_expired"));
  assert.ok(migrationText.includes("claim_email_mismatch"));
  assert.ok(migrationText.includes("business_already_owned"));
});
check("Migration: the RPC inserts exactly one business_memberships row (is_primary_owner=true) and never inserts into businesses — it attaches to the EXISTING business_id, it never creates a new one", () => {
  const fnMatch = migrationText.match(/CREATE OR REPLACE FUNCTION public\.accept_business_ownership_claim[\s\S]*?\$\$;/);
  assert.ok(fnMatch);
  const body = fnMatch![0];
  const insertMatch = body.match(/INSERT INTO public\.business_memberships \(([\s\S]*?)\) VALUES \(([\s\S]*?)\)\s*\n\s*RETURNING/);
  assert.ok(insertMatch, "expected exactly one INSERT INTO business_memberships (...) VALUES (...) RETURNING statement");
  const [, columns, values] = insertMatch!;
  const columnList = columns.split(",").map((c) => c.trim());
  const idx = columnList.indexOf("is_primary_owner");
  assert.ok(idx >= 0, "is_primary_owner must be one of the inserted columns");
  const valueList = values.split(",").map((v) => v.trim());
  assert.equal(valueList[idx], "true", `expected the is_primary_owner value to be literal true, got ${valueList[idx]}`);
  assert.ok(!/INSERT INTO public\.businesses/.test(body), "accept_business_ownership_claim must NEVER insert into businesses — that would duplicate the business");
});
check("Migration: the RPC updates businesses.onboarding_status to 'in_progress' (truthful — required profile fields still need completing) rather than silently marking it 'complete'", () => {
  const fnMatch = migrationText.match(/CREATE OR REPLACE FUNCTION public\.accept_business_ownership_claim[\s\S]*?\$\$;/);
  assert.ok(fnMatch);
  assert.ok(/UPDATE public\.businesses[\s\S]*?onboarding_status = 'in_progress'/.test(fnMatch![0]));
});
check("Migration: EXECUTE is revoked from PUBLIC and granted only to authenticated (owner-facing RPC), matching finalize_business_identity_v3's exact grant convention", () => {
  assert.ok(migrationText.includes("REVOKE ALL ON FUNCTION public.accept_business_ownership_claim(text) FROM PUBLIC;"));
  assert.ok(migrationText.includes("GRANT EXECUTE ON FUNCTION public.accept_business_ownership_claim(text) TO authenticated;"));
});

// --- Feature flag ----------------------------------------------------------------------------------
check("Migration: seeds the business_ownership_claim feature flag, disabled by default, reusing the existing business_identity_flags convention", () => {
  assert.ok(migrationText.includes("INSERT INTO public.business_identity_flags (flag_key, enabled, emergency_disabled, pilot_user_ids)"));
  assert.ok(/VALUES \('business_ownership_claim', false, false, '\{\}'\)/.test(migrationText));
  assert.ok(migrationText.includes("ON CONFLICT (flag_key) DO NOTHING;"));
});

// --- Additive / no destructive statement -----------------------------------------------------------
check("Migration: no destructive statement anywhere (no DROP, no ALTER COLUMN TYPE, no TRUNCATE, no DELETE) and no production reference", () => {
  assert.ok(!/DROP TABLE|DROP COLUMN|ALTER COLUMN .* TYPE|TRUNCATE|DELETE FROM/i.test(migrationText));
  assert.ok(!migrationText.includes("xuieateniufcrsfdomwl"));
});

// --- Application code -------------------------------------------------------------------------------
check("Token helper hashes with SHA-256 and never persists the raw token itself", () => {
  const tokensText = read("app/lib/business/ownership/tokens.ts");
  assert.ok(tokensText.includes("createHash(\"sha256\")"));
  assert.ok(tokensText.includes("randomBytes(32)"));
});
check("Repository's staff-side writes (create/revoke) require a StaffWriteActor (already-guarded real staff), and accept redeems via the CALLER's own client, never the admin client", () => {
  const repoText = read("app/lib/business/ownership/repository.ts");
  assert.ok(/createOwnershipClaim\([\s\S]*?actor: StaffWriteActor/.test(repoText));
  assert.ok(/revokeOwnershipClaim\([\s\S]*?actor: StaffWriteActor/.test(repoText));
  assert.ok(repoText.includes("callerClient.rpc(\"accept_business_ownership_claim\""));
  assert.ok(!repoText.includes("getAdminSupabase().rpc(\"accept_business_ownership_claim\""), "the accept RPC must never be called via the service-role admin client");
});
check("Staff-side API route requires generate_ownership_claim capability and denies bootstrap writes via the canonical guard", () => {
  const routeText = read("app/api/admin/businesses/[businessId]/ownership-claim/route.ts");
  assert.ok(routeText.includes('requireStaffWorkspaceWriteAccess("generate_ownership_claim")'));
});
check("Owner-side accept route resolves identity from a bearer token (never bootstrap, never the admin client) exactly like the existing finalize-v3 route", () => {
  const routeText = read("app/api/business/ownership-claim/accept/route.ts");
  assert.ok(routeText.includes("extractBearerToken"));
  assert.ok(routeText.includes("resolveAuthenticatedUserId"));
  assert.ok(routeText.includes("getServerSupabaseForBearerToken"));
});
check("generate_ownership_claim capability is defined and granted to at least one Sales Workspace role", () => {
  const capsText = read("app/admin/_lib/salesWorkspaceCapabilities.ts");
  assert.ok(capsText.includes('"generate_ownership_claim"'));
});

console.log(`\n${passed} check(s) passed.`);
if (process.exitCode) {
  console.error("\nSome checks FAILED.");
} else {
  console.log("\nAll checks passed.");
}
