import type { DayHoursRow, DayKey } from "@/app/clasificados/publicar/servicios/lib/clasificadosServiciosApplicationTypes";
import { WEEK_DAY_LABELS } from "@/app/clasificados/publicar/servicios/lib/defaultClasificadosServiciosState";

/** Fixed Mon–Sun order (aligned with Servicios). */
export const COMMUNITY_WEEK_ORDER: readonly DayKey[] = [
  "mon",
  "tue",
  "wed",
  "thu",
  "fri",
  "sat",
  "sun",
] as const;

export type CommunityScheduleRowLegacy = { day: string; time: string };

export function emptyCommunityWeeklySchedule(): DayHoursRow[] {
  return COMMUNITY_WEEK_ORDER.map((day) => ({ day, closed: true, open: "", close: "" }));
}

function coerceDayRow(raw: unknown, day: DayKey): DayHoursRow {
  if (!raw || typeof raw !== "object") return { day, closed: true, open: "", close: "" };
  const r = raw as Partial<DayHoursRow>;
  const open = String(r.open ?? "").trim();
  const close = String(r.close ?? "").trim();
  /** Missing `closed` in stored JSON must not become “active” with empty times (would block preview). */
  const closed =
    typeof r.closed === "boolean" ? r.closed : !(open || close);
  return { day, closed, open, close };
}

const DAY_NAME_TO_KEY: Record<string, DayKey> = {
  lunes: "mon",
  monday: "mon",
  martes: "tue",
  tuesday: "tue",
  miércoles: "wed",
  miercoles: "wed",
  wednesday: "wed",
  jueves: "thu",
  thursday: "thu",
  viernes: "fri",
  friday: "fri",
  sábado: "sat",
  sabado: "sat",
  saturday: "sat",
  domingo: "sun",
  sunday: "sun",
};

function legacyKeyFromLabel(s: string): DayKey | null {
  const k = s.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  return DAY_NAME_TO_KEY[k] ?? null;
}

/** Best-effort: map old Clases freeform rows onto weekday keys (first match per day wins). */
export function migrateLegacyScheduleRowsToWeekly(rows: CommunityScheduleRowLegacy[]): DayHoursRow[] {
  const base = emptyCommunityWeeklySchedule();
  const byDay = new Map<DayKey, { open: string; close: string }>();
  for (const r of rows) {
    const label = String(r.day ?? "").trim();
    const time = String(r.time ?? "").trim();
    if (!label || !time) continue;
    const key = legacyKeyFromLabel(label);
    if (!key) continue;
    const parts = time.split(/\s*[–—-]\s*/u).map((x) => x.trim());
    let open = "";
    let close = "";
    if (parts.length >= 2) {
      open = normalizeLegacyTime(parts[0]!);
      close = normalizeLegacyTime(parts[1]!);
    } else {
      open = normalizeLegacyTime(parts[0]!);
      close = "";
    }
    if (!byDay.has(key)) byDay.set(key, { open, close });
  }
  return base.map((row) => {
    const hit = byDay.get(row.day);
    if (!hit || (!hit.open && !hit.close)) return row;
    return {
      day: row.day,
      closed: false,
      open: hit.open || "09:00",
      close: hit.close || hit.open || "17:00",
    };
  });
}

