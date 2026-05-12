import type { DayHoursRow } from "@/app/clasificados/publicar/servicios/lib/clasificadosServiciosApplicationTypes";
import type { Lang } from "@/app/clasificados/config/clasificadosHub";

/** Machine-readable keys written by `publishCommunityQuickToListings` (Leonix:*). */
export type CommunityListingPairMap = Record<string, string>;

export function detailPairsToMap(detailPairs: unknown): CommunityListingPairMap {
  const out: CommunityListingPairMap = {};
  if (!Array.isArray(detailPairs)) return out;
  for (const row of detailPairs) {
    if (!row || typeof row !== "object") continue;
    const o = row as { label?: unknown; value?: unknown };
    const lab = String(o.label ?? "").trim();
    const val = String(o.value ?? "").trim();
    if (lab) out[lab] = val;
  }
  return out;
}

export function isCommunityQuickListing(pairs: CommunityListingPairMap): boolean {
  return pairs["Leonix:communityLane"] === "quick" && (pairs["Leonix:communityKind"] === "clases" || pairs["Leonix:communityKind"] === "comunidad");
}

export function parseWeeklyScheduleJson(raw: string | undefined): DayHoursRow[] {
  if (!raw?.trim()) return [];
  try {
    const v = JSON.parse(raw) as unknown;
    if (!Array.isArray(v)) return [];
    return v as DayHoursRow[];
  } catch {
    return [];
  }
}

const DAY_ES: Record<string, string> = {
  mon: "Lun",
  tue: "Mar",
  wed: "Mié",
  thu: "Jue",
  fri: "Vie",
  sat: "Sáb",
  sun: "Dom",
};
const DAY_EN: Record<string, string> = {
  mon: "Mon",
  tue: "Tue",
  wed: "Wed",
  thu: "Thu",
  fri: "Fri",
  sat: "Sat",
  sun: "Sun",
};

export function summarizeWeeklySchedule(rows: DayHoursRow[], lang: Lang): string {
  const labels = lang === "en" ? DAY_EN : DAY_ES;
  const parts: string[] = [];
  for (const r of rows) {
    if (r.closed) continue;
    const o = String(r.open ?? "").trim();
    const c = String(r.close ?? "").trim();
    if (!o || !c) continue;
    const dk = String(r.day ?? "");
    const d = labels[dk] ?? dk;
    parts.push(`${d} ${o}–${c}`);
  }
  return parts.join(", ");
}

export function clasesModeLabel(mode: string, lang: Lang): string {
  if (mode === "presencial") return lang === "es" ? "Presencial" : "In person";
  if (mode === "enLinea") return lang === "es" ? "En línea" : "Online";
  if (mode === "hibrida") return lang === "es" ? "Híbrida" : "Hybrid";
  return mode || "—";
}

export function comunidadEventCostLabel(cost: string, lang: Lang): string {
  const m: Record<string, { es: string; en: string }> = {
    gratis: { es: "Gratis", en: "Free" },
    pagado: { es: "Pagado", en: "Paid" },
    donacion: { es: "Donación", en: "Donation" },
    noConfirmado: { es: "Por confirmar", en: "TBD" },
  };
  const x = m[cost];
  if (x) return lang === "es" ? x.es : x.en;
  return cost || "—";
}

export function clasesCostTypeLabel(t: string, lang: Lang): string {
  if (t === "gratis") return lang === "es" ? "Gratis" : "Free";
  if (t === "pagada") return lang === "es" ? "Pagada" : "Paid";
  return t || "—";
}

export function clasesPriceFrequencyLabel(freq: string, lang: Lang): string {
  const es: Record<string, string> = {
    porClase: "por clase",
    porSesion: "por sesión",
    porMes: "por mes",
    porCursoCompleto: "por curso completo",
    otro: "otro",
  };
  const en: Record<string, string> = {
    porClase: "per class",
    porSesion: "per session",
    porMes: "per month",
    porCursoCompleto: "per full course",
    otro: "other",
  };
  const m = lang === "es" ? es : en;
  return m[freq] ?? freq;
}
