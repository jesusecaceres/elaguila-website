import type { ReactNode } from "react";
import { Suspense } from "react";
import type { AdminLang } from "@/app/admin/_lib/adminI18nCookie";
import { AdminI18nProvider } from "./AdminI18nProvider";
import { AdminSidebar } from "./AdminSidebar";
import { AdminTopbar } from "./AdminTopbar";
import { AdminQueryFlash } from "./AdminQueryFlash";
import { adminContentArea, adminPageBg } from "./adminTheme";

export function AdminShell({
  children,
  tiendaInboxUnread = 0,
  adminLang = "en",
  allowedGlobalNavHrefs,
  salesRepLimited = false,
}: {
  children: ReactNode;
  /** Unread Tienda orders for sidebar + topbar badge */
  tiendaInboxUnread?: number;
  adminLang?: AdminLang;
  allowedGlobalNavHrefs?: string[];
  salesRepLimited?: boolean;
}) {
  return (
    <AdminI18nProvider lang={adminLang}>
    <div className={adminPageBg}>
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        }}
        aria-hidden
      />
      <div className="relative flex min-h-screen overflow-x-hidden">
        <div className="hidden w-64 shrink-0 lg:block">
          <div className="sticky top-0 h-screen overflow-y-auto">
            <AdminSidebar
              tiendaInboxUnread={tiendaInboxUnread}
              allowedGlobalNavHrefs={allowedGlobalNavHrefs}
              salesRepLimited={salesRepLimited}
            />
          </div>
        </div>
        <div className="flex min-w-0 flex-1 flex-col overflow-x-hidden">
          <AdminTopbar
            alertCount={tiendaInboxUnread}
            allowedGlobalNavHrefs={allowedGlobalNavHrefs}
            salesRepLimited={salesRepLimited}
          />
          <Suspense fallback={null}>
            <AdminQueryFlash />
          </Suspense>
          <div className={adminContentArea}>{children}</div>
        </div>
      </div>
    </div>
    </AdminI18nProvider>
  );
}
