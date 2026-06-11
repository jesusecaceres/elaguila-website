/** 24-hour "HH:MM" ↔ 12-hour select parts for dealer hours UX. */

export type AmPm = "AM" | "PM";

export type Time12Parts = {
  hour: string;
  minute: string;
  ampm: AmPm;
};

export const DEALER_HOUR_12_OPTIONS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"] as const;
export const DEALER_MINUTE_OPTIONS = ["00", "15", "30", "45"] as const;

export const DEALER_WEEKDAY_OPTIONS_ES = [
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
  "Domingo",
] as const;

export const DEALER_WEEKDAY_OPTIONS_EN = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

/** Parse stored 24h value; falls back to 9:00 AM / 5:00 PM for invalid input. */
export function parse24HourTo12Parts(value: string | undefined, fallback: Time12Parts): Time12Parts {
  const raw = (value ?? "").trim();
  const m = /^(\d{1,2}):(\d{2})$/.exec(raw);
  if (!m) return fallback;
  let h24 = parseInt(m[1]!, 10);
  const minute = m[2]!;
  if (!Number.isFinite(h24) || h24 < 0 || h24 > 23) return fallback;
  const ampm: AmPm = h24 >= 12 ? "PM" : "AM";
  let h12 = h24 % 12;
  if (h12 === 0) h12 = 12;
  return { hour: String(h12), minute, ampm };
}

export function compose24HourFrom12Parts(hour: string, minute: string, ampm: AmPm): string {
  let h = parseInt(hour, 10);
  const m = minute.padStart(2, "0").slice(0, 2);
  if (!Number.isFinite(h) || h < 1 || h > 12) h = 9;
  let h24 = h % 12;
  if (ampm === "PM") h24 += 12;
  return `${pad2(h24)}:${m}`;
}

export function dealerWeekdayOptions(lang: "es" | "en"): readonly string[] {
  return lang === "es" ? DEALER_WEEKDAY_OPTIONS_ES : DEALER_WEEKDAY_OPTIONS_EN;
}
