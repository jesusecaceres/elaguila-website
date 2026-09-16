/**
 * Live open/closed status for the Dealer Business Hub, resolved in the dealership's own local
 * time via the shared `resolveUsBusinessTimeZone`/`zonedNowInTimeZone` (generalized from
 * Servicios' proven `buildServiciosHeroHoursPill`/`serviciosBusinessTimeZone`). Dealer hours are
 * already structured 24h `HH:MM` rows (`DealerHoursEntry`), so this needs none of Servicios'
 * free-text time parsing — only the day/time comparison and the timezone plumbing are shared.
 *
 * HONEST FAILURE, same doctrine as the Servicios reference: when the dealership's timezone
 * cannot be resolved from its city/state/country (non-US, or state missing/unrecognized), this
 * never falls back to the host clock — it returns a neutral status that states today's schedule
 * without claiming open or closed.
 *
 * Special-hours rows (`DealerSpecialHoursRow`) are free-text `{label, note}` with no machine
 * -readable date — exactly like Servicios' own `specialHoursRows` — so neither engine can safely
 * decide whether a given exception applies to "today". They remain a separate, correctly-labeled
 * informational block; this status is computed from the regular weekly schedule only.
 */
import type { DealerHoursEntry } from "../types/autoDealerListing";
import { filterDealerHoursForDisplay, formatDealerHoursTimeRange } from "./dealerHoursDisplay";
import { resolveUsBusinessTimeZone, zonedNowInTimeZone } from "@/app/lib/businessHours/resolveUsBusinessTimeZone";

const TIME24 = /^([01]?\d|2[0-3]):([0-5]\d)$/;

function parseHHMM(s: string | undefined): number | null {
  const t = (s ?? "").trim();
  const m = t.match(TIME24);
  if (!m) return null;
  const h = parseInt(m[1]!, 10);
  const min = parseInt(m[2]!, 10);
  return h * 60 + min;
}

function to12h(minutes: number): string {
  const h = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${m.toString().padStart(2, "0")} ${ampm}`;
}

const DAY_ALIASES: Record<number, string[]> = {
  0: ["sunday", "domingo", "sun", "dom"],
  1: ["monday", "lunes", "mon", "lun"],
  2: ["tuesday", "martes", "tue", "mar"],
  3: ["wednesday", "miércoles", "miercoles", "wed", "mié", "mie"],
  4: ["thursday", "jueves", "thu", "jue"],
  5: ["friday", "viernes", "fri", "vie"],
  6: ["saturday", "sábado", "sabado", "sat", "sáb", "sab"],
};

function normalizeDayToken(day: string): string {
  return day
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
}

function dayIndexFromLabel(day: string): number | null {
  const token = normalizeDayToken(day);
  for (const [idx, aliases] of Object.entries(DAY_ALIASES)) {
    if (aliases.some((a) => token.includes(normalizeDayToken(a)) || normalizeDayToken(a).includes(token))) {
      return Number(idx);
    }
  }
  return null;
}

export type AutosDealerHoursStatus = {
  text: string;
  variant: "open" | "closed" | "neutral";
};

function findNextOpenDay(
  rows: DealerHoursEntry[],
  fromJsDay: number,
): { dayOffset: number; openMinutes: number; dayLabel: string } | null {
  for (let offset = 1; offset <= 7; offset++) {
    const jsD = (fromJsDay + offset) % 7;
    const row = rows.find((r) => dayIndexFromLabel(r.day ?? "") === jsD && !r.closed);
    if (!row) continue;
    const openMin = parseHHMM(row.open);
    if (openMin == null) continue;
    return { dayOffset: offset, openMinutes: openMin, dayLabel: row.day.trim() };
  }
  return null;
}

function closedRelativePhrase(lang: "es" | "en", dayOffset: number, dayLabel: string, timeStr: string): string {
  if (dayOffset <= 1) {
    return lang === "es" ? `Cerrado · abre mañana ${timeStr}` : `Closed · opens tomorrow ${timeStr}`;
  }
  return lang === "es" ? `Cerrado · abre ${dayLabel} ${timeStr}` : `Closed · opens ${dayLabel} ${timeStr}`;
}

/**
 * Builds the live open/closed line for the Dealer Business Hub. Falls back to a neutral
 * "today's schedule" statement (no open/closed claim) when the dealership's timezone can't be
 * resolved from `city`/`state`/`country` — never guesses using the host or viewer's clock.
 */
export function buildAutosDealerHoursStatus(
  hours: DealerHoursEntry[] | undefined,
  location: { state?: string | null; country?: string | null },
  lang: "es" | "en",
  at: Date = new Date(),
): AutosDealerHoursStatus | null {
  const rows = filterDealerHoursForDisplay(hours);
  if (rows.length === 0) return null;

  const timeZone = resolveUsBusinessTimeZone({ region: location.state, country: location.country });
  const zoned = timeZone ? zonedNowInTimeZone(timeZone, at) : null;

  if (!zoned) {
    // Same honest-failure doctrine as Servicios: state the schedule, claim nothing.
    const todayIdx = at.getDay();
    const row = rows.find((r) => dayIndexFromLabel(r.day ?? "") === todayIdx);
    if (!row) return null;
    const label = lang === "es" ? "Horario de hoy" : "Today's hours";
    return { text: `${label} · ${formatDealerHoursTimeRange(row)}`, variant: "neutral" };
  }

  const todayRow = rows.find((r) => dayIndexFromLabel(r.day ?? "") === zoned.jsDay) ?? null;

  if (!todayRow || todayRow.closed) {
    const next = findNextOpenDay(rows, zoned.jsDay);
    if (next) {
      return {
        text: closedRelativePhrase(lang, next.dayOffset, next.dayLabel, to12h(next.openMinutes)),
        variant: "closed",
      };
    }
    return { text: lang === "es" ? "Cerrado hoy" : "Closed today", variant: "closed" };
  }

  const openMin = parseHHMM(todayRow.open);
  const closeMin = parseHHMM(todayRow.close);
  if (openMin == null || closeMin == null) return null;

  const nowMin = zoned.minutesFromMidnight;
  if (nowMin >= openMin && nowMin < closeMin) {
    return {
      text: lang === "es" ? `Abierto hoy · hasta las ${to12h(closeMin)}` : `Open today · until ${to12h(closeMin)}`,
      variant: "open",
    };
  }
  if (nowMin < openMin) {
    return {
      text: lang === "es" ? `Cerrado · abre hoy a las ${to12h(openMin)}` : `Closed · opens today at ${to12h(openMin)}`,
      variant: "closed",
    };
  }
  const next = findNextOpenDay(rows, zoned.jsDay);
  if (next) {
    return {
      text: closedRelativePhrase(lang, next.dayOffset, next.dayLabel, to12h(next.openMinutes)),
      variant: "closed",
    };
  }
  return { text: lang === "es" ? "Cerrado hoy" : "Closed today", variant: "closed" };
}
