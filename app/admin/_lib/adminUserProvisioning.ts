import "server-only";

import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";
import { resolveLeonixSiteOrigin } from "@/app/lib/supabase/adminSession";
import type { AdminPermissionKey } from "@/app/admin/_lib/teamTypes";
import { ALL_ADMIN_PERMISSION_KEYS } from "@/app/admin/_lib/teamTypes";

export type ProvisionAuthUserResult =
  | { ok: true; userId: string; inviteSent: boolean; inviteNote: string | null; passwordSet: boolean }
  | { ok: false; code: "duplicate" | "config" | "auth_error" | "profile_error" | "password_required"; message: string };

const ADMIN_STAFF_ROLES = new Set([
  "super_admin",
  "sales_manager",
  "sales_rep",
  "content_manager",
  "ads_moderator",
  "support_agent",
  "billing_support",
  "magazine_editor",
  "read_only",
]);

const CUSTOMER_ACCOUNT_TYPES = new Set(["personal", "business"]);
const PRIVILEGED_CREATOR_ROLES = new Set(["super_admin"]);

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isAllowedStaffRosterRole(role: string): boolean {
  return ADMIN_STAFF_ROLES.has(role.trim());
}

export function isAllowedCustomerAccountType(accountType: string): boolean {
  return CUSTOMER_ACCOUNT_TYPES.has(accountType.trim().toLowerCase());
}

/** Roles only super_admin roster holders may assign. */
export function isPrivilegedStaffRole(role: string): boolean {
  return role.trim() === "super_admin";
}

export function canAssignStaffRole(creatorRosterRole: string | null, targetRole: string): boolean {
  const target = targetRole.trim();
  if (!isAllowedStaffRosterRole(target)) return false;
  if (isPrivilegedStaffRole(target)) {
    return creatorRosterRole === "super_admin" || creatorRosterRole == null;
  }
  return PRIVILEGED_CREATOR_ROLES.has(creatorRosterRole ?? "") || creatorRosterRole == null;
}

export function parseStaffPermissions(raw: string[]): AdminPermissionKey[] {
  const allowed = new Set<string>(ALL_ADMIN_PERMISSION_KEYS);
  return raw.filter((p): p is AdminPermissionKey => allowed.has(p));
}

async function findAuthUserIdByEmail(
  admin: ReturnType<typeof getAdminSupabase>,
  email: string,
): Promise<string | null> {
  const normalized = normalizeEmail(email);
  for (let page = 1; page <= 20; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error || !data?.users?.length) break;
    const match = data.users.find((u) => (u.email ?? "").trim().toLowerCase() === normalized);
    if (match?.id) return match.id;
    if (data.users.length < 200) break;
  }
  return null;
}

async function sendInviteOrRecovery(
  admin: ReturnType<typeof getAdminSupabase>,
  email: string,
  redirectPath: string,
): Promise<{ inviteSent: boolean; inviteNote: string | null }> {
  const redirectTo = `${resolveLeonixSiteOrigin()}${redirectPath}`;

  const { error: inviteErr } = await admin.auth.admin.inviteUserByEmail(email, { redirectTo });
  if (!inviteErr) {
    return { inviteSent: true, inviteNote: "Supabase invite email sent (requires project SMTP)." };
  }

  const { error: recoveryErr } = await admin.auth.admin.generateLink({
    type: "recovery",
    email,
    options: { redirectTo },
  });

  if (!recoveryErr) {
    return {
      inviteSent: true,
      inviteNote: "Recovery link generated — email delivery depends on Supabase SMTP.",
    };
  }

  return {
    inviteSent: false,
    inviteNote:
      "Auth user exists but invite email could not be sent. Use Supabase Auth dashboard to send password reset.",
  };
}

async function upsertRosterMember(input: {
  email: string;
  displayName?: string | null;
  role: string;
  notes?: string | null;
  permissions: AdminPermissionKey[];
}): Promise<{ ok: true; rosterMemberId: string } | { ok: false; message: string }> {
  const admin = getAdminSupabase();
  const now = new Date().toISOString();
  const email = normalizeEmail(input.email);

  const { error: insertErr } = await admin.from("admin_team_members").insert({
    email,
    display_name: input.displayName?.trim() || null,
    role: input.role,
    is_active: true,
    permissions: input.permissions,
    notes: input.notes?.trim() || null,
    updated_at: now,
  });

  if (!insertErr) {
    const { data: row } = await admin.from("admin_team_members").select("id").eq("email", email).maybeSingle();
    return { ok: true, rosterMemberId: String(row?.id ?? "") };
  }

  if (insertErr.code === "23505") {
    const { data: updated, error: updateErr } = await admin
      .from("admin_team_members")
      .update({
        display_name: input.displayName?.trim() || null,
        role: input.role,
        is_active: true,
        permissions: input.permissions,
        notes: input.notes?.trim() || null,
        updated_at: now,
      })
      .eq("email", email)
      .select("id")
      .maybeSingle();
    if (updateErr || !updated) {
      return { ok: false, message: updateErr?.message ?? "Roster update failed." };
    }
    return { ok: true, rosterMemberId: String((updated as { id: string }).id) };
  }

  return { ok: false, message: insertErr.message };
}

