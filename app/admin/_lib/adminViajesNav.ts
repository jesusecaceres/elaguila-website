/** Internal admin IA: Admin → Clasificados → Viajes (affiliate ops + related shells). */

export type AdminViajesNavItem = {
  href: string;
  label: string;
  short: string;
};

export const ADMIN_VIAJES_NAV: AdminViajesNavItem[] = [
  { href: "/admin/clasificados/viajes", label: "Overview", short: "Resumen" },
  { href: "/admin/clasificados/viajes/affiliate-cards", label: "Affiliate Cards", short: "Afiliados" },
  { href: "/admin/clasificados/viajes/business-offers", label: "Business Offers", short: "Negocios" },
  { href: "/admin/clasificados/viajes/businesses", label: "Businesses / Profiles", short: "Perfiles" },
  { href: "/admin/clasificados/viajes/editorial", label: "Editorial / Guides", short: "Editorial" },
  { href: "/admin/clasificados/viajes/campaigns", label: "Campaigns / Seasonal", short: "Campañas" },
  { href: "/admin/clasificados/viajes/settings", label: "Settings / Rules", short: "Reglas" },
];

export function adminViajesSectionTitle(pathname: string): string {
  const hit = ADMIN_VIAJES_NAV.find((x) => x.href === pathname);
  return hit?.label ?? "Viajes";
}
