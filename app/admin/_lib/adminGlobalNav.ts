/** Shared global admin links (desktop sidebar + mobile drawer). */
export type AdminGlobalNavItem = {
  href: string;
  label: string;
  icon: string;
  badgeFrom?: "tienda";
};

/**
 * Tienda: no `/admin/tienda` index page in repo — hub is the orders inbox (`/admin/tienda/orders`).
 */
export const ADMIN_GLOBAL_NAV: AdminGlobalNavItem[] = [
  { href: "/admin", label: "Dashboard", icon: "◆", badgeFrom: "tienda" },
  { href: "/admin/categories", label: "Categories", icon: "▤" },
  { href: "/admin/tienda/orders", label: "Tienda", icon: "🛒" },
  { href: "/admin/workspace", label: "Site sections", icon: "🧩" },
  { href: "/admin/clasificados/viajes", label: "Viajes", icon: "✈" },
  { href: "/admin/usuarios", label: "Users", icon: "◎" },
  { href: "/admin/ops", label: "Customer ops", icon: "⌕" },
  { href: "/admin/payments", label: "Payments", icon: "💳" },
  { href: "/admin/support", label: "Support", icon: "💬" },
  { href: "/admin/team", label: "Team", icon: "👥" },
  { href: "/admin/activity-log", label: "Activity Log", icon: "📋" },
  { href: "/admin/settings", label: "Settings", icon: "⚙" },
];