export async function provisionStaffAuthUser(input: {
  email: string;
  displayName?: string | null;
  role: string;
  notes?: string | null;
  permissions?: AdminPermissionKey[];
  passwordSetupMode: "temporary" | "invite";
  temporaryPassword?: string | null;
  updateExistingPassword?: boolean;
  creatorRosterRole?: string | null;
}): Promise<ProvisionAuthUserResult & { rosterMemberId?: string }> {
  if (!isSupabaseAdminConfigured()) {
    return { ok: false, code: "config", message: "Supabase service role is not configured." };
  }

  const email = normalizeEmail(input.email);
  if (!email.includes("@")) {
    return { ok: false, code: "auth_error", message: "Invalid email." };
  }
  if (!canAssignStaffRole(input.creatorRosterRole ?? null, input.role)) {
    return { ok: false, code: "auth_error", message: "You cannot assign this staff role." };
  }

  if (input.passwordSetupMode === "temporary") {
    const pw = input.temporaryPassword?.trim() ?? "";
    if (pw.length < 10) {
      return { ok: false, code: "password_required", message: "Temporary password must be at least 10 characters." };
    }
  }

  const admin = getAdminSupabase();
  const permissions = input.permissions ?? [];
  let userId: string | null = await findAuthUserIdByEmail(admin, email);
  let passwordSet = false;

  if (userId) {
    if (input.passwordSetupMode === "temporary" && input.updateExistingPassword) {
      const pw = input.temporaryPassword!.trim();
      const { error: updErr } = await admin.auth.admin.updateUserById(userId, { password: pw });
      if (updErr) {
        return { ok: false, code: "auth_error", message: updErr.message };
      }
      passwordSet = true;
    } else if (!input.updateExistingPassword) {
      return {
        ok: false,
        code: "duplicate",
        message: "Supabase Auth user already exists. Enable update password or use invite mode.",
      };
    }
  } else if (input.passwordSetupMode === "temporary") {
    const pw = input.temporaryPassword!.trim();
    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email,
      password: pw,
      email_confirm: true,
      user_metadata: {
        leonix_staff: true,
        display_name: input.displayName?.trim() || null,
        staff_role: input.role,
      },
    });
    if (createErr || !created.user?.id) {
      const msg = createErr?.message ?? "Could not create auth user.";
      if (/already|registered|exists|duplicate/i.test(msg)) {
        return { ok: false, code: "duplicate", message: "Auth user already exists." };
      }
      return { ok: false, code: "auth_error", message: msg };
    }
    userId = created.user.id;
    passwordSet = true;
  } else {
    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: {
        leonix_staff: true,
        display_name: input.displayName?.trim() || null,
        staff_role: input.role,
      },
    });
    if (createErr || !created.user?.id) {
      const msg = createErr?.message ?? "Could not create auth user.";
      if (/already|registered|exists|duplicate/i.test(msg)) {
        return { ok: false, code: "duplicate", message: "Auth user already exists." };
      }
      return { ok: false, code: "auth_error", message: msg };
    }
    userId = created.user.id;
  }

  const roster = await upsertRosterMember({
    email,
    displayName: input.displayName,
    role: input.role,
    notes: input.notes,
    permissions,
  });

  if (!roster.ok) {
    return { ok: false, code: "auth_error", message: roster.message };
  }

  let inviteSent = false;
  let inviteNote: string | null = null;
  if (input.passwordSetupMode === "invite") {
    const invite = await sendInviteOrRecovery(admin, email, "/auth/callback?redirect=/admin/login");
    inviteSent = invite.inviteSent;
    inviteNote = invite.inviteNote;
  }

  return {
    ok: true,
    userId: userId!,
    inviteSent,
    inviteNote,
    passwordSet,
    rosterMemberId: roster.rosterMemberId,
  };
}

export async function provisionCustomerAuthUser(input: {
  email: string;
  displayName?: string | null;
  accountType: string;
  sendInvite: boolean;
}): Promise<ProvisionAuthUserResult> {
  if (!isSupabaseAdminConfigured()) {
    return { ok: false, code: "config", message: "Supabase service role is not configured." };
  }

  const email = normalizeEmail(input.email);
  const accountType = input.accountType.trim().toLowerCase();
  if (!email.includes("@")) {
    return { ok: false, code: "auth_error", message: "Invalid email." };
  }
  if (!isAllowedCustomerAccountType(accountType)) {
    return { ok: false, code: "auth_error", message: "Invalid account type." };
  }

  const admin = getAdminSupabase();

  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: {
      display_name: input.displayName?.trim() || null,
      account_type: accountType,
    },
  });

  if (createErr || !created.user?.id) {
    const msg = createErr?.message ?? "Could not create auth user.";
    if (/already|registered|exists|duplicate/i.test(msg)) {
      return { ok: false, code: "duplicate", message: "A Supabase Auth user with this email already exists." };
    }
    return { ok: false, code: "auth_error", message: msg };
  }

  const userId = created.user.id;

  const { error: profileErr } = await admin.from("profiles").upsert(
    {
      id: userId,
      email,
      display_name: input.displayName?.trim() || null,
      account_type: accountType,
      membership_tier: accountType === "business" ? "business_starter" : "personal_free",
    },
    { onConflict: "id" },
  );

  if (profileErr) {
    return { ok: false, code: "profile_error", message: profileErr.message };
  }

  let inviteSent = false;
  let inviteNote: string | null = null;
  if (input.sendInvite) {
    const invite = await sendInviteOrRecovery(admin, email, "/auth/callback?redirect=/dashboard");
    inviteSent = invite.inviteSent;
    inviteNote = invite.inviteNote;
  }

  return { ok: true, userId, inviteSent, inviteNote, passwordSet: false };
}
