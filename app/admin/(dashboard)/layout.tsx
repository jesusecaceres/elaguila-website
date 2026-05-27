import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { requireAdminCookie } from "@/app/lib/supabase/server";
import {
  getAllowedGlobalNavHrefs,
  getCurrentAdminAccessContext,
  isSalesRepRole,
} from "../_lib/adminAccessControl";
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
  const [tiendaInboxUnread, adminLang, access] = await Promise.all([
    getTiendaInboxUnreadCount().catch(() => 0),
    getAdminLang(),
    getCurrentAdminAccessContext(),
  ]);
  const allowedGlobalNavHrefs = getAllowedGlobalNavHrefs(access);
  const salesRepLimited = isSalesRepRole(access.normalizedRole);
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
