import Link from "next/link";

import { AdminPageHeader } from "../../_components/AdminPageHeader";
import { AdminStatCard } from "../../_components/AdminStatCard";
import { StaffTeamNav } from "../../_components/StaffTeamNav";
import { adminCtaChip } from "../../_components/adminTheme";
import {
  getCurrentAdminAccessContext,
} from "@/app/admin/_lib/adminAccessControl";
import { getSalesRepScopeForAdmin, isSalesRepRole } from "@/app/admin/_lib/adminAccessControl";
import { canAccessFullAdmin } from "@/app/admin/_lib/staffAdminAccess";

export const dynamic = "force-dynamic";

export default async function StaffTeamHomePage({
  searchParams,
}: {
  searchParams?: Promise<{ access_denied?: string }>;
}) {
  const access = await getCurrentAdminAccessContext();
  const sp = searchParams ? await searchParams : {};
  const salesScope = getSalesRepScopeForAdmin(access);
  const isSales = isSalesRepRole(access.normalizedRole);
  const showOwnerExtras = canAccessFullAdmin(access);

  return (
    <div className="max-w-4xl space-y-6">
      <StaffTeamNav showRosterLink={showOwnerExtras} />

      {sp.access_denied === "1" ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50/90 p-4 text-sm text-amber-950">
          That admin area is restricted to full Leonix administrators. Use the staff tools below.
        </div>
      ) : null}

      <AdminPageHeader
        title="Staff workspace"
        subtitle={
          isSales && salesScope
            ? `Signed in as ${salesScope.salesRepName} — promo codes you create are tied to your sales rep ID.`
            : "Leonix team tools for sales preparation, promo codes, and client onboarding."
        }
        helperText="Internal use only. Public site lock stays on for visitors without admin access."
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <AdminStatCard
          title="Website Preview"
          value="→"
          hint="Preview locked public pages while signed in as admin"
          icon="🌐"
          actionLabel="Open preview hub"
          actionHref="/admin/team/website-preview"
        />
        <AdminStatCard
          title="Promo Codes"
          value="→"
          hint="Create codes tied to your sales rep ID"
          icon="🏷️"
          actionLabel="Open promo codes"
          actionHref="/admin/team/promo-codes"
        />
        <AdminStatCard
          title="My Clients"
          value="→"
          hint="Clients linked on your promo codes"
          icon="👤"
          actionLabel="View clients"
          actionHref="/admin/team/clients"
        />
        <AdminStatCard
          title="Sales Tracker"
          value="→"
          hint="Your codes, packages, and commission preview"
          icon="📊"
          actionLabel="Open tracker"
          actionHref="/admin/team/sales-tracker"
        />
        <AdminStatCard
          title="Create Customer"
          value="→"
          hint="Provision Supabase Auth customer + profiles (not admin roster)"
          icon="➕"
          actionLabel="Create customer"
          actionHref="/admin/team/customers/new"
        />
        {showOwnerExtras ? (
          <>
            <AdminStatCard
              title="Create staff login"
              value="→"
              hint="Supabase Auth + admin_team_members for employees"
              icon="🔐"
              actionLabel="Create staff login"
              actionHref="/admin/team/users/new"
            />
            <AdminStatCard
              title="Team roster"
              value="→"
              hint="View roster rows, permissions, activate/deactivate"
              icon="👥"
              actionLabel="Manage roster"
              actionHref="/admin/team/roster"
            />
          </>
        ) : null}
      </div>

      {showOwnerExtras ? (
        <p className="text-xs text-[#7A7164]">
          Full admin dashboard:{" "}
          <Link href="/admin" className={`${adminCtaChip} inline-flex text-xs`}>
            Open executive dashboard →
          </Link>
        </p>
      ) : null}
    </div>
  );
}
