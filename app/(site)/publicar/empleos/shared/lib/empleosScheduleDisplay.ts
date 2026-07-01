/** Structured schedule rows + legacy free-text normalization for Empleos quick lane. */

import {
  compose24HourFrom12Parts,
  parse24HourTo12Parts,
  type AmPm,
} from "@/app/lib/clasificados/autos/autosDealerHoursTimeUi";

export type EmpleosScheduleRowInput = {
  day: string;
  dayCustom?: string;
  shift?: string;
  startTime?: string;
  endTime?: string;
  note?: string;
};

export type EmpleosScheduleRowDisplay = {
  dayLabel: string;
  timeLabel: string;
  note?: string;
  line: string;
};

export const EMPLEOS_DAY_BLOCK_OPTIONS_ES: readonly { value: string; label: string }[] = [
  { value: "", label: "Seleccionar…" },
  { value: "Lunes", label: "Lunes" },
  { value: "Martes", label: "Martes" },
  { value: "Miércoles", label: "Miércoles" },
  { value: "Jueves", label: "Jueves" },
  { value: "Viernes", label: "Viernes" },
  { value: "Sábado", label: "Sábado" },
  { value: "Domingo", label: "Domingo" },
  { value: "Lunes a Viernes", label: "Lunes a Viernes" },
  { value: "Lunes a Sábado", label: "Lunes a Sábado" },
  { value: "Fin de semana", label: "Fin de semana" },
  { value: "Flexible", label: "Flexible" },
  { value: "otro", label: "Otro" },
];

export const EMPLEOS_DAY_BLOCK_OPTIONS_EN: readonly { value: string; label: string }[] = [
  { value: "", label: "Select…" },
  { value: "Monday", label: "Monday" },
  { value: "Tuesday", label: "Tuesday" },
  { value: "Wednesday", label: "Wednesday" },
  { value: "Thursday", label: "Thursday" },
  { value: "Friday", label: "Friday" },
  { value: "Saturday", label: "Saturday" },
  { value: "Sunday", label: "Sunday" },
  { value: "Mon–Fri", label: "Mon–Fri" },
  { value: "Mon–Sat", label: "Mon–Sat" },
  { value: "Weekends", label: "Weekends" },
  { value: "Flexible", label: "Flexible" },
  { value: "otro", label: "Other" },
];

function st(v: unknown): string {
  return String(v ?? "").trim();
}

/** Format 24h HH:MM or legacy "8:00 AM" for display. */
export function formatScheduleTimeDisplay(raw: string): string {
  const s = st(raw);
  if (!s) return "";
  if (/am|pm/i.test(s)) return s;
  const m = /^(\d{1,2}):(\d{2})$/.exec(s);
  if (!m) return s;
  const parts = parse24HourTo12Parts(s, { hour: "9", minute: "00", ampm: "AM" });
  return `${parts.hour}:${parts.minute} ${parts.ampm}`;
}

export function formatScheduleTimeForStorage(hour: string, minute: string, ampm: AmPm): string {
  return formatScheduleTimeDisplay(compose24HourFrom12Parts(hour, minute, ampm));
}

function resolveDayLabel(row: EmpleosScheduleRowInput, lang: "es" | "en"): string {
  const day = st(row.day);
  if (!day) return "";
  if (day === "otro") return st(row.dayCustom) || (lang === "es" ? "Otro" : "Other");
  return day;
}

function rowHasContent(row: EmpleosScheduleRowInput): boolean {
  return Boolean(
    st(row.day) || st(row.dayCustom) || st(row.shift) || st(row.startTime) || st(row.endTime),
  );
}

function scheduleTbdLabel(lang: "es" | "en"): string {
  return lang === "es" ? "Horario por confirmar" : "Schedule TBD";
}

export function formatScheduleRowLine(row: EmpleosScheduleRowInput, lang: "es" | "en" = "es"): string {
  const dayLabel = resolveDayLabel(row, lang);
  const start = formatScheduleTimeDisplay(st(row.startTime));
  const end = formatScheduleTimeDisplay(st(row.endTime));
  const shift = st(row.shift);

  let timePart = "";
  if (start && end) timePart = `${start} – ${end}`;
  else if (start) timePart = start;
  else if (shift) timePart = shift;
  else if (dayLabel) timePart = scheduleTbdLabel(lang);

  if (dayLabel && timePart) return `${dayLabel} · ${timePart}`;
  return dayLabel || timePart;
}

export function joinScheduleRowsForPublish(rows: EmpleosScheduleRowInput[]): string {
  return rows.filter(rowHasContent).map((r) => formatScheduleRowLine(r)).join("\n");
}

export function normalizeScheduleRows(
  rows: EmpleosScheduleRowInput[] | undefined,
  legacySchedule?: string,
  lang: "es" | "en" = "es",
): EmpleosScheduleRowDisplay[] {
  const list = Array.isArray(rows) ? rows.filter(rowHasContent) : [];
  if (list.length) {
    return list.map((row) => {
      const dayLabel = resolveDayLabel(row, lang);
      const start = formatScheduleTimeDisplay(st(row.startTime));
      const end = formatScheduleTimeDisplay(st(row.endTime));
      const shift = st(row.shift);
      let timeLabel = "";
      if (start && end) timeLabel = `${start} – ${end}`;
      else if (start) timeLabel = start;
      else if (shift) timeLabel = shift;
      else if (dayLabel) timeLabel = scheduleTbdLabel(lang);
      const note = st(row.note) || undefined;
      return {
        dayLabel,
        timeLabel,
        note,
        line: formatScheduleRowLine(row, lang),
      };
    });
  }

  const legacy = st(legacySchedule);
  if (!legacy) return [];

  return legacy.split(/\n+/).map((line) => line.trim()).filter(Boolean).map((line) => ({
    dayLabel: "",
    timeLabel: "",
    line,
  }));
}

/** Compact summary for sidebar — first row, flexible, or "Ver horarios". */
export function scheduleSidebarSummary(
  rows: EmpleosScheduleRowInput[] | undefined,
  legacySchedule?: string,
  lang: "es" | "en" = "es",
): string {
  const normalized = normalizeScheduleRows(rows, legacySchedule, lang);
  if (!normalized.length) return "—";

  const flexible = normalized.find(
    (r) => r.dayLabel.toLowerCase() === "flexible" || r.line.toLowerCase().includes("flexible"),
  );
  if (flexible) return lang === "es" ? "Horario flexible" : "Flexible schedule";

  if (normalized.length === 1) return normalized[0]!.line;

  const first = normalized[0]!.line;
  if (normalized.length > 1) {
    const more = lang === "es" ? "Ver horarios" : "View schedule";
    return `${first} · ${more}`;
  }
  return first;
}

/** Full schedule block text for main content card. */
export function scheduleMainDisplay(
  rows: EmpleosScheduleRowInput[] | undefined,
  legacySchedule?: string,
  lang: "es" | "en" = "es",
): string {
  const normalized = normalizeScheduleRows(rows, legacySchedule, lang);
  if (!normalized.length) return "—";
  return normalized.map((r) => r.line).join("\n");
}
