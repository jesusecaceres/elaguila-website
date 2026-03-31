import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { requireAdminCookie } from "@/app/lib/supabase/server";
import { AdminShell } from "../_components/AdminShell";
import { getTiendaInboxUnreadCount } from "../_lib/tiendaOrdersData";

export default async function AdminProtectedLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  if (!requireAdminCookie(cookieStore)) {
    redirect("/admin/login");
  }
  const tiendaInboxUnread = await getTiendaInboxUnreadCount().catch(() => 0);
  return (
    <AdminShell tiendaInboxUnread={tiendaInboxUnread}>
      {children}
    </AdminShell>
  );
}
