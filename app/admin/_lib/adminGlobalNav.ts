/** Shared global admin links (desktop sidebar + mobile drawer). */
export type AdminGlobalNavItem = {
  href: string;
  /** Key into `adminStrings` (`nav.*`). */
  labelKey: string;
  icon: string;
  badgeFrom?: "tienda";
};

/** Tienda sidebar entry opens the command hub at `/admin/tienda`. */
export const ADMIN_GLOBAL_NAV: AdminGlobalNavItem[] = [
  { href: "/admin", labelKey: "nav.dashboard", icon: "◆", badgeFrom: "tienda" },
  { href: "/admin/categories", labelKey: "nav.categories", icon: "▤" },
  { href: "/admin/tienda", labelKey: "nav.tienda", icon: "🛒" },
  { href: "/admin/workspace", labelKey: "nav.siteSections", icon: "🧩" },
  { href: "/admin/clasificados/viajes", labelKey: "nav.viajes", icon: "✈" },
  { href: "/admin/usuarios", labelKey: "nav.users", icon: "◎" },
  { href: "/admin/ops", labelKey: "nav.customerOps", icon: "⌕" },
  { href: "/admin/payments", labelKey: "nav.payments", icon: "💳" },
  { href: "/admin/support", labelKey: "nav.support", icon: "💬" },
  { href: "/admin/team", labelKey: "nav.team", icon: "👥" },
  { href: "/admin/activity-log", labelKey: "nav.activityLog", icon: "📋" },
  { href: "/admin/settings", labelKey: "nav.settings", icon: "⚙" },
  { href: "/admin/workspace/language-audit", labelKey: "nav.languageAudit", icon: "🌐" },
];
