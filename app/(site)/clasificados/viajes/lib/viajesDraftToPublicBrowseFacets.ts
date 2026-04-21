/**
 * Derives public browse/filter signals from Viajes publish drafts for approved rows.
 * Used by `mapViajesStagedRowToViajesBusinessResult` — keep in sync with `viajesBrowseContract` URL keys.
 */

import { normalizeViajesDestinationKey } from "./normalizeViajesDestination";

function slugPartFromLabel(part: string): string {
  const t = normalizeViajesDestinationKey(part).replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
  return t;
}

/** Multiple destination tokens (comma, middle dot, slash) → canonical dest slugs for `dest=` matching. */
export function viajesDestSlugsFromDestinationLabel(destino: string): string[] {
  const raw = destino.trim();
  if (!raw) return [];
  const parts = raw
    .split(/[,·/|]+/)
    .map((s) => s.trim())
    .filter(Boolean);
  const set = new Set<string>();
  for (const p of parts.length ? parts : [raw]) {
    const s = slugPartFromLabel(p);
    if (s) set.add(s);
  }
  const primary = slugPartFromLabel(raw.split(/[,·]/)[0]?.trim() ?? raw);
  if (primary) set.add(primary);
  return [...set];
}

/** Parse duration label / draft into browse `duration` URL values. */
export function viajesDurationKeyFromDraft(duracion: string, fechaInicio: string, fechaFin: string): "" | "short" | "week" | "long" {
  const d = duracion.toLowerCase();
  const dayMatch = d.match(/(\d+)\s*(d[ií]as?|days?)/);
  if (dayMatch) {
    const n = parseInt(dayMatch[1], 10);
    if (Number.isFinite(n)) {
      if (n <= 3) return "short";
      if (n <= 10) return "week";
      return "long";
    }
  }
  const nocheMatch = d.match(/(\d+)\s*noches?/);
  if (nocheMatch) {
    const n = parseInt(nocheMatch[1], 10);
    if (Number.isFinite(n)) {
      const days = n + 1;
      if (days <= 3) return "short";
      if (days <= 10) return "week";
      return "long";
    }
  }
  const isoStart = fechaInicio.trim();
  const isoEnd = fechaFin.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(isoStart) && /^\d{4}-\d{2}-\d{2}$/.test(isoEnd)) {
    const a = new Date(`${isoStart}T12:00:00Z`).getTime();
    const b = new Date(`${isoEnd}T12:00:00Z`).getTime();
    if (Number.isFinite(a) && Number.isFinite(b) && b >= a) {
      const days = Math.ceil((b - a) / 86400000) + 1;
      if (days <= 3) return "short";
      if (days <= 10) return "week";
      return "long";
    }
  }
  if (/\bfin\s*de\s*semana|weekend|escapada\b/i.test(d)) return "short";
  if (/\bsemana|week\b/i.test(d) && !/dos|two|2\s*weeks/i.test(d)) return "week";
  return "";
}

function monthToSeason(m: number): "spring" | "summer" | "fall" | "winter" {
  if (m >= 3 && m <= 5) return "spring";
  if (m >= 6 && m <= 8) return "summer";
  if (m >= 9 && m <= 11) return "fall";
  return "winter";
}

function pushHoliday(keys: Set<string>) {
  keys.add("holidays");
}

/** Derive `season` URL facet keys from structured dates and optional free-text note. */
export function viajesSeasonKeysFromDraft(fechaInicio: string, fechaFin: string, fechasNota: string): string[] {
  const keys = new Set<string>();
  const note = fechasNota.toLowerCase();
  if (/\b(navidad|christmas|año\s*nuevo|new\s*year|thanksgiving|spring\s*break|semana\s*santa)\b/i.test(note)) {
    pushHoliday(keys);
  }
  const start = fechaInicio.trim();
  const end = fechaFin.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(start)) {
    const m = parseInt(start.slice(5, 7), 10);
    if (m >= 1 && m <= 12) keys.add(monthToSeason(m));
    const md = parseInt(start.slice(8, 10), 10);
    if (m === 12 && md >= 15) pushHoliday(keys);
    if (m === 1 && md <= 15) pushHoliday(keys);
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(end)) {
    const m = parseInt(end.slice(5, 7), 10);
    if (m >= 1 && m <= 12) keys.add(monthToSeason(m));
    const md = parseInt(end.slice(8, 10), 10);
    if (m === 12 && md >= 15) pushHoliday(keys);
    if (m === 1 && md <= 15) pushHoliday(keys);
  }
  return [...keys];
}

export function viajesBudgetBandFromTag(tag: string): "" | "economico" | "moderado" | "premium" {
  if (tag === "economico" || tag === "moderado" || tag === "premium") return tag;
  return "";
}

/** Extend trip-type keys from offer type + structured inclusion flags (maps into URL `t` filter). */
export function viajesTripKeysFromNegociosLike(offerType: string, baseKeys: string[], incluyeHotel: boolean, incluyeTransporte: boolean, incluyeComida: boolean): string[] {
  const out = new Set<string>(baseKeys);
  if (incluyeHotel) {
    out.add("hoteles");
    out.add("hotel");
  }
  if (incluyeTransporte) {
    out.add("transporte");
    out.add("traslado");
  }
  if (incluyeComida) {
    out.add("resorts");
    out.add("tours");
  }
  if (offerType) out.add(offerType);
  return [...out];
}
