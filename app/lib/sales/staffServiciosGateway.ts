/**
 * LEONIX SERVICIOS STAFF GATEWAY — Recovery slice 1.
 *
 * Pure navigation authority for the staff "Open Services" doorway. The workspace client must
 * never invent an intake URL: a href is returned only after the server has confirmed assisted
 * custody, and that href is the EXISTING Quick Servicios application — the route that already
 * sits under `PublishAuthGateLayout` and later hands off to the canonical Servicios preview
 * that owns save-for-client / publish-for-client.
 *
 * Why this is not `/clasificados/publicar/servicios`: that path redirects to the paid-product
 * CHECKPOINT (`/clasificados/publicar/servicios/checkpoint`). Without a server-issued assisted
 * cookie, `PublishAuthGate` sends the tab to customer login ("Accede para publicar"). The two
 * routes are not interchangeable.
 *
 * FULL GATEWAY SCOPE — recorded only; this slice does not implement the other families.
 * Eventually cover exactly: Rentas, Empleos, Autos privados, Servicios, Restaurantes,
 * Comida Local, Autos Dealer, Bienes Raíces Negocio.
 * Exclude: Viajes, Iglesias, Recursos, and unrelated categories.
 */
import { quickBusinessCategoryPath } from "@/app/lib/quickBusiness/quickBusinessRoutes";
import type { QuickSalesCategory } from "./quickSalesCategories";

/** Existing proven new-business record (staff_assisted) — Create-for-Client's "Negocio nuevo". */
export const BEGIN_CLIENT_DRAFT_HREF = "/admin/businesses/canvass?intent=create_listing";

/** The existing Quick Servicios application. Consumes the assisted cookie via `/publicar/layout.tsx`. */
export const SERVICIOS_STAFF_INTAKE_PATH = quickBusinessCategoryPath("servicios", "es").split("?")[0]!;

export const FUTURE_STAFF_GATEWAY_FAMILIES = [
  "rentas",
  "empleos",
  "autos-privado",
  "servicios",
  "restaurantes",
  "comida-local",
  "autos-dealer",
  "bienes-raices-negocio",
] as const;

export const FUTURE_STAFF_GATEWAY_EXCLUDED = ["viajes", "iglesias", "recursos"] as const;

export type StaffIntakeNavRefusal = "no_active_custody" | "category_mismatch" | "public_login_blocked" | "wrong_application";

export type StaffIntakeNavigation =
  | { allowed: true; href: string; sameTab: true }
  | { allowed: false; reason: StaffIntakeNavRefusal };

function trimmed(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

/** Customer publish login — the failure this doorway must never reach. */
export function isPublicCustomerLoginPath(path: string): boolean {
  const p = trimmed(path).toLowerCase();
  if (!p) return false;
  return p === "/login" || p.startsWith("/login?") || p.includes("mode=post");
}

/**
 * Fail-closed: no live server custody ⇒ no href. Never fall back to a client-side descriptor.
 * The previous defect was `status?.intakePath ?? descriptor.intakePath`.
 */
export function resolveStaffOpenIntakeNavigation(input: {
  selectedCategory: QuickSalesCategory;
  liveCustody: { category: string; intakePath: string } | null;
}): StaffIntakeNavigation {
  const live = input.liveCustody;
  if (!live) return { allowed: false, reason: "no_active_custody" };
  if (trimmed(live.category) !== trimmed(input.selectedCategory)) {
    return { allowed: false, reason: "category_mismatch" };
  }
  const href = trimmed(live.intakePath);
  if (!href) return { allowed: false, reason: "no_active_custody" };
  if (isPublicCustomerLoginPath(href)) return { allowed: false, reason: "public_login_blocked" };
  if (input.selectedCategory === "servicios") {
    const pathOnly = href.split("?")[0] ?? href;
    if (pathOnly !== SERVICIOS_STAFF_INTAKE_PATH) {
      return { allowed: false, reason: "wrong_application" };
    }
  }
  return { allowed: true, href, sameTab: true };
}

/**
 * After POST /api/admin/sales-preview/custody succeeds, the JSON itself is the server confirmation.
 * Navigation is allowed only from that response — never from a local category map fallback.
 */
export function resolveStaffNavigationFromCustodyPost(json: {
  ok?: unknown;
  category?: unknown;
  intakePath?: unknown;
}): StaffIntakeNavigation {
  if (json.ok !== true) return { allowed: false, reason: "no_active_custody" };
  const category = trimmed(json.category);
  const intakePath = trimmed(json.intakePath);
  if (category !== "servicios") {
    return { allowed: false, reason: "category_mismatch" };
  }
  return resolveStaffOpenIntakeNavigation({
    selectedCategory: "servicios",
    liveCustody: { category, intakePath },
  });
}
