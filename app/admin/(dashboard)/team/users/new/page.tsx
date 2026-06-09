import Link from "next/link";

import { AdminPageHeader } from "../../../../_components/AdminPageHeader";
import { StaffTeamNav } from "../../../../_components/StaffTeamNav";
import { adminCardBase, adminBtnPrimary, adminInputClass } from "../../../../_components/adminTheme";
import { getCurrentAdminAccessContext, requireAdminTeamAccess } from "@/app/admin/_lib/adminAccessControl";
import { canAccessFullAdmin } from "@/app/admin/_lib/staffAdminAccess";
import { ROLE_LABELS, type AdminTeamRole } from "@/app/admin/_lib/teamTypes";
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

const ERROR_LABELS: Record<string, string> = {
  invalid_email: "Enter a valid email address.",
  invalid_role: "Choose a valid staff role.",
  duplicate: "A Supabase Auth user with this email already exists.",
  role_escalation: "Only owner admins can create privileged roles.",
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
  const provisionMsg = typeof sp.message === "string" ? decodeURIComponent(sp.message) : "";

  const isOwner = canAccessFullAdmin(access);
  const ownerRoles: AdminTeamRole[] =
    access.normalizedRole === "owner_admin"
      ? [...STAFF_CREATE_ROLES, "super_admin"]
      : STAFF_CREATE_ROLES;

  return (
    <div className="max-w-2xl space-y-6">
      <StaffTeamNav showRosterLink={isOwner} />

      <AdminPageHeader
        title="Create Staff / Sales User"
        subtitle="Provision Supabase Auth + admin_team_members roster row (owner only)."
        helperText="Staff users sign in at /admin/login with email and password. No shared passwords are generated."
      />

      {created ? (
        <div className={`${adminCardBase} border-emerald-200 bg-emerald-50/80 p-4 text-sm text-emerald-900`} role="status">
          Created Auth user for <strong>{createdEmail}</strong>.
          {inviteSent
            ? " Invite/reset email attempted via Supabase (requires SMTP)."
            : " No invite email sent — use Supabase Auth to send password reset."}
        </div>
      ) : null}

      {errorKey ? (
        <div className={`${adminCardBase} border-red-200 bg-red-50/80 p-4 text-sm text-red-900`} role="alert">
          {ERROR_LABELS[errorKey] ?? provisionMsg ?? "Could not create user."}
        </div>
      ) : null}

      <form action={createStaffUserWithAuthAction} className={`${adminCardBase} space-y-4 p-6`}>
        <div>
          <label htmlFor="email" className="mb-1 block text-sm text-[#5C5346]">
            Email
          </label>
          <input id="email" name="email" type="email" required className={adminInputClass} autoComplete="off" />
        </div>
        <div>
          <label htmlFor="display_name" className="mb-1 block text-sm text-[#5C5346]">
            Display name
          </label>
          <input id="display_name" name="display_name" type="text" className={adminInputClass} />
        </div>
        <div>
          <label htmlFor="role" className="mb-1 block text-sm text-[#5C5346]">
            Roster role
          </label>
          <select id="role" name="role" required defaultValue="sales_rep" className={adminInputClass}>
            {ownerRoles.map((role) => (
              <option key={role} value={role}>
                {ROLE_LABELS[role] ?? role}
              </option>
            ))}
          </select>
        </div>
        <label className="flex items-center gap-2 text-sm text-[#5C5346]">
          <input type="checkbox" name="send_invite" defaultChecked className="rounded" />
          Send Supabase invite / recovery email (requires project SMTP)
        </label>
        <button type="submit" className={adminBtnPrimary}>
          Create staff user
        </button>
      </form>

      <p className="text-xs text-[#7A7164]">
        Roster metadata only (no Auth) remains on{" "}
        <Link href="/admin/team/roster" className="underline text-[#6B5B2E]">
          Team roster
        </Link>
        . Prefer this page for operational staff onboarding.
      </p>
    </div>
  );
}