function normalizeLegacyTime(s: string): string {
  const t = s.trim();
  const m24 = /^(\d{1,2}):(\d{2})$/.exec(t);
  if (m24) {
    const h = Math.min(23, Math.max(0, parseInt(m24[1]!, 10)));
    const min = Math.min(59, Math.max(0, parseInt(m24[2]!, 10)));
    return `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
  }
  return "";
}

export function normalizeWeeklyScheduleArray(
  raw: unknown,
  legacyRows?: CommunityScheduleRowLegacy[]
): DayHoursRow[] {
  if (Array.isArray(raw) && raw.length === 7) {
    return COMMUNITY_WEEK_ORDER.map((day, i) => coerceDayRow(raw[i], day));
  }
  if (legacyRows?.length) {
    return migrateLegacyScheduleRowsToWeekly(legacyRows);
  }
  return emptyCommunityWeeklySchedule();
}

/** Minutes from midnight for HH:MM (24h). */
export function timeToMinutes(t: string): number | null {
  const s = String(t ?? "").trim();
  const m = /^(\d{1,2}):(\d{2})$/.exec(s);
  if (!m) return null;
  const h = parseInt(m[1]!, 10);
  const min = parseInt(m[2]!, 10);
  if (h > 23 || min > 59) return null;
  return h * 60 + min;
}

export function isActiveDayValid(row: DayHoursRow): boolean {
  if (row.closed) return true;
  if (!row.open || !row.close) return false;
  const a = timeToMinutes(row.open);
  const b = timeToMinutes(row.close);
  if (a === null || b === null) return false;
  return a < b;
}

export function isWeeklyScheduleSatisfied(rows: DayHoursRow[]): boolean {
  let anyActive = false;
  for (const r of rows) {
    if (r.closed) continue;
    anyActive = true;
    const open = String(r.open ?? "").trim();
    const close = String(r.close ?? "").trim();
    if (!open || !close) return false;
    if (!isActiveDayValid({ ...r, open, close })) return false;
  }
  return anyActive;
}

export function formatTimeForDisplay(time: string, lang: "es" | "en"): string {
  const s = String(time ?? "").trim();
  if (!s) return "";
  const m = /^(\d{1,2}):(\d{2})$/.exec(s);
  if (!m) return s;
  const d = new Date(1970, 0, 1, parseInt(m[1]!, 10), parseInt(m[2]!, 10), 0, 0);
  if (Number.isNaN(d.getTime())) return s;
  return d.toLocaleTimeString(lang === "en" ? "en-US" : "es-MX", {
    hour: "numeric",
    minute: "2-digit",
  });
}

/** One line per active weekday for cards / previews. */
export function formatWeeklyScheduleLines(rows: DayHoursRow[], lang: "es" | "en"): string[] {
  const lines: string[] = [];
  for (const day of COMMUNITY_WEEK_ORDER) {
    const row = rows.find((r) => r.day === day);
    if (!row || row.closed) continue;
    if (!row.open.trim() || !row.close.trim()) continue;
    const label = WEEK_DAY_LABELS[day][lang];
    lines.push(
      `${label}: ${formatTimeForDisplay(row.open, lang)} – ${formatTimeForDisplay(row.close, lang)}`
    );
  }
  return lines;
}

export type WeeklyScheduleGridItem = {
  dayKey: DayKey;
  dayLabel: string;
  timeRange: string;
};

/** Active weekdays only, for aligned two-column schedule UI. */
export function getActiveWeeklyScheduleGridItems(rows: DayHoursRow[], lang: "es" | "en"): WeeklyScheduleGridItem[] {
  const out: WeeklyScheduleGridItem[] = [];
  for (const day of COMMUNITY_WEEK_ORDER) {
    const row = rows.find((r) => r.day === day);
    if (!row || row.closed) continue;
    const open = row.open.trim();
    const close = row.close.trim();
    if (!open || !close) continue;
    out.push({
      dayKey: day,
      dayLabel: WEEK_DAY_LABELS[day][lang],
      timeRange: `${formatTimeForDisplay(open, lang)} – ${formatTimeForDisplay(close, lang)}`,
    });
  }
  return out;
}

const MON_FRI: readonly DayKey[] = ["mon", "tue", "wed", "thu", "fri"];

/** Group identical time ranges (e.g. Lunes a Domingo · 6:00 a.m. – 8:00 p.m.). */
export function getGroupedWeeklyScheduleGridItems(rows: DayHoursRow[], lang: "es" | "en"): WeeklyScheduleGridItem[] {
  const items = getActiveWeeklyScheduleGridItems(rows, lang);
  if (items.length <= 1) return items;

  const byTime = new Map<string, WeeklyScheduleGridItem[]>();
  for (const it of items) {
    const list = byTime.get(it.timeRange) ?? [];
    list.push(it);
    byTime.set(it.timeRange, list);
  }

  const grouped: WeeklyScheduleGridItem[] = [];
  for (const [timeRange, group] of byTime) {
    const keys = group.map((g) => g.dayKey);
    if (keys.length === 7) {
      grouped.push({
        dayKey: "mon",
        dayLabel: lang === "es" ? "Lunes a Domingo" : "Monday to Sunday",
        timeRange,
      });
      continue;
    }
    const hasMonFri = MON_FRI.every((k) => keys.includes(k));
    if (hasMonFri && keys.length === 5) {
      grouped.push({
        dayKey: "mon",
        dayLabel: lang === "es" ? "Lunes a Viernes" : "Monday to Friday",
        timeRange,
      });
      continue;
    }
    grouped.push(...group);
  }

  return grouped.sort(
    (a, b) => COMMUNITY_WEEK_ORDER.indexOf(a.dayKey) - COMMUNITY_WEEK_ORDER.indexOf(b.dayKey),
  );
}
