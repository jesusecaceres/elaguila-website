import Link from "next/link";

import { AdminPageHeader } from "../../../../_components/AdminPageHeader";
import { StaffTeamNav } from "../../../../_components/StaffTeamNav";
import { adminCardBase, adminCtaChip, adminCtaChipSecondary } from "../../../../_components/adminTheme";
import { getCurrentAdminAccessContext } from "@/app/admin/_lib/adminAccessControl";
import { canAccessFullAdmin } from "@/app/admin/_lib/staffAdminAccess";

export const dynamic = "force-dynamic";

export default async function StaffCreateCustomerPage() {
  const access = await getCurrentAdminAccessContext();
  const showRosterLink = canAccessFullAdmin(access);

  return (
    <div className="max-w-3xl space-y-6">
      <StaffTeamNav showRosterLink={showRosterLink} />

      <AdminPageHeader
        title="Create Customer / Invite"
        subtitle="Honest onboarding runbook — this admin surface does not yet create Supabase Auth users automatically."
        helperText="Staff cannot create admin accounts or change roster roles from here."
      />

      <div className={`${adminCardBase} space-y-4 p-6 text-sm text-[#5C5346]`}>
        <p>
          <strong className="text-[#1E1810]">Current backend:</strong> No in-app{" "}
          <code className="rounded bg-white/80 px-1">auth.admin.createUser</code> route exists. Customer accounts must
          be provisioned in Supabase Auth (or your IdP), then linked via promo codes and package entitlements.
        </p>
        <ol className="list-decimal space-y-2 pl-5">
          <li>
            In Supabase Auth → create user with customer email, or send magic link / password reset from the Auth panel.
          </li>
          <li>
            Confirm a <code className="rounded bg-white/80 px-1">profiles</code> row exists (trigger or manual insert).
          </li>
          <li>
            Create a promo code on{" "}
            <Link href="/admin/team/promo-codes" className="font-bold text-[#6B5B2E] underline">
              Promo Codes
            </Link>{" "}
            with customer name, email, and phone — your <code>sales_rep_id</code> is attached automatically.
          </li>
          <li>Share the code with the client for entitlement/discount rules when public redemption is enabled.</li>
        </ol>
        <p className="text-xs text-[#7A7164]">
          End users can request password reset at{" "}
          <Link href="/login" className="underline" target="_blank" rel="noopener noreferrer">
            /login
          </Link>{" "}
          when that flow is enabled for customers.
        </p>
      </div>

      <div className={`${adminCardBase} border-dashed p-4 text-xs text-[#7A7164]`}>
        <strong className="text-[#5C5346]">Owner-only staff provisioning:</strong> Roster rows and invite intent live on{" "}
        <Link href="/admin/team/roster" className="font-bold text-[#6B5B2E] underline">
          Team roster
        </Link>
        . That still does not send email or create Auth users — complete signup in Supabase Auth separately.
      </div>

      <Link href="/admin/team/promo-codes" className={`${adminCtaChip} inline-flex`}>
        Create promo code for client →
      </Link>
      <Link href="/admin/support" className={`${adminCtaChipSecondary} ml-2 inline-flex`}>
        Support / help →
      </Link>
    </div>
  );
}
