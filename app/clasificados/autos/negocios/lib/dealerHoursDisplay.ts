import type { DealerHoursEntry } from "../types/autoDealerListing";

/** Strict 24h HH:mm (single or double digit hour, two-digit minute). */
const TIME24 = /^([01]?\d|2[0-3]):([0-5]\d)$/;

function parseHHMM(s: string): { h: number; m: number } | null {
  const t = s.trim();
  const m = t.match(TIME24);
  if (!m) return null;
  const h = parseInt(m[1]!, 10);
  const min = parseInt(m[2]!, 10);
  if (!Number.isFinite(h) || h < 0 || h > 23 || min < 0 || min > 59) return null;
  return { h, m: min };
}

function to12hLabel(h: number, m: number): string {
  const ampm = h >= 12 ? "PM" : "AM";
  let h12 = h % 12;
  if (h12 === 0) h12 = 12;
  const mm = String(m).padStart(2, "0");
  return `${h12}:${mm} ${ampm}`;
}

export function filterDealerHoursForDisplay(hours: DealerHoursEntry[] | undefined): DealerHoursEntry[] {
  const list = hours ?? [];
  return list.filter((row) => {
    const day = row.day?.trim();
    if (!day) return false;
    if (row.closed) return true;
    const o = parseHHMM(row.open ?? "");
    const c = parseHHMM(row.close ?? "");
    return Boolean(o && c);
  });
}

/**
 * Premium display: `9:00 AM – 6:00 PM` or `Cerrado`.
 * Rows with malformed times are filtered out before this runs.
 */
export function formatDealerHoursTimeRange(h: DealerHoursEntry): string {
  if (h.closed) return "Cerrado";
  const o = parseHHMM(h.open ?? "");
  const c = parseHHMM(h.close ?? "");
  if (!o || !c) return "—";
  return `${to12hLabel(o.h, o.m)} – ${to12hLabel(c.h, c.m)}`;
}
