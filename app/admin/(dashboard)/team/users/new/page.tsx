import Link from "next/link";

import { AdminPageHeader } from "../../../../_components/AdminPageHeader";
import { StaffTeamNav } from "../../../../_components/StaffTeamNav";
import { adminCardBase, adminBtnPrimary, adminInputClass } from "../../../../_components/adminTheme";
import { getCurrentAdminAccessContext, requireAdminTeamAccess } from "@/app/admin/_lib/adminAccessControl";
import { canAccessFullAdmin } from "@/app/admin/_lib/staffAdminAccess";
import {
  ALL_ADMIN_PERMISSION_KEYS,
  ROLE_LABELS,
  type AdminPermissionKey,
  type AdminTeamRole,
} from "@/app/admin/_lib/teamTypes";
import { createStaffUserWithAuthAction } from "@/app/admin/teamProvisioningActions";

export const dynamic = "force-dynamic";

const STAFF_CREATE_ROLES: AdminTeamRole[] = [
  "sales_rep",
  "sales_manager",
  "support_agent",
  "content_manager",
  "billing_support",
  "ads_moderator",
  "magazine_editor",
  "read_only",
];

const PERM_LABELS: Record<AdminPermissionKey, string> = {
  can_view_users: "View users",
  can_edit_users: "Edit users",
  can_reset_passwords: "Reset passwords",
  can_manage_ads: "Manage ads",
  can_manage_reports: "Manage reports",
  can_manage_categories: "Manage categories",
  can_manage_magazine: "Manage magazine",
  can_manage_website_content: "Site content",
  can_view_payments: "View payments",
  can_manage_team: "Manage team",
  can_view_activity_logs: "Activity logs",
  can_use_replica_mode: "Replica mode",
};

const ERROR_LABELS: Record<string, string> = {
  invalid_email: "Enter a valid email address.",
  invalid_role: "Choose a valid staff role.",
  duplicate: "Auth user already exists — enable “Update existing Auth password” or use invite mode.",
  password_required: "Temporary password must be at least 10 characters.",
  forbidden: "Only Super Admin can create staff login accounts.",
  provision: "Could not provision user — check Supabase service role and Auth settings.",
};

export default async function StaffUserCreatePage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const access = await getCurrentAdminAccessContext();
  requireAdminTeamAccess(access);
  const sp = searchParams ? await searchParams : {};
  const errorKey = typeof sp.error === "string" ? sp.error : "";
  const created = sp.created === "1";
  const createdEmail = typeof sp.email === "string" ? sp.email : "";
  const inviteSent = sp.invite === "1";
  const passwordSet = sp.password === "1";
  const provisionMsg = typeof sp.message === "string" ? decodeURIComponent(sp.message) : "";

  const isOwner = canAccessFullAdmin(access);
  const ownerRoles: AdminTeamRole[] =
    access.rosterRole === "super_admin" || !access.rosterResolved
      ? [...STAFF_CREATE_ROLES, "super_admin"]
      : STAFF_CREATE_ROLES;

  return (
    <div className="max-w-2xl space-y-6">
      <StaffTeamNav showRosterLink={isOwner} />

      <AdminPageHeader
        title="Create staff login"
        subtitle="Creates Supabase Auth user + admin roster permission."
        helperText="Use this for employees and sales team only — not customer ad accounts. Staff sign in at /admin/login."
      />

      {created ? (
        <div className={`${adminCardBase} border-emerald-200 bg-emerald-50/80 p-4 text-sm text-emerald-900`} role="status">
          Staff login provisioned for <strong>{createdEmail}</strong>.
          {passwordSet
            ? " Temporary password was set in Supabase Auth only (not stored or logged)."
            : null}
          {inviteSent
            ? " Invite/reset email attempted via Supabase (requires SMTP)."
            : !passwordSet
              ? " No invite email sent — use Supabase Auth to send password reset."
              : null}
        </div>
      ) : null}

      {errorKey ? (
        <div className={`${adminCardBase} border-red-200 bg-red-50/80 p-4 text-sm text-red-900`} role="alert">
          {ERROR_LABELS[errorKey] ?? provisionMsg ?? "Could not create user."}
        </div>
      ) : null}

      <form action={createStaffUserWithAuthAction} className={`${adminCardBase} space-y-4 p-6`}>
        <div>
          <label htmlFor="display_name" className="mb-1 block text-sm text-[#5C5346]">
            Employee display name
          </label>
          <input id="display_name" name="display_name" type="text" className={adminInputClass} />
        </div>
        <div>
          <label htmlFor="email" className="mb-1 block text-sm text-[#5C5346]">
            Email
          </label>
          <input id="email" name="email" type="email" required className={adminInputClass} autoComplete="off" />
        </div>
        <div>
          <label htmlFor="role" className="mb-1 block text-sm text-[#5C5346]">
            Role
          </label>
          <select id="role" name="role" required defaultValue="sales_rep" className={adminInputClass}>
            {ownerRoles.map((role) => (
              <option key={role} value={role}>
                {ROLE_LABELS[role] ?? role}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="notes" className="mb-1 block text-sm text-[#5C5346]">
            Internal note
          </label>
          <textarea id="notes" name="notes" rows={2} className={adminInputClass} />
        </div>

        <fieldset className="space-y-2">
          <legend className="text-sm font-semibold text-[#5C5346]">Password setup</legend>
          <label className="flex items-center gap-2 text-sm text-[#5C5346]">
            <input type="radio" name="password_setup_mode" value="temporary" defaultChecked />
            Set temporary password (sent to Supabase Auth only — never stored here)
          </label>
          <label className="flex items-center gap-2 text-sm text-[#5C5346]">
            <input type="radio" name="password_setup_mode" value="invite" />
            Send invite / password setup link (requires Supabase SMTP)
          </label>
        </fieldset>

        <div>
          <label htmlFor="temporary_password" className="mb-1 block text-sm text-[#5C5346]">
            Temporary password (min 10 chars)
          </label>
          <input
            id="temporary_password"
            name="temporary_password"
            type="password"
            autoComplete="new-password"
            className={adminInputClass}
            minLength={10}
          />
        </div>

        <label className="flex items-center gap-2 text-sm text-[#5C5346]">
          <input type="checkbox" name="update_existing_password" className="rounded" />
          Update password if Auth user already exists
        </label>

        <fieldset className="space-y-2 border-t border-[#E8E0D0] pt-4">
          <legend className="text-sm font-semibold text-[#5C5346]">Optional roster permissions</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {ALL_ADMIN_PERMISSION_KEYS.map((key) => (
              <label key={key} className="flex items-center gap-2 text-xs text-[#5C5346]">
                <input type="checkbox" name={`perm_${key}`} className="rounded" />
                {PERM_LABELS[key]}
              </label>
            ))}
          </div>
        </fieldset>

        <button type="submit" className={adminBtnPrimary}>
          Create staff login
        </button>
      </form>

      <p className="text-xs text-[#7A7164]">
        Roster-only rows (no Auth) remain on{" "}
        <Link href="/admin/team/roster" className="underline text-[#6B5B2E]">
          Team roster
        </Link>
        .
      </p>
    </div>
  );
}
