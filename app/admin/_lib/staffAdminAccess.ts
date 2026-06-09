/**
 * Staff / sales admin surface — limited Leonix team access (STAFF-ADMIN-01).
 * Reuses roster roles from `adminAccessControl`; no separate Auth role system.
 */
import type { AdminAccessContext, NormalizedAdminRole } from "@/app/admin/_lib/adminAccessControl";
import { isSalesRepRole } from "@/app/admin/_lib/adminAccessControl";

export type StaffPreviewLinkStatus =
  | "ready_for_partners"
  | "internal_review"
  | "in_progress"
  | "needs_qa";

export type StaffPreviewLink = {
  label: string;
  href: string;
  status: StaffPreviewLinkStatus;
};

export const STAFF_PREVIEW_LINKS: StaffPreviewLink[] = [
  { label: "Coming Soon (ES)", href: "/coming-soon-v2?lang=es", status: "ready_for_partners" },
  { label: "Coming Soon (EN)", href: "/coming-soon-v2?lang=en", status: "ready_for_partners" },
  { label: "Home (ES)", href: "/home?lang=es", status: "internal_review" },
  { label: "Home (EN)", href: "/home?lang=en", status: "internal_review" },
  { label: "Clasificados (ES)", href: "/clasificados?lang=es", status: "internal_review" },
  { label: "Clasificados (EN)", href: "/clasificados?lang=en", status: "internal_review" },
  { label: "Magazine (ES)", href: "/magazine?lang=es", status: "in_progress" },
  { label: "Magazine (EN)", href: "/magazine?lang=en", status: "in_progress" },
  { label: "Contact (ES)", href: "/contact?lang=es", status: "ready_for_partners" },
  { label: "Contact (EN)", href: "/contact?lang=en", status: "ready_for_partners" },
  { label: "En Venta", href: "/clasificados/en-venta?lang=es", status: "needs_qa" },
  { label: "Rentas", href: "/clasificados/rentas?lang=es", status: "needs_qa" },
  { label: "Empleos", href: "/clasificados/empleos?lang=es", status: "needs_qa" },
  { label: "Autos", href: "/clasificados/autos?lang=es", status: "needs_qa" },
  { label: "Bienes Raíces", href: "/clasificados/bienes-raices?lang=es", status: "needs_qa" },
  { label: "Servicios", href: "/clasificados/servicios?lang=es", status: "needs_qa" },
  { label: "Restaurantes", href: "/clasificados/restaurantes?lang=es", status: "needs_qa" },
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

/** Paths a sales_rep may hit under /admin (dashboard layout guard). */
export function isStaffSalesAllowedAdminPath(pathname: string): boolean {
  if (pathname === "/admin" || pathname.startsWith("/admin/team")) return true;
  if (pathname.startsWith("/admin/support")) return true;
  return false;
}

export function staffPreviewStatusLabel(status: StaffPreviewLinkStatus): string {
  switch (status) {
    case "ready_for_partners":
      return "Ready for partners";
    case "internal_review":
      return "Internal review";
    case "in_progress":
      return "In progress";
    case "needs_qa":
      return "Needs QA";
    default:
      return status;
  }
}
