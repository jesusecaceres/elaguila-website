/**
 * Staff / sales admin surface — limited Leonix team access (STAFF-ADMIN-01).
 * Reuses roster roles from `adminAccessControl`; no separate Auth role system.
 */
import type { AdminAccessContext, NormalizedAdminRole } from "@/app/admin/_lib/adminAccessControl";
import { isSalesRepRole } from "@/app/admin/_lib/adminAccessControl";
import { isStaffSalesAllowedAdminPath } from "@/app/admin/_lib/staffSalesAllowedAdminPath";

export { isStaffSalesAllowedAdminPath };

export type StaffPreviewLink = {
  label: string;
  href: string;
};

/**
 * Launch Truth Doctrine (2026-09) — every entry here is a real, live public page (no per-link
 * "ready_for_partners"/"in_progress"/"needs_qa" engineering-status labels anymore; those
 * described development tracking, not operator truth). The "Coming Soon" marketing-lock preview
 * entries were removed — this list exists specifically to preview REAL SITE PAGES while the
 * public lock is on, not to preview the lock page itself.
 */
export const STAFF_PREVIEW_LINKS: StaffPreviewLink[] = [
  { label: "Home (ES)", href: "/home?lang=es" },
  { label: "Home (EN)", href: "/home?lang=en" },
  { label: "Clasificados (ES)", href: "/clasificados?lang=es" },
  { label: "Clasificados (EN)", href: "/clasificados?lang=en" },
  { label: "Magazine (ES)", href: "/magazine?lang=es" },
  { label: "Magazine (EN)", href: "/magazine?lang=en" },
  { label: "Contact (ES)", href: "/contact?lang=es" },
  { label: "Contact (EN)", href: "/contact?lang=en" },
  { label: "En Venta", href: "/clasificados/en-venta?lang=es" },
  { label: "Rentas", href: "/clasificados/rentas?lang=es" },
  { label: "Empleos", href: "/clasificados/empleos?lang=es" },
  { label: "Autos", href: "/clasificados/autos?lang=es" },
  { label: "Bienes Raíces", href: "/clasificados/bienes-raices?lang=es" },
  { label: "Servicios", href: "/clasificados/servicios?lang=es" },
  { label: "Restaurantes", href: "/clasificados/restaurantes?lang=es" },
];

export const STAFF_TEAM_BASE = "/admin/team";

export const STAFF_TEAM_NAV_HREFS = [
  `${STAFF_TEAM_BASE}`,
  `${STAFF_TEAM_BASE}/website-preview`,
  `${STAFF_TEAM_BASE}/promo-codes`,
  `${STAFF_TEAM_BASE}/clients`,
  `${STAFF_TEAM_BASE}/sales-tracker`,
  `${STAFF_TEAM_BASE}/customers/new`,
] as const;

const STAFF_ROSTER_ROLES = new Set<NormalizedAdminRole>(["sales_rep", "sales_manager"]);

/** Any authenticated Leonix admin cookie holder. */
export function canAccessStaffAdmin(ctx: AdminAccessContext): boolean {
  return ctx.hasAdminCookie;
}

/** Full global admin (not limited sales rep). */
export function canAccessFullAdmin(ctx: AdminAccessContext): boolean {
  return ctx.hasAdminCookie && !isSalesRepRole(ctx.normalizedRole);
}

/** Preview pages while public lock is on — requires admin cookie (see ComingSoonGateRoot). */
export function canAccessWebsitePreview(ctx: AdminAccessContext): boolean {
  return canAccessStaffAdmin(ctx);
}

export function canAccessSalesTools(ctx: AdminAccessContext): boolean {
  return ctx.hasAdminCookie && (canAccessFullAdmin(ctx) || STAFF_ROSTER_ROLES.has(ctx.normalizedRole));
}

export function canManagePromoCodesAsStaff(ctx: AdminAccessContext): boolean {
  return canAccessSalesTools(ctx);
}

/** Customer onboarding — not admin roster provisioning. */
export function canCreateCustomers(ctx: AdminAccessContext): boolean {
  return canAccessSalesTools(ctx);
}

/** Staff must never provision super_admin / sales_manager roster rows via customer flow. */
export function staffCanCreateAdminUsers(_ctx: AdminAccessContext): boolean {
  return false;
}

export function isStaffSalesLimitedRole(role: NormalizedAdminRole): boolean {
  return isSalesRepRole(role);
}
