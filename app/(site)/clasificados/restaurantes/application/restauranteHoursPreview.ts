import type { ShellHoursStatus } from "../shell/restaurantDetailShellTypes";
import type {
  RestauranteDaySchedule,
  RestauranteSpecialHoursEntry,
  RestauranteWeeklyHours,
} from "./restauranteListingApplicationModel";

const DAY_KEYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"] as const;

/** Joins the real multi-entry special-hours list into one display line, e.g. "Navidad: Cerrado · Año Nuevo: 10am-2pm". */
export function formatSpecialHoursEntriesLine(entries: RestauranteSpecialHoursEntry[] | undefined): string | undefined {
  const rows = (entries ?? [])
    .map((e) => ({ label: e.label?.trim() ?? "", note: e.note?.trim() ?? "" }))
    .filter((e) => e.label || e.note);
  if (!rows.length) return undefined;
  return rows.map((e) => (e.label && e.note ? `${e.label}: ${e.note}` : e.label || e.note)).join(" · ");
}

function parseHm(s: string | undefined): number | null {
  if (!s || !/^\d{1,2}:\d{2}$/.test(s)) return null;
  const [h, m] = s.split(":").map(Number);
  if (h < 0 || h > 23 || m < 0 || m > 59) return null;
  return h * 60 + m;
}

function minutesNow(d: Date): number {
  return d.getHours() * 60 + d.getMinutes();
}

export function computeShellHoursPreview(
  hours: RestauranteWeeklyHours,
  now: Date = new Date(),
  lang: "es" | "en" = "es"
): { status: ShellHoursStatus; statusLine: string; scheduleSummary: string } {
  const en = lang === "en";
  if (hours.temporaryHoursActive && hours.temporaryHoursNote?.trim()) {
    return {
      status: "unknown",
      statusLine: hours.temporaryHoursNote.trim(),
      scheduleSummary:
        formatSpecialHoursEntriesLine(hours.specialHoursEntries) ||
        hours.specialHoursNote?.trim() ||
        (en ? "Temporary hours" : "Horario temporal"),
    };
  }

  const key = DAY_KEYS[now.getDay()];
  const today = hours[key] as RestauranteDaySchedule | undefined;
  if (!today || today.closed) {
    return {
      status: "closed",
      statusLine: en ? "Closed today" : "Cerrado hoy",
      scheduleSummary: buildWeekSummary(hours, lang),
    };
  }
  const openM = parseHm(today.openTime);
  const closeM = parseHm(today.closeTime);
  if (openM == null || closeM == null) {
    return {
      status: "unknown",
      statusLine: en ? "Today's hours to be confirmed" : "Horario hoy por confirmar",
      scheduleSummary: buildWeekSummary(hours, lang),
    };
  }
  const n = minutesNow(now);
  const open = openM;
  let close = closeM;
  if (close < open) close += 24 * 60;
  let nn = n;
  if (nn < open) nn += 24 * 60;
  const isOpen = nn >= open && nn < close;
  const closeLabel = today.closeTime ?? "";
  if (isOpen) {
    return {
      status: "open",
      statusLine: en ? `Open now · until ${fmt12(closeLabel)}` : `Abierto ahora · hasta las ${fmt12(closeLabel)}`,
      scheduleSummary: buildWeekSummary(hours, lang),
    };
  }
  if (n < openM) {
    return {
      status: "closed",
      statusLine: en ? `Opens today · ${fmt12(today.openTime ?? "")}` : `Abre hoy · ${fmt12(today.openTime ?? "")}`,
      scheduleSummary: buildWeekSummary(hours, lang),
    };
  }
  return {
    status: "closed",
    statusLine: en ? "Closed for today" : "Cerrado por hoy",
    scheduleSummary: buildWeekSummary(hours, lang),
  };
}

function fmt12(hm: string): string {
  const p = parseHm(hm);
  if (p == null) return hm;
  const h = Math.floor(p / 60) % 24;
  const m = p % 60;
  const am = h < 12;
  const h12 = h % 12 === 0 ? 12 : h % 12;
  const mm = m.toString().padStart(2, "0");
  return `${h12}:${mm} ${am ? "a.m." : "p.m."}`;
}

function buildWeekSummary(h: RestauranteWeeklyHours, lang: "es" | "en" = "es"): string {
  const en = lang === "en";
  const parts: string[] = [];
  const dayLabel: Record<(typeof DAY_KEYS)[number], string> = en
    ? {
        monday: "Mon",
        tuesday: "Tue",
        wednesday: "Wed",
        thursday: "Thu",
        friday: "Fri",
        saturday: "Sat",
        sunday: "Sun",
      }
    : {
        monday: "Lun",
        tuesday: "Mar",
        wednesday: "Mié",
        thursday: "Jue",
        friday: "Vie",
        saturday: "Sáb",
        sunday: "Dom",
      };
  for (const k of DAY_KEYS) {
    const s = h[k] as RestauranteDaySchedule;
    if (!s) continue;
    if (s.closed) parts.push(en ? `${dayLabel[k]}: closed` : `${dayLabel[k]}: cerrado`);
    else if (s.openTime && s.closeTime) parts.push(`${dayLabel[k]} · ${s.openTime}–${s.closeTime}`);
  }
  const specialLine = formatSpecialHoursEntriesLine(h.specialHoursEntries) || h.specialHoursNote?.trim();
  if (specialLine) return `${parts.slice(0, 3).join(" · ")}… (${specialLine})`;
  return parts.length ? parts.join(" · ") : en ? "Hours not provided" : "Horario no indicado";
}
