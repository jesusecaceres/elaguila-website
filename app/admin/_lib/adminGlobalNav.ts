/** Deep link to the dense registry table + Supabase save forms (secondary to the card hub). */
export const ADMIN_CATEGORIES_ADVANCED_REGISTRY_FRAGMENT = "advanced-category-registry";
export const ADMIN_CATEGORIES_ADVANCED_REGISTRY_HREF = `/admin/categories#${ADMIN_CATEGORIES_ADVANCED_REGISTRY_FRAGMENT}`;

/** Shared global admin links (desktop sidebar + mobile drawer). */
export type AdminGlobalNavItem = {
  href: string;
  /** Key into `adminStrings` (`nav.*`). */
  labelKey: string;
  icon: string;
  badgeFrom?: "tienda";
  /** Treat these path prefixes as active for this item (e.g. legacy routes that stay linked). */
  activePathPrefixes?: string[];
};

/** `true` when `pathname` should highlight this nav entry. */
export function isAdminGlobalNavItemActive(pathname: string, item: AdminGlobalNavItem): boolean {
  if (pathname === item.href) return true;
  if (item.href === "/admin") return false;
  if (pathname.startsWith(item.href)) return true;
  return item.activePathPrefixes?.some((p) => pathname.startsWith(p)) ?? false;
}

/** Launch-ops-first sidebar order; Tienda stays available but lower priority. */
export const ADMIN_GLOBAL_NAV: AdminGlobalNavItem[] = [
  { href: "/admin", labelKey: "nav.dashboard", icon: "◆", badgeFrom: "tienda" },
  {
    href: "/admin/leads/inbox",
    labelKey: "nav.launchLeads",
    icon: "📬",
    activePathPrefixes: ["/admin/leads"],
  },
  {
    href: "/admin/workspace/clasificados",
    labelKey: "nav.categories",
    icon: "▤",
    activePathPrefixes: ["/admin/categories"],
  },
  { href: "/admin/ops", labelKey: "nav.customerOps", icon: "⌕" },
  {
    href: "/admin/payments",
    labelKey: "nav.payments",
    icon: "💳",
    activePathPrefixes: [
      "/admin/workspace/package-entitlements",
      "/admin/workspace/promo-codes",
      "/admin/workspace/payment-tracker",
      "/admin/workspace/sales-tracker",
    ],
  },
  { href: "/admin/team/roster", labelKey: "nav.team", icon: "👥", activePathPrefixes: ["/admin/team"] },
  { href: "/admin/usuarios", labelKey: "nav.users", icon: "◎" },
  { href: "/admin/support", labelKey: "nav.support", icon: "💬" },
  { href: "/admin/workspace", labelKey: "nav.siteSections", icon: "🧩" },
  { href: "/admin/clasificados/viajes", labelKey: "nav.viajes", icon: "✈" },
  { href: "/admin/activity-log", labelKey: "nav.activityLog", icon: "📋" },
  { href: "/admin/settings", labelKey: "nav.settings", icon: "⚙" },
  { href: "/admin/workspace/language-audit", labelKey: "nav.languageAudit", icon: "🌐" },
  /** Tienda command hub — kept, but deprioritized for launch quote/product follow-up. */
  { href: "/admin/tienda", labelKey: "nav.tienda", icon: "🛒" },
];

/** Index helpers for nav-order verification (Launch leads must precede Tienda). */
export function adminGlobalNavIndex(href: string): number {
  return ADMIN_GLOBAL_NAV.findIndex((item) => item.href === href);
}
