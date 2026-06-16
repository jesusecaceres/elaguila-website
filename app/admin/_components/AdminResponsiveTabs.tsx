"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { adminResponsiveTabsOuter, adminResponsiveTabsScroll } from "./adminTheme";

export type AdminResponsiveTabItem = {
  key: string;
  label: ReactNode;
  href?: string;
  onClick?: () => void;
  active?: boolean;
  badge?: ReactNode;
};

const pillBase =
  "inline-flex min-h-[44px] shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-4 py-2 text-sm font-semibold transition";

const pillActive = "border-[#6B5B2E] bg-[#FAF3E6] text-[#2C2416] ring-2 ring-[#C9B46A]/40";
const pillIdle = "border-[#E8DFD0] text-[#5C5346] hover:bg-[#FAF7F2] active:bg-[#FAF3E6]";

const rectBase =
  "inline-flex min-h-[44px] shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg border px-4 py-2.5 text-sm font-semibold transition";

const rectActive = "border-[#C9B46A] bg-[#FFFCF7] text-[#2C2416] shadow-sm ring-1 ring-[#C9B46A]/40";
const rectIdle = "border-[#E8DFD0] bg-[#FAF7F2] text-[#5C5346] hover:border-[#C9B46A]/50 hover:bg-[#FBF7EF]";

function TabPill({ item, variant }: { item: AdminResponsiveTabItem; variant: "pill" | "rectangular" }) {
  const isRect = variant === "rectangular";
  const className = `${isRect ? rectBase : pillBase} ${item.active ? (isRect ? rectActive : pillActive) : isRect ? rectIdle : pillIdle}`;

  if (item.href) {
    return (
      <Link
        key={item.key}
        href={item.href}
        className={className}
        aria-current={item.active ? "page" : undefined}
      >
        {item.label}
        {item.badge}
      </Link>
    );
  }

  return (
    <button key={item.key} type="button" onClick={item.onClick} className={className} aria-pressed={item.active}>
      {item.label}
      {item.badge}
    </button>
  );
}

export function AdminResponsiveTabs({
  items,
  ariaLabel,
  variant = "pill",
}: {
  items: AdminResponsiveTabItem[];
  ariaLabel: string;
  variant?: "pill" | "rectangular";
}) {
  return (
    <div className={adminResponsiveTabsOuter} data-testid="admin-responsive-tabs">
      <nav className={adminResponsiveTabsScroll} aria-label={ariaLabel}>
        {items.map((item) => (
          <TabPill key={item.key} item={item} variant={variant} />
        ))}
      </nav>
    </div>
  );
}
