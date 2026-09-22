/**
 * LEONIX SERVICIOS STAFF GATEWAY — Recovery slice 1 + Quick/Full entitlement.
 *
 * Pure navigation authority for the staff "Open Services" doorway. The workspace client must
 * never invent an intake URL: a href is returned only after the server has confirmed assisted
 * custody, and that href is the EXISTING canonical Servicios application
 * (`/publicar/servicios`) — the same ClasificadosServiciosApplication a Full customer fills.
 * Quick vs Full is stamped on the assisted token as a package key; it does not change the form,
 * the listing id, or Leonix custody.
 *
 * Why this is not `/clasificados/publicar/servicios`: that path redirects to the paid-product
 * CHECKPOINT (`/clasificados/publicar/servicios/checkpoint`). Without a server-issued assisted
 * cookie, `PublishAuthGate` sends the tab to customer login ("Accede para publicar").
 *
 * Why this is not `/publicar/negocio-rapido/servicios`: that is the customer Quick ADAPTER, a
 * shorter form. Staff-managed Quick and Full both use the canonical application.
 *
 * FULL GATEWAY SCOPE — recorded only; this slice does not implement the other families.
 * Eventually cover exactly: Rentas, Empleos, Autos privados, Servicios, Restaurantes,
 * Comida Local, Autos Dealer, Bienes Raíces Negocio.
 * Exclude: Viajes, Iglesias, Recursos, and unrelated categories.
 *
 * $249 Quick / $399 Full apply only to eligible Business pair categories (Servicios now;
 * Restaurantes, Autos Dealer, Bienes Raíces Negocio recorded). They are never applied to
 * Rentas, Empleos, Autos privados, or Comida Local.
 */
import type { QuickSalesCategory } from "./quickSalesCategories";
import {
  SERVICIOS_CANONICAL_INTAKE_PATH,
  SERVICIOS_CHECKPOINT_PATH,
  SERVICIOS_QUICK_ADAPTER_PATH,
} from "./staffBusinessProduct";

/** Existing proven new-business record (staff_assisted) — Create-for-Client's "Negocio nuevo". */
export const BEGIN_CLIENT_DRAFT_HREF = "/admin/businesses/canvass?intent=create_listing";

/** The existing canonical Servicios application. Consumes the assisted cookie via `/publicar/layout.tsx`. */
export const SERVICIOS_STAFF_INTAKE_PATH = SERVICIOS_CANONICAL_INTAKE_PATH;

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

function pathOnly(href: string): string {
  return trimmed(href).split("?")[0] || "";
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
    const path = pathOnly(href);
    if (path === SERVICIOS_CHECKPOINT_PATH || path === SERVICIOS_QUICK_ADAPTER_PATH) {
      return { allowed: false, reason: "wrong_application" };
    }
    if (path !== SERVICIOS_STAFF_INTAKE_PATH) {
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
