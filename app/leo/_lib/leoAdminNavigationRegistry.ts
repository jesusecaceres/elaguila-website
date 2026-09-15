/**
 * LEO-ADMIN-OS-FINAL — canonical LEO → real Admin route navigation registry.
 *
 * Single source of truth: every href below is pulled directly from
 * ADMIN_GLOBAL_NAV (app/admin/_lib/adminGlobalNav.ts) — never invented, never
 * duplicated. This file only adds spoken/typed phrase aliases on top of
 * routes that already exist and are already permission-gated by their own
 * destination page; it grants no new access.
 *
 * GREEN governance only: this is client-side navigation (a router push to an
 * existing page), never a write, never an execution, never a bypass of the
 * destination's own auth check.
 */
import { ADMIN_GLOBAL_NAV } from "@/app/admin/_lib/adminGlobalNav";

export type LeoAdminNavigationEntry = {
  href: string;
  /** English + Spanish phrases (lowercase, no trailing punctuation) that resolve here. */
  phrases: readonly string[];
};

function hrefFor(href: string): string {
  const item = ADMIN_GLOBAL_NAV.find((entry) => entry.href === href);
  if (!item) {
    throw new Error(`leoAdminNavigationRegistry: "${href}" is not a real ADMIN_GLOBAL_NAV route.`);
  }
  return item.href;
}

export const LEO_ADMIN_NAVIGATION_REGISTRY: readonly LeoAdminNavigationEntry[] = [
  {
    href: hrefFor("/admin"),
    phrases: [
      "take me to command center",
      "take me to the command center",
      "open command center",
      "go to command center",
      "show me the command center",
      "llevame al centro de comando",
      "llévame al centro de comando",
      "abre el centro de comando",
    ],
  },
  {
    href: hrefFor("/admin/businesses"),
    phrases: [
      "open businesses",
      "open business concierge",
      "take me to businesses",
      "take me to business concierge",
      "go to businesses",
      "show me businesses",
      "show business concierge",
      "abre negocios",
      "abre business concierge",
      "llevame a negocios",
      "llévame a negocios",
    ],
  },
  {
    href: hrefFor("/admin/leads/inbox"),
    phrases: [
      "open launch leads",
      "take me to launch leads",
      "show launch leads",
      "go to launch leads",
      "open leads",
      "abre los leads",
      "llevame a los leads de lanzamiento",
      "llévame a los leads de lanzamiento",
    ],
  },
  {
    href: hrefFor("/admin/workspace/clasificados"),
    phrases: [
      "take me to categories",
      "open categories",
      "show categories",
      "go to categories",
      "llevame a categorias",
      "llévame a categorías",
      "abre categorias",
      "abre categorías",
    ],
  },
  {
    href: hrefFor("/admin/ops"),
    phrases: [
      "show customer ops",
      "open customer ops",
      "take me to customer ops",
      "go to customer ops",
      "muestrame operaciones de clientes",
      "muéstrame operaciones de clientes",
      "abre operaciones de clientes",
    ],
  },
  {
    href: hrefFor("/admin/workspace/payment-tracker"),
    phrases: [
      "open payments",
      "take me to payments",
      "show payments",
      "go to payments",
      "abre pagos",
      "llevame a pagos",
      "llévame a pagos",
    ],
  },
  {
    href: hrefFor("/admin/team/roster"),
    phrases: [
      "show my team",
      "open team",
      "open my team",
      "take me to my team",
      "go to team",
      "muestrame mi equipo",
      "muéstrame mi equipo",
      "abre el equipo",
    ],
  },
  {
    href: hrefFor("/admin/usuarios"),
    phrases: [
      "open users",
      "take me to users",
      "show users",
      "go to users",
      "abre usuarios",
      "llevame a usuarios",
      "llévame a usuarios",
    ],
  },
  {
    href: hrefFor("/admin/support"),
    phrases: [
      "take me to support",
      "open support",
      "show support",
      "go to support",
      "llevame a soporte",
      "llévame a soporte",
      "abre soporte",
    ],
  },
  {
    href: hrefFor("/admin/workspace"),
    phrases: [
      "open site sections",
      "take me to site sections",
      "show site sections",
      "go to site sections",
      "abre secciones del sitio",
    ],
  },
  {
    href: hrefFor("/admin/site-settings"),
    phrases: [
      "open site settings",
      "take me to site settings",
      "show site settings",
      "go to site settings",
      "abre configuracion del sitio",
      "abre configuración del sitio",
    ],
  },
  {
    href: hrefFor("/admin/clasificados/viajes"),
    phrases: [
      "take me to viajes",
      "open viajes",
      "show viajes",
      "go to viajes",
      "take me to travel",
      "llevame a viajes",
      "llévame a viajes",
    ],
  },
  {
    href: hrefFor("/admin/activity-log"),
    phrases: [
      "open activity log",
      "take me to activity log",
      "show activity log",
      "go to activity log",
      "show recent activity",
      "show me recent activity",
      "abre el registro de actividad",
    ],
  },
  {
    href: hrefFor("/admin/settings"),
    phrases: [
      "open settings",
      "take me to settings",
      "show settings",
      "go to settings",
      "abre ajustes",
      "abre configuracion",
      "abre configuración",
    ],
  },
  {
    href: hrefFor("/admin/workspace/language-audit"),
    phrases: [
      "run the language audit",
      "open language audit",
      "take me to language audit",
      "show language audit",
      "ejecuta la auditoria de idioma",
      "ejecuta la auditoría de idioma",
    ],
  },
  {
    href: hrefFor("/admin/tienda"),
    phrases: [
      "open tienda",
      "take me to tienda",
      "show tienda",
      "go to tienda",
      "open the store",
      "abre la tienda",
    ],
  },
  {
    href: hrefFor("/admin/recursos"),
    phrases: [
      "show recursos",
      "open recursos",
      "take me to recursos",
      "go to recursos",
      "muestrame recursos",
      "muéstrame recursos",
      "abre recursos",
    ],
  },
  {
    href: hrefFor("/admin/leo"),
    phrases: [
      "take me back to leo",
      "back to leo",
      "open leo",
      "take me to leo",
      "llevame de vuelta a leo",
      "llévame de vuelta a leo",
      "abre leo",
    ],
  },
] as const;

/** Returns the matched real Admin route, or null when no phrase matches. */
export function resolveLeoAdminNavigationRoute(normalizedText: string): string | null {
  for (const entry of LEO_ADMIN_NAVIGATION_REGISTRY) {
    if (entry.phrases.includes(normalizedText)) return entry.href;
  }
  return null;
}
