import "server-only";

import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";
import { resolveLeonixSiteOrigin } from "@/app/lib/supabase/adminSession";

export type ProvisionAuthUserResult =
  | { ok: true; userId: string; inviteSent: boolean; inviteNote: string | null }
  | { ok: false; code: "duplicate" | "config" | "auth_error" | "profile_error"; message: string };

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

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isAllowedStaffRosterRole(role: string): boolean {
  return ADMIN_STAFF_ROLES.has(role.trim());
}

export function isAllowedCustomerAccountType(accountType: string): boolean {
  return CUSTOMER_ACCOUNT_TYPES.has(accountType.trim().toLowerCase());
}

/** Owner-only: roles staff may never assign via customer flow. */
export function isPrivilegedStaffRole(role: string): boolean {
  const r = role.trim();
  return r === "super_admin" || r === "sales_manager";
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
      inviteNote: "Recovery link generated — Supabase email delivery depends on SMTP configuration.",
    };
  }

  return {
    inviteSent: false,
    inviteNote:
      "Auth user created but invite email could not be sent. Use Supabase Auth dashboard to send password reset.",
  };
}

export async function provisionStaffAuthUser(input: {
  email: string;
  displayName?: string | null;
  role: string;
  sendInvite: boolean;
}): Promise<ProvisionAuthUserResult & { rosterMemberId?: string }> {
  if (!isSupabaseAdminConfigured()) {
    return { ok: false, code: "config", message: "Supabase service role is not configured." };
  }

  const email = normalizeEmail(input.email);
  if (!email.includes("@")) {
    return { ok: false, code: "auth_error", message: "Invalid email." };
  }
  if (!isAllowedStaffRosterRole(input.role)) {
    return { ok: false, code: "auth_error", message: "Invalid staff role." };
  }

  const admin = getAdminSupabase();
  const now = new Date().toISOString();

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
      return { ok: false, code: "duplicate", message: "A Supabase Auth user with this email already exists." };
    }
    return { ok: false, code: "auth_error", message: msg };
  }

  const userId = created.user.id;

  const { error: insertErr } = await admin.from("admin_team_members").insert({
    email,
    display_name: input.displayName?.trim() || null,
    role: input.role,
    is_active: true,
    permissions: [],
    updated_at: now,
  });

  let rosterMemberId: string | undefined;

  if (insertErr) {
    if (insertErr.code === "23505") {
      const { data: updated, error: updateErr } = await admin
        .from("admin_team_members")
        .update({
          display_name: input.displayName?.trim() || null,
          role: input.role,
          is_active: true,
          updated_at: now,
        })
        .eq("email", email)
        .select("id")
        .maybeSingle();
      if (updateErr || !updated) {
        return { ok: false, code: "auth_error", message: updateErr?.message ?? "Roster update failed." };
      }
      rosterMemberId = String((updated as { id: string }).id);
    } else {
      return { ok: false, code: "auth_error", message: insertErr.message };
    }
  } else {
    const { data: row } = await admin.from("admin_team_members").select("id").eq("email", email).maybeSingle();
    rosterMemberId = row?.id != null ? String(row.id) : undefined;
  }

  let inviteSent = false;
  let inviteNote: string | null = null;
  if (input.sendInvite) {
    const invite = await sendInviteOrRecovery(admin, email, "/auth/callback?redirect=/admin/login");
    inviteSent = invite.inviteSent;
    inviteNote = invite.inviteNote;
  }

  return {
    ok: true,
    userId,
    inviteSent,
    inviteNote,
    rosterMemberId,
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

  return { ok: true, userId, inviteSent, inviteNote };
}
