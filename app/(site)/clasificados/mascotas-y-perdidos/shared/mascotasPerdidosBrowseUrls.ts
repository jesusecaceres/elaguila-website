import type { SupportedLang } from "@/app/lib/language";
import { mascotasPerdidosPathWithLang } from "./mascotasPerdidosShellCopy";

/** Category publish entry (server redirect → `/publicar/mascotas-y-perdidos/quick`). */
export const MASCOTAS_PERDIDOS_PUBLISH_ENTRY_PATH = "/clasificados/publicar/mascotas-y-perdidos";

export function mascotasPerdidosPublishEntryUrl(routeLang: SupportedLang): string {
  return mascotasPerdidosPathWithLang(MASCOTAS_PERDIDOS_PUBLISH_ENTRY_PATH, routeLang);
}

export function mascotasPerdidosResultsUrl(
  routeLang: SupportedLang,
  filters?: { q?: string; city?: string; tipo?: string },
): string {
  const base = "/clasificados/mascotas-y-perdidos/results";
  const params = new URLSearchParams();
  params.set("lang", routeLang);
  if (filters?.q?.trim()) params.set("q", filters.q.trim());
  if (filters?.city?.trim()) params.set("city", filters.city.trim());
  if (filters?.tipo?.trim() && filters.tipo !== "all") params.set("tipo", filters.tipo.trim());
  return `${base}?${params.toString()}`;
}

export function mascotasPerdidosTipoChipHref(routeLang: SupportedLang, tipoSlug: string): string {
  return mascotasPerdidosResultsUrl(routeLang, { tipo: tipoSlug });
}
