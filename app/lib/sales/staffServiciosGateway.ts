/**
 * LEONIX STAFF GATEWAY — navigation authority for the eight-family Quick Sales doorway.
 *
 * The workspace client must never invent an intake URL: a href is returned only after the server
 * has confirmed assisted custody, and that href is the EXISTING canonical fillable application
 * for the selected family. Quick vs Full is stamped on the assisted token as a package key; it
 * does not change the form, the listing id, or Leonix custody.
 *
 * Exact families: Rentas, Empleos, Autos privados, Servicios, Restaurantes, Comida Local,
 * Autos Dealer, Bienes Raíces Negocio.
 * Exclude: Viajes, Iglesias, Recursos.
 *
 * $249 Quick / $399 Full apply only to the four Business pair categories. They are never applied
 * to Rentas, Empleos, Autos privados, or Comida Local.
 */
import {
  QUICK_SALES_CATEGORY_MAP,
  isQuickSalesCategory,
  type QuickSalesCategory,
} from "./quickSalesCategories";
import {
  SERVICIOS_CANONICAL_INTAKE_PATH,
  SERVICIOS_CHECKPOINT_PATH,
  SERVICIOS_QUICK_ADAPTER_PATH,
} from "./staffBusinessProduct";

/** Existing proven new-business record (staff_assisted) — Create-for-Client's "Negocio nuevo". */
export const BEGIN_CLIENT_DRAFT_HREF = "/admin/businesses/canvass?intent=create_listing";

/** The existing canonical Servicios application. Consumes the assisted cookie via `/publicar/layout.tsx`. */
export const SERVICIOS_STAFF_INTAKE_PATH = SERVICIOS_CANONICAL_INTAKE_PATH;

/** Live eight-family staff gateway. Not future scope. */
export const STAFF_GATEWAY_FAMILIES = [
  "rentas",
  "empleos",
  "autos-privado",
  "servicios",
  "restaurantes",
  "comida-local",
  "autos",
  "bienes-raices",
] as const;

export const STAFF_GATEWAY_EXCLUDED = ["viajes", "iglesias", "recursos"] as const;

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

/**
 * Customer Quick adapters, hubs, branch choosers, and paid-product checkpoints. Staff fill
 * destinations must be the canonical fillable application, never these.
 */
export const STAFF_INTAKE_FORBIDDEN_PATHS: Record<QuickSalesCategory, readonly string[]> = {
  rentas: ["/clasificados/publicar/rentas", "/publicar/rapido", "/publicar/rentas"],
  empleos: ["/publicar/empleos", "/publicar/empleos/feria", "/publicar/empleos/premium", "/clasificados/publicar/empleos"],
  "autos-privado": ["/publicar/autos", "/publicar/autos/negocios", "/clasificados/publicar/autos"],
  servicios: [SERVICIOS_CHECKPOINT_PATH, SERVICIOS_QUICK_ADAPTER_PATH],
  restaurantes: ["/clasificados/publicar/restaurantes", "/publicar/negocio-rapido/restaurantes"],
  "comida-local": ["/publicar/comida-local/rapido", "/publicar/comida-local/checkpoint", "/clasificados/publicar/restaurantes"],
  autos: ["/clasificados/publicar/autos", "/publicar/autos", "/publicar/autos/privado", "/publicar/negocio-rapido/autos-dealer"],
  "bienes-raices": ["/clasificados/publicar/bienes-raices", "/publicar/negocio-rapido/bienes-negocio"],
};

/** Customer publish login — the failure this doorway must never reach. */
export function isPublicCustomerLoginPath(path: string): boolean {
  const p = trimmed(path).toLowerCase();
  if (!p) return false;
  return p === "/login" || p.startsWith("/login?") || p.includes("mode=post");
}

function isForbiddenStaffIntakePath(category: QuickSalesCategory, path: string): boolean {
  const normalized = pathOnly(path);
  return STAFF_INTAKE_FORBIDDEN_PATHS[category].some((forbidden) => normalized === forbidden);
}

function isCanonicalStaffIntakePath(category: QuickSalesCategory, path: string): boolean {
  const expected = pathOnly(QUICK_SALES_CATEGORY_MAP[category].intakePath);
  return pathOnly(path) === expected;
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
  const path = pathOnly(href);
  if (isForbiddenStaffIntakePath(input.selectedCategory, path)) {
    return { allowed: false, reason: "wrong_application" };
  }
  if (!isCanonicalStaffIntakePath(input.selectedCategory, path)) {
    return { allowed: false, reason: "wrong_application" };
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
  if (!isQuickSalesCategory(category)) {
    return { allowed: false, reason: "category_mismatch" };
  }
  return resolveStaffOpenIntakeNavigation({
    selectedCategory: category,
    liveCustody: { category, intakePath },
  });
}
