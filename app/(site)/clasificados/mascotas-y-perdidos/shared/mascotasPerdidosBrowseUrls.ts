import type { MascotasPerdidosShellLang } from "./mascotasPerdidosShellCopy";
import { mascotasPerdidosPathWithLang } from "./mascotasPerdidosShellCopy";

export function mascotasPerdidosResultsUrl(
  lang: MascotasPerdidosShellLang,
  filters?: { q?: string; city?: string; tipo?: string },
): string {
  const base = "/clasificados/mascotas-y-perdidos/resultados";
  const params = new URLSearchParams();
  params.set("lang", lang);
  if (filters?.q?.trim()) params.set("q", filters.q.trim());
  if (filters?.city?.trim()) params.set("city", filters.city.trim());
  if (filters?.tipo?.trim() && filters.tipo !== "all") params.set("tipo", filters.tipo.trim());
  return `${base}?${params.toString()}`;
}

export function mascotasPerdidosTipoChipHref(lang: MascotasPerdidosShellLang, tipoSlug: string): string {
  return mascotasPerdidosResultsUrl(lang, { tipo: tipoSlug });
}
