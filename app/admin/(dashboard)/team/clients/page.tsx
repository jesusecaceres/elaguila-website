import Link from "next/link";

import { AdminPageHeader } from "../../../_components/AdminPageHeader";
import { StaffTeamNav } from "../../../_components/StaffTeamNav";
import { adminCardBase, adminCtaChip, adminTableZebraRow, adminTableWrap } from "../../../_components/adminTheme";
import {
  filterPromoCodesForAccess,
  getCurrentAdminAccessContext,
  getSalesRepScopeForAdmin,
  isSalesRepRole,
} from "@/app/admin/_lib/adminAccessControl";
import { canAccessFullAdmin } from "@/app/admin/_lib/staffAdminAccess";
import {
  effectivePromoCodeStatus,
  fetchPromoCodesForTracker,
  formatPromoCustomerLine,
} from "@/app/admin/_lib/promoCodeData";

export const dynamic = "force-dynamic";

function fmt(iso: string | null) {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    return Number.isFinite(d.getTime())
      ? d.toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })
      : iso;
  } catch {
    return iso;
  }
}

export default async function StaffClientsPage() {
  const access = await getCurrentAdminAccessContext();
  const showRosterLink = canAccessFullAdmin(access);
  const salesScope = getSalesRepScopeForAdmin(access);
  const isSales = isSalesRepRole(access.normalizedRole);

  const { rows: rawRows, unavailable } = await fetchPromoCodesForTracker({});
  const rows = filterPromoCodesForAccess(rawRows, access).filter(
    (r) => r.customer_name || r.customer_email || r.customer_phone || r.business_name,
  );

  return (
    <div className="max-w-5xl space-y-6">
      <StaffTeamNav showRosterLink={showRosterLink} />

      <AdminPageHeader
        title="My Clients / Leads"
        subtitle={
          isSales && salesScope
            ? `Clients and businesses recorded on promo codes tied to ${salesScope.salesRepName}.`
            : "Customer labels from promo codes across the team (full admin view)."
        }
        helperText="Derived from leonix_promo_codes customer fields — not a separate CRM table."
      />

      {unavailable ? (
        <div className={`${adminCardBase} border-amber-200 bg-amber-50/90 p-4 text-sm text-amber-950`}>
          Promo code table unavailable — check Supabase migration for <code>leonix_promo_codes</code>.
        </div>
      ) : rows.length === 0 ? (
        <div className={`${adminCardBase} p-6 text-sm text-[#5C5346]`}>
          No client labels on your promo codes yet.{" "}
          <Link href="/admin/team/promo-codes" className={`${adminCtaChip} mt-3 inline-flex text-xs`}>
            Create a promo code →
          </Link>
        </div>
      ) : (
        <div className={adminTableWrap}>
          <table className="min-w-full border-collapse text-sm">
            <thead className="bg-[#FBF7EF]/90 text-left text-xs font-bold uppercase tracking-wide text-[#7A7164]">
              <tr>
                <th className="p-3">Client / business</th>
                <th className="p-3">Promo code</th>
                <th className="p-3">Status</th>
                <th className="p-3">Redemptions</th>
                <th className="p-3">Expires</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const status = effectivePromoCodeStatus(r);
                return (
                  <tr key={r.id} className={`border-t border-[#E8DFD0]/80 ${adminTableZebraRow}`}>
                    <td className="p-3 text-xs text-[#3D3428]">{formatPromoCustomerLine(r)}</td>
                    <td className="p-3 font-mono text-xs font-bold">{r.code}</td>
                    <td className="p-3 text-xs font-semibold">{status}</td>
                    <td className="p-3 font-mono text-xs">
                      {r.redemption_count ?? 0}
                      {r.max_redemptions != null ? ` / ${r.max_redemptions}` : ""}
                    </td>
                    <td className="p-3 text-xs text-[#7A7164]">{fmt(r.ends_at)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className={`${adminCardBase} p-4 text-xs leading-relaxed text-[#5C5346]`}>
        <strong className="text-[#1E1810]">Redemption attribution gap:</strong> Public checkout redemption and automatic
        sale-to-rep rollup are not activated in this gate. Codes store <code>sales_rep_id</code> and{" "}
        <code>redemption_count</code> in <code>leonix_promo_codes</code>; entitlement attachment uses{" "}
        <code>entitlementRedemption.ts</code> when wired. Stripe payment collection remains later.
      </div>
    </div>
  );
}
