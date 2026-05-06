import type { ServiciosHoursSummary, ServiciosLang } from "../types/serviciosBusinessProfile";

const DAY_TOKEN_TO_JS: Record<string, number> = {
  domingo: 0,
  sunday: 0,
  lunes: 1,
  monday: 1,
  martes: 2,
  tuesday: 2,
  miércoles: 3,
  miercoles: 3,
  wednesday: 3,
  jueves: 4,
  thursday: 4,
  viernes: 5,
  friday: 5,
  sábado: 6,
  sabado: 6,
  saturday: 6,
};

function normToken(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
}

/** Map weekday label to JS getDay(): 0 Sun .. 6 Sat */
export function serviciosHeroDayLabelToJsDay(dayLabel: string): number | null {
  const n = normToken(dayLabel);
  if (!n) return null;
  for (const [token, js] of Object.entries(DAY_TOKEN_TO_JS)) {
    if (n.includes(token) || token.includes(n)) {
      return js;
    }
  }
  return null;
}

function minutesFromMidnight(h: number, m: number): number {
  return ((h % 24) + 24) % 24 * 60 + ((m % 60) + 60) % 60;
}

/** Parse a single time token to minutes from midnight; supports 24h and 12h. */
function parseOneTime(raw: string): number | null {
  const s = raw.trim().toLowerCase().replace(/\./g, "");
  if (!s) return null;

  const m12 = s.match(/^(\d{1,2})(?::(\d{2}))?\s*([ap])?m?$/);
  if (m12) {
    let hh = parseInt(m12[1], 10);
    const mm = m12[2] ? parseInt(m12[2], 10) : 0;
    const ap = m12[3];
    if (ap === "p" && hh < 12) hh += 12;
    if (ap === "a" && hh === 12) hh = 0;
    if (!ap && hh >= 24) return null;
    if (hh > 23 || mm > 59) return null;
    return minutesFromMidnight(hh, mm);
  }

  const m24 = s.match(/^(\d{1,2}):(\d{2})$/);
  if (m24) {
    const hh = parseInt(m24[1], 10);
    const mm = parseInt(m24[2], 10);
    if (hh > 23 || mm > 59) return null;
    return minutesFromMidnight(hh, mm);
  }

  const m24h = s.match(/^(\d{1,2})$/);
  if (m24h) {
    const hh = parseInt(m24h[1], 10);
    if (hh > 23) return null;
    return minutesFromMidnight(hh, 0);
  }

  return null;
}

function splitRangeLine(line: string): [string, string] | null {
  const normalized = line.replace(/\u2013|\u2014/g, "-");
  const parts = normalized.split(/\s*(?:-|–|—|to|hasta|a)\s*/i).filter((p) => p.trim().length > 0);
  if (parts.length >= 2) {
    return [parts[0].trim(), parts[parts.length - 1].trim()];
  }
  return null;
}

export function parseTodayHoursRange(line: string | undefined): { startMin: number; endMin: number } | null {
  if (!line) return null;
  const pair = splitRangeLine(line);
  if (!pair) return null;
  const start = parseOneTime(pair[0]);
  const end = parseOneTime(pair[1]);
  if (start == null || end == null) return null;
  return { startMin: start, endMin: end };
}

function formatMinutes12h(mins: number): string {
  let h = Math.floor(mins / 60) % 24;
  const m = mins % 60;
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  const mm = m === 0 ? "00" : m.toString().padStart(2, "0");
  return `${h12}:${mm} ${ampm}`;
}

export function formatHoursRange12h(range: { startMin: number; endMin: number }): string {
  return `${formatMinutes12h(range.startMin)}–${formatMinutes12h(range.endMin)}`;
}

/** Best-effort: convert common 24h fragments inside a freeform line to 12h (hero readability). */
export function formatHoursLineDisplay12h(line: string): string {
  return line.replace(/\b(\d{1,2}):(\d{2})\b/g, (_, hh: string, mm: string) => {
    const h = parseInt(hh, 10);
    const m = parseInt(mm, 10);
    if (h > 23 || m > 59) return `${hh}:${mm}`;
    return formatMinutes12h(minutesFromMidnight(h, m));
  });
}

function lineLooksClosedAllDay(line: string): boolean {
  return /\b(cerrado|closed|libre|off)\b/i.test(line) && !/\d/.test(line);
}

function firstOpenTimeFromLine(line: string): number | null {
  if (lineLooksClosedAllDay(line)) return null;
  const pair = splitRangeLine(line);
  if (pair) {
    return parseOneTime(pair[0]);
  }
  return parseOneTime(line);
}

function findNextWeeklyOpen(
  weekly: { dayLabel: string; line: string }[],
  from: Date,
): { dayOffset: number; timeMin: number; dayLabel: string } | null {
  for (let offset = 1; offset <= 7; offset++) {
    const d = new Date(from.getFullYear(), from.getMonth(), from.getDate() + offset);
    const jsD = d.getDay();
    const row = weekly.find((r) => serviciosHeroDayLabelToJsDay(r.dayLabel) === jsD);
    if (!row) continue;
    const t = firstOpenTimeFromLine(row.line);
    if (t == null) continue;
    return { dayOffset: offset, timeMin: t, dayLabel: row.dayLabel };
  }
  return null;
}

