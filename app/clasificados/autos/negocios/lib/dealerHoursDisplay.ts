import type { DealerHoursEntry } from "../types/autoDealerListing";

export function filterDealerHoursForDisplay(hours: DealerHoursEntry[] | undefined): DealerHoursEntry[] {
  const list = hours ?? [];
  return list.filter((row) => {
    const day = row.day?.trim();
    if (!day) return false;
    if (row.closed) return true;
    return Boolean(row.open?.trim() || row.close?.trim());
  });
}

function parseTimeTo12h(input: string): string {
  const t = input.trim();
  if (!t) return "";
  const m = t.match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return t;
  let h = parseInt(m[1], 10);
  const min = m[2];
  if (!Number.isFinite(h) || h < 0 || h > 23) return t;
  const ampm = h >= 12 ? "PM" : "AM";
  let h12 = h % 12;
  if (h12 === 0) h12 = 12;
  return `${h12}:${min} ${ampm}`;
}

/** Time span for open days — e.g. `10:00 AM – 8:00 PM` */
export function formatDealerHoursTimeRange(h: DealerHoursEntry): string {
  if (h.closed) return "Cerrado";
  const o = parseTimeTo12h(h.open);
  const c = parseTimeTo12h(h.close);
  if (!o && !c) return "—";
  return `${o} – ${c}`;
}
