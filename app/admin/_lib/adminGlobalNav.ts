/** Shared global admin links (desktop sidebar + mobile drawer). */
export type AdminGlobalNavItem = {
  href: string;
  label: string;
  icon: string;
  badgeFrom?: "tienda";
};

export const ADMIN_GLOBAL_NAV: AdminGlobalNavItem[] = [
  { href: "/admin", label: "Dashboard", icon: "◆", badgeFrom: "tienda" },
  { href: "/admin/clasificados/viajes", label: "Viajes", icon: "✈" },
  { href: "/admin/usuarios", label: "Users", icon: "◎" },
  { href: "/admin/ops", label: "Customer ops", icon: "⌕" },
  { href: "/admin/payments", label: "Payments", icon: "💳" },
  { href: "/admin/support", label: "Support", icon: "💬" },
  { href: "/admin/team", label: "Team", icon: "👥" },
  { href: "/admin/activity-log", label: "Activity Log", icon: "📋" },
  { href: "/admin/settings", label: "Settings", icon: "⚙" },
];
