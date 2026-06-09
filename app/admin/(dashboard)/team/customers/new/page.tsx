import Link from "next/link";

import { AdminPageHeader } from "../../../../_components/AdminPageHeader";
import { StaffTeamNav } from "../../../../_components/StaffTeamNav";
import { adminCardBase, adminBtnPrimary, adminCtaChip, adminInputClass } from "../../../../_components/adminTheme";
import { getCurrentAdminAccessContext } from "@/app/admin/_lib/adminAccessControl";
import { canAccessFullAdmin } from "@/app/admin/_lib/staffAdminAccess";
import { createCustomerUserWithAuthAction } from "@/app/admin/teamProvisioningActions";

export const dynamic = "force-dynamic";

const ERROR_LABELS: Record<string, string> = {
  invalid_email: "Enter a valid email address.",
  invalid_account_type: "Choose personal or business account type.",
  duplicate: "A Supabase Auth user with this email already exists.",
  forbidden: "You do not have permission to create customers.",
  provision: "Could not provision customer — check Supabase configuration.",
};

export default async function StaffCreateCustomerPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const access = await getCurrentAdminAccessContext();
  const showRosterLink = canAccessFullAdmin(access);
  const sp = searchParams ? await searchParams : {};
  const errorKey = typeof sp.error === "string" ? sp.error : "";
  const created = sp.created === "1";
  const createdEmail = typeof sp.email === "string" ? sp.email : "";
  const inviteSent = sp.invite === "1";
  const provisionMsg = typeof sp.message === "string" ? decodeURIComponent(sp.message) : "";

  return (
    <div className="max-w-3xl space-y-6">
      <StaffTeamNav showRosterLink={showRosterLink} />

      <AdminPageHeader
        title="Create Customer / Invite"
        subtitle="Provision Supabase Auth customer + profiles row (not admin roster)."
        helperText="Staff cannot create admin accounts. Link the client with a promo code after signup."
      />

      {created ? (
        <div className={`${adminCardBase} border-emerald-200 bg-emerald-50/80 p-4 text-sm text-emerald-900`} role="status">
          Created customer Auth user for <strong>{createdEmail}</strong>.
          {inviteSent
            ? " Invite/reset email attempted via Supabase."
            : " No invite sent — customer can use /login password reset when enabled."}
          {" "}Next:{" "}
          <Link href="/admin/team/promo-codes" className="font-bold underline">
            create a promo code
          </Link>{" "}
          with client details (your sales rep id attaches automatically).
        </div>
      ) : null}

      {errorKey ? (
        <div className={`${adminCardBase} border-red-200 bg-red-50/80 p-4 text-sm text-red-900`} role="alert">
          {ERROR_LABELS[errorKey] ?? provisionMsg ?? "Could not create customer."}
        </div>
      ) : null}

      <form action={createCustomerUserWithAuthAction} className={`${adminCardBase} space-y-4 p-6`}>
        <div>
          <label htmlFor="email" className="mb-1 block text-sm text-[#5C5346]">
            Customer email
          </label>
          <input id="email" name="email" type="email" required className={adminInputClass} autoComplete="off" />
        </div>
        <div>
          <label htmlFor="display_name" className="mb-1 block text-sm text-[#5C5346]">
            Name
          </label>
          <input id="display_name" name="display_name" type="text" className={adminInputClass} />
        </div>
        <div>
          <label htmlFor="account_type" className="mb-1 block text-sm text-[#5C5346]">
            Account type
          </label>
          <select id="account_type" name="account_type" defaultValue="personal" className={adminInputClass}>
            <option value="personal">Personal</option>
            <option value="business">Business</option>
          </select>
        </div>
        <label className="flex items-center gap-2 text-sm text-[#5C5346]">
          <input type="checkbox" name="send_invite" defaultChecked className="rounded" />
          Send Supabase invite / recovery email
        </label>
        <button type="submit" className={adminBtnPrimary}>
          Create customer account
        </button>
      </form>

      <div className={`${adminCardBase} border-dashed p-4 text-xs text-[#7A7164]`}>
        <strong className="text-[#5C5346]">Redemption attribution gap:</strong> Public checkout redemption is not
        activated. Promo codes store <code>sales_rep_id</code> and <code>redemption_count</code> for future attribution.
      </div>

      <Link href="/admin/team/promo-codes" className={`${adminCtaChip} inline-flex`}>
        Create promo code for client →
      </Link>
    </div>
  );
}
