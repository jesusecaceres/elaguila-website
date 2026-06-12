import { redirect } from "next/navigation";
import { AdminCommandCenterDashboard } from "../_components/AdminCommandCenterDashboard";
import { getAdminDashboardLeadsCounts, getAdminDashboardSnapshot } from "../_lib/adminDashboardData";
import { getClasificadosCategoryRegistryMerged, summarizeRegistryForDashboard } from "@/app/lib/clasificados/clasificadosCategoryRegistry";
import { getPackageEntitlementDashboardSnapshot } from "../_lib/packageEntitlementData";
import { getPromoCodeDashboardSnapshot } from "../_lib/promoCodeData";
import { getPaymentTrackerDashboardSnapshot } from "../_lib/paymentTrackerData";
import { getAdminCatalogStats } from "../_lib/tiendaCatalogAdminData";
import {
  canViewPaymentTracker,
  getCurrentAdminAccessContext,
  isSalesRepRole,
} from "../_lib/adminAccessControl";
import { getAdminLang, adminMessages } from "../_lib/adminI18n";

export const dynamic = "force-dynamic";

export default async function AdminHomePage() {
  const access = await getCurrentAdminAccessContext();
  if (isSalesRepRole(access.normalizedRole)) {
    redirect("/admin/team");
  }

  const lang = await getAdminLang();
  const m = adminMessages(lang);
  const locale = "en-US";

  const [snap, leads, entSnap, promoSnap, paySnap, registry, catalogStats] = await Promise.all([
    getAdminDashboardSnapshot(),
    getAdminDashboardLeadsCounts(),
    getPackageEntitlementDashboardSnapshot(),
    getPromoCodeDashboardSnapshot(),
    canViewPaymentTracker(access.normalizedRole)
      ? getPaymentTrackerDashboardSnapshot()
      : Promise.resolve({
          unavailable: true,
          note: null,
          pendingCount: 0,
          paidCount: 0,
          commissionEligibleCount: 0,
        }),
    getClasificadosCategoryRegistryMerged(),
    getAdminCatalogStats(),
  ]);
  const regSum = summarizeRegistryForDashboard(registry);

  return (
    <AdminCommandCenterDashboard
      m={m}
      locale={locale}
      snap={snap}
      leads={leads}
      regSummary={regSum}
      entSnap={entSnap}
      promoSnap={promoSnap}
      paySnap={paySnap}
      catalogStats={catalogStats}
      showPaymentTracker={canViewPaymentTracker(access.normalizedRole)}
    />
  );
}
