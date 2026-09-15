import { cookies } from "next/headers";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { requireAdminCookie } from "@/app/lib/supabase/server";
import { resolveAdminDashboardAccessDenial } from "../_lib/adminAuthBoundary";
import {
  getAllowedGlobalNavHrefs,
  getCurrentAdminAccessContext,
  isSalesRepRole,
} from "../_lib/adminAccessControl";
import { isStaffSalesAllowedAdminPath } from "../_lib/staffAdminAccess";
import { getAdminLang } from "../_lib/adminI18n";
import { AdminShell } from "../_components/AdminShell";
import { getTiendaInboxUnreadCount } from "../_lib/tiendaOrdersData";

/** Auth + cookies; must not be statically prerendered during `next build`. */
export const dynamic = "force-dynamic";

export default async function AdminProtectedLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  if (!requireAdminCookie(cookieStore)) {
    redirect("/admin/login");
  }

  // Gate 1 (PERF-001) — resolveAdminDashboardAccessDenial() and getCurrentAdminAccessContext()
  // each independently query admin_team_members by the same operator email; running the
  // denial check first and awaiting it alone made every single Admin navigation pay for two
  // fully sequential Supabase round-trips to the same table before any other layout work could
  // even start. Neither call depends on the other's result, so resolving them together removes
  // that serialization without changing which requests are ever made or what they return.
  const [accessDenial, tiendaInboxUnread, adminLang, access] = await Promise.all([
    resolveAdminDashboardAccessDenial(cookieStore),
    getTiendaInboxUnreadCount().catch(() => 0),
    getAdminLang(),
    getCurrentAdminAccessContext(),
  ]);
  if (accessDenial) {
    redirect(`/admin/login?error=${accessDenial}`);
  }
  const allowedGlobalNavHrefs = getAllowedGlobalNavHrefs(access);
  const salesRepLimited = isSalesRepRole(access.normalizedRole);

  if (salesRepLimited) {
    const pathname = (await headers()).get("x-admin-pathname") ?? "";
    if (pathname && !isStaffSalesAllowedAdminPath(pathname)) {
      redirect("/admin/team?access_denied=1");
    }
    if (pathname === "/admin") {
      redirect("/admin/team");
    }
  }

  return (
    <AdminShell
      tiendaInboxUnread={tiendaInboxUnread}
      adminLang={adminLang}
      allowedGlobalNavHrefs={allowedGlobalNavHrefs}
      salesRepLimited={salesRepLimited}
    >
      {children}
    </AdminShell>
  );
}
