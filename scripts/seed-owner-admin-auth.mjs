#!/usr/bin/env node
/**
 * Emergency owner admin seed — Supabase Auth + admin_team_members (super_admin).
 *
 * Run locally with env vars only (never commit passwords):
 *
 *   OWNER_ADMIN_EMAIL="you@example.com" \
 *   OWNER_ADMIN_TEMP_PASSWORD="<set-in-shell>" \
 *   OWNER_ADMIN_RESET_PASSWORD=1 \
 *   npm run seed:owner-admin-auth
 *
 * Requires: NEXT_PUBLIC_SUPABASE_URL (or SUPABASE_URL), SUPABASE_SERVICE_ROLE_KEY
 */
import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

function loadEnvLocal() {
  const envPath = path.join(process.cwd(), ".env.local");
  try {
    const raw = fs.readFileSync(envPath, "utf8");
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq <= 0) continue;
      const key = trimmed.slice(0, eq).trim();
      let val = trimmed.slice(eq + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (process.env[key] == null || process.env[key] === "") {
        process.env[key] = val;
      }
    }
  } catch {
    /* optional */
  }
}

function fail(msg) {
  console.error(`seed-owner-admin-auth: FAIL — ${msg}`);
  process.exit(1);
}

function ok(msg) {
  console.log(`OK: ${msg}`);
}

loadEnvLocal();

const email = (process.env.OWNER_ADMIN_EMAIL ?? "").trim().toLowerCase();
const tempPassword = process.env.OWNER_ADMIN_TEMP_PASSWORD ?? "";
const resetPassword = process.env.OWNER_ADMIN_RESET_PASSWORD === "1";
const displayName = (process.env.OWNER_ADMIN_DISPLAY_NAME ?? "Chuy").trim() || "Chuy";

const url = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL ?? "").trim();
const serviceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "").trim();

if (!email.includes("@")) {
  fail("Missing or invalid OWNER_ADMIN_EMAIL");
}
if (!tempPassword && resetPassword) {
  fail("OWNER_ADMIN_RESET_PASSWORD=1 requires OWNER_ADMIN_TEMP_PASSWORD");
}
if (!url || !serviceKey) {
  fail("Missing NEXT_PUBLIC_SUPABASE_URL (or SUPABASE_URL) and/or SUPABASE_SERVICE_ROLE_KEY");
}

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function findAuthUserIdByEmail(targetEmail) {
  for (let page = 1; page <= 20; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw new Error(error.message);
    if (!data?.users?.length) return null;
    const match = data.users.find((u) => (u.email ?? "").trim().toLowerCase() === targetEmail);
    if (match?.id) return match.id;
    if (data.users.length < 200) break;
  }
  return null;
}

async function main() {
  let userId = await findAuthUserIdByEmail(email);
  let authAction = "unchanged";

  if (!userId) {
    if (!tempPassword) {
      fail("New Auth user requires OWNER_ADMIN_TEMP_PASSWORD");
    }
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: { leonix_staff: true, display_name: displayName, staff_role: "super_admin" },
    });
    if (error || !data.user?.id) {
      fail(`Auth createUser failed: ${error?.message ?? "unknown"}`);
    }
    userId = data.user.id;
    authAction = "created";
    ok(`Supabase Auth user created for ${email}`);
  } else {
    ok(`Supabase Auth user already exists for ${email}`);
    if (resetPassword) {
      const { error } = await admin.auth.admin.updateUserById(userId, { password: tempPassword });
      if (error) fail(`Auth password update failed: ${error.message}`);
      authAction = "password_updated";
      ok("Auth credential updated via Supabase (value not printed)");
    } else {
      ok("Auth credential left unchanged (set OWNER_ADMIN_RESET_PASSWORD=1 to update)");
    }
  }

  const now = new Date().toISOString();
  const { error: insertErr } = await admin.from("admin_team_members").insert({
    email,
    display_name: displayName,
    role: "super_admin",
    is_active: true,
    permissions: [],
    notes: "Emergency owner seed",
    updated_at: now,
  });

  if (insertErr?.code === "23505") {
    const { error: updateErr } = await admin
      .from("admin_team_members")
      .update({
        display_name: displayName,
        role: "super_admin",
        is_active: true,
        updated_at: now,
      })
      .eq("email", email);
    if (updateErr) fail(`Roster upsert failed: ${updateErr.message}`);
    ok("admin_team_members row updated (super_admin, active)");
  } else if (insertErr) {
    fail(`Roster insert failed: ${insertErr.message}`);
  } else {
    ok("admin_team_members row inserted (super_admin, active)");
  }

  console.log("\nseed-owner-admin-auth: SUCCESS");
  console.log(`  email: ${email}`);
  console.log(`  auth_user_id: ${userId}`);
  console.log(`  auth_action: ${authAction}`);
  console.log(`  roster_role: super_admin`);
  console.log("  Next: sign in at /admin/login with email + password (not the shared bootstrap password).");
}

main().catch((e) => fail(e.message ?? String(e)));
