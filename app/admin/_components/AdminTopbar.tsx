"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import newLogo from "../../../public/logo.png";
import { adminBtnPrimary, adminInputClass } from "./adminTheme";
import { AdminMobileNavDrawer } from "./AdminMobileNavDrawer";
import { useAdminT } from "./AdminI18nProvider";

export function AdminTopbar({
  showCreate = true,
  alertCount = 0,
  allowedGlobalNavHrefs,
  salesRepLimited = false,
}: {
  showCreate?: boolean;
  alertCount?: number;
  allowedGlobalNavHrefs?: string[];
  salesRepLimited?: boolean;
}) {
  const router = useRouter();
  const t = useAdminT();
  const [q, setQ] = useState("");

  const tiendaTitle = alertCount > 0 ? t("shell.tiendaTitleUnread") : t("shell.tiendaTitle");
  const tiendaAria =
    alertCount > 0 ? t("shell.tiendaAriaUnread", { n: alertCount }) : t("shell.tiendaTitle");

  return (
    <header className="sticky top-0 z-30 border-b border-[color:var(--lx-border)]/70 bg-[color:var(--lx-card)]/95 backdrop-blur-md">
      <div className="flex flex-col gap-3 px-4 py-3 sm:px-6 lg:flex-row lg:flex-wrap lg:items-center lg:gap-3">
        <div className="flex w-full min-w-0 items-center gap-2 lg:hidden">
          <AdminMobileNavDrawer
            tiendaInboxUnread={alertCount}
            allowedGlobalNavHrefs={allowedGlobalNavHrefs}
            salesRepLimited={salesRepLimited}
          />
          <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full ring-2 ring-[color:var(--lx-border)]">
            <Image src={newLogo} alt="" className="object-cover" fill sizes="36px" />
          </div>
          <span className="min-w-0 truncate text-[11px] font-bold uppercase tracking-wide text-[color:var(--lx-muted)]">
            {t("shell.leonixAdmin")}
          </span>
          <div className="ml-auto flex shrink-0 items-center gap-2">
            <Link
              href="/admin/tienda"
              className="relative flex h-11 min-w-[44px] items-center justify-center rounded-full border border-[color:var(--lx-border)] bg-[color:var(--lx-card)] p-2 text-[color:var(--lx-muted)] shadow-sm"
              title={tiendaTitle}
              aria-label={tiendaAria}
            >
              🔔
              {alertCount > 0 ? (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
                  {alertCount > 99 ? "99+" : alertCount}
                </span>
              ) : null}
            </Link>
            {showCreate ? (
              <Link
                href="/admin/workspace/clasificados"
                className={`${adminBtnPrimary} min-h-[44px] whitespace-nowrap px-3 py-2.5 text-sm`}
                title={t("shell.createClasificadosTitle")}
              >
                {t("shell.create")}
              </Link>
            ) : null}
          </div>
        </div>

        <form
          className="order-2 w-full min-w-0 max-w-none lg:order-1 lg:max-w-xl lg:flex-1"
          onSubmit={(e) => {
            e.preventDefault();
            const s = q.trim();
            if (s) router.push(`/admin/workspace/clasificados?q=${encodeURIComponent(s)}`);
          }}
        >
          <label htmlFor="admin-global-search" className="sr-only">
            {t("shell.searchLabel")}
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[color:var(--lx-muted)]">⌕</span>
            <input
              id="admin-global-search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t("shell.searchListingsPlaceholder")}
              title={t("shell.searchListingsTitle")}
              className={`${adminInputClass} min-h-[44px] pl-10 text-base sm:text-sm`}
            />
          </div>
        </form>

        <div className="order-3 hidden items-center gap-2 lg:ml-auto lg:flex lg:flex-nowrap">
          <span className="inline-flex max-w-[10rem] items-center gap-1 truncate rounded-lg border border-[color:var(--lx-border)]/60 bg-[color:var(--lx-section)] px-3 py-1.5 text-xs font-bold text-[color:var(--lx-text-2)] xl:max-w-none">
            {t("shell.plusBadge")}
          </span>
          <Link
            href="/admin/tienda"
            className="relative rounded-full border border-[color:var(--lx-border)] bg-[color:var(--lx-card)] p-2 text-[color:var(--lx-muted)] shadow-sm"
            title={tiendaTitle}
            aria-label={tiendaAria}
          >
            🔔
            {alertCount > 0 ? (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
                {alertCount > 99 ? "99+" : alertCount}
              </span>
            ) : null}
          </Link>
          <div className="hidden h-9 w-9 items-center justify-center rounded-full border border-[color:var(--lx-border)] bg-[#7A1E2C] text-xs font-bold text-white sm:flex">
            LX
          </div>
          {showCreate ? (
            <Link
              href="/admin/workspace/clasificados"
              className={adminBtnPrimary}
              title={t("shell.createClasificadosTitle")}
            >
              {t("shell.create")}
            </Link>
          ) : null}
        </div>
      </div>
    </header>
  );
}