function openLabelHintsOpen(s: string): boolean {
  const t = s.trim().toLowerCase();
  return /\babierto\s+ahora\b/.test(t) || /^open\s+now\b/.test(t) || t === "open now";
}

function labelHintsClosed(s: string): boolean {
  const t = s.trim().toLowerCase();
  return /^cerrado\b/.test(t) || /^closed\b/.test(t);
}

function labelIsVagueDayOnly(s: string): boolean {
  const t = s.trim().toLowerCase();
  return t === "hoy" || t === "today";
}

export type ServiciosHeroHoursPill = {
  text: string;
  variant: "open" | "closed" | "neutral";
};

function closedRelativePhrase(
  lang: ServiciosLang,
  dayOffset: number,
  dayLabel: string,
  timeStr: string,
): string {
  if (dayOffset <= 1) {
    return lang === "es" ? `Cerrado · abre mañana ${timeStr}` : `Closed · opens tomorrow ${timeStr}`;
  }
  if (lang === "es") {
    return `Cerrado · abre ${dayLabel.trim()} ${timeStr}`;
  }
  return `Closed · opens ${dayLabel.trim()} ${timeStr}`;
}

/**
 * Builds the premium hero status line (12h times, no bare "Hoy").
 * Uses today's hours + weekly rows + current local time when parseable.
 */
export function buildServiciosHeroHoursPill(
  hours: ServiciosHoursSummary | undefined,
  lang: ServiciosLang,
  now: Date = new Date(),
): ServiciosHeroHoursPill | null {
  if (!hours) return null;

  const openLbl = (hours.openNowLabel ?? "").trim();
  const todayLine = (hours.todayHoursLine ?? "").trim();
  const weekly = hours.weeklyRows ?? [];

  if (!openLbl && !todayLine && weekly.length === 0) return null;

  const range = parseTodayHoursRange(todayLine);
  const nowMin = now.getHours() * 60 + now.getMinutes();

  if (range) {
    const inWindow = nowMin >= range.startMin && nowMin <= range.endMin;
    if (inWindow) {
      const span = formatHoursRange12h(range);
      return {
        text: lang === "es" ? `Abierto ahora · ${span}` : `Open now · ${span}`,
        variant: "open",
      };
    }
    if (nowMin < range.startMin) {
      const tStr = formatMinutes12h(range.startMin);
      return {
        text: lang === "es" ? `Cerrado · abre hoy ${tStr}` : `Closed · opens today ${tStr}`,
        variant: "closed",
      };
    }
    const nw = weekly.length ? findNextWeeklyOpen(weekly, now) : null;
    const tStr = nw ? formatMinutes12h(nw.timeMin) : formatMinutes12h(range.startMin);
    if (nw) {
      return {
        text: closedRelativePhrase(lang, nw.dayOffset, nw.dayLabel, tStr),
        variant: "closed",
      };
    }
    return {
      text: lang === "es" ? `Cerrado · abre mañana ${tStr}` : `Closed · opens tomorrow ${tStr}`,
      variant: "closed",
    };
  }

  if (labelHintsClosed(openLbl)) {
    const nw = weekly.length ? findNextWeeklyOpen(weekly, now) : null;
    if (nw) {
      return {
        text: closedRelativePhrase(lang, nw.dayOffset, nw.dayLabel, formatMinutes12h(nw.timeMin)),
        variant: "closed",
      };
    }
    const fallback = todayLine ? formatHoursLineDisplay12h(todayLine) : "";
    return {
      text:
        lang === "es"
          ? fallback
            ? `Cerrado · ${fallback}`
            : "Cerrado"
          : fallback
            ? `Closed · ${fallback}`
            : "Closed",
      variant: "closed",
    };
  }

  if (openLabelHintsOpen(openLbl) && todayLine) {
    const parsed = parseTodayHoursRange(todayLine);
    const span = parsed ? formatHoursRange12h(parsed) : formatHoursLineDisplay12h(todayLine);
    return {
      text: lang === "es" ? `Abierto ahora · ${span}` : `Open now · ${span}`,
      variant: "open",
    };
  }

  if (labelIsVagueDayOnly(openLbl) && todayLine) {
    const pretty = formatHoursLineDisplay12h(todayLine);
    return {
      text: lang === "es" ? `Horario de hoy · ${pretty}` : `Today's hours · ${pretty}`,
      variant: "neutral",
    };
  }

  if (todayLine) {
    const pretty = formatHoursLineDisplay12h(todayLine);
    return {
      text: lang === "es" ? `Horario · ${pretty}` : `Hours · ${pretty}`,
      variant: "neutral",
    };
  }

  return null;
}
