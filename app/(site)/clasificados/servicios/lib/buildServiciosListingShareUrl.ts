import { headers } from "next/headers";
import type { ServiciosLang } from "@/app/servicios/types/serviciosBusinessProfile";

/** Absolute URL for the public Clasificados Servicios vitrina (share / OG parity). */
export async function buildServiciosClasificadosListingShareUrl(
  slug: string,
  lang: ServiciosLang,
): Promise<string | undefined> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  if (!host?.trim()) return undefined;
  const proto = (h.get("x-forwarded-proto") ?? "https").split(",")[0]?.trim() || "https";
  return `${proto}://${host.trim()}/clasificados/servicios/${encodeURIComponent(slug)}?lang=${lang}`;
}
