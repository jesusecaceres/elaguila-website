"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { appendAdminAuditLog } from "@/app/admin/_lib/adminAuditLogServer";
import {
  getCurrentAdminAccessContext,
  requireAdminTeamAccess,
} from "@/app/admin/_lib/adminAccessControl";
import {
  isAllowedCustomerAccountType,
  isAllowedStaffRosterRole,
  isPrivilegedStaffRole,
  provisionCustomerAuthUser,
  provisionStaffAuthUser,
} from "@/app/admin/_lib/adminUserProvisioning";
import { canCreateCustomers } from "@/app/admin/_lib/staffAdminAccess";
import { requireLeonixAdminCookie } from "@/app/admin/_lib/leonixAdminGate";

function str(f: FormData, k: string): string {
  const v = f.get(k);
  return typeof v === "string" ? v.trim() : "";
}

function bool(f: FormData, k: string): boolean {
  const v = f.get(k);
  return v === "on" || v === "true" || v === "1";
}

/** Owner-only: create Supabase Auth user + admin_team_members roster row. */
export async function createStaffUserWithAuthAction(formData: FormData) {
  await requireLeonixAdminCookie();
  const access = await getCurrentAdminAccessContext();
  requireAdminTeamAccess(access);

  const email = str(formData, "email").toLowerCase();
  const displayName = str(formData, "display_name") || null;
  const role = str(formData, "role");
  const sendInvite = bool(formData, "send_invite");

  if (!email.includes("@")) {
    redirect("/admin/team/users/new?error=invalid_email");
  }
  if (!isAllowedStaffRosterRole(role)) {
    redirect("/admin/team/users/new?error=invalid_role");
  }

  if (isPrivilegedStaffRole(role) && access.normalizedRole !== "owner_admin") {
    redirect("/admin/team/users/new?error=role_escalation");
  }

  const result = await provisionStaffAuthUser({ email, displayName, role, sendInvite });

  if (!result.ok) {
    if (result.code === "duplicate") {
      redirect("/admin/team/users/new?error=duplicate");
    }
    redirect(`/admin/team/users/new?error=provision&message=${encodeURIComponent(result.message.slice(0, 120))}`);
  }

  await appendAdminAuditLog({
    action: "staff_auth_user_provisioned",
    targetType: "admin_team_members",
    targetId: email,
    meta: { role, inviteSent: result.inviteSent, authUserId: result.userId },
  });

  revalidatePath("/admin/team/roster");
  revalidatePath("/admin/team/users/new");
  redirect(
    `/admin/team/users/new?created=1&invite=${result.inviteSent ? "1" : "0"}&email=${encodeURIComponent(email)}`,
  );
}

/** Staff or owner: create customer Auth user + profiles row (not admin roster). */
export async function createCustomerUserWithAuthAction(formData: FormData) {
  await requireLeonixAdminCookie();
  const access = await getCurrentAdminAccessContext();
  if (!canCreateCustomers(access)) {
    redirect("/admin/team/customers/new?error=forbidden");
  }

  const email = str(formData, "email").toLowerCase();
  const displayName = str(formData, "display_name") || null;
  const accountType = str(formData, "account_type") || "personal";
  const sendInvite = bool(formData, "send_invite");

  if (!email.includes("@")) {
    redirect("/admin/team/customers/new?error=invalid_email");
  }
  if (!isAllowedCustomerAccountType(accountType)) {
    redirect("/admin/team/customers/new?error=invalid_account_type");
  }

  const result = await provisionCustomerAuthUser({ email, displayName, accountType, sendInvite });

  if (!result.ok) {
    if (result.code === "duplicate") {
      redirect("/admin/team/customers/new?error=duplicate");
    }
    redirect(`/admin/team/customers/new?error=provision&message=${encodeURIComponent(result.message.slice(0, 120))}`);
  }

  await appendAdminAuditLog({
    action: "customer_auth_user_provisioned",
    targetType: "profiles",
    targetId: result.userId,
    meta: {
      email,
      accountType,
      inviteSent: result.inviteSent,
      salesRepId: access.salesRepId,
    },
  });

  revalidatePath("/admin/team/customers/new");
  redirect(
    `/admin/team/customers/new?created=1&invite=${result.inviteSent ? "1" : "0"}&email=${encodeURIComponent(email)}`,
  );
}
