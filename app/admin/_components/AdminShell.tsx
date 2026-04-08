import type { ReactNode } from "react";
import { Suspense } from "react";
import { AdminSidebar } from "./AdminSidebar";
import { AdminTopbar } from "./AdminTopbar";
import { AdminQueryFlash } from "./AdminQueryFlash";
import { adminPageBg } from "./adminTheme";

export function AdminShell({
  children,
  tiendaInboxUnread = 0,
}: {
  children: ReactNode;
  /** Unread Tienda orders for sidebar + topbar badge */
  tiendaInboxUnread?: number;
}) {
  return (
    <div className={adminPageBg}>
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        }}
        aria-hidden
      />
      <div className="relative flex min-h-screen">
        <div className="hidden w-64 shrink-0 lg:block">
          <div className="sticky top-0 h-screen overflow-y-auto">
            <AdminSidebar tiendaInboxUnread={tiendaInboxUnread} />
          </div>
        </div>
        <div className="flex min-w-0 flex-1 flex-col">
          <AdminTopbar alertCount={tiendaInboxUnread} />
          <Suspense fallback={null}>
            <AdminQueryFlash />
          </Suspense>
          <div className="mx-auto w-full max-w-7xl min-w-0 px-3 py-6 sm:px-6 sm:py-8 lg:py-10">{children}</div>
        </div>
      </div>
    </div>
  );
}
