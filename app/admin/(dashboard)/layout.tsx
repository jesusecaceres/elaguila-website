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

  const accessDenial = await resolveAdminDashboardAccessDenial(cookieStore);
  if (accessDenial) {
    redirect(`/admin/login?error=${accessDenial}`);
  }

  const [tiendaInboxUnread, adminLang, access] = await Promise.all([
    getTiendaInboxUnreadCount().catch(() => 0),
    getAdminLang(),
    getCurrentAdminAccessContext(),
  ]);
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
