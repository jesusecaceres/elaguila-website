/** Human-readable date line for Viajes drafts → preview `dateRange`. */

export type ViajesDateMode = "fixed" | "flexible" | "seasonal";

export type ViajesDateDraftSlice = {
  dateMode?: ViajesDateMode;
  fechas: string;
  fechaInicio?: string;
  fechaFin?: string;
  fechasNota?: string;
};

function parseYmd(s: string): Date | null {
  const t = s.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(t)) return null;
  const d = new Date(`${t}T12:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

function fmt(d: Date, lang: "es" | "en") {
  return new Intl.DateTimeFormat(lang === "en" ? "en-US" : "es-MX", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(d);
}

export function viajesResolveFechasDisplay(d: ViajesDateDraftSlice, lang: "es" | "en"): string {
  const mode: ViajesDateMode = d.dateMode ?? "flexible";
  const legacy = d.fechas.trim();
  const note = (d.fechasNota ?? "").trim();
  const a = (d.fechaInicio ?? "").trim();
  const b = (d.fechaFin ?? "").trim();

  if (mode === "fixed") {
    const da = parseYmd(a);
    const db = parseYmd(b);
    if (da && db) {
      if (a === b) return fmt(da, lang);
      return lang === "en" ? `${fmt(da, lang)} – ${fmt(db, lang)}` : `${fmt(da, lang)} – ${fmt(db, lang)}`;
    }
    if (da) return fmt(da, lang);
  }

  if (mode === "seasonal") {
    const da = parseYmd(a);
    const db = parseYmd(b);
    const range =
      da && db && a !== b
        ? lang === "en"
          ? `Season window: ${fmt(da, lang)} – ${fmt(db, lang)}`
          : `Temporada: ${fmt(da, lang)} – ${fmt(db, lang)}`
        : da
          ? lang === "en"
            ? `Around ${fmt(da, lang)}`
            : `Hacia ${fmt(da, lang)}`
          : "";
    const parts = [range, note, legacy].filter(Boolean);
    return parts.join(parts.length > 1 ? " · " : "");
  }

  // flexible
  const parts = [note, legacy].filter(Boolean);
  if (parts.length === 2) return `${parts[0]} · ${parts[1]}`;
  return parts[0] ?? "";
}
