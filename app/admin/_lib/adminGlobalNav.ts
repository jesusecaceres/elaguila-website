/** Deep link to the dense registry table + Supabase save forms (secondary to the card hub). */
export const ADMIN_CATEGORIES_ADVANCED_REGISTRY_FRAGMENT = "advanced-category-registry";
export const ADMIN_CATEGORIES_ADVANCED_REGISTRY_HREF = `/admin/categories#${ADMIN_CATEGORIES_ADVANCED_REGISTRY_FRAGMENT}`;

/**
 * Package E Build E3, Gate 1 — the six Admin OS nav groups from the Package E Bible. Additive:
 * every item still has a real, standalone `href`/`labelKey`/`icon` and works exactly as before
 * if a consumer ignores `group` entirely; this only lets the sidebar render section headings
 * instead of one flat list.
 */
export type AdminGlobalNavGroup =
  | "command"
  | "revenue"
  | "marketplace-ops"
  | "people"
  | "website-control"
  | "system";

export const ADMIN_GLOBAL_NAV_GROUP_LABEL_KEY: Record<AdminGlobalNavGroup, string> = {
  command: "navGroup.command",
  revenue: "navGroup.revenue",
  "marketplace-ops": "navGroup.marketplaceOps",
  people: "navGroup.people",
  "website-control": "navGroup.websiteControl",
  system: "navGroup.system",
};

/** Shared global admin links (desktop sidebar + mobile drawer). */
export type AdminGlobalNavItem = {
  href: string;
  /** Key into `adminStrings` (`nav.*`). */
  labelKey: string;
  icon: string;
  badgeFrom?: "tienda";
  /** Treat these path prefixes as active for this item (e.g. legacy routes that stay linked). */
  activePathPrefixes?: string[];
  group: AdminGlobalNavGroup;
};

/** `true` when `pathname` should highlight this nav entry. */
export function isAdminGlobalNavItemActive(pathname: string, item: AdminGlobalNavItem): boolean {
  if (pathname === item.href) return true;
  if (item.href === "/admin") return false;
  if (pathname.startsWith(item.href)) return true;
  return item.activePathPrefixes?.some((p) => pathname.startsWith(p)) ?? false;
}

/**
 * Launch-ops-first sidebar order; Tienda stays available but lower priority. `group` (Package E
 * Build E3, Gate 1) is read by AdminSidebar to bucket items under COMMAND/REVENUE/MARKETPLACE
 * OPS/PEOPLE/WEBSITE CONTROL/SYSTEM headings in that fixed sequence — it does NOT change this
 * flat array's own order, which several existing gates (scripts/verify-admin-nav-ops.mjs) still
 * assert positionally (leads/inbox before tienda, settings before tienda).
 */
export const ADMIN_GLOBAL_NAV: AdminGlobalNavItem[] = [
  { href: "/admin", labelKey: "nav.dashboard", icon: "◆", badgeFrom: "tienda", group: "command" },
  /** LEO-9B — owner executive console; page still enforces owner_admin via leoAccess. */
  { href: "/admin/leo", labelKey: "nav.leo", icon: "◈", group: "command" },
  {
    href: "/admin/leads/inbox",
    labelKey: "nav.launchLeads",
    icon: "📬",
    activePathPrefixes: ["/admin/leads"],
    group: "marketplace-ops",
  },
  {
    href: "/admin/workspace/clasificados",
    labelKey: "nav.categories",
    icon: "▤",
    activePathPrefixes: ["/admin/categories"],
    group: "marketplace-ops",
  },
  { href: "/admin/ops", labelKey: "nav.customerOps", icon: "⌕", group: "people" },
  // Package E Build E3, Gate 1 — real payment ledger is the primary destination now (was the
  // /admin/payments stub, which no role's allowed-nav list ever actually included — see
  // getAllowedGlobalNavHrefs). /admin/payments itself is left in place as a compatibility route
  // (not deleted, not linked from nav); scripts/verify-admin-nav-ops.mjs's literal-href pin was
  // updated alongside this change, not bypassed.
  {
    href: "/admin/workspace/payment-tracker",
    labelKey: "nav.payments",
    icon: "💳",
    activePathPrefixes: [
      "/admin/workspace/package-entitlements",
      "/admin/workspace/promo-codes",
      "/admin/workspace/sales-tracker",
    ],
    group: "revenue",
  },
  { href: "/admin/team/roster", labelKey: "nav.team", icon: "👥", activePathPrefixes: ["/admin/team"], group: "people" },
  { href: "/admin/usuarios", labelKey: "nav.users", icon: "◎", group: "people" },
  { href: "/admin/support", labelKey: "nav.support", icon: "💬", group: "people" },
  { href: "/admin/workspace", labelKey: "nav.siteSections", icon: "🧩", group: "website-control" },
  // Package E Build E3, Gate 1 — the real site-settings writer (previously reachable only via
  // the sidebar footer for non-sales-rep-limited roles, or the /admin/settings stub's blocker
  // banner) is now a primary, permission-gated nav entry.
  { href: "/admin/site-settings", labelKey: "nav.siteSettings", icon: "🛠", group: "website-control" },
  { href: "/admin/clasificados/viajes", labelKey: "nav.viajes", icon: "✈", group: "marketplace-ops" },
  { href: "/admin/activity-log", labelKey: "nav.activityLog", icon: "📋", group: "system" },
  { href: "/admin/settings", labelKey: "nav.settings", icon: "⚙", group: "system" },
  { href: "/admin/workspace/language-audit", labelKey: "nav.languageAudit", icon: "🌐", group: "system" },
  /** Tienda command hub — kept, but deprioritized for launch quote/product follow-up. */
  { href: "/admin/tienda", labelKey: "nav.tienda", icon: "🛒", group: "marketplace-ops" },
];

/** Index helpers for nav-order verification (Launch leads must precede Tienda). */
export function adminGlobalNavIndex(href: string): number {
  return ADMIN_GLOBAL_NAV.findIndex((item) => item.href === href);
}
